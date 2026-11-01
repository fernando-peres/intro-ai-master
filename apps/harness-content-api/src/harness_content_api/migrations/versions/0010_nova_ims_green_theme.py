"""Nova IMS Green built-in theme.

Revision ID: 0010
Revises: 0009
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import JSONB

revision: str = "0010"
down_revision: str | None = "0009"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

THEME_ID = "nova-ims-green"
# Frozen copy of schemas/builtin-themes.json at this revision.
TOKENS = {
    "background": "#0D0A06",
    "surface": "#FFFFFF14",
    "elevated": "#201E1A",
    "overlay": "#080604",
    "title": "#FFFFFF",
    "body": "#D9D9D6",
    "muted": "#A3A39E",
    "inverse": "#0D0A06",
    "accent1": "#86EFB8",
    "accent2": "#0096FF",
    "accent3": "#5FBF8C",
    "accent4": "#0069B3",
    "nodeFill": "#1F2C21",
    "nodeStroke": "#3D664D",
    "connector": "#FFFFFF2E",
    "nodeLabel": "#FFFFFF",
    "backgroundGradient": False,
    "fonts": {
        "title": "Borna",
        "body": "Prompt",
        "eyebrow": "Prompt",
        "eyebrowWeight": 300,
        "code": "Fira Code",
    },
}


def upgrade() -> None:
    table = sa.table(
        "artifact_themes",
        sa.column("id", sa.String()),
        sa.column("name", sa.Text()),
        sa.column("tokens", JSONB()),
        sa.column("builtin", sa.Boolean()),
    )
    op.bulk_insert(
        table, [{"id": THEME_ID, "name": "Nova IMS Green", "tokens": TOKENS, "builtin": True}]
    )


def downgrade() -> None:
    op.execute(sa.text("DELETE FROM artifact_themes WHERE id = :id").bindparams(id=THEME_ID))
