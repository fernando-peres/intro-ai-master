"""Embeds must pin a published version of the named artifact on import, submit and publish."""

import pytest


def _doc(artifact_id: str, version_id: str) -> dict:
    props = {"artifactId": artifact_id, "versionId": version_id, "artifactType": "doc"}
    nested = {"id": "e", "type": "raEmbed", "props": props}
    wrapper = {"id": "t", "type": "toggleListItem", "children": [nested]}
    return {"schemaVersion": 1, "type": "doc", "blocks": [wrapper]}


def _import(api, content: dict, expect: int):
    body = {"title": "Host", "locationId": api.box(), "locale": "en", "content": content}
    return api.post("usr_author", "/api/v1/artifacts/import", body, expect=expect).json()


@pytest.fixture
def published(api) -> dict:
    created = api.artifact()
    api.ship(created["draft"]["id"])
    return created


def test_a_published_pin_is_accepted_through_publish(api, published):
    target = published["draft"]["id"]
    host = _import(api, _doc(published["artifact"]["id"], target), 201)
    api.ship(host["draft"]["id"])


def test_import_rejects_draft_foreign_and_unknown_versions(api, published):
    draft = api.artifact()
    artifact_id = published["artifact"]["id"]
    target = published["draft"]["id"]

    error = _import(api, _doc(draft["artifact"]["id"], draft["draft"]["id"]), 422)
    assert error["code"] == "invalid_embed"
    assert "is a draft" in error["issues"][0]["message"]
    assert error["issues"][0]["path"] == "blocks.0.children.0.props"

    error = _import(api, _doc(draft["artifact"]["id"], target), 422)
    assert "does not belong to artifact" in error["issues"][0]["message"]

    error = _import(api, _doc(artifact_id, "rav_missing"), 422)
    assert "does not exist" in error["issues"][0]["message"]


def test_submit_and_publish_recheck_embeds(api, published):
    host = api.artifact(content=_doc("", ""))
    host_id = host["draft"]["id"]
    url = f"/api/v1/artifact-versions/{host_id}/submit-review"
    response = api.post("usr_author", url, {}, expect=422).json()
    assert response["code"] == "invalid_embed"

    target = published["draft"]["id"]
    api.edit(host_id, _doc(published["artifact"]["id"], target))
    api.approve(api.submit(host_id))
    api.post("usr_reviewer", f"/api/v1/artifact-versions/{target}/archive")
    publish = f"/api/v1/artifact-versions/{host_id}/publish"
    error = api.post("usr_reviewer", publish, {"changeComment": "x"}, expect=422).json()
    assert error["code"] == "invalid_embed"
    assert "archived" in error["issues"][0]["message"]


def test_a_fork_keeps_an_inherited_archived_pin(api, published):
    target = published["draft"]["id"]
    host = _import(api, _doc(published["artifact"]["id"], target), 201)
    api.ship(host["draft"]["id"])
    api.post("usr_reviewer", f"/api/v1/artifact-versions/{target}/archive")
    fork = api.fork(host["artifact"]["id"], host["draft"]["id"])
    api.ship(fork["id"], "Second")
