# Environment Variable Inventory

This page is an inventory template. The current configuration classes and .env.example remain authoritative for actual names and defaults.

| Variable / group | Purpose | Handling |
|---|---|---|
| Database URL | SQLAlchemy database connection | Secret; never log |
| Secret key | JWT signing / application security | High-entropy secret, unique per environment |
| Redis URL | Cache and token blacklist connectivity | Treat credentials as secret |
| Allowed origins | Browser CORS policy | Explicit origin allowlist |
| App environment / debug | Runtime mode and diagnostics | Production must not expose debug traces |
| ML model path / fallback | Classification configuration | Validate paths and define fallback behavior |
| Priority interval | Scheduler cadence | Validate positive, reasonable interval |
| Email / notification settings | Optional delivery integrations | Keep provider credentials in secret storage |

For each variable, document type, required/optional status, safe default, environment scope, and failure behavior before introducing it. Do not copy real environment values into this document.