# Testing Quick Start

The backend test suite uses `pytest` with `pytest-mock` for isolated service-level tests.

## Run the unit suite

From the repository root:

```bash
pytest tests/unit -q
```

To run one service test file:

```bash
pytest tests/unit/test_user_service.py -q
```

## What the user-service tests cover

The current unit tests exercise several important account-management paths:

- duplicate email and college ID rejection
- invalid department handling
- password hashing during user creation
- transaction rollback after database integrity errors
- role-based user filtering
- user deletion and related-record cleanup
- safe handling of deletion constraint failures
- user deactivation
- lookup by email
- authentication of active users

## Adding a regression test

When fixing a service bug, add the smallest test that reproduces the failing behavior before changing the implementation. Keep database interactions mocked for unit tests so failures stay focused on service logic rather than local database state.

For a new test file, follow the existing naming convention:

```text
tests/unit/test_<service_name>.py
```

Run the focused test first, then the full unit suite before committing.
