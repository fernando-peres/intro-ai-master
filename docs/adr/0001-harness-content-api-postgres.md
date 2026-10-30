# 0001 — Separate content service with PostgreSQL for the Reusable Artifacts Studio

**Status:** Accepted  
**Date:** 2026-10-29-21-09-46 (UTC)

## Context

`apps/harness-content` (the Reusable Artifacts Studio) needs durable, transactional storage: immutable published versions, per-locale version numbers that never collide under concurrent publishes, pinned flow revisions, review approvals, and search. The existing backend, `apps/algo-server`, is a stateless service for the AI teaching labs with no datastore.

## Decision

- Add a new FastAPI service, `apps/harness-content-api` (Python 3.14, uv workspace member), owned by the Studio. `algo-server` is not extended.
- Use **PostgreSQL** as its system of record: relational tables for artifacts, versions, reviews and flows, JSONB for artifact content, and Postgres full-text search to start with.
- Manage the schema with SQLAlchemy 2 models and Alembic migrations.

## Consequences

- Version allocation, default switches and publishing rely on Postgres transactions and unique/partial-unique constraints.
- Local development and the API's database tests need a running Postgres (`docker-compose.yml` in the app); without it those tests are skipped.
- The Studio frontend talks only to this service. Moving content to another datastore, or merging the service into another backend, would mean migrating data and rewriting the persistence layer.
