package database

import (
	"fmt"
	"log/slog"
	"taskforge/internal/config"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func InitDB() (*gorm.DB, error) {

	cnf, err := config.Load()

	db, err := gorm.Open(postgres.Open(cnf.DatabaseURL), &gorm.Config{})
	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}

	slog.Info("Successfully established connection pool to PostgreSQL")
	return db, nil
}
