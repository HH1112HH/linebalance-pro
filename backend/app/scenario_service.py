from __future__ import annotations

import base64
import binascii
import re
import uuid
from collections.abc import Callable
from dataclasses import dataclass
from datetime import UTC, datetime
from typing import cast

from .models import (
    OptimizeRequest,
    OptimizeResponse,
    ScenarioCreateRequest,
    ScenarioDetail,
    ScenarioListResponse,
    ScenarioSummary,
)
from .optimizer import _input_hash, solve_line_balancing
from .scenario_store import (
    ScenarioRecord,
    ScenarioRepository,
    ScenarioResultOrigin,
    ScenarioStoreConflict,
    StoredScenarioStatus,
)
from .validation import validate_request
from .version import DATA_POLICY

STORED_STATUSES: frozenset[str] = frozenset({"OPTIMAL", "FEASIBLE_LIMIT"})
MAX_SCENARIO_NAME_LENGTH = 120
IDEMPOTENCY_KEY_PATTERN = re.compile(r"^[A-Za-z0-9._:-]{8,64}$")
DEFAULT_MAX_PER_WORKSPACE = 200
DEFAULT_MAX_PAYLOAD_BYTES = 1_500_000
DEFAULT_LIST_LIMIT = 50
MAX_LIST_LIMIT = 100
SCHEMA_VERSION = 1
RESULT_ORIGIN: ScenarioResultOrigin = "server-solve"

Solver = Callable[[OptimizeRequest], OptimizeResponse]
Clock = Callable[[], datetime]


def _utc_now() -> datetime:
    return datetime.now(UTC)


def _is_uuid(value: str) -> bool:
    try:
        uuid.UUID(value)
    except ValueError:
        return False
    return True


class ScenarioError(Exception):
    status_code = 500

    def __init__(self, detail: str) -> None:
        super().__init__(detail)
        self.detail = detail


class ScenarioInvalidRequestError(ScenarioError):
    status_code = 400


class ScenarioNotFoundError(ScenarioError):
    status_code = 404

    def __init__(self) -> None:
        super().__init__("Scenario not found.")


class ScenarioConflictError(ScenarioError):
    status_code = 409


class ScenarioQuotaExceededError(ScenarioError):
    status_code = 409


class ScenarioPayloadTooLargeError(ScenarioError):
    status_code = 413


class ScenarioInvalidDataError(ScenarioError):
    status_code = 422


class ScenarioSolveError(ScenarioError):
    status_code = 422


class ScenarioSolverMetadataError(ScenarioError):
    status_code = 500


@dataclass(frozen=True, slots=True)
class ScenarioCreateOutcome:
    record: ScenarioRecord
    created: bool


def encode_cursor(record: ScenarioRecord) -> str:
    raw = f"{record.created_at}|{record.id}".encode()
    return base64.urlsafe_b64encode(raw).decode("ascii").rstrip("=")


def decode_cursor(cursor: str) -> tuple[str, str]:
    if not cursor or len(cursor) > 400:
        raise ScenarioInvalidRequestError("Invalid scenario cursor.")
    try:
        padded = cursor + "=" * (-len(cursor) % 4)
        raw = base64.urlsafe_b64decode(padded.encode("ascii")).decode("utf-8")
    except (ValueError, UnicodeDecodeError, binascii.Error) as exc:
        raise ScenarioInvalidRequestError("Invalid scenario cursor.") from exc
    created_at, separator, scenario_id = raw.rpartition("|")
    if not separator or not created_at or not scenario_id:
        raise ScenarioInvalidRequestError("Invalid scenario cursor.")
    try:
        timestamp = datetime.fromisoformat(created_at)
    except ValueError as exc:
        raise ScenarioInvalidRequestError("Invalid scenario cursor.") from exc
    if timestamp.tzinfo is None:
        raise ScenarioInvalidRequestError("Invalid scenario cursor.")
    try:
        uuid.UUID(scenario_id)
    except ValueError as exc:
        raise ScenarioInvalidRequestError("Invalid scenario cursor.") from exc
    return created_at, scenario_id


def _clean_idempotency_key(value: str | None) -> str | None:
    if value is None:
        return None
    cleaned = value.strip()
    if not cleaned:
        raise ScenarioInvalidRequestError("Idempotency-Key cannot be blank.")
    if not IDEMPOTENCY_KEY_PATTERN.fullmatch(cleaned):
        raise ScenarioInvalidRequestError(
            "Idempotency-Key must be 8-64 characters using A-Z, a-z, 0-9, "
            "dot, underscore, colon or hyphen."
        )
    return cleaned


class ScenarioService:
    """Validate, re-solve, summarize and persist scenarios through a port."""

    def __init__(
        self,
        repository: ScenarioRepository,
        *,
        workspace_id: str = "demo",
        actor_label: str = "admin",
        max_per_workspace: int = DEFAULT_MAX_PER_WORKSPACE,
        max_payload_bytes: int = DEFAULT_MAX_PAYLOAD_BYTES,
        solver: Solver = solve_line_balancing,
        clock: Clock = _utc_now,
    ) -> None:
        self._repository = repository
        self._workspace_id = workspace_id
        self._actor_label = actor_label
        self._max_per_workspace = max_per_workspace
        self._max_payload_bytes = max_payload_bytes
        self._solver = solver
        self._clock = clock

    def create(
        self,
        payload: ScenarioCreateRequest,
        *,
        idempotency_key: str | None = None,
    ) -> ScenarioCreateOutcome:
        key = _clean_idempotency_key(idempotency_key)
        encoded_payload = payload.model_dump_json().encode("utf-8")
        if len(encoded_payload) > self._max_payload_bytes:
            raise ScenarioPayloadTooLargeError(
                f"Scenario payload exceeds the {self._max_payload_bytes}-byte limit."
            )

        validation = validate_request(payload.request)
        if validation.errors:
            raise ScenarioInvalidDataError(
                "Scenario request is invalid: " + "; ".join(validation.errors)
            )

        input_hash = _input_hash(payload.request)
        if key:
            existing = self._repository.find_by_idempotency(self._workspace_id, key)
            if existing is not None:
                return self._replay(existing, input_hash)

        result = self._solver(payload.request)
        if result.status not in STORED_STATUSES:
            raise ScenarioSolveError(
                "Scenario was not saved because the solver status is "
                f"{result.status}. Only OPTIMAL or FEASIBLE_LIMIT results are stored."
            )
        metadata = result.metadata
        if metadata is None or metadata.input_hash != input_hash:
            raise ScenarioSolverMetadataError(
                "Solver metadata is missing or does not match the request input hash."
            )

        if self._repository.count(self._workspace_id) >= self._max_per_workspace:
            raise ScenarioQuotaExceededError(
                "Scenario quota reached for this workspace; delete an old scenario first."
            )

        created_at = self._clock().astimezone(UTC).isoformat(timespec="microseconds")
        record = self._build_record(
            payload=payload,
            result=result,
            input_hash=input_hash,
            idempotency_key=key,
            created_at=created_at,
            request_bytes=len(encoded_payload),
        )
        try:
            self._repository.create(record, actor=self._actor_label)
        except ScenarioStoreConflict:
            if key:
                existing = self._repository.find_by_idempotency(self._workspace_id, key)
                if existing is not None:
                    return self._replay(existing, input_hash)
            raise ScenarioConflictError(
                "Scenario could not be saved because of a concurrent write."
            ) from None
        return ScenarioCreateOutcome(record=record, created=True)

    def list(
        self, *, limit: int = DEFAULT_LIST_LIMIT, cursor: str | None = None
    ) -> ScenarioListResponse:
        if limit < 1 or limit > MAX_LIST_LIMIT:
            raise ScenarioInvalidRequestError(
                f"Scenario limit must be between 1 and {MAX_LIST_LIMIT}."
            )
        before = decode_cursor(cursor) if cursor else None
        records = self._repository.list_page(
            self._workspace_id, before=before, limit=limit + 1
        )
        page = records[:limit]
        next_cursor = encode_cursor(page[-1]) if len(records) > limit else None
        return ScenarioListResponse(
            items=[self._summary(record) for record in page],
            next_cursor=next_cursor,
        )

    def get(self, scenario_id: str) -> ScenarioDetail:
        if not _is_uuid(scenario_id):
            raise ScenarioNotFoundError()
        record = self._repository.get(self._workspace_id, scenario_id)
        if record is None:
            raise ScenarioNotFoundError()
        return self._detail(record)

    def delete(self, scenario_id: str) -> None:
        if not _is_uuid(scenario_id):
            raise ScenarioNotFoundError()
        deleted_at = self._clock().astimezone(UTC).isoformat(timespec="microseconds")
        deleted = self._repository.delete(
            self._workspace_id,
            scenario_id,
            actor=self._actor_label,
            deleted_at=deleted_at,
        )
        if not deleted:
            raise ScenarioNotFoundError()

    def to_detail(self, record: ScenarioRecord) -> ScenarioDetail:
        return self._detail(record)

    def _replay(
        self, existing: ScenarioRecord, input_hash: str
    ) -> ScenarioCreateOutcome:
        if existing.input_hash != input_hash:
            raise ScenarioConflictError(
                "Idempotency key was already used with a different request."
            )
        return ScenarioCreateOutcome(record=existing, created=False)

    def _build_record(
        self,
        *,
        payload: ScenarioCreateRequest,
        result: OptimizeResponse,
        input_hash: str,
        idempotency_key: str | None,
        created_at: str,
        request_bytes: int,
    ) -> ScenarioRecord:
        kpis = result.kpis
        metadata = result.metadata
        if metadata is None:
            raise ScenarioSolverMetadataError("Solver metadata is missing.")
        result_bytes = len(result.model_dump_json().encode("utf-8"))
        if result_bytes > self._max_payload_bytes:
            raise ScenarioPayloadTooLargeError(
                "Solver result exceeds the "
                f"{self._max_payload_bytes}-byte limit and was not stored."
            )
        return ScenarioRecord(
            id=str(uuid.uuid4()),
            workspace_id=self._workspace_id,
            name=payload.name,
            created_at=created_at,
            status=cast(StoredScenarioStatus, result.status),
            solver_status=result.solver_status,
            line_name=result.line_name,
            style_code=result.style_code,
            workers_used=kpis.workers_used if kpis else 0,
            stations_used=len(result.stations),
            balance_efficiency_pct=kpis.balance_efficiency_pct if kpis else 0.0,
            model_version=metadata.model_version,
            data_version=metadata.data_version,
            result_origin=RESULT_ORIGIN,
            schema_version=SCHEMA_VERSION,
            data_policy=DATA_POLICY,
            solver_version=metadata.solver_version,
            app_version=metadata.app_version,
            request_bytes=request_bytes,
            result_bytes=result_bytes,
            input_hash=input_hash,
            idempotency_key=idempotency_key,
            request=payload.request,
            result=result,
        )

    @staticmethod
    def _summary(record: ScenarioRecord) -> ScenarioSummary:
        return ScenarioSummary(
            id=record.id,
            name=record.name,
            created_at=record.created_at,
            status=record.status,
            solver_status=record.solver_status,
            line_name=record.line_name,
            style_code=record.style_code,
            workers_used=record.workers_used,
            stations_used=record.stations_used,
            balance_efficiency_pct=record.balance_efficiency_pct,
            model_version=record.model_version,
            data_version=record.data_version,
        )

    @classmethod
    def _detail(cls, record: ScenarioRecord) -> ScenarioDetail:
        return ScenarioDetail(
            **cls._summary(record).model_dump(),
            result_origin=record.result_origin,
            schema_version=record.schema_version,
            request=record.request,
            result=record.result,
        )


__all__ = [
    "DEFAULT_LIST_LIMIT",
    "DEFAULT_MAX_PAYLOAD_BYTES",
    "DEFAULT_MAX_PER_WORKSPACE",
    "MAX_LIST_LIMIT",
    "SCHEMA_VERSION",
    "STORED_STATUSES",
    "ScenarioConflictError",
    "ScenarioCreateOutcome",
    "ScenarioError",
    "ScenarioInvalidDataError",
    "ScenarioInvalidRequestError",
    "ScenarioNotFoundError",
    "ScenarioPayloadTooLargeError",
    "ScenarioQuotaExceededError",
    "ScenarioService",
    "ScenarioSolveError",
    "ScenarioSolverMetadataError",
    "decode_cursor",
    "encode_cursor",
]
