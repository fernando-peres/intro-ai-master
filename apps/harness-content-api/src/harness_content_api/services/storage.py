"""Where asset bytes live. Services depend on `AssetStorage`, so S3 can replace local disk.

Keys are opaque strings chosen by the caller (the asset id); `put` overwrites.
"""

import os
import tempfile
from functools import cache
from pathlib import Path
from typing import Protocol

from harness_content_api.settings import get_settings


class AssetStorage(Protocol):
    def put(self, key: str, data: bytes) -> None: ...

    def get(self, key: str) -> bytes: ...

    def delete(self, key: str) -> None: ...


class LocalDiskStorage:
    """One file per key under `root`; writes are atomic (temp file + rename)."""

    def __init__(self, root: Path) -> None:
        self.root = root

    def _path(self, key: str) -> Path:
        if not key or "/" in key or "\\" in key or key.startswith("."):
            raise ValueError(f"Invalid storage key {key!r}")
        return self.root / key

    def put(self, key: str, data: bytes) -> None:
        target = self._path(key)
        self.root.mkdir(parents=True, exist_ok=True)
        fd, temp = tempfile.mkstemp(dir=self.root, prefix=".upload-")
        with os.fdopen(fd, "wb") as handle:
            handle.write(data)
        os.replace(temp, target)

    def get(self, key: str) -> bytes:
        return self._path(key).read_bytes()

    def delete(self, key: str) -> None:
        self._path(key).unlink(missing_ok=True)


@cache
def get_storage() -> AssetStorage:
    """FastAPI dependency; tests override it with a temporary directory."""
    return LocalDiskStorage(get_settings().asset_dir)
