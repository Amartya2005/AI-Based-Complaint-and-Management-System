# Local Development Workflow

## Prerequisites
- A Python version supported by the project's dependencies.
- Node.js and npm for the React + Vite client.
- Docker Compose if using the documented MySQL and Redis development services.
- Ollama only when testing the optional local Qwen routing path.

## Start services
Follow the current quick-start commands in README.md and docker-compose.dev.yml. Copy .env.example to .env and replace placeholders with local-only values. Never use production data for development.

## Suggested order
1. Start database and Redis services.
2. Install Python dependencies from requirements.txt.
3. Configure environment variables and initialize the database using the repository's documented procedure.
4. Start FastAPI with the documented Uvicorn entry point.
5. Install client dependencies from client/ and start Vite.
6. Open API docs and frontend, then exercise a basic complaint submission.

## Troubleshooting
- Database errors: verify host, port, credentials, and container health.
- Token revocation/cache failures: verify Redis connectivity and configuration.
- Client requests failing: check API base URL and CORS configuration.
- Local routing unavailable: confirm Ollama is running and the configured model is installed. Core API startup should not depend on inference unless explicitly configured.
