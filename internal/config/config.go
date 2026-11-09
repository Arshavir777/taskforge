package config

import (
	"fmt"
	"os"
)

type Environment string

const (
	Development Environment = "development"
	Production  Environment = "production"
)

type Config struct {
	Environment string
	DatabaseURL string
	ServerPort  string
}

func Load() (*Config, error) {
	env := getEnv("APP_ENV", "development")
	port := getEnv("PORT", "8080")

	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		// Example fallback logic based on environment
		dbURL = "host=0.0.0.0 user=postgres password=postgres dbname=taskforge port=45432 sslmode=disable"
	}

	cfg := &Config{
		Environment: env,
		DatabaseURL: dbURL,
		ServerPort:  port,
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
	return nil
}

func getEnv(key, fallback string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return fallback
}
