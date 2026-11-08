from __future__ import annotations

import heapq

from .models import (
    ProcessFlowEdge,
    ProcessFlowNode,
    ProcessFlowRequest,
    ProcessFlowResponse,
    ReadinessEvaluationRequest,
    StyleReadiness,
)


def evaluate_readiness(request: ReadinessEvaluationRequest) -> StyleReadiness:
    """Calculate required-item completion and readiness blockers."""
    item_keys = [item.key for item in request.items]
    if len(set(item_keys)) != len(item_keys):
        raise ValueError("Readiness item keys must be unique.")

    required_items = [item for item in request.items if item.required]
    if not required_items:
        raise ValueError("At least one readiness item must be marked required.")

    completed_required = sum(item.status == "COMPLETED" for item in required_items)
    readiness_pct = round(completed_required / len(required_items) * 100, 2)
    blocking_items = [
        item.key
        for item in request.items
        if item.status == "BLOCKED" or (item.required and item.status != "COMPLETED")
    ]

    return StyleReadiness(
        style_code=request.style_code.strip(),
        items=request.items,
        readiness_pct=readiness_pct,
        ready=not blocking_items,
        blocking_items=blocking_items,
    )


def build_process_flow(request: ProcessFlowRequest) -> ProcessFlowResponse:
    """Build a deterministic precedence DAG with optional optimized assignments."""
    operations = request.operations
    operation_ids = [operation.id for operation in operations]
    operation_by_id = {operation.id: operation for operation in operations}
    errors: list[str] = []

    if len(set(operation_ids)) != len(operation_ids):
        errors.append("Operation IDs must be unique to build a process flow.")

    valid_ids = set(operation_ids)
    adjacency: dict[str, list[str]] = {
        operation_id: [] for operation_id in operation_ids
    }
    indegree: dict[str, int] = dict.fromkeys(operation_ids, 0)
    for operation in operations:
        if len(set(operation.predecessors)) != len(operation.predecessors):
            errors.append(
                f"Operation {operation.id} contains duplicate predecessor IDs."
            )
        for predecessor in operation.predecessors:
            if not predecessor:
                continue
            if predecessor == operation.id:
                errors.append(f"Operation {operation.id} cannot precede itself.")
            elif predecessor not in valid_ids:
                errors.append(
                    f"Operation {operation.id} references missing predecessor "
                    f"{predecessor}."
                )
            else:
                adjacency[predecessor].append(operation.id)
                indegree[operation.id] += 1

    assignment_by_operation = {item.operation_id: item for item in request.assignments}
    if len(assignment_by_operation) != len(request.assignments):
        errors.append("Each operation can have at most one process-flow assignment.")

    unknown_assignments = [
        item.operation_id
        for item in request.assignments
        if item.operation_id not in valid_ids
    ]
    if unknown_assignments:
        errors.append(
            "Assignments reference unknown operations: "
            + ", ".join(sorted(unknown_assignments))
            + "."
        )

    if request.assignments and set(assignment_by_operation) != valid_ids:
        errors.append("An optimized process flow must assign every operation once.")

    worker_station: dict[str, int] = {}
    station_worker: dict[int, str] = {}
    for assignment in request.assignments:
        if assignment.operation_id not in valid_ids:
            continue
        previous_station = worker_station.setdefault(
            assignment.worker_id, assignment.station
        )
        if previous_station != assignment.station:
            errors.append(
                f"Worker {assignment.worker_id} is assigned to more than one station."
            )
        previous_worker = station_worker.setdefault(
            assignment.station, assignment.worker_id
        )
        if previous_worker != assignment.worker_id:
            errors.append(
                f"Station {assignment.station} is assigned to more than one worker."
            )

    if errors:
        raise ValueError("Invalid process-flow input: " + " ".join(errors))

    def operation_priority(operation_id: str) -> tuple[int, str]:
        sequence = operation_by_id[operation_id].sequence
        return (sequence if sequence is not None else 10**9, operation_id)

    for children in adjacency.values():
        children.sort(key=operation_priority)

    ready = [
        operation_priority(operation_id)
        for operation_id in operation_ids
        if indegree[operation_id] == 0
    ]
    heapq.heapify(ready)

    topological_order: list[str] = []
    layer_by_id = dict.fromkeys(operation_ids, 0)
    while ready:
        _, operation_id = heapq.heappop(ready)
        topological_order.append(operation_id)
        for child_id in adjacency[operation_id]:
            layer_by_id[child_id] = max(
                layer_by_id[child_id], layer_by_id[operation_id] + 1
            )
            indegree[child_id] -= 1
            if indegree[child_id] == 0:
                heapq.heappush(ready, operation_priority(child_id))

    if len(topological_order) != len(operation_ids):
        raise ValueError("Invalid process-flow input: precedence cycle detected.")

    row_by_id: dict[str, int] = {}
    rows_per_layer: dict[int, int] = {}
    for operation_id in topological_order:
        layer = layer_by_id[operation_id]
        row_by_id[operation_id] = rows_per_layer.get(layer, 0)
        rows_per_layer[layer] = row_by_id[operation_id] + 1

    topological_index = {
        operation_id: index for index, operation_id in enumerate(topological_order)
    }
    edges = [
        ProcessFlowEdge(source=predecessor, target=operation_id)
        for operation_id in topological_order
        for predecessor in operation_by_id[operation_id].predecessors
        if predecessor
    ]
    edges.sort(
        key=lambda edge: (
            topological_index[edge.source],
            topological_index[edge.target],
        )
    )

    nodes = [
        ProcessFlowNode(
            operation_id=operation_id,
            name=operation_by_id[operation_id].name,
            sam_sec=operation_by_id[operation_id].sam_sec,
            machine_type=operation_by_id[operation_id].machine_type,
            is_quality_gate=operation_by_id[operation_id].is_quality_gate,
            predecessors=[
                predecessor
                for predecessor in operation_by_id[operation_id].predecessors
                if predecessor
            ],
            layer=layer_by_id[operation_id],
            order=row_by_id[operation_id],
            station=(
                assignment_by_operation[operation_id].station
                if request.assignments
                else None
            ),
            worker_id=(
                assignment_by_operation[operation_id].worker_id
                if request.assignments
                else None
            ),
            worker_name=(
                assignment_by_operation[operation_id].worker_name
                if request.assignments
                else None
            ),
        )
        for operation_id in topological_order
    ]

    return ProcessFlowResponse(
        style_code=request.style_code.strip(),
        nodes=nodes,
        edges=edges,
        has_assignment=bool(request.assignments),
    )
