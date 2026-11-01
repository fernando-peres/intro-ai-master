"""Owns every service's lifecycle and state. Single asyncio loop; the UI only reads state."""

import asyncio
import time
from collections import deque
from collections.abc import Callable, Iterable
from dataclasses import dataclass, field
from enum import StrEnum

import pyte

from all_apps.monitor import (
    CheckResult,
    ErrorCounter,
    TreeStats,
    check_ready,
    port_owner,
    utc_stamp,
)
from all_apps.process import ManagedProcess
from all_apps.services import REPO_ROOT, Service

_HISTORY = 5000
_SAMPLES = 48  # One a second; fits the Details panel on one line.
_EVENTS = 5


class Status(StrEnum):
    STOPPED = "stopped"
    STARTING = "starting"
    RUNNING = "running"
    UNHEALTHY = "unhealthy"
    CRASHED = "crashed"
    PORT_BUSY = "port busy"


def _new_screen(cols: int, rows: int) -> pyte.HistoryScreen:
    return pyte.HistoryScreen(cols, rows, history=_HISTORY, ratio=0.5)


@dataclass(frozen=True)
class Event:
    stamp: str
    status: Status
    note: str = ""


@dataclass
class Runtime:
    service: Service
    screen: pyte.HistoryScreen
    stream: pyte.ByteStream
    status: Status = Status.STOPPED
    process: ManagedProcess | None = None
    started_at: float | None = None
    restarts: int = 0
    last_exit: int | None = None
    owner_pid: int | None = None
    check: CheckResult | None = None
    cpu: float = 0.0
    rss: int = 0
    note: str = ""
    errors: ErrorCounter = field(default_factory=ErrorCounter)
    stats: TreeStats = field(default_factory=TreeStats)
    stopping: bool = False
    has_started: bool = False
    seen_status: Status = Status.STOPPED
    events: deque[Event] = field(default_factory=lambda: deque(maxlen=_EVENTS))
    cpu_history: deque[float] = field(default_factory=lambda: deque(maxlen=_SAMPLES))
    rss_history: deque[int] = field(default_factory=lambda: deque(maxlen=_SAMPLES))


class Supervisor:
    def __init__(
        self,
        services: Iterable[Service],
        rows: int = 24,
        cols: int = 80,
        on_output: Callable[[str], None] | None = None,
    ):
        self.rows, self.cols = rows, cols
        self._on_output = on_output
        self.runtimes: dict[str, Runtime] = {}
        for service in services:
            screen = _new_screen(cols, rows)
            self.runtimes[service.name] = Runtime(service, screen, pyte.ByteStream(screen))

    async def start(self, name: str) -> None:
        """Start a service after its `needs`. Safe to call concurrently or when already started."""
        rt = self.runtimes[name]
        if rt.status in (Status.STARTING, Status.RUNNING, Status.UNHEALTHY):
            return
        rt.status, rt.note = Status.STARTING, ""
        for dep in rt.service.needs:
            rt.note = f"waiting for {dep}"
            await self.start(dep)
            if not await self._wait_ready(dep):
                if rt.status is Status.STARTING:
                    rt.status = Status.STOPPED
                    rt.note = f"{dep} is {self.runtimes[dep].status}"
                return
            if rt.status is not Status.STARTING:
                return  # Stopped while waiting.
        rt.note = ""
        owner = await asyncio.to_thread(port_owner, rt.service.port)
        if rt.status is not Status.STARTING:
            return
        if owner is not None:
            rt.status, rt.owner_pid = Status.PORT_BUSY, owner
            return
        self._spawn(rt)

    def _spawn(self, rt: Runtime) -> None:
        if rt.has_started:
            rt.restarts += 1
            rt.screen = _new_screen(self.cols, self.rows)
            rt.stream = pyte.ByteStream(rt.screen)
        try:
            rt.process = ManagedProcess(
                rt.service.command, REPO_ROOT, rt.service.env, self.rows, self.cols
            )
        except OSError as error:
            rt.status, rt.note = Status.CRASHED, f"could not start: {error}"
            return
        rt.has_started = True
        rt.started_at = time.monotonic()
        rt.errors, rt.stats, rt.check = ErrorCounter(), TreeStats(), None
        rt.owner_pid = None
        rt.cpu_history.clear()
        rt.rss_history.clear()
        asyncio.get_running_loop().add_reader(rt.process.master, self._drain, rt)

    def _drain(self, rt: Runtime) -> None:
        if rt.process is None:
            return
        data = rt.process.read()
        if data is None:
            asyncio.get_running_loop().remove_reader(rt.process.master)
        elif data:
            rt.stream.feed(data)
            rt.errors.feed(data)
            if self._on_output:
                self._on_output(rt.service.name)

    async def _wait_ready(self, name: str) -> bool:
        """An external process holding the port counts if it passes the service's check."""
        rt = self.runtimes[name]
        while rt.status is Status.STARTING:
            await asyncio.sleep(0.2)
        if rt.status is Status.PORT_BUSY:
            return (await check_ready(rt.service)).ok
        return rt.status is Status.RUNNING

    async def stop(self, name: str) -> None:
        rt = self.runtimes[name]
        if rt.status is Status.STARTING and rt.process is None:
            rt.status, rt.note = Status.STOPPED, ""
            return
        process = rt.process
        if process is None or rt.stopping:
            return
        rt.stopping = True
        await process.stop(rt.service.stop_timeout)
        self._release(rt)
        rt.last_exit = process.poll()
        rt.status = Status.STOPPED
        rt.stopping = False

    async def restart(self, name: str) -> None:
        await self.stop(name)
        await self.start(name)

    async def start_all(self) -> None:
        await asyncio.gather(*(self.start(name) for name in self.runtimes))

    async def stop_all(self) -> None:
        await asyncio.gather(*(self.stop(name) for name in self.runtimes))

    def kill_all(self) -> None:
        """Last-resort synchronous cleanup for interpreter exit."""
        for rt in self.runtimes.values():
            if rt.process is not None:
                rt.process.kill()

    def _release(self, rt: Runtime) -> None:
        if rt.process is None:
            return
        try:
            asyncio.get_running_loop().remove_reader(rt.process.master)
        except RuntimeError:
            pass
        self._drain_final(rt)
        rt.process.close()
        rt.process = None
        rt.started_at = None
        rt.check = None
        rt.cpu, rt.rss = 0.0, 0

    def _drain_final(self, rt: Runtime) -> None:
        while data := rt.process.read():
            rt.stream.feed(data)
            rt.errors.feed(data)

    def resize(self, rows: int, cols: int) -> None:
        if (rows, cols) == (self.rows, self.cols) or rows < 1 or cols < 1:
            return
        self.rows, self.cols = rows, cols
        for rt in self.runtimes.values():
            rt.screen.resize(rows, cols)
            if rt.process is not None:
                rt.process.resize(rows, cols)

    async def tick(self) -> None:
        """Refresh every service's state once."""
        await asyncio.gather(*(self._tick_one(rt) for rt in self.runtimes.values()))
        for rt in self.runtimes.values():
            if rt.status is not rt.seen_status:
                rt.seen_status = rt.status
                rt.events.append(Event(utc_stamp(), rt.status, rt.note))

    async def _tick_one(self, rt: Runtime) -> None:
        if rt.stopping:
            return
        if rt.process is None:
            if rt.status is not Status.STARTING:
                await self._watch_port(rt)
            return
        code = rt.process.poll()
        if code is not None:
            rt.process.kill()  # Children may outlive the group leader.
            self._release(rt)
            rt.last_exit = code
            rt.status, rt.note = Status.CRASHED, f"exited with code {code}"
            return
        process = rt.process
        rt.cpu, rt.rss = rt.stats.sample(process.pid)
        rt.cpu_history.append(rt.cpu)
        rt.rss_history.append(rt.rss)
        check = await check_ready(rt.service)
        if rt.process is not process or rt.stopping:
            return
        rt.check = check
        if check.ok:
            rt.status = Status.RUNNING
        elif rt.status is Status.RUNNING:
            rt.status = Status.UNHEALTHY

    async def _watch_port(self, rt: Runtime) -> None:
        owner = await asyncio.to_thread(port_owner, rt.service.port)
        if rt.process is not None or rt.status is Status.STARTING:
            return
        rt.owner_pid = owner
        if owner is not None:
            rt.status = Status.PORT_BUSY
        elif rt.status is Status.PORT_BUSY:
            rt.status = Status.STOPPED
