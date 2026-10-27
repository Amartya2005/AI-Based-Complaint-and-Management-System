# API Error Response Guidelines

API errors should be predictable enough for the React client to explain the problem without exposing implementation details.

## Expected behavior
- 400: a well-formed request violates a business rule.
- 401: authentication is missing or invalid.
- 403: the authenticated actor lacks permission.
- 404: a resource is absent or intentionally concealed by access policy.
- 409: a state conflict, where that convention is used.
- 422: request-schema validation failure.
- 429: a configured rate limit is exceeded.
- 500: unexpected server failure; details remain in server-side logs.

Preserve existing endpoint conventions unless a versioned API change is approved.

## Response shape
Use a stable machine-readable error code and safe human-readable message where supported. Validation details should identify the field without echoing secrets or the entire complaint.

## Frontend handling
Distinguish validation errors from expired sessions and transient failures. Never show success when a request failed. Avoid automatic retries for non-idempotent submissions unless an idempotency strategy exists.
