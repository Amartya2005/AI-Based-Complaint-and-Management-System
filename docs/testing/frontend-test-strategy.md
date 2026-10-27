# Frontend Test Strategy

The React + Vite client should make complaint handling understandable and resilient without duplicating backend policy.

## Critical journeys
1. Student signs in, submits a complaint, and sees a validation result.
2. Student opens only their own complaint and sees its current status.
3. Staff sees assigned complaints and attempts a permitted status transition.
4. Admin reviews pending complaints and assigns or reassigns them.
5. A failed request shows a recoverable error rather than a misleading success state.

## Component checks
- Required fields show clear validation.
- Loading states prevent accidental duplicate submissions.
- Empty lists, API errors, and expired sessions have explicit states.
- Status labels are consistent across list and detail views.
- Keyboard focus remains visible and dialogs work without a mouse.
- Sensitive controls are hidden for unauthorized roles, while the API remains the final authorization boundary.

## Manual smoke test
Run the client against a local backend with representative student, staff, and admin accounts. Verify the browser console has no uncaught errors and the network panel contains no unexpected repeated requests.
