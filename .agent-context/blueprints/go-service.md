# Blueprint: Go HTTP Service (chi / stdlib)

> Go is not Java. Don't bring Spring patterns.
> Embrace simplicity, explicit errors, and small interfaces.

## Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Language | Go 1.23+ | Latest stable |
| Router | `net/http` (Go 1.22+ enhanced) + `chi` | stdlib-compatible, composable middleware |
| Validation | Custom + `go-playground/validator` | Type-safe, struct tags |
| Database | `database/sql` + `pgx` + `sqlc` | Type-safe queries from SQL |
| Migrations | `goose` or `golang-migrate` | Versioned, reversible |
| Logging | `log/slog` (stdlib) | Structured, zero-dependency |
| Config | `envconfig` or `koanf` | Env-first, typed config |
| Testing | stdlib `testing` + `testify` (assertions) | Community standard |
| OpenAPI | `swaggo/swag` or `ogen` | Generate spec from annotations |
| Telemetry | OpenTelemetry Go SDK | Vendor-neutral observability |

## Project Structure

```
project-root/
├── cmd/
│   └── api/
│       └── main.go                 # Entry point: wire dependencies, start server
│
├── internal/                       # Private application code
│   ├── config/
│   │   └── config.go               # Env-based configuration struct
│   │
│   ├── domain/                     # Core business types (no external deps)
│   │   ├── user.go                 # Entity: User
│   │   ├── order.go                # Entity: Order
│   │   └── errors.go               # Domain-specific error types
│   │
│   ├── service/                    # Business logic (depends on domain + ports)
│   │   ├── user_service.go
│   │   └── order_service.go
│   │
│   ├── repository/                 # Data access (implements domain ports)
│   │   ├── postgres/
│   │   │   ├── user_repo.go
│   │   │   └── queries/            # sqlc generated or raw SQL
│   │   └── repository.go           # Interface definitions
│   │
│   ├── handler/                    # HTTP handlers (chi routes)
│   │   ├── user_handler.go
│   │   ├── order_handler.go
│   │   ├── middleware.go           # Custom middleware
│   │   └── response.go            # Standardized JSON response helpers
│   │
│   └── platform/                   # Infrastructure adapters
│       ├── database.go             # Database connection setup
│       ├── logger.go               # slog configuration
│       └── telemetry.go            # OpenTelemetry setup
│
├── migrations/
│   ├── 001_create_users.sql
│   └── 002_create_orders.sql
│
├── go.mod
├── go.sum
├── Makefile                        # Standard commands
├── Dockerfile
└── .env.example
```

## Key Patterns

### Dependency Injection via Constructors

```go
// internal/service/user_service.go
type UserService struct {
    repo   UserRepository
    logger *slog.Logger
}

func NewUserService(repo UserRepository, logger *slog.Logger) *UserService {
    return &UserService{repo: repo, logger: logger}
}
```

### Interfaces in the Consumer Package

```go
// internal/service/user_service.go
// Interface defined HERE (consumer), not in the repository package
type UserRepository interface {
    FindByID(ctx context.Context, id string) (*domain.User, error)
    Create(ctx context.Context, user *domain.User) error
}
```

### Error Handling: Explicit, Always

```go
// ❌ BANNED in Go
result, _ := db.Query(ctx, sql)   // Ignoring error

// ✅ REQUIRED
result, err := db.Query(ctx, sql)
if err != nil {
    return fmt.Errorf("query users: %w", err)
}
```

### HTTP Handler Pattern

```go
// internal/handler/user_handler.go
func (h *UserHandler) Create(w http.ResponseWriter, r *http.Request) {
    var req CreateUserRequest
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        respondError(w, http.StatusBadRequest, "invalid request body")
        return
    }

    if err := req.Validate(); err != nil {
        respondError(w, http.StatusBadRequest, err.Error())
        return
    }

    user, err := h.service.Create(r.Context(), req.ToDomain())
    if err != nil {
        h.logger.ErrorContext(r.Context(), "create user failed",
            slog.String("error", err.Error()),
        )
        respondError(w, http.StatusInternalServerError, "internal error")
        return
    }

    respondJSON(w, http.StatusCreated, user)
}
```

### Router Setup with chi

```go
// cmd/api/main.go
func setupRouter(h *handler.Handler) http.Handler {
    r := chi.NewRouter()

    // Global middleware
    r.Use(middleware.RequestID)
    r.Use(middleware.RealIP)
    r.Use(middleware.Logger)
    r.Use(middleware.Recoverer)
    r.Use(middleware.Timeout(30 * time.Second))

    // API routes
    r.Route("/api/v1", func(r chi.Router) {
        r.Route("/users", func(r chi.Router) {
            r.Get("/", h.User.List)
            r.Post("/", h.User.Create)
            r.Route("/{userId}", func(r chi.Router) {
                r.Get("/", h.User.GetByID)
                r.Put("/", h.User.Update)
                r.Delete("/", h.User.Delete)
            })
        })
    })

    // Health check
    r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
        w.WriteHeader(http.StatusOK)
        w.Write([]byte(`{"status":"ok"}`))
    })

    return r
}
```

## Makefile Commands

```makefile
.PHONY: run build test lint migrate

run:
	go run ./cmd/api

build:
	CGO_ENABLED=0 go build -o bin/api ./cmd/api

test:
	go test ./... -v -race -coverprofile=coverage.out

lint:
	golangci-lint run ./...

migrate-up:
	goose -dir migrations postgres "$(DATABASE_URL)" up

migrate-down:
	goose -dir migrations postgres "$(DATABASE_URL)" down

sqlc:
	sqlc generate
```

## Scaffolding Checklist

- [ ] `go mod init` with proper module path
- [ ] Create `cmd/api/main.go` entry point
- [ ] Set up `internal/` structure (config, domain, service, repository, handler)
- [ ] Configure `chi` router with standard middleware stack
- [ ] Set up `slog` structured logging
- [ ] Configure database connection with `pgx` + connection pool
- [ ] Set up `sqlc` for type-safe SQL queries
- [ ] Create migration files with `goose`
- [ ] Write standardized JSON response helpers
- [ ] Add `Makefile` with run, build, test, lint, migrate commands
- [ ] Create `Dockerfile` (multi-stage, scratch base)
- [ ] Create `.env.example` with all required env vars
- [ ] Run `golangci-lint` with strict config
