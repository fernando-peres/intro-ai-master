# all-apps

Terminal dashboard for the monorepo: a left panel lists every service, grouped into frontends, APIs and databases, with its address, port and status, and the right panel holds one live terminal per service. Textual, a pty per service and pyte. POSIX only (macOS, Linux).

## Run

```bash
# from the repo root
uv sync --all-packages && pnpm install
uv run all-apps
```

The window needs to be about 120 columns wide. Status and stats update by themselves every second.

## Keys

| Key | Action |
|---|---|
| `space`, or click `▶`/`■` | Run or stop the selected service |
| `↑`/`↓` or `k`/`j`, or click | Select a service and show its terminal |
| `r` | Restart |
| `a` / `x` | Start all / stop all |
| `o` | Open in the browser |
| `PgUp`/`PgDn`, mouse wheel | Scroll the terminal |
| `t`, or click the terminal | Type into the service (e.g. Vite's shortcuts); `ctrl+]` returns |
| `q` | Quit; stops running services after asking |

## Services

Defined in `src/all_apps/services.py`.

| Service | Address | Needs |
|---|---|---|
| ai-intro | http://localhost:5173 | algo-server, for its AI labs only |
| harness-content | http://localhost:5174 | harness-content-api |
| algo-server | http://localhost:8000 | |
| harness-content-api | http://localhost:8001 | postgres |
| postgres | localhost:5433 | Docker running |

Starting harness-content-api applies migrations and seeds dev users first. Stopping a service never stops what depends on it. A dependency already running outside the CLI shows `port busy`, and still counts as ready if it passes its check.

## Statuses

| Status | Meaning |
|---|---|
| `stopped` | Not running |
| `starting` | Launched or waiting on a dependency; its check isn't passing yet |
| `running` | Check passing: `/health` for APIs, `/` for frontends, a TCP connect for postgres |
| `unhealthy` | Was running, and the check now fails |
| `crashed` | Exited on its own; Details shows the exit code |
| `port busy` | Something this CLI didn't start holds the port; Details names it. It's never killed; stop it yourself and the status clears |

Details also shows PID, uptime, CPU and memory across the process tree, check latency, restarts, last exit code and dependency state. Below those are CPU and memory sparklines for the last 48 seconds, the latest error-looking line, and the last 5 status changes with UTC timestamps. A red `!N` on a row counts error-looking lines in that service's output since it started.

## Test

```bash
uv run pytest apps/all-apps/tests
```
