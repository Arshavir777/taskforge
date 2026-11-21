package main

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"taskforge/internal/auth"
	"taskforge/internal/config"
	"taskforge/internal/database"
	"taskforge/internal/handler"
	"taskforge/internal/middleware"
	"taskforge/internal/model"
	"taskforge/internal/repository"
	"taskforge/internal/response"
	"taskforge/internal/service"
	"time"

	"github.com/gin-gonic/gin"
)

func main() {

	cnf, err := config.Load()
	if err != nil {
		slog.Error("Failed to load config", "error", err)
		os.Exit(1)
	}
	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	// gin disable debug mode
	if cnf.Environment != string(config.Development) {
		gin.SetMode(gin.ReleaseMode)
	}

	// Init Database connection
	db, err := database.InitDB()
	if err != nil {
		slog.Error("Failed to init DB", "error", err)
		os.Exit(1)
	}

	tokenManager := auth.NewTokenManager(cnf.JWTSecret, cnf.JWTTTL)

	// User
	userRepo := repository.NewUserRepository(db)
	userService := service.NewUserService(userRepo)
	userHandler := handler.NewUserHandler(userService)

	// Auth
	authService := service.NewAuthService(userRepo, tokenManager)
	authHandler := handler.NewAuthHandler(authService)

	// Job
	jobRepo := repository.NewJobRepository(db)
	jobService := service.NewJobService(jobRepo)
	jobHandler := handler.NewJobHandler(jobService)

	// Worker pool
	workerPool := service.NewWorkerPool(jobRepo, service.WorkerPoolOptions{
		Workers:      cnf.WorkerCount,
		PollInterval: cnf.WorkerPollInterval,
	})
	workerPool.Register("noop", service.NoopJob)

	// Run auto migrations
	if err := db.AutoMigrate(&model.User{}, &model.Job{}); err != nil {
		slog.Error("Database auto-migration failed", "error", err)
		os.Exit(1)
	}

	// Starts after migrations so the jobs table exists. Stops claiming when ctx is cancelled.
	workerPool.Start(ctx)

	router := gin.Default()

	publicApi := router.Group("/api")
	{
		publicApi.GET("/users", userHandler.GetUsers)
		publicApi.GET("/jobs", jobHandler.GetAllJobs)
		publicApi.POST("/jobs", jobHandler.CreateJob)
		publicApi.POST("/auth/register", authHandler.Register)
		publicApi.POST("/auth/login", authHandler.Login)
	}

	privateApi := router.Group("/api", middleware.RequireAuth(tokenManager))
	{
		privateApi.GET("/me", userHandler.Me)
	}

	router.GET("", func(c *gin.Context) {
		response.OK(c, "Welcome GIN-GONIC")
	})
	router.GET("/ping", func(c *gin.Context) {
		response.OK(c, gin.H{
			"message": "pong",
		})
	})

	srv := &http.Server{
		Addr:              ":" + cnf.ServerPort,
		Handler:           router,
		ReadHeaderTimeout: 10 * time.Second,
	}

	go func() {
		slog.Info("HTTP server listening", "addr", srv.Addr)
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			slog.Error("HTTP server failed", "error", err)
			stop()
		}
	}()

	// Graceful shutdown
	<-ctx.Done()
	stop() // a second Ctrl+C now kills the process immediately
	slog.Info("Shutting down...")

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := srv.Shutdown(shutdownCtx); err != nil {
		slog.Error("HTTP server shutdown", "error", err)
	}
	if err := workerPool.Shutdown(shutdownCtx); err != nil {
		slog.Error("Worker pool shutdown", "error", err)
	}
	if sqlDB, err := db.DB(); err == nil {
		sqlDB.Close()
	}

	slog.Info("TaskForge Engine exited cleanly. Goodbye! 👋")
}
