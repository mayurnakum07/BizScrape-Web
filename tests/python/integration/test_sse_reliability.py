"""SSE connect, replay, terminal, and duplicate handling."""

from __future__ import annotations

import json
import time

from fastapi.testclient import TestClient

from bizscrape.api.events import JobEventBus
from tests.python.helpers import VALID_JOB_BODY


def test_sse_delivers_events_and_closes_on_terminal(api_client: TestClient) -> None:
    created = api_client.post("/jobs", json=VALID_JOB_BODY)
    job_id = created.json()["jobId"]

    for _ in range(40):
        if api_client.get(f"/jobs/{job_id}").json()["status"] == "completed":
            break
        time.sleep(0.05)

    event_types: list[str] = []
    with api_client.stream("GET", f"/jobs/{job_id}/events") as stream:
        assert stream.status_code == 200
        for line in stream.iter_lines():
            if line.startswith("data:"):
                event = json.loads(line[5:].strip())
                event_types.append(event["type"])
                assert event["jobId"] == job_id
                if event["type"] in ("job_completed", "job_failed", "job_cancelled"):
                    break

    assert "job_completed" in event_types or "job_failed" in event_types


def test_sse_replay_after_last_event_id(api_client: TestClient) -> None:
    created = api_client.post("/jobs", json=VALID_JOB_BODY)
    job_id = created.json()["jobId"]

    for _ in range(40):
        if api_client.get(f"/jobs/{job_id}").json()["status"] == "completed":
            break
        time.sleep(0.05)

    with api_client.stream(
        "GET",
        f"/jobs/{job_id}/events",
        headers={"Last-Event-ID": "1"},
    ) as stream:
        ids: list[str] = []
        for line in stream.iter_lines():
            if line.startswith("data:"):
                event = json.loads(line[5:].strip())
                ids.append(event["id"])
        assert all(int(value) > 1 for value in ids)


def test_event_bus_replay_skips_duplicates() -> None:
    bus = JobEventBus("job-x")
    first = bus.publish("job_started", {})
    second = bus.publish("business_found", {"count": 1})
    bus.publish("job_completed", {})

    replay = bus.events_after(first["id"])
    replay_ids = [event["id"] for event in replay]
    assert second["id"] in replay_ids
    assert first["id"] not in replay_ids


def test_terminal_event_closes_bus() -> None:
    bus = JobEventBus("job-y")
    bus.publish("job_completed", {})
    assert bus.closed is True
    replay = bus.events_after(None)
    assert any(event["type"] == "job_completed" for event in replay)
