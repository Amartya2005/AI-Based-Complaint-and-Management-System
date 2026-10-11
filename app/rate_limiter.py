"""Shared Redis-backed rate limiter for all CCMS API workers.

Nginx overwrites X-Real-IP with the client's address. The backend services are
internal to the Docker network, so this header is trusted only behind that proxy.
Redis makes counters shared across backend instances; in-memory fallback keeps
local development available if Redis temporarily disconnects.
"""
from __future__ import annotations

import os
from typing import Any

from slowapi import Limiter


def client_ip_key(request: Any) -> str:
    """Use the proxy-provided client IP, not the shared Nginx container IP."""
    forwarded_ip = request.headers.get("x-real-ip")
    if forwarded_ip:
        return forwarded_ip.strip()
    client = getattr(request, "client", None)
    return getattr(client, "host", None) or "unknown"


limiter = Limiter(
    key_func=client_ip_key,
    storage_uri=os.getenv("REDIS_URL", "memory://"),
    default_limits=[os.getenv("RATE_LIMIT_DEFAULT", "100/minute")],
    headers_enabled=True,
    in_memory_fallback_enabled=True,
)
