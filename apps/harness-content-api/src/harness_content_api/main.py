"""FastAPI application."""

from typing import Annotated

from fastapi import Depends, FastAPI, Request
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.orm import Session

from harness_content_api.db import get_session
from harness_content_api.errors import DomainError
from harness_content_api.routes import (
    artifacts,
    assets,
    flows,
    locations,
    reviews,
    templates,
    themes,
    users,
)

app = FastAPI(title="harness-content-api")
app.include_router(users.router)
app.include_router(locations.router)
app.include_router(artifacts.router)
app.include_router(reviews.router)
app.include_router(flows.router)
app.include_router(assets.router)
app.include_router(themes.router)
app.include_router(templates.router)


@app.exception_handler(DomainError)
def domain_error(_: Request, error: DomainError) -> JSONResponse:
    body = {"detail": error.detail, "code": error.code, **error.extra}
    return JSONResponse(body, status_code=error.status_code)


@app.get("/health")
def health(session: Annotated[Session, Depends(get_session)]) -> dict[str, str]:
    session.execute(text("SELECT 1"))
    return {"status": "ok", "database": "ok"}
