# all-apps

Terminal dashboard for the monorepo: a left panel lists every service, grouped into frontends, the presentation, APIs and databases, with its address, port and status, then a Pages panel of links, and the right panel holds one live terminal per service. Textual, a pty per service and pyte. POSIX only (macOS, Linux).

## Run

```bash
# from the repo root
uv sync --all-packages && pnpm install
uv run all-apps   # or: just tui
```

The window needs to be about 120 columns wide. Status and stats update by themselves every second.

## Keys

| Key | Action |
|---|---|
| `space`, or click `▶`/`■` | Run or stop the selected service |
| `↑`/`↓` or `k`/`j`, or click | Select a service and show its terminal |
| `r` | Restart |
| `a` / `x` | Start all / stop all |
| `o` | Open in the browser (deck-06 opens `/presentation/06/`) |
| click a Pages link | Open it in the browser |
| `PgUp`/`PgDn`, mouse wheel | Scroll the terminal |
| `t`, or click the terminal | Type into the service (e.g. Vite's shortcuts); `ctrl+]` returns |
| `q` | Quit; stops running services after asking |

## Services

Defined in `src/all_apps/services.py`.

| Service | Address | Needs |
|---|---|---|
| ai-intro | http://localhost:5173 | algo-server, for its AI labs only |
| harness-content | http://localhost:5174 | harness-content-api |
| rag-in-action | http://localhost:8501 | `OPENAI_API_KEY`, for chat answers only |
| w-and-a | http://localhost:8502 | `OPENAI_API_KEY` for live runs; without it, recorded runs |
| blocks | http://localhost:8503 | none |
| deck-06 | http://localhost:8080/presentation/06/ | `just`; runs `just serve 8080` |
| deck-07 | http://localhost:8081/presentation/07/ | `just`; runs `just serve 8081` |
| algo-server | http://localhost:8000 | |
| harness-content-api | http://localhost:8001 | postgres |
| postgres | localhost:5433 | Docker running |

Starting harness-content-api applies migrations and seeds dev users first. Stopping a service never stops what depends on it. A dependency already running outside the CLI shows `port busy`, and still counts as ready if it passes its check.

## Pages

Links, with a dot: green when they'll open, red when they won't.

- **deck-06**: green while the deck server answers (started here, or already holding port 8080). Clicking it while red selects the deck-06 service so `space` starts it.
- **`apps/blocks/src/blocks/html/*.html`**: standalone pages, opened straight from disk, so they need no server. Every `.html` in that folder is listed (today: context, evals, experiments, guardrails, mcp, observability, tools); red means the file is gone.

## Statuses

| Status | Meaning |
|---|---|
| `stopped` | Not running (red) |
| `starting` | Launched or waiting on a dependency; its check isn't passing yet |
| `running` | Check passing: `/health` for APIs, `/` for frontends, `/presentation/06/` or `/presentation/07/` for the decks, a TCP connect for postgres (green) |
| `unhealthy` | Was running, and the check now fails |
| `crashed` | Exited on its own; Details shows the exit code |
| `port busy` | Something this CLI didn't start holds the port, usually the same app started by hand (green ◆); Details names it. It's never killed; stop it yourself and the status clears |

Details also shows PID and uptime, then CPU (cyan) and memory (magenta) across the process tree, each on its own line with its value and a sparkline of the last ~40 seconds, then check latency, restarts, last exit code and dependency state. Below those are the latest error-looking line, and the last 5 status changes with UTC timestamps. A red `!N` on a row counts error-looking lines in that service's output since it started.

## Test

```bash
uv run pytest apps/all-apps/tests
```
