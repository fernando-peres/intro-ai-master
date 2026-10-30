"""Prefixed, time-sortable identifiers (`ra_…`, `rav_…`)."""

from uuid import uuid7


def new_id(prefix: str) -> str:
    return f"{prefix}_{uuid7().hex}"
