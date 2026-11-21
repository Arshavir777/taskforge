package dto

import (
	"time"

	"gorm.io/datatypes"
)

type RegisterRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=8,max=72"` // 72 = bcrypt input limit
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type LoginResponse struct {
	Token     string    `json:"token"`
	TokenType string    `json:"token_type"`
	ExpiresAt time.Time `json:"expires_at"`
}

type CreateJobRequest struct {
	UserID  uint           `form:"userId" json:"userId" binding:"required"`
	Type    string         `form:"type" json:"type" binding:"required"`
	Payload datatypes.JSON `form:"payload" json:"payload" binding:"required"`
}
