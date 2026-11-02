from __future__ import annotations

import math
import re

from .models import (
    BaselineComparison,
    BaselineMetrics,
    Kpis,
    OptimizeRequest,
    Station,
)
from .utils import pct, safe_div, skill_grade, worker_can_operate_machine
from .validation import ValidationResult


def _station_sort_key(station_id: str) -> tuple[int, str]:
    match = re.search(r"(\d+)", station_id)
    return (int(match.group(1)) if match else 10**9, station_id)


def _metrics_from_loads(
    loads: dict[str, float],
    station_worker: dict[str, str],
    validation: ValidationResult,
    planned_efficiency: float,
    effective_takt_time_sec: float,
    target_qty: int,
) -> BaselineMetrics:
    total_planning_sam = sum(loads.values())
    workers_used = len({worker for worker in station_worker.values() if worker})
    bottleneck_station = (
        max(loads, key=lambda station_id: loads[station_id]) if loads else ""
    )
    bottleneck_load = loads.get(bottleneck_station, 0.0)
    balance_efficiency = pct(total_planning_sam, workers_used * bottleneck_load)
    capacity = safe_div(
        validation.net_available_seconds * planned_efficiency,
        bottleneck_load,
    )
    smoothness = math.sqrt(
        sum((bottleneck_load - load) ** 2 for load in loads.values())
    )
    return BaselineMetrics(
        stations_used=len(loads),
        workers_used=workers_used,
        bottleneck_station=bottleneck_station,
        bottleneck_load_sec=round(bottleneck_load, 3),
        balance_efficiency_pct=round(balance_efficiency, 2),
        capacity_per_shift=round(capacity, 1),
        target_achievement_pct=round(pct(capacity, target_qty), 2),
        smoothness_index=round(smoothness, 2),
        total_idle_sec=round(
            sum(max(0.0, effective_takt_time_sec - load) for load in loads.values()),
            3,
        ),
        total_overload_sec=round(
            sum(max(0.0, load - effective_takt_time_sec) for load in loads.values()),
            3,
        ),
    )


def build_baseline_comparison(
    req: OptimizeRequest,
    validation: ValidationResult,
    stations: list[Station],
    kpis: Kpis,
) -> BaselineComparison | None:
    baseline = req.baseline_assignment
    if baseline is None or not baseline.items:
        return None

    operation_ids = set(validation.operation_by_id)
    station_ops: dict[str, list[str]] = {}
    station_worker: dict[str, str] = {}
    worker_stations: dict[str, set[str]] = {}
    seen_ops: dict[str, int] = {}
    violations: list[str] = []

    for item in baseline.items:
        if item.operation_id not in operation_ids:
            violations.append(
                f"Baseline references unknown operation {item.operation_id}."
            )
            continue
        seen_ops[item.operation_id] = seen_ops.get(item.operation_id, 0) + 1
        station_ops.setdefault(item.station_id, []).append(item.operation_id)
        existing_worker = station_worker.get(item.station_id)
        if existing_worker and existing_worker != item.worker_id:
            violations.append(
                f"Baseline station {item.station_id} has more than one worker "
                f"({existing_worker}, {item.worker_id}); MVP assumes one worker per station."
            )
        else:
            station_worker[item.station_id] = item.worker_id
        worker_stations.setdefault(item.worker_id, set()).add(item.station_id)

        if item.worker_id not in validation.worker_by_id:
            violations.append(f"Baseline references unknown worker {item.worker_id}.")
            continue
        worker = validation.worker_by_id[item.worker_id]
        operation = validation.operation_by_id[item.operation_id]
        if skill_grade(worker, operation) < operation.skill_required:
            violations.append(
                f"Baseline assigns {item.worker_id} to {item.operation_id} below the "
                f"required skill grade {operation.skill_required}."
            )
        if not worker_can_operate_machine(worker, operation.machine_type):
            violations.append(
                f"Baseline assigns {item.worker_id} to {item.operation_id} without "
                f"certification for machine {operation.machine_type}."
            )

    missing = sorted(operation_ids - set(seen_ops))
    duplicates = sorted(op for op, count in seen_ops.items() if count > 1)
    if missing:
        violations.append(
            "Baseline is incomplete; missing operations: " + ", ".join(missing[:12])
        )
    if duplicates:
        violations.append(
            "Baseline assigns some operations more than once: "
            + ", ".join(duplicates[:12])
        )
    for worker_id, worker_station_ids in worker_stations.items():
        if len(worker_station_ids) > 1:
            violations.append(
                f"Baseline assigns worker {worker_id} to multiple stations: "
                + ", ".join(sorted(worker_station_ids))
            )

    # Machine consistency inside one station (MVP: at most one machine type).
    for station_id, op_ids in station_ops.items():
        machine_types: set[str] = set()
        for op_id in op_ids:
            machine_type = validation.operation_by_id[op_id].machine_type
            if machine_type is not None:
                machine_types.add(machine_type)
        if len(machine_types) > 1:
            violations.append(
                f"Baseline station {station_id} mixes machine types: "
                + ", ".join(sorted(machine_types))
            )

    # Precedence check using numeric station order.
    station_order = {
        station_id: index
        for index, station_id in enumerate(sorted(station_ops, key=_station_sort_key))
    }
    for predecessor, successor in validation.precedence_pairs:
        pred_station = next(
            (station for station, ops in station_ops.items() if predecessor in ops),
            None,
        )
        succ_station = next(
            (station for station, ops in station_ops.items() if successor in ops), None
        )
        if (
            pred_station
            and succ_station
            and station_order[pred_station] > station_order[succ_station]
        ):
            violations.append(
                f"Baseline violates precedence {predecessor} -> {successor}: "
                f"{pred_station} is after {succ_station}."
            )

    loads = {
        station_id: sum(validation.planning_sam[op_id] for op_id in op_ids)
        for station_id, op_ids in station_ops.items()
    }

    before: BaselineMetrics | None
    if missing or duplicates or not loads:
        before = None
    else:
        before = _metrics_from_loads(
            loads,
            station_worker,
            validation,
            req.config.planned_efficiency,
            validation.effective_takt_time_sec,
            req.config.target_qty,
        )

    after = BaselineMetrics(
        stations_used=kpis.workers_used,
        workers_used=kpis.workers_used,
        bottleneck_station=str(kpis.bottleneck_station),
        bottleneck_load_sec=kpis.bottleneck_load_sec,
        balance_efficiency_pct=kpis.balance_efficiency_pct,
        capacity_per_shift=kpis.capacity_per_shift,
        target_achievement_pct=kpis.target_achievement_pct,
        smoothness_index=kpis.smoothness_index,
        total_idle_sec=kpis.total_idle_sec,
        total_overload_sec=kpis.total_overload_sec,
    )

    notes = [
        baseline.source_note,
        "Bottleneck delta is reported as before - after, so a positive value is an improvement.",
        (
            "Baseline violations are listed but do not block the comparison; a real current-state "
            "layout may violate the assumptions of the optimized model."
        ),
    ]

    if before is None:
        return BaselineComparison(
            before=None,
            after=after,
            violations=violations,
            notes=[
                *notes,
                "No complete baseline metrics were computed because the baseline is incomplete.",
            ],
        )

    return BaselineComparison(
        before=before,
        after=after,
        station_delta=after.stations_used - before.stations_used,
        worker_delta=after.workers_used - before.workers_used,
        bottleneck_delta_sec=round(
            before.bottleneck_load_sec - after.bottleneck_load_sec, 3
        ),
        balance_efficiency_delta_pct=round(
            after.balance_efficiency_pct - before.balance_efficiency_pct, 2
        ),
        capacity_delta_pcs=round(
            after.capacity_per_shift - before.capacity_per_shift, 1
        ),
        target_achievement_delta_pct=round(
            after.target_achievement_pct - before.target_achievement_pct, 2
        ),
        violations=violations,
        notes=notes,
    )
