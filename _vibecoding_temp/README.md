# 🚀 Vibe Coding Starter Pack

> Industrialised starter pack for **Vibe Coding** — Next.js 16 + TypeScript + Vitest + Husky + CI/CD + MCP + Memory Bank + Cline Rules.
> **Clone & code.**

---

## ⚡ Quick Start

```bash
# 1. Clone the repo
git clone https://github.com/macourier/vibecoding-starter-pack.git my-project
cd my-project

# 2. Install dependencies
npm install

# 3. Copy environment variables
cp .env.example .env.local
# Fill in your API keys in .env.local

# 4. Setup Husky (pre-commit hooks)
npx husky init

# 5. Run dev server
npm run dev
```

---

## 🏗️ What's Included

| Category | Tool | Purpose |
|---|---|---|
| **Framework** | Next.js 16 (App Router) | React 19, Server Components, API Routes |
| **Language** | TypeScript (strict) | Full type safety |
| **Styling** | Tailwind 4 + shadcn/ui | Utility-first CSS, pre-built components |
| **Validation** | Zod | Schema validation (client + server) |
| **Testing** | Vitest | Unit tests with coverage |
| **CI/CD** | GitHub Actions | Lint → Type-check → Test → Build |
| **Pre-commit** | Husky + lint-staged | Auto lint on commit |
| **Sentinel** | Custom watcher | Self-healing test watcher (`npm run heal`) |
| **Memory** | Memory Bank | Structured project memory for AI agents |
| **Rules** | .clinerules/ | AI coding standards and workflows |
| **MCP** | Postgres, GitHub, Brave Search | AI tool integrations |

---

## 🔑 Environment Variables

Copy `.env.example` to `.env.local` and fill in:

| Variable | Required | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Supabase service role key |
| `NEXT_PUBLIC_SENTRY_DSN` | ❌ | Sentry error tracking |
| `ANTHROPIC_API_KEY` | ❌ | Claude AI provider |
| `OPENAI_API_KEY` | ❌ | OpenAI / Perplexity provider |
| `BRAVE_API_KEY` | ❌ | Brave Search MCP |

---

## 🧪 Commands

```bash
npm run dev          # Dev server
npm run build        # Production build
npm run lint         # ESLint
npm run test         # Vitest (single run)
npm run test:watch   # Vitest (watch mode)
npm run heal         # Sentinel — self-healing test watcher
npm run typecheck    # TypeScript type-check (no emit)
```

---

## 🤖 MCP (Model Context Protocol)

MCP servers extend AI capabilities. Configure in your MCP settings:

### Postgres (Supabase)
```json
{
  "mcpServers": {
    "postgres": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres", "postgresql://USER:PASS@HOST:5432/DATABASE"]
    }
  }
}
```

### GitHub
```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": { "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_YOUR_TOKEN" }
    }
  }
}
```

### Brave Search
```json
{
  "mcpServers": {
    "brave-search": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-brave-search"],
      "env": { "BRAVE_API_KEY": "BSA_YOUR_KEY" }
    }
  }
}
```

See `docs/mcp-setup.md` for detailed setup instructions.

---

## 📐 Project Structure

```
├── .clinerules/          # AI coding rules & workflows
│   ├── 00-core.md        # Core principles
│   ├── 01-dispatch.md    # Task classification (LOW/MEDIUM/HIGH)
│   ├── 02-session.md     # Memory bank management
│   ├── 03-environment.md # Stack, commands, protected zones
│   ├── 10-domain.md      # Domain-specific rules (template)
│   ├── 11-ai-pipeline.md # AI pipeline conventions
│   ├── 20-frontend.md    # React/Tailwind conventions
│   ├── 21-backend.md     # API/Services conventions
│   └── workflows/        # Reusable workflows
├── .github/workflows/    # CI/CD
│   └── ci.yml            # Lint → Type-check → Test → Build
├── .husky/               # Pre-commit hooks
├── memory-bank/          # Structured project memory
│   ├── projectbrief.md   # Mission & objectives
│   ├── productContext.md  # Product context
│   ├── systemPatterns.md  # Architecture patterns
│   ├── techContext.md     # Tech stack details
│   ├── activeContext.md   # Current session context
│   ├── progress.md        # Milestone tracking
│   ├── decisions.md       # Architecture decisions
│   ├── episodes.md        # Patterns & gotchas
│   └── glossary.md        # Project glossary
├── src/                  # Application code
│   ├── app/              # Next.js App Router
│   ├── components/       # React components
│   ├── lib/              # Services & utilities
│   ├── hooks/            # Custom React hooks
│   └── types/            # TypeScript types
├── tests/                # Test files
├── config/               # Configuration files
├── AGENTS.md             # AI agent entry point
├── sentinel.ts           # Self-healing test watcher
├── vitest.config.ts      # Vitest configuration
└── ROADMAP.md            # Quality standards roadmap
```

---

## 🛡️ Quality Standards

See [ROADMAP.md](./ROADMAP.md) for the full quality roadmap.

- ✅ **CI mandatory** — All PRs must pass lint + type-check + test + build
- ✅ **80% test coverage** target
- ✅ **`main` branch protected** — No direct pushes
- ✅ **Pre-commit hooks** — ESLint runs on staged files
- ✅ **Sentinel watcher** — Continuous test monitoring

---

## 📄 License

MIT — Use freely, credit appreciated.
