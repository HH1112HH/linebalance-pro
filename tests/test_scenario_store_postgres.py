from __future__ import annotations

import os
import uuid
from datetime import UTC, datetime, timedelta

import pytest
from psycopg_pool import ConnectionPool

from backend.app.models import (
    LineConfig,
    Machine,
    Operation,
    OptimizeRequest,
    ScenarioCreateRequest,
    Worker,
)
from backend.app.scenario_service import ScenarioNotFoundError, ScenarioService
from backend.app.scenario_store import PostgresScenarioRepository

pytestmark = pytest.mark.postgres


def _small_request() -> OptimizeRequest:
    return OptimizeRequest(
        line_name="Postgres integration line",
        style_code="TEST-PG",
        config=LineConfig(
            shift_minutes=480,
            break_minutes=30,
            target_qty=60,
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


class _RedactedDatabaseUrl(str):
    """Str subclass that never renders the DSN (and its password) in pytest output."""

    def __repr__(self) -> str:
        return "'postgresql://<redacted>'"


@pytest.fixture(scope="module")
def database_url() -> str:
    url = os.getenv("TEST_DATABASE_URL", "").strip()
    if not url:
        pytest.skip("TEST_DATABASE_URL is not set; skipping PostgreSQL tests.")
    return _RedactedDatabaseUrl(url)


@pytest.fixture(scope="module")
def pool(database_url: str) -> ConnectionPool:
    with ConnectionPool(database_url, min_size=1, max_size=2, timeout=10) as pool:
        pool.wait(timeout=10)
        with pool.connection() as conn:
            exists = conn.execute(
                "SELECT to_regclass('public.scenarios') IS NOT NULL"
            ).fetchone()
        if not exists or not exists[0]:
            pytest.skip("Scenario schema is not migrated; run scripts/migrate.py.")
        yield pool


@pytest.fixture()
def workspace_id(pool: ConnectionPool) -> str:
    value = f"pytest-{uuid.uuid4().hex[:16]}"
    yield value
    with pool.connection() as conn, conn.transaction():
        conn.execute("DELETE FROM scenarios WHERE workspace_id = %s", (value,))
        conn.execute("DELETE FROM scenario_audit WHERE workspace_id = %s", (value,))


def test_postgres_create_replay_list_get_delete_and_audit(
    pool: ConnectionPool, workspace_id: str
) -> None:
    repo = PostgresScenarioRepository(pool)
    service = ScenarioService(
        repo,
        workspace_id=workspace_id,
        actor_label="pytest",
        clock=lambda: datetime(2026, 11, 8, 12, 0, tzinfo=UTC),
    )
    payload = ScenarioCreateRequest(name="PG round trip", request=_small_request())

    first = service.create(payload, idempotency_key="pytest-key-0001")
    assert first.created is True
    assert first.record.workspace_id == workspace_id
    assert first.record.request_bytes > 0
    assert first.record.result_bytes > 0

    second = service.create(payload, idempotency_key="pytest-key-0001")
    assert second.created is False
    assert second.record.id == first.record.id
    assert repo.count(workspace_id) == 1

    detail = service.get(first.record.id)
    assert detail.name == "PG round trip"
    assert detail.request == payload.request
    assert detail.result.status == first.record.status

    page = service.list(limit=10)
    assert [item.id for item in page.items] == [first.record.id]
    assert page.next_cursor is None

    service.delete(first.record.id)
    with pytest.raises(ScenarioNotFoundError):
        service.get(first.record.id)

    with pool.connection() as conn:
        audit_rows = conn.execute(
            "SELECT action, actor_label FROM scenario_audit "
            "WHERE workspace_id = %s ORDER BY id",
            (workspace_id,),
        ).fetchall()
    assert [(action, actor) for action, actor in audit_rows] == [
        ("create", "pytest"),
        ("delete", "pytest"),
    ]


def test_postgres_pagination_and_workspace_isolation(
    pool: ConnectionPool, workspace_id: str
) -> None:
    repo = PostgresScenarioRepository(pool)
    service = ScenarioService(repo, workspace_id=workspace_id)
    other = ScenarioService(repo, workspace_id=f"{workspace_id}-other")

    created = [
        service.create(
            ScenarioCreateRequest(name=f"PG page {index}", request=_small_request())
        ).record
        for index in range(3)
    ]
    first_page = service.list(limit=2)
    assert len(first_page.items) == 2
    assert first_page.next_cursor is not None
    second_page = service.list(limit=2, cursor=first_page.next_cursor)
    assert len(second_page.items) == 1
    assert {item.id for item in first_page.items}.isdisjoint(
        {item.id for item in second_page.items}
    )
    assert {item.id for item in first_page.items + second_page.items} == {
        record.id for record in created
    }
    with pytest.raises(ScenarioNotFoundError):
        other.get(created[0].id)


class _StepClock:
    def __init__(self) -> None:
        self._current = datetime(2026, 11, 9, 2, 30, tzinfo=UTC)

    def __call__(self) -> datetime:
        value = self._current
        self._current = value + timedelta(seconds=1)
        return value


def test_postgres_timestamps_round_trip_with_non_utc_session(
    database_url: str,
) -> None:
    """Neon runs in a non-UTC region; timestamptz must still surface as UTC."""

    workspace_id = f"pytest-tz-{uuid.uuid4().hex[:16]}"
    options = "-c timezone=America/New_York"
    with ConnectionPool(
        database_url,
        min_size=1,
        max_size=2,
        timeout=10,
        kwargs={"options": options},
    ) as pool:
        pool.wait(timeout=10)
        with pool.connection() as conn:
            session_tz = conn.execute("SHOW TimeZone").fetchone()[0]
        assert session_tz == "America/New_York"

        try:
            repo = PostgresScenarioRepository(pool)
            service = ScenarioService(
                repo, workspace_id=workspace_id, clock=_StepClock()
            )
            created = [
                service.create(
                    ScenarioCreateRequest(
                        name=f"TZ page {index}", request=_small_request()
                    )
                ).record
                for index in range(3)
            ]

            assert [record.created_at for record in created] == [
                "2026-11-09T02:30:00.000000+00:00",
                "2026-11-09T02:30:01.000000+00:00",
                "2026-11-09T02:30:02.000000+00:00",
            ]
            assert service.get(created[0].id).created_at == created[0].created_at

            first_page = service.list(limit=2)
            second_page = service.list(limit=2, cursor=first_page.next_cursor)
            assert [item.created_at for item in first_page.items] == [
                "2026-11-09T02:30:02.000000+00:00",
                "2026-11-09T02:30:01.000000+00:00",
            ]
            assert second_page.next_cursor is None
            assert [item.created_at for item in second_page.items] == [
                "2026-11-09T02:30:00.000000+00:00"
            ]

            with pool.connection() as conn:
                local = conn.execute(
                    "SELECT created_at::text FROM scenarios WHERE id = %s",
                    (created[0].id,),
                ).fetchone()
            assert local is not None
            assert "2026-11-08 21:30:00-05" in local[0]
        finally:
            with pool.connection() as conn, conn.transaction():
                conn.execute(
                    "DELETE FROM scenarios WHERE workspace_id = %s", (workspace_id,)
                )
                conn.execute(
                    "DELETE FROM scenario_audit WHERE workspace_id = %s",
                    (workspace_id,),
                )
