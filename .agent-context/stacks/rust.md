# Rust Engineering Standards

> Rust guarantees memory safety, but not logic safety. Write code that is as predictable as the compiler.

## Core Tenets
1. **Never Panic:** The use of `unwrap()`, `expect()`, or `panic!()` in production business logic is strictly banned.
2. **Make Invalid States Unrepresentable:** Use Rust's powerful type system (enums, newtypes) to enforce business rules at compile time.
3. **Explicit Errors:** Use `Result` for all fallible operations.
4. **Fearless Concurrency:** Leverage `Send` and `Sync`. Avoid shared mutable state; prefer message passing or structured concurrency.

## Ecosystem & Dependencies (March 2026)
Adhere to the `efficiency-vs-hype` rule. The Rust ecosystem is robust; use community standards:

### Backend / API
- **Web Framework:** `axum` (Standard for new projects, built on `tokio` and `tower`). Avoid `actix-web` and `rocket` for new microservices unless migrating legacy code.
- **Async Runtime:** `tokio` (Standard).
- **Serialization:** `serde` + `serde_json`.

### Data / Persistence
- **Database:** `sqlx` (preferred for compile-time checked SQL) or `sea-orm` (if an ORM is strictly required). Avoid `diesel` (unless explicitly requested).
- **Connection Pooling:** Built into `sqlx` (use `PgPool`, etc.).

### Validation / Error Handling / Observability
- **Error Handling:** `thiserror` (for libraries and domain boundaries) and `anyhow` (for application/binaries and controllers).
- **Validation:** `validator` crate.
- **Telemetry/Logging:** `tracing` + `tracing-subscriber`. `log` and `env_logger` are legacy.

## Architecture & Layering
Strict Clean Architecture / Hexagonal Architecture.

1. **Transport (`/api` or `/transport`)**
   - Axum routers and handlers.
   - Responsible for extracting JSON/Path data, verifying auth claims, and calling the Domain/Service layer.
   - **MUST:** Return standard HTTP status codes mapping to domain errors.

2. **Application / Service (`/services` or `/app`)**
   - Orchestrates business logic, database transactions, and external API calls.
   - **NO** HTTP knowledge (Axum types do not cross this boundary).

3. **Domain (`/domain`)**
   - Pure Rust logic. Structs, Enums, Traits.
   - **Must not** know about the database (SQL) or HTTP. Use traits (interfaces) to define repository contracts.

4. **Infrastructure / Repository (`/repo` or `/infra`)**
   - `sqlx` queries go here. Implements the traits defined in Domain.

## Anti-Patterns (Zero Tolerance)

### 1. The `unwrap()` Fallacy
```rust
// ❌ BANNED: Will crash the server if parsing fails
let user_id = id_string.parse::<i32>().unwrap();

// ✅ REQUIRED: Explicit error mapping
let user_id = id_string.parse::<i32>().map_err(AppError::InvalidId)?;
```

### 2. Stringly-Typed Domain
```rust
// ❌ BANNED: Passing raw strings everywhere
fn update_email(user_id: String, email: String) {}

// ✅ REQUIRED: Newtypes and validated types
struct UserId(uuid::Uuid);
struct Email(String); // Should be validated on creation

fn update_email(user_id: UserId, email: Email) {}
```

### 3. Cloning to Appease the Borrow Checker
```rust
// ❌ POOR PRACTICE: Cloning just to make it compile instead of designing lifetimes/ownership
let name = user.name.clone();
process_name(name);

// ✅ REQUIRED: Pass by reference (borrowing)
process_name(&user.name);
```

### 4. Catch-all `anyhow::Error` in Traits
Traits defining contracts between layers (like Repositories) should return explicit errors (`thiserror`), not `anyhow::Error`, so the caller can systematically handle specific failures (e.g., `NotFound`, `ConstraintViolation`).

## Testing Standards
- **Unit Tests:** Inside the same file as the code (`#[cfg(test)] mod tests { ... }`).
- **Integration Tests:** In the `tests/` directory at the root level.
- **Mocking:** Use `mockall` or manually implement traits for test doubles. Avoid testing against a real database in unit tests; use them in integration tests using `sqlx::test`.
