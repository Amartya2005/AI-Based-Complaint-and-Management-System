# API Contract Smoke Checks

Use the local OpenAPI page and current schema definitions as the contract source.

1. Confirm /docs loads in development.
2. Submit an unauthenticated request to a protected endpoint and verify the documented error envelope.
3. Submit malformed data and inspect field-level validation details.
4. Create a complaint with a student account and confirm the response schema.
5. Fetch the complaint as its owner and as an unrelated user.
6. Attempt an invalid status transition and confirm no mutation.
7. Verify list sorting accepts documented values and handles unknown values predictably.
8. Confirm unexpected server errors do not expose stack traces or credentials.

Capture status codes and redacted response examples when a contract changes.