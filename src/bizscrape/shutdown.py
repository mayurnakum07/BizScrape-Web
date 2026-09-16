"""
Hard-stop on Ctrl+C.

Playwright waits in native code, so Python's SIGINT often does nothing until
a page timeout ends (30–45s). On Windows we use SetConsoleCtrlHandler, which
fires immediately, then taskkill the whole process tree.
"""

from __future__ import annotations

import atexit
import os
import signal
import subprocess
import sys
import threading
from typing import Any

_store: Any = None
_hit = 0
_stopping = False
_installed = False
_job_cancel_flag: threading.Event | None = None

# Keep a reference so ctypes does not garbage-collect the callback.
_win_handler_ref: Any = None


class JobCancelled(BaseException):
    """Cooperative cancel — BaseException so ``except Exception`` cannot swallow it."""


def register_store(store: Any) -> None:
    global _store
    _store = store


def set_job_cancel_flag(flag: threading.Event | None) -> None:
    """API jobs: cooperative cancel without killing the server process."""
    global _job_cancel_flag
    _job_cancel_flag = flag


def is_stopping() -> bool:
    return _stopping


def check() -> None:
    """Call between scrape steps — exits if Ctrl+C was requested."""
    if _job_cancel_flag is not None and _job_cancel_flag.is_set():
        raise JobCancelled("Job cancelled")
    if _stopping:
        force_exit(130)


def install() -> None:
    """Install Ctrl+C handlers (idempotent)."""
    global _installed, _win_handler_ref
    if _installed:
        return
    _installed = True

    # Python-level (works when interpreter is in Python code).
    try:
        signal.signal(signal.SIGINT, _signal_handle)
    except (ValueError, OSError):
        pass
    if hasattr(signal, "SIGTERM"):
        try:
            signal.signal(signal.SIGTERM, _signal_handle)
        except (ValueError, OSError):
            pass
    if hasattr(signal, "SIGBREAK"):  # Windows Ctrl+Break
        try:
            signal.signal(signal.SIGBREAK, _signal_handle)
        except (ValueError, OSError):
            pass

    # Windows console handler — fires even while blocked in Playwright C++.
    if os.name == "nt":
        _install_windows_console_handler()

    atexit.register(_atexit_kill_children)


def force_exit(code: int = 130) -> None:
    """Flush CSV (best effort), kill browsers, die immediately."""
    global _stopping
    _stopping = True

    try:
        sys.stderr.write("\n^C — killing process…\n")
        sys.stderr.flush()
    except Exception:
        pass

    # Flush in a short-lived thread so a stuck disk write cannot block exit.
    flusher = threading.Thread(target=_flush_store, name="csv-flush", daemon=True)
    flusher.start()
    flusher.join(timeout=1.5)

    _nuke_process_tree(os.getpid())
    os._exit(code)


def _signal_handle(signum: int, frame: Any) -> None:  # noqa: ARG001
    global _hit
    _hit += 1
    if _hit >= 2:
        # Second press: no flush, kill now.
        _nuke_process_tree(os.getpid())
        os._exit(130)
    force_exit(130)


def _flush_store() -> None:
    if _store is None:
        return
    try:
        _store.flush()
    except Exception:
        pass


def _atexit_kill_children() -> None:
    if _stopping:
        return
    try:
        kill_child_processes()
    except Exception:
        pass


def kill_child_processes() -> None:
    pid = os.getpid()
    if os.name == "nt":
        _taskkill_children(pid)
    else:
        _kill_posix_children(pid)


def _nuke_process_tree(pid: int) -> None:
    """
    Kill this process and every descendant (Chrome, Edge, node, playwright).

    Detached taskkill so it keeps running even as we disappear.
    """
    if os.name == "nt":
        try:
            flags = 0
            if hasattr(subprocess, "DETACHED_PROCESS"):
                flags |= subprocess.DETACHED_PROCESS
            if hasattr(subprocess, "CREATE_NEW_PROCESS_GROUP"):
                flags |= subprocess.CREATE_NEW_PROCESS_GROUP
            subprocess.Popen(
                ["taskkill", "/F", "/T", "/PID", str(pid)],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                stdin=subprocess.DEVNULL,
                creationflags=flags,
                close_fds=True,
            )
        except Exception:
            _taskkill_children(pid)
    else:
        _kill_posix_children(pid)
        try:
            os.kill(pid, signal.SIGKILL)
        except OSError:
            pass


def _taskkill_children(pid: int) -> None:
    try:
        listed = subprocess.run(
            ["wmic", "process", "where", f"ParentProcessId={pid}", "get", "ProcessId"],
            capture_output=True,
            text=True,
            timeout=3,
        )
        child_ids = [
            int(piece)
            for piece in (listed.stdout or "").split()
            if piece.strip().isdigit() and int(piece) != pid
        ]
    except Exception:
        child_ids = []

    for child in child_ids:
        try:
            subprocess.run(
                ["taskkill", "/F", "/T", "/PID", str(child)],
                capture_output=True,
                timeout=3,
            )
        except Exception:
            continue


def _kill_posix_children(pid: int) -> None:
    try:
        out = subprocess.run(
            ["ps", "-o", "pid=", "--ppid", str(pid)],
            capture_output=True,
            text=True,
            timeout=3,
        )
        for piece in (out.stdout or "").split():
            if not piece.strip().isdigit():
                continue
            child = int(piece)
            try:
                os.kill(child, signal.SIGKILL)
            except OSError:
                continue
    except Exception:
        pass


def _install_windows_console_handler() -> None:
    global _win_handler_ref
    try:
        import ctypes
        from ctypes import wintypes
    except Exception:
        return

    CTRL_C_EVENT = 0
    CTRL_BREAK_EVENT = 1
    CTRL_CLOSE_EVENT = 2

    HandlerRoutine = ctypes.WINFUNCTYPE(wintypes.BOOL, wintypes.DWORD)

    def _console_ctrl(ctrl_type: int) -> bool:
        if ctrl_type in (CTRL_C_EVENT, CTRL_BREAK_EVENT, CTRL_CLOSE_EVENT):
            # Run kill on a daemon thread — the console handler has restrictions.
            threading.Thread(
                target=force_exit, args=(130,), name="ctrl-c-kill", daemon=True
            ).start()
            # Give the killer a moment; return TRUE = we handled it.
            return True
        return False

    _win_handler_ref = HandlerRoutine(_console_ctrl)
    try:
        ctypes.windll.kernel32.SetConsoleCtrlHandler(_win_handler_ref, True)
    except Exception:
        _win_handler_ref = None
