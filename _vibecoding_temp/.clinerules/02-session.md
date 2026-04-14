# Session — Session Management & Memory

## Memory Bank (`memory-bank/`)
- **Stable**: `projectbrief.md`, `productContext.md`, `systemPatterns.md`, `techContext.md`
- **Active**: `activeContext.md`, `progress.md`
- **Learning**: `decisions.md`, `episodes.md`, `glossary.md`
- **Local (gitignored)**: `local.local.md`

## When to Update
- `activeContext.md`: at start/end of significant session
- `progress.md`: after each milestone
- `decisions.md`: when an architecture decision is made
- `episodes.md`: when a recurring pattern or pitfall is identified

## Format
- ISO 8601 timestamps
- Sections with markdown headers
- Concise, bullet points — but **add context when the why matters**

## Template `activeContext.md`
```markdown
# Active Context

## System State
- [YYYY-MM-DD] Global status: stable / in progress / unstable
- Active zones: files/modules currently being modified
- Attention points: identified risks, debts, known limits

## Current Session
- Goal: <one-line summary>
- Risk: LOW / MEDIUM / HIGH
- Impacted files: <list>

## Session Decisions
- <decision> → <reason>
```

## Documentation
- JSDoc on all exported functions
- README up to date for new modules
- `llms.txt` as entry point for AI agents