# Department Routing Contract

CCMS departments include CSE, Mechanical, ECE, EEE, B department, Hostel, and Admin. The database is the source of truth for valid departments.

## Routing rules
1. Normalize candidate labels before matching (trim whitespace and compare case-insensitively).
2. Resolve the candidate to an existing department record; never create a department from free-form model output.
3. If confidence is low, output is invalid, or inference is unavailable, use the configured fallback/manual-review path.
4. Keep complaint text unchanged. Store routing rationale separately from user-provided content.
5. Log prediction metadata without secrets or unnecessary copies of complaint text.
6. Treat model output as untrusted input; it must not override authorization or assignment policy.

## Required tests
- Exact match and case/whitespace normalization.
- Unknown department, empty output, and malformed output.
- Model timeout or process failure.
- Fallback when no valid department is returned.
- No database mutation when routing fails.

Local Qwen/Ollama routing is optional. Complaint submission should remain usable when the model is offline, with a safe fallback or manual review.
