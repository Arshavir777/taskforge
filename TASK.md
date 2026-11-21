# TaskForge Roadmap

Goal: turn TaskForge from a CRUD API with jobs into a **reliable job-processing platform on Postgres** (a small Sidekiq, Temporal-lite or River) that shows senior-level system design.

## Core features

| Feature | What it shows |
|---|---|
| Workers claim jobs with `SELECT … FOR UPDATE SKIP LOCKED` | Concurrency; Postgres works as a queue without Redis |
| Leases and heartbeats: a dead worker's job goes back to the queue | Designing for failure, not only the happy path |
| Retries with exponential backoff and jitter, plus a dead-letter queue | Knowing how production systems fail |
| Idempotency keys on `POST /jobs` | Exactly-once vs at-least-once delivery |
| Per-tier rate limits and quotas (free/pro/enterprise) | Multi-tenancy and fairness |
| SSE stream of job progress | Real-time APIs and context cancellation |
| Graceful shutdown: stop claiming, finish running jobs, release leases | Production thinking |
| Pluggable job handlers (`Register("csv_import", handler)`) | Clean interfaces and extensibility |

## Job types

Each job type is chosen to exercise a different part of the engine. All of them run locally with `docker compose` (no paid services).

| Type | What it does | Engine features it exercises |
|---|---|---|
| `webhook_delivery` | POSTs a JSON event to a user's URL, signed with HMAC-SHA256. A 5xx or timeout is retried; a 4xx fails permanently. | Retries with backoff, dead-letter queue, idempotency, retryable vs permanent errors |
| `csv_import` | Downloads a CSV from a URL, validates each row, and inserts rows in batches into a `contacts` table. The result lists invalid rows. | Long-running jobs, SSE progress (`rows_done / rows_total`), batching, transactions, partial failure |
| `image_thumbnail` | Downloads an image and writes thumbnails in three sizes to MinIO (S3-compatible). | CPU-bound work, a separate queue with its own concurrency limit, per-job timeouts |
| `email_send` | Sends an email through SMTP to Mailpit (a local test inbox). | Rate limiting towards an external provider, at-least-once delivery and duplicate prevention |
| `report_generate` | Builds a CSV of a user's job statistics for a period and stores it in MinIO. Runs on a schedule (e.g. daily). | Scheduled and recurring jobs, heavy read queries |
| `link_check` | A parent job takes a list of URLs and creates one child job per URL. The parent completes when all children finish and reports the results. | Fan-out and fan-in workflows, parent/child job relations |
| `noop` / `chaos` | `noop` sleeps for a set time; `chaos` fails or panics at a configurable rate. | Load testing, panic recovery, testing retries and lease recovery |

### Per-type settings

Every job type is registered with its own settings instead of hard-coded logic:

```go
engine.Register("webhook_delivery", webhookHandler, JobOptions{
    Queue:       "default",
    MaxAttempts: 8,
    Timeout:     10 * time.Second,
    Backoff:     ExponentialJitter(5*time.Second, 1*time.Hour),
})
```

- **Payload validation per type:** `POST /jobs` rejects a payload that doesn't match the type's schema (400 with field errors), so invalid jobs never reach a worker.
- **Queues:** `default`, `cpu` (thumbnails), `scheduled` (reports), each with its own worker count.
- **Result:** each handler writes a typed result to `Job.Result` (e.g. HTTP status for webhooks, row counts for imports).

## Product on top

A **webhook delivery service** built on the engine: users register endpoints, events are delivered with HMAC signatures, retries and a delivery log.

## Supporting work

- **ADRs** in `docs/adr/` (e.g. "Why Postgres instead of Redis for the queue", "Why at-least-once delivery").
- **Architecture diagram** in the README: API → Postgres → worker pool → handlers.
- **Tests:** unit tests through interfaces; integration tests with testcontainers against real Postgres, including a test where a worker is killed mid-job and the job is recovered.
- **Observability:** OpenTelemetry tracing from API to worker; Prometheus metrics (queue depth, job latency, failure rate).
- **Load test** with k6 and a short write-up of results and the bottleneck.
- **One-command setup** with `docker compose up`; CI running lint, tests and migrations.

## Phases

### Phase 1: Foundation
- [x] Pass `context.Context` through every layer; translate storage errors into domain errors
- [ ] Stop `GET /api/users` exposing every user's `api_key`; return response DTOs instead of database models
- [ ] Move `POST /api/jobs` and `GET /api/jobs` behind auth; take the user ID from the token, not the request body
- [ ] Store API keys hashed; show the raw key only once
- [ ] Make `JobRepository.Create` take a `model.Job` instead of a DTO
- [ ] Define consumer-side interfaces in the service package; add the first unit tests
- [ ] Replace `AutoMigrate` with versioned migrations (goose or golang-migrate)
- [ ] Load config once; pass the DSN to `InitDB`
- [ ] Use `http.Server` with timeouts and the `PORT` setting; add graceful shutdown
- [ ] Configure the database connection pool
- [ ] Add pagination to list endpoints
- [ ] Log requests through slog with a request ID
- [ ] Move route setup out of `main.go`

### Phase 2: Worker engine (the core)
- [ ] Worker pool claiming jobs with `SKIP LOCKED`
- [ ] Leases and heartbeats; recover jobs from dead workers
- [ ] Retries with exponential backoff and jitter
- [ ] Dead-letter queue
- [ ] Pluggable job handler registry
- [ ] Graceful worker shutdown
- [ ] Per-type options (queue, max attempts, timeout, backoff) and payload validation
- [ ] Job types: `noop`, `chaos`, `webhook_delivery`, `csv_import`
- [ ] Job types: `image_thumbnail` (separate `cpu` queue), `email_send`
- [ ] Scheduled jobs: `report_generate`
- [ ] Parent/child jobs: `link_check`

### Phase 3: API features
- [ ] Idempotency keys on `POST /jobs`
- [ ] Per-tier rate limiting and quotas
- [ ] SSE stream of job progress

### Phase 4: Observability and performance
- [ ] OpenTelemetry tracing
- [ ] Prometheus metrics
- [ ] k6 load test and write-up

### Phase 5: Product
- [ ] Webhook delivery service on top of the engine

> A finished Phase 2 with tests and ADRs shows more seniority than a large project with many shallow features.
