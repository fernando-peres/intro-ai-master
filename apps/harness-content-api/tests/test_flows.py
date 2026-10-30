"""PRD definition-of-done 7–8 and the §5.5 flow-pinning rules."""

V1 = {"schemaVersion": 1, "type": "slide", "elements": [{"id": "e1", "text": "v1"}]}
V2 = {"schemaVersion": 1, "type": "slide", "elements": [{"id": "e1", "text": "v2"}]}


def _published_artifact(api) -> tuple[str, str]:
    created = api.artifact(content=V1)
    artifact_id, v1_id = created["artifact"]["id"], created["draft"]["id"]
    api.ship(v1_id)
    return artifact_id, v1_id


def _step(artifact_id: str, version_id: str | None, **extra) -> dict:
    return {"artifactId": artifact_id, "locale": "en", "artifactVersionId": version_id, **extra}


def test_flow_reuse_stays_pinned(api):
    """DoD 7: one RA in two flows; publishing EN v2 changes neither; a new revision adopts it."""
    artifact_id, v1_id = _published_artifact(api)
    flow_ids = [api.flow("Onboarding path"), api.flow("Instructor track")]
    revisions = {}
    for flow_id in flow_ids:
        api.set_steps(flow_id, [_step(artifact_id, v1_id, label="Harness scoring")])
        published = api.publish_flow(flow_id).json()
        assert (published["revision"], published["state"]) == (1, "published")
        revisions[flow_id] = published["id"]

    v2_id = api.fork(artifact_id, v1_id)["id"]
    api.edit(v2_id, V2)
    api.ship(v2_id, "New wording", makeDefault=True)

    for flow_id in flow_ids:
        played = api.play(flow_id, revisions[flow_id])
        assert [s["version"]["id"] for s in played["steps"]] == [v1_id]
        assert played["steps"][0]["version"]["content"] == V1

    flow_id = flow_ids[0]
    behind = api.get("usr_author", f"/api/v1/flows/{flow_id}/behind").json()
    assert behind["behindCount"] == 1
    assert (behind["steps"][0]["pinnedNumber"], behind["steps"][0]["defaultNumber"]) == (1, 2)

    draft = api.post("usr_author", f"/api/v1/flows/{flow_id}/draft")
    assert draft.json()["parentRevisionId"] == revisions[flow_id]
    adopted = api.post(
        "usr_author",
        f"/api/v1/flows/{flow_id}/draft/use-current-defaults",
        headers={"If-Match": draft.headers["ETag"]},
    ).json()
    assert [s["artifactVersionId"] for s in adopted["steps"]] == [v2_id]
    second = api.publish_flow(flow_id, "Adopt EN v2").json()
    assert second["revision"] == 2
    assert api.play(flow_id, second["id"])["steps"][0]["version"]["content"] == V2
    assert api.play(flow_id, revisions[flow_id])["steps"][0]["version"]["content"] == V1

    usages = api.get("usr_author", f"/api/v1/artifacts/{artifact_id}/usages").json()
    assert {u["flowId"] for u in usages} == set(flow_ids)
    assert len(usages) == 3


def test_archived_pins_stay_playable_but_cannot_be_reused(api):
    """DoD 8 with the B4 default: archived = readable where pinned, not selectable anew."""
    artifact_id, v1_id = _published_artifact(api)
    flow_id = api.flow()
    api.set_steps(flow_id, [_step(artifact_id, v1_id)])
    revision_id = api.publish_flow(flow_id).json()["id"]

    api.post("usr_reviewer", f"/api/v1/artifact-versions/{v1_id}/archive")
    played = api.play(flow_id, revision_id)
    assert played["steps"][0]["version"]["state"] == "archived"
    assert played["steps"][0]["version"]["content"] == V1
    assert api.get("usr_viewer", f"/api/v1/artifact-versions/{v1_id}").json()["content"] == V1

    other = api.flow("Fresh trail")
    rejected = api.set_steps(other, [_step(artifact_id, v1_id)], expect=422)
    assert rejected.json()["code"] == "invalid_step"

    api.post("usr_author", f"/api/v1/flows/{flow_id}/draft")
    blocked = api.publish_flow(flow_id, "Republish", expect=409).json()
    assert blocked["code"] == "steps_not_publishable"
    assert blocked["steps"] == [{"position": 1, "problem": "archived"}]


def test_publish_rejects_unpinned_and_draft_versions(api):
    created = api.artifact()
    artifact_id, draft_id = created["artifact"]["id"], created["draft"]["id"]
    flow_id = api.flow()
    api.set_steps(flow_id, [_step(artifact_id, draft_id)], expect=422)

    api.set_steps(flow_id, [_step(artifact_id, None)])
    blocked = api.publish_flow(flow_id, expect=409).json()
    assert blocked["steps"] == [{"position": 1, "problem": "unpinned"}]

    empty = api.flow("Empty")
    assert api.publish_flow(empty, expect=409).json()["code"] == "empty_flow"


def test_step_locale_must_match_version(api):
    artifact_id, v1_id = _published_artifact(api)
    flow_id = api.flow()
    bad = {**_step(artifact_id, v1_id), "locale": "pt-PT"}
    assert api.set_steps(flow_id, [bad], expect=422).json()["code"] == "invalid_step"


def test_flow_permissions_and_concurrency(api):
    artifact_id, v1_id = _published_artifact(api)
    flow_id = api.flow()
    api.set_steps(flow_id, [_step(artifact_id, v1_id)])
    url = f"/api/v1/flows/{flow_id}/draft"
    api.patch("usr_author", url, {"steps": []}, expect=428)
    api.patch("usr_author", url, {"steps": []}, headers={"If-Match": '"1"'}, expect=412)
    api.post("usr_author", f"/api/v1/flows/{flow_id}/publish", {"changeComment": "x"}, expect=403)
    api.post("usr_viewer", "/api/v1/flows", {"title": "x", "locale": "en"}, expect=403)


def test_steps_keep_order_and_settings(api):
    first, first_v = _published_artifact(api)
    second, second_v = _published_artifact(api)
    flow_id = api.flow()
    steps = [
        _step(second, second_v, advanceSeconds=42, themeOverride="violet"),
        _step(first, first_v, label="Recap", presenterNote="Slow down"),
        _step(second, second_v),
    ]
    draft = api.set_steps(flow_id, steps).json()
    assert [s["artifactId"] for s in draft["steps"]] == [second, first, second]
    assert [s["position"] for s in draft["steps"]] == [1, 2, 3]
    assert draft["steps"][0]["themeOverride"] == "violet"
    assert draft["steps"][1]["artifactTitle"] == "How the Harness Evaluates"

    revision_id = api.publish_flow(flow_id).json()["id"]
    played = api.play(flow_id, revision_id)
    assert played["flow"]["id"] == flow_id
    assert played["steps"][0]["advanceSeconds"] == 42
    assert played["steps"][1]["presenterNote"] == "Slow down"
    flow = api.get("usr_viewer", f"/api/v1/flows/{flow_id}").json()
    assert (flow["latestRevision"], flow["draftRevisionId"], flow["stepCount"]) == (1, None, 3)


def test_viewer_sees_only_published_revisions(api):
    artifact_id, v1_id = _published_artifact(api)
    flow_id = api.flow()
    draft = api.set_steps(flow_id, [_step(artifact_id, v1_id)]).json()
    api.get("usr_viewer", f"/api/v1/flows/{flow_id}/revisions/{draft['id']}", expect=403)
    assert api.get("usr_viewer", f"/api/v1/flows/{flow_id}/revisions").json() == []
