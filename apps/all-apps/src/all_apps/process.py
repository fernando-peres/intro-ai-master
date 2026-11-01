"""A child process on its own pty and in its own process group. POSIX only."""

import asyncio
import fcntl
import os
import pty
import signal
import struct
import subprocess
import termios
from collections.abc import Mapping, Sequence
from pathlib import Path


class ManagedProcess:
    def __init__(
        self, command: Sequence[str], cwd: Path, env: Mapping[str, str], rows: int, cols: int
    ):
        self.master, slave = pty.openpty()
        self._set_size(rows, cols)
        os.set_blocking(self.master, False)
        try:
            self._popen = subprocess.Popen(
                command,
                cwd=cwd,
                env={**os.environ, "TERM": "xterm-256color", "COLORTERM": "truecolor", **env},
                stdin=slave,
                stdout=slave,
                stderr=slave,
                start_new_session=True,
            )
        except OSError:
            os.close(self.master)
            raise
        finally:
            os.close(slave)
        self.pid = self._popen.pid

    def _set_size(self, rows: int, cols: int) -> None:
        fcntl.ioctl(self.master, termios.TIOCSWINSZ, struct.pack("HHHH", rows, cols, 0, 0))

    def resize(self, rows: int, cols: int) -> None:
        self._set_size(rows, cols)
        self._signal(signal.SIGWINCH)

    def read(self) -> bytes | None:
        """Return pending output: b"" if none yet, None once the pty has closed."""
        try:
            return os.read(self.master, 65536) or None
        except BlockingIOError:
            return b""
        except OSError:
            return None

    def write(self, data: bytes) -> None:
        try:
            os.write(self.master, data)
        except OSError:
            pass

    def poll(self) -> int | None:
        return self._popen.poll()

    def interrupt(self) -> None:
        self._signal(signal.SIGINT)

    def _signal(self, sig: signal.Signals) -> None:
        try:
            os.killpg(self.pid, sig)
        except ProcessLookupError, PermissionError:
            pass

    def group_alive(self) -> bool:
        self.poll()
        try:
            os.killpg(self.pid, 0)
        except ProcessLookupError, PermissionError:
            # macOS answers EPERM for a group holding only zombies.
            return False
        return True

    async def stop(self, timeout: float = 5.0) -> None:
        """SIGTERM the whole group, SIGKILL whatever outlives the timeout."""
        self._signal(signal.SIGTERM)
        deadline = asyncio.get_running_loop().time() + timeout
        while self.group_alive() and asyncio.get_running_loop().time() < deadline:
            await asyncio.sleep(0.05)
        self.kill()

    def kill(self) -> None:
        self._signal(signal.SIGKILL)
        try:
            self._popen.wait(timeout=2)
        except subprocess.TimeoutExpired:
            pass

    def close(self) -> None:
        try:
            os.close(self.master)
        except OSError:
            pass
