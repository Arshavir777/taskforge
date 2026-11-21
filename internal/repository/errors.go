package repository

import (
	"errors"
	"fmt"

	"taskforge/internal/domain"

	"gorm.io/gorm"
)

// translateErr maps GORM errors to domain errors so callers stay storage-agnostic.
// Requires gorm.Config{TranslateError: true} for duplicate-key detection.
func translateErr(err error) error {
	switch {
	case err == nil:
		return nil
	case errors.Is(err, gorm.ErrRecordNotFound):
		return domain.ErrNotFound
	case errors.Is(err, gorm.ErrDuplicatedKey):
		return fmt.Errorf("%w: %v", domain.ErrConflict, err)
	default:
		return err
	}
}
