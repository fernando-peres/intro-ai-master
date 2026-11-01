"""Entry point: `uv run all-apps`."""

import signal
import sys

from all_apps.app import AllAppsApp


def main() -> None:
    app = AllAppsApp()
    for sig in (signal.SIGTERM, signal.SIGHUP):
        signal.signal(sig, lambda *_: sys.exit(1))
    try:
        app.run()
    finally:
        app.supervisor.kill_all()
