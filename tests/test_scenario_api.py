from __future__ import annotations

from datetime import UTC, datetime, timedelta

import psycopg
import pytest
from fastapi.testclient import TestClient

from backend.app import main as main_module
from backend.app.main import app, get_scenario_service
from backend.app.models import (
    LineConfig,
    Machine,
    Operation,
    OptimizeRequest,
    OptimizeResponse,
    Worker,
)
from backend.app.optimizer import solve_line_balancing
from backend.app.persistence import ScenarioSettings, ScenarioUnavailableError
from backend.app.scenario_service import ScenarioService
from backend.app.scenario_store import InMemoryScenarioRepository

client = TestClient(app)

TOKEN = "test-token-" + "x" * 40
AUTH = {"Authorization": f"Bearer {TOKEN}"}


def _small_request(*, target_qty: int = 60) -> OptimizeRequest:
    return OptimizeRequest(
        line_name="Scenario API test",
        style_code="TEST-API",
        config=LineConfig(
            shift_minutes=480,
            break_minutes=30,
            target_qty=target_qty,
            planned_efficiency=0.85,
            max_workers=2,
            solver_time_limit_sec=10,
        ),
        operations=[
            Operation(
                id="OP1",
                name="Manual operation",
                sam_sec=20.0,
                skill_code="SEWING",
                skill_required=1,
                sequence=1,
            ),
            Operation(
                id="OP2",
                name="Machine operation",
                sam_sec=30.0,
                predecessors=["OP1"],
                machine_type="SINGLE",
                skill_code="SEWING",
                skill_required=1,
                sequence=2,
            ),
        ],
        workers=[
            Worker(
                id="W1",
                name="Worker 1",
                skills={"OP1": 2, "OP2": 2},
                machine_types=["SINGLE"],
            ),
            Worker(id="W2", name="Worker 2", skills={"OP1": 2}),
        ],
        machines=[Machine(id="M1", machine_type="SINGLE", capacity=1)],
    )


def _payload(*, name: str = "API scenario", target_qty: int = 60) -> dict:
    return {
        "name": name,
        "request": _small_request(target_qty=target_qty).model_dump(mode="json"),
    }


class _StepClock:
    def __init__(self) -> None:
        self._current = datetime(2026, 11, 8, 10, 0, tzinfo=UTC)

    def __call__(self) -> datetime:
        value = self._current
        self._current += timedelta(seconds=1)
        return value


def _settings(**overrides: object) -> ScenarioSettings:
    values: dict[str, object] = {
        "mode": "postgres",
        "database_url": "postgresql://test@localhost/test",
        "api_token": TOKEN,
        "api_token_previous": None,
        "workspace_id": "test-workspace",
        "actor_label": "pytest",
        "max_per_workspace": 200,
        "max_payload_bytes": 1_500_000,
        "save_rate_limit_max": 100,
        "save_rate_limit_window_sec": 60,
        "db_pool_min": 1,
        "db_pool_max": 2,
        "db_timeout_sec": 5,
        "config_error": None,
    }
    values.update(overrides)
    return ScenarioSettings(**values)


@pytest.fixture(scope="module")
def solved_result() -> OptimizeResponse:
    return solve_line_balancing(_small_request())


@pytest.fixture()
def scenario_api(monkeypatch: pytest.MonkeyPatch, solved_result: OptimizeResponse):
    settings = _settings()
    monkeypatch.setattr(main_module.scenario_persistence, "settings", settings)
    repository = InMemoryScenarioRepository()
    service = ScenarioService(
        repository,
        workspace_id=settings.workspace_id,
        actor_label=settings.actor_label,
        max_per_workspace=settings.max_per_workspace,
        max_payload_bytes=settings.max_payload_bytes,
        solver=lambda _request: solved_result,
        clock=_StepClock(),
    )
    app.dependency_overrides[get_scenario_service] = lambda: service
    main_module._scenario_write_buckets.clear()
    yield service, repository
    app.dependency_overrides.clear()
    main_module._scenario_write_buckets.clear()


def test_scenario_routes_are_disabled_by_default(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(
        main_module.scenario_persistence,
        "settings",
        _settings(mode="localStorage"),
    )

    response = client.post("/api/scenarios", json=_payload())

    assert response.status_code == 503
    assert response.headers["cache-control"] == "no-store"


def test_scenario_requires_bearer_token(scenario_api) -> None:
    payload = _payload()

    missing = client.post("/api/scenarios", json=payload)
    wrong = client.post(
        "/api/scenarios",
        json=payload,
        headers={"Authorization": "Bearer wrong-token"},
    )
    accepted = client.post("/api/scenarios", json=payload, headers=AUTH)

    assert missing.status_code == 401
    assert missing.headers["www-authenticate"] == "Bearer"
    assert wrong.status_code == 401
    assert accepted.status_code == 201


def test_scenario_crud_round_trip_and_list(scenario_api) -> None:
    payload = _payload(name="CRUD scenario")

    created = client.post("/api/scenarios", json=payload, headers=AUTH)
    assert created.status_code == 201
    detail = created.json()
    scenario_id = detail["id"]
    assert created.headers["location"] == f"/api/scenarios/{scenario_id}"
    assert detail["name"] == "CRUD scenario"
    assert detail["result_origin"] == "server-solve"
    assert detail["schema_version"] == 1
    assert detail["result"]["status"] in {"OPTIMAL", "FEASIBLE_LIMIT"}

    listing = client.get("/api/scenarios", headers=AUTH)
    assert listing.status_code == 200
    assert [item["id"] for item in listing.json()["items"]] == [scenario_id]

    fetched = client.get(f"/api/scenarios/{scenario_id}", headers=AUTH)
    assert fetched.status_code == 200
    assert fetched.json()["request"] == payload["request"]

    deleted = client.delete(f"/api/scenarios/{scenario_id}", headers=AUTH)
    assert deleted.status_code == 204
    assert deleted.content == b""

    missing = client.get(f"/api/scenarios/{scenario_id}", headers=AUTH)
    assert missing.status_code == 404
    assert missing.json()["detail"] == "Scenario not found."


def test_scenario_idempotent_replay_returns_200(scenario_api) -> None:
    payload = _payload(name="Retry scenario")
    headers = {**AUTH, "Idempotency-Key": "api-retry-key-0001"}

    first = client.post("/api/scenarios", json=payload, headers=headers)
    second = client.post("/api/scenarios", json=payload, headers=headers)

    assert first.status_code == 201
    assert second.status_code == 200
    assert second.json()["id"] == first.json()["id"]
    assert "location" not in second.headers


def test_scenario_same_key_different_request_conflicts(scenario_api) -> None:
    headers = {**AUTH, "Idempotency-Key": "api-conflict-key-0001"}
    assert (
        client.post("/api/scenarios", json=_payload(), headers=headers).status_code
        == 201
    )

    response = client.post(
        "/api/scenarios",
        json=_payload(name="Different", target_qty=61),
        headers=headers,
    )

    assert response.status_code == 409
    assert "different request" in response.json()["detail"]


def test_scenario_quota_returns_409(
    monkeypatch: pytest.MonkeyPatch,
    solved_result: OptimizeResponse,
) -> None:
    settings = _settings()
    monkeypatch.setattr(main_module.scenario_persistence, "settings", settings)
    service = ScenarioService(
        InMemoryScenarioRepository(),
        workspace_id=settings.workspace_id,
        max_per_workspace=1,
        solver=lambda _request: solved_result,
        clock=_StepClock(),
    )
    app.dependency_overrides[get_scenario_service] = lambda: service
    try:
        assert (
            client.post("/api/scenarios", json=_payload(), headers=AUTH).status_code
            == 201
        )
        response = client.post(
            "/api/scenarios", json=_payload(name="Second"), headers=AUTH
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 409
    assert "quota" in response.json()["detail"].lower()


def test_scenario_payload_limit_returns_413(
    scenario_api, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(
        main_module.scenario_persistence,
        "settings",
        _settings(max_payload_bytes=100),
    )

    response = client.post("/api/scenarios", json=_payload(), headers=AUTH)

    assert response.status_code == 413
    assert "100-byte" in response.json()["detail"]


def test_scenario_write_rate_limit_returns_429(
    scenario_api, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(
        main_module.scenario_persistence,
        "settings",
        _settings(save_rate_limit_max=1),
    )
    main_module._scenario_write_buckets.clear()

    first = client.post("/api/scenarios", json=_payload(), headers=AUTH)
    second = client.post("/api/scenarios", json=_payload(name="Blocked"), headers=AUTH)

    assert first.status_code == 201
    assert second.status_code == 429
    assert second.headers["retry-after"] == "60"


def test_scenario_invalid_request_returns_422(scenario_api) -> None:
    payload = _payload()
    payload["request"]["operations"][0]["predecessors"] = ["MISSING"]

    response = client.post("/api/scenarios", json=payload, headers=AUTH)

    assert response.status_code == 422
    assert "MISSING" in response.json()["detail"]


def test_scenario_invalid_cursor_and_limit_return_400(scenario_api) -> None:
    bad_cursor = client.get("/api/scenarios?cursor=not-a-cursor", headers=AUTH)
    bad_limit = client.get("/api/scenarios?limit=0", headers=AUTH)
    high_limit = client.get("/api/scenarios?limit=101", headers=AUTH)
    invalid_limit = client.get("/api/scenarios?limit=abc", headers=AUTH)

    assert bad_cursor.status_code == 400
    assert bad_limit.status_code == 400
    assert high_limit.status_code == 400
    assert invalid_limit.status_code == 422


def test_scenario_invalid_uuid_returns_404(scenario_api) -> None:
    get_response = client.get("/api/scenarios/not-a-uuid", headers=AUTH)
    delete_response = client.delete("/api/scenarios/not-a-uuid", headers=AUTH)

    assert get_response.status_code == 404
    assert delete_response.status_code == 404


def test_scenario_database_error_returns_503(scenario_api) -> None:
    def boom() -> ScenarioService:
        raise psycopg.OperationalError("database down")

    app.dependency_overrides[get_scenario_service] = boom

    response = client.get("/api/scenarios", headers=AUTH)

    assert response.status_code == 503
    assert response.json()["detail"] == "Scenario persistence database is unavailable."


def test_scenario_unavailable_error_returns_503(scenario_api) -> None:
    def boom() -> ScenarioService:
        raise ScenarioUnavailableError("not configured")

    app.dependency_overrides[get_scenario_service] = boom

    response = client.get("/api/scenarios", headers=AUTH)

    assert response.status_code == 503
    assert "Optimizer endpoints remain available" in response.json()["detail"]
