package main

import (
	"log/slog"
	"os"
	"taskforge/internal/config"
	"taskforge/internal/database"
	"taskforge/internal/handler"
	"taskforge/internal/model"
	"taskforge/internal/repository"
	"taskforge/internal/response"
	"taskforge/internal/service"

	"github.com/gin-gonic/gin"
)

func main() {

	cnf, _ := config.Load()
	// ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	// defer stop()

	// gin disable debug mode
	if cnf.Environment != string(config.Development) {
		gin.SetMode(gin.ReleaseMode)
	}

	// Init Database connection
	db, err := database.InitDB()
	if err != nil {
		slog.Error("Failed to init DB")
		os.Exit(1)
	}

	// User
	userRepo := repository.NewUserRepository(db)
	userService := service.NewUserService(userRepo)
	userHandler := handler.NewUserHandler(userService)

	// Job
	jobRepo := repository.NewJobRepository(db)
	jobService := service.NewJobService(jobRepo)
	jobHandler := handler.NewJobHandler(jobService)

	// Run auto migrations
	if err := db.AutoMigrate(&model.User{}, &model.Job{}); err != nil {
		slog.Error("Database auto-migration failed", "error", err)
		os.Exit(1)
	}

	router := gin.Default()

	publicApi := router.Group("/api")
	{
		publicApi.GET("/users", userHandler.GetUsers)
		publicApi.GET("/jobs", jobHandler.GetAllJobs)
		publicApi.POST("/jobs", jobHandler.CreateJob)
	}

	router.GET("", func(c *gin.Context) {
		response.OK(c, "Welcome GIN-GONIC")
	})
	router.GET("/ping", func(c *gin.Context) {
		response.OK(c, gin.H{
			"message": "pong",
		})
	})

	// listens on 0.0.0.0:8080 by default
	router.Run()

	// Graceful shutdown
	// <-ctx.Done()
	// sqlDB, err := db.DB()
	// if err == nil {
	// 	sqlDB.Close()
	// }

	// slog.Info("TaskForge Engine exited cleanly. Goodbye! 👋")
	// stop()
}
