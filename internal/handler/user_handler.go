package handler

import (
	"errors"
	"log/slog"
	"net/http"
	"taskforge/internal/domain"
	"taskforge/internal/middleware"
	"taskforge/internal/response"
	"taskforge/internal/service"

	"github.com/gin-gonic/gin"
)

// UserHandler handles HTTP requests for user resources.
type UserHandler struct {
	service *service.UserService
}

// NewUserHandler creates a UserHandler backed by the given UserService.
func NewUserHandler(service *service.UserService) *UserHandler {
	return &UserHandler{service: service}
}

// GetUsers handles GET /api/users and returns all users.
// Responds with 500 INTERNAL_ERROR if the users cannot be fetched.
func (h *UserHandler) GetUsers(c *gin.Context) {
	users, err := h.service.GetAllUsers(c.Request.Context())
	if err != nil {
		slog.Error("get users failed", "error", err)
		response.Fail(c, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to fetch users")
		return
	}

	response.OK(c, users)
}

// Me handles GET /api/me (requires middleware.RequireAuth) and returns the authenticated user.
func (h *UserHandler) Me(c *gin.Context) {
	userID, ok := middleware.UserIDFrom(c)
	if !ok {
		response.Fail(c, http.StatusUnauthorized, "UNAUTHORIZED", "Not authenticated")
		return
	}

	user, err := h.service.GetByID(c.Request.Context(), userID)
	if err != nil {
		if errors.Is(err, domain.ErrNotFound) {
			response.Fail(c, http.StatusNotFound, "NOT_FOUND", "User not found")
			return
		}
		slog.Error("get user failed", "error", err, "user_id", userID)
		response.Fail(c, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to fetch user")
		return
	}

	response.OK(c, user)
}
