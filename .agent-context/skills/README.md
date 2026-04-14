# Skill Platform

The skill platform is the internal skill system for Agentic-Senior-Core.

## Design Goals
- Unify skill content from benchmark repositories into one governed platform.
- Make `advance` the default operating tier.
- Keep `standard` only as a compatibility fallback.
- Require evidence, validation, and release gates for every skill pack.

## Tier Model

### standard
- Compatibility mode only.
- Minimal guidance.
- No default status for new work.

### advance
- Default operating tier.
- Efficient, opinionated, and production-aware.
- Used for normal feature delivery.

### expert
- For complex architecture, integration, and critical refactors.
- Requires stronger evidence and review depth.

### above
- For release-critical, cross-domain, or enterprise governance work.
- Requires full evidence bundle and explicit owner signoff.

## Domain Packs
- [Frontend](frontend/README.md)
- [Backend](backend/README.md)
- [Fullstack](fullstack/README.md)
- [CLI](cli/README.md)
- [Distribution](distribution/README.md)
- [Review Quality](review-quality/README.md)

## Folder Structure
```text
.agent-context/skills/
├── README.md
├── index.json
├── frontend/
├── backend/
├── fullstack/
├── cli/
├── distribution/
└── review-quality/
```

Each domain folder has its own README plus topic-level docs so the platform can scale like a curated skills library.

## Benchmark Sources
- sickn33/antigravity-awesome-skills
- github/awesome-copilot
- MiniMax-AI/skills

## Platform Rules
- Every skill pack must define purpose, inputs, outputs, validation, evidence, and fallback.
- Every skill pack must state the default tier it targets.
- Every release must include a skill parity check for the configured tiers.
- Every deviation from the default tier must be justified in the evidence bundle.