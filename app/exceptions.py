"""Shared application exceptions used by services and FastAPI handlers.

These exceptions remain compatible with FastAPI's HTTPException API so service
callers and existing tests can inspect status_code/detail while the app-wide
handler can return the standard CCMS error envelope.
"""
from __future__ import annotations

from typing import Any

from fastapi import HTTPException


class AppException(HTTPException):
    def __init__(
        self,
        status_code: int,
        message: str,
        code: str,
        detail: Any = None,
    ) -> None:
        super().__init__(status_code=status_code, detail=message)
        self.status_code = status_code
        self.message = message
        self.code = code
        self.internal_detail = detail


class BadRequestException(AppException):
    def __init__(self, message: str, code: str = "BAD_REQUEST", detail: Any = None) -> None:
        super().__init__(400, message, code, detail)


class UnauthorizedException(AppException):
    def __init__(self, message: str, code: str = "UNAUTHORIZED", detail: Any = None) -> None:
        super().__init__(401, message, code, detail)


class ForbiddenException(AppException):
    def __init__(self, message: str, code: str = "FORBIDDEN", detail: Any = None) -> None:
        super().__init__(403, message, code, detail)


class NotFoundException(AppException):
    def __init__(self, message: str, code: str = "NOT_FOUND", detail: Any = None) -> None:
        super().__init__(404, message, code, detail)


class ConflictException(AppException):
    def __init__(self, message: str, code: str = "CONFLICT", detail: Any = None) -> None:
        super().__init__(409, message, code, detail)
