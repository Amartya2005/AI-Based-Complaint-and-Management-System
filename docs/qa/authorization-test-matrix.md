# Role-Based Authorization Test Matrix

Run with isolated student, staff, and admin users and at least two complaints owned by different students.

| Action | Student | Staff | Admin |
|---|---|---|---|
| List complaints | Own only | Assigned only | Institution scope |
| Read own complaint | Allow | Only if assigned | Allow |
| Read another student's complaint | Deny | Deny unless assigned | Allow |
| Assign a complaint | Deny | Deny unless explicitly permitted | Allow |
| Update assigned complaint status | Deny except supported user actions | Allow within policy | Allow within policy |
| Manage departments | Deny | Deny | Allow |

Confirm both list endpoints and detail endpoints enforce scope. UI hiding alone is not a passing authorization test. Assert the database is unchanged after rejected writes.