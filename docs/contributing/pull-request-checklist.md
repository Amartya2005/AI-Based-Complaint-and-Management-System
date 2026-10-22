# Pull Request Checklist

Before requesting review for a CCMS change:

## Correctness
- [ ] The change solves one clearly stated problem.
- [ ] Role and ownership rules are enforced by the backend.
- [ ] Failure and empty states are handled.
- [ ] Database changes include a reviewed migration.
- [ ] Routing and priority behavior has regression tests where relevant.

## Quality
- [ ] Tests, lint, and build checks were run where available.
- [ ] No secrets, personal data, database dumps, or generated artifacts were added.
- [ ] API changes and environment variables are documented.
- [ ] UI changes work on narrow screens and with keyboard navigation.
- [ ] Logs avoid full complaint text and credentials.

## Review notes
Describe behavior before and after, list test commands and outcomes, identify migration or configuration requirements, and call out known limitations. Never claim a check passed if it was not run.
