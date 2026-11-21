package service

import (
	"context"

	"taskforge/internal/model"
	"taskforge/internal/repository"
)

type UserService struct {
	repo *repository.UserRepository
}

func NewUserService(repo *repository.UserRepository) *UserService {
	return &UserService{repo: repo}
}

func (s *UserService) GetAllUsers(ctx context.Context) ([]model.User, error) {
	return s.repo.GetUsers(ctx)
}

// GetByID returns domain.ErrNotFound when the user does not exist.
func (s *UserService) GetByID(ctx context.Context, id uint) (*model.User, error) {
	return s.repo.FindByID(ctx, id)
}
