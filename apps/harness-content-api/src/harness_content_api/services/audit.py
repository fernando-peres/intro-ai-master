from typing import Any

from sqlalchemy.orm import Session

from harness_content_api.ids import new_id
from harness_content_api.models import AuditEvent, User


def record(
    session: Session, actor: User, action: str, entity_type: str, entity_id: str, **data: Any
) -> None:
    session.add(
        AuditEvent(
            id=new_id("aud"),
            actor_id=actor.id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            data=data,
        )
    )
