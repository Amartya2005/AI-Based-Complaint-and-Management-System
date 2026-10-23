# Complaint Submission Acceptance Cases

Use synthetic accounts and synthetic complaint text.

| Case | Input / condition | Expected outcome |
|---|---|---|
| Valid submission | Authenticated student, valid title and description | Created response and persisted complaint |
| Missing title | Title omitted | Validation error; no record created |
| Blank title | Whitespace-only title | Rejected after normalization |
| Blank description | Whitespace-only description | Rejected after normalization |
| Wrong role | Staff or admin calls student-only endpoint | Forbidden response |
| Unauthenticated | No valid token | Unauthorized response |
| Invalid category | Category outside schema enum | Validation error |
| Optional department | Valid department selected | Valid department ID stored |
| Unknown department | Non-existent department ID | Safe validation/business error |
| Repeated submit | User double-clicks submit | UI prevents accidental duplicate; API behavior remains documented |

For every rejected case, verify that no partial complaint row or misleading success notification is produced.