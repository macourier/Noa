# 🛡️ ROADMAP — Quality Standards

> This document defines the non-negotiable quality standards for projects built from this starter pack.

---

## ✅ CI/CD — Mandatory

### GitHub Actions Pipeline

Every PR and push to `main` triggers:

| Step | Command | Gate |
|---|---|---|
| **Lint** | `npm run lint` | Zero warnings |
| **Type-check** | `npx tsc --noEmit` | Zero errors |
| **Test** | `npm run test` | All pass |
| **Build** | `npm run build` | Success |

### Configuration

- **Concurrency**: Cancel in-progress runs on same branch
- **Node.js**: v20 LTS
- **Package manager**: npm (no Bun, no Yarn)
- **Caching**: `npm ci` with cache

### Branch Protection

- `main` is **protected**
- No direct pushes
- PR required with ≥ 1 approval
- CI must pass before merge
- Squash merge recommended

---

## 🧪 Testing — 80% Coverage Target

### Stack

- **Vitest** — Test runner (Jest-compatible API)
- **@testing-library/react** — Component testing
- **Coverage**: `@vitest/coverage-v8`

### Structure

```
tests/
├── health-check.test.ts        # App health check
├── lib/
│   ├── services/               # Service unit tests
│   └── utils/                  # Utility unit tests
└── integration/                # Integration tests
```

### Conventions

- One test file per source file
- `describe/it` syntax (no `test`)
- Descriptive test names: "should [expected behavior] when [condition]"
- No `any` types in tests

### Commands

```bash
npm run test           # Single run
npm run test:watch     # Watch mode
npm run test:coverage  # With coverage report
npm run heal           # Sentinel self-healing watcher
```

---

## 🪝 Pre-commit Hooks

### Husky + lint-staged

On every `git commit`:

1. **ESLint** runs on staged `*.ts`, `*.tsx` files
2. Commit is blocked if lint fails

### Setup

```bash
npx husky init
# .husky/pre-commit is already configured
```

---

## 🛡️ Sentinel — Self-healing Test Watcher

A custom Node.js script that:

- Spawns `npx vitest --watch`
- Parses failures in real-time
- Displays structured colored report
- Re-runs on file save

```bash
npm run heal  # Start sentinel
```

---

## 📏 Code Quality Standards

### TypeScript

- **Strict mode** enabled
- No `any` types (use `unknown` + type guard)
- All exported functions have JSDoc

### React

- Server Components by default
- Client Components only when needed (`"use client"`)
- Loading/error states always handled

### API Routes

- Zod validation on all inputs
- Standardized responses: `{ data, error }`
- Auth check on protected routes

---

## 🤖 AI Integration Standards

### .clinerules/

- Task classification: LOW / MEDIUM / HIGH risk
- Pre-validation before any file edit
- One-shot principle (minimal back-and-forth)

### Memory Bank

- Updated at every milestone
- `activeContext.md` at session start/end
- `progress.md` after each significant change
- `decisions.md` for architecture decisions

### MCP

- Postgres: Read-only queries for schema/data exploration
- GitHub: PR management, issue tracking
- Brave Search: Technical documentation lookup

---

## 🎯 Milestones

- [x] CI pipeline with lint + type-check + test + build
- [x] Pre-commit hooks (Husky + lint-staged)
- [x] Sentinel self-healing watcher
- [x] Memory Bank structure
- [x] .clinerules/ AI coding standards
- [x] MCP configuration templates
- [ ] 80% test coverage achieved
- [ ] Branch protection rules enforced
- [ ] Sentry error tracking integrated
- [ ] Production deployment pipeline
