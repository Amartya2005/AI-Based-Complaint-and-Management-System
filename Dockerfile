# =============================================================================
# Multi-stage Dockerfile for CCMS FastAPI backend
# =============================================================================

# ---- Builder stage ----
FROM python:3.11-slim AS builder

WORKDIR /app

# Install build dependencies (for packages that need compilation, e.g. some mysqlclient fallbacks, but pymysql is pure)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

# Install deps into a target dir for easy copy (or use --user)
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

# ---- Runtime stage ----
FROM python:3.11-slim AS runtime

WORKDIR /app

# Create non-root user for security
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Copy installed packages from builder
COPY --from=builder /install /usr/local

# Copy application code (respect .dockerignore)
COPY . .

# Ensure runtime dirs exist (will be volumes in compose for uploads/models)
RUN mkdir -p /app/uploads /app/app/ml/models && \
    chown -R appuser:appuser /app

# Drop privileges
USER appuser

EXPOSE 8000

# Production uvicorn: no --reload, multiple workers
# Note: --workers 2 (or use $WEB_CONCURRENCY). For containers often 1 + gunicorn/uvicorn workers tuned to CPU.
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
