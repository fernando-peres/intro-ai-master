import asyncio
import socket
import sys
from dataclasses import replace

from all_apps.app import AllAppsApp
from all_apps.services import Service
from all_apps.supervisor import Status
from all_apps.widgets import ServiceRow, TerminalView

_SERVE = "print('\\x1b[31mhello-{0}\\x1b[0m',flush=True);import time;time.sleep(60)"


def _services() -> list[Service]:
    services = []
    for name in ("one", "two"):
        with socket.socket() as probe:
            probe.bind(("127.0.0.1", 0))
            port = probe.getsockname()[1]
        command = (sys.executable, "-c", _SERVE.format(name))
        services.append(Service(name=name, kind="web", port=port, command=command))
    return services


def _visible(app: AllAppsApp) -> str:
    return str(app.query_one(TerminalView).render())


async def _until(pilot, condition) -> None:
    for _ in range(200):
        if condition():
            return
        await pilot.pause(0.05)
    raise AssertionError("condition not reached")


def test_space_runs_and_stops_and_selection_switches_terminals() -> None:
    async def scenario() -> None:
        app = AllAppsApp(_services())
        async with app.run_test(size=(120, 30)) as pilot:
            one = app.supervisor.runtimes["one"]
            await pilot.press("space")
            await _until(pilot, lambda: "hello-one" in _visible(app))
            assert one.status is Status.STARTING

            await pilot.press("down")
            assert app.selected == "two"
            assert "hello-one" not in _visible(app)

            await pilot.press("up")
            assert "hello-one" in _visible(app)

            await pilot.press("space")
            await _until(pilot, lambda: one.process is None)
            assert one.status is Status.STOPPED

    asyncio.run(scenario())


def test_rows_show_the_address_under_group_headers_navigation_skips() -> None:
    async def scenario() -> None:
        web, api = _services()
        api = replace(api, kind="api")
        app = AllAppsApp([web, api])
        async with app.run_test(size=(120, 30)) as pilot:
            headers = [str(group.render()) for group in app.query(".service-group")]
            assert headers == ["Frontends", "APIs"]
            assert f"localhost:{web.port}" in str(app.query_one("#row-one", ServiceRow).render())
            await pilot.press("down")
            assert app.selected == "two"

    asyncio.run(scenario())


def test_clicking_row_button_toggles() -> None:
    async def scenario() -> None:
        app = AllAppsApp(_services())
        async with app.run_test(size=(120, 30)) as pilot:
            await pilot.click("#row-two", offset=(0, 0))
            await _until(pilot, lambda: app.supervisor.runtimes["two"].process is not None)
            assert app.selected == "two"
            await pilot.click("#row-two", offset=(0, 0))
            await _until(pilot, lambda: app.supervisor.runtimes["two"].process is None)

    asyncio.run(scenario())


def test_typing_mode_forwards_keys_and_releases() -> None:
    async def scenario() -> None:
        echo = "import sys\nfor line in sys.stdin: print('got-'+line.strip(),flush=True)"
        with socket.socket() as probe:
            probe.bind(("127.0.0.1", 0))
            port = probe.getsockname()[1]
        service = Service(name="echo", kind="web", port=port, command=(sys.executable, "-c", echo))
        app = AllAppsApp([service])
        async with app.run_test(size=(120, 30)) as pilot:
            await pilot.press("space")
            await _until(pilot, lambda: app.supervisor.runtimes["echo"].process is not None)
            await pilot.press("t", "q", "enter")
            await _until(pilot, lambda: "got-q" in _visible(app))
            assert app.is_running
            await pilot.press("ctrl+right_square_bracket")
            await pilot.pause()
            assert app.focused is None
            await pilot.press("space")
            await _until(pilot, lambda: app.supervisor.runtimes["echo"].process is None)

    asyncio.run(scenario())


def test_quit_asks_then_stops_everything() -> None:
    async def scenario() -> None:
        app = AllAppsApp(_services())
        async with app.run_test(size=(120, 30)) as pilot:
            await pilot.press("space")
            one = app.supervisor.runtimes["one"]
            await _until(pilot, lambda: one.process is not None)
            process = one.process
            await pilot.press("q")
            await pilot.pause()
            await pilot.press("n")
            await pilot.pause()
            assert one.process is process
            await pilot.press("q")
            await pilot.pause()
            await pilot.press("y")
            await _until(pilot, lambda: one.process is None)
        assert not process.group_alive()

    asyncio.run(scenario())
