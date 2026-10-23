# Department Routing Regression Cases

Test routing with known department rows and synthetic complaint descriptions.

- Explicit valid department selection is handled according to current routing policy.
- Keyword or model suggestion maps only to a known department.
- Unknown department labels never create arbitrary database rows.
- Empty or malformed model output takes the configured fallback path.
- Inference timeout does not corrupt complaint creation.
- Routing behavior is deterministic when configured inputs are unchanged.
- No available staff member is handled without an invalid assignment.
- Routing and assignment decisions are tested separately from authorization.

Assert both the resulting department ID and the absence of unexpected side effects.