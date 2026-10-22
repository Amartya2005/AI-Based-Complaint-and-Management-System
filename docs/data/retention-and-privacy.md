# Data Retention and Privacy

CCMS may hold sensitive descriptions of campus facilities, accommodation, staff conduct, or student circumstances. Collect and expose only what the workflow requires.

## Principles
- Show students their own complaints, staff their authorized assignments, and admins only the scope required by their role.
- Avoid copying complaint descriptions into logs, analytics events, model traces, or support tickets.
- Define retention periods for complaints, attachments if supported, audit records, and ML prediction logs with the institution's data owner.
- Apply retention rules consistently to database records, exports, backups, and derived datasets.
- Use synthetic or anonymized data in demos and automated tests.
- Document approved data-access, correction, and deletion processes.

Before production, the institution must approve the privacy notice, purpose, retention schedule, access policy, and third-party inference disclosures. This is an engineering checklist, not legal advice.
