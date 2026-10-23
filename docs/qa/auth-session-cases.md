# Authentication and Session Test Cases

- Valid credentials return the documented token response.
- Incorrect credentials fail without revealing whether a user account exists.
- Expired, malformed, and incorrectly signed JWTs are rejected.
- Logout revokes the current token when blacklist storage is configured.
- Redis outage behavior matches the explicitly chosen security policy.
- Protected routes reject requests without a valid token.
- Role changes are reflected according to token/session invalidation policy.
- Passwords and tokens never appear in logs or API error messages.
- Rate limits on sensitive authentication endpoints return a controlled error.

Keep test credentials disposable and unique to CI.