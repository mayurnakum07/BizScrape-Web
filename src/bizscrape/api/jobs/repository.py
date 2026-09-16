"""Job persistence abstraction."""

from __future__ import annotations

from abc import ABC, abstractmethod
from copy import deepcopy
from threading import Lock
from typing import Any


class JobRepository(ABC):
    @abstractmethod
    def create(self, job_id: str, record: dict[str, Any]) -> None:
        ...

    @abstractmethod
    def get(self, job_id: str) -> dict[str, Any] | None:
        ...

    @abstractmethod
    def update(self, job_id: str, patch: dict[str, Any]) -> dict[str, Any] | None:
        ...

    @abstractmethod
    def list_ids(self) -> list[str]:
        ...

    @abstractmethod
    def delete(self, job_id: str) -> None:
        ...


class InMemoryJobRepository(JobRepository):
    """Process-local job store — replace later with persistent storage."""

    def __init__(self) -> None:
        self._jobs: dict[str, dict[str, Any]] = {}
        self._lock = Lock()

    def create(self, job_id: str, record: dict[str, Any]) -> None:
        with self._lock:
            self._jobs[job_id] = deepcopy(record)

    def get(self, job_id: str) -> dict[str, Any] | None:
        with self._lock:
            row = self._jobs.get(job_id)
            return deepcopy(row) if row is not None else None

    def update(self, job_id: str, patch: dict[str, Any]) -> dict[str, Any] | None:
        with self._lock:
            row = self._jobs.get(job_id)
            if row is None:
                return None
            row.update(patch)
            return deepcopy(row)

    def list_ids(self) -> list[str]:
        with self._lock:
            return list(self._jobs.keys())

    def delete(self, job_id: str) -> None:
        with self._lock:
            self._jobs.pop(job_id, None)
