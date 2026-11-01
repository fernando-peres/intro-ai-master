"""Embedded artifact references in doc and slide content.

An embed must pin a published version of the artifact it names. Archived versions are refused
unless inherited from the parent version, so forking never breaks an existing pin.
"""

from collections.abc import Iterator
from typing import Any

from sqlalchemy.orm import Session

from harness_content_api.errors import Invalid
from harness_content_api.models import ArtifactVersion, VersionState


def _doc_refs(blocks: Any, path: str) -> Iterator[tuple[str, dict[str, Any]]]:
    if not isinstance(blocks, list):
        return
    for index, block in enumerate(blocks):
        if not isinstance(block, dict):
            continue
        here = f"{path}.{index}"
        if block.get("type") == "raEmbed":
            yield f"{here}.props", block.get("props") or {}
        yield from _doc_refs(block.get("children"), f"{here}.children")


def refs(content: dict[str, Any]) -> list[tuple[str, dict[str, Any]]]:
    """(path, reference) pairs for every embed in `content`."""
    found = list(_doc_refs(content.get("blocks"), "blocks"))
    for index, element in enumerate(content.get("elements") or []):
        if isinstance(element, dict) and element.get("type") == "embed":
            found.append((f"elements.{index}.ref", element.get("ref") or {}))
    return found


def _problem(session: Session, ref: dict[str, Any], inherited: set[str]) -> str | None:
    version_id = ref.get("versionId")
    version = session.get(ArtifactVersion, version_id) if version_id else None
    if version is None:
        return f"Version {version_id!r} does not exist"
    if version.artifact_id != ref.get("artifactId"):
        return f"Version {version_id!r} does not belong to artifact {ref.get('artifactId')!r}"
    if version.state == VersionState.DRAFT:
        return f"Version {version_id!r} is a draft; embeds pin published versions"
    if version.state == VersionState.ARCHIVED and version_id not in inherited:
        return f"Version {version_id!r} is archived and cannot be newly pinned"
    return None


def check(session: Session, content: dict[str, Any], inherited: set[str] | None = None) -> None:
    """Raises `Invalid` (`invalid_embed`) with an `issues` list naming each bad reference."""
    issues = [
        {"path": path, "message": problem}
        for path, ref in refs(content)
        if (problem := _problem(session, ref, inherited or set()))
    ]
    if issues:
        first = issues[0]
        raise Invalid("invalid_embed", f"{first['path']}: {first['message']}", issues=issues)


def check_version(session: Session, version: ArtifactVersion) -> None:
    """`check` for a draft; pins already in its parent version count as inherited."""
    parent_id = version.parent_version_id
    parent = session.get(ArtifactVersion, parent_id) if parent_id else None
    inherited = {ref.get("versionId") for _, ref in refs(parent.content)} if parent else set()
    check(session, version.content, inherited)
