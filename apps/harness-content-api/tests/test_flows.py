"""PRD definition-of-done 7–8 and the §5.5 flow-pinning rules."""


def _slide(text: str) -> dict:
    title = {"id": "e1", "type": "text", "variant": "title", "text": text}
    box = {"x": 0, "y": 0, "width": 800, "height": 120}
    return {"schemaVersion": 1, "type": "slide", "elements": [title | box]}


V1 = _slide("v1")
V2 = _slide("v2")


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
    design = {"instructionalDesign": {"durationSeconds": 90}}
    api.patch("usr_author", f"/api/v1/artifacts/{first}", design)
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
    assert [s["durationSeconds"] for s in draft["steps"]] == [None, 90, None]

    revision_id = api.publish_flow(flow_id).json()["id"]
    played = api.play(flow_id, revision_id)
    assert played["flow"]["id"] == flow_id
    assert played["steps"][0]["advanceSeconds"] == 42
    assert played["steps"][1]["presenterNote"] == "Slow down"
    assert played["steps"][1]["durationSeconds"] == 90
    flow = api.get("usr_viewer", f"/api/v1/flows/{flow_id}").json()
    assert (flow["latestRevision"], flow["draftRevisionId"], flow["stepCount"]) == (1, None, 3)


def test_viewer_sees_only_published_revisions(api):
    artifact_id, v1_id = _published_artifact(api)
    flow_id = api.flow()
    draft = api.set_steps(flow_id, [_step(artifact_id, v1_id)]).json()
    api.get("usr_viewer", f"/api/v1/flows/{flow_id}/revisions/{draft['id']}", expect=403)
    assert api.get("usr_viewer", f"/api/v1/flows/{flow_id}/revisions").json() == []


def _unit(key: str, *children: dict, **rationale) -> dict:
    return {
        "kind": "unit",
        "key": key,
        "title": key.title(),
        "rationale": rationale,
        "children": [*children],
    }


def _pill(key: str, *children: dict) -> dict:
    return {"kind": "pill", "key": key, "title": key.title(), "children": [*children]}


def _ref(position: int) -> dict:
    return {"kind": "step", "step": position}


def test_outline_is_frozen_with_the_revision(api):
    artifact_id, v1_id = _published_artifact(api)
    flow_id = api.flow()
    steps = [_step(artifact_id, v1_id) for _ in range(3)]
    outline = {
        "rationale": {"summary": "Why this trail", "objectives": ["Score a harness"]},
        "nodes": [
            _ref(1),
            _unit("basics", _pill("scoring", _ref(2)), _ref(3), objectives=["Read a score"]),
        ],
    }
    saved = api.set_steps(flow_id, steps, outline=outline).json()["outline"]
    assert saved["rationale"]["objectives"] == ["Score a harness"]
    unit = saved["nodes"][1]
    assert (unit["key"], unit["rationale"]["objectives"]) == ("basics", ["Read a score"])
    assert unit["children"][0]["children"] == [_ref(2)]

    published = api.publish_flow(flow_id).json()
    assert published["outline"] == saved
    assert api.play(flow_id, published["id"])["outline"] == saved

    draft = api.post("usr_author", f"/api/v1/flows/{flow_id}/draft").json()
    assert draft["outline"] == saved
    api.set_steps(flow_id, steps)
    url = f"/api/v1/flows/{flow_id}/revisions/{published['id']}"
    assert api.get("usr_author", url).json()["outline"] == saved


def test_steps_without_an_outline_sit_at_the_root(api):
    artifact_id, v1_id = _published_artifact(api)
    flow_id = api.flow()
    saved = api.set_steps(flow_id, [_step(artifact_id, v1_id)] * 2).json()["outline"]
    assert saved["nodes"] == [_ref(1), _ref(2)]
    assert saved["rationale"]["checklist"] == []


def test_invalid_outlines_are_rejected(api):
    artifact_id, v1_id = _published_artifact(api)
    flow_id = api.flow()
    steps = [_step(artifact_id, v1_id)] * 2
    for nodes in (
        [_ref(1), _ref(1)],
        [_ref(1)],
        [_ref(2), _ref(1)],
        [_unit("a", _ref(1)), _unit("a", _ref(2))],
    ):
        response = api.set_steps(flow_id, steps, expect=422, outline={"nodes": nodes})
        assert response.json()["code"] == "invalid_outline"
    api.set_steps(flow_id, steps, expect=422, outline={"nodes": [_pill("p", _ref(1)), _ref(2)]})


def _trail(api, artifact_id: str, flow_id: str) -> dict:
    trails = api.get("usr_viewer", f"/api/v1/artifacts/{artifact_id}/trails").json()
    return next(entry for entry in trails if entry["flowId"] == flow_id)


def test_artifact_joins_and_leaves_a_trail_keeping_the_outline(api):
    first, first_v = _published_artifact(api)
    second, second_v = _published_artifact(api)
    third, third_v = _published_artifact(api)
    flow_id = api.flow("Linked")
    url = f"/api/v1/artifacts/{third}/trails/{flow_id}"
    unit = {
        "kind": "unit",
        "key": "u1",
        "title": "Unit",
        "children": [{"kind": "step", "step": 1}],
    }
    api.set_steps(
        flow_id,
        [_step(first, first_v), _step(second, second_v)],
        outline={"nodes": [unit, {"kind": "step", "step": 2}]},
    )

    api.put("usr_author", url, expect=204)
    api.put("usr_author", url, expect=204)
    draft = api.get("usr_author", f"/api/v1/flows/{flow_id}/draft").json()
    assert [step["artifactVersionId"] for step in draft["steps"]] == [first_v, second_v, third_v]
    assert draft["outline"]["nodes"][0]["title"] == "Unit"
    assert draft["outline"]["nodes"][-1]["step"] == 3
    assert _trail(api, third, flow_id)["inDraft"] is True

    api.delete("usr_author", f"/api/v1/artifacts/{first}/trails/{flow_id}", expect=204)
    draft = api.get("usr_author", f"/api/v1/flows/{flow_id}/draft").json()
    assert [step["position"] for step in draft["steps"]] == [1, 2]
    assert draft["outline"]["nodes"][0]["children"] == []
    assert [node["step"] for node in draft["outline"]["nodes"][1:]] == [1, 2]


def test_leaving_a_trail_only_changes_the_draft(api):
    artifact_id, v1_id = _published_artifact(api)
    flow_id = api.flow("Frozen")
    api.set_steps(flow_id, [_step(artifact_id, v1_id)])
    revision = api.publish_flow(flow_id).json()

    api.delete("usr_author", f"/api/v1/artifacts/{artifact_id}/trails/{flow_id}", expect=204)
    trail = _trail(api, artifact_id, flow_id)
    assert (trail["inDraft"], trail["publishedRevisions"]) == (False, [1])
    frozen = api.get("usr_author", f"/api/v1/flows/{flow_id}/revisions/{revision['id']}").json()
    assert len(frozen["steps"]) == 1


def test_only_editors_can_link_published_artifacts(api):
    artifact_id, _ = _published_artifact(api)
    flow_id = api.flow("Guarded")
    url = f"/api/v1/artifacts/{artifact_id}/trails/{flow_id}"
    api.put("usr_viewer", url, expect=403)
    api.delete("usr_viewer", url, expect=403)
    unpublished = api.artifact(content=V1)["artifact"]["id"]
    blocked = api.put("usr_author", f"/api/v1/artifacts/{unpublished}/trails/{flow_id}", expect=409)
    assert blocked.json()["code"] == "artifact_not_published"


def test_draft_plays_in_its_current_order(api):
    first, first_v = _published_artifact(api)
    added, _ = _published_artifact(api)
    flow_id = api.flow("Live")
    api.set_steps(flow_id, [_step(first, first_v)])
    published = api.publish_flow(flow_id).json()["id"]
    api.put("usr_author", f"/api/v1/artifacts/{added}/trails/{flow_id}", expect=204)
    draft = api.get("usr_author", f"/api/v1/flows/{flow_id}/draft").json()
    url = f"/api/v1/flows/{flow_id}/revisions/{draft['id']}/play"

    played = api.get("usr_author", url).json()
    assert [step["artifact"]["id"] for step in played["steps"]] == [first, added]
    assert len(api.play(flow_id, published)["steps"]) == 1
    api.get("usr_viewer", url, expect=403)


def test_draft_play_skips_unpinned_steps_and_renumbers(api):
    first, first_v = _published_artifact(api)
    second, second_v = _published_artifact(api)
    flow_id = api.flow("Partial")
    api.set_steps(flow_id, [_step(first, None), _step(second, second_v)])
    draft = api.get("usr_author", f"/api/v1/flows/{flow_id}/draft").json()
    url = f"/api/v1/flows/{flow_id}/revisions/{draft['id']}/play"

    played = api.get("usr_author", url).json()
    assert [step["position"] for step in played["steps"]] == [1]
    assert played["outline"]["nodes"] == [{"kind": "step", "step": 1}]

    api.set_steps(flow_id, [_step(first, None)])
    assert api.get("usr_author", url, expect=409).json()["code"] == "empty_flow"
