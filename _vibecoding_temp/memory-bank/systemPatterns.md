# System Patterns

## Architecture
- **Pattern**: Next.js App Router (Server Components + Client Components)
- **Data Flow**: Server → Component → Client hydration
- **State Management**: React hooks + Server Actions

## Key Decisions
| Decision | Rationale | Date |
|---|---|---|
| Next.js 16 App Router | Modern SSR/SSG, Server Components | YYYY-MM-DD |
| Vitest over Jest | Faster, ESM native | YYYY-MM-DD |
| npm over Bun | Stability, CI compatibility | YYYY-MM-DD |

## Patterns Used
- **Repository Pattern**: Data access through service layer
- **Server Actions**: Mutations via Next.js
- **Zod Validation**: Input validation at boundaries

## Anti-patterns to Avoid
- No direct DB calls in components
- No `any` types
- No client-side secrets
