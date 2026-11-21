package config

import (
	"fmt"
	"os"
	"strconv"
	"time"
)

type Environment string

const (
	Development Environment = "development"
	Production  Environment = "production"
)

// devJWTSecret is used only when APP_ENV=development and JWT_SECRET is unset.
const devJWTSecret = "dev-insecure-jwt-secret-change-me"

type Config struct {
	Environment string
	DatabaseURL string
	ServerPort  string
	JWTSecret   string
	JWTTTL      time.Duration

	WorkerCount        int
	WorkerPollInterval time.Duration
}

func Load() (*Config, error) {
	env := getEnv("APP_ENV", "development")
	port := getEnv("PORT", "8080")

	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		// Example fallback logic based on environment
		dbURL = "host=0.0.0.0 user=postgres password=postgres dbname=taskforge port=45432 sslmode=disable"
	}

	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" && env == string(Development) {
		jwtSecret = devJWTSecret
	}

	jwtTTL, err := time.ParseDuration(getEnv("JWT_TTL", "24h"))
	if err != nil {
		return nil, fmt.Errorf("invalid JWT_TTL: %w", err)
	}

	workerCount, err := strconv.Atoi(getEnv("WORKER_COUNT", "4"))
	if err != nil {
		return nil, fmt.Errorf("invalid WORKER_COUNT: %w", err)
	}

	pollInterval, err := time.ParseDuration(getEnv("WORKER_POLL_INTERVAL", "1s"))
	if err != nil {
		return nil, fmt.Errorf("invalid WORKER_POLL_INTERVAL: %w", err)
	}

	cfg := &Config{
		Environment: env,
		DatabaseURL: dbURL,
		ServerPort:  port,
		JWTSecret:   jwtSecret,
		JWTTTL:      jwtTTL,

		WorkerCount:        workerCount,
		WorkerPollInterval: pollInterval,
	}

	if err := cfg.Validate(); err != nil {
		return nil, fmt.Errorf("invalid configuration: %w", err)
	}

	return cfg, nil
}

func (c *Config) Validate() error {
	if c.DatabaseURL == "" {
		return fmt.Errorf("DATABASE_URL is required")
	}
	if c.JWTSecret == "" {
		return fmt.Errorf("JWT_SECRET is required outside development")
	}
	if c.JWTTTL <= 0 {
		return fmt.Errorf("JWT_TTL must be positive")
	}
	if c.WorkerCount < 0 {
		return fmt.Errorf("WORKER_COUNT must be >= 0")
	}
	if c.WorkerPollInterval <= 0 {
		return fmt.Errorf("WORKER_POLL_INTERVAL must be positive")
	}
	return nil
}

func getEnv(key, fallback string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return fallback
}
