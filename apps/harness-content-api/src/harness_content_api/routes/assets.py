"""Artifact resources (`POST /assets` and friends). Writes carry the asset revision as ETag."""

from typing import Annotated, Any
from urllib.parse import quote

from fastapi import APIRouter, Depends, File, Form, Header, Response, UploadFile
from sqlalchemy.orm import Session

from harness_content_api.auth import CurrentUser
from harness_content_api.db import get_session
from harness_content_api.models import Asset
from harness_content_api.schemas import AssetOut, AssetRename, AssetText
from harness_content_api.services import assets
from harness_content_api.services.storage import AssetStorage, get_storage

router = APIRouter(prefix="/api/v1", tags=["assets"])
SessionDep = Annotated[Session, Depends(get_session)]
StorageDep = Annotated[AssetStorage, Depends(get_storage)]
INLINE = frozenset({"image/png", "image/jpeg", "image/gif", "image/webp", "application/pdf"})


def _with_etag(response: Response, asset: Asset) -> Asset:
    response.headers["ETag"] = f'"{asset.revision}"'
    return asset


@router.post("/assets", response_model=AssetOut, status_code=201)
async def upload_asset(
    session: SessionDep,
    storage: StorageDep,
    user: CurrentUser,
    response: Response,
    artifact_id: Annotated[str, Form(alias="artifactId")],
    file: Annotated[UploadFile, File()],
) -> Any:
    """Multipart upload (≤ 20 MB) attached to an artifact; 422 `unsupported_file` otherwise."""
    data = await file.read(assets.MAX_BYTES + 1)
    asset = assets.upload(session, storage, user, artifact_id, file.filename or "", data)
    session.commit()
    return _with_etag(response, asset)


@router.get("/artifacts/{artifact_id}/assets", response_model=list[AssetOut])
def list_assets(session: SessionDep, _: CurrentUser, artifact_id: str) -> Any:
    return assets.list_for(session, artifact_id)


@router.get("/assets/{asset_id}", response_model=AssetOut)
def get_asset(session: SessionDep, _: CurrentUser, response: Response, asset_id: str) -> Any:
    return _with_etag(response, assets.get(session, asset_id))


@router.get(
    "/assets/{asset_id}/content",
    response_class=Response,
    responses={200: {"content": {"application/octet-stream": {}}}},
)
def asset_content(
    session: SessionDep, storage: StorageDep, _: CurrentUser, asset_id: str
) -> Response:
    """The stored bytes. Never rendered as a page: sandboxed, no sniffing."""
    asset = assets.get(session, asset_id)
    disposition = "inline" if asset.mime_type in INLINE else "attachment"
    content_type = asset.mime_type + (
        "; charset=utf-8" if asset.mime_type in assets.TEXT_TYPES else ""
    )
    return Response(
        storage.get(asset.storage_key),
        media_type=content_type,
        headers={
            "ETag": f'"{asset.revision}"',
            "Content-Disposition": f"{disposition}; filename*=UTF-8''{quote(asset.name, safe='')}",
            "X-Content-Type-Options": "nosniff",
            "Content-Security-Policy": "sandbox; default-src 'none'",
            "Cache-Control": "private, no-cache",
        },
    )


@router.put("/assets/{asset_id}/content", response_model=AssetOut)
def write_asset_text(
    session: SessionDep,
    storage: StorageDep,
    user: CurrentUser,
    response: Response,
    asset_id: str,
    body: AssetText,
    if_match: Annotated[str | None, Header()] = None,
) -> Any:
    """Replaces a text resource (markdown note); needs If-Match."""
    asset, stale = assets.write_text(session, storage, user, asset_id, if_match, body.text)
    session.commit()
    storage.delete(stale)
    return _with_etag(response, asset)


@router.patch("/assets/{asset_id}", response_model=AssetOut)
def rename_asset(
    session: SessionDep,
    user: CurrentUser,
    response: Response,
    asset_id: str,
    body: AssetRename,
    if_match: Annotated[str | None, Header()] = None,
) -> Any:
    asset = assets.rename(session, user, asset_id, if_match, body.name)
    session.commit()
    return _with_etag(response, asset)


@router.delete("/assets/{asset_id}", status_code=204)
def delete_asset(
    session: SessionDep, storage: StorageDep, user: CurrentUser, asset_id: str
) -> Response:
    """409 `asset_in_use` while any version's content references it."""
    key = assets.delete(session, user, asset_id)
    session.commit()
    storage.delete(key)
    return Response(status_code=204)
