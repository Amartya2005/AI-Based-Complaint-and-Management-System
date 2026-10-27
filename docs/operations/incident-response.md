# Incident Response Runbook

Use this checklist for suspected unauthorized access, data exposure, sustained API failure, database outage, or a broken routing/escalation job.

## First response
1. Record alert time, observed impact, affected service, and incident owner.
2. Protect users and data first; disable a faulty optional integration if it is causing harm.
3. Preserve relevant logs and timestamps without unnecessary copies of complaint content.
4. Assess impact to authentication, authorization, database integrity, and confidentiality.
5. Communicate status through the institution's approved channel.

## Recovery
- Restore service only after the failure mode is understood or safely isolated.
- Rotate exposed credentials and revoke affected sessions when necessary.
- Verify complaint records and assignment state after database recovery.
- Add a regression test or monitoring check for the failure.

## After the incident
Document timeline, root cause, impact, mitigation, owners, and due dates. Avoid personal complaint details and secrets in the report unless strictly necessary and access-controlled.
