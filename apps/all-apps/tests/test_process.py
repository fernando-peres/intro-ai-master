import asyncio
import os
import re
import signal
import socket
import sys
import time
from datetime import datetime
from pathlib import Path

import psutil

from all_apps.monitor import ErrorCounter, format_bytes, format_uptime, port_owner, sparkline
from all_apps.process import ManagedProcess
from all_apps.services import SERVICES, Service
from all_apps.supervisor import Status, Supervisor


def _service(name: str, code: str, port: int = 59871, **kwargs) -> Service:
    return Service(name=name, kind="web", port=port, command=(sys.executable, "-c", code), **kwargs)


def _free_port() -> int:
    with socket.socket() as probe:
        probe.bind(("127.0.0.1", 0))
        return probe.getsockname()[1]


def test_service_ports_are_unique() -> None:
    ports = [service.port for service in SERVICES]
    assert len(ports) == len(set(ports))


def test_service_dependencies_exist() -> None:
    names = {service.name for service in SERVICES}
    for service in SERVICES:
        assert set(service.needs + service.wants) <= names


def test_stop_kills_the_whole_group_including_grandchild(tmp_path: Path) -> None:
    pid_file = tmp_path / "grandchild.pid"
    code = (
        "import subprocess,sys,time;"
        "p=subprocess.Popen([sys.executable,'-c','import time;time.sleep(60)']);"
        f"open({str(pid_file)!r},'w').write(str(p.pid));"
        "time.sleep(60)"
    )
    process = ManagedProcess((sys.executable, "-c", code), tmp_path, {}, 24, 80)
    deadline = time.monotonic() + 10
    while not (pid_file.exists() and pid_file.read_text()) and time.monotonic() < deadline:
        time.sleep(0.05)
    grandchild = int(pid_file.read_text())
    assert psutil.pid_exists(grandchild)
    asyncio.run(process.stop(timeout=3))
    process.close()
    assert not process.group_alive()
    time.sleep(0.2)
    assert (
        not psutil.pid_exists(grandchild)
        or psutil.Process(grandchild).status() == psutil.STATUS_ZOMBIE
    )


def test_stop_escalates_to_sigkill(tmp_path: Path) -> None:
    code = (
        "import signal,sys,time;signal.signal(signal.SIGTERM,signal.SIG_IGN);"
        "print('ready',flush=True);time.sleep(60)"
    )
    process = ManagedProcess((sys.executable, "-c", code), tmp_path, {}, 24, 80)
    deadline = time.monotonic() + 10
    while not process.read() and time.monotonic() < deadline:
        time.sleep(0.05)
    asyncio.run(process.stop(timeout=0.3))
    assert process.poll() == -signal.SIGKILL
    process.close()


def test_child_sees_a_tty_with_the_requested_size(tmp_path: Path) -> None:
    code = "import os;print(os.isatty(1),os.get_terminal_size().lines,flush=True)"
    process = ManagedProcess((sys.executable, "-c", code), tmp_path, {}, 33, 80)
    output = b""
    deadline = time.monotonic() + 10
    while b"33" not in output and time.monotonic() < deadline:
        output += process.read() or b""
        time.sleep(0.02)
    assert b"True 33" in output
    process.kill()
    process.close()


def test_port_owner_finds_listener_and_none_when_free() -> None:
    with socket.socket() as server:
        server.bind(("127.0.0.1", 0))
        server.listen()
        port = server.getsockname()[1]
        assert port_owner(port) == os.getpid()
    assert port_owner(port) is None


def test_error_counter_handles_split_lines_and_ansi() -> None:
    counter = ErrorCounter()
    counter.feed(b"\x1b[31mERR")
    counter.feed(b"OR\x1b[0m boom\nall fine\nTraceback (most recent)\n")
    assert counter.count == 2
    assert counter.last == "Traceback (most recent)"


def test_sparkline_scales_from_zero_to_the_largest_value() -> None:
    assert sparkline([]) == ""
    assert sparkline([0, 0]) == "▁▁"
    assert sparkline([5, 5]) == "██"
    assert sparkline([0, 5, 10]) == "▁▅█"


def test_formatting() -> None:
    assert format_uptime(59) == "59s"
    assert format_uptime(3725) == "1h 2m"
    assert format_bytes(5 * 1024**2) == "5 MB"
    assert format_bytes(int(1.1 * 1024**3)) == "1.1 GB"


def test_crash_reports_exit_code() -> None:
    async def scenario() -> None:
        supervisor = Supervisor([_service("bad", "raise SystemExit(7)", port=_free_port())])
        await supervisor.start("bad")
        rt = supervisor.runtimes["bad"]
        for _ in range(100):
            await supervisor.tick()
            if rt.status is Status.CRASHED:
                break
            await asyncio.sleep(0.05)
        assert rt.status is Status.CRASHED
        assert rt.last_exit == 7
        assert "7" in rt.note

    asyncio.run(scenario())


def test_held_port_is_reported_and_owner_left_alone() -> None:
    async def scenario() -> None:
        with socket.socket() as server:
            server.bind(("127.0.0.1", 0))
            server.listen()
            port = server.getsockname()[1]
            supervisor = Supervisor([_service("svc", "import time;time.sleep(60)", port=port)])
            await supervisor.start("svc")
            rt = supervisor.runtimes["svc"]
            assert rt.status is Status.PORT_BUSY
            assert rt.owner_pid == os.getpid()
            assert rt.process is None
        await supervisor.tick()
        assert rt.status is Status.STOPPED

    asyncio.run(scenario())


def test_dependency_failure_stops_dependent_from_starting() -> None:
    async def scenario() -> None:
        dep = _service("dep", "raise SystemExit(1)", port=_free_port())
        app = _service("app", "import time;time.sleep(60)", port=_free_port(), needs=("dep",))
        supervisor = Supervisor([dep, app])
        starting = asyncio.create_task(supervisor.start("app"))
        for _ in range(100):
            await supervisor.tick()
            if starting.done():
                break
            await asyncio.sleep(0.05)
        await starting
        rt = supervisor.runtimes["app"]
        assert rt.status is Status.STOPPED
        assert rt.process is None
        assert "dep" in rt.note

    asyncio.run(scenario())


def test_external_listener_satisfies_a_dependency() -> None:
    async def scenario() -> None:
        with socket.socket() as server:
            server.bind(("127.0.0.1", 0))
            server.listen()
            port = server.getsockname()[1]
            dep = _service("dep", "pass", port=port, check_path=None)
            app = _service("app", "import time;time.sleep(60)", port=_free_port(), needs=("dep",))
            supervisor = Supervisor([dep, app])
            await supervisor.start("app")
            assert supervisor.runtimes["dep"].status is Status.PORT_BUSY
            assert supervisor.runtimes["dep"].process is None
            assert supervisor.runtimes["app"].process is not None
            await supervisor.stop_all()

    asyncio.run(scenario())


def test_busy_dependency_failing_its_check_still_blocks(monkeypatch) -> None:
    async def scenario() -> None:
        dep = _service("dep", "pass", port=_free_port(), check_path=None)
        app = _service("app", "import time;time.sleep(60)", port=_free_port(), needs=("dep",))
        monkeypatch.setattr(
            "all_apps.supervisor.port_owner", lambda port: 1 if port == dep.port else None
        )
        supervisor = Supervisor([dep, app])
        await supervisor.start("app")
        assert supervisor.runtimes["app"].status is Status.STOPPED
        assert supervisor.runtimes["app"].process is None

    asyncio.run(scenario())


def test_status_changes_become_a_bounded_utc_timeline() -> None:
    async def scenario() -> None:
        supervisor = Supervisor([_service("svc", "pass", port=_free_port())])
        rt = supervisor.runtimes["svc"]
        await supervisor.tick()
        assert not rt.events
        for status in [Status.CRASHED, Status.STOPPED] * 4:
            rt.status = status
            rt.note = "boom" if status is Status.CRASHED else ""
            await supervisor.tick()
        assert len(rt.events) == 5
        assert [event.status for event in rt.events][-2:] == [Status.CRASHED, Status.STOPPED]
        assert rt.events[-2].note == "boom"
        assert re.fullmatch(r"\d{4}(-\d{2}){5}", rt.events[-1].stamp)
        datetime.strptime(rt.events[-1].stamp, "%Y-%m-%d-%H-%M-%S")

    asyncio.run(scenario())
