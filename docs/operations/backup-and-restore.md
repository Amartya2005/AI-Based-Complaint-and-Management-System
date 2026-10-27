# Database Backup and Restore

Complaint records and assignment history are operationally important. A backup is useful only if restoration has been tested.

## Policy decisions
Define backup frequency, retention period, encryption, storage location, and recovery objectives before production launch. A development Docker volume is not a backup.

## Procedure outline
1. Use the approved MySQL/MariaDB mechanism to create a consistent backup.
2. Encrypt the backup at rest and restrict access to named operators.
3. Record timestamp, database version, migration level, and outcome.
4. Store the backup separately from the database host.
5. Restore into an isolated environment.
6. Verify row counts and representative complaint, department, assignment, and prediction records.
7. Record restore duration and discrepancies.

Never test restore by overwriting production. Do not place raw production dumps in GitHub issues, chat messages, or unprotected developer folders.
