"""Artifact resources: uploaded files and editable markdown notes.

The file type comes from the extension and must match the bytes (magic number, or UTF-8 for
text), so a renamed HTML page is never stored as a PNG. An asset that any version's content
mentions by id cannot be deleted, because published snapshots must stay reproducible.
Storage keys change with the content: callers delete the returned stale key after commit.
"""

import hashlib
import re
import unicodedata
from pathlib import PurePosixPath

from sqlalchemy import Text, select
from sqlalchemy.orm import Session

from harness_content_api.auth import EDITORS, require
from harness_content_api.errors import Conflict, Invalid, NotFound, PreconditionFailed, TooLarge
from harness_content_api.ids import new_id
from harness_content_api.models import ArtifactVersion, Asset, User
from harness_content_api.services import audit
from harness_content_api.services.artifacts import get_artifact, parse_if_match
from harness_content_api.services.storage import AssetStorage

MAX_BYTES = 20 * 1024 * 1024
MAX_NAME = 120
#: Extension → (mime type, magic-number prefixes; empty = UTF-8 text).
TYPES: dict[str, tuple[str, tuple[bytes, ...]]] = {
    ".md": ("text/markdown", ()),
    ".txt": ("text/plain", ()),
    ".csv": ("text/csv", ()),
    ".pdf": ("application/pdf", (b"%PDF-",)),
    ".png": ("image/png", (b"\x89PNG\r\n\x1a\n",)),
    ".jpg": ("image/jpeg", (b"\xff\xd8\xff",)),
    ".jpeg": ("image/jpeg", (b"\xff\xd8\xff",)),
    ".gif": ("image/gif", (b"GIF87a", b"GIF89a")),
    ".webp": ("image/webp", (b"RIFF",)),
}
TEXT_TYPES = frozenset(mime for mime, magic in TYPES.values() if not magic)


def clean_name(raw: str) -> str:
    name = unicodedata.normalize("NFC", PurePosixPath(raw.replace("\\", "/")).name)
    name = re.sub(r"[\x00-\x1f\x7f]", "", name).strip()
    if not name or name.startswith(".") or len(name) > MAX_NAME:
        raise Invalid("invalid_name", f"File names need 1–{MAX_NAME} characters, no leading dot")
    return name


def _mime(name: str, data: bytes) -> str:
    extension = PurePosixPath(name).suffix.lower()
    if extension not in TYPES:
        supported = ", ".join(sorted(TYPES))
        raise Invalid("unsupported_file", f"{name}: unsupported file type; supported: {supported}")
    mime, magic = TYPES[extension]
    if magic and not data.startswith(magic):
        raise Invalid("unsupported_file", f"{name}: content is not a valid {extension} file")
    if not magic:
        try:
            data.decode("utf-8")
        except UnicodeDecodeError as error:
            raise Invalid("unsupported_file", f"{name}: text files must be UTF-8") from error
    return mime


def _check_size(data: bytes) -> None:
    if len(data) > MAX_BYTES:
        raise TooLarge("file_too_large", f"Files are limited to {MAX_BYTES // (1024 * 1024)} MB")


def _check_free(session: Session, artifact_id: str, name: str, asset_id: str | None = None) -> None:
    taken = session.scalar(
        select(Asset.id).where(Asset.artifact_id == artifact_id, Asset.name == name)
    )
    if taken and taken != asset_id:
        raise Conflict("asset_name_taken", f"This artifact already has a resource named {name}")


def _store(storage: AssetStorage, asset: Asset, data: bytes) -> None:
    asset.checksum = hashlib.sha256(data).hexdigest()
    asset.size_bytes = len(data)
    asset.storage_key = f"{asset.id}-{asset.checksum[:16]}"
    storage.put(asset.storage_key, data)


def get(session: Session, asset_id: str, *, lock: bool = False) -> Asset:
    query = select(Asset).where(Asset.id == asset_id)
    asset = session.scalar(query.with_for_update() if lock else query)
    if asset is None:
        raise NotFound("asset_not_found", f"Asset {asset_id} does not exist")
    return asset


def _locked_at(session: Session, asset_id: str, if_match: str | None) -> Asset:
    expected = parse_if_match(if_match)
    asset = get(session, asset_id, lock=True)
    if asset.revision != expected:
        raise PreconditionFailed(
            "revision_mismatch",
            f"Resource is at revision {asset.revision}, not {expected}",
            currentRevision=asset.revision,
        )
    return asset


def list_for(session: Session, artifact_id: str) -> list[Asset]:
    get_artifact(session, artifact_id)
    query = select(Asset).where(Asset.artifact_id == artifact_id).order_by(Asset.name)
    return list(session.scalars(query))


def upload(
    session: Session, storage: AssetStorage, user: User, artifact_id: str, name: str, data: bytes
) -> Asset:
    require(user, EDITORS, "attach resources")
    get_artifact(session, artifact_id)
    name = clean_name(name)
    _check_size(data)
    mime = _mime(name, data)
    _check_free(session, artifact_id, name)
    asset = Asset(
        id=new_id("ast"),
        artifact_id=artifact_id,
        name=name,
        mime_type=mime,
        revision=1,
        created_by=user.id,
        updated_by=user.id,
    )
    _store(storage, asset, data)
    session.add(asset)
    session.flush()
    audit.record(session, user, "asset.upload", "asset", asset.id, artifactId=artifact_id)
    return asset


def write_text(
    session: Session,
    storage: AssetStorage,
    user: User,
    asset_id: str,
    if_match: str | None,
    text: str,
) -> tuple[Asset, str]:
    """Replaces a text resource's content; returns it and the now-stale storage key."""
    require(user, EDITORS, "edit resources")
    asset = _locked_at(session, asset_id, if_match)
    if asset.mime_type not in TEXT_TYPES:
        raise Conflict("not_editable", f"{asset.name} is not a text resource")
    data = text.encode("utf-8")
    _check_size(data)
    stale = asset.storage_key
    _store(storage, asset, data)
    asset.revision += 1
    asset.updated_by = user.id
    session.flush()
    audit.record(session, user, "asset.edit", "asset", asset.id, checksum=asset.checksum)
    return asset, stale


def rename(session: Session, user: User, asset_id: str, if_match: str | None, name: str) -> Asset:
    require(user, EDITORS, "rename resources")
    asset = _locked_at(session, asset_id, if_match)
    name = clean_name(name)
    extension = PurePosixPath(name).suffix.lower()
    if TYPES.get(extension, ("",))[0] != asset.mime_type:
        raise Invalid("unsupported_file", f"Keep a file extension of type {asset.mime_type}")
    _check_free(session, asset.artifact_id, name, asset.id)
    audit.record(session, user, "asset.rename", "asset", asset.id, fromName=asset.name)
    asset.name = name
    asset.revision += 1
    asset.updated_by = user.id
    session.flush()
    return asset


def delete(session: Session, user: User, asset_id: str) -> str:
    """Deletes the row; returns the storage key to remove after commit."""
    require(user, EDITORS, "delete resources")
    asset = get(session, asset_id, lock=True)
    users = session.scalars(
        select(ArtifactVersion.id).where(ArtifactVersion.content.cast(Text).contains(asset.id))
    ).all()
    if users:
        raise Conflict(
            "asset_in_use", f"{asset.name} is referenced by {len(users)} version(s)", versions=users
        )
    audit.record(session, user, "asset.delete", "asset", asset.id, name=asset.name)
    session.delete(asset)
    session.flush()
    return asset.storage_key
