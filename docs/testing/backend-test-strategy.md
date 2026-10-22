# Backend Test Strategy

Test FastAPI at three levels: pure logic, API behavior, and database integration.

## Unit tests
Cover classification normalization, priority calculation, allowed status transitions, routing-result validation, and assignment selection without external services.

## API tests
Cover authentication, role-based access, validation errors, complaint creation, status updates, assignment permissions, and response shapes. Use isolated test data and override dependencies rather than contacting production services.

## Integration tests
Exercise SQLAlchemy persistence, transaction rollback, department lookup, and migration compatibility against a disposable database. Redis-dependent behavior should test configured and unavailable paths where applicable.

## Test hygiene
- Tests must not depend on execution order.
- Use deterministic inputs for priority and classification tests.
- Avoid live LLM calls in the default CI suite.
- Assert HTTP status and important response fields.
- For rejected operations, assert database state did not change.
- Add a regression test for each production bug.

Run documented lint, test, and build commands before merging. A skipped suite is not a passing suite.
