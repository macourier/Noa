# AGENTS.md - Noa Project

Ce projet utilise deux systèmes de gouvernance complémentaires :

## 1. Agentic-Senior-Core (Governance)

Source : `.instructions.md` · Canonical Snapshot SHA256 : `08994f6e228b32d415dcc2024f31f0a076119a3cf87a4cd2fd2e78e86e5fbd3e`

### Bootstrap Chain

1. Load `.instructions.md` first as the single source of truth.
2. Read baseline governance from `.agent-context/rules/`.
3. Load language conventions from `.agent-context/stacks/`.
4. Load scaffolding references from `.agent-context/blueprints/`.
5. Load domain packs from `.agent-context/skills/`.
6. Apply team governance defaults from `.agent-context/profiles/`.
7. Read change-risk maps from `.agent-context/state/`.
8. Enforce policy thresholds from `.agent-context/policies/`.

## 2. Vibe Coding Starter Pack (Cline Rules + Memory Bank)

Source : `.clinerules/` + `memory-bank/`

### Règles actives (`.clinerules/`)

| Fichier | Contenu |
|---------|---------|
| `00-core.md` | Principes fondamentaux (pré-validation, one-shot, anti-patterns) |
| `01-dispatch.md` | Classification des tâches (LOW/MEDIUM/HIGH risk) |
| `02-session.md` | Memory Bank — quand et comment mettre à jour |
| `03-environment.md` | Stack technique, commandes, MCP, zones protégées |
| `10-domain.md` | Règles métier (template à adapter) |
| `11-ai-pipeline.md` | Architecture IA (orchestrateur, providers, modules) |
| `20-frontend.md` | Conventions React/Nuxt/Tailwind/shadcn |
| `21-backend.md` | Conventions API/Services/DB |
| `workflows/*.md` | Workflows réutilisables (feature, debug, refactor, review) |

### Memory Bank (`memory-bank/`)

| Catégorie | Fichiers | Rôle |
|-----------|----------|------|
| **Stable** | `projectbrief.md`, `productContext.md`, `systemPatterns.md`, `techContext.md` | Contexte persistant du projet |
| **Active** | `activeContext.md`, `progress.md` | État courant, tâches en cours |
| **Apprentissage** | `decisions.md`, `episodes.md`, `glossary.md` | Historique des décisions et leçons |
| **Local** | `local.local.md` *(gitignored)* | Notes personnelles développeur |

### Bootstrap Chain (Vibe Coding)

1. Lire `memory-bank/activeContext.md` pour le contexte courant.
2. Lire `memory-bank/progress.md` pour l'état des tâches.
3. Appliquer les règles de `.clinerules/00-core.md` à chaque action.
4. Dispatcher selon `.clinerules/01-dispatch.md`.
5. Mettre à jour la Memory Bank selon `.clinerules/02-session.md`.

## Trigger Rules

- **Nouveau projet ou module** : proposer l'architecture d'abord, attendre l'approbation.
- **Refactor ou fix** : proposer un plan d'abord, exécuter ensuite.
- **Completion** : exécuter `.agent-context/review-checklists/pr-checklist.md` avant de déclarer "done".
- **Tâches Cline** : suivre les workflows de `.clinerules/workflows/`.
- **Mise à jour Memory Bank** : après chaque session significative (cf. `.clinerules/02-session.md`).

## Stack Technique

- **Framework** : Nuxt 3 (App Router) · React 19
- **Styling** : Tailwind 4 · shadcn/ui
- **Backend** : Supabase
- **Testing** : Vitest · Husky
- **AI** : Pipeline IA modulaire (cf. `.clinerules/11-ai-pipeline.md`)
