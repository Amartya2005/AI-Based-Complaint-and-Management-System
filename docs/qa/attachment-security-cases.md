# Attachment Security Acceptance Cases

Use small synthetic files only. Confirm current size and extension limits from application settings before asserting exact values.

- Unauthenticated upload is rejected.
- A user cannot download another user's private attachment unless authorized by complaint access rules.
- Upload exceeding configured size is rejected cleanly.
- Unsupported file type follows the configured allowlist policy.
- Missing attachment ID returns the documented not-found response.
- Deleted attachment metadata and stored file behavior remain consistent.
- File paths are resolved safely and cannot escape the intended storage directory.
- Filenames containing path separators or unusual Unicode are normalized safely.
- Failed uploads do not leave orphaned partial files.

Never use real student documents in automated tests.