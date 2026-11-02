"""The services the dashboard manages, in display order. Ports are fixed so all can run together."""

from dataclasses import dataclass, field
from pathlib import Path
from typing import Literal

REPO_ROOT = Path(__file__).resolve().parents[4]

_API = "apps/harness-content-api"
_COMPOSE = f"{_API}/docker-compose.yml"
_ALEMBIC = f"{_API}/alembic.ini"


@dataclass(frozen=True)
class Service:
    name: str
    kind: Literal["web", "static", "api", "db"]
    port: int
    command: tuple[str, ...]
    #: HTTP path that must answer below 400; None means a TCP connect is the check.
    check_path: str | None = "/"
    #: Started first, and must be ready before this service starts.
    needs: tuple[str, ...] = ()
    #: Only surfaced as a hint: the service runs without them, with reduced function.
    wants: tuple[str, ...] = ()
    env: dict[str, str] = field(default_factory=dict)
    docs_path: str | None = None
    #: Where `o` opens, relative to `url`.
    open_path: str = "/"
    stop_timeout: float = 5.0

    @property
    def url(self) -> str | None:
        return None if self.kind == "db" else f"http://localhost:{self.port}"

    @property
    def open_url(self) -> str | None:
        return self.url and f"{self.url}{self.open_path}"


@dataclass(frozen=True)
class Page:
    """A standalone HTML file; opened straight from disk, no server needed."""

    path: Path

    @property
    def name(self) -> str:
        return self.path.stem

    @property
    def exists(self) -> bool:
        return self.path.is_file()


def pages(directory: Path = REPO_ROOT / "html") -> tuple[Page, ...]:
    return tuple(Page(path) for path in sorted(directory.glob("*.html")))


#: pnpm's pre-run check may shell out to `pnpm install`; a launcher must not mutate node_modules.
_VITE_ENV = {"pnpm_config_verify_deps_before_run": "false"}


def _vite(name: str, port: int) -> tuple[str, ...]:
    return ("pnpm", "--filter", name, "dev", "--port", str(port), "--strictPort")


def _fastapi(app_dir: str, module: str, port: int) -> str:
    return f"uv run fastapi dev apps/{app_dir}/src/{module}/main.py --port {port}"


SERVICES: tuple[Service, ...] = (
    Service(
        name="ai-intro",
        kind="web",
        port=5173,
        command=_vite("ai-intro", 5173),
        env=_VITE_ENV,
        wants=("algo-server",),
    ),
    Service(
        name="harness-content",
        kind="web",
        port=5174,
        command=_vite("harness-content", 5174),
        needs=("harness-content-api",),
        env={**_VITE_ENV, "API_PROXY_TARGET": "http://localhost:8001"},
    ),
    Service(
        name="rag-in-action",
        kind="web",
        port=8501,
        command=("uv", "run", "rag-in-action"),
        check_path="/_stcore/health",
    ),
    Service(
        name="deck-06",
        kind="static",
        port=8080,
        command=("just", "serve", "8080"),
        check_path="/presentation/06/",
        open_path="/presentation/06/",
    ),
    Service(
        name="algo-server",
        kind="api",
        port=8000,
        command=("sh", "-c", f"exec {_fastapi('algo-server', 'algo_server', 8000)}"),
        check_path="/health",
        docs_path="/docs",
    ),
    Service(
        name="harness-content-api",
        kind="api",
        port=8001,
        command=(
            "sh",
            "-c",
            f"uv run alembic -c {_ALEMBIC} upgrade head"
            " && uv run python -m harness_content_api.seed"
            f" && exec {_fastapi('harness-content-api', 'harness_content_api', 8001)}",
        ),
        check_path="/health",
        needs=("postgres",),
        docs_path="/docs",
    ),
    Service(
        name="postgres",
        kind="db",
        port=5433,
        command=("docker", "compose", "-f", _COMPOSE, "up", "postgres"),
        check_path=None,
        stop_timeout=15.0,
    ),
)
