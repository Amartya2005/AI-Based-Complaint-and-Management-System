## Summary
Describe the user-visible or operational change and link the related issue.

## Change type
- [ ] Bug fix
- [ ] Feature
- [ ] Refactor
- [ ] Documentation
- [ ] Dependency or infrastructure change

## Scope and behavior
What changed, why is it needed, and which user roles or workflows are affected?

## Validation
- [ ] Backend tests run (include command and result)
- [ ] Frontend lint and production build run where relevant
- [ ] Manual smoke test completed where relevant
- [ ] Success, empty, and failure states considered
- [ ] Authorization and cross-user access cases checked
- [ ] External integrations are not required by deterministic tests

## Data and security
- [ ] No secrets, tokens, or real complaint data added
- [ ] Complaint details and credentials are not added to logs
- [ ] Authorization is enforced by the API, not only the UI
- [ ] File upload and download permissions remain restricted
- [ ] Database changes include a migration and rollback plan

## Release notes
List configuration changes, migration steps, operational risks, and rollback instructions.