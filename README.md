# TaskForge Engine: Advanced Distributed Task Processing Architecture

## 1. Project Overview
**TaskForge Engine** is a production-grade, asynchronous background task and asset processing platform built in Go. It demonstrates advanced systems engineering principles, including concurrent worker pools, thread-safe state management, database transactions, custom rate-limiting middleware, and real-time Server-Sent Events (SSE) streaming.

### Core Technology Stack
- **Language:** Go (Golang) 1.22+
- **Web Framework:** Gin
- **ORM & DB:** GORM + PostgreSQL (with JSONB support)
- **Concurrency:** Native Go Channels, Worker Pools, `sync.WaitGroup`, `context.Context`
- **Real-Time Layer:** Server-Sent Events (SSE) via Gin
- **Frontend (Optional Dashboard):** Tailwind CSS + Vanilla JS

---

## 2. Directory Structure (Clean Architecture)

Organizing your code using a clean package structure ensures separation of concerns, testability, and scalability.

```text
taskforge/
├── cmd/
│   └── server/
│       └── main.go              # Application entry point & graceful shutdown
├── internal/
│   ├── config/
│   │   └── config.go            # Environment variable loading & configuration
│   ├── database/
│   │   └── db.go                # PostgreSQL connection pooling & GORM setup
│   ├── middleware/
│   │   ├── auth.go              # API Key / JWT authentication middleware
│   │   └── ratelimit.go         # Token-bucket rate limiter middleware
│   ├── models/
│   │   ├── user.go              # User model & auth tiers
│   │   ├── job.go               # Job model (status, JSONB payload, attempts)
│   │   └── job_log.go           # Audit trails for job execution steps
│   ├── repository/
│   │   ├── user_repository.go   # Data access layer for users
│   │   └── job_repository.go    # Data access layer for jobs
│   ├── service/
│   │   ├── worker_pool.go       # Core concurrent worker pool engine
│   │   └── job_service.go       # Business logic for job scheduling & execution
│   └── handler/
│       ├── auth_handler.go      # User authentication endpoints
│       ├── job_handler.go       # REST endpoints for job submission & fetching
│       └── sse_handler.go       # Real-time Server-Sent Events stream handler
├── pkg/
│   └── logger/
│       └── logger.go            # Structured logging setup using log/slog
├── .env                         # Environment variables
├── go.mod
└── go.sum
```

---

## 3. Database Schema Design (GORM Models)

### Users Table (`User`)
- `id` (PK, uint)
- `email` (string, unique)
- `api_key` (string, unique, used for auth)
- `tier` (string: `free`, `pro`, `enterprise`)
- `created_at`, `updated_at`

### Jobs Table (`Job`)
- `id` (PK, UUID or uint)
- `user_id` (FK to Users)
- `type` (string: e.g., `video_transcode`, `csv_import`, `webhook`)
- `status` (string: `pending`, `processing`, `completed`, `failed`)
- `payload` (JSONB, dynamic task parameters)
- `result` (JSONB, execution output or error message)
- `attempts` (int, retry counter)
- `created_at`, `updated_at`, `completed_at`

---

## 4. Advanced Subsystems Design

### A. The Concurrent Worker Pool Engine (`internal/service/worker_pool.go`)
1. **Job Queue Channel:** A buffered channel holding job IDs (`jobQueue chan uint`).
2. **Worker Spawning:** On startup, spin up $N$ worker goroutines wrapped inside a `sync.WaitGroup`:
   ```go
   for i := 1; i <= workerCount; i++ {
       wg.Add(1)
       go worker(i, jobQueue, jobRepo, wg, ctx)
   }
   ```
3. **Graceful Shutdown:** Listen for OS signals (`SIGINT`, `SIGTERM`). Cancel the root `context.Context`, close the job queue channel, and call `wg.Wait()` to ensure active jobs finish safely before the process exits.

### B. Real-Time Streaming via Server-Sent Events (`internal/handler/sse_handler.go`)
- Establish a `/api/jobs/stream` endpoint.
- Set headers:
  ```go
  c.Writer.Header().Set("Content-Type", "text/event-stream")
  c.Writer.Header().Set("Cache-Control", "no-cache")
  c.Writer.Header().Set("Connection", "keep-alive")
  ```
- Use a pub-sub broadcast channel pattern in Go so that whenever a worker updates a job status in PostgreSQL, it simultaneously pushes an event payload down the SSE stream to connected frontend clients.

---

## 5. Implementation Roadmap

1. **Phase 1 (Foundation):** Setup `main.go`, `config.go`, and GORM connection pooling with PostgreSQL. Run auto-migrations for `User` and `Job`.
2. **Phase 2 (API & Auth):** Implement Gin routing, API Key verification middleware, and job creation endpoints (`POST /api/jobs`).
3. **Phase 3 (The Concurrency Core):** Build the background worker pool to fetch pending jobs from the DB channel, process them asynchronously, and handle automatic error retries using database transactions.
4. **Phase 4 (Real-Time & Polish):** Add SSE event streaming for live dashboard updates and implement rate limiting.