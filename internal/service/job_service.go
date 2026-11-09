package service

import (
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

func (s *JobService) Create(jobDto dto.CreateJobRequest) (model.Job, error) {
	return s.repo.Create(jobDto)
}

func (s *JobService) GetAllJobs() []model.Job {
	return s.repo.GetAllJobs()
}
