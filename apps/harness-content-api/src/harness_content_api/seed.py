"""Seed development data (idempotent): `uv run python -m harness_content_api.seed [--demo]`.

`--demo` adds a small sample library; see this app's README for its separate database.
"""

import argparse
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from harness_content_api.db import get_engine
from harness_content_api.models import Location, LocationKind, Role, User
from harness_content_api.schemas import ArtifactCreate, FlowCreate, LocationCreate, StepIn
from harness_content_api.services import artifacts, flows, locations, reviews

DEV_USERS = [
    ("usr_admin", "Admin", Role.ADMIN),
    ("usr_author", "Author", Role.AUTHOR),
    ("usr_reviewer", "Reviewer", Role.REVIEWER),
    ("usr_reviewer2", "Second reviewer", Role.REVIEWER),
    ("usr_viewer", "Viewer", Role.VIEWER),
]


def seed_users(session: Session) -> None:
    for user_id, name, role in DEV_USERS:
        if session.get(User, user_id) is None:
            session.add(User(id=user_id, name=name, role=role))
    session.flush()


DEMO_BOXES = ("Intro to AI", "Prompting", "Evaluation")


def _slide(title: str, body: str) -> dict[str, Any]:
    frame = {"x": 120, "width": 1680}
    return {
        "schemaVersion": 1,
        "type": "slide",
        "theme": "dark",
        "elements": [
            {"id": "title", "type": "text", "variant": "title", "text": title}
            | frame
            | {"y": 120, "height": 160},
            {"id": "body", "type": "text", "variant": "body", "text": body}
            | frame
            | {"y": 340, "height": 400},
        ],
    }


def _doc(title: str, *paragraphs: str) -> dict[str, Any]:
    heading = {"id": "h", "type": "heading", "props": {"level": 1}, "content": title}
    blocks = [
        {"id": f"p{index}", "type": "paragraph", "content": text}
        for index, text in enumerate(paragraphs)
    ]
    return {"schemaVersion": 1, "type": "doc", "blocks": [heading, *blocks]}


def _animation(title: str, *steps: str) -> dict[str, Any]:
    return {
        "schemaVersion": 1,
        "type": "animation",
        "template": "animation.stepsDiagram",
        "props": {"title": title, "steps": [{"label": step} for step in steps]},
    }


def _flow_diagram(*labels: str) -> dict[str, Any]:
    nodes = [
        {"id": f"n{index}", "label": label, "x": index * 240, "y": 0}
        for index, label in enumerate(labels)
    ]
    edges = [
        {"id": f"e{index}", "source": f"n{index}", "target": f"n{index + 1}"}
        for index in range(len(labels) - 1)
    ]
    return {
        "schemaVersion": 1,
        "type": "diagram",
        "engine": "flow",
        "theme": "dark",
        "nodes": nodes,
        "edges": edges,
    }


def _mermaid_diagram(source: str) -> dict[str, Any]:
    return {
        "schemaVersion": 1,
        "type": "diagram",
        "engine": "mermaid",
        "theme": "dark",
        "source": source,
    }


def seed_demo(session: Session) -> None:
    """Add the sample library once; it covers every artifact type, review state and a trail."""
    seed_users(session)
    if session.scalar(select(Location).where(Location.title == DEMO_BOXES[0])):
        return
    author = session.get_one(User, "usr_author")
    reviewer = session.get_one(User, "usr_reviewer")

    def box(title: str) -> str:
        data = LocationCreate(kind=LocationKind.BOX, title=title)
        return locations.create(session, author, data).id

    def draft(location_id: str, title: str, tags: list[str], content: dict[str, Any]):
        data = ArtifactCreate(
            type=content["type"],
            title=title,
            location_id=location_id,
            locale="en",
            tags=tags,
            content=content,
        )
        return artifacts.create_artifact(session, author, data)

    def publish(version_id: str) -> None:
        review = reviews.submit(session, author, version_id, None, "")
        reviews.approve(session, reviewer, review.id, "")
        artifacts.publish(session, reviewer, version_id, "First published version", True)

    intro, prompting, evaluation = (box(title) for title in DEMO_BOXES)
    unit = locations.create(
        session,
        author,
        LocationCreate(kind=LocationKind.UNIT, title="Foundations", parent_id=intro),
    ).id
    trail = [
        draft(
            unit,
            "What is a model",
            ["foundations"],
            _slide("What is a model", "A function learned from examples, not written by hand."),
        ),
        draft(
            unit,
            "How training works",
            ["foundations", "training"],
            _animation("The training loop", "Predict", "Measure the error", "Adjust", "Repeat"),
        ),
        draft(
            unit,
            "Glossary",
            ["foundations", "reference"],
            _doc("Glossary", "A parameter is a value the model learns during training."),
        ),
    ]
    diagrams = [
        draft(
            unit,
            "The training pipeline",
            ["foundations", "training"],
            _flow_diagram("Collect data", "Train", "Evaluate", "Deploy"),
        ),
        draft(
            evaluation,
            "Evaluation decision",
            ["evaluation"],
            _mermaid_diagram(
                "flowchart LR\n  run[Run rubric] --> pass{Pass?}\n"
                "  pass -- yes --> ship[Ship]\n  pass -- no --> fix[Fix]"
            ),
        ),
    ]
    for _, version in [*trail, *diagrams]:
        publish(version.id)

    _, in_review = draft(
        prompting,
        "Writing clear instructions",
        ["prompting"],
        _slide("Writing clear instructions", "Say what you want, for whom, and in what form."),
    )
    reviews.submit(session, author, in_review.id, None, "Ready for a first read")
    draft(
        evaluation,
        "Choosing an evaluation rubric",
        ["evaluation"],
        _doc("Choosing an evaluation rubric", "Start from the failure you most need to catch."),
    )

    flow = flows.create_flow(session, author, FlowCreate(title="AI foundations", locale="en"))
    steps = [
        StepIn(artifact_id=artifact.id, locale="en", artifact_version_id=version.id)
        for artifact, version in trail
    ]
    revision = flows.ensure_draft(session, author, flow.id)
    flows.replace_steps(session, author, flow.id, f'"{revision.edit_revision}"', steps)
    flows.publish(session, reviewer, flow.id, "First published trail")
    session.flush()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Seed development data.")
    parser.add_argument("--demo", action="store_true", help="also add the sample library")
    args = parser.parse_args()
    with Session(get_engine()) as session:
        seed_users(session)
        if args.demo:
            seed_demo(session)
        session.commit()
    print("Seeded:", ", ".join(user_id for user_id, _, _ in DEV_USERS))
    if args.demo:
        print("Seeded demo library:", ", ".join(DEMO_BOXES))
