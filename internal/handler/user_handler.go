package handler

import (
	"net/http"
	"taskforge/internal/response"
	"taskforge/internal/service"

	"github.com/gin-gonic/gin"
)

type UserHandler struct {
	service *service.UserService
}

func NewUserHandler(service *service.UserService) *UserHandler {
	return &UserHandler{service: service}
}

func (h *UserHandler) GetUsers(c *gin.Context) {
	users, err := h.service.GetAllUsers()
	if err != nil {
		response.Fail(c, http.StatusBadRequest, "BAD_REQUEST", "Failed to fetch users")
		return
	}

	response.OK(c, users)
}
