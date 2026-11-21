package service

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"taskforge/internal/model"
)

type noopPayload struct {
	DurationMS int `json:"duration_ms"`
}

// NoopJob sleeps for payload.duration_ms (default 1000) and returns how long it slept.
// Useful for testing the worker pool and load testing.
func NoopJob(ctx context.Context, job model.Job) (any, error) {
	p := noopPayload{DurationMS: 1000}
	if len(job.Payload) > 0 {
		if err := json.Unmarshal(job.Payload, &p); err != nil {
			return nil, fmt.Errorf("invalid payload: %w", err)
		}
	}

	d := time.Duration(p.DurationMS) * time.Millisecond
	select {
	case <-time.After(d):
		return map[string]any{"slept_ms": p.DurationMS}, nil
	case <-ctx.Done():
		return nil, ctx.Err()
	}
}
