"""Dashboard widgets: they render `Runtime` state and own only the scroll position."""

import time
from functools import lru_cache

from rich.color import Color, ColorParseError
from rich.style import Style
from rich.text import Text
from textual.events import Click, Key, MouseScrollDown, MouseScrollUp, Resize
from textual.message import Message
from textual.widget import Widget
from textual.widgets import Static

from all_apps.monitor import format_bytes, format_uptime, process_name, sparkline
from all_apps.supervisor import Runtime, Status, Supervisor

STATUS_STYLE = {
    Status.STOPPED: ("○", "bright_black"),
    Status.STARTING: ("◐", "yellow"),
    Status.RUNNING: ("●", "green"),
    Status.UNHEALTHY: ("●", "dark_orange"),
    Status.CRASHED: ("✖", "red"),
    Status.PORT_BUSY: ("◆", "magenta"),
}

_KEY_BYTES = {
    "enter": b"\r",
    "tab": b"\t",
    "backspace": b"\x7f",
    "delete": b"\x1b[3~",
    "escape": b"\x1b",
    "up": b"\x1b[A",
    "down": b"\x1b[B",
    "right": b"\x1b[C",
    "left": b"\x1b[D",
    "home": b"\x1b[H",
    "end": b"\x1b[F",
    "pageup": b"\x1b[5~",
    "pagedown": b"\x1b[6~",
}
_PYTE_COLOR = {"brown": "yellow", "brightbrown": "bright_yellow"}
_DETAILS_WIDTH = 54


def is_active(rt: Runtime) -> bool:
    return rt.status in (Status.STARTING, Status.RUNNING, Status.UNHEALTHY)


class ServiceRow(Widget):
    """One service. Clicking the leading ▶/■ toggles it; clicking elsewhere selects it."""

    can_focus = False

    class Selected(Message):
        def __init__(self, name: str):
            super().__init__()
            self.name = name

    class Toggled(Message):
        def __init__(self, name: str):
            super().__init__()
            self.name = name

    def __init__(self, runtime: Runtime):
        super().__init__(id=f"row-{runtime.service.name}", classes="service-row")
        self.runtime = runtime

    def render(self) -> Text:
        rt = self.runtime
        symbol, color = STATUS_STYLE[rt.status]
        text = Text(no_wrap=True)
        text.append("■ " if is_active(rt) else "▶ ", style="bold")
        text.append(f"{symbol} ", style=color)
        text.append(f"{rt.service.name:<20}")
        text.append(f"{f'localhost:{rt.service.port}':<16}")
        text.append(f"{rt.status.value:<10}", style=color)
        if rt.errors.count:
            text.append(f"!{rt.errors.count}", style="bold red")
        return text

    def on_click(self, event: Click) -> None:
        event.stop()
        if event.x <= 1:
            self.post_message(self.Toggled(self.runtime.service.name))
        self.post_message(self.Selected(self.runtime.service.name))


class Details(Static):
    """Everything known about the selected service."""

    def show(self, rt: Runtime, supervisor: Supervisor) -> None:
        self.update(self._text(rt, supervisor))

    def _text(self, rt: Runtime, supervisor: Supervisor) -> Text:
        service = rt.service
        text = Text()
        if service.url:
            text.append(service.url, style="bold")
            if service.docs_path:
                text.append(f"  {service.docs_path}", style="dim")
        else:
            text.append(f"localhost:{service.port}", style="bold")
        text.append("\n")
        if rt.status is Status.PORT_BUSY:
            owner = f"{process_name(rt.owner_pid)} (PID {rt.owner_pid})"
            text.append(f"Port held by {owner}, not started here\n", style="magenta")
        elif rt.process is not None and rt.started_at is not None:
            uptime = format_uptime(time.monotonic() - rt.started_at)
            text.append(f"PID {rt.process.pid} · up {uptime} · ")
            text.append(f"{format_bytes(rt.rss)} · {rt.cpu:.0f}% CPU\n")
        else:
            text.append("Not running\n", style="dim")
        if rt.check is not None:
            label = "health" if service.check_path == "/health" else "check"
            text.append(f"{label} {rt.check.detail} in {rt.check.latency_ms} ms · ")
        text.append(f"restarts {rt.restarts}\n")
        text.append(f"errors {rt.errors.count} · last exit ")
        text.append("—" if rt.last_exit is None else str(rt.last_exit))
        for label, names in (("needs", service.needs), ("wants", service.wants)):
            for name in names:
                dep = supervisor.runtimes[name].status
                text.append(f"\n{label} {name}: ")
                text.append(dep.value, style=STATUS_STYLE[dep][1])
        if rt.note:
            text.append(f"\n{rt.note}", style="yellow")
        if rt.process is not None and rt.cpu_history:
            text.append(f"\ncpu {sparkline(rt.cpu_history)}", style="cyan")
            text.append(f"\nmem {sparkline(rt.rss_history)}", style="cyan")
        if rt.errors.last:
            text.append(f"\n{rt.errors.last[:_DETAILS_WIDTH]}", style="red")
        for event in rt.events:
            text.append(f"\n{event.stamp} ", style="dim")
            text.append(event.status.value, style=STATUS_STYLE[event.status][1])
            room = _DETAILS_WIDTH - len(event.stamp) - len(event.status.value) - 2
            if event.note and room > 0:
                text.append(f" {event.note[:room]}", style="dim")
        return text


class TabBar(Static):
    """Terminal tabs; clicking one selects its service."""

    def show(self, supervisor: Supervisor, selected: str) -> None:
        parts = []
        for name, rt in supervisor.runtimes.items():
            color = STATUS_STYLE[rt.status][1]
            label = f"[b reverse] {name} [/]" if name == selected else f" [{color}]{name}[/] "
            parts.append(f"[@click=app.select_service('{name}')]{label}[/]")
        self.update("".join(parts))


@lru_cache(maxsize=1024)
def _color(name: str) -> Color | None:
    if name == "default":
        return None
    name = _PYTE_COLOR.get(name, name)
    if name.startswith("bright") and not name.startswith("bright_"):
        name = f"bright_{name[6:]}"
    if len(name) == 6:
        try:
            int(name, 16)
            name = f"#{name}"
        except ValueError:
            pass
    try:
        return Color.parse(name)
    except ColorParseError:
        return None


@lru_cache(maxsize=4096)
def _style(fg: str, bg: str, bold: bool, italics: bool, underscore: bool, reverse: bool) -> Style:
    return Style(
        color=_color(fg),
        bgcolor=_color(bg),
        bold=bold or None,
        italic=italics or None,
        underline=underscore or None,
        reverse=reverse or None,
    )


def _render_line(line, cols: int) -> Text:
    text = Text(no_wrap=True, end="")
    for x in range(cols):
        char = line[x]
        text.append(
            char.data or " ",
            _style(char.fg, char.bg, char.bold, char.italics, char.underscore, char.reverse),
        )
    text.rstrip()
    return text


class TerminalView(Widget):
    """Live view of one service's terminal, with scrollback. Focus it to type into the service."""

    can_focus = True

    class Released(Message):
        """The user pressed the key that returns to the dashboard."""

    def __init__(self, supervisor: Supervisor, selected: str, **kwargs):
        super().__init__(**kwargs)
        self.supervisor = supervisor
        self.selected = selected
        self.offset_lines = 0

    def show(self, name: str) -> None:
        self.selected = name
        self.offset_lines = 0
        self.refresh()

    def render(self) -> Text:
        screen = self.supervisor.runtimes[self.selected].screen
        top = list(screen.history.top)
        rows = [*top, *(screen.buffer[y] for y in range(screen.lines))]
        end = len(rows) - self.offset_lines
        output = Text(no_wrap=True)
        for i, line in enumerate(rows[max(0, end - screen.lines) : end]):
            if i:
                output.append("\n")
            output.append_text(_render_line(line, screen.columns))
        return output

    def scroll_lines(self, delta: int) -> None:
        limit = len(self.supervisor.runtimes[self.selected].screen.history.top)
        self.offset_lines = max(0, min(limit, self.offset_lines + delta))
        self.refresh()

    def on_mouse_scroll_up(self, event: MouseScrollUp) -> None:
        event.stop()
        self.scroll_lines(3)

    def on_mouse_scroll_down(self, event: MouseScrollDown) -> None:
        event.stop()
        self.scroll_lines(-3)

    def on_resize(self, event: Resize) -> None:
        self.supervisor.resize(self.content_size.height, self.content_size.width)

    def on_focus(self) -> None:
        self.parent.add_class("typing")

    def on_blur(self) -> None:
        self.parent.remove_class("typing")

    def on_key(self, event: Key) -> None:
        event.stop()
        event.prevent_default()
        if event.key in ("ctrl+right_square_bracket", "ctrl+]"):
            self.post_message(self.Released())
            return
        process = self.supervisor.runtimes[self.selected].process
        if process is None:
            return
        if event.key == "ctrl+c":
            process.interrupt()
        elif event.key in _KEY_BYTES:
            process.write(_KEY_BYTES[event.key])
        elif event.character:
            process.write(event.character.encode())
