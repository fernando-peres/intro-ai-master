# harness-content-api

FastAPI service on Python 3.14 backing [`harness-content`](../harness-content), the Reusable Artifacts Studio. PostgreSQL 17 via SQLAlchemy 2 and Alembic. The phased build is tracked in [implementation-plan.md](../harness-content/docs/implementation-plan.md).

## Run

```bash
# from the repo root
uv sync --all-packages

# Postgres on localhost:5433 (user/password/db: harness), compose project "harness-sigma"
docker compose -f apps/harness-content-api/docker-compose.yml up -d

# apply migrations, then create the dev users
uv run alembic -c apps/harness-content-api/alembic.ini upgrade head
uv run python -m harness_content_api.seed

uv run fastapi dev apps/harness-content-api/src/harness_content_api/main.py   # http://localhost:8000
curl localhost:8000/health        # → {"status":"ok","database":"ok"}
```

Interactive API docs: http://localhost:8000/docs

## Dev auth

Every `/api/v1` request names a user in `X-User-Id`; unknown or missing → `401`. This is not authentication: it lets the API enforce roles from the start.

| User | Role | May |
|---|---|---|
| `usr_admin` | admin | everything, including deciding own reviews |
| `usr_author` | author | create artifacts/locations, edit **own** drafts, submit for review |
| `usr_reviewer`, `usr_reviewer2` | reviewer | edit any draft, approve/request changes (not on own submissions), publish, archive, activation |
| `usr_viewer` | viewer | read published and archived versions only |

## API (`/api/v1`)

| Endpoint | Notes |
|---|---|
| `GET /me`, `GET /users` | |
| `GET/POST /locations`, `PATCH /locations/{id}`, `POST /locations/{id}/archive` | box → unit → section; a unit's parent is a box, a section's a unit |
| `GET /artifacts?query=&tag=&type=&locale=&status=&locationId=&limit=&offset=` | prefix full-text over title, tags and description; `tag` repeats (any of); `locationId` includes its subtree; items add `locationPath`, `localeVersions`, `reuseCount` |
| `GET /tags` | tag → artifact count |
| `POST /artifacts` | creates the artifact and its first draft (empty content comes from the registry) |
| `POST /artifacts/import` | `{title, locationId, locale, content}`; type is `content.type`; `422` `unknown_type` / `unknown_component` / `invalid_content` with `issues: [{path, message}]` |
| `GET /registry` | allowlisted components per type (animation templates include their props JSON Schema) and empty content |
| `GET/PATCH /artifacts/{id}` | `status` is derived; `defaults` maps locale → default version id; `locationId` moves it |
| `GET /artifacts/{id}/versions?locale=` | |
| `GET /artifacts/{id}/usages` | every flow revision that references the artifact |
| `GET /artifacts/{id}/resolve?locale=` | default published version; `404 locale_unavailable` with `availableLocales`, no fallback |
| `POST /artifacts/{id}/drafts?fromVersionId=` | fork (same locale → `parentVersionId`) or translation (body `{"locale"}` → `sourceVersionId`) |
| `GET/PATCH /artifact-versions/{id}` | returns `ETag`; `PATCH` needs `If-Match` (`428` missing, `412` stale) and only works on drafts (`409`) |
| `POST /artifact-versions/{id}/submit-review` | optional `reviewerId` assigns a reviewer |
| `GET /reviews?status=&versionId=`, `POST /reviews/{id}/approve`, `POST /reviews/{id}/request-changes` | approval binds the draft's content hash; any later edit makes it stale |
| `POST /artifact-versions/{id}/publish` | `{changeComment, makeDefault?}`; next number per (artifact, locale); the first publish in a locale becomes its default |
| `POST /artifact-versions/{id}/archive`, `PATCH /artifact-versions/{id}/activation` | a default must stay active and published |
| `GET/POST /flows`, `GET/PATCH /flows/{id}` | a new flow starts with an empty draft revision |
| `GET /flows/{id}/draft`, `POST /flows/{id}/draft` | `POST` returns the draft, or starts one from the latest published revision |
| `PATCH /flows/{id}/draft` | `{steps: [...]}` replaces all steps; `If-Match` required; a pinned version must be published and in the step's locale |
| `POST /flows/{id}/draft/use-current-defaults` | re-pins every step to its locale default; `If-Match` required |
| `POST /flows/{id}/publish` | reviewer/admin; `{changeComment}`; every step must pin a published (not archived) version |
| `GET /flows/{id}/revisions`, `GET /flows/{id}/revisions/{revisionId}` | |
| `GET /flows/{id}/behind?revisionId=` | pinned version vs current default per step (default: the draft, else the latest published) |
| `GET /flows/{id}/revisions/{revisionId}/play` | published revisions only; archived pinned versions still play |
| `POST /assets` | multipart `artifactId` + `file`; at most 20 MB, `413` above; `.md .txt .csv .pdf .png .jpg .gif .webp`. The bytes must match the extension (`422 unsupported_file`); names are unique per artifact (`409 asset_name_taken`) |
| `GET /artifacts/{id}/assets`, `GET /assets/{id}` | the artifact's resources (shared by all locales and versions); `ETag` is the asset revision |
| `GET /assets/{id}/content` | the bytes with `nosniff` and a sandbox CSP; images and PDFs are served `inline`, everything else as `attachment` |
| `PUT /assets/{id}/content` | `{text}` replaces a text resource (a markdown note); `If-Match` required |
| `PATCH /assets/{id}` | `{name}` renames it (same file type); `If-Match` required |
| `DELETE /assets/{id}` | `409 asset_in_use` (with `versions`) while any version's content mentions the asset id |

Errors are `{"detail", "code", ...}`; timestamps are UTC `YYYY-MM-DD-HH-mm-ss`.

## Content registry

Content is checked on create, import, draft save and publish against `src/harness_content_api/schemas/` (`registry.json` + one JSON Schema per type). The files are generated from the studio's Zod schemas: run `pnpm --filter harness-content export:schemas` after changing a plugin schema; a harness-content test fails while they are out of date. Unknown components are reported by name before field errors.

## Configuration

| Variable | Default | Used by |
|---|---|---|
| `HARNESS_DATABASE_URL` | `postgresql+psycopg://harness:harness@localhost:5433/harness` | app, Alembic |
| `HARNESS_TEST_DATABASE_URL` | same server, database `harness_test` | tests |
| `HARNESS_ASSET_DIR` | `apps/harness-content-api/var/assets` (git-ignored) | `LocalDiskStorage` |

Asset bytes go through the `AssetStorage` protocol (`services/storage.py`: `put`, `get`, `delete`), so an S3 implementation can replace local disk by changing `get_storage`. A file is written before the database commit and the old file is deleted after it, so a failed request can leave an orphan file, but never a row without its bytes.

## Test

```bash
uv run pytest apps/harness-content-api
```

The tests create and migrate `harness_test` on first run, and roll back every test's transaction. Without a reachable Postgres the database tests are **skipped**, not failed.

## Migrations

```bash
uv run alembic -c apps/harness-content-api/alembic.ini revision --autogenerate -m "add artifacts"
```

Models must subclass `harness_content_api.db.Base` and be imported by `migrations/env.py` (through `db`) for autogenerate to see them.

## Conventions

Every timestamp the API writes is UTC `YYYY-MM-DD-HH-mm-ss`; use `harness_content_api.timestamps.utc_stamp()`.
