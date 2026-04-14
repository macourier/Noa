# Backend Engineering Skills

The backend domain covers server-side architecture, business logic, data access patterns, error handling, and operational concerns. Content consolidated from **antigravity-awesome-skills**, **awesome-copilot**, and **MiniMax-AI/skills**, with supercharging improvements ("above the line" automation and enforcement).

## Topics

- **[architecture.md](architecture.md)** - Layered design (Transport->Service->Repository), monolith vs microservices, SoC patterns, dependency management, strangler fig migrations
- **[validation.md](validation.md)** - Input sanitization, schema validation at API boundary, parameterized queries, typed errors
- **[data-access.md](data-access.md)** - Database design (3NF), query optimization (N+1 detection), safe zero-downtime migrations, indexing strategy
- **[errors.md](errors.md)** - Typed error codes, recovery patterns, debugging protocols, logging + correlation IDs

## What Makes Ours Different

- Layered Architecture (awesome-copilot) + Microservices Decision Framework (antigravity) + Project Structure (minimax)
- Dependency Auditor (ABOVE LINE) - Detect circular dependencies and enforce Transport->Service->Repository direction
- Zero-Downtime Migration Validator (ABOVE LINE) - Scan migrations, flag risky patterns, and suggest remediation
- Secrets Detector (ABOVE LINE) - Static scan for hardcoded API keys and database passwords

## Recommended Reading Order

1. `architecture.md` - Understand mental models (EXPERT tier)
2. `validation.md` - Protect at boundaries (ADVANCE tier)
3. `data-access.md` - Query strategy (EXPERT tier)
4. `errors.md` - Error handling pipeline (ADVANCE tier)

Then run:
```bash
npm run validate            # Ensure tier structure
npm test                    # Verify examples compile
agentic-senior-core skill backend --tier expert  # See consolidated content
```

## Tier Defaults per Topic

| Topic | Default Tier | Focus |
|-------|--------------|-------|
| architecture | EXPERT | Layering, dependencies, monolith->microservices migration |
| validation | ADVANCE | Boundary protection, Zod/Pydantic examples |
| data-access | EXPERT | 3NF design, N+1 patterns, safe migrations, indexed FKs |
| errors | ADVANCE | Typed codes, recovery, correlation IDs, logging |

## Comparative Coverage vs Benchmarks

| Aspect | antigravity | awesome-copilot | MiniMax | Ours |
|--------|-------------|-----------------|---------|------|
| Layered Architecture | Medium | High | Medium | High + policy enforcement |
| Monolith to Microservices | High | Medium | Medium | High + migration strategy |
| Database Design | Medium | High | Medium | High + guardrails |
| Error Handling | High | Medium | Medium | High + typed recovery path |
| Automation Tools | None | None | None | Dependency auditor, migration validator, secrets scanner |

## How to Use

**For init workflow:**
```bash
agentic-senior-core init --stack typescript --blueprint api-nextjs
# Activates: frontend, fullstack, backend, cli skills
# Default tier: advance
```

**For explicit skill selection:**
```bash
agentic-senior-core skill backend --tier expert
# Outputs: architecture + validation + data-access + errors at EXPERT level
```

**For skill reference in .cursorrules:**
Content from this domain automatically includes in `.cursorrules` when activated.