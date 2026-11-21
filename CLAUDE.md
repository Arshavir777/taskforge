# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

TaskForge is a Go (Gin + GORM + PostgreSQL) API intended to become an async job-processing engine (worker pool, SSE streaming, API-key auth, rate limiting). Module name is `taskforge`; imports look like `taskforge/internal/...`.

**README.md is a design/roadmap doc, not a description of current code.** Several things it lists do not exist yet: `middleware/ratelimit.go`, `service/worker_pool.go`, `handler/sse_handler.go`, `handler/auth_handler.go`, `job_log.go`. The models package is `internal/model` (singular), not `models`. Treat the README as the target architecture when implementing new phases.

## Commands

```bash
go tool air                      # hot-reload dev server (air is declared as a `tool` in go.mod; config in .air.toml)
go build -o ./tmp/main ./cmd/server
go run ./cmd/server              # serves on :8080 (gin default)
go vet ./...
go test ./...                    # no tests exist yet
go test ./internal/service -run TestName   # single test
```

Air writes the binary to `tmp/main` and build errors to `tmp/build-errors.log`.

## Configuration

`internal/config.Load()` reads `APP_ENV` (default `development`), `PORT` (default `8080`), `DATABASE_URL`, `JWT_SECRET` (required outside development; a hardcoded insecure fallback is used in development) and `JWT_TTL` (Go duration, default `24h`). If `DATABASE_URL` is unset it falls back to a local DSN: `host=0.0.0.0 user=postgres password=postgres dbname=taskforge port=45432`.

Note: `.env` exists but **nothing loads it** (godotenv is only an indirect dependency), so env vars must be exported in the shell. Also, `PORT` is read but not used — `router.Run()` is called with no address. Non-`development` `APP_ENV` switches Gin to release mode.

## Architecture

Layered, wired manually in `cmd/server/main.go`:

`handler` (Gin) → `service` → `repository` (GORM) → `model`

- Each layer is a concrete struct with a `NewXxx(dep)` constructor taking the layer below as a pointer (no interfaces yet). Add a new resource by creating all four pieces and wiring them in `main.go`.
- `internal/dto` holds request bindings (e.g. `CreateJobRequest` with `binding:"required"` tags); repositories accept DTOs and build models.
- `internal/response` defines the standard JSON envelope `{success, data, error{code,message}, meta}` — handlers should always respond via `response.OK` / `response.Created` / `response.Fail` rather than `c.JSON` directly.
- Schema is managed by `db.AutoMigrate(&model.User{}, &model.Job{})` in `main.go`; new models must be added there. `Job.Payload`/`Result` are `datatypes.JSON` stored as `jsonb`. `User` has-many `Job` with cascade FK.
- `database.InitDB()` calls `config.Load()` itself (config is loaded twice).
- Logging uses `log/slog`; `pkg/logger` exists but is not wired in.
- Graceful shutdown (signal context, closing the DB pool) is stubbed out as comments in `main.go`.

### Auth

- Email + password: `POST /api/auth/register` stores a bcrypt `User.PasswordHash` (`json:"-"`) and generates a random 64-hex `ApiKey`; `POST /api/auth/login` returns an HS256 JWT (`internal/auth.TokenManager`, claim `uid` = user ID).
- Protected routes go in the `privateApi` group in `main.go`, which uses `middleware.RequireAuth`. Handlers read the caller via `middleware.UserIDFrom(c)`.
- The DB is opened with `gorm.Config{TranslateError: true}` so `errors.Is(err, gorm.ErrDuplicatedKey)` works.

Current routes: `GET /`, `GET /ping`, `GET /api/users`, `GET /api/jobs`, `POST /api/jobs`, `POST /api/auth/register`, `POST /api/auth/login`, and the authenticated `GET /api/me`.

## Web client (`web/`)

Vite + React 19 + TypeScript + Tailwind v4, managed with pnpm.

```bash
cd web
pnpm install
pnpm dev        # http://localhost:5173, proxies /api -> http://localhost:8080 (override with API_URL)
pnpm build      # tsc -b && vite build -> web/dist
pnpm lint       # oxlint
```

- The dev proxy (`web/vite.config.ts`) puts the UI and API on one origin, so the Go server needs no CORS setup.
- Stack: React Router (`src/routes/router.tsx`), TanStack Query for server state, React Hook Form + Zod for forms.
- `src/lib/api.ts` is the only place that calls `fetch`. It adds the Bearer token, unwraps the `{success, data, error}` envelope and throws `ApiError{status, code, message}`. A 401 on an authenticated request signs the user out.
- The JWT and its `expires_at` are kept in localStorage (`src/lib/auth.ts`). `AuthProvider` logs the user out at expiry and keeps tabs in sync.
- `src/types/api.ts` mirrors the Go response shapes (`model.User`, `dto.LoginResponse`); update it when those change.
- `/` is the public welcome page (`pages/WelcomePage.tsx`, copy in `features/welcome/content.ts`); entrance animations are CSS (`animate-fade-up` in `index.css`) behind `motion-safe:`. After login users land on `/profile`.
- Folders: `features/<area>/` for hooks and feature components, `pages/` for route screens, `components/ui` for primitives.
- `features/user/ApiKeyCard.tsx` shows the raw `api_key` from `/api/me`. When keys are stored hashed (TASK.md Phase 1), change it to a prefix plus a "regenerate, show once" flow.
