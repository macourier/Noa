# Safety and Telemetry

Tier: ADVANCE

CLI safety telemetry captures operational signals that help maintainers detect drift, reduce onboarding failures, and enforce release quality.

## Signal Categories

Capture and review machine-readable CLI signals:

- Validation and release-gate status.
- Preflight failure categories.
- Rollback trigger frequency.
- Preset usage distribution across onboarding sessions.

## Output Contract

Telemetry reports should remain automation-friendly:

- Stable JSON shape.
- ISO timestamps.
- Explicit status fields.
- Actionable blocker summary.

Human-facing logs can remain concise, but automation payloads should preserve full diagnostic details.

## Governance Use Cases

- Weekly maintainership report generation.
- Detecting repeated onboarding failures caused by conflicting local files.
- Tracking whether preset expansion improves adoption.
- Confirming rollback operations remain low-frequency and controlled.

## Review Checklist

- [ ] Safety signals are emitted in machine-readable format.
- [ ] Preset and failure telemetry are captured consistently.
- [ ] Operational reports include blocker summaries.
- [ ] Telemetry output is suitable for CI artifact upload.
