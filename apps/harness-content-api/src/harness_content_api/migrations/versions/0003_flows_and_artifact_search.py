"""Flows, flow revisions and steps; artifact search vector kept current by a trigger.

Revision ID: 0003
Revises: 0002
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0003"
down_revision: str | None = "0002"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


SEARCH_FUNCTION = """
CREATE FUNCTION artifacts_search_vector() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('simple', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('simple', array_to_string(coalesce(NEW.tags, '{}'), ' ')), 'B') ||
    setweight(to_tsvector('simple', coalesce(NEW.description, '')), 'C');
  RETURN NEW;
END $$
"""

SEARCH_TRIGGER = """
CREATE TRIGGER artifacts_search_vector BEFORE INSERT OR UPDATE OF title, description, tags
ON artifacts FOR EACH ROW EXECUTE FUNCTION artifacts_search_vector()
"""


def upgrade() -> None:
    op.create_table(
        "flows",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("title", sa.Text(), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("locale", sa.String(length=35), nullable=False),
        sa.Column("metadata", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("theme", sa.String(length=32), nullable=True),
        sa.Column("created_by", sa.String(length=64), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["created_by"],
            ["users.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "flow_revisions",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("flow_id", sa.String(length=64), nullable=False),
        sa.Column("revision", sa.Integer(), nullable=True),
        sa.Column(
            "state",
            sa.Enum(
                "draft",
                "published",
                name="flow_revision_state",
                native_enum=False,
                create_constraint=True,
                length=32,
            ),
            nullable=False,
        ),
        sa.Column("parent_revision_id", sa.String(length=64), nullable=True),
        sa.Column("change_comment", sa.Text(), nullable=True),
        sa.Column("edit_revision", sa.Integer(), nullable=False),
        sa.Column("created_by", sa.String(length=64), nullable=False),
        sa.Column("published_by", sa.String(length=64), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=True),
        sa.CheckConstraint(
            "(state = 'draft') = (revision IS NULL)", name="ck_flow_revisions_number_iff_published"
        ),
        sa.ForeignKeyConstraint(
            ["created_by"],
            ["users.id"],
        ),
        sa.ForeignKeyConstraint(
            ["flow_id"],
            ["flows.id"],
        ),
        sa.ForeignKeyConstraint(
            ["parent_revision_id"],
            ["flow_revisions.id"],
        ),
        sa.ForeignKeyConstraint(
            ["published_by"],
            ["users.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("flow_id", "revision", name="uq_flow_revisions_number"),
    )
    op.create_index(op.f("ix_flow_revisions_flow_id"), "flow_revisions", ["flow_id"], unique=False)
    op.create_index(
        "uq_flow_revisions_one_draft",
        "flow_revisions",
        ["flow_id"],
        unique=True,
        postgresql_where=sa.text("state = 'draft'"),
    )
    op.create_table(
        "flow_steps",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("revision_id", sa.String(length=64), nullable=False),
        sa.Column("position", sa.Integer(), nullable=False),
        sa.Column("artifact_id", sa.String(length=64), nullable=False),
        sa.Column("locale", sa.String(length=35), nullable=False),
        sa.Column("artifact_version_id", sa.String(length=64), nullable=True),
        sa.Column("label", sa.Text(), nullable=True),
        sa.Column("presenter_note", sa.Text(), nullable=True),
        sa.Column("advance_seconds", sa.Integer(), nullable=True),
        sa.Column("theme_override", sa.String(length=32), nullable=True),
        sa.ForeignKeyConstraint(
            ["artifact_id"],
            ["artifacts.id"],
        ),
        sa.ForeignKeyConstraint(
            ["artifact_version_id"],
            ["artifact_versions.id"],
        ),
        sa.ForeignKeyConstraint(
            ["revision_id"],
            ["flow_revisions.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("revision_id", "position", name="uq_flow_steps_position"),
    )
    op.create_index(op.f("ix_flow_steps_artifact_id"), "flow_steps", ["artifact_id"], unique=False)
    op.create_index(
        op.f("ix_flow_steps_artifact_version_id"),
        "flow_steps",
        ["artifact_version_id"],
        unique=False,
    )
    op.create_index(op.f("ix_flow_steps_revision_id"), "flow_steps", ["revision_id"], unique=False)
    op.add_column("artifacts", sa.Column("search_vector", postgresql.TSVECTOR(), nullable=True))
    op.create_index(
        "ix_artifacts_search_vector",
        "artifacts",
        ["search_vector"],
        unique=False,
        postgresql_using="gin",
    )
    op.create_index(
        "ix_artifacts_tags", "artifacts", ["tags"], unique=False, postgresql_using="gin"
    )

    op.execute(SEARCH_FUNCTION)
    op.execute(SEARCH_TRIGGER)
    op.execute("UPDATE artifacts SET title = title")


def downgrade() -> None:
    op.execute("DROP TRIGGER artifacts_search_vector ON artifacts")
    op.execute("DROP FUNCTION artifacts_search_vector()")
    op.drop_index("ix_artifacts_tags", table_name="artifacts", postgresql_using="gin")
    op.drop_index("ix_artifacts_search_vector", table_name="artifacts", postgresql_using="gin")
    op.drop_column("artifacts", "search_vector")
    op.drop_index(op.f("ix_flow_steps_revision_id"), table_name="flow_steps")
    op.drop_index(op.f("ix_flow_steps_artifact_version_id"), table_name="flow_steps")
    op.drop_index(op.f("ix_flow_steps_artifact_id"), table_name="flow_steps")
    op.drop_table("flow_steps")
    op.drop_index(
        "uq_flow_revisions_one_draft",
        table_name="flow_revisions",
        postgresql_where=sa.text("state = 'draft'"),
    )
    op.drop_index(op.f("ix_flow_revisions_flow_id"), table_name="flow_revisions")
    op.drop_table("flow_revisions")
    op.drop_table("flows")
