"""Artifact themes, seeded with the built-in slide themes; flow theme columns fit their IDs.

Revision ID: 0007
Revises: 0006
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import JSONB

revision: str = "0007"
down_revision: str | None = "0006"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

# Frozen copy of schemas/builtin-themes.json at this revision.
BUILTINS = [
    {
        "id": "dark",
        "name": "Graphite Dark",
        "tokens": {
            "background": "#14131C",
            "surface": "#FFFFFF14",
            "elevated": "#2E2750",
            "overlay": "#0C0B11",
            "title": "#F4F2FB",
            "body": "#C3BCDC",
            "muted": "#9D93C9",
            "inverse": "#14131C",
            "accent1": "#8B7BE0",
            "accent2": "#2DD4A7",
            "accent3": "#F2A65A",
            "accent4": "#E0607E",
            "nodeFill": "#262339",
            "nodeStroke": "#443D6A",
            "connector": "#FFFFFF2E",
            "nodeLabel": "#F4F2FB",
            "backgroundGradient": True,
        },
    },
    {
        "id": "light",
        "name": "Graphite Light",
        "tokens": {
            "background": "#FFFFFF",
            "surface": "#18181B0D",
            "elevated": "#EDEDED",
            "overlay": "#999999",
            "title": "#18181B",
            "body": "#52525B",
            "muted": "#71717A",
            "inverse": "#FFFFFF",
            "accent1": "#3A3263",
            "accent2": "#2DD4A7",
            "accent3": "#F2A65A",
            "accent4": "#E0607E",
            "nodeFill": "#E1E0E8",
            "nodeStroke": "#B0ADC1",
            "connector": "#18181B2E",
            "nodeLabel": "#18181B",
            "backgroundGradient": False,
        },
    },
    {
        "id": "violet",
        "name": "Violet Lab",
        "tokens": {
            "background": "#110F1A",
            "surface": "#FFFFFF14",
            "elevated": "#23212C",
            "overlay": "#0A0910",
            "title": "#F2F0FA",
            "body": "#C9C4DD",
            "muted": "#837E9B",
            "inverse": "#110F1A",
            "accent1": "#8B5CF6",
            "accent2": "#2DD4A7",
            "accent3": "#F2A65A",
            "accent4": "#E0607E",
            "nodeFill": "#231B3B",
            "nodeStroke": "#422E72",
            "connector": "#FFFFFF2E",
            "nodeLabel": "#F2F0FA",
            "backgroundGradient": False,
        },
    },
    {
        "id": "mint",
        "name": "Mint Clinic",
        "tokens": {
            "background": "#0E1313",
            "surface": "#FFFFFF14",
            "elevated": "#202525",
            "overlay": "#080B0B",
            "title": "#E9F4EF",
            "body": "#BFD4CC",
            "muted": "#7C8F89",
            "inverse": "#0E1313",
            "accent1": "#2DD4A7",
            "accent2": "#2DD4A7",
            "accent3": "#F2A65A",
            "accent4": "#E0607E",
            "nodeFill": "#133029",
            "nodeStroke": "#1A604E",
            "connector": "#FFFFFF2E",
            "nodeLabel": "#E9F4EF",
            "backgroundGradient": False,
        },
    },
    {
        "id": "cobalt",
        "name": "Cobalt Deep",
        "tokens": {
            "background": "#0C111C",
            "surface": "#FFFFFF14",
            "elevated": "#1E232E",
            "overlay": "#070A11",
            "title": "#EAEFF9",
            "body": "#BCC7DC",
            "muted": "#7B879E",
            "inverse": "#0C111C",
            "accent1": "#4F7CFF",
            "accent2": "#2DD4A7",
            "accent3": "#F2A65A",
            "accent4": "#E0607E",
            "nodeFill": "#16213E",
            "nodeStroke": "#273C77",
            "connector": "#FFFFFF2E",
            "nodeLabel": "#EAEFF9",
            "backgroundGradient": False,
        },
    },
    {
        "id": "ivory",
        "name": "Ivory Press",
        "tokens": {
            "background": "#140D08",
            "surface": "#FFFFFF14",
            "elevated": "#261F19",
            "overlay": "#0C0805",
            "title": "#F5ECE0",
            "body": "#D9CAC1",
            "muted": "#8C8378",
            "inverse": "#140D08",
            "accent1": "#DF753E",
            "accent2": "#2DD4A7",
            "accent3": "#F2A65A",
            "accent4": "#E0607E",
            "nodeFill": "#321D10",
            "nodeStroke": "#65371E",
            "connector": "#FFFFFF2E",
            "nodeLabel": "#F5ECE0",
            "backgroundGradient": False,
        },
    },
]


def upgrade() -> None:
    table = op.create_table(
        "artifact_themes",
        sa.Column("id", sa.String(64), primary_key=True),
        sa.Column("name", sa.Text(), nullable=False),
        sa.Column("builtin", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("tokens", JSONB(), nullable=False),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()
        ),
    )
    op.bulk_insert(table, [{**row, "builtin": True} for row in BUILTINS])
    op.alter_column("flows", "theme", type_=sa.String(64))
    op.alter_column("flow_steps", "theme_override", type_=sa.String(64))


def downgrade() -> None:
    op.alter_column("flow_steps", "theme_override", type_=sa.String(32))
    op.alter_column("flows", "theme", type_=sa.String(32))
    op.drop_table("artifact_themes")
