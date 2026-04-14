# Compatibility

Tier: ADVANCE

Compatibility policy prevents shipping builds that break on supported runtimes or tooling ecosystems.

## Compatibility Matrix

Define supported combinations explicitly:
- Runtime versions (Node, Python, Java, etc.)
- OS/platform scope
- IDE/editor integration versions
- Dependency constraints

## Gate Strategy

- Validate package against supported runtime matrix in CI.
- Block release on unsupported runtime regressions.
- Mark deprecated support windows and removal timeline.

## Breaking Change Protocol

- Major version for incompatible behavior.
- Migration notes for changed defaults.
- Transitional compatibility period when feasible.

## Review Checklist

- [ ] Supported runtime matrix is current and tested.
- [ ] Incompatible changes are versioned correctly.
- [ ] Migration notes exist for user-impacting changes.
- [ ] CI verifies compatibility before publish.