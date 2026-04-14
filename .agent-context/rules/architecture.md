# Architecture — Separation of Concerns & Structure

> If your service file imports an HTTP library, your architecture is broken.
> If your controller contains SQL, you've already lost.

## The Core Principle

**Every layer has ONE job. Layer leaks are bugs — not "pragmatic shortcuts."**

```
┌─────────────────────────────────────────┐
│         TRANSPORT / CONTROLLER          │  ← Parse input, validate shape, return response
│         (HTTP, CLI, WebSocket, Queue)   │  ← NO business logic here. EVER.
├─────────────────────────────────────────┤
│         APPLICATION / SERVICE           │  ← Business rules, orchestration, transactions
│         (Use cases, workflows)          │  ← NO HTTP, NO SQL, NO framework imports
├─────────────────────────────────────────┤
│         DOMAIN / ENTITY                 │  ← Pure business objects, value objects
│         (Models, rules, calculations)   │  ← ZERO external dependencies
├─────────────────────────────────────────┤
│         INFRASTRUCTURE / REPOSITORY     │  ← Database, external APIs, file system
│         (Data access, adapters)         │  ← NO business logic
└─────────────────────────────────────────┘
```

## Layer Rules (Enforced)

### Transport Layer (Controller / Handler / Route)
**Allowed:**
- Parse and validate incoming request (DTO/schema validation)
- Call application/service layer
- Format and return HTTP response (status code, headers)
- Handle authentication/authorization middleware

**BANNED:**
- Database queries or ORM calls
- Business logic (if/else on business rules)
- Direct calls to external APIs
- Transaction management

### Application Layer (Service / Use Case)
**Allowed:**
- Orchestrate business operations
- Call repository layer for data
- Apply business rules and validations
- Manage transactions
- Emit domain events

**BANNED:**
- HTTP request/response objects
- Framework-specific decorators (keep framework coupling minimal)
- Direct SQL or raw database calls
- UI/presentation logic

### Domain Layer (Entity / Value Object)
**Allowed:**
- Business calculations and rules
- Validation of domain invariants
- Type definitions and interfaces

**BANNED:**
- ANY external dependency (database, HTTP, framework)
- Side effects (logging, API calls, file I/O)
- Infrastructure concerns

### Infrastructure Layer (Repository / Adapter)
**Allowed:**
- Database queries (SQL, ORM, document queries)
- External API calls (wrapped in adapters)
- File system operations
- Cache operations

**BANNED:**
- Business logic (no if/else on business rules in queries)
- HTTP response formatting
- Direct exposure to transport layer

---

## Dependency Direction

Dependencies flow **inward only**:

```
Transport → Application → Domain ← Infrastructure
                ↓
          Infrastructure

NEVER: Domain → Infrastructure (use interfaces/ports)
NEVER: Application → Transport
NEVER: Infrastructure → Application (except through interfaces)
```

The Domain layer depends on NOTHING. Everything depends on the Domain.

---

## Default Architecture: Modular Monolith

Start with a **Modular Monolith**. Do NOT start with microservices.

**Switch to microservices ONLY if 2+ of these triggers exist:**
1. Frequent deploy conflicts across domains (teams blocking each other)
2. Clear scale mismatch (one module needs 100x resources of another)
3. Team ownership collision (multiple teams editing same module)
4. Fault isolation requirement (one module crashing must not kill others)
5. Stable contracts with clear data boundaries already exist

If these triggers don't exist, microservices are **premature complexity**.

---

## Project Structure: Feature-Based Grouping

### ❌ BANNED: Technical Grouping
```
src/
  controllers/          ← 50 controllers in one flat folder?
    userController.ts
    orderController.ts
    paymentController.ts
  services/             ← Good luck finding related code
    userService.ts
    orderService.ts
  repositories/
    userRepository.ts
    orderRepository.ts
```

### ✅ REQUIRED: Feature/Domain Grouping
```
src/
  modules/                              ← Backend
    user/
      user.controller.ts               ← Transport
      user.service.ts                   ← Application
      user.repository.ts               ← Infrastructure
      user.entity.ts                    ← Domain
      user.dto.ts                       ← Data Transfer Objects
      user.module.ts                    ← Module registration
      __tests__/
        user.service.test.ts
    order/
      order.controller.ts
      order.service.ts
      ...
  shared/                               ← Cross-cutting concerns
    config/
    errors/
    logging/
    middleware/

src/
  features/                             ← Frontend
    payment/
      api/                              ← HTTP client + DTOs
      hooks/                            ← React hooks / state
      components/                       ← UI components
      types/                            ← Type definitions
      utils/                            ← Feature-specific utils
      index.ts                          ← Public API barrel
  components/
    ui/                                 ← Shared UI primitives
    layout/                             ← Layout components
  lib/                                  ← Shared utilities
  config/                               ← App configuration
```

---

## Module Communication

### Within a Monolith
Modules communicate through **public interfaces only**:
```
// ✅ CORRECT: Import from module's public API
import { UserService } from '@/modules/user';

// ❌ BANNED: Reach into another module's internals
import { UserRepository } from '@/modules/user/user.repository';
```

### Between Services (if microservices)
- Use well-defined contracts (REST, gRPC, events)
- Never share databases between services
- Define schemas at boundaries (Protobuf, JSON Schema, Zod)

---

## The Architecture Smell Test

Ask yourself these questions. If ANY answer is "yes", your architecture is broken:

1. Can I change the database without touching business logic? (Must be YES)
2. Can I switch from REST to GraphQL without rewriting services? (Must be YES)
3. Can I test business logic without a running database? (Must be YES)
4. Does each module have a clear, single responsibility? (Must be YES)
5. Can a new developer find all related code in one directory? (Must be YES)
