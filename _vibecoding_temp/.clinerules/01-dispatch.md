# Dispatch — Task Classification

## Principle
Every task must be classified **before** editing. Risk level determines action mode.

## Levels

### LOW RISK — Fast Act Mode
- Localized change (1-2 files)
- Low and bounded impact
- Clear, unambiguous expected behavior
- Examples: fix typo, adjust style, correct label, add simple field

**Action**: implement directly, verify, deliver.

### MEDIUM RISK — Micro-Plan
- Multiple files impacted
- Bounded but multi-zone impact
- Moderate uncertainty on side effects
- Examples: new API route, new stateful component, modify existing service

**Action**:
1. List impacted files and planned changes (3 points max)
2. Identify main collateral risk
3. Implement incrementally

### HIGH RISK — Deep Plan
- Architecture, structural refactoring
- Auth, security, permissions
- Schema migration, breaking changes
- Infrastructure, deployment, prod config
- Critical dependencies (Next.js, database, payment)
- Cross-cutting changes (middleware, shared types)

**Action**:
1. Map complete impact
2. Propose detailed plan before any edit
3. Wait for validation if scope exceeds initial request
4. Implement in verifiable stages

## Conceptual Complexity Axis
Beyond technical risk, evaluate the **conceptual complexity** of the task:
- **Simple**: direct logic, single path → LOW
- **Moderate**: multiple cases, nested conditions → MEDIUM
- **High**: algorithmic, optimization, abstract modeling → HIGH even if few files

A task can be LOW in technical risk but HIGH in conceptual complexity → adjust reflection depth accordingly.

## Reclassification
If scope grows during execution:
- Reclassify immediately
- Adapt action mode
- Signal scope change to user