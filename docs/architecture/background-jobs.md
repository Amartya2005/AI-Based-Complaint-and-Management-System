# Background Job Operational Contract

CCMS runs periodic priority recalculation and may run a scheduled ML retraining job. Background work needs explicit lifecycle and failure behavior.

## Requirements
- Start jobs once per application process and stop them cleanly during shutdown.
- Ensure each job closes database sessions in a guaranteed cleanup block.
- Log start, completion, duration, and failures without complaint descriptions or credentials.
- Prevent overlapping runs if a job can exceed its interval.
- Make job behavior safe to retry where possible.
- Define how multiple API workers avoid duplicate scheduler instances.
- Expose telemetry to identify stale or repeatedly failing jobs.

Before changing job cadence, measure runtime and database load in staging. Do not report a scheduled job as healthy solely because the API process is healthy.