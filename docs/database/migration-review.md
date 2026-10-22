# Database Migration Review Checklist

Use this checklist for SQLAlchemy model changes and schema migrations.

## Review
- [ ] Migration has a clear, descriptive purpose.
- [ ] Existing rows remain valid or have a deliberate backfill.
- [ ] Foreign keys and indexes match query and integrity requirements.
- [ ] Nullable-to-non-null changes include a safe data migration.
- [ ] Large table changes have an understood lock and runtime impact.
- [ ] Downgrade behavior is documented where supported.
- [ ] Application code works during the intended rollout sequence.

## Validation
Apply migrations to a disposable database containing representative records. Test both a fresh setup and an upgrade from the current supported schema. Verify complaint-to-department and complaint-to-staff relationships and prediction-log references where applicable.

Back up production before a high-risk migration and define recovery steps. Do not edit an already-applied migration to change its historical meaning; create a new migration instead.
