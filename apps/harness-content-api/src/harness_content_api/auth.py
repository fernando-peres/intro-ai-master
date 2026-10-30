"""Development auth: the caller names a seeded user in the `X-User-Id` header.

This is not authentication; it exists so role checks are enforced by the API from day one.
"""

from typing import Annotated

from fastapi import Depends, Header, HTTPException
from sqlalchemy.orm import Session

from harness_content_api.db import get_session
from harness_content_api.errors import Forbidden
from harness_content_api.models import Role, User

EDITORS = frozenset({Role.ADMIN, Role.AUTHOR, Role.REVIEWER})
PUBLISHERS = frozenset({Role.ADMIN, Role.REVIEWER})


def current_user(
    session: Annotated[Session, Depends(get_session)],
    x_user_id: Annotated[str | None, Header()] = None,
) -> User:
    user = session.get(User, x_user_id) if x_user_id else None
    if user is None:
        raise HTTPException(401, detail="Send X-User-Id with a known user id")
    return user


CurrentUser = Annotated[User, Depends(current_user)]


def require(user: User, roles: frozenset[Role], action: str) -> None:
    if user.role not in roles:
        raise Forbidden("forbidden", f"Role '{user.role}' may not {action}")
