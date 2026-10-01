# Local Environment Checklist

Use this checklist before debugging application behavior locally.

## Supporting services

- MySQL/MariaDB is running and reachable with the configured credentials.
- Redis is running when blacklist and caching behavior is being exercised.
- The development services are healthy before starting the FastAPI process.

## Backend

- The virtual environment is activated.
- Dependencies from `requirements.txt` are installed.
- The `.env` file exists and contains the required database and application secrets.
- FastAPI is running on port `8000` unless another port is intentionally configured.

## Frontend

- Node.js dependencies are installed under `client/`.
- The Vite development server is running on port `5173` by default.
- The frontend is pointing at the intended backend API.

For the canonical commands and port assignments, see [TESTING_QUICKSTART.md](TESTING_QUICKSTART.md) and [LOCAL_PORTS.md](LOCAL_PORTS.md).
