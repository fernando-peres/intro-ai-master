#!/usr/bin/env bash
# Permanently clears content from the dev database, after backing it up.
# docker exec would otherwise swallow the typed confirmation, hence the /dev/null redirects.
# Keeps users, themes, templates and the schema. CLEAR_DB and CLEAR_ASSETS exist for rehearsals.
set -euo pipefail

APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"
DB="${CLEAR_DB:-harness}"
ASSETS="${CLEAR_ASSETS:-$APP_DIR/var/assets}"
BACKUP="$APP_DIR/var/backups/$(date -u +%Y-%m-%d-%H-%M-%S)"
TABLES="flow_steps, flow_revisions, flows, review_requests, assets, artifact_versions, artifacts, locations, audit_events"

psql_db() {
  docker compose -f "$APP_DIR/docker-compose.yml" exec -T postgres psql -U harness -v ON_ERROR_STOP=1 "$@" < /dev/null
}

counts() {
  for table in ${TABLES//,/} users artifact_themes artifact_templates; do
    printf '%-20s %s\n' "$table" "$(psql_db "$DB" -At -c "SELECT count(*) FROM $table")"
  done
}

if [[ -z "${CLEAR_DB:-}" && "$DB" != "harness" ]]; then
  echo "Refusing: expected database 'harness', got '$DB'." >&2
  exit 1
fi

psql_db "$DB" -qAt -c "SELECT 1" > /dev/null

echo "Database '$DB' now holds:"
counts
echo
read -r -p "This permanently deletes the content above except users, themes and templates. Type 'clear' to continue: " answer
if [[ "$answer" != "clear" ]]; then
  echo "Nothing changed."
  exit 1
fi

mkdir -p "$BACKUP"
docker compose -f "$APP_DIR/docker-compose.yml" exec -T postgres pg_dump -U harness "$DB" < /dev/null > "$BACKUP/database.sql"
[[ -s "$BACKUP/database.sql" ]] || { echo "Backup is empty; nothing changed." >&2; exit 1; }
if [[ -d "$ASSETS" ]]; then cp -R "$ASSETS" "$BACKUP/assets"; fi
echo "Backup saved to $BACKUP"

# TRUNCATE fails, changing nothing, if a table outside this list still references one in it.
psql_db "$DB" -c "BEGIN; TRUNCATE $TABLES; COMMIT;"

if [[ -d "$ASSETS" ]]; then find "$ASSETS" -mindepth 1 -delete; fi

echo
echo "Done. Database '$DB' now holds:"
counts
