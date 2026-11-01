# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary: authors and instructional designers on a small team, who spend long sessions creating, editing and curating reusable learning artifacts, then assembling them into trails.

Also served: reviewers/publishers, who approve drafts and publish immutable versions; learners and presenters, who consume trails in the player; AI-assisted creators, who produce schema-valid content that stays editable.

## Product Purpose

The Reusable Artifacts Studio authors, versions, localizes, finds and reuses small self-contained units of learning (slides, documents, animations) and composes them into ordered flows, called trails in the UI. Full requirements: [docs/reusable-artifacts-prd-v0.1.md](docs/reusable-artifacts-prd-v0.1.md).

## Positioning

Generate once, edit freely, reuse deliberately, publish safely. AI-assisted creation yields an editable source of truth, not a screenshot, flattened HTML or an opaque component.

## Operating Context

- Authors move between search, a type-specific editor and the trail builder.
- Drafts autosave with optimistic concurrency; publishing goes through review with a mandatory change comment.
- Presenters run trails full screen, with deep links per step and keyboard control.

## Capabilities and Constraints

- Artifact types: slide (free-positioning canvas), document, parameter-driven animation.
- Undecided: the diagram type is partly built (API enum and a plugin model) and can't be created in the app yet.
- Organization: Box, Unit, Section; an artifact can sit at any level.
- Each locale has its own version sequence; drafts consume no published number.
- A published flow revision pins exact artifact versions; later artifact updates never change it.
- Roles: admin, author, reviewer, viewer, with distinct edit, review and publish rights. Small team only; no enterprise multi-tenancy.
- Authoring needs 1024px or wider; the player works on any screen.
- Terminology: "artifact", "version", "box/unit/section", "trail" (`flow` in the API).

## Product Principles

- Protect the author's work: no edit is lost silently, and destructive actions can be undone.
- Reuse never surprises: what is published stays pinned, and the reach of a change is stated before it is made.
- Every visible control works; unbuilt features stay out of the UI.
- Dense but readable: a tool for long sessions, not a spacious consumer app.

## Accessibility & Inclusion

WCAG 2.2 AA for the studio's own interface. Authored artifact content is the author's choice and is judged separately.
