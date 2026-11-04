# Student and Staff User Journeys

This guide describes the expected day-to-day journeys for the three CCMS roles. It is a product-level reference, not a replacement for API authorization or the implemented state-transition rules.

## Student journey

1. Sign in with a student account.
2. Create a complaint with a clear title, description, and category. Select a department when the destination is known; otherwise allow the configured routing path to suggest one.
3. Review the submitted complaint and its current status and priority.
4. Return to the complaint list to follow progress. The student view must remain limited to complaints owned by the signed-in student.
5. Read assignment and status notifications in the notification center.
6. After resolution, submit the available staff feedback for that complaint.

**Completion signals:** the complaint is persisted once, its status is visible, updates are reflected in the student's own view, and feedback is available only when the complaint is eligible.

**Recovery cases:** show field-level validation for invalid submissions, a clear error when the request fails, and a useful pending/manual-review state when department routing cannot select an eligible staff member. Never show a success state for a failed API request.

## Staff journey

1. Sign in with an active staff account.
2. Open the assigned complaint queue and review the priority, category, department, and complaint details.
3. Open a complaint assigned to the signed-in staff member.
4. Move the complaint through a backend-approved status transition and add a concise remark when useful.
5. Confirm the updated status and history entry, then continue with the next assigned complaint.
6. Review personal feedback and rating summaries where the interface exposes them.

**Completion signals:** staff can see only their authorized assignments, successful transitions are reflected in history, and the student receives the corresponding notification.

**Recovery cases:** reject updates to complaints assigned to another staff member, preserve the prior status after a rejected transition, and make API failures visible without discarding the user's context.

## Administrator journey

1. Sign in with an administrator account.
2. Review institution-wide complaint queues and analytics.
3. Inspect new or pending complaints, confirm department routing, and assign or reassign to eligible active staff.
4. Monitor unresolved and high-priority complaints, including escalations.
5. Manage user and department records using the supported administrative workflows.
6. Use reports for operational review without exposing complaint details to people who do not need them.

**Completion signals:** assignments and reassignments are auditable, workload views reflect active cases, and administrative changes are reflected consistently across the application.

## Shared product rules

- The API is the authority for identity, role, ownership, assignment, and status-transition decisions.
- A hidden or disabled frontend control is not an authorization boundary.
- Model-generated routing is a suggestion constrained to existing database departments; it cannot override explicit student selection or access policy.
- Optional inference failure must not turn into a false complaint-submission failure. Use the configured fallback or manual-review workflow.
- Notifications are private to their recipient. Do not include credentials or unnecessary complaint content in operational logs.
- Use synthetic accounts and synthetic complaint text for demonstrations, screenshots, and automated tests.
