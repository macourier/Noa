# Prompts: Initialize Project

> Copy-paste one of these prompts to your AI agent (Cursor, Windsurf, Copilot, Antigravity) right after cloning this repository.
> V1.4 recommendation: run `bunx @fatidaprilian/agentic-senior-core init` first to compile dynamic governance context.

---

## Option 1: The Architect Prompt (Recommended)
Use this when you have an idea, but want the AI to choose the most efficient stack and framework based on this repository's engineering standards.

```text
I want to build a [DESCRIBE YOUR PROJECT AND MAIN FEATURES HERE].

Context: You are a Principal Software Architect operating in a workspace with strict engineering standards.

Step 1: Context Gathering
1. Read `AGENTS.md` to understand your role and available knowledge base.
2. Scan all files in `.agent-context/rules/` to understand our mandatory engineering laws.
3. Review the available technology stacks in `.agent-context/stacks/` and blueprints in `.agent-context/blueprints/`.

Step 2: Architecture Proposal
Based strictly on my project description and our repository's existing rules (especially `efficiency-vs-hype.md`):
1. Propose the most efficient technology stack from our approved profiles.
2. Explain WHY this stack is the best choice for this specific project.
3. Draft a high-level architecture plan.

Do not write any application code yet. Write your proposal and wait for my approval. Once I approve, you will scaffold the project using the relevant blueprint.
```

---

## Option 2: The Direct Blueprint Prompt
Use this when you already know exactly which framework you want to use from the available blueprints.

```text
I want to build [PROJECT NAME].

Before writing any code:
1. Read `AGENTS.md` to understand your role.
2. Read ALL files in `.agent-context/rules/` to understand our engineering standards.
3. Read `.agent-context/stacks/[STACK].md` for language-specific guidelines.
4. Read `.agent-context/blueprints/[BLUEPRINT].md` for the project structure.

Now scaffold the initial project structure following the blueprint exactly:
- Create all directories and files from the blueprint
- Set up the environment config and validation (e.g., Zod, Pydantic, FluentValidation)
- Set up the error handling foundation (base error class + global handler)
- Set up the logger
- Create a health check endpoint
- Initialize the ORM/Database connection

Every file MUST follow the naming conventions from rules/naming-conv.md.
Every module MUST follow the architecture from rules/architecture.md.
Every dependency MUST be justified per rules/efficiency-vs-hype.md.
```

---

## Available Stacks & Blueprints Reference

### Stacks (`[STACK].md`)
- `typescript`
- `python`
- `java`
- `php`
- `go`
- `csharp`
- `rust`
- `ruby`

### Blueprints (`[BLUEPRINT].md`)
| Blueprint | Use When |
|-----------|----------|
| `api-nextjs` | Next.js App Router API project |
| `nestjs-logic` | NestJS backend service |
| `fastapi-service` | Python FastAPI backend service |
| `laravel-api` | PHP Laravel 13 API |
| `spring-boot-api`| Java Spring Boot 4 API |
| `go-service` | Go chi HTTP service |
| `aspnet-api` | C# ASP.NET Minimal API |
| `ci-github-actions`| GitHub Actions CI/CD pipeline |
| `ci-gitlab`      | GitLab CI/CD pipeline |
| `observability`  | OpenTelemetry stack |
| `graphql-grpc-api` | GraphQL / gRPC API definitions |
| `infrastructure-as-code` | Infrastructure as Code (Terraform | Pulumi) |
| `kubernetes-manifests` | Kubernetes manifests structure |
