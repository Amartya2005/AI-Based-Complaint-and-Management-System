# Authorization Matrix

Use this matrix when adding endpoints or changing query filters. Backend authorization is authoritative; hiding a React button is not access control.

| Capability | Student | Staff | Admin |
|---|---|---|---|
| Submit complaint | Own submissions | Only if explicitly enabled | As policy permits |
| View complaint | Own complaints | Assigned complaints | Institution-wide scope |
| Change workflow status | Supported reopen/cancel actions only | Assigned complaints | Administrative actions |
| Assign/reassign staff | No | No, unless explicitly granted | Yes |
| View institution analytics | No | Authorized team scope only | Yes |
| Manage users/departments | No | No | Yes |

## Endpoint checklist
- Require authentication on every non-public endpoint.
- Check role and record ownership/assignment on the server.
- Apply authorization to list, detail, export, and analytics queries.
- Return a consistent 403 or 404 policy for inaccessible records without leaking existence.
- Never trust client-supplied user, role, department, or assignment IDs without checking them.
- Add negative tests for each role and cross-user access.

Preserve narrower permissions already enforced by the implementation until a reviewed policy change is approved.
