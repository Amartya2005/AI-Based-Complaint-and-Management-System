# Observability Signals

CCMS needs operational telemetry without turning logs into a second database of sensitive complaint data.

## Recommended signals
- HTTP request count, latency, and 4xx/5xx rates by route template.
- Database connection failures, query latency, and transaction errors.
- Authentication failures and authorization denials.
- Complaint creation and status-transition outcomes.
- Background priority scheduler last-success time and failure count.
- Routing inference latency, timeout count, invalid-output count, and fallback count.
- Redis availability and cache/blacklist operation failures where configured.

## Structured log fields
Prefer timestamp, severity, request ID, route template, outcome, duration, and a non-sensitive correlation ID. Do not log passwords, JWTs, authorization headers, full complaint descriptions, or raw model prompts by default.

Alert on sustained user impact, not a single transient error. Every alert should identify an owner, an actionable runbook, and a way to verify recovery.
