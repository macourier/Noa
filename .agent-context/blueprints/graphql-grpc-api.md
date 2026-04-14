# GraphQL & gRPC API Blueprint

> REST is for resources; GraphQL is for queries; gRPC is for actions. Choose the right tool, then design the contract before writing the code.

## 1. Schema-First Design (Mandatory)
Never rely on code-first generation for your public contracts.
- **Rule:** The schema (`.graphql` or `.proto`) is the single source of truth.
- **Why:** Schema-first forces API design discussions to happen independently of the implementation language. It allows frontend and backend teams to work in parallel.
- **Validation:** Your CI/CD MUST include a schema linter (e.g., `graphql-schema-linter` or `buf lint`).

## 2. GraphQL Standards

### A. The N+1 Problem (Dataloaders)
- **Rule:** EVERY resolver that fetches a relation MUST use a DataLoader (or equivalent batching/caching mechanism).
- **BANNED:** Resolving `author` inside a `posts` query by doing `SELECT * FROM users WHERE id = X` in a loop.
- **REQUIRED:** Batching IDs to fetch them all in one query `SELECT * FROM users WHERE id IN (X, Y, Z)`.

### B. Pagination
- **Rule:** Use cursor-based pagination (Relay Connection Specification) for all list endpoints.
- **BANNED:** Offset-based pagination (`limit`, `offset`) for large datasets (it becomes exponentially slower).
- **REQUIRED Structure:**
  ```graphql
  type UserConnection {
    edges: [UserEdge!]!
    pageInfo: PageInfo!
  }
  ```

### C. Mutations
- **Rule:** Mutations MUST represent business actions, not CRUD database operations.
- **BANNED:** `updateUser`, `createPost`.
- **REQUIRED:** `suspendUserAccount`, `publishBlogPost`. Every mutation must take a single `input` object and return a `payload` object.

## 3. gRPC & Protobuf Standards

### A. Backwards Compatibility
- **Rule:** Never rename a field, never change a field's type, and never reuse a field tag number.
- **BANNED:** `int32 count = 1;` -> `int64 count = 1;`
- **REQUIRED:** If the type must change, deprecate the old field and create a new one:
  ```protobuf
  int32 old_count = 1 [deprecated = true];
  int64 count = 2;
  ```

### B. Structure & Organization
- **Rule:** Group proto files by domain/package (`package ecommerce.orders.v1;`).
- **Required Files:** Separate messages (`messages.proto`) from services (`service.proto`) if the domain is large.

### C. Error Handling
gRPC uses standard status codes.
- **Rule:** Map business errors to explicit `google.rpc.Status` codes. Do not return `UNKNOWN` or `INTERNAL` for business logic failures (like "Insufficient Funds"). Use `FAILED_PRECONDITION` or custom detail payloads.
