package repository

import (
	"context"
	"time"

	"taskforge/internal/domain"
	"taskforge/internal/dto"
	"taskforge/internal/model"

	"gorm.io/datatypes"
	"gorm.io/gorm"
)

type JobRepository struct {
	db *gorm.DB
}

func NewJobRepository(db *gorm.DB) *JobRepository {
	return &JobRepository{db: db}
}

func (repo *JobRepository) Create(ctx context.Context, jobDto dto.CreateJobRequest) (model.Job, error) {
	job := model.Job{
		UserID:  jobDto.UserID,
		Type:    jobDto.Type,
		Payload: jobDto.Payload,
	}

	if err := repo.db.WithContext(ctx).Create(&job).Error; err != nil {
		return model.Job{}, translateErr(err)
	}
	return job, nil
}

func (repo *JobRepository) GetAllJobs(ctx context.Context) ([]model.Job, error) {
	var jobs []model.Job
	if err := repo.db.WithContext(ctx).Find(&jobs).Error; err != nil {
		return nil, translateErr(err)
	}
	return jobs, nil
}

// ClaimNext atomically takes the oldest pending job and marks it as processing.
// FOR UPDATE SKIP LOCKED lets many workers (and server instances) claim in
// parallel without ever getting the same job. Returns domain.ErrNotFound when
// the queue is empty.
func (repo *JobRepository) ClaimNext(ctx context.Context) (model.Job, error) {
	var job model.Job
	res := repo.db.WithContext(ctx).Raw(`
		UPDATE jobs
		SET status = ?, attempts = attempts + 1, started_at = now(), updated_at = now()
		WHERE id = (
			SELECT id FROM jobs
			WHERE status = ?
			ORDER BY created_at, id
			FOR UPDATE SKIP LOCKED
			LIMIT 1
		)
		RETURNING *`,
		model.StatusProcessing, model.StatusPending,
	).Scan(&job)
	if res.Error != nil {
		return model.Job{}, translateErr(res.Error)
	}
	if res.RowsAffected == 0 {
		return model.Job{}, domain.ErrNotFound
	}
	return job, nil
}

// Complete marks a processing job as completed and stores its result.
func (repo *JobRepository) Complete(ctx context.Context, id uint, result datatypes.JSON) error {
	return repo.finish(ctx, id, model.StatusCompleted, result)
}

// Fail marks a processing job as failed and stores the error as its result.
func (repo *JobRepository) Fail(ctx context.Context, id uint, result datatypes.JSON) error {
	return repo.finish(ctx, id, model.StatusFailed, result)
}

func (repo *JobRepository) finish(ctx context.Context, id uint, status model.JobStatus, result datatypes.JSON) error {
	res := repo.db.WithContext(ctx).
		Model(&model.Job{}).
		Where("id = ? AND status = ?", id, model.StatusProcessing).
		Updates(map[string]any{
			"status":       status,
			"result":       result,
			"completed_at": time.Now(),
		})
	if res.Error != nil {
		return translateErr(res.Error)
	}
	if res.RowsAffected == 0 {
		return domain.ErrNotFound
	}
	return nil
}
