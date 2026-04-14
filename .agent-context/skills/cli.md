# CLI Skill Pack

Default tier: `advance`

## Purpose
Create smart command-line workflows that guide users efficiently and safely.

## In Scope
- Interactive initialization and upgrade flows
- Safe defaults and confirmation steps
- Machine-readable output for automation
- Validation and self-healing hooks
- Cross-platform shell behavior
- Preset ergonomics and operational telemetry outputs

## Must-Have Checks
- Explicit command help and examples
- Deterministic output format for automation
- Safe destructive-action guards
- Validation before mutation
- Exit codes reflect success and failure clearly
- Preset catalog remains discoverable and tested in smoke tests

## Evidence
- CLI smoke tests
- Machine-readable report output
- Upgrade dry-run output
- Cross-platform execution notes
- Weekly governance report references CLI trust tier and release posture

## Fallback
- Standard mode can remain available for compatibility, but advance is the default user experience.