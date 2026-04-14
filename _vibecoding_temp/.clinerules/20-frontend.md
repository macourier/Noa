# Frontend — React / Tailwind / shadcn Conventions

## Components
- Server Components by default (App Router)
- Client Components only if state, effects, or event handlers (`"use client"`)
- Business components in `src/components/`
- UI base components in `src/components/ui/` (shadcn/ui, don't modify directly)

## Styling
- Tailwind 4 — use utility classes, no custom CSS unless exceptional
- Theme consistent with shadcn tokens (CSS variables)

## Data Fetching
- Prefer Server Components for data fetching
- Client-side: custom hooks in `src/hooks/`
- Loading/error states always handled (skeleton, fallback, error boundary)

## Forms
- Validation with Zod (client + server)
- Server Actions for mutations (`src/actions/`)
