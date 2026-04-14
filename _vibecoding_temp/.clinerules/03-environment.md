# Environment — Stack, Commands, MCP, Protected Zones

## Stack
- **Runtime**: Node.js, Next.js 16 (App Router)
- **Language**: TypeScript strict
- **Frontend**: React 19, Tailwind 4, shadcn/ui
- **Backend**: Next.js API Routes, Server Actions, Supabase
- **Testing**: Vitest, @testing-library/react
- **Validation**: Zod
- **AI**: Anthropic SDK, OpenAI SDK, multi-provider

## Commands
- `npm run dev` — Dev server
- `npm run build` — Production build
- `npm run lint` — ESLint
- `npm run test` — Vitest (single run)
- `npm run test:watch` — Vitest (watch mode)
- `npm run heal` — Sentinel self-healing watcher
- `npx tsc --noEmit` — Type check

## MCP Tools
- **postgres**: Read-only queries — use for schema and data exploration
- **brave-search**: Web search — use for technical documentation
- **github**: Repository management — use for PRs, issues

## Protected Zones — NEVER MODIFY WITHOUT ASKING
- `middleware.ts` — Auth routing, cross-cutting impact
- `src/lib/ai/provider.ts` — AI provider, pipeline-wide impact
- Database migrations already applied — NEVER modify existing
- `src/lib/supabase/admin.ts` — Admin client, full access
- `.env*` — Secrets and configuration
- `package.json` / `package-lock.json` — Dependencies

## Environment Anti-patterns
- Next.js 16: check docs if unexpected behavior
- Database RLS active — check policies before assuming access
