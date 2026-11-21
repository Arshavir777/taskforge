package handler

import (
	"log/slog"
	"net/http"
	"taskforge/internal/dto"
	"taskforge/internal/response"
	"taskforge/internal/service"

	"github.com/gin-gonic/gin"
)

// JobHandler handles HTTP requests for job resources.
type JobHandler struct {
	service *service.JobService
}

// NewJobHandler creates a JobHandler backed by the given JobService.
func NewJobHandler(service *service.JobService) *JobHandler {
	return &JobHandler{service: service}
}

// CreateJob handles POST /api/jobs.
// It binds the JSON body to dto.CreateJobRequest, creates the job and returns it.
// Responds with 400 BAD_REQUEST if the body is invalid.
func (h *JobHandler) CreateJob(c *gin.Context) {
	var req dto.CreateJobRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Fail(c, http.StatusBadRequest, "BAD_REQUEST", "Bad request")
		return
	}
	job, err := h.service.Create(c.Request.Context(), req)
	if err != nil {
		slog.Error("create job failed", "error", err)
		response.Fail(c, http.StatusInternalServerError, "INTERNAL_ERROR", "Could not create job")
		return
	}
	response.Created(c, job)
}

// GetAllJobs handles GET /api/jobs and returns all jobs.
func (h *JobHandler) GetAllJobs(c *gin.Context) {
	jobs, err := h.service.GetAllJobs(c.Request.Context())
	if err != nil {
		slog.Error("get jobs failed", "error", err)
		response.Fail(c, http.StatusInternalServerError, "INTERNAL_ERROR", "Could not fetch jobs")
		return
	}
	response.OK(c, jobs)
}
