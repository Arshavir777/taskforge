package model

import (
	"time"

	"gorm.io/datatypes"
)

type JobStatus string

const (
	StatusPending    JobStatus = "pending"
	StatusProcessing JobStatus = "processing"
	StatusCompleted  JobStatus = "completed"
	StatusFailed     JobStatus = "failed"
)

type Job struct {
	ID          uint           `gorm:"primaryKey;autoIncrement" json:"id"`
	UserID      uint           `gorm:"not null;index:idx_user_jobs" json:"user_id"`
	Type        string         `gorm:"type:varchar(50);not null;index:idx_job_type" json:"type"` // e.g., video_transcode, csv_import
	Status      JobStatus      `gorm:"type:varchar(20);not null;default:'pending';index:idx_status_created" json:"status"`
	Payload     datatypes.JSON `gorm:"type:jsonb;not null" json:"payload"`              // Flexible dynamic inputs
	Result      datatypes.JSON `gorm:"type:jsonb;default:null" json:"result,omitempty"` // Execution output or error trace
	Attempts    int            `gorm:"not null;default:0" json:"attempts"`
	CreatedAt   time.Time      `gorm:"not null;index:idx_status_created,sort:desc" json:"created_at"`
	UpdatedAt   time.Time      `gorm:"not null" json:"updated_at"`
	CompletedAt *time.Time     `gorm:"default:null" json:"completed_at,omitempty"` // Nullable until completed

	// Relationship mapping (Optional if you have a User model)
	// User User `gorm:"foreignKey:UserID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"-"`
}
