"""The Textual app: left dashboard, right per-service terminal. Auto-refreshes once a second."""

import webbrowser
from collections.abc import Iterable

from textual.app import App, ComposeResult
from textual.binding import Binding
from textual.containers import Horizontal, Vertical
from textual.screen import ModalScreen
from textual.widgets import Footer, Static

from all_apps.services import SERVICES, Service
from all_apps.supervisor import Supervisor
from all_apps.widgets import Details, ServiceRow, TabBar, TerminalView, is_active

_TICK_SECONDS = 1.0
_REDRAW_SECONDS = 0.05
_GROUPS = {"web": "Frontends", "api": "APIs", "db": "Databases"}


class ConfirmQuit(ModalScreen[bool]):
    BINDINGS = [("y", "dismiss(True)", "Stop and quit"), ("n,escape", "dismiss(False)", "Cancel")]

    def __init__(self, running: int):
        super().__init__()
        self.running = running

    def compose(self) -> ComposeResult:
        yield Static(
            f"{self.running} service(s) running.\nStop them and quit?  [b]y[/] / [b]n[/]",
            id="confirm",
        )


class AllAppsApp(App[None]):
    TITLE = "all-apps"
    AUTO_FOCUS = None  # Keys drive the dashboard until the user chooses to type.
    CSS = """
    #left { width: 58; }
    #services { height: auto; border: round $primary; padding: 0 1; }
    #details { height: 1fr; border: round $primary; padding: 0 1; }
    .service-group { height: 1; color: $text-muted; text-style: bold; }
    .service-row { height: 1; }
    .service-row.selected { background: $boost; text-style: bold; }
    #right { width: 1fr; border: round $primary; }
    #right.typing { border: round $warning; }
    #tabs { height: auto; }
    #terminal { height: 1fr; }
    ConfirmQuit { align: center middle; }
    #confirm { width: auto; height: auto; padding: 1 3; border: round $warning; }
    """
    BINDINGS = [
        Binding("space", "toggle", "Run/stop"),
        Binding("r", "restart", "Restart"),
        Binding("a", "start_all", "All"),
        Binding("x", "stop_all", "Stop all"),
        Binding("o", "open", "Open"),
        Binding("t", "type", "Type"),
        Binding("up,k", "move(-1)", show=False),
        Binding("down,j", "move(1)", show=False),
        Binding("pageup", "scroll_terminal(1)", show=False),
        Binding("pagedown", "scroll_terminal(-1)", show=False),
        Binding("q", "quit", "Quit"),
    ]

    def __init__(self, services: Iterable[Service] = SERVICES):
        super().__init__()
        self.supervisor = Supervisor(services, on_output=self._mark_dirty)
        self.selected = next(iter(self.supervisor.runtimes))
        self._dirty = False
        self._ticking = False

    def compose(self) -> ComposeResult:
        with Horizontal():
            with Vertical(id="left"):
                with Vertical(id="services") as services:
                    services.border_title = "Services"
                    kind = None
                    for rt in self.supervisor.runtimes.values():
                        if rt.service.kind != kind:
                            kind = rt.service.kind
                            yield Static(_GROUPS[kind], classes="service-group")
                        yield ServiceRow(rt)
                details = Details(id="details")
                details.border_title = "Details"
                yield details
            with Vertical(id="right"):
                yield TabBar(id="tabs")
                yield TerminalView(self.supervisor, self.selected, id="terminal")
        yield Footer()

    def on_mount(self) -> None:
        self.set_interval(_TICK_SECONDS, self._tick)
        self.set_interval(_REDRAW_SECONDS, self._redraw_terminal)
        self._refresh_dashboard()

    def _mark_dirty(self, name: str) -> None:
        if name == self.selected:
            self._dirty = True

    def _redraw_terminal(self) -> None:
        if self._dirty:
            self._dirty = False
            self.query_one(TerminalView).refresh()

    async def _tick(self) -> None:
        if self._ticking:
            return
        self._ticking = True
        try:
            await self.supervisor.tick()
        finally:
            self._ticking = False
        self._refresh_dashboard()

    def _refresh_dashboard(self) -> None:
        for row in self.query(ServiceRow):
            row.set_class(row.runtime.service.name == self.selected, "selected")
            row.refresh()
        self.query_one(Details).show(self.supervisor.runtimes[self.selected], self.supervisor)
        self.query_one(TabBar).show(self.supervisor, self.selected)

    def _run(self, coroutine) -> None:
        async def work() -> None:
            await coroutine
            self._refresh_dashboard()

        self.run_worker(work(), exclusive=False)
        self.call_later(self._refresh_dashboard)

    def action_select_service(self, name: str) -> None:
        self.selected = name
        self.query_one(TerminalView).show(name)
        self._refresh_dashboard()

    def on_service_row_selected(self, message: ServiceRow.Selected) -> None:
        self.action_select_service(message.name)

    def on_service_row_toggled(self, message: ServiceRow.Toggled) -> None:
        self._toggle(message.name)

    def on_terminal_view_released(self) -> None:
        self.set_focus(None)

    def _toggle(self, name: str) -> None:
        rt = self.supervisor.runtimes[name]
        action = self.supervisor.stop if is_active(rt) else self.supervisor.start
        self._run(action(name))

    def action_toggle(self) -> None:
        self._toggle(self.selected)

    def action_restart(self) -> None:
        self._run(self.supervisor.restart(self.selected))

    def action_start_all(self) -> None:
        self._run(self.supervisor.start_all())

    def action_stop_all(self) -> None:
        self._run(self.supervisor.stop_all())

    def action_open(self) -> None:
        url = self.supervisor.runtimes[self.selected].service.url
        if url:
            webbrowser.open(url)
        else:
            self.notify(f"{self.selected} has no web address")

    def action_type(self) -> None:
        self.query_one(TerminalView).focus()
        self.notify("Typing into the service. Press ctrl+] to return.")

    def action_move(self, delta: int) -> None:
        names = list(self.supervisor.runtimes)
        self.action_select_service(names[(names.index(self.selected) + delta) % len(names)])

    def action_scroll_terminal(self, direction: int) -> None:
        view = self.query_one(TerminalView)
        view.scroll_lines(direction * max(1, view.content_size.height - 1))

    async def action_quit(self) -> None:
        running = sum(1 for rt in self.supervisor.runtimes.values() if rt.process is not None)
        if not running:
            self.exit()
            return

        async def stop_and_exit() -> None:
            await self.supervisor.stop_all()
            self.exit()

        def answered(confirmed: bool | None) -> None:
            if confirmed:
                self.notify("Stopping services…")
                self.run_worker(stop_and_exit())

        self.push_screen(ConfirmQuit(running), answered)
