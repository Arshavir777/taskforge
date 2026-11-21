package service

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"runtime/debug"
	"sync"
	"time"

	"taskforge/internal/domain"
	"taskforge/internal/model"
	"taskforge/internal/repository"

	"gorm.io/datatypes"
)

// JobHandler runs one job. The returned result is stored as JSON in Job.Result.
// ctx is cancelled if the pool is forced to stop, so long jobs should watch it.
type JobHandler func(ctx context.Context, job model.Job) (result any, err error)

type WorkerPoolOptions struct {
	Workers      int           // number of concurrent workers
	PollInterval time.Duration // how long an idle worker waits before checking the queue again
}

// WorkerPool runs N workers. Each worker claims one job at a time from Postgres
// (FOR UPDATE SKIP LOCKED), runs its handler and stores the outcome.
type WorkerPool struct {
	repo     *repository.JobRepository
	opts     WorkerPoolOptions
	handlers map[string]JobHandler

	wg        sync.WaitGroup
	jobCtx    context.Context    // passed to handlers; outlives the claim loop
	jobCancel context.CancelFunc // hard-stops running handlers
}

func NewWorkerPool(repo *repository.JobRepository, opts WorkerPoolOptions) *WorkerPool {
	return &WorkerPool{
		repo:     repo,
		opts:     opts,
		handlers: make(map[string]JobHandler),
	}
}

// Register binds a handler to a job type. Call before Start.
func (p *WorkerPool) Register(jobType string, h JobHandler) {
	p.handlers[jobType] = h
}

// Start launches the workers. They stop claiming new jobs when ctx is cancelled;
// jobs already running keep going until Shutdown.
func (p *WorkerPool) Start(ctx context.Context) {
	p.jobCtx, p.jobCancel = context.WithCancel(context.WithoutCancel(ctx))

	for i := range p.opts.Workers {
		p.wg.Add(1)
		go func() {
			defer p.wg.Done()
			p.runWorker(ctx, i+1)
		}()
	}
	slog.Info("worker pool started", "workers", p.opts.Workers, "poll_interval", p.opts.PollInterval)
}

// Shutdown waits for running jobs to finish. If ctx expires first, it cancels
// the handlers' context and waits for them to return.
// Cancel the ctx given to Start before calling it, so no new jobs are claimed.
func (p *WorkerPool) Shutdown(ctx context.Context) error {
	done := make(chan struct{})
	go func() {
		p.wg.Wait()
		close(done)
	}()

	select {
	case <-done:
		p.jobCancel()
		slog.Info("worker pool stopped")
		return nil
	case <-ctx.Done():
		p.jobCancel()
		<-done
		return fmt.Errorf("worker pool: running jobs were cancelled: %w", ctx.Err())
	}
}

func (p *WorkerPool) runWorker(ctx context.Context, id int) {
	log := slog.With("worker", id)
	timer := time.NewTimer(0) // fire at once: check the queue on startup
	defer timer.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-timer.C:
		}

		// Drain the queue, then sleep for PollInterval.
		for ctx.Err() == nil {
			job, err := p.repo.ClaimNext(ctx)
			if errors.Is(err, domain.ErrNotFound) {
				break
			}
			if err != nil {
				if ctx.Err() == nil {
					log.Error("claim job", "error", err)
				}
				break
			}
			p.process(log, job)
		}

		timer.Reset(p.opts.PollInterval)
	}
}

func (p *WorkerPool) process(log *slog.Logger, job model.Job) {
	log = log.With("job_id", job.ID, "job_type", job.Type, "attempt", job.Attempts)
	start := time.Now()

	result, err := p.run(job)

	// Store the outcome even during shutdown, when jobCtx may be cancelled.
	saveCtx, cancel := context.WithTimeout(context.WithoutCancel(p.jobCtx), 5*time.Second)
	defer cancel()

	if err != nil {
		log.Warn("job failed", "error", err, "duration", time.Since(start))
		if saveErr := p.repo.Fail(saveCtx, job.ID, errorResult(err)); saveErr != nil {
			log.Error("save failed job", "error", saveErr)
		}
		return
	}

	data, err := json.Marshal(result)
	if err != nil {
		log.Error("marshal job result", "error", err)
		if saveErr := p.repo.Fail(saveCtx, job.ID, errorResult(fmt.Errorf("marshal result: %w", err))); saveErr != nil {
			log.Error("save failed job", "error", saveErr)
		}
		return
	}

	log.Info("job completed", "duration", time.Since(start))
	if saveErr := p.repo.Complete(saveCtx, job.ID, data); saveErr != nil {
		log.Error("save completed job", "error", saveErr)
	}
}

// run calls the job's handler and turns a panic into an error, so one bad job
// can't kill the worker.
func (p *WorkerPool) run(job model.Job) (result any, err error) {
	h, ok := p.handlers[job.Type]
	if !ok {
		return nil, fmt.Errorf("no handler registered for job type %q", job.Type)
	}

	defer func() {
		if r := recover(); r != nil {
			slog.Error("job handler panicked", "job_id", job.ID, "panic", r, "stack", string(debug.Stack()))
			err = fmt.Errorf("handler panic: %v", r)
		}
	}()

	return h(p.jobCtx, job)
}

func errorResult(err error) datatypes.JSON {
	data, _ := json.Marshal(map[string]string{"error": err.Error()})
	return data
}
