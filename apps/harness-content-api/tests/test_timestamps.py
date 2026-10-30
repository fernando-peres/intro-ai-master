from datetime import UTC, datetime, timedelta, timezone

import pytest

from harness_content_api.timestamps import utc_stamp


def test_formats_utc():
    assert utc_stamp(datetime(2026, 10, 29, 7, 4, 9, tzinfo=UTC)) == "2026-10-29-07-04-09"


def test_converts_other_zones_to_utc():
    lisbon_summer = timezone(timedelta(hours=1))
    assert utc_stamp(datetime(2026, 7, 1, 0, 30, tzinfo=lisbon_summer)) == "2026-06-30-23-30-00"


def test_rejects_naive_datetimes():
    with pytest.raises(ValueError):
        utc_stamp(datetime(2026, 10, 29))


def test_defaults_to_now():
    assert len(utc_stamp()) == len("YYYY-MM-DD-HH-mm-ss")
