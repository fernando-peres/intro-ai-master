"""Rewrite `slide.diagram` elements into native rect, text and arrow elements.

A one-time exception to version immutability: rendering is unchanged, so published versions and
templates are rewritten too. Hashes are recomputed and each version gets an audit row. There is
no downgrade: the labels survive as text, but the original element is not kept.

Revision ID: 0011
Revises: 0010
"""

import hashlib
import json
import math
import uuid
from collections.abc import Sequence
from typing import Any

import sqlalchemy as sa
from alembic import op

revision: str = "0011"
down_revision: str | None = "0010"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

# Frozen from the removed DiagramShape renderer.
GAP = 90
ARROW_INSET = 18
ARROW_BOX_HEIGHT = 40
ARROW_STROKE = 4
FONT = "Inter Variable"
FONT_SIZE = 36


def expand_diagram(diagram: dict[str, Any]) -> list[dict[str, Any]]:
    """The native elements drawing `diagram`, in its paint order, rotated around its origin."""
    labels = diagram.get("labels") or ["Step"]
    width, height = diagram["width"], diagram["height"]
    node_width = max(1, (width - GAP * (len(labels) - 1)) / len(labels))
    angle = math.radians(diagram.get("rotation", 0))
    identity = diagram["id"]
    shared = {
        "rotation": diagram.get("rotation", 0),
        "visible": diagram.get("visible", True),
        "locked": diagram.get("locked", False),
        "groupId": diagram.get("groupId") or f"{identity}-group",
    }

    def place(key: str, x: float, y: float, w: float, h: float) -> dict[str, Any]:
        return {
            "id": f"{identity}-{key}",
            "x": diagram["x"] + x * math.cos(angle) - y * math.sin(angle),
            "y": diagram["y"] + x * math.sin(angle) + y * math.cos(angle),
            "width": w,
            "height": h,
            **shared,
        }

    elements: list[dict[str, Any]] = []
    for index, label in enumerate(labels):
        x = index * (node_width + GAP)
        elements.append(
            place(f"node-{index}", x, 0, node_width, height)
            | {"type": "rect", "style": diagram.get("style") or {}}
        )
        elements.append(
            place(f"label-{index}", x, (height - FONT_SIZE) / 2, node_width, FONT_SIZE)
            | {
                "type": "text",
                # The title variant is the one coloured with the theme's text colour.
                "variant": "title",
                "text": label,
                "style": {
                    "fontFamily": FONT,
                    "fontSize": FONT_SIZE,
                    "fontWeight": 400,
                    "align": "center",
                    "lineHeight": 1,
                },
            }
        )
        if index < len(labels) - 1:
            arrow_y = (height - ARROW_BOX_HEIGHT) / 2
            arrow_x = x + node_width + ARROW_INSET
            arrow_width = GAP - 2 * ARROW_INSET
            elements.append(
                place(f"link-{index}", arrow_x, arrow_y, arrow_width, ARROW_BOX_HEIGHT)
                | {"type": "arrow", "style": {"strokeWidth": ARROW_STROKE}}
            )
    return elements


def rewrite_content(content: dict[str, Any]) -> dict[str, Any]:
    elements = [
        native
        for element in content["elements"]
        for native in (expand_diagram(element) if element.get("type") == "diagram" else [element])
    ]
    return content | {"elements": elements}


def _hash(content: Any, manifest: Any, schema_version: int, script: Any) -> str:
    payload = {
        "content": content,
        "componentManifest": manifest,
        "contentSchemaVersion": schema_version,
        "script": script,
    }
    canonical = json.dumps(payload, sort_keys=True, separators=(",", ":"), ensure_ascii=False)
    return hashlib.sha256(canonical.encode()).hexdigest()


HAS_DIAGRAM = """content->'elements' @> '[{"type": "diagram"}]'::jsonb"""


def rewrite(connection: sa.Connection) -> None:
    versions = connection.execute(
        sa.text(
            "SELECT v.id, v.content, v.component_manifest, v.content_schema_version, v.script,"
            " v.created_by FROM artifact_versions v JOIN artifacts a ON a.id = v.artifact_id"
            f" WHERE a.type = 'slide' AND v.{HAS_DIAGRAM}"
        )
    ).all()
    for row in versions:
        content = rewrite_content(row.content)
        before = _hash(row.content, row.component_manifest, row.content_schema_version, row.script)
        after = _hash(content, row.component_manifest, row.content_schema_version, row.script)
        connection.execute(
            sa.text(
                "UPDATE artifact_versions SET content = CAST(:content AS jsonb) WHERE id = :id"
            ),
            {"content": json.dumps(content), "id": row.id},
        )
        # A hash that was already stale stays stale: only matching approvals carry over.
        connection.execute(
            sa.text(
                "UPDATE review_requests SET content_hash = :after"
                " WHERE version_id = :id AND content_hash = :before"
            ),
            {"after": after, "before": before, "id": row.id},
        )
        connection.execute(
            sa.text(
                "INSERT INTO audit_events (id, at, actor_id, action, entity_type, entity_id, data)"
                " VALUES (:id, now(), :actor, 'version.migrate', 'version', :version,"
                " CAST(:data AS jsonb))"
            ),
            {
                "id": f"aud_{uuid.uuid4().hex}",
                "actor": row.created_by,
                "version": row.id,
                "data": json.dumps({"migration": revision, "reason": "slide.diagram removed"}),
            },
        )
    templates = connection.execute(
        sa.text(f"SELECT id, content FROM artifact_templates WHERE {HAS_DIAGRAM}")
    ).all()
    for row in templates:
        connection.execute(
            sa.text(
                "UPDATE artifact_templates SET content = CAST(:content AS jsonb) WHERE id = :id"
            ),
            {"content": json.dumps(rewrite_content(row.content)), "id": row.id},
        )


def upgrade() -> None:
    rewrite(op.get_bind())


def downgrade() -> None:
    pass
