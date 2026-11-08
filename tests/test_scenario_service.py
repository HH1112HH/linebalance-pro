from __future__ import annotations

import base64
from datetime import UTC, datetime, timedelta

import pytest
from pydantic import ValidationError

from backend.app.models import (
    LineConfig,
    Machine,
    Operation,
    OptimizeRequest,
    OptimizeResponse,
    ScenarioCreateRequest,
    Worker,
)
from backend.app.optimizer import solve_line_balancing
from backend.app.scenario_service import (
    ScenarioConflictError,
    ScenarioInvalidDataError,
    ScenarioInvalidRequestError,
    ScenarioNotFoundError,
    ScenarioPayloadTooLargeError,
    ScenarioQuotaExceededError,
    ScenarioService,
    ScenarioSolveError,
    ScenarioSolverMetadataError,
    decode_cursor,
    encode_cursor,
)
from backend.app.scenario_store import InMemoryScenarioRepository


def _small_request(**config_overrides: object) -> OptimizeRequest:
    config_values: dict[str, object] = {
        "shift_minutes": 480,
        "break_minutes": 30,
        "target_qty": 60,
        "planned_efficiency": 0.85,
        "max_workers": 2,
        "solver_time_limit_sec": 10,
    }
    config_values.update(config_overrides)
    return OptimizeRequest(
        line_name="Scenario service test",
        style_code="TEST-001",
        config=LineConfig(**config_values),
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


class _StepClock:
    def __init__(self) -> None:
        self._current = datetime(2026, 11, 8, 10, 0, tzinfo=UTC)

    def __call__(self) -> datetime:
        value = self._current
        self._current += timedelta(seconds=1)
        return value


@pytest.fixture(scope="module")
def solved_result() -> OptimizeResponse:
    return solve_line_balancing(_small_request())


@pytest.fixture()
def request_payload() -> ScenarioCreateRequest:
    return ScenarioCreateRequest(name="A — after rebalance", request=_small_request())


def _service(
    repository: InMemoryScenarioRepository,
    *,
    solved: OptimizeResponse,
    **kwargs: object,
) -> ScenarioService:
    def solver(_req: OptimizeRequest) -> OptimizeResponse:
        return solved

    return ScenarioService(repository, solver=solver, clock=_StepClock(), **kwargs)


def test_create_stores_server_solved_record_and_audit(
    solved_result: OptimizeResponse,
) -> None:
    repository = InMemoryScenarioRepository()
    service = _service(repository, solved=solved_result)

    outcome = service.create(
        ScenarioCreateRequest(name="  A — after rebalance  ", request=_small_request()),
        idempotency_key="key-0001",
    )

    record = outcome.record
    assert outcome.created is True
    assert record.name == "A — after rebalance"
    assert record.workspace_id == "demo"
    assert record.status in {"OPTIMAL", "FEASIBLE_LIMIT"}
    assert record.result_origin == "server-solve"
    assert record.schema_version == 1
    assert record.model_version == solved_result.metadata.model_version
    assert record.workers_used == solved_result.kpis.workers_used
    assert record.stations_used == len(solved_result.stations)
    assert repository.count("demo") == 1

    detail = service.get(record.id)
    assert detail.id == record.id
    assert detail.request == _small_request()
    assert detail.result.status == solved_result.status
    assert repository.audit_events[0].action == "create"
    assert repository.audit_events[0].actor == "admin"


def test_idempotent_replay_returns_existing_record(
    solved_result: OptimizeResponse,
) -> None:
    repository = InMemoryScenarioRepository()
    service = _service(repository, solved=solved_result)
    payload = ScenarioCreateRequest(name="Same", request=_small_request())

    first = service.create(payload, idempotency_key="retry-me")
    second = service.create(payload, idempotency_key="retry-me")

    assert first.created is True
    assert second.created is False
    assert second.record.id == first.record.id
    assert repository.count("demo") == 1


def test_same_idempotency_key_with_different_request_conflicts(
    solved_result: OptimizeResponse,
) -> None:
    repository = InMemoryScenarioRepository()
    service = _service(repository, solved=solved_result)
    service.create(
        ScenarioCreateRequest(name="First", request=_small_request()),
        idempotency_key="shared-key",
    )

    with pytest.raises(ScenarioConflictError, match="different request"):
        service.create(
            ScenarioCreateRequest(name="Second", request=_small_request(target_qty=61)),
            idempotency_key="shared-key",
        )


def test_quota_blocks_new_scenario(solved_result: OptimizeResponse) -> None:
    repository = InMemoryScenarioRepository()
    service = _service(repository, solved=solved_result, max_per_workspace=1)
    service.create(ScenarioCreateRequest(name="First", request=_small_request()))

    with pytest.raises(ScenarioQuotaExceededError):
        service.create(ScenarioCreateRequest(name="Second", request=_small_request()))


def test_rejected_solver_status_is_not_stored(
    solved_result: OptimizeResponse,
) -> None:
    repository = InMemoryScenarioRepository()
    infeasible = solved_result.model_copy(update={"status": "INFEASIBLE"})
    service = _service(repository, solved=infeasible)

    with pytest.raises(ScenarioSolveError, match="INFEASIBLE"):
        service.create(ScenarioCreateRequest(name="Bad", request=_small_request()))

    assert repository.count("demo") == 0
    assert repository.audit_events == []


def test_solver_metadata_hash_mismatch_is_rejected(
    solved_result: OptimizeResponse,
) -> None:
    repository = InMemoryScenarioRepository()
    metadata = solved_result.metadata.model_copy(update={"input_hash": "wrong"})
    mismatched = solved_result.model_copy(update={"metadata": metadata})
    service = _service(repository, solved=mismatched)

    with pytest.raises(ScenarioSolverMetadataError):
        service.create(ScenarioCreateRequest(name="Bad", request=_small_request()))


def test_solver_metadata_missing_is_rejected(
    solved_result: OptimizeResponse,
) -> None:
    repository = InMemoryScenarioRepository()
    missing = solved_result.model_copy(update={"metadata": None})
    service = _service(repository, solved=missing)

    with pytest.raises(ScenarioSolverMetadataError):
        service.create(ScenarioCreateRequest(name="Bad", request=_small_request()))


def test_invalid_request_is_rejected_before_solving() -> None:
    repository = InMemoryScenarioRepository()
    calls: list[OptimizeRequest] = []

    def solver(req: OptimizeRequest) -> OptimizeResponse:
        calls.append(req)
        raise AssertionError("solver must not run for invalid data")

    service = ScenarioService(repository, solver=solver, clock=_StepClock())
    invalid = _small_request().model_copy(
        update={
            "operations": [
                _small_request()
                .operations[0]
                .model_copy(update={"predecessors": ["MISSING"]})
            ]
        }
    )

    with pytest.raises(ScenarioInvalidDataError, match="invalid"):
        service.create(ScenarioCreateRequest(name="Bad", request=invalid))

    assert calls == []


def test_payload_limit_rejects_before_solving(
    request_payload: ScenarioCreateRequest,
    solved_result: OptimizeResponse,
) -> None:
    repository = InMemoryScenarioRepository()
    service = _service(repository, solved=solved_result, max_payload_bytes=10)

    with pytest.raises(ScenarioPayloadTooLargeError, match="10-byte"):
        service.create(request_payload)


def test_idempotency_key_validation(
    solved_result: OptimizeResponse,
) -> None:
    repository = InMemoryScenarioRepository()
    service = _service(repository, solved=solved_result)
    payload = ScenarioCreateRequest(name="Key test", request=_small_request())

    for key in ("", "   ", "short", "bad key", "bad\nkey", "x" * 65):
        with pytest.raises(ScenarioInvalidRequestError):
            service.create(payload, idempotency_key=key)


def test_scenario_name_validation() -> None:
    valid = ScenarioCreateRequest(name="  Áo sơ mi — ca 1  ", request=_small_request())
    assert valid.name == "Áo sơ mi — ca 1"

    for name in ("   ", "bad\x00name", "x" * 121):
        with pytest.raises(ValidationError):
            ScenarioCreateRequest(name=name, request=_small_request())


def test_cursor_round_trip_and_invalid_values(
    solved_result: OptimizeResponse,
) -> None:
    repository = InMemoryScenarioRepository()
    service = _service(repository, solved=solved_result)
    outcome = service.create(
        ScenarioCreateRequest(name="Cursor", request=_small_request())
    )

    cursor = encode_cursor(outcome.record)
    assert decode_cursor(cursor) == (outcome.record.created_at, outcome.record.id)

    bad_timestamp = base64.urlsafe_b64encode(
        f"not-a-time|{outcome.record.id}".encode()
    ).decode()
    bad_uuid = base64.urlsafe_b64encode(
        f"{outcome.record.created_at}|not-a-uuid".encode()
    ).decode()
    naive_timestamp = base64.urlsafe_b64encode(
        f"2026-11-08T10:00:00|{outcome.record.id}".encode()
    ).decode()
    for invalid in (
        "",
        "★",
        "not-base64!",
        "abc",
        bad_timestamp,
        bad_uuid,
        naive_timestamp,
    ):
        with pytest.raises(ScenarioInvalidRequestError):
            decode_cursor(invalid)


def test_pagination_returns_next_cursor(
    solved_result: OptimizeResponse,
) -> None:
    repository = InMemoryScenarioRepository()
    service = _service(repository, solved=solved_result)
    for index in range(3):
        service.create(
            ScenarioCreateRequest(name=f"Scenario {index}", request=_small_request())
        )

    first = service.list(limit=2)
    assert len(first.items) == 2
    assert first.next_cursor is not None

    second = service.list(limit=2, cursor=first.next_cursor)
    assert len(second.items) == 1
    assert second.next_cursor is None
    assert {item.id for item in first.items}.isdisjoint(
        {item.id for item in second.items}
    )

    with pytest.raises(ScenarioInvalidRequestError, match="between 1 and 100"):
        service.list(limit=0)
    with pytest.raises(ScenarioInvalidRequestError, match="between 1 and 100"):
        service.list(limit=101)


def test_workspace_isolation_delete_and_audit(
    solved_result: OptimizeResponse,
) -> None:
    repository = InMemoryScenarioRepository()
    service_a = _service(repository, solved=solved_result, workspace_id="site-a")
    service_b = _service(repository, solved=solved_result, workspace_id="site-b")
    record = service_a.create(
        ScenarioCreateRequest(name="Site A", request=_small_request())
    ).record

    with pytest.raises(ScenarioNotFoundError):
        service_b.get(record.id)
    with pytest.raises(ScenarioNotFoundError):
        service_b.delete(record.id)

    service_a.delete(record.id)
    with pytest.raises(ScenarioNotFoundError):
        service_a.get(record.id)
    with pytest.raises(ScenarioNotFoundError):
        service_a.delete(record.id)

    assert [event.action for event in repository.audit_events] == ["create", "delete"]
    assert repository.audit_events[-1].actor == "admin"
    assert repository.audit_events[-1].scenario_id == record.id
