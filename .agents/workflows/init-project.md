---
description: Initialize a new project using Agentic-Senior-Core blueprints and engineering standards
---

// turbo-all

## Workflow: Initialize Project

1. Read all rule files from `.agent-context/rules/` to understand engineering standards.

2. Read the language-specific profile from `.agent-context/stacks/` based on the project's tech stack.

3. Read the chosen blueprint from `.agent-context/blueprints/` (e.g., `api-nextjs.md` or `nestjs-logic.md`).

4. Scaffold the complete project structure following the blueprint exactly:
   - Create all directories and files
   - Set up strict `tsconfig.json` (all flags from `stacks/typescript.md`)
   - Create `.env.example` with placeholder values
   - Set up Zod-validated environment config
   - Set up error handling foundation (base error class + global handler)
   - Set up structured logger (pino)
   - Create a `/health` endpoint
   - Initialize the ORM with initial schema

5. Verify every file follows `rules/naming-conv.md` naming conventions.

6. Verify the architecture follows `rules/architecture.md` layer separation.

7. Run the PR checklist from `.agent-context/review-checklists/pr-checklist.md` as a final quality gate.
