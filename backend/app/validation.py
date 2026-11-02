from __future__ import annotations

import heapq
from dataclasses import dataclass, field

from .models import OptimizeRequest, Operation, WarningItem, Worker
from .utils import (
    effective_allowance_pct,
    effective_takt_time_sec,
    net_available_seconds,
    norm_code,
    planning_sam_sec,
    skill_grade,
    takt_time_sec,
    worker_can_operate_machine,
)


@dataclass
class ValidationResult:
    errors: list[str] = field(default_factory=list)
    warnings: list[WarningItem] = field(default_factory=list)
    net_available_seconds: float = 0.0
    takt_time_sec: float = 0.0
    effective_takt_time_sec: float = 0.0
    allowance_applied_pct: float = 0.0
    available_workers: list[Worker] = field(default_factory=list)
    max_workers: int = 0
    station_count: int = 0
    precedence_pairs: list[tuple[str, str]] = field(default_factory=list)
    topo_order: list[str] = field(default_factory=list)
    eligible: set[tuple[str, str]] = field(default_factory=set)
    planning_sam: dict[str, float] = field(default_factory=dict)
    machine_capacity: dict[str, int] = field(default_factory=dict)
    required_machine_types: set[str] = field(default_factory=set)
    operation_by_id: dict[str, Operation] = field(default_factory=dict)
    worker_by_id: dict[str, Worker] = field(default_factory=dict)
    total_planning_sam: float = 0.0
    max_single_planning_sam: float = 0.0


def _cycle_nodes(
    operation_ids: list[str], predecessors: dict[str, list[str]]
) -> list[str] | None:
    adjacency: dict[str, list[str]] = {op_id: [] for op_id in operation_ids}
    indegree: dict[str, int] = {op_id: 0 for op_id in operation_ids}
    for op_id, preds in predecessors.items():
        for pred in preds:
            if pred not in adjacency:
                continue
            adjacency[pred].append(op_id)
            indegree[op_id] += 1

    queue = [op_id for op_id in operation_ids if indegree[op_id] == 0]
    visited: list[str] = []
    while queue:
        node = queue.pop(0)
        visited.append(node)
        for nxt in adjacency[node]:
            indegree[nxt] -= 1
            if indegree[nxt] == 0:
                queue.append(nxt)

    if len(visited) != len(operation_ids):
        return [op_id for op_id in operation_ids if op_id not in visited]
    return None


def _topological_order(
    operation_ids: list[str],
    precedence_pairs: list[tuple[str, str]],
    operation_by_id: dict[str, Operation],
) -> list[str]:
    """Deterministic topological order, used for in-station sequencing."""
    adjacency: dict[str, list[str]] = {op_id: [] for op_id in operation_ids}
    indegree: dict[str, int] = {op_id: 0 for op_id in operation_ids}
    for pred, succ in set(precedence_pairs):
        if pred in adjacency and succ in adjacency:
            adjacency[pred].append(succ)
            indegree[succ] += 1

    heap: list[tuple[int, str]] = []
    for op_id in operation_ids:
        if indegree[op_id] == 0:
            operation = operation_by_id[op_id]
            heap.append((operation.sequence if operation.sequence is not None else 10**9, op_id))
    heapq.heapify(heap)

    order: list[str] = []
    while heap:
        _, node = heapq.heappop(heap)
        order.append(node)
        for nxt in adjacency[node]:
            indegree[nxt] -= 1
            if indegree[nxt] == 0:
                operation = operation_by_id[nxt]
                heapq.heappush(
                    heap,
                    (operation.sequence if operation.sequence is not None else 10**9, nxt),
                )
    return order


def validate_request(req: OptimizeRequest) -> ValidationResult:
    result = ValidationResult()
    operations = req.operations
    workers = req.workers
    operation_ids = [op.id for op in operations]
    worker_ids = [worker.id for worker in workers]

    result.operation_by_id = {op.id: op for op in operations}
    result.worker_by_id = {worker.id: worker for worker in workers}
    result.allowance_applied_pct = effective_allowance_pct(req.config) * 100.0

    result.net_available_seconds = round(net_available_seconds(req.config), 6)
    result.takt_time_sec = round(takt_time_sec(req.config), 6)
    result.effective_takt_time_sec = round(effective_takt_time_sec(req.config), 6)

    if result.net_available_seconds <= 0:
        result.errors.append(
            "Net available time is zero or negative. Check shift_minutes and break_minutes."
        )
    if result.takt_time_sec <= 0:
        result.errors.append("Takt time must be greater than zero.")
    if result.effective_takt_time_sec <= 0:
        result.errors.append(
            "Effective takt is zero or negative. Check planned_efficiency and target_qty."
        )
    if req.config.sam_basis == "INCLUDES_ALLOWANCE" and req.config.allowance_pct > 0:
        result.warnings.append(
            WarningItem(
                severity="info",
                code="allowance_ignored",
                message=(
                    "sam_basis=INCLUDES_ALLOWANCE, so allowance_pct is ignored to avoid "
                    "counting the same allowance twice. Set sam_basis=EXCLUDES_ALLOWANCE "
                    "only if the imported SAM truly excludes allowance."
                ),
            )
        )

    if len(set(operation_ids)) != len(operation_ids):
        result.errors.append("Duplicate operation IDs found. Each operation ID must be unique.")
    if len(set(worker_ids)) != len(worker_ids):
        result.errors.append("Duplicate worker IDs found. Each worker ID must be unique.")

    machine_ids = [machine.id for machine in req.machines]
    if len(set(machine_ids)) != len(machine_ids):
        result.errors.append("Duplicate machine IDs found. Each machine ID must be unique.")
    for machine in req.machines:
        if machine.available:
            machine_type = norm_code(machine.machine_type)
            result.machine_capacity[machine_type] = (
                result.machine_capacity.get(machine_type, 0) + machine.capacity
            )

    result.required_machine_types = {
        op.machine_type for op in operations if op.machine_type is not None
    }
    for machine_type in sorted(result.required_machine_types):
        if result.machine_capacity.get(machine_type, 0) < 1:
            result.errors.append(
                f"No available machine of type {machine_type}. "
                "Add an available machine or change the operation's machine_type."
            )

    # Precedence graph
    predecessors: dict[str, list[str]] = {}
    valid_ids = set(operation_ids)
    for op in operations:
        cleaned = [pred for pred in op.predecessors if pred]
        predecessors[op.id] = cleaned
        for pred in cleaned:
            if pred == op.id:
                result.errors.append(f"Operation {op.id} cannot be its own predecessor.")
            elif pred not in valid_ids:
                result.errors.append(
                    f"Operation {op.id} references missing predecessor {pred}."
                )
            else:
                result.precedence_pairs.append((pred, op.id))

    cycle = _cycle_nodes(operation_ids, predecessors)
    if cycle:
        result.errors.append(
            "Precedence cycle detected among: " + ", ".join(cycle) + "."
        )

    # Workforce
    result.available_workers = [worker for worker in workers if worker.available]
    if not result.available_workers:
        result.errors.append("No available workers. Mark at least one worker as available.")

    requested_max = req.config.max_workers or len(result.available_workers)
    result.max_workers = min(requested_max, len(result.available_workers))
    if result.max_workers <= 0:
        result.errors.append("max_workers must be greater than zero.")
    if req.config.max_workers is not None and requested_max > len(result.available_workers):
        result.warnings.append(
            WarningItem(
                severity="info",
                code="max_workers_clamped",
                message=(
                    f"max_workers={requested_max} exceeds the {len(result.available_workers)} "
                    "available workers; the limit was clamped."
                ),
            )
        )

    result.station_count = min(
        result.max_workers,
        len(operations),
        len(result.available_workers),
    )
    if result.station_count <= 0:
        result.errors.append(
            "The model needs at least one station, one operation and one available worker."
        )

    # Planning SAM and eligibility. Skill grade is an eligibility gate only;
    # it is not a productivity multiplier in the MVP.
    result.planning_sam = {
        op.id: planning_sam_sec(op, req.config) for op in operations
    }
    result.total_planning_sam = round(sum(result.planning_sam.values()), 6)
    result.max_single_planning_sam = round(max(result.planning_sam.values(), default=0.0), 6)

    for op in operations:
        skilled = [
            worker
            for worker in result.available_workers
            if skill_grade(worker, op) >= op.skill_required
        ]
        eligible = [
            worker
            for worker in skilled
            if worker_can_operate_machine(worker, op.machine_type)
        ]
        if not eligible:
            if not skilled:
                result.errors.append(
                    f"Operation {op.id} ({op.name}) needs {op.skill_code} grade "
                    f"{op.skill_required}, but no available worker has that grade."
                )
            else:
                result.errors.append(
                    f"Operation {op.id} ({op.name}) needs machine {op.machine_type}, "
                    "but no skill-qualified worker is certified for that machine type."
                )
            continue

        for worker in eligible:
            result.eligible.add((op.id, worker.id))

        op_sam = result.planning_sam[op.id]
        if op_sam > result.effective_takt_time_sec + 1e-9:
            result.warnings.append(
                WarningItem(
                    severity="critical",
                    code="operation_over_effective_takt",
                    message=(
                        f"{op.id} ({op.name}) has planning SAM {op_sam:.1f}s, above "
                        f"effective takt {result.effective_takt_time_sec:.1f}s at "
                        f"{req.config.planned_efficiency:.0%} planned efficiency. "
                        "It cannot meet the capacity target in one station."
                    ),
                    operation_id=op.id,
                )
            )
            if req.config.objective == "min_workers":
                result.errors.append(
                    f"Operation {op.id} cannot fit inside effective takt "
                    f"({op_sam:.1f}s > {result.effective_takt_time_sec:.1f}s), "
                    "so min_workers mode is infeasible."
                )

        if op_sam > result.takt_time_sec + 1e-9:
            result.warnings.append(
                WarningItem(
                    severity="warning",
                    code="operation_over_demand_takt",
                    message=(
                        f"{op.id} has planning SAM {op_sam:.1f}s above demand takt "
                        f"{result.takt_time_sec:.1f}s. It cannot fit one station at 100% "
                        "of scheduled time; split the operation."
                    ),
                    operation_id=op.id,
                )
            )

        if len(eligible) == 1:
            worker = eligible[0]
            result.warnings.append(
                WarningItem(
                    severity="warning",
                    code="single_point_of_failure",
                    message=(
                        f"Only {worker.name} is qualified for {op.id} ({op.name}). "
                        "Cross-training is recommended."
                    ),
                    operation_id=op.id,
                    worker_id=worker.id,
                )
            )

    for worker in result.available_workers:
        qualified = sum(1 for op in operations if (op.id, worker.id) in result.eligible)
        if qualified == 0:
            result.warnings.append(
                WarningItem(
                    severity="info",
                    code="worker_no_qualified_operation",
                    message=(
                        f"{worker.name} has no qualified operation with the current "
                        "skill and machine data."
                    ),
                    worker_id=worker.id,
                )
            )

    # Necessary-condition lower bounds, useful for clear infeasibility messages.
    if not result.errors:
        if req.config.objective == "min_workers":
            capacity = result.max_workers * result.effective_takt_time_sec
            if result.total_planning_sam > capacity + 1e-6:
                result.errors.append(
                    f"Total planning SAM is {result.total_planning_sam:.1f}s, but "
                    f"{result.max_workers} workers can absorb only {capacity:.1f}s at "
                    f"effective takt {result.effective_takt_time_sec:.1f}s. "
                    "Increase headcount, reduce target, or improve planned efficiency."
                )
        else:
            lower_bound = max(
                result.max_single_planning_sam,
                result.total_planning_sam / max(result.station_count, 1),
            )
            if lower_bound > result.effective_takt_time_sec + 1e-6:
                result.warnings.append(
                    WarningItem(
                        severity="critical",
                        code="takt_unreachable_lower_bound",
                        message=(
                            f"Even before sequencing, the best possible bottleneck is at "
                            f"least {lower_bound:.1f}s, above effective takt "
                            f"{result.effective_takt_time_sec:.1f}s. The line cannot meet "
                            "the capacity target with this crew and data."
                        ),
                    )
                )

    # Machine capacity information
    for machine_type in sorted(result.required_machine_types):
        required_ops = sum(
            1 for op in operations if op.machine_type == machine_type
        )
        capacity = result.machine_capacity.get(machine_type, 0)
        if 0 < capacity < required_ops:
            result.warnings.append(
                WarningItem(
                    severity="info",
                    code="machine_capacity_shared",
                    message=(
                        f"{required_ops} operations need {machine_type}, but only "
                        f"{capacity} machine(s) are available. Some operations must "
                        "share a station."
                    ),
                )
            )

    result.topo_order = _topological_order(
        operation_ids, result.precedence_pairs, result.operation_by_id
    )
    return result
