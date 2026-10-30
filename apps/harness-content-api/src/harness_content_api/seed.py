"""Seed development users (idempotent): `uv run python -m harness_content_api.seed`."""

from sqlalchemy.orm import Session

from harness_content_api.db import get_engine
from harness_content_api.models import Role, User

DEV_USERS = [
    ("usr_admin", "Admin", Role.ADMIN),
    ("usr_author", "Author", Role.AUTHOR),
    ("usr_reviewer", "Reviewer", Role.REVIEWER),
    ("usr_reviewer2", "Second reviewer", Role.REVIEWER),
    ("usr_viewer", "Viewer", Role.VIEWER),
]


def seed_users(session: Session) -> None:
    for user_id, name, role in DEV_USERS:
        if session.get(User, user_id) is None:
            session.add(User(id=user_id, name=name, role=role))
    session.flush()


if __name__ == "__main__":
    with Session(get_engine()) as session:
        seed_users(session)
        session.commit()
    print("Seeded:", ", ".join(user_id for user_id, _, _ in DEV_USERS))
