"""The repo-wide timestamp format: UTC, `YYYY-MM-DD-HH-mm-ss`."""

from datetime import UTC, datetime

STAMP_FORMAT = "%Y-%m-%d-%H-%M-%S"


def utc_now() -> datetime:
    return datetime.now(UTC)


def utc_stamp(moment: datetime | None = None) -> str:
    """Format `moment` (default: now) as a UTC stamp.

    Raises:
        ValueError: `moment` is naive; a naive datetime has no defined UTC instant.
    """
    moment = moment or utc_now()
    if moment.tzinfo is None:
        raise ValueError("utc_stamp needs a timezone-aware datetime")
    return moment.astimezone(UTC).strftime(STAMP_FORMAT)
