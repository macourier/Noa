# Backend — API / Services / DB Conventions

## API Routes (`src/app/api/`)
- Input validation with Zod in each route
- Standardized JSON responses: `{ data, error }`
- Error handling with try/catch and appropriate status codes
- Auth: check Supabase session in each protected route

## Server Actions (`src/actions/`)
- Mutations via Next.js Server Actions
- Zod validation server-side
- Cache revalidation after mutation

## Types (`src/types/`)
- Centralized DB types in `src/types/database.ts`
- Domain types per area

## Lib (`src/lib/`)
- `lib/ai/` — AI services
- `lib/cir/` — Business logic (template)
- `lib/supabase/` — Supabase clients (server, admin, middleware)
