"""Slide templates: named content based on an artifact theme."""

from sqlalchemy import select
from sqlalchemy.orm import Session

from harness_content_api.auth import EDITORS, require
from harness_content_api.errors import Invalid, NotFound
from harness_content_api.ids import new_id
from harness_content_api.models import ArtifactTemplate, ArtifactType, User
from harness_content_api.schemas import TemplateCreate, TemplateUpdate
from harness_content_api.services import audit, content, themes


def get(session: Session, template_id: str) -> ArtifactTemplate:
    template = session.get(ArtifactTemplate, template_id)
    if template is None:
        raise NotFound("template_not_found", f"Template {template_id} does not exist")
    return template


def list_all(session: Session, theme_id: str | None) -> list[ArtifactTemplate]:
    query = select(ArtifactTemplate).order_by(ArtifactTemplate.created_at)
    if theme_id:
        query = query.where(ArtifactTemplate.theme_id == theme_id)
    return list(session.scalars(query))


def _theme_of(session: Session, body: dict) -> str:
    content.check(ArtifactType.SLIDE.value, body)
    themes.check_slide(session, body)
    return body.get("theme", themes.DEFAULT_THEME)


def create(session: Session, user: User, data: TemplateCreate) -> ArtifactTemplate:
    require(user, EDITORS, "create templates")
    template = ArtifactTemplate(
        id=new_id("tpl"),
        name=data.name,
        theme_id=_theme_of(session, data.content),
        layout=data.layout,
        content=data.content,
        created_by=user.id,
    )
    session.add(template)
    session.flush()
    audit.record(session, user, "template.create", "template", template.id)
    return template


def update(
    session: Session, user: User, template_id: str, data: TemplateUpdate
) -> ArtifactTemplate:
    require(user, EDITORS, "edit templates")
    template = get(session, template_id)
    if data.name is not None:
        template.name = data.name
    if data.content is not None:
        template.theme_id = _theme_of(session, data.content)
        template.content = data.content
    audit.record(session, user, "template.update", "template", template.id)
    session.flush()
    return template


def delete(session: Session, user: User, template_id: str) -> None:
    require(user, EDITORS, "delete templates")
    template = get(session, template_id)
    audit.record(session, user, "template.delete", "template", template.id)
    session.delete(template)
    session.flush()


def use(session: Session, template_id: str, artifact_type: str) -> ArtifactTemplate:
    """Counts a new artifact made from the template; only slides have templates."""
    template = get(session, template_id)
    if artifact_type != ArtifactType.SLIDE.value:
        raise Invalid("template_type_mismatch", "Templates can only start slide artifacts")
    template.use_count += 1
    return template
