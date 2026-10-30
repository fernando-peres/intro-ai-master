"""Artifact resources: uploads, markdown notes, type checks and delete protection."""

import pytest

from harness_content_api.main import app
from harness_content_api.services.storage import LocalDiskStorage, get_storage

PNG = b"\x89PNG\r\n\x1a\n" + b"\x00" * 32
NOTE = "## Evaluation notes\n\n- Trace replay is deterministic.\n"


@pytest.fixture
def storage(tmp_path):
    disk = LocalDiskStorage(tmp_path)
    app.dependency_overrides[get_storage] = lambda: disk
    yield disk
    app.dependency_overrides.pop(get_storage, None)


def _upload(api, artifact_id, name, data, user="usr_author", expect=201):
    files = {"file": (name, data)}
    url = "/api/v1/assets"
    return api.post(user, url, None, expect=expect, data={"artifactId": artifact_id}, files=files)


def test_upload_list_and_read_back(api, storage):
    artifact_id = api.artifact()["artifact"]["id"]
    note = _upload(api, artifact_id, "evaluation-notes.md", NOTE.encode()).json()
    image = _upload(api, artifact_id, "../../diagram.png", PNG).json()
    assert (note["mimeType"], note["revision"]) == ("text/markdown", 1)
    assert note["sizeBytes"] == len(NOTE)
    assert image["name"] == "diagram.png", "path components are stripped"

    listed = api.get("usr_viewer", f"/api/v1/artifacts/{artifact_id}/assets").json()
    assert [a["name"] for a in listed] == ["diagram.png", "evaluation-notes.md"]

    body = api.get("usr_viewer", f"/api/v1/assets/{image['id']}/content")
    assert body.content == PNG
    assert body.headers["content-type"] == "image/png"
    assert body.headers["x-content-type-options"] == "nosniff"
    assert body.headers["content-disposition"].startswith("inline")
    text = api.get("usr_viewer", f"/api/v1/assets/{note['id']}/content")
    assert text.text == NOTE and text.headers["content-disposition"].startswith("attachment")


def test_type_size_and_name_rules(api, storage, monkeypatch):
    artifact_id = api.artifact()["artifact"]["id"]
    html = _upload(api, artifact_id, "page.html", b"<script>", expect=422).json()
    assert html["code"] == "unsupported_file"
    disguised = _upload(api, artifact_id, "photo.png", b"<html><script>", expect=422).json()
    assert "not a valid .png" in disguised["detail"]
    binary = _upload(api, artifact_id, "notes.md", b"\xff\xfe\x00", expect=422).json()
    assert "UTF-8" in binary["detail"]

    from harness_content_api.services import assets

    monkeypatch.setattr(assets, "MAX_BYTES", 10)
    big = _upload(api, artifact_id, "big.txt", b"x" * 11, expect=413).json()
    assert big["code"] == "file_too_large"

    _upload(api, artifact_id, "notes.md", b"one")
    dup = _upload(api, artifact_id, "notes.md", b"two", expect=409).json()
    assert dup["code"] == "asset_name_taken"
    _upload(api, artifact_id, "notes.md", b"x", user="usr_viewer", expect=403)


def test_notes_save_with_if_match_and_rename(api, storage):
    artifact_id = api.artifact()["artifact"]["id"]
    note = _upload(api, artifact_id, "untitled.md", b"").json()
    url = f"/api/v1/assets/{note['id']}"

    api.call("PUT", "usr_author", f"{url}/content", 428, json={"text": NOTE})
    saved = api.call(
        "PUT", "usr_author", f"{url}/content", json={"text": NOTE}, headers={"If-Match": '"1"'}
    )
    assert saved.headers["ETag"] == '"2"'
    assert api.get("usr_viewer", f"{url}/content").text == NOTE
    assert len(list(storage.root.iterdir())) == 1, "the previous bytes are removed"

    stale = api.call(
        "PUT", "usr_author", f"{url}/content", 412, json={"text": "x"}, headers={"If-Match": '"1"'}
    )
    assert stale.json()["currentRevision"] == 2

    renamed = api.patch(
        "usr_author", url, {"name": "evaluation-notes.md"}, headers={"If-Match": '"2"'}
    ).json()
    assert (renamed["name"], renamed["revision"]) == ("evaluation-notes.md", 3)
    api.patch("usr_author", url, {"name": "notes.pdf"}, headers={"If-Match": '"3"'}, expect=422)

    image = _upload(api, artifact_id, "diagram.png", PNG).json()
    locked = api.call(
        "PUT",
        "usr_author",
        f"/api/v1/assets/{image['id']}/content",
        409,
        json={"text": "x"},
        headers={"If-Match": '"1"'},
    )
    assert locked.json()["code"] == "not_editable"


def test_delete_is_blocked_while_content_references_the_asset(api, storage):
    created = api.artifact()
    artifact_id, draft_id = created["artifact"]["id"], created["draft"]["id"]
    image = _upload(api, artifact_id, "diagram.png", PNG).json()
    element = {
        "id": "img",
        "type": "image",
        "src": f"/api/v1/assets/{image['id']}/content",
        "x": 0,
        "y": 0,
        "width": 400,
        "height": 300,
    }
    api.edit(draft_id, {"schemaVersion": 1, "type": "slide", "elements": [element]})

    blocked = api.call("DELETE", "usr_author", f"/api/v1/assets/{image['id']}", 409).json()
    assert (blocked["code"], blocked["versions"]) == ("asset_in_use", [draft_id])

    api.edit(draft_id, {"schemaVersion": 1, "type": "slide", "elements": []})
    api.call("DELETE", "usr_author", f"/api/v1/assets/{image['id']}", 204)
    assert list(storage.root.iterdir()) == []
    api.get("usr_viewer", f"/api/v1/assets/{image['id']}", expect=404)


def test_local_disk_rejects_path_keys(tmp_path):
    disk = LocalDiskStorage(tmp_path)
    for key in ("../escape", "a/b", ".hidden", ""):
        with pytest.raises(ValueError):
            disk.put(key, b"x")
