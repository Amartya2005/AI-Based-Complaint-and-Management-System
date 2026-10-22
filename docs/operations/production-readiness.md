# Production Readiness Checklist

A successful local run is not proof of production readiness.

## Security
- [ ] Strong, unique signing secret configured outside source control.
- [ ] HTTPS enforced at the public edge.
- [ ] CORS allowlist contains only approved frontend origins.
- [ ] Role and ownership checks verified with negative tests.
- [ ] Dependency and secret scans reviewed.
- [ ] Error responses do not disclose stack traces or secrets.

## Reliability
- [ ] Database migrations reviewed and tested on staging.
- [ ] Backup and restore procedure demonstrated.
- [ ] Health checks distinguish process availability from dependency readiness.
- [ ] Timeouts and external inference failure paths are defined.
- [ ] Logs and alerts cover API errors, database failures, and scheduler failures.

## Data protection
- [ ] Privacy notice and retention rules approved.
- [ ] Production data is not copied into development without approved anonymization.
- [ ] Access to complaint details is restricted and auditable.

Record release owner, commit SHA, test evidence, known limitations, rollback plan, and approval date. Any unchecked critical control blocks release.
