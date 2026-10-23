# CCMS Release Checklist

## Before release
- [ ] Review the diff and linked issues.
- [ ] Run backend tests and frontend lint/build.
- [ ] Review dependency and secret-scan output.
- [ ] Test role/ownership boundaries.
- [ ] Review migrations against a staging database.
- [ ] Confirm required environment variables and secrets.
- [ ] Confirm privacy notice, retention policy, and support contact.
- [ ] Verify health checks, logs, alerts, backups, and restore instructions.

## Deployment
- [ ] Record release version and commit SHA.
- [ ] Apply migrations using the approved procedure.
- [ ] Deploy using the documented rollout method.
- [ ] Run smoke tests with synthetic records.
- [ ] Monitor error rate, latency, and scheduler health.

## Rollback
- [ ] Identify the previous known-good version.
- [ ] Confirm whether a database rollback is safe or a forward fix is required.
- [ ] Record the decision and communicate impact.