# Secrets and Environment Handling

## Rules
- Keep real .env files, tokens, database passwords, JWT signing keys, and personal data out of Git.
- Maintain .env.example with placeholder values only.
- Generate a unique, high-entropy signing secret for each environment.
- Restrict database credentials to the permissions the application needs.
- Rotate any credential that was committed or exposed in logs. Removing it in a later commit does not revoke it.
- Avoid logging authorization headers, passwords, tokens, or connection strings.
- Never embed secrets in Vite client variables; client-side variables are public.

## Before a release
- [ ] Confirm secret files are ignored by Git.
- [ ] Scan the proposed diff for credentials and private URLs.
- [ ] Verify production values are injected through environment configuration or a secret manager.
- [ ] Disable debug mode and verbose exception output in production.
- [ ] Confirm secrets are not included in frontend bundles.

If a secret is exposed, revoke or rotate it first, assess access logs, then remove it from active code. History rewriting alone is not remediation.
