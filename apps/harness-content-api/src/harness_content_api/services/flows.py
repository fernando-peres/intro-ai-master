"""Flows (UI: trails): one mutable draft revision plus frozen, numbered published revisions.

A published revision pins every step to a published artifact-version id; publishing a newer
artifact version never changes it. Archived versions stay playable where already pinned but
cannot be chosen for a draft or a new publication.
"""

from typing import Any

from sqlalchemy import delete, distinct, func, select
from sqlalchemy.orm import Session

from harness_content_api.auth import EDITORS, PUBLISHERS, require
from harness_content_api.errors import Conflict, Forbidden, Invalid, NotFound, PreconditionFailed
from harness_content_api.ids import new_id
from harness_content_api.models import (
    Artifact,
    ArtifactVersion,
    Flow,
    FlowRevision,
    FlowStep,
    RevisionState,
    Role,
    User,
    VersionState,
)
from harness_content_api.schemas import FlowCreate, FlowUpdate, StepIn
from harness_content_api.services import audit
from harness_content_api.services.artifacts import parse_if_match
from harness_content_api.timestamps import utc_now


def get_flow(session: Session, flow_id: str, *, lock: bool = False) -> Flow:
    query = select(Flow).where(Flow.id == flow_id)
    flow = session.scalar(query.with_for_update() if lock else query)
    if flow is None:
        raise NotFound("flow_not_found", f"Flow {flow_id} does not exist")
    return flow


def _draft(session: Session, flow_id: str) -> FlowRevision | None:
    return session.scalar(
        select(FlowRevision).where(
            FlowRevision.flow_id == flow_id, FlowRevision.state == RevisionState.DRAFT
        )
    )


def _latest_published(session: Session, flow_id: str) -> FlowRevision | None:
    return session.scalar(
        select(FlowRevision)
        .where(FlowRevision.flow_id == flow_id, FlowRevision.state == RevisionState.PUBLISHED)
        .order_by(FlowRevision.revision.desc())
        .limit(1)
    )


def steps_of(session: Session, revision_id: str) -> list[FlowStep]:
    return list(
        session.scalars(
            select(FlowStep).where(FlowStep.revision_id == revision_id).order_by(FlowStep.position)
        )
    )


def describe_flow(session: Session, flow: Flow) -> dict[str, Any]:
    columns = {c.key: getattr(flow, c.key) for c in Flow.__mapper__.column_attrs}
    draft = _draft(session, flow.id)
    latest = _latest_published(session, flow.id)
    shown = draft or latest
    step_count = len(steps_of(session, shown.id)) if shown else 0
    return columns | {
        "draft_revision_id": draft.id if draft else None,
        "latest_revision_id": latest.id if latest else None,
        "latest_revision": latest.revision if latest else None,
        "step_count": step_count,
    }


def describe_revision(session: Session, revision: FlowRevision) -> dict[str, Any]:
    """Revision fields plus its steps, each annotated with artifact title/type and pin state."""
    columns = {c.key: getattr(revision, c.key) for c in FlowRevision.__mapper__.column_attrs}
    rows = session.execute(
        select(FlowStep, Artifact, ArtifactVersion)
        .join(Artifact, Artifact.id == FlowStep.artifact_id)
        .outerjoin(ArtifactVersion, ArtifactVersion.id == FlowStep.artifact_version_id)
        .where(FlowStep.revision_id == revision.id)
        .order_by(FlowStep.position)
    )
    steps = []
    for step, artifact, version in rows:
        fields = {c.key: getattr(step, c.key) for c in FlowStep.__mapper__.column_attrs}
        steps.append(
            fields
            | {
                "artifact_title": artifact.title,
                "artifact_type": artifact.type,
                "version_number": version.version_number if version else None,
                "version_state": version.state if version else None,
            }
        )
    return columns | {"steps": steps}


def list_flows(session: Session) -> list[Flow]:
    return list(session.scalars(select(Flow).order_by(Flow.updated_at.desc())))


def create_flow(session: Session, user: User, data: FlowCreate) -> Flow:
    require(user, EDITORS, "create flows")
    flow = Flow(
        id=new_id("flw"),
        title=data.title,
        description=data.description,
        locale=data.locale,
        meta=data.meta,
        theme=data.theme,
        created_by=user.id,
    )
    session.add(flow)
    session.flush()
    session.add(
        FlowRevision(
            id=new_id("frv"), flow_id=flow.id, state=RevisionState.DRAFT, created_by=user.id
        )
    )
    session.flush()
    audit.record(session, user, "flow.create", "flow", flow.id)
    return flow


def update_flow(session: Session, user: User, flow_id: str, data: FlowUpdate) -> Flow:
    require(user, EDITORS, "edit flows")
    flow = get_flow(session, flow_id)
    for name, value in data.model_dump(exclude_unset=True).items():
        setattr(flow, name, value)
    session.flush()
    return flow


def get_draft(session: Session, flow_id: str) -> FlowRevision:
    get_flow(session, flow_id)
    draft = _draft(session, flow_id)
    if draft is None:
        raise NotFound("no_draft", f"Flow {flow_id} has no draft; POST /draft to start one")
    return draft


def ensure_draft(session: Session, user: User, flow_id: str) -> FlowRevision:
    """The existing draft, or a new one copied from the latest published revision."""
    require(user, EDITORS, "edit flows")
    get_flow(session, flow_id, lock=True)
    draft = _draft(session, flow_id)
    if draft is not None:
        return draft
    latest = _latest_published(session, flow_id)
    draft = FlowRevision(
        id=new_id("frv"),
        flow_id=flow_id,
        state=RevisionState.DRAFT,
        parent_revision_id=latest.id if latest else None,
        created_by=user.id,
    )
    session.add(draft)
    session.flush()
    if latest is not None:
        for step in steps_of(session, latest.id):
            session.add(_copy_step(step, draft.id))
    session.flush()
    return draft


def _copy_step(step: FlowStep, revision_id: str) -> FlowStep:
    fields = {c.key: getattr(step, c.key) for c in FlowStep.__mapper__.column_attrs}
    return FlowStep(**(fields | {"id": new_id("fst"), "revision_id": revision_id}))


def _check_step(session: Session, position: int, step: StepIn) -> None:
    artifact = session.get(Artifact, step.artifact_id)
    if artifact is None:
        raise Invalid("invalid_step", f"Step {position}: artifact {step.artifact_id} not found")
    if step.artifact_version_id is None:
        return
    version = session.get(ArtifactVersion, step.artifact_version_id)
    if version is None or version.artifact_id != artifact.id:
        raise Invalid("invalid_step", f"Step {position}: version does not belong to {artifact.id}")
    if version.locale != step.locale:
        raise Invalid(
            "invalid_step", f"Step {position}: version is {version.locale}, step is {step.locale}"
        )
    if version.state != VersionState.PUBLISHED:
        raise Invalid(
            "invalid_step",
            f"Step {position}: only published versions can be pinned ({version.state})",
        )


def _locked_draft(session: Session, flow_id: str, if_match: str | None) -> FlowRevision:
    expected = parse_if_match(if_match)
    get_flow(session, flow_id, lock=True)
    draft = get_draft(session, flow_id)
    if draft.edit_revision != expected:
        raise PreconditionFailed(
            "revision_mismatch",
            f"Draft is at edit revision {draft.edit_revision}, not {expected}",
            currentRevision=draft.edit_revision,
        )
    return draft


def replace_steps(
    session: Session, user: User, flow_id: str, if_match: str | None, steps: list[StepIn]
) -> FlowRevision:
    require(user, EDITORS, "edit flows")
    draft = _locked_draft(session, flow_id, if_match)
    for position, step in enumerate(steps, start=1):
        _check_step(session, position, step)
    session.execute(delete(FlowStep).where(FlowStep.revision_id == draft.id))
    session.flush()
    for position, step in enumerate(steps, start=1):
        session.add(
            FlowStep(id=new_id("fst"), revision_id=draft.id, position=position, **step.model_dump())
        )
    draft.edit_revision += 1
    session.flush()
    return draft


def use_current_defaults(
    session: Session, user: User, flow_id: str, if_match: str | None
) -> FlowRevision:
    """Re-pin every draft step to its artifact's current default in the step's locale."""
    require(user, EDITORS, "edit flows")
    draft = _locked_draft(session, flow_id, if_match)
    for step in steps_of(session, draft.id):
        default_id = session.scalar(
            select(ArtifactVersion.id).where(
                ArtifactVersion.artifact_id == step.artifact_id,
                ArtifactVersion.locale == step.locale,
                ArtifactVersion.is_default,
            )
        )
        if default_id is not None:
            step.artifact_version_id = default_id
    draft.edit_revision += 1
    session.flush()
    return draft


def publish(session: Session, user: User, flow_id: str, change_comment: str) -> FlowRevision:
    require(user, PUBLISHERS, "publish flows")
    if not change_comment.strip():
        raise Invalid("change_comment_required", "Publishing needs a change comment")
    get_flow(session, flow_id, lock=True)
    draft = get_draft(session, flow_id)
    steps = steps_of(session, draft.id)
    if not steps:
        raise Conflict("empty_flow", "A flow needs at least one step to publish")
    problems = []
    for step in steps:
        version = session.get(ArtifactVersion, step.artifact_version_id or "")
        if version is None:
            problems.append({"position": step.position, "problem": "unpinned"})
        elif version.state != VersionState.PUBLISHED:
            problems.append({"position": step.position, "problem": version.state.value})
    if problems:
        raise Conflict(
            "steps_not_publishable",
            "Every step must pin a published version",
            steps=problems,
        )
    highest = session.scalar(
        select(func.max(FlowRevision.revision)).where(FlowRevision.flow_id == flow_id)
    )
    draft.revision = (highest or 0) + 1
    draft.state = RevisionState.PUBLISHED
    draft.change_comment = change_comment.strip()
    draft.published_at = utc_now()
    draft.published_by = user.id
    session.flush()
    audit.record(session, user, "flow.publish", "flow_revision", draft.id, revision=draft.revision)
    return draft


def list_revisions(session: Session, user: User, flow_id: str) -> list[FlowRevision]:
    get_flow(session, flow_id)
    query = select(FlowRevision).where(FlowRevision.flow_id == flow_id)
    if user.role == Role.VIEWER:
        query = query.where(FlowRevision.state == RevisionState.PUBLISHED)
    return list(session.scalars(query.order_by(FlowRevision.revision.desc().nulls_first())))


def get_revision(session: Session, user: User, flow_id: str, revision_id: str) -> FlowRevision:
    revision = session.get(FlowRevision, revision_id)
    if revision is None or revision.flow_id != flow_id:
        raise NotFound("revision_not_found", f"Revision {revision_id} is not in flow {flow_id}")
    if user.role == Role.VIEWER and revision.state != RevisionState.PUBLISHED:
        raise Forbidden("forbidden", "Viewers can only read published revisions")
    return revision


def behind(session: Session, user: User, flow_id: str, revision_id: str | None) -> dict:
    """Per step: pinned version vs the artifact's current default in that locale."""
    if revision_id is None:
        revision = _draft(session, flow_id) or _latest_published(session, flow_id)
        if revision is None:
            raise NotFound("revision_not_found", f"Flow {flow_id} has no revisions")
    else:
        revision = get_revision(session, user, flow_id, revision_id)
    report = []
    for step in steps_of(session, revision.id):
        pinned = session.get(ArtifactVersion, step.artifact_version_id or "")
        default = session.scalar(
            select(ArtifactVersion).where(
                ArtifactVersion.artifact_id == step.artifact_id,
                ArtifactVersion.locale == step.locale,
                ArtifactVersion.is_default,
            )
        )
        report.append(
            {
                "step_id": step.id,
                "position": step.position,
                "artifact_id": step.artifact_id,
                "artifact_title": session.get(Artifact, step.artifact_id).title,
                "locale": step.locale,
                "pinned_version_id": pinned.id if pinned else None,
                "pinned_number": pinned.version_number if pinned else None,
                "pinned_state": pinned.state if pinned else None,
                "default_version_id": default.id if default else None,
                "default_number": default.version_number if default else None,
                "behind": default is not None and (pinned is None or pinned.id != default.id),
            }
        )
    return {
        "revision_id": revision.id,
        "behind_count": sum(item["behind"] for item in report),
        "steps": report,
    }


def playback(session: Session, user: User, flow_id: str, revision_id: str) -> dict:
    """A published revision with each step's pinned version content."""
    flow = get_flow(session, flow_id)
    revision = get_revision(session, user, flow_id, revision_id)
    if revision.state != RevisionState.PUBLISHED:
        raise Conflict("not_published", "Only published revisions can be played")
    steps = []
    for step in steps_of(session, revision.id):
        artifact = session.get(Artifact, step.artifact_id)
        steps.append(
            {
                "id": step.id,
                "position": step.position,
                "label": step.label,
                "presenter_note": step.presenter_note,
                "advance_seconds": step.advance_seconds,
                "theme_override": step.theme_override,
                "artifact": artifact,
                "version": session.get(ArtifactVersion, step.artifact_version_id),
            }
        )
    return {"flow": flow, "revision": revision, "steps": steps}


def usages(session: Session, artifact_id: str) -> list[dict]:
    rows = session.execute(
        select(Flow, FlowRevision, FlowStep)
        .join(FlowRevision, FlowRevision.flow_id == Flow.id)
        .join(FlowStep, FlowStep.revision_id == FlowRevision.id)
        .where(FlowStep.artifact_id == artifact_id)
        .order_by(Flow.title, FlowRevision.revision.desc().nulls_first(), FlowStep.position)
    )
    grouped: dict[str, dict] = {}
    for flow, revision, step in rows:
        entry = grouped.setdefault(
            revision.id,
            {
                "flow_id": flow.id,
                "flow_title": flow.title,
                "revision_id": revision.id,
                "revision": revision.revision,
                "state": revision.state,
                "positions": [],
                "version_ids": [],
            },
        )
        entry["positions"].append(step.position)
        entry["version_ids"].append(step.artifact_version_id)
    return list(grouped.values())


def reuse_count(session: Session, artifact_id: str) -> int:
    """Distinct flows that reference the artifact in any revision."""
    return session.scalar(
        select(func.count(distinct(FlowRevision.flow_id)))
        .join(FlowStep, FlowStep.revision_id == FlowRevision.id)
        .where(FlowStep.artifact_id == artifact_id)
    )
