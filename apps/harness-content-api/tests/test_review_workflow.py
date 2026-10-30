"""PRD definition-of-done 6 and the §6.1 permission matrix."""


def _doc(text: str) -> dict:
    run = {"type": "text", "text": text, "styles": {}}
    paragraph = {"id": "b1", "type": "paragraph", "content": [run]}
    return {"schemaVersion": 1, "type": "doc", "blocks": [paragraph]}


CONTENT = _doc("draft")
FIXED = _doc("fixed")


def test_request_changes_then_approve_and_publish(api):
    """DoD 6: changes requested → author edits and resubmits → approved → published."""
    draft_id = api.artifact(content=CONTENT)["draft"]["id"]
    first = api.submit(draft_id)
    pending = api.get("usr_reviewer", "/api/v1/reviews?status=pending").json()
    assert [r["id"] for r in pending] == [first]

    api.post(
        "usr_reviewer", f"/api/v1/reviews/{first}/request-changes", {"comment": "Tighten the title"}
    )
    blocked = api.post(
        "usr_reviewer",
        f"/api/v1/artifact-versions/{draft_id}/publish",
        {"changeComment": "x"},
        expect=409,
    )
    assert blocked.json()["code"] == "review_required"

    api.edit(draft_id, FIXED)
    second = api.submit(draft_id)
    api.approve(second)
    published = api.publish(draft_id, "Tightened title")
    assert (published["state"], published["versionNumber"]) == ("published", 1)

    history = api.get("usr_author", f"/api/v1/reviews?versionId={draft_id}").json()
    assert [r["status"] for r in history] == ["approved", "changes_requested"]


def test_author_cannot_publish_or_approve(api):
    draft_id = api.artifact()["draft"]["id"]
    review_id = api.submit(draft_id)
    api.post("usr_author", f"/api/v1/reviews/{review_id}/approve", {}, expect=403)
    api.approve(review_id)
    response = api.post(
        "usr_author",
        f"/api/v1/artifact-versions/{draft_id}/publish",
        {"changeComment": "sneaky"},
        expect=403,
    )
    assert response.json()["code"] == "forbidden"


def test_reviewer_cannot_approve_own_submission_but_admin_can(api):
    draft_id = api.artifact()["draft"]["id"]
    review_id = api.submit(draft_id, user="usr_reviewer")
    own = api.post("usr_reviewer", f"/api/v1/reviews/{review_id}/approve", {}, expect=403)
    assert own.json()["code"] == "self_review"
    api.approve(review_id, user="usr_reviewer2")

    other_draft = api.artifact()["draft"]["id"]
    admin_review = api.submit(other_draft, user="usr_admin")
    api.approve(admin_review, user="usr_admin")


def test_assigned_reviewer_only(api):
    draft_id = api.artifact()["draft"]["id"]
    url = f"/api/v1/artifact-versions/{draft_id}/submit-review"
    review_id = api.post("usr_author", url, {"reviewerId": "usr_reviewer2"}, expect=201).json()[
        "id"
    ]
    api.post("usr_reviewer", f"/api/v1/reviews/{review_id}/approve", {}, expect=403)
    api.approve(review_id, user="usr_reviewer2")


def test_edit_after_approval_invalidates_it(api):
    draft_id = api.artifact(content=CONTENT)["draft"]["id"]
    api.approve(api.submit(draft_id))
    api.edit(draft_id, FIXED)
    stale = api.post(
        "usr_reviewer",
        f"/api/v1/artifact-versions/{draft_id}/publish",
        {"changeComment": "Ship it"},
        expect=409,
    )
    assert stale.json()["code"] == "approval_stale"


def test_edit_while_pending_blocks_approval(api):
    draft_id = api.artifact(content=CONTENT)["draft"]["id"]
    review_id = api.submit(draft_id)
    api.edit(draft_id, FIXED)
    response = api.post("usr_reviewer", f"/api/v1/reviews/{review_id}/approve", {}, expect=409)
    assert response.json()["code"] == "approval_stale"


def test_publish_needs_a_comment(api):
    draft_id = api.artifact()["draft"]["id"]
    api.approve(api.submit(draft_id))
    response = api.post(
        "usr_reviewer",
        f"/api/v1/artifact-versions/{draft_id}/publish",
        {"changeComment": "   "},
        expect=422,
    )
    assert response.json()["code"] == "change_comment_required"


def test_one_pending_review_per_draft(api):
    draft_id = api.artifact()["draft"]["id"]
    api.submit(draft_id)
    url = f"/api/v1/artifact-versions/{draft_id}/submit-review"
    assert api.post("usr_author", url, {}, expect=409).json()["code"] == "review_pending"


def test_authors_edit_only_their_own_drafts(api, session):
    from harness_content_api.models import Role, User

    session.add(User(id="usr_author2", name="Other author", role=Role.AUTHOR))
    session.flush()
    draft_id = api.artifact(content=CONTENT)["draft"]["id"]
    response = api.patch(
        "usr_author2",
        f"/api/v1/artifact-versions/{draft_id}",
        {"content": FIXED},
        headers={"If-Match": '"1"'},
        expect=403,
    )
    assert response.json()["code"] == "forbidden"
    api.edit(draft_id, FIXED, user="usr_reviewer")


def test_viewer_cannot_create(api):
    api.post("usr_viewer", "/api/v1/locations", {"kind": "box", "title": "x"}, expect=403)


def test_script_is_versioned_and_approved_with_content(api):
    created = api.artifact(content=CONTENT)
    artifact_id, draft_id = created["artifact"]["id"], created["draft"]["id"]
    url = f"/api/v1/artifact-versions/{draft_id}"
    etag = api.get("usr_author", url).headers["ETag"]
    saved = api.patch("usr_author", url, {"script": "First we replay."}, headers={"If-Match": etag})
    assert saved.json()["script"] == "First we replay."
    assert saved.json()["content"] == CONTENT

    api.approve(api.submit(draft_id))
    etag = saved.headers["ETag"]
    api.patch("usr_author", url, {"script": "Changed after approval."}, headers={"If-Match": etag})
    stale = api.post(
        "usr_reviewer", f"{url}/publish", {"changeComment": "Ship it"}, expect=409
    ).json()
    assert stale["code"] == "approval_stale"

    api.approve(api.submit(draft_id))
    api.publish(draft_id)
    successor = api.fork(artifact_id, draft_id)
    assert successor["script"] == "Changed after approval."


def test_review_list_carries_artifact_context(api):
    created = api.artifact(locale="pt-PT")
    api.submit(created["draft"]["id"])
    [item] = api.get("usr_reviewer", "/api/v1/reviews?status=pending").json()
    assert item["artifactId"] == created["artifact"]["id"]
    assert item["artifactTitle"] == "How the Harness Evaluates"
    assert (item["artifactType"], item["locale"]) == ("slide", "pt-PT")
