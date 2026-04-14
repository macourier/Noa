# Technical Context

## Stack
| Layer | Technology | Version |
|---|---|---|
| Runtime | Node.js | 20 LTS |
| Framework | Next.js | 16 |
| UI | React | 19 |
| Language | TypeScript | 5.7+ |
| Styling | Tailwind CSS | 4 |
| Components | shadcn/ui | latest |
| Database | Supabase (Postgres) | - |
| Testing | Vitest | 3 |
| Validation | Zod | 3.23+ |
| CI/CD | GitHub Actions | - |

## Development Setup
```bash
npm install
cp .env.example .env.local
npm run dev
```

## Environment Variables
See `.env.example` for complete list.

## Key Dependencies
- `@supabase/supabase-js` — Database client
- `zod` — Schema validation
- `next` — Framework
- `vitest` — Testing
