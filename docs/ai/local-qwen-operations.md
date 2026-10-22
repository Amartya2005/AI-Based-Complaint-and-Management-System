# Local Qwen Routing Operations

This runbook covers the optional Ollama-backed local Qwen department-routing path.

## Before testing
- Install and start Ollama on the development machine or approved inference host.
- Pull the exact model tag configured by the application.
- Verify the backend's configured base URL and timeout.
- Confirm target department records exist in the database.
- Use synthetic complaint examples for development and evaluation.

## Failure behavior
Validate model output against known department records. Empty output, malformed JSON, unknown labels, timeouts, and model-process failures must follow the safe fallback path. Complaint intake should not fail solely because inference is unavailable.

## Diagnostics
Check model availability, backend logs, request timeout, and output validation separately. Avoid logging full complaint text. Record model tag and routing outcome so behavior can be reproduced.

Evaluate a new model tag on a held-out dataset before switching defaults, and keep the previous known-good configuration for rollback.
