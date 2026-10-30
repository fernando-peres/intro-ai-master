"""Domain errors raised by services; `main` maps them to JSON `{detail, code, ...extra}`."""

from typing import Any


class DomainError(Exception):
    status_code = 400

    def __init__(self, code: str, detail: str, **extra: Any) -> None:
        super().__init__(detail)
        self.code = code
        self.detail = detail
        self.extra = extra


class NotFound(DomainError):
    status_code = 404


class Forbidden(DomainError):
    status_code = 403


class Conflict(DomainError):
    status_code = 409


class Invalid(DomainError):
    status_code = 422


class PreconditionRequired(DomainError):
    status_code = 428


class PreconditionFailed(DomainError):
    status_code = 412


class TooLarge(DomainError):
    status_code = 413
