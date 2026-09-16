"""API validation tests — malformed payloads rejected cleanly."""

from __future__ import annotations

import uuid

import pytest
from fastapi.testclient import TestClient

from tests.python.helpers import VALID_JOB_BODY


@pytest.mark.parametrize(
    "body,field",
    [
        ({k: v for k, v in VALID_JOB_BODY.items() if k != "businessType"}, "businessType"),
        ({k: v for k, v in VALID_JOB_BODY.items() if k != "city"}, "city"),
        ({**VALID_JOB_BODY, "target": 0}, "target"),
        ({**VALID_JOB_BODY, "target": 99999}, "target"),
        ({**VALID_JOB_BODY, "sources": ["facebook"]}, "sources"),
        ({**VALID_JOB_BODY, "sources": []}, "sources"),
        ({**VALID_JOB_BODY, "target": "not-a-number"}, "target"),
        ({**VALID_JOB_BODY, "businessType": "caf\u0007e"}, "businessType"),
    ],
)
def test_rejects_invalid_create_payload(api_client: TestClient, body: dict, field: str) -> None:
    response = api_client.post("/jobs", json=body)
    assert response.status_code == 422
    payload = response.json()
    assert payload["code"] == "VALIDATION_ERROR"
    assert "fields" in (payload.get("details") or {})


def test_rejects_non_json_body(api_client: TestClient) -> None:
    response = api_client.post(
        "/jobs",
        content="not json",
        headers={"Content-Type": "text/plain"},
    )
    assert response.status_code == 422


def test_unexpected_fields_are_ignored_or_rejected(api_client: TestClient) -> None:
    response = api_client.post("/jobs", json={**VALID_JOB_BODY, "hackField": True})
    # Pydantic v2 default ignores extra fields unless forbidden.
    assert response.status_code in (201, 422)


def test_invalid_job_id_on_get(api_client: TestClient) -> None:
    response = api_client.get("/jobs/not-a-valid-id")
    assert response.status_code == 400
    assert response.json()["code"] == "INVALID_JOB_ID"


def test_valid_uuid_missing_job(api_client: TestClient) -> None:
    missing = str(uuid.uuid4())
    response = api_client.get(f"/jobs/{missing}")
    assert response.status_code == 404
    assert response.json()["code"] == "JOB_NOT_FOUND"
