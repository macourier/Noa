# Python Stack Profile — Explicit is Better Than Implicit

> Python's readability is a gift. Don't waste it with sloppy typing and god functions.

## Type System (Enforced)

### Type Hints Everywhere (Python 3.12+)
```python
# BANNED: Untyped function signatures
def process_data(data, options):
    ...

# REQUIRED: Full type annotations
def process_order(order: Order, options: ProcessingOptions) -> OrderResult:
    ...
```

**Rule:** Every function MUST have type annotations for all parameters and return types. Use `mypy --strict` or `pyright` in strict mode.

### No `Any` (Same Rule as TypeScript)
```python
# BANNED
def handle(data: Any) -> Any: ...
result: dict[str, Any] = get_response()

# REQUIRED
def handle(data: OrderPayload) -> OrderResult: ...
result: OrderResponse = get_response()
```

---

## Validation at Boundaries: Pydantic

### Rule: ALL External Data MUST Pass Through Pydantic

```python
# BANNED: Trusting raw dicts
@app.post("/users")
async def create_user(request: Request):
    data = await request.json()  # Could be anything!
    return await user_service.create(data)

# REQUIRED: Pydantic model at the boundary
from pydantic import BaseModel, EmailStr, Field

class CreateUserRequest(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    email: EmailStr
    age: int = Field(ge=13, le=150)

@app.post("/users")
async def create_user(payload: CreateUserRequest) -> UserResponse:
    return await user_service.create(payload)
```

### Pydantic Best Practices
- Use `Field()` with constraints (`min_length`, `ge`, `le`, `pattern`)
- Use `model_config = ConfigDict(strict=True)` to prevent type coercion
- Derive response models from base models: `class UserResponse(UserBase):`
- Use `model_validator` for cross-field validation

---

## Project Structure

```
project-name/
├── src/
│   ├── __init__.py
│   ├── main.py                       # Application entry point
│   ├── config.py                     # Pydantic Settings (env validation)
│   │
│   ├── modules/                      # Feature modules
│   │   ├── user/
│   │   │   ├── __init__.py
│   │   │   ├── router.py             # Transport (API routes)
│   │   │   ├── service.py            # Business logic
│   │   │   ├── repository.py         # Data access
│   │   │   ├── schemas.py            # Pydantic models (DTOs)
│   │   │   ├── models.py             # SQLAlchemy/ORM models
│   │   │   └── exceptions.py         # Domain-specific errors
│   │   └── order/
│   │       └── ...
│   │
│   └── shared/
│       ├── errors.py                 # Base error classes
│       ├── middleware.py              # Auth, logging, error handling
│       ├── database.py               # DB session management
│       └── logger.py                 # Structured logging (structlog)
│
├── tests/
│   ├── conftest.py                   # Fixtures
│   ├── factories.py                  # Test data factories
│   └── modules/
│       └── user/
│           └── test_user_service.py
│
├── pyproject.toml                    # Project config (single source)
├── .env.example
└── Dockerfile
```

---

## Async Patterns

```python
# BANNED: Sync I/O in async context
import requests  # Blocks the event loop!
response = requests.get("https://api.example.com")

# REQUIRED: Use async HTTP client
import httpx
async with httpx.AsyncClient() as client:
    response = await client.get("https://api.example.com")
```

**Rule:** In async applications (FastAPI, etc.), NEVER use synchronous I/O libraries (`requests`, `time.sleep`, `open()` for large files). Use `httpx`, `asyncio.sleep`, `aiofiles`.

---

## Preferred Libraries (2025)

| Need | Library | Why |
|------|---------|-----|
| Web framework | `fastapi` | Async, type-safe, auto OpenAPI docs |
| Validation | `pydantic` v2 | Fast, Rust-powered, zero compromise |
| ORM | `sqlalchemy` 2.0+ / `sqlmodel` | Mature, async support. SQLModel wraps SQLAlchemy + Pydantic |
| HTTP client | `httpx` | Async-native, requests-compatible API |
| Testing | `pytest` + `pytest-asyncio` | Standard, plugin-rich |
| Linting | `ruff` | 10-100x faster than flake8+isort+black combined |
| Formatting | `ruff format` (or `black`) | Consistent, zero-config |
| Type checking | `mypy --strict` or `pyright` | Catch type errors before runtime |
| Logging | `structlog` | Structured, JSON-ready, contextvars |
| Env config | `pydantic-settings` | Type-safe env with validation |
| Password | `passlib[bcrypt]` or `argon2-cffi` | Proven, secure |
| Migration | `alembic` | SQLAlchemy migration standard |

---

## Banned Patterns

| Pattern | Why | Alternative |
|---------|-----|-------------|
| `Any` type | Defeats type checking | Specific types or `Unknown` protocol |
| `requests` in async | Blocks event loop | `httpx` |
| `print()` for logging | No structure, no levels | `structlog` or `logging` |
| `except Exception: pass` | Swallows every error | Specific exceptions, always log |
| `from module import *` | Namespace pollution | Explicit imports |
| Mutable default args | Shared state bug | `def f(items: list | None = None):` |
| Global state | Untestable, concurrency bugs | Dependency injection |
| `os.environ["KEY"]` | Crashes with KeyError | `pydantic-settings` with defaults |
