# =============================================================================
# Multi-stage Dockerfile for CCMS React + Vite frontend (served by Nginx)
# =============================================================================

# ---- Build stage ----
FROM node:20-alpine AS builder

WORKDIR /app

# Install deps
COPY package*.json ./
RUN npm ci --silent

# Copy source and build
COPY . .
RUN npm run build

# ---- Runtime stage (Nginx) ----
FROM nginx:alpine AS runtime

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy built React app
COPY --from=builder /app/dist /usr/share/nginx/html

# NOTE: Custom nginx.conf is provided at runtime via volume mount in docker-compose.prod.yml
# (nginx image default.conf will be overridden by ./nginx/nginx.conf:/etc/nginx/conf.d/default.conf:ro)
# This keeps the frontend image lean and config external (good for env-specific proxies).

# Expose HTTP
EXPOSE 80

# Healthcheck (simple)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
