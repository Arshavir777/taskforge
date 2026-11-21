package logger

import (
	"log/slog"
	"os"
)

func InitLogger() *slog.Logger {
	jsonHandler := slog.NewJSONHandler(os.Stdout, nil)
	return slog.New(jsonHandler)
}
