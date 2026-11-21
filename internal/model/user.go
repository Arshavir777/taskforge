package model

import (
	"time"
)

type UserTier string

const (
	TierFree       UserTier = "free"
	TierPro        UserTier = "pro"
	TierEnterprise UserTier = "enterprise"
)

type User struct {
	ID           uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	Email        string    `gorm:"type:varchar(255);unique;not null;index:idx_user_email" json:"email"`
	ApiKey       string    `gorm:"type:varchar(64);unique;not null;index:idx_user_apikey" json:"api_key"` // Used for Auth middleware
	PasswordHash string    `gorm:"type:varchar(255);not null;default:''" json:"-"`                        // bcrypt hash, never serialized
	Tier         UserTier  `gorm:"type:varchar(20);not null;default:'free'" json:"tier"`
	CreatedAt    time.Time `gorm:"not null" json:"created_at"`
	UpdatedAt    time.Time `gorm:"not null" json:"updated_at"`

	// Relational mapping: One user has many jobs
	Jobs []Job `gorm:"foreignKey:UserID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"jobs,omitempty"`
}

func (User) TableName() string {
	return "users"
}
