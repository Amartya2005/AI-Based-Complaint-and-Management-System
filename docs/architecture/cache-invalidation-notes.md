# Cache Invalidation Expectations

CCMS uses cache helpers for selected reads and mutation flows. Cached values must never become an authorization boundary.

## Mutation points to review
- Complaint creation and status changes.
- Assignment and reassignment.
- Attachment upload or deletion when attachment metadata is cached.
- User or department changes that affect displayed complaint details.
- Logout and token blacklist operations.

## Rules
- Invalidate affected detail and list keys after a successful transaction, not before.
- Avoid caching permission-sensitive responses under keys that omit user or role scope.
- Treat cache failure as an operational condition; database authorization must still apply.
- Prefer bounded key patterns and avoid broad invalidation that can overload Redis.
- Add regression tests for stale status, stale assignment, and cross-user cache leakage.

Confirm actual cache key names in code before implementing invalidation changes.