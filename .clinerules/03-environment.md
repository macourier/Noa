# Environment — Stack, Commands, MCP, Protected Zones

## Stack (Luxe Stack — Last updated 2026-04-14)
- **Runtime**: Node.js 20+, Nuxt 4 (Nitro)
- **Language**: TypeScript strict
- **Frontend**: Vue 3, Tailwind CSS v4, Shadow Velvet Theme
- **Backend**: Appwrite (Auth, DB, Storage), Nuxt Server Routes
- **Auth**: Appwrite SDK (anonymous + email conversion)
- **Testing**: Vitest, @vue/test-utils
- **Validation**: Zod
- **AI**: Anthropic SDK, OpenAI SDK, multi-provider

## Commands
- `npm run dev` — Dev server Nuxt
- `npm run build` — Production build
- `npm run preview` — Preview build
- `npm run lint` — ESLint
- `npm run test` — Vitest (single run)
- `npm run test:watch` — Vitest (watch mode)
- `npx nuxi typecheck` — Type check Nuxt

## MCP Tools
- **postgres**: Read-only queries — use for schema and data exploration (Supabase DB)
- **brave-search**: Web search — use for technical documentation
- **github**: Repository management — use for PRs, issues
- **supabase**: Supabase management (migrations, logs)

## Protected Zones — NEVER MODIFY WITHOUT ASKING
- `app/plugins/appwrite.ts` — Appwrite init, project-wide impact
- `app/composables/useAuth.ts` — Auth logic, security-critical
- `app/utils/security.ts` — Security utilities, Vault-critical
- Database migrations already applied — NEVER modify existing
- `.env*` — Secrets and configuration
- `package.json` / `package-lock.json` — Dependencies

## Environment Anti-patterns
- Nuxt 4: use `app/` directory convention (not `src/`)
- Appwrite: always use "Owner Only" permissions on collections
- Database RLS active — check policies before assuming access
- NEVER hardcode Appwrite keys — always use runtime config
