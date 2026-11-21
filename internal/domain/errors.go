// Package domain holds errors shared across layers, so services and handlers
// never depend on storage details (e.g. GORM sentinels).
package domain

import "errors"

var (
	// ErrNotFound is returned when a requested entity does not exist.
	ErrNotFound = errors.New("not found")
	// ErrConflict is returned when a write violates a uniqueness constraint.
	ErrConflict = errors.New("conflict")
)
