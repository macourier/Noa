# Vibe Coding Starter Pack — Agent Entry

## Pack de règles
Ce projet utilise un pack de règles condensé dans `.clinerules/` :
- `00-core.md` — Principes fondamentaux (pré-validation, one-shot, anti-patterns)
- `01-dispatch.md` — Classification des tâches (LOW/MEDIUM/HIGH risk)
- `02-session.md` — Memory Bank, quand/mettre à jour
- `03-environment.md` — Stack, commandes, MCP, zones protégées
- `10-domain.md` — Règles métier (template à adapter)
- `11-ai-pipeline.md` — Architecture IA (orchestrateur, providers, modules)
- `20-frontend.md` — Conventions React/Tailwind/shadcn
- `21-backend.md` — Conventions API/Services/DB
- `workflows/` — Workflows réutilisables (feature, debug, refactor, review)

## Memory Bank
Mémoire projet structurée dans `memory-bank/` :
- Stable : `projectbrief.md`, `productContext.md`, `systemPatterns.md`, `techContext.md`
- Active : `activeContext.md`, `progress.md`
- Apprentissage : `decisions.md`, `episodes.md`, `glossary.md`
- Local (gitignored) : `local.local.md`

## Stack
Next.js 16 (App Router) · React 19 · TypeScript · Tailwind 4 · shadcn/ui · Supabase · Vitest · Husky
