package service

import (
	"context"

	"taskforge/internal/dto"
	"taskforge/internal/model"
	"taskforge/internal/repository"
)

type JobService struct {
	repo *repository.JobRepository
}

func NewJobService(repo *repository.JobRepository) *JobService {
	return &JobService{repo: repo}
}

func (s *JobService) Create(ctx context.Context, jobDto dto.CreateJobRequest) (model.Job, error) {
	return s.repo.Create(ctx, jobDto)
}

func (s *JobService) GetAllJobs(ctx context.Context) ([]model.Job, error) {
	return s.repo.GetAllJobs(ctx)
}
