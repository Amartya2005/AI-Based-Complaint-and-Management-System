# CCMS Staging Smoke Test

Run this checklist against an isolated staging environment before approving a release. Use synthetic accounts and complaint text only. Do not perform destructive tests against production or import live student data into staging.

## 1. Record the candidate

- [ ] Record the commit SHA and deployment/image version.
- [ ] Confirm the intended environment is staging.
- [ ] Record the database migration revision before and after deployment.
- [ ] Confirm a recent staging backup exists and its restore procedure is known.
- [ ] Confirm secrets are injected through environment configuration and are not present in the repository or frontend bundle.
- [ ] Confirm allowed browser origins match the staging frontend.

## 2. Run automated checks

From the repository root:

```bash
python -m pytest --tb=short -q
```

From the `client/` directory:

```bash
npm ci
npm run lint
npm run build
```

Record the actual command output. A skipped test suite or a build that was not run is not a pass.

## 3. Verify role journeys

Use one synthetic account for each role.

### Student
- [ ] Sign in and sign out.
- [ ] Submit a complaint with valid title, description, and category.
- [ ] Submit with an explicit department and verify the selection is respected.
- [ ] Submit without a department and verify the configured routing or manual-review fallback.
- [ ] View the new complaint and confirm the status and priority are visible.
- [ ] Confirm the student cannot view another student's complaint or notifications.

### Staff
- [ ] Sign in and confirm only assigned complaints are visible.
- [ ] Open an assigned complaint and perform an allowed status transition.
- [ ] Confirm the status-history entry and student notification.
- [ ] Attempt to update a complaint assigned to another staff account and confirm the API rejects it.

### Administrator
- [ ] Sign in and view the institution-wide queue and analytics.
- [ ] Assign a pending complaint to an active staff member.
- [ ] Reassign a complaint and confirm the new assignment is reflected.
- [ ] Confirm administrative user actions follow the documented deactivate/delete policy.

## 4. Verify files and notifications

- [ ] Upload a small file with an allowed extension and matching content type.
- [ ] Confirm an unsupported extension, disallowed content type, and oversized file are rejected.
- [ ] Confirm a user cannot download or delete another user's private attachment.
- [ ] Confirm each account sees only its own notifications.
- [ ] Mark a notification as read and verify the state remains after refresh.

## 5. Verify resilience and operations

- [ ] Exercise the configured department-routing fallback with the local model unavailable.
- [ ] Confirm a routing timeout or invalid model output does not create an arbitrary department.
- [ ] Confirm an optional inference outage does not make basic complaint intake unavailable.
- [ ] Verify database and Redis connectivity using the deployment's health checks.
- [ ] Review logs for authentication failures and server errors; ensure they contain no tokens or full complaint descriptions.
- [ ] Confirm the priority scheduler starts only in the intended worker process and reports failures.

## 6. Release decision

Record the tester, date, candidate SHA, environment, test results, open defects, and evidence location.

Do not approve release while a critical authorization, privacy, data-integrity, migration, backup, or complaint-submission check is failing. Document the rollback target and the operator responsible for executing it before deployment.
