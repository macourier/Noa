# Blueprint: FastAPI Service

> Python backend API service using FastAPI, Pydantic v2, SQLAlchemy 2.0, and Alembic.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | FastAPI |
| Validation | Pydantic v2 |
| ORM | SQLAlchemy 2.0 (async) |
| Migration | Alembic |
| Testing | pytest + pytest-asyncio + httpx |
| Logging | structlog |
| Linting | ruff (lint + format) |
| Type checking | pyright (strict) |
| Env config | pydantic-settings |

---

## Project Structure

```
project-name/
├── src/
│   ├── __init__.py
│   ├── main.py
│   ├── config.py
│   │
│   ├── modules/
│   │   └── user/
│   │       ├── __init__.py
│   │       ├── router.py
│   │       ├── service.py
│   │       ├── repository.py
│   │       ├── schemas.py
│   │       ├── models.py
│   │       └── exceptions.py
│   │
│   └── shared/
│       ├── __init__.py
│       ├── database.py
│       ├── errors.py
│       ├── logger.py
│       └── middleware.py
│
├── tests/
│   ├── conftest.py
│   ├── factories.py
│   └── modules/
│       └── user/
│           └── test_user_service.py
│
├── alembic/
│   ├── env.py
│   └── versions/
│
├── pyproject.toml
├── alembic.ini
├── .env.example
├── Dockerfile
└── Makefile
```

---

## File Patterns

### config.py — Environment Validation
```python
from pydantic_settings import BaseSettings
from pydantic import Field

class Settings(BaseSettings):
    database_url: str = Field(
        description="PostgreSQL connection string"
    )
    jwt_secret: str = Field(min_length=32)
    app_env: str = Field(default="development", pattern="^(development|staging|production)$")
    cors_origins: list[str] = Field(default=["http://localhost:3000"])
    log_level: str = Field(default="INFO")

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}

settings = Settings()
```

### main.py — Application Entry
```python
from contextlib import asynccontextmanager
from fastapi import FastAPI
from src.config import settings
from src.shared.middleware import setup_middleware
from src.shared.logger import setup_logging
from src.modules.user.router import router as user_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    setup_logging(settings.log_level)
    # startup: connect DB, warm caches
    yield
    # shutdown: close connections

app = FastAPI(
    title="Service Name",
    version="1.0.0",
    lifespan=lifespan,
)

setup_middleware(app, settings)
app.include_router(user_router, prefix="/api/v1")

@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}
```

### router.py — Transport Layer
```python
from fastapi import APIRouter, HTTPException, status
from src.modules.user.schemas import CreateUserRequest, UserResponse
from src.modules.user.service import UserService

router = APIRouter(prefix="/users", tags=["users"])

@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(request: CreateUserRequest, service: UserService) -> UserResponse:
    return await service.create(request)
```

### schemas.py — Validation Boundaries
```python
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from uuid import UUID

class CreateUserRequest(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    email: EmailStr
    age: int = Field(ge=13, le=150)

    model_config = {"strict": True}

class UserResponse(BaseModel):
    id: UUID
    name: str
    email: str
    created_at: datetime
```

### service.py — Business Logic
```python
import structlog
from src.modules.user.schemas import CreateUserRequest, UserResponse
from src.modules.user.repository import UserRepository
from src.modules.user.exceptions import UserAlreadyExistsError

logger = structlog.get_logger()

class UserService:
    def __init__(self, repo: UserRepository) -> None:
        self._repo = repo

    async def create(self, request: CreateUserRequest) -> UserResponse:
        if await self._repo.exists_by_email(request.email):
            raise UserAlreadyExistsError(request.email)

        user = await self._repo.insert(request)
        logger.info("user_created", user_id=str(user.id), email=user.email)
        return UserResponse.model_validate(user)
```

### shared/errors.py — Error Foundation
```python
from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse

class AppError(Exception):
    def __init__(self, code: str, message: str, status_code: int = 400) -> None:
        self.code = code
        self.message = message
        self.status_code = status_code

async def app_error_handler(request: Request, exc: AppError) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": exc.code,
                "message": exc.message,
            }
        },
    )
```

---

## Scaffolding Checklist

- [ ] Create project with `pyproject.toml` (ruff, pyright, pytest config)
- [ ] Set up `src/config.py` with Pydantic Settings
- [ ] Set up `src/shared/database.py` with async SQLAlchemy engine
- [ ] Set up `src/shared/errors.py` with base error class + handler
- [ ] Set up `src/shared/logger.py` with structlog
- [ ] Create first module following the pattern above
- [ ] Set up Alembic with initial migration
- [ ] Create `Makefile` with dev, test, lint, format commands
- [ ] Create `.env.example`
- [ ] Create `Dockerfile` (multi-stage)
- [ ] Run `ruff check` and `pyright` — zero errors
