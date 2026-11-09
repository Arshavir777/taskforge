package handler

import (
	"net/http"
	"taskforge/internal/dto"
	"taskforge/internal/response"
	"taskforge/internal/service"

	"github.com/gin-gonic/gin"
)

type JobHandler struct {
	service *service.JobService
}

func NewJobHandler(service *service.JobService) *JobHandler {
	return &JobHandler{service: service}
}

func (h *JobHandler) CreateJob(c *gin.Context) {
	var req dto.CreateJobRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Fail(c, http.StatusBadRequest, "BAD_REQUEST", "Bad request")
		return
	}
	job, _ := h.service.Create(req)
	response.OK(c, job)
}

func (h *JobHandler) GetAllJobs(c *gin.Context) {
	jobs := h.service.GetAllJobs()
	response.OK(c, jobs)
}
