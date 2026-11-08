from __future__ import annotations

import threading
from dataclasses import dataclass, field
from datetime import UTC, datetime
from typing import Any, Literal, Protocol, cast

import psycopg
from psycopg.rows import dict_row
from psycopg.types.json import Jsonb
from psycopg_pool import ConnectionPool

from .models import OptimizeRequest, OptimizeResponse

StoredScenarioStatus = Literal["OPTIMAL", "FEASIBLE_LIMIT"]
ScenarioResultOrigin = Literal["server-solve"]
ScenarioAuditAction = Literal["create", "delete"]


@dataclass(frozen=True, slots=True)
class ScenarioRecord:
    """Storage-neutral scenario row.

    The Postgres repository will map this record to the columns in
    ``backend/migrations/001_scenarios.sql``. Keeping the solver models on the
    record avoids serializing twice in the DB-free layer.
    """

    id: str
    workspace_id: str
    name: str
    created_at: str
    status: StoredScenarioStatus
    solver_status: str
    line_name: str
    style_code: str
    workers_used: int
    stations_used: int
    balance_efficiency_pct: float
    model_version: str
    data_version: str
    result_origin: ScenarioResultOrigin
    schema_version: int
    data_policy: str
    solver_version: str
    app_version: str
    request_bytes: int
    result_bytes: int
    input_hash: str
    idempotency_key: str | None
    request: OptimizeRequest
    result: OptimizeResponse


@dataclass(frozen=True, slots=True)
class ScenarioAuditEvent:
    scenario_id: str
    workspace_id: str
    action: ScenarioAuditAction
    actor: str
    created_at: str


class ScenarioStoreConflict(Exception):
    """Raised when a unique idempotency key is inserted twice."""


class ScenarioRepository(Protocol):
    """Persistence port; implemented by a fake store now and Postgres later."""

    def count(self, workspace_id: str) -> int: ...

    def find_by_idempotency(
        self, workspace_id: str, idempotency_key: str
    ) -> ScenarioRecord | None: ...

    def create(self, record: ScenarioRecord, *, actor: str) -> None: ...

    def list_page(
        self,
        workspace_id: str,
        *,
        before: tuple[str, str] | None,
        limit: int,
    ) -> list[ScenarioRecord]: ...

    def get(self, workspace_id: str, scenario_id: str) -> ScenarioRecord | None: ...

    def delete(
        self,
        workspace_id: str,
        scenario_id: str,
        *,
        actor: str,
        deleted_at: str,
    ) -> bool: ...


@dataclass
class InMemoryScenarioRepository:
    """Thread-safe fake repository for unit tests and local wiring.

    It is intentionally not exposed by an API route: process memory is not a
    persistence guarantee and must not be presented as PostgreSQL storage.
    """

    _records: dict[str, ScenarioRecord] = field(default_factory=dict)
    _idempotency: dict[tuple[str, str], str] = field(default_factory=dict)
    _audit: list[ScenarioAuditEvent] = field(default_factory=list)
    _lock: threading.RLock = field(default_factory=threading.RLock)

    @property
    def audit_events(self) -> list[ScenarioAuditEvent]:
        with self._lock:
            return list(self._audit)

    def count(self, workspace_id: str) -> int:
        with self._lock:
            return sum(
                record.workspace_id == workspace_id for record in self._records.values()
            )

    def find_by_idempotency(
        self, workspace_id: str, idempotency_key: str
    ) -> ScenarioRecord | None:
        with self._lock:
            scenario_id = self._idempotency.get((workspace_id, idempotency_key))
            return self._records.get(scenario_id) if scenario_id else None

    def create(self, record: ScenarioRecord, *, actor: str) -> None:
        with self._lock:
            key = (
                (record.workspace_id, record.idempotency_key)
                if record.idempotency_key
                else None
            )
            if key is not None and key in self._idempotency:
                raise ScenarioStoreConflict(
                    "Idempotency key already exists in this workspace."
                )
            self._records[record.id] = record
            if key is not None:
                self._idempotency[key] = record.id
            self._audit.append(
                ScenarioAuditEvent(
                    scenario_id=record.id,
                    workspace_id=record.workspace_id,
                    action="create",
                    actor=actor,
                    created_at=record.created_at,
                )
            )

    def list_page(
        self,
        workspace_id: str,
        *,
        before: tuple[str, str] | None,
        limit: int,
    ) -> list[ScenarioRecord]:
        with self._lock:
            records = [
                record
                for record in self._records.values()
                if record.workspace_id == workspace_id
                and (before is None or (record.created_at, record.id) < before)
            ]
        records.sort(key=lambda record: (record.created_at, record.id), reverse=True)
        return records[:limit]

    def get(self, workspace_id: str, scenario_id: str) -> ScenarioRecord | None:
        with self._lock:
            record = self._records.get(scenario_id)
            if record is None or record.workspace_id != workspace_id:
                return None
            return record

    def delete(
        self,
        workspace_id: str,
        scenario_id: str,
        *,
        actor: str,
        deleted_at: str,
    ) -> bool:
        with self._lock:
            record = self._records.get(scenario_id)
            if record is None or record.workspace_id != workspace_id:
                return False
            del self._records[scenario_id]
            if record.idempotency_key:
                self._idempotency.pop((workspace_id, record.idempotency_key), None)
            self._audit.append(
                ScenarioAuditEvent(
                    scenario_id=scenario_id,
                    workspace_id=workspace_id,
                    action="delete",
                    actor=actor,
                    created_at=deleted_at,
                )
            )
            return True


SCENARIO_COLUMNS = """
    id, workspace_id, name, created_at, status, solver_status, line_name,
    style_code, workers_used, stations_used, balance_efficiency_pct,
    model_version, data_version, result_origin, schema_version, data_policy,
    solver_version, app_version, request_bytes, result_bytes, input_hash,
    idempotency_key, request_json, result_json
"""

INSERT_SCENARIO_SQL = """
INSERT INTO scenarios (
    id, workspace_id, name, line_name, style_code, data_policy, status,
    solver_status, solver_version, model_version, app_version, data_version,
    input_hash, workers_used, stations_used, balance_efficiency_pct,
    result_origin, schema_version, request_json, result_json, request_bytes,
    result_bytes, idempotency_key, created_at
) VALUES (
    %(id)s, %(workspace_id)s, %(name)s, %(line_name)s, %(style_code)s,
    %(data_policy)s, %(status)s, %(solver_status)s, %(solver_version)s,
    %(model_version)s, %(app_version)s, %(data_version)s, %(input_hash)s,
    %(workers_used)s, %(stations_used)s, %(balance_efficiency_pct)s,
    %(result_origin)s, %(schema_version)s, %(request_json)s, %(result_json)s,
    %(request_bytes)s, %(result_bytes)s, %(idempotency_key)s, %(created_at)s
)
"""


def _as_datetime(value: str) -> datetime:
    return datetime.fromisoformat(value).astimezone(UTC)


def _as_timestamp(value: datetime) -> str:
    return value.astimezone(UTC).isoformat(timespec="microseconds")


def _audit_detail(record: ScenarioRecord) -> Jsonb:
    return Jsonb(
        {
            "name": record.name,
            "status": record.status,
            "input_hash": record.input_hash,
        }
    )


class PostgresScenarioRepository:
    """PostgreSQL adapter for the scenario persistence port.

    The pool is injected so the app can keep connections lazy and tests can use
    a disposable pool. All SQL is parameterized; no workspace filter is optional.
    """

    def __init__(self, pool: ConnectionPool[Any]) -> None:
        self._pool = pool

    def count(self, workspace_id: str) -> int:
        with self._pool.connection() as conn:
            row = conn.execute(
                "SELECT count(*) FROM scenarios WHERE workspace_id = %s",
                (workspace_id,),
            ).fetchone()
        return int(row[0]) if row else 0

    def find_by_idempotency(
        self, workspace_id: str, idempotency_key: str
    ) -> ScenarioRecord | None:
        with self._pool.connection() as conn, conn.cursor(row_factory=dict_row) as cur:
            cur.execute(
                f"SELECT {SCENARIO_COLUMNS} FROM scenarios "
                "WHERE workspace_id = %s AND idempotency_key = %s",
                (workspace_id, idempotency_key),
            )
            row = cur.fetchone()
        return self._row_to_record(row) if row else None

    def create(self, record: ScenarioRecord, *, actor: str) -> None:
        params = {
            "id": record.id,
            "workspace_id": record.workspace_id,
            "name": record.name,
            "line_name": record.line_name,
            "style_code": record.style_code,
            "data_policy": record.data_policy,
            "status": record.status,
            "solver_status": record.solver_status,
            "solver_version": record.solver_version,
            "model_version": record.model_version,
            "app_version": record.app_version,
            "data_version": record.data_version,
            "input_hash": record.input_hash,
            "workers_used": record.workers_used,
            "stations_used": record.stations_used,
            "balance_efficiency_pct": record.balance_efficiency_pct,
            "result_origin": record.result_origin,
            "schema_version": record.schema_version,
            "request_json": Jsonb(record.request.model_dump(mode="json")),
            "result_json": Jsonb(record.result.model_dump(mode="json")),
            "request_bytes": record.request_bytes,
            "result_bytes": record.result_bytes,
            "idempotency_key": record.idempotency_key,
            "created_at": _as_datetime(record.created_at),
        }
        with self._pool.connection() as conn, conn.transaction():
            try:
                conn.execute(INSERT_SCENARIO_SQL, params)
            except psycopg.errors.UniqueViolation as exc:
                raise ScenarioStoreConflict(
                    "Idempotency key already exists in this workspace."
                ) from exc
            conn.execute(
                """
                INSERT INTO scenario_audit (
                    scenario_id, workspace_id, action, actor_label, detail,
                    created_at
                ) VALUES (%s, %s, 'create', %s, %s, %s)
                """,
                (
                    record.id,
                    record.workspace_id,
                    actor,
                    _audit_detail(record),
                    _as_datetime(record.created_at),
                ),
            )

    def list_page(
        self,
        workspace_id: str,
        *,
        before: tuple[str, str] | None,
        limit: int,
    ) -> list[ScenarioRecord]:
        where = "workspace_id = %s"
        params: list[Any] = [workspace_id]
        if before is not None:
            where += " AND (created_at, id) < (%s::timestamptz, %s::uuid)"
            params.extend([before[0], before[1]])
        params.append(limit)
        sql = (
            f"SELECT {SCENARIO_COLUMNS} FROM scenarios "
            f"WHERE {where} ORDER BY created_at DESC, id DESC LIMIT %s"
        )
        with self._pool.connection() as conn, conn.cursor(row_factory=dict_row) as cur:
            cur.execute(sql, params)
            rows = cur.fetchall()
        return [self._row_to_record(row) for row in rows]

    def get(self, workspace_id: str, scenario_id: str) -> ScenarioRecord | None:
        with self._pool.connection() as conn, conn.cursor(row_factory=dict_row) as cur:
            cur.execute(
                f"SELECT {SCENARIO_COLUMNS} FROM scenarios "
                "WHERE workspace_id = %s AND id = %s",
                (workspace_id, scenario_id),
            )
            row = cur.fetchone()
        return self._row_to_record(row) if row else None

    def delete(
        self,
        workspace_id: str,
        scenario_id: str,
        *,
        actor: str,
        deleted_at: str,
    ) -> bool:
        with self._pool.connection() as conn, conn.transaction():
            row = conn.execute(
                """
                DELETE FROM scenarios
                WHERE workspace_id = %s AND id = %s
                RETURNING name, status, input_hash
                """,
                (workspace_id, scenario_id),
            ).fetchone()
            if row is None:
                return False
            name, status, input_hash = row
            conn.execute(
                """
                INSERT INTO scenario_audit (
                    scenario_id, workspace_id, action, actor_label, detail,
                    created_at
                ) VALUES (%s, %s, 'delete', %s, %s, %s)
                """,
                (
                    scenario_id,
                    workspace_id,
                    actor,
                    Jsonb(
                        {
                            "name": name,
                            "status": status,
                            "input_hash": input_hash,
                        }
                    ),
                    _as_datetime(deleted_at),
                ),
            )
            return True

    @staticmethod
    def _row_to_record(row: dict[str, Any]) -> ScenarioRecord:
        return ScenarioRecord(
            id=str(row["id"]),
            workspace_id=str(row["workspace_id"]),
            name=str(row["name"]),
            created_at=_as_timestamp(row["created_at"]),
            status=cast(StoredScenarioStatus, row["status"]),
            solver_status=str(row["solver_status"]),
            line_name=str(row["line_name"]),
            style_code=str(row["style_code"]),
            workers_used=int(row["workers_used"]),
            stations_used=int(row["stations_used"]),
            balance_efficiency_pct=float(row["balance_efficiency_pct"]),
            model_version=str(row["model_version"]),
            data_version=str(row["data_version"]),
            result_origin=cast(ScenarioResultOrigin, row["result_origin"]),
            schema_version=int(row["schema_version"]),
            data_policy=str(row["data_policy"]),
            solver_version=str(row["solver_version"]),
            app_version=str(row["app_version"]),
            request_bytes=int(row["request_bytes"]),
            result_bytes=int(row["result_bytes"]),
            input_hash=str(row["input_hash"]),
            idempotency_key=row["idempotency_key"],
            request=OptimizeRequest.model_validate(row["request_json"]),
            result=OptimizeResponse.model_validate(row["result_json"]),
        )
