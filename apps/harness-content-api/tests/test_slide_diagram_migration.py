"""Migration 0011: stored `slide.diagram` elements become valid native elements."""

import importlib.util
from pathlib import Path

import pytest
from sqlalchemy import text
from sqlalchemy.orm import Session

from harness_content_api.models import ArtifactVersion, AuditEvent, ReviewRequest
from harness_content_api.services import artifacts, content

PATH = (
    Path(__file__).parents[1]
    / "src/harness_content_api/migrations/versions/0011_slide_diagram_to_shapes.py"
)
spec = importlib.util.spec_from_file_location("migration_0011", PATH)
migration = importlib.util.module_from_spec(spec)
spec.loader.exec_module(migration)

DIAGRAM = {
    "id": "d",
    "type": "diagram",
    "x": 100,
    "y": 200,
    "width": 1000,
    "height": 160,
    "rotation": 0,
    "visible": True,
    "locked": False,
    "labels": ["One", "Two"],
    "style": {"fill": "#112233"},
}


def _slide(*elements: dict) -> dict:
    return {"schemaVersion": 1, "type": "slide", "theme": "dark", "elements": list(elements)}


def test_expansion_keeps_geometry_labels_and_paint_order():
    first = {"id": "a", "type": "rect", "x": 0, "y": 0, "width": 9, "height": 9}
    last = {"id": "z", "type": "rect", "x": 0, "y": 0, "width": 9, "height": 9}
    out = migration.rewrite_content(_slide(first, DIAGRAM, last))
    assert content.issues("slide", out) == []
    assert [e["type"] for e in out["elements"]] == [
        "rect", "rect", "text", "arrow", "rect", "text", "rect",
    ]  # fmt: skip
    node, label, link, second = out["elements"][1:5]
    assert (node["x"], node["y"], node["width"], node["height"]) == (100, 200, 455, 160)
    assert node["style"] == {"fill": "#112233"}
    assert label["text"] == "One"
    assert label["y"] == 200 + (160 - 36) / 2
    assert link["x"] == 100 + 455 + 18
    assert link["y"] + link["height"] / 2 == 200 + 80
    assert second["x"] == 100 + 455 + 90
    assert len({e["groupId"] for e in out["elements"][1:6]}) == 1


def test_rotation_turns_around_the_original_origin():
    out = migration.expand_diagram(DIAGRAM | {"rotation": 90})
    second = out[3]
    assert second["rotation"] == 90
    assert second["x"] == pytest.approx(100)
    assert second["y"] == pytest.approx(200 + 545)


def test_hidden_locked_and_empty_diagrams():
    out = migration.expand_diagram(DIAGRAM | {"labels": [], "visible": False, "locked": True})
    assert [e["type"] for e in out] == ["rect", "text"]
    assert out[1]["text"] == "Step"
    assert all(not e["visible"] and e["locked"] for e in out)


def test_stored_versions_are_rewritten_hashed_and_audited(api, session: Session):
    created = api.artifact()
    version_id = created["draft"]["id"]
    review_id = api.submit(version_id)
    api.approve(review_id)
    version = session.get(ArtifactVersion, version_id)
    version.content = _slide(DIAGRAM)
    session.flush()
    review = session.get(ReviewRequest, review_id)
    review.content_hash = artifacts.content_hash(version)
    session.flush()

    migration.rewrite(session.connection())
    session.expire_all()

    version = session.get(ArtifactVersion, version_id)
    assert "diagram" not in {e["type"] for e in version.content["elements"]}
    assert content.issues("slide", version.content) == []
    # The approval still matches, so the draft can publish without a new review.
    assert session.get(ReviewRequest, review_id).content_hash == artifacts.content_hash(version)
    audit = session.query(AuditEvent).filter_by(entity_id=version_id, action="version.migrate")
    assert audit.count() == 1

    migration.rewrite(session.connection())
    assert audit.count() == 1, "a second run finds nothing to do"
    assert session.execute(text("SELECT 1")).scalar() == 1
    api.publish(version_id)


def test_the_api_no_longer_accepts_slide_diagram(api):
    body = {"title": "x", "locationId": api.box(), "locale": "en", "content": _slide(DIAGRAM)}
    error = api.post("usr_author", "/api/v1/artifacts/import", body, expect=422).json()
    assert "Unknown component 'slide.diagram'" in error["detail"]


def test_slide_embeds_are_checked_like_doc_embeds(api):
    published = api.artifact()
    api.ship(published["draft"]["id"])
    embed = {
        "id": "e",
        "type": "embed",
        "x": 0,
        "y": 0,
        "width": 960,
        "height": 540,
        "ref": {
            "artifactId": published["artifact"]["id"],
            "versionId": published["draft"]["id"],
            "artifactType": "diagram",
        },
    }
    box = api.box()
    body = {"title": "x", "locationId": box, "locale": "en", "content": _slide(embed)}
    api.post("usr_author", "/api/v1/artifacts/import", body, expect=201)
    bad = embed | {"ref": embed["ref"] | {"versionId": "rav_missing"}}
    error = api.post(
        "usr_author", "/api/v1/artifacts/import", body | {"content": _slide(bad)}, expect=422
    ).json()
    assert error["code"] == "invalid_embed"
    assert error["issues"][0]["path"] == "elements.0.ref"
