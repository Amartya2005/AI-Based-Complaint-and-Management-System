# Complaint Lifecycle Contract

This document defines the lifecycle contract for the College Complaint Management System (CCMS). Keep backend validation, frontend labels, analytics, and escalation jobs aligned.

## Principles
- A complaint has one current status; status changes must be validated by the backend.
- Only authenticated users with the relevant role and relationship to a complaint may change it.
- Accepted transitions should record the actor, timestamp, and required resolution or rejection note.
- Failed transitions must leave the stored complaint unchanged.
- Automated priority escalation is not the same as a staff status transition.

## Suggested transition matrix

| Current state | Allowed next state | Actor / condition |
|---|---|---|
| Submitted / Pending | Assigned | Admin or authorized routing service |
| Assigned | In Progress | Assigned staff member |
| In Progress | Resolved | Assigned staff member, with resolution details |
| Resolved | Reopened | Student or admin, if reopening is supported |
| Any non-terminal state | Cancelled | Only if policy permits it |

Treat this as a review contract, not permission to bypass existing API rules. Confirm exact enum names before changing them.

## Acceptance checks
- Unknown statuses and disallowed transitions are rejected.
- A rejected transition does not mutate the record.
- Unrelated students and unassigned staff cannot update a complaint.
- Successful transitions preserve an auditable actor and timestamp.
- Tests cover each allowed edge and at least one rejected edge.
