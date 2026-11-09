package repository

import (
	"taskforge/internal/dto"
	"taskforge/internal/model"

	"gorm.io/gorm"
)

type JobRepository struct {
	db *gorm.DB
}

func NewJobRepository(db *gorm.DB) *JobRepository {
	return &JobRepository{db: db}
}

// Type        string         `gorm:"type:varchar(50);not null;index:idx_job_type" json:"type"` // e.g., video_transcode, csv_import
// Status      JobStatus      `gorm:"type:varchar(20);not null;default:'pending';index:idx_status_created" json:"status"`
// Payload     datatypes.JSON `gorm:"type:jsonb;not null" json:"payload"`              // Flexible dynamic inputs
// Result      datatypes.JSON `gorm:"type:jsonb;default:null" json:"result,omitempty"` // Execution output or error trace
// Attempts    int            `gorm:"not null;default:0" json:"attempts"`
// CreatedAt   time.Time      `gorm:"not null;index:idx_status_created,sort:desc" json:"created_at"`
// UpdatedAt   time.Time      `gorm:"not null" json:"updated_at"`
// CompletedAt *time.Time     `gorm:"default:null" json:"completed_at,omitempty"` // Nullable until completed

func (repo *JobRepository) Create(jobDto dto.CreateJobRequest) (model.Job, error) {
	job := model.Job{
		UserID:  jobDto.UserID,
		Type:    jobDto.Type,
		Payload: jobDto.Payload,
	}

	repo.db.Create(&job)
	return job, nil
}

func (repo *JobRepository) GetAllJobs() ([]model.Job) {
	var jobs []model.Job

	repo.db.Find(&jobs)
	return jobs
}
