"""PRD definition-of-done 1–3 and the §5.3 version/state rules."""

import re

V1 = {"schemaVersion": 1, "type": "slide", "elements": [{"id": "e1", "text": "v1"}]}
V2 = {"schemaVersion": 1, "type": "slide", "elements": [{"id": "e1", "text": "v2"}]}


def test_create_makes_root_and_first_draft(api):
    created = api.artifact(tags=["eval", "core"])
    artifact, draft = created["artifact"], created["draft"]
    assert artifact["status"] == "draft-only"
    assert artifact["slug"] == "how-the-harness-evaluates"
    assert artifact["defaults"] == {}
    assert draft["state"] == "draft"
    assert draft["versionNumber"] is None
    assert draft["locale"] == "en"
    assert re.fullmatch(r"\d{4}-\d{2}-\d{2}-\d{2}-\d{2}-\d{2}", artifact["createdAt"])


def test_published_isolation(api):
    """DoD 1: editing a successor draft never changes the published snapshot."""
    created = api.artifact(content=V1)
    artifact_id, draft_id = created["artifact"]["id"], created["draft"]["id"]
    v1 = api.ship(draft_id)
    assert (v1["versionNumber"], v1["state"], v1["isDefault"]) == (1, "published", True)

    successor = api.fork(artifact_id, draft_id)
    assert successor["parentVersionId"] == draft_id
    api.edit(successor["id"], V2)

    reread = api.get("usr_viewer", f"/api/v1/artifact-versions/{draft_id}").json()
    assert reread["content"] == V1
    resolved = api.get("usr_viewer", f"/api/v1/artifacts/{artifact_id}/resolve?locale=en")
    assert resolved.json()["id"] == draft_id


def test_published_content_rejects_patch(api):
    draft_id = api.artifact()["draft"]["id"]
    api.ship(draft_id)
    response = api.patch(
        "usr_admin",
        f"/api/v1/artifact-versions/{draft_id}",
        {"content": V2},
        headers={"If-Match": '"1"'},
        expect=409,
    )
    assert response.json()["code"] == "version_immutable"


def test_multiple_active_versions_one_default(api):
    """DoD 2: EN v2 published while v1 stays active; both load; one default per locale."""
    created = api.artifact(content=V1)
    artifact_id, v1_id = created["artifact"]["id"], created["draft"]["id"]
    api.ship(v1_id)
    v2_id = api.fork(artifact_id, v1_id)["id"]
    api.edit(v2_id, V2)
    v2 = api.ship(v2_id, "Clarified wording")
    assert v2["versionNumber"] == 2
    assert v2["isDefault"] is False, "a later publish keeps the existing default"

    for version_id, content in ((v1_id, V1), (v2_id, V2)):
        version = api.get("usr_viewer", f"/api/v1/artifact-versions/{version_id}").json()
        assert version["isActive"] and version["content"] == content

    api.patch("usr_reviewer", f"/api/v1/artifact-versions/{v2_id}/activation", {"isDefault": True})
    artifact = api.get("usr_viewer", f"/api/v1/artifacts/{artifact_id}").json()
    assert artifact["defaults"] == {"en": v2_id}
    v1 = api.get("usr_viewer", f"/api/v1/artifact-versions/{v1_id}").json()
    assert v1["isActive"] and not v1["isDefault"]


def test_default_cannot_be_deactivated(api):
    draft_id = api.artifact()["draft"]["id"]
    api.ship(draft_id)
    url = f"/api/v1/artifact-versions/{draft_id}/activation"
    response = api.patch("usr_reviewer", url, {"isActive": False}, expect=409)
    assert response.json()["code"] == "default_must_be_active"
    api.patch("usr_reviewer", url, {"isActive": False, "isDefault": False})


def test_make_default_on_publish(api):
    created = api.artifact(content=V1)
    artifact_id, v1_id = created["artifact"]["id"], created["draft"]["id"]
    api.ship(v1_id)
    v2_id = api.fork(artifact_id, v1_id)["id"]
    api.edit(v2_id, V2)
    assert api.ship(v2_id, "New default", makeDefault=True)["isDefault"] is True
    artifact = api.get("usr_viewer", f"/api/v1/artifacts/{artifact_id}").json()
    assert artifact["defaults"] == {"en": v2_id}


def test_independent_locale_counters(api):
    """DoD 3: EN v1, EN v2 and PT v1 have separate counters and immutable ids."""
    created = api.artifact(content=V1)
    artifact_id, en1 = created["artifact"]["id"], created["draft"]["id"]
    api.ship(en1)
    en2 = api.fork(artifact_id, en1)["id"]
    api.edit(en2, V2)
    api.ship(en2, "EN wording")
    pt = api.fork(artifact_id, en1, locale="pt-PT")
    assert pt["sourceVersionId"] == en1 and pt["parentVersionId"] is None
    api.edit(pt["id"], {**V1, "elements": [{"id": "e1", "text": "pt"}]})
    api.ship(pt["id"], "Tradução")

    versions = api.get("usr_viewer", f"/api/v1/artifacts/{artifact_id}/versions").json()
    labels = sorted((v["locale"], v["versionNumber"]) for v in versions)
    assert labels == [("en", 1), ("en", 2), ("pt-PT", 1)]
    assert len({v["id"] for v in versions}) == 3

    missing = api.get(
        "usr_viewer", f"/api/v1/artifacts/{artifact_id}/resolve?locale=fr", expect=404
    )
    assert missing.json()["code"] == "locale_unavailable"
    assert missing.json()["availableLocales"] == ["en", "pt-PT"]


def test_archive_keeps_content_and_number(api):
    created = api.artifact(content=V1)
    artifact_id, draft_id = created["artifact"]["id"], created["draft"]["id"]
    api.ship(draft_id)
    archived = api.post("usr_reviewer", f"/api/v1/artifact-versions/{draft_id}/archive").json()
    assert (archived["state"], archived["versionNumber"]) == ("archived", 1)
    assert not archived["isActive"] and not archived["isDefault"]
    assert api.get("usr_viewer", f"/api/v1/artifact-versions/{draft_id}").json()["content"] == V1
    artifact = api.get("usr_viewer", f"/api/v1/artifacts/{artifact_id}").json()
    assert artifact["status"] == "archived-only"


def test_if_match_is_required_and_checked(api):
    draft_id = api.artifact()["draft"]["id"]
    url = f"/api/v1/artifact-versions/{draft_id}"
    api.patch("usr_author", url, {"content": V1}, expect=428)
    api.patch("usr_author", url, {"content": V1}, headers={"If-Match": '"1"'})
    stale = api.patch("usr_author", url, {"content": V2}, headers={"If-Match": '"1"'}, expect=412)
    assert stale.json()["currentRevision"] == 2


def test_viewer_cannot_read_drafts(api):
    draft_id = api.artifact()["draft"]["id"]
    api.get("usr_viewer", f"/api/v1/artifact-versions/{draft_id}", expect=403)


def test_unknown_user_is_rejected(api):
    api.get("usr_nobody", "/api/v1/me", expect=401)
