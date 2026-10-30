"""Registry-backed validation: JSON import per type, unknown components, readable issues."""

import pytest

SLIDE = {
    "schemaVersion": 1,
    "type": "slide",
    "theme": "violet",
    "elements": [
        {
            "id": "t",
            "type": "text",
            "variant": "title",
            "text": "Generated",
            "x": 120,
            "y": 120,
            "width": 900,
            "height": 140,
        },
        {
            "id": "c",
            "type": "chart",
            "chartType": "bar",
            "x": 1000,
            "y": 360,
            "width": 760,
            "height": 600,
            "data": {"labels": ["A", "B"], "series": [{"name": "Runs", "values": [3, 5]}]},
        },
    ],
}
DOC = {
    "schemaVersion": 1,
    "type": "doc",
    "blocks": [
        {"id": "h", "type": "heading", "props": {"level": 1}, "content": "Rubric"},
        {"id": "c", "type": "callout", "children": [{"id": "p", "type": "paragraph"}]},
    ],
}
ANIMATION = {
    "schemaVersion": 1,
    "type": "animation",
    "template": "animation.stepsDiagram",
    "props": {"title": "Run loop", "steps": [{"label": "A"}, {"label": "B"}]},
}


def _import(api, content, expect=201, **fields):
    body = {"title": "Imported", "locationId": api.box(), "locale": "en", "content": content}
    return api.post("usr_author", "/api/v1/artifacts/import", body | fields, expect=expect).json()


@pytest.mark.parametrize("content", [SLIDE, DOC, ANIMATION], ids=["slide", "doc", "animation"])
def test_valid_json_imports_as_an_editable_draft(api, content):
    created = _import(api, content)
    assert created["artifact"]["type"] == content["type"]
    assert created["draft"]["state"] == "draft"
    assert created["draft"]["content"] == content
    # Editable: the draft accepts a save of its own content.
    api.edit(created["draft"]["id"], content)


@pytest.mark.parametrize(
    ("content", "name"),
    [
        ({**SLIDE, "elements": [{**SLIDE["elements"][0], "type": "video"}]}, "'slide.video'"),
        (
            {**DOC, "blocks": [{**DOC["blocks"][1], "children": [{"id": "x", "type": "iframe"}]}]},
            "'doc.iframe'",
        ),
        ({**ANIMATION, "template": "animation.networkGraph"}, "'animation.networkGraph'"),
    ],
    ids=["slide", "doc-nested", "animation"],
)
def test_unknown_components_are_rejected_by_name(api, content, name):
    error = _import(api, content, expect=422)
    assert error["code"] == "unknown_component"
    assert f"Unknown component {name}" in error["detail"]
    assert "supported:" in error["detail"]


def test_schema_errors_name_the_field(api):
    bad = {**SLIDE, "elements": [{**SLIDE["elements"][0], "width": -5}]}
    error = _import(api, bad, expect=422)
    assert error["code"] == "invalid_content"
    assert error["issues"][0]["path"] == "elements.0.width"
    assert "minimum" in error["issues"][0]["message"] or "0" in error["issues"][0]["message"]

    missing = _import(api, {**SLIDE, "elements": [{"id": "x", "x": 0}]}, expect=422)
    assert missing["issues"][0]["message"].startswith("Unknown component: no component type")

    tone = {"id": "c", "type": "callout", "props": {"tone": "info"}}
    callout = _import(api, {**DOC, "blocks": [tone]}, expect=422)
    assert callout["issues"][0]["path"] == "blocks.0.props.tone"

    wrong = _import(api, {"schemaVersion": 1, "type": "video"}, expect=422)
    assert wrong["code"] == "unknown_type"


def test_saves_and_publish_check_content_too(api, session):
    from harness_content_api.models import ArtifactVersion

    draft_id = api.artifact()["draft"]["id"]
    etag = api.get("usr_author", f"/api/v1/artifact-versions/{draft_id}").headers["ETag"]
    body = {"content": {**SLIDE, "elements": [{**SLIDE["elements"][0], "type": "video"}]}}
    url = f"/api/v1/artifact-versions/{draft_id}"
    error = api.patch("usr_author", url, body, headers={"If-Match": etag}, expect=422).json()
    assert error["code"] == "unknown_component"

    # Content written before validation existed cannot be published.
    version = session.get(ArtifactVersion, draft_id)
    version.content = {**SLIDE, "elements": [{"id": "old", "text": "legacy"}]}
    session.flush()
    api.approve(api.submit(draft_id))
    publish = f"/api/v1/artifact-versions/{draft_id}/publish"
    error = api.post("usr_reviewer", publish, {"changeComment": "x"}, expect=422).json()
    assert error["detail"].startswith("elements.0: Unknown component")


def test_registry_lists_allowlisted_components(api):
    registry = api.get("usr_viewer", "/api/v1/registry").json()
    assert set(registry["types"]) == {"slide", "doc", "animation"}
    slide = {c["componentType"] for c in registry["types"]["slide"]["components"]}
    assert {"slide.text", "slide.chart", "slide.image"} <= slide
    reveal = registry["types"]["animation"]["components"][0]
    assert reveal["componentType"] == "animation.reveal"
    assert "points" in reveal["props"]["properties"]
    # New drafts start from the registry's empty content.
    created = api.post(
        "usr_author",
        "/api/v1/artifacts",
        {"type": "animation", "title": "Blank", "locationId": api.box(), "locale": "en"},
        expect=201,
    ).json()
    assert created["draft"]["content"]["template"] == "animation.reveal"
