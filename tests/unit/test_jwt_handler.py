from datetime import timedelta

import pytest
from fastapi import HTTPException

from app.auth.jwt_handler import create_access_token, decode_token


def test_access_token_round_trip_preserves_claims():
    token = create_access_token({"sub": "student-123", "role": "STUDENT"})

    payload = decode_token(token)

    assert payload["sub"] == "student-123"
    assert payload["role"] == "STUDENT"
    assert isinstance(payload["exp"], int)


def test_decode_token_rejects_malformed_token():
    with pytest.raises(HTTPException) as exc_info:
        decode_token("not-a-valid-jwt")

    assert exc_info.value.status_code == 401
    assert exc_info.value.headers["WWW-Authenticate"] == "Bearer"


def test_decode_token_rejects_expired_token():
    token = create_access_token(
        {"sub": "expired-user"},
        expires_delta=timedelta(seconds=-5),
    )

    with pytest.raises(HTTPException) as exc_info:
        decode_token(token)

    assert exc_info.value.status_code == 401
