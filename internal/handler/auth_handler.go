package handler

import (
	"errors"
	"log/slog"
	"net/http"
	"taskforge/internal/dto"
	"taskforge/internal/response"
	"taskforge/internal/service"

	"github.com/gin-gonic/gin"
)

// AuthHandler handles registration and login.
type AuthHandler struct {
	service *service.AuthService
}

func NewAuthHandler(service *service.AuthService) *AuthHandler {
	return &AuthHandler{service: service}
}

// Register handles POST /api/auth/register.
func (h *AuthHandler) Register(c *gin.Context) {
	var req dto.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Fail(c, http.StatusBadRequest, "BAD_REQUEST", "A valid email and a password of 8-72 characters are required")
		return
	}

	user, err := h.service.Register(c.Request.Context(), req)
	if err != nil {
		if errors.Is(err, service.ErrEmailTaken) {
			response.Fail(c, http.StatusConflict, "EMAIL_TAKEN", "Email is already registered")
			return
		}
		slog.Error("register failed", "error", err)
		response.Fail(c, http.StatusInternalServerError, "INTERNAL_ERROR", "Could not register user")
		return
	}

	response.Created(c, user)
}

// Login handles POST /api/auth/login and returns a JWT.
func (h *AuthHandler) Login(c *gin.Context) {
	var req dto.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Fail(c, http.StatusBadRequest, "BAD_REQUEST", "Email and password are required")
		return
	}

	res, err := h.service.Login(c.Request.Context(), req)
	if err != nil {
		if errors.Is(err, service.ErrInvalidCredentials) {
			response.Fail(c, http.StatusUnauthorized, "INVALID_CREDENTIALS", "Invalid email or password")
			return
		}
		slog.Error("login failed", "error", err)
		response.Fail(c, http.StatusInternalServerError, "INTERNAL_ERROR", "Could not log in")
		return
	}

	response.OK(c, res)
}
