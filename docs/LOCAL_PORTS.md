# Local Development Ports

Keep the two development servers on separate ports:

| Service | Port | URL |
| --- | ---: | --- |
| FastAPI backend | 8000 | `http://localhost:8000` |
| Vite frontend | 5173 | `http://localhost:5173` |

Start the backend with:

```bash
uvicorn app.main:app --reload --port 8000
```

Start the frontend from `client/` with:

```bash
npm run dev
```

FastAPI exposes Swagger UI at `http://localhost:8000/docs`.
