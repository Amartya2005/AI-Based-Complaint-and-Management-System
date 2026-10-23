# ML Fallback Contract

Machine-learning services improve routing and classification but must not become a single point of failure for basic complaint intake.

## Expected behavior
- Validate model outputs against known categories and department records.
- Handle missing model artifacts, invalid output, inference exceptions, and timeouts explicitly.
- Keep fallback behavior configured and visible in logs/metrics.
- Avoid storing raw prompts or full complaint descriptions in telemetry by default.
- Do not let a prediction override role checks, complaint ownership, or workflow state rules.
- Make fallback decisions reproducible with model/configuration version metadata.

## Validation
Test normal inference, unavailable model, malformed output, unknown label, timeout, and fallback-disabled configuration. The application should fail clearly if a required model is deliberately configured as mandatory; otherwise follow the documented fallback path.