from __future__ import annotations

import csv
import heapq
import io
import math
import re
from dataclasses import dataclass

from pydantic import ValidationError

from .models import (
    Machine,
    Operation,
    ScenarioImportCounts,
    ScenarioImportPreview,
    ScenarioImportRequest,
    Worker,
)
from .version import DATA_POLICY

OPERATION_COLUMNS = (
    "operation_id",
    "operation_name",
    "sam_sec",
    "predecessor_ids",
    "machine_type",
    "skill_code",
    "skill_required",
    "is_quality_gate",
    "sequence",
)
WORKER_COLUMNS = ("worker_id", "worker_name")
WORKER_OPTIONAL_COLUMNS = ("available", "worker_status", "machine_types")
SKILL_COLUMNS = ("worker_id", "operation_id", "skill_grade")
MACHINE_COLUMNS = ("machine_id", "machine_type", "available", "capacity")

MAX_OPERATIONS = 200
MAX_WORKERS = 100
MAX_SKILL_ROWS = 10_000
MAX_MACHINES = 200

MANUAL_MACHINE_CODES = {"", "MANUAL", "NONE"}
TRUE_VALUES = {"TRUE", "1", "YES", "Y"}
FALSE_VALUES = {"FALSE", "0", "NO", "N"}
GRADE_VALUES = {"A": 3, "B": 2, "C": 1, "NONE": 0}
LIST_SPLIT = re.compile(r"[|;,]")


class ScenarioImportError(ValueError):
    """Actionable validation error for a scenario master-data import."""


@dataclass(frozen=True)
class _Row:
    number: int
    values: dict[str, str]

    def get(self, name: str) -> str:
        return self.values.get(name, "")


def parse_scenario_bundle(request: ScenarioImportRequest) -> ScenarioImportPreview:
    """Parse, normalize and cross-check the core scenario CSV files.

    The function is pure: it receives CSV text and returns validated models.
    It does not persist anything and it does not run the optimizer. Business
    eligibility is still enforced by the normal solver validation after the
    preview is applied, so this layer only guarantees a structurally coherent
    scenario.
    """
    operations, line_name, style_code = _parse_operations(request.operations_csv)
    workers = _parse_workers(request.workers_csv)
    workers = _attach_skills(workers, request.worker_skills_csv, operations)
    machines = _parse_machines(request.machines_csv)

    _check_machine_coverage(operations, machines)
    precedence_layers = _precedence_layers(operations)
    machine_types = sorted(
        {operation.machine_type for operation in operations if operation.machine_type}
    )

    return ScenarioImportPreview(
        line_name=line_name,
        style_code=style_code,
        operations=operations,
        workers=workers,
        machines=machines,
        counts=ScenarioImportCounts(
            operations=len(operations),
            workers=len(workers),
            skill_assignments=sum(len(worker.skills) for worker in workers),
            machines=len(machines),
            precedence_layers=precedence_layers,
            machine_types=machine_types,
        ),
        data_policy=DATA_POLICY,
    )


def _read_rows(
    text: str,
    label: str,
    required: tuple[str, ...],
    max_rows: int,
) -> list[_Row]:
    if "\ufffd" in text:
        raise ScenarioImportError(f"{label} CSV must be UTF-8 encoded.")
    cleaned = text.lstrip("\ufeff")
    if not cleaned.strip():
        raise ScenarioImportError(f"{label} CSV is empty.")

    reader = csv.DictReader(io.StringIO(cleaned))
    original_headers = reader.fieldnames or []
    headers = [(header or "").strip() for header in original_headers]
    if not headers or any(not header for header in headers):
        raise ScenarioImportError(f"{label} CSV has an empty header name.")
    duplicates = sorted({header for header in headers if headers.count(header) > 1})
    if duplicates:
        raise ScenarioImportError(
            f"{label} CSV has duplicate columns: " + ", ".join(duplicates) + "."
        )
    reader.fieldnames = headers

    missing = [column for column in required if column not in headers]
    if missing:
        raise ScenarioImportError(
            f"{label} CSV is missing columns: " + ", ".join(missing) + "."
        )

    rows: list[_Row] = []
    for index, row in enumerate(reader, start=2):
        values = {
            (key or "").strip(): (value or "").strip()
            for key, value in row.items()
            if key is not None
        }
        if not any(values.values()):
            continue
        rows.append(_Row(index, values))
    if not rows:
        raise ScenarioImportError(f"{label} CSV has no data rows.")
    if len(rows) > max_rows:
        raise ScenarioImportError(
            f"{label} CSV has {len(rows):,} data rows; the limit is {max_rows:,}."
        )
    _check_policy(rows, label, headers)
    return rows


def _check_policy(rows: list[_Row], label: str, headers: list[str]) -> None:
    if "data_policy" not in headers:
        return
    for row in rows:
        policy = row.get("data_policy")
        if policy and policy.upper() != "SYNTHETIC":
            raise ScenarioImportError(
                f"[{label}] Row {row.number}: data_policy must be SYNTHETIC "
                "for demo imports."
            )


def _parse_operations(
    text: str,
) -> tuple[list[Operation], str | None, str | None]:
    rows = _read_rows(text, "operations", OPERATION_COLUMNS, MAX_OPERATIONS)
    operations: list[Operation] = []
    seen: set[str] = set()
    line_names: set[str] = set()
    style_codes: set[str] = set()

    for index, row in enumerate(rows, start=1):
        operation_id = _clean_id(row.get("operation_id"))
        if not operation_id:
            raise ScenarioImportError(
                f"[operations] Row {row.number}: operation_id is required."
            )
        if operation_id in seen:
            raise ScenarioImportError(
                f"[operations] Row {row.number}: duplicate operation_id {operation_id}."
            )
        seen.add(operation_id)

        name = row.get("operation_name")
        if not name:
            raise ScenarioImportError(
                f"[operations] Row {row.number}: operation_name is required."
            )

        sequence_raw = row.get("sequence")
        sequence = (
            _parse_int(sequence_raw, "operations", row, "sequence", 0, 100_000)
            if sequence_raw
            else index * 10
        )

        predecessors = _split_list(row.get("predecessor_ids"))
        operation = _build_operation(
            row,
            operation_id=operation_id,
            name=name,
            sequence=sequence,
            predecessors=predecessors,
        )
        operations.append(operation)

        line_name = row.get("line_name")
        if line_name:
            line_names.add(line_name)
        style_code = row.get("style_code")
        if style_code:
            style_codes.add(style_code)

    if len(line_names) > 1:
        raise ScenarioImportError(
            "[operations] line_name must be consistent across rows: "
            + ", ".join(sorted(line_names))
            + "."
        )
    if len(style_codes) > 1:
        raise ScenarioImportError(
            "[operations] style_code must be consistent across rows: "
            + ", ".join(sorted(style_codes))
            + "."
        )

    _check_predecessors(operations)
    return (
        operations,
        next(iter(line_names), None),
        next(iter(style_codes), None),
    )


def _build_operation(
    row: _Row,
    *,
    operation_id: str,
    name: str,
    sequence: int,
    predecessors: list[str],
) -> Operation:
    sam_sec = _parse_float(
        row.get("sam_sec"), "operations", row, "sam_sec", 0.000001, 3600
    )
    skill_code = row.get("skill_code").upper() or "SEWING"
    skill_required = _parse_int(
        row.get("skill_required"), "operations", row, "skill_required", 0, 3
    )
    is_quality_gate = _parse_bool(
        row.get("is_quality_gate") or "false",
        "operations",
        row,
        "is_quality_gate",
    )
    machine_type = row.get("machine_type").upper()
    try:
        return Operation(
            id=operation_id,
            name=name,
            sam_sec=sam_sec,
            predecessors=predecessors,
            machine_type=None if machine_type in MANUAL_MACHINE_CODES else machine_type,
            skill_code=skill_code,
            skill_required=skill_required,
            is_quality_gate=is_quality_gate,
            sequence=sequence,
        )
    except ValidationError as exc:
        raise ScenarioImportError(
            _validation_message("operations", row.number, exc)
        ) from exc


def _check_predecessors(operations: list[Operation]) -> None:
    valid_ids = {operation.id for operation in operations}
    for operation in operations:
        for predecessor in operation.predecessors:
            if predecessor == operation.id:
                raise ScenarioImportError(
                    f"[operations] {operation.id} cannot be its own predecessor."
                )
            if predecessor not in valid_ids:
                raise ScenarioImportError(
                    f"[operations] {operation.id} references missing predecessor "
                    f"{predecessor}."
                )


def _precedence_layers(operations: list[Operation]) -> int:
    operation_by_id = {operation.id: operation for operation in operations}
    children: dict[str, list[str]] = {operation.id: [] for operation in operations}
    indegree = dict.fromkeys(children, 0)
    for operation in operations:
        for predecessor in operation.predecessors:
            children[predecessor].append(operation.id)
            indegree[operation.id] += 1

    heap = [
        (operation_by_id[operation_id].sequence or 0, operation_id)
        for operation_id in children
        if indegree[operation_id] == 0
    ]
    heapq.heapify(heap)
    layers = dict.fromkeys(children, 1)
    visited = 0
    while heap:
        _, node = heapq.heappop(heap)
        visited += 1
        for child in children[node]:
            layers[child] = max(layers[child], layers[node] + 1)
            indegree[child] -= 1
            if indegree[child] == 0:
                heapq.heappush(heap, (operation_by_id[child].sequence or 0, child))

    if visited != len(operations):
        cycle = sorted(
            operation_id for operation_id, degree in indegree.items() if degree > 0
        )
        raise ScenarioImportError(
            "[operations] Precedence cycle detected among: " + ", ".join(cycle) + "."
        )
    return max(layers.values(), default=0)


def _parse_workers(text: str) -> list[Worker]:
    rows = _read_rows(text, "workers", WORKER_COLUMNS, MAX_WORKERS)
    if "efficiency_factor" in rows[0].values:
        raise ScenarioImportError(
            "[workers] Column efficiency_factor is not supported. "
            "Worker-specific performance is not part of this import; remove the "
            "column and use approved SAM per operation instead."
        )

    workers: list[Worker] = []
    seen: set[str] = set()
    for row in rows:
        worker_id = _clean_id(row.get("worker_id"))
        if not worker_id:
            raise ScenarioImportError(
                f"[workers] Row {row.number}: worker_id is required."
            )
        if worker_id in seen:
            raise ScenarioImportError(
                f"[workers] Row {row.number}: duplicate worker_id {worker_id}."
            )
        seen.add(worker_id)

        name = row.get("worker_name")
        if not name:
            raise ScenarioImportError(
                f"[workers] Row {row.number}: worker_name is required."
            )
        available = _parse_bool(
            row.get("available") or "true", "workers", row, "available"
        )
        status = row.get("worker_status") or ("ACTIVE" if available else "ABSENT")
        machine_types = _split_list(row.get("machine_types"))
        try:
            workers.append(
                Worker(
                    id=worker_id,
                    name=name,
                    machine_types=machine_types,
                    available=available,
                    worker_status=status,
                )
            )
        except ValidationError as exc:
            raise ScenarioImportError(
                _validation_message("workers", row.number, exc)
            ) from exc
    return workers


def _attach_skills(
    workers: list[Worker],
    text: str,
    operations: list[Operation],
) -> list[Worker]:
    rows = _read_rows(text, "worker_skills", SKILL_COLUMNS, MAX_SKILL_ROWS)
    worker_ids = {worker.id for worker in workers}
    operation_ids = {operation.id for operation in operations}
    skills_by_worker: dict[str, dict[str, int]] = {}

    for row in rows:
        worker_id = _clean_id(row.get("worker_id"))
        operation_id = _clean_id(row.get("operation_id"))
        if worker_id not in worker_ids:
            raise ScenarioImportError(
                f"[worker_skills] Row {row.number}: unknown worker_id {worker_id}."
            )
        if operation_id not in operation_ids:
            raise ScenarioImportError(
                f"[worker_skills] Row {row.number}: unknown operation_id "
                f"{operation_id}."
            )
        grade = _parse_grade(row)
        worker_skills = skills_by_worker.setdefault(worker_id, {})
        existing = worker_skills.get(operation_id)
        if existing is not None and existing != grade:
            raise ScenarioImportError(
                f"[worker_skills] Row {row.number}: {worker_id} / {operation_id} "
                f"has conflicting grades {existing} and {grade}."
            )
        worker_skills[operation_id] = grade

    for worker in workers:
        if worker.id in skills_by_worker:
            worker.skills = skills_by_worker[worker.id]
    return workers


def _parse_grade(row: _Row) -> int:
    raw = row.get("skill_grade").upper()
    if not raw:
        raise ScenarioImportError(
            f"[worker_skills] Row {row.number}: skill_grade is required."
        )
    if raw in GRADE_VALUES:
        return GRADE_VALUES[raw]
    try:
        numeric = int(float(raw))
    except ValueError as exc:
        raise ScenarioImportError(
            f"[worker_skills] Row {row.number}: skill_grade must be A, B, C, "
            "NONE or 0..3."
        ) from exc
    if numeric < 0 or numeric > 3:
        raise ScenarioImportError(
            f"[worker_skills] Row {row.number}: skill_grade must be 0..3."
        )
    return numeric


def _parse_machines(text: str) -> list[Machine]:
    if not text.strip():
        return []
    rows = _read_rows(text, "machines", MACHINE_COLUMNS, MAX_MACHINES)
    machines: list[Machine] = []
    seen: set[str] = set()
    for row in rows:
        machine_id = _clean_id(row.get("machine_id"))
        if not machine_id:
            raise ScenarioImportError(
                f"[machines] Row {row.number}: machine_id is required."
            )
        if machine_id in seen:
            raise ScenarioImportError(
                f"[machines] Row {row.number}: duplicate machine_id {machine_id}."
            )
        seen.add(machine_id)

        machine_type = row.get("machine_type").upper()
        if not machine_type or machine_type in MANUAL_MACHINE_CODES:
            raise ScenarioImportError(
                f"[machines] Row {row.number}: machine_type must be a real "
                "machine type, not MANUAL/NONE."
            )
        available = _parse_bool(
            row.get("available") or "true", "machines", row, "available"
        )
        capacity = _parse_int(
            row.get("capacity") or "1", "machines", row, "capacity", 1, 100
        )
        try:
            machines.append(
                Machine(
                    id=machine_id,
                    machine_type=machine_type,
                    available=available,
                    capacity=capacity,
                )
            )
        except ValidationError as exc:
            raise ScenarioImportError(
                _validation_message("machines", row.number, exc)
            ) from exc
    return machines


def _check_machine_coverage(
    operations: list[Operation],
    machines: list[Machine],
) -> None:
    available_capacity: dict[str, int] = {}
    for machine in machines:
        if not machine.available:
            continue
        available_capacity[machine.machine_type] = (
            available_capacity.get(machine.machine_type, 0) + machine.capacity
        )
    required_types = sorted(
        {operation.machine_type for operation in operations if operation.machine_type}
    )
    missing = [
        machine_type
        for machine_type in required_types
        if available_capacity.get(machine_type, 0) < 1
    ]
    if missing:
        raise ScenarioImportError(
            "[operations] No available machine for machine type(s): "
            + ", ".join(missing)
            + ". Add a machine row or mark one available."
        )


def _clean_id(value: str) -> str:
    return value.strip().upper()


def _split_list(value: str) -> list[str]:
    parts = (part.strip() for part in LIST_SPLIT.split(value))
    return list(dict.fromkeys(part for part in parts if part))


def _parse_float(
    value: str,
    label: str,
    row: _Row,
    column: str,
    minimum: float,
    maximum: float,
) -> float:
    if not value:
        raise ScenarioImportError(f"[{label}] Row {row.number}: {column} is required.")
    try:
        number = float(value)
    except ValueError as exc:
        raise ScenarioImportError(
            f"[{label}] Row {row.number}: {column} must be a number."
        ) from exc
    if not math.isfinite(number) or number < minimum or number > maximum:
        raise ScenarioImportError(
            f"[{label}] Row {row.number}: {column} must be between "
            f"{minimum} and {maximum}."
        )
    return number


def _parse_int(
    value: str,
    label: str,
    row: _Row,
    column: str,
    minimum: int,
    maximum: int,
) -> int:
    if not value:
        raise ScenarioImportError(f"[{label}] Row {row.number}: {column} is required.")
    try:
        number = int(value)
    except ValueError as exc:
        raise ScenarioImportError(
            f"[{label}] Row {row.number}: {column} must be an integer."
        ) from exc
    if number < minimum or number > maximum:
        raise ScenarioImportError(
            f"[{label}] Row {row.number}: {column} must be between "
            f"{minimum} and {maximum}."
        )
    return number


def _parse_bool(value: str, label: str, row: _Row, column: str) -> bool:
    text = value.strip().upper()
    if text in TRUE_VALUES:
        return True
    if text in FALSE_VALUES:
        return False
    raise ScenarioImportError(
        f"[{label}] Row {row.number}: {column} must be true/false."
    )


def _validation_message(label: str, row_number: int, exc: ValidationError) -> str:
    error = exc.errors()[0]
    field = ".".join(str(part) for part in error.get("loc", ())) or "value"
    message = str(error.get("msg", "invalid value")).rstrip(".")
    return f"[{label}] Row {row_number}: {field} {message}."
