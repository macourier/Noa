# Rollback

Tier: EXPERT

Rollback is a mandatory release capability, not an afterthought.

## Rollback Readiness

- Define rollback trigger conditions before release.
- Keep previous stable artifact available for immediate redeploy.
- Preserve migration rollback scripts for data-affecting changes.

## Rollback Flow

1. Detect failure signal (error spike, failed SLO, functional regression).
2. Freeze new rollout.
3. Re-deploy previous known-good version.
4. Verify health checks and key journeys.
5. Publish incident summary with root-cause owner.

## Data Change Safety

- Use backward-compatible migrations for forward and rollback paths.
- Avoid destructive schema operations in same release as code cutover.
- Validate rollback on staging with production-like data shape.

## Review Checklist

- [ ] Rollback plan documented and tested.
- [ ] Previous release artifact retained.
- [ ] Data migration rollback path verified.
- [ ] Health checks confirm rollback success.