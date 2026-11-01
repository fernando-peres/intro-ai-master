"""Read-only observation of services: readiness, port owners, resource use."""

import asyncio
import re
import subprocess
import time
from collections.abc import Iterable
from dataclasses import dataclass
from datetime import UTC, datetime

import httpx
import psutil

from all_apps.services import Service

_ANSI = re.compile(r"\x1b\[[0-9;?]*[ -/]*[@-~]")
_ERROR = re.compile(r"\b(error|traceback|fatal|critical|exception)\b", re.IGNORECASE)
_BARS = "▁▂▃▄▅▆▇█"


@dataclass(frozen=True)
class CheckResult:
    ok: bool
    detail: str
    latency_ms: int


async def check_ready(service: Service, timeout: float = 2.0) -> CheckResult:
    start = time.monotonic()
    try:
        if service.check_path is None:
            _, writer = await asyncio.wait_for(
                asyncio.open_connection("localhost", service.port), timeout
            )
            writer.close()
            ok, detail = True, "tcp open"
        else:
            async with httpx.AsyncClient(timeout=timeout, trust_env=False) as client:
                response = await client.get(f"{service.url}{service.check_path}")
            ok, detail = response.status_code < 400, str(response.status_code)
    except OSError, TimeoutError, httpx.HTTPError:
        ok, detail = False, "no response"
    return CheckResult(ok, detail, round((time.monotonic() - start) * 1000))


def port_owner(port: int) -> int | None:
    """PID listening on the port, whoever started it."""
    try:
        result = subprocess.run(
            ["lsof", "-nP", f"-iTCP:{port}", "-sTCP:LISTEN", "-t"],
            capture_output=True,
            text=True,
            timeout=2,
        )
    except OSError, subprocess.TimeoutExpired:
        return None
    pids = result.stdout.split()
    return int(pids[0]) if pids else None


def process_name(pid: int) -> str:
    try:
        return psutil.Process(pid).name()
    except psutil.Error:
        return "process"


class TreeStats:
    """CPU and memory for a process and its descendants. CPU needs two samples to be non-zero."""

    def __init__(self) -> None:
        self._seen: dict[int, psutil.Process] = {}

    def sample(self, pid: int) -> tuple[float, int]:
        try:
            root = psutil.Process(pid)
            found = [root, *root.children(recursive=True)]
        except psutil.Error:
            return 0.0, 0
        self._seen = {p.pid: self._seen.get(p.pid, p) for p in found}
        cpu, rss = 0.0, 0
        for process in self._seen.values():
            try:
                cpu += process.cpu_percent(None)
                rss += process.memory_info().rss
            except psutil.Error:
                continue
        return cpu, rss


class ErrorCounter:
    """Counts error-looking lines, and keeps the latest, across chunks that may split a line."""

    def __init__(self) -> None:
        self.count = 0
        self.last = ""
        self._partial = ""

    def feed(self, data: bytes) -> None:
        lines = (self._partial + data.decode(errors="replace")).split("\n")
        self._partial = lines.pop()
        for line in lines:
            line = _ANSI.sub("", line).strip()
            if _ERROR.search(line):
                self.count += 1
                self.last = line


def utc_stamp() -> str:
    return datetime.now(UTC).strftime("%Y-%m-%d-%H-%M-%S")


def sparkline(values: Iterable[float]) -> str:
    """One bar per value, scaled from zero to the largest value."""
    values = list(values)
    top = max(values, default=0) or 1
    return "".join(_BARS[round(value / top * (len(_BARS) - 1))] for value in values)


def format_uptime(seconds: float) -> str:
    seconds = int(seconds)
    if seconds < 60:
        return f"{seconds}s"
    if seconds < 3600:
        return f"{seconds // 60}m"
    return f"{seconds // 3600}h {seconds % 3600 // 60}m"


def format_bytes(count: int) -> str:
    if count >= 1024**3:
        return f"{count / 1024**3:.1f} GB"
    return f"{count / 1024**2:.0f} MB"
