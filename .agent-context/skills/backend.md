# Backend Skill Pack

Default tier: `advance`

## Purpose
Build backend systems with strict layer separation, typed boundaries, and operational safety.

## In Scope
- Transport, service, repository, and domain separation
- Validation at boundaries
- Error handling and observability
- Data access and transaction safety
- API and event contract design

## Must-Have Checks
- No business logic in transport layer
- No HTTP objects in application layer
- No raw SQL in controllers or services
- All external input validated before business logic
- Typed errors and explicit failure paths

## Evidence
- Unit and integration tests
- API contract docs
- Validation schemas
- Release gate output

## Fallback
- Standard mode is allowed only for legacy compatibility and must be flagged in release evidence.