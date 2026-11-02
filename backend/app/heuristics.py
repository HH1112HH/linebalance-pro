from __future__ import annotations

import heapq
from dataclasses import dataclass, field

from .models import Operation, Worker
from .utils import skill_grade, worker_can_operate_machine


@dataclass
class Layout:
    """A feasible assignment used only for a baseline or a MIP warm start.

    This is deliberately *not* an optimizer result. The MILP remains the only
    source of the final solution and its status.
    """

    assignment: dict[str, int] = field(default_factory=dict)
    station_worker: dict[int, str] = field(default_factory=dict)
    station_machines: dict[int, set[str]] = field(default_factory=dict)
    loads: dict[int, float] = field(default_factory=dict)

    @property
    def station_count(self) -> int:
        return len(self.station_worker)

    @property
    def max_load(self) -> float:
        return max(self.loads.values(), default=0.0)

    @property
    def worker_ids(self) -> set[str]:
        return set(self.station_worker.values())


def topological_order(operations: list[Operation]) -> list[Operation]:
    """Deterministic topological order using the optional operation sequence."""
    by_id = {operation.id: operation for operation in operations}
    adjacency: dict[str, list[str]] = {operation.id: [] for operation in operations}
    indegree: dict[str, int] = {operation.id: 0 for operation in operations}

    for operation in operations:
        for predecessor in operation.predecessors:
            if predecessor not in by_id:
                continue
            adjacency[predecessor].append(operation.id)
            indegree[operation.id] += 1

    heap: list[tuple[int, str]] = []
    for operation in operations:
        if indegree[operation.id] == 0:
            heap.append(
                (
                    operation.sequence if operation.sequence is not None else 10**9,
                    operation.id,
                )
            )
    heapq.heapify(heap)

    order: list[Operation] = []
    while heap:
        _, operation_id = heapq.heappop(heap)
        operation = by_id[operation_id]
        order.append(operation)
        for successor in adjacency[operation_id]:
            indegree[successor] -= 1
            if indegree[successor] == 0:
                successor_operation = by_id[successor]
                heapq.heappush(
                    heap,
                    (
                        successor_operation.sequence
                        if successor_operation.sequence is not None
                        else 10**9,
                        successor,
                    ),
                )

    if len(order) != len(operations):
        return []
    return order


def _eligible(worker: Worker, operation: Operation) -> bool:
    return skill_grade(
        worker, operation
    ) >= operation.skill_required and worker_can_operate_machine(
        worker, operation.machine_type
    )


def _worker_can_do(
    worker: Worker,
    operation: Operation,
    eligible: set[tuple[str, str]] | None,
) -> bool:
    if eligible is not None:
        return (operation.id, worker.id) in eligible
    return _eligible(worker, operation)


def _machine_compatible(station_machine: str | None, operation: Operation) -> bool:
    if station_machine is None or operation.machine_type is None:
        return True
    return station_machine == operation.machine_type


def build_layout(
    operations: list[Operation],
    workers: list[Worker],
    *,
    sam_by_id: dict[str, float],
    target_sec: float,
    max_stations: int,
    eligible: set[tuple[str, str]] | None = None,
) -> Layout | None:
    """Build a feasible layout with a first-fit/list-scheduling heuristic.

    The heuristic is used for two purposes only:

    1. a synthetic current-state baseline; and
    2. a MIP start for HiGHS/CBC.

    It is never returned as the optimizer's answer. The MILP post-check still
    verifies every constraint, and the solver status still reports whether the
    result is proven optimal.
    """
    order = topological_order(operations)
    if not order:
        return None

    available_workers = [worker for worker in workers if worker.available]
    if not available_workers:
        return None

    max_stations = min(max_stations, len(operations), len(available_workers))
    if max_stations <= 0:
        return None

    worker_qualifications = {
        worker.id: {
            operation.id
            for operation in operations
            if _worker_can_do(worker, operation, eligible)
        }
        for worker in available_workers
    }

    stations: dict[int, dict] = {}
    operation_station: dict[str, int] = {}
    used_workers: set[str] = set()
    next_index = 1

    for operation in order:
        min_station = max(
            (
                operation_station[predecessor]
                for predecessor in operation.predecessors
                if predecessor in operation_station
            ),
            default=1,
        )

        candidates: list[int] = []
        for index, station in stations.items():
            if index < min_station:
                continue
            if not _machine_compatible(station["machine"], operation):
                continue
            if not _worker_can_do(station["worker"], operation, eligible):
                continue
            if station["load"] + sam_by_id[operation.id] <= target_sec + 1e-9:
                candidates.append(index)

        if candidates:
            index = min(candidates, key=lambda item: stations[item]["load"])
        else:
            opened = False
            if len(stations) < max_stations:
                unused = [
                    worker
                    for worker in available_workers
                    if worker.id not in used_workers
                    and _worker_can_do(worker, operation, eligible)
                ]
                if unused:
                    new_index = max(next_index, min_station)
                    if new_index <= max_stations:
                        worker = min(
                            unused,
                            key=lambda item: len(worker_qualifications[item.id]),
                        )
                        stations[new_index] = {
                            "worker": worker,
                            "machine": operation.machine_type,
                            "load": 0.0,
                            "operations": [],
                        }
                        used_workers.add(worker.id)
                        next_index = new_index + 1
                        index = new_index
                        opened = True

            if not opened:
                relaxed = [
                    index
                    for index, station in stations.items()
                    if index >= min_station
                    and _machine_compatible(station["machine"], operation)
                    and _worker_can_do(station["worker"], operation, eligible)
                ]
                if not relaxed:
                    return None
                index = min(relaxed, key=lambda item: stations[item]["load"])

        station = stations[index]
        station["operations"].append(operation.id)
        station["load"] += sam_by_id[operation.id]
        if station["machine"] is None and operation.machine_type is not None:
            station["machine"] = operation.machine_type
        operation_station[operation.id] = index

    if len(operation_station) != len(operations):
        return None

    used_indices = sorted(stations)
    remap = {old: new for new, old in enumerate(used_indices, start=1)}
    layout = Layout()
    for old_index in used_indices:
        new_index = remap[old_index]
        station = stations[old_index]
        layout.station_worker[new_index] = station["worker"].id
        layout.station_machines[new_index] = (
            {station["machine"]} if station["machine"] is not None else set()
        )
        layout.loads[new_index] = round(station["load"], 6)
        for operation_id in station["operations"]:
            layout.assignment[operation_id] = new_index

    return layout


def _pack_stations(
    operations: list[Operation],
    *,
    sam_by_id: dict[str, float],
    target_sec: float,
    max_stations: int,
    order_mode: str,
) -> dict[int, dict] | None:
    """Pack operations into stations without assigning workers yet.

    Worker eligibility is intentionally checked in a second phase. Coupling
    both decisions in one greedy pass makes the packing much worse on this
    data set because the first eligible worker is often not the one that keeps
    later stations feasible.
    """
    op_by_id = {operation.id: operation for operation in operations}
    predecessors = {
        operation.id: [
            predecessor
            for predecessor in operation.predecessors
            if predecessor in op_by_id
        ]
        for operation in operations
    }
    successors: dict[str, list[str]] = {operation.id: [] for operation in operations}
    indegree = {
        operation.id: len(predecessors[operation.id]) for operation in operations
    }
    for operation in operations:
        for predecessor in predecessors[operation.id]:
            successors[predecessor].append(operation.id)

    heap: list[tuple[float, str]] = []
    for operation in operations:
        if indegree[operation.id] != 0:
            continue
        key = (
            -sam_by_id[operation.id]
            if order_mode == "sam"
            else (operation.sequence if operation.sequence is not None else 10**9)
        )
        heapq.heappush(heap, (key, operation.id))

    stations: dict[int, dict] = {}
    operation_station: dict[str, int] = {}
    next_index = 1

    while heap:
        _, operation_id = heapq.heappop(heap)
        operation = op_by_id[operation_id]
        min_station = max(
            (
                operation_station[predecessor]
                for predecessor in predecessors[operation_id]
                if predecessor in operation_station
            ),
            default=1,
        )

        candidates: list[int] = []
        for index, station in stations.items():
            if index < min_station:
                continue
            station_machine = station["machine"]
            if (
                station_machine is not None
                and operation.machine_type is not None
                and station_machine != operation.machine_type
            ):
                continue
            if station["load"] + sam_by_id[operation_id] <= target_sec + 1e-9:
                candidates.append(index)

        if candidates:
            index = min(candidates, key=lambda item: (stations[item]["load"], item))
        elif len(stations) < max_stations:
            index = max(next_index, min_station)
            if index > max_stations:
                return None
            stations[index] = {
                "machine": operation.machine_type,
                "load": 0.0,
                "operations": [],
            }
            next_index = index + 1
        else:
            relaxed = [
                item
                for item, station in stations.items()
                if item >= min_station
                and (
                    station["machine"] is None
                    or operation.machine_type is None
                    or station["machine"] == operation.machine_type
                )
            ]
            if not relaxed:
                return None
            index = min(relaxed, key=lambda item: (stations[item]["load"], item))

        station = stations[index]
        station["operations"].append(operation_id)
        station["load"] += sam_by_id[operation_id]
        if station["machine"] is None and operation.machine_type is not None:
            station["machine"] = operation.machine_type
        operation_station[operation_id] = index

        for successor in successors[operation_id]:
            indegree[successor] -= 1
            if indegree[successor] != 0:
                continue
            successor_operation = op_by_id[successor]
            key = (
                -sam_by_id[successor]
                if order_mode == "sam"
                else (
                    successor_operation.sequence
                    if successor_operation.sequence is not None
                    else 10**9
                )
            )
            heapq.heappush(heap, (key, successor))

    if len(operation_station) != len(operations):
        return None
    return stations


def _assign_workers_to_stations(
    stations: dict[int, dict],
    operations: list[Operation],
    workers: list[Worker],
    eligible: set[tuple[str, str]] | None,
) -> dict[int, Worker] | None:
    """Match one eligible worker to each packed station (bipartite matching)."""
    op_by_id = {operation.id: operation for operation in operations}
    options: dict[int, list[Worker]] = {}
    for index, station in stations.items():
        station_operations = [
            op_by_id[operation_id] for operation_id in station["operations"]
        ]
        qualified = [
            worker
            for worker in workers
            if all(
                _worker_can_do(worker, operation, eligible)
                for operation in station_operations
            )
        ]
        if not qualified:
            return None
        options[index] = qualified

    assigned: dict[str, int] = {}

    def augment(index: int, seen: set[str]) -> bool:
        for worker in options[index]:
            if worker.id in seen:
                continue
            seen.add(worker.id)
            if worker.id not in assigned or augment(assigned[worker.id], seen):
                assigned[worker.id] = index
                return True
        return False

    # Most constrained station first, then station index for determinism.
    for index in sorted(options, key=lambda item: (len(options[item]), item)):
        if not augment(index, set()):
            return None

    worker_by_id = {worker.id: worker for worker in workers}
    result = {index: worker_by_id[worker_id] for worker_id, index in assigned.items()}
    if len(result) != len(stations):
        return None
    return result


def _layout_from_stations(
    stations: dict[int, dict],
    worker_by_station: dict[int, Worker],
) -> Layout:
    used_indices = sorted(stations)
    remap = {old: new for new, old in enumerate(used_indices, start=1)}
    layout = Layout()
    for old_index in used_indices:
        new_index = remap[old_index]
        station = stations[old_index]
        layout.station_worker[new_index] = worker_by_station[old_index].id
        machine = station["machine"]
        layout.station_machines[new_index] = {machine} if machine is not None else set()
        layout.loads[new_index] = round(station["load"], 6)
        for operation_id in station["operations"]:
            layout.assignment[operation_id] = new_index
    return layout


def build_balanced_layout(
    operations: list[Operation],
    workers: list[Worker],
    *,
    sam_by_id: dict[str, float],
    target_sec: float,
    max_stations: int,
    eligible: set[tuple[str, str]] | None = None,
) -> Layout | None:
    """Two-phase layout: pack stations first, then match workers.

    This produces a much better MIP start than a single greedy pass while still
    respecting precedence, one machine type per station, skill and machine
    eligibility. It is only a warm start, never the final answer.
    """
    available_workers = [worker for worker in workers if worker.available]
    if not available_workers:
        return None
    best: Layout | None = None
    for order_mode in ("seq", "sam"):
        stations = _pack_stations(
            operations,
            sam_by_id=sam_by_id,
            target_sec=target_sec,
            max_stations=max_stations,
            order_mode=order_mode,
        )
        if stations is None:
            continue
        worker_by_station = _assign_workers_to_stations(
            stations, operations, available_workers, eligible
        )
        if worker_by_station is None:
            continue
        layout = _layout_from_stations(stations, worker_by_station)
        if best is None or layout.max_load < best.max_load - 1e-9:
            best = layout
    return best


def best_warm_start_layout(
    operations: list[Operation],
    workers: list[Worker],
    *,
    sam_by_id: dict[str, float],
    effective_takt_sec: float,
    max_stations: int,
    eligible: set[tuple[str, str]] | None = None,
) -> Layout | None:
    """Try several load targets and return the best feasible MIP start."""
    targets = [effective_takt_sec, 56.0, 58.0, 62.0, 70.0, 80.0, 100.0]
    best: Layout | None = None
    for target in dict.fromkeys(round(value, 6) for value in targets):
        layout = build_balanced_layout(
            operations,
            workers,
            sam_by_id=sam_by_id,
            target_sec=target,
            max_stations=max_stations,
            eligible=eligible,
        )
        if layout is None:
            layout = build_layout(
                operations,
                workers,
                sam_by_id=sam_by_id,
                target_sec=target,
                max_stations=max_stations,
                eligible=eligible,
            )
        if layout is None:
            continue
        if best is None or layout.max_load < best.max_load - 1e-9:
            best = layout
        if best.max_load <= effective_takt_sec + 1e-9:
            break
    return best
