# Go Stack Profile — Simple, Explicit, Fast

> Go's superpower is simplicity. Don't fight it.
> No magic, no abstractions for the sake of abstractions.

## Core Principles

1. **Accept interfaces, return structs** — keep APIs flexible, implementations concrete
2. **Errors are values** — handle them explicitly, don't panic
3. **Stdlib first** — Go's standard library is excellent, use it before reaching for packages
4. **Small interfaces** — 1-2 methods max. `io.Reader` has one method for a reason

---

## Error Handling (The Go Way)

### Rule: Always Check Errors, Never Ignore

```go
// BANNED: Ignoring errors
result, _ := doSomething()
json.Unmarshal(data, &out)  // Error silently ignored

// REQUIRED: Handle every error
result, err := doSomething()
if err != nil {
    return fmt.Errorf("failed to do something: %w", err)
}
```

### Wrapping Errors for Context
```go
// BANNED: Bare error return
if err != nil {
    return err  // Caller has no idea where this came from
}

// REQUIRED: Wrap with context using %w
if err != nil {
    return fmt.Errorf("creating user %q: %w", req.Email, err)
}
// Produces: "creating user "jane@example.com": duplicate key value"
```

### Custom Error Types
```go
type NotFoundError struct {
    Resource string
    ID       string
}

func (e *NotFoundError) Error() string {
    return fmt.Sprintf("%s not found: %s", e.Resource, e.ID)
}

// Check with errors.As
var notFound *NotFoundError
if errors.As(err, &notFound) {
    http.Error(w, notFound.Error(), http.StatusNotFound)
}
```

---

## Project Structure

```
project-name/
├── cmd/
│   └── server/
│       └── main.go                     # Entry point
│
├── internal/                           # Private application code
│   ├── user/
│   │   ├── handler.go                  # HTTP handlers (transport)
│   │   ├── service.go                  # Business logic
│   │   ├── repository.go              # Data access
│   │   ├── model.go                    # Domain types
│   │   └── user_test.go               # Tests alongside code
│   │
│   ├── order/
│   │   └── ...
│   │
│   └── platform/                       # Cross-cutting infrastructure
│       ├── config/
│       │   └── config.go               # Env-validated configuration
│       ├── database/
│       │   └── postgres.go             # DB connection setup
│       ├── logger/
│       │   └── logger.go               # Structured logging (slog)
│       └── middleware/
│           ├── auth.go
│           └── logging.go
│
├── api/                                # API definitions (OpenAPI, proto)
│   └── openapi.yaml
│
├── go.mod
├── go.sum
├── Makefile                            # Build/test/lint commands
└── Dockerfile
```

### Key Rule: `internal/` is Private
Everything in `internal/` is invisible to external importers. This is Go's built-in encapsulation. Use it.

---

## Interface Design

```go
// BANNED: Large interfaces
type UserService interface {
    Create(ctx context.Context, req CreateUserReq) (*User, error)
    Update(ctx context.Context, id string, req UpdateUserReq) (*User, error)
    Delete(ctx context.Context, id string) error
    GetByID(ctx context.Context, id string) (*User, error)
    GetByEmail(ctx context.Context, email string) (*User, error)
    ListAll(ctx context.Context) ([]*User, error)
    // 10 more methods...
}

// REQUIRED: Small, focused interfaces (1-3 methods)
type UserCreator interface {
    Create(ctx context.Context, req CreateUserReq) (*User, error)
}

type UserFinder interface {
    GetByID(ctx context.Context, id string) (*User, error)
}
```

**Rule:** Define interfaces where they are CONSUMED, not where they are implemented.

---

## Context Usage

```go
// REQUIRED: First parameter is always context.Context
func (s *UserService) Create(ctx context.Context, req CreateUserReq) (*User, error) {
    // Pass context to all downstream calls
    user, err := s.repo.Insert(ctx, req)
    // ...
}

// BANNED: context.Background() deep inside application code
// Use it ONLY at the entry point (main, HTTP handler setup, test setup)
```

---

## Preferred Libraries

| Need | Library | Why |
|------|---------|-----|
| HTTP router | `net/http` (Go 1.22+) / `chi` | Stdlib router is now excellent |
| Logging | `log/slog` (stdlib) | Structured, leveled, built-in since Go 1.21 |
| Configuration | `caarlos0/env` + struct tags | Simple, typed env parsing |
| Database | `database/sql` + `pgx` / `sqlc` | `sqlc` generates type-safe Go from SQL |
| Migration | `golang-migrate/migrate` | SQL-based, driver-agnostic |
| Testing | stdlib `testing` + `testify` | `testify` for assertions only |
| Validation | `go-playground/validator` | Struct tag validation |
| HTTP client | `net/http` (stdlib) | Sufficient for most needs |
| JSON | `encoding/json` (stdlib) / `json-iterator` | Stdlib first |
| API docs | `swaggo/swag` | Auto-generates OpenAPI from comments |

---

## Banned Patterns

| Pattern | Why | Alternative |
|---------|-----|-------------|
| `_ = err` or ignoring error | Silent failures | Always handle `err` |
| `panic()` in library code | Crashes the program | Return errors |
| `init()` functions | Hidden side effects, hard to test | Explicit initialization |
| Global mutable state | Concurrency bugs, untestable | Dependency injection |
| `interface{}` / `any` everywhere | No type safety | Generics (Go 1.18+) or specific types |
| ORM magic (GORM) | Hidden queries, N+1 traps | `sqlc` or raw `database/sql` |
| Huge packages | Violates SRP | Split into focused packages |
| Shared `utils` package | Kitchen sink, circular deps | Domain-specific helpers |
