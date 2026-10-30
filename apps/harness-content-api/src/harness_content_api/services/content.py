"""Content validation against the component registry exported by harness-content.

`schemas/` is generated (`pnpm --filter harness-content export:schemas`); never edit it by
hand. Unknown components are reported before schema errors, by name, so an import never
fails with a bare "not valid under any of the given schemas".
"""

import json
from functools import cache
from pathlib import Path
from typing import Any

from jsonschema import Draft202012Validator, ValidationError

from harness_content_api.errors import Invalid

SCHEMA_DIR = Path(__file__).resolve().parent.parent / "schemas"
#: At most this many schema issues are returned; the first ones are usually the cause.
MAX_ISSUES = 20


@cache
def registry() -> dict[str, Any]:
    return json.loads((SCHEMA_DIR / "registry.json").read_text())


@cache
def _validator(artifact_type: str) -> Draft202012Validator:
    entry = _entry(artifact_type)
    return Draft202012Validator(json.loads((SCHEMA_DIR / entry["schema"]).read_text()))


def _entry(artifact_type: str) -> dict[str, Any]:
    entry = registry()["types"].get(artifact_type)
    if entry is None:
        raise Invalid("unknown_type", f"No registered schema for artifact type {artifact_type!r}")
    return entry


def empty_content(artifact_type: str) -> dict[str, Any]:
    return json.loads(json.dumps(_entry(artifact_type)["emptyContent"]))


def _components(content: dict[str, Any], field: str) -> list[tuple[str, str]]:
    """(path, component type) pairs named by `content`, per the registry's `componentField`."""
    if field == "template":
        template = content.get("template")
        return [("template", template)] if isinstance(template, str) else []
    key = field.split("[")[0]
    found: list[tuple[str, str]] = []

    def walk(items: Any, path: str) -> None:
        if not isinstance(items, list):
            return
        for index, item in enumerate(items):
            kind = item.get("type") if isinstance(item, dict) else None
            found.append((f"{path}.{index}", kind if isinstance(kind, str) else ""))
            if isinstance(item, dict):
                walk(item.get("children"), f"{path}.{index}.children")

    walk(content.get(key), key)
    return found


def _is_discriminator(error: ValidationError) -> bool:
    path = list(error.relative_path)
    return error.validator in ("const", "enum") and path[-1:] in (["type"], ["template"], ["kind"])


def _leaf_errors(error: ValidationError) -> list[ValidationError]:
    # A union reports every branch's failures; keep the branches whose discriminator matched.
    if not error.context:
        return [error]
    branches: dict[Any, list[ValidationError]] = {}
    for sub in error.context:
        branches.setdefault(sub.relative_schema_path[0], []).append(sub)
    matched = [subs for subs in branches.values() if not any(map(_is_discriminator, subs))]
    leaves = [leaf for subs in matched for sub in subs for leaf in _leaf_errors(sub)]
    return leaves or [error]


def _path(error: ValidationError) -> str:
    return ".".join(str(part) for part in error.absolute_path) or "(root)"


def issues(artifact_type: str, content: Any) -> list[dict[str, str]]:
    """Readable problems with `content` for `artifact_type`; empty when it is valid."""
    if not isinstance(content, dict):
        return [{"path": "(root)", "message": "Content must be a JSON object"}]
    entry = _entry(artifact_type)
    if content.get("type") != artifact_type:
        found = content.get("type")
        return [{"path": "type", "message": f"Expected {artifact_type!r}, got {found!r}"}]
    allowed = {component["componentType"] for component in entry["components"]}
    prefix = "" if entry["componentField"] == "template" else f"{artifact_type}."
    supported = ", ".join(sorted(allowed))
    unknown = [
        {
            "path": path,
            "message": (
                f"Unknown component '{prefix}{name}'; supported: {supported}"
                if name
                else f"Unknown component: no component type given; supported: {supported}"
            ),
        }
        for path, name in _components(content, entry["componentField"])
        if f"{prefix}{name}" not in allowed
    ]
    if unknown:
        return unknown
    errors = sorted(_validator(artifact_type).iter_errors(content), key=lambda e: e.path)
    leaves = [leaf for error in errors for leaf in _leaf_errors(error)]
    seen: set[tuple[str, str]] = set()
    result = []
    for leaf in leaves:
        item = (_path(leaf), leaf.message)
        if item not in seen:
            seen.add(item)
            result.append({"path": item[0], "message": item[1]})
    return result[:MAX_ISSUES]


def check(artifact_type: str, content: Any) -> None:
    """Raises `Invalid` (`unknown_component` or `invalid_content`) with an `issues` list."""
    found = issues(artifact_type, content)
    if not found:
        return
    code = (
        "unknown_component"
        if found[0]["message"].startswith("Unknown component")
        else ("invalid_content")
    )
    first = found[0]
    raise Invalid(code, f"{first['path']}: {first['message']}", issues=found)
