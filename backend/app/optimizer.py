from __future__ import annotations

import hashlib
import json
import math
import os
import re
import time
import uuid
from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Any, Literal

import pulp

from .actuals import analyze_actuals
from .baseline import build_baseline_comparison
from .heuristics import Layout, best_warm_start_layout
from .kpis import build_station, compute_kpis
from .models import (
    AssignedOperation,
    Diagnostics,
    Kpis,
    OptimizeRequest,
    OptimizeResponse,
    RunMetadata,
    Station,
    WarningItem,
    Worker,
    WorkerSummary,
)
from .planning import build_planning_summary
from .utils import skill_grade, worker_can_operate_machine
from .validation import ValidationResult, validate_request
from .version import APP_VERSION, DATA_POLICY, MODEL_VERSION

SOLVER_BACKEND = os.getenv("SOLVER_BACKEND", "highs").strip().lower()
SOLVER_THREADS = max(1, int(os.getenv("SOLVER_THREADS", "2")))

ResponseStatus = Literal["OPTIMAL", "FEASIBLE_LIMIT", "INFEASIBLE", "ERROR"]


@dataclass
class ModelVars:
    problem: pulp.LpProblem
    x: dict[str, dict[int, pulp.LpVariable]]
    y: dict[int, dict[str, pulp.LpVariable]]
    z: dict[int, pulp.LpVariable]
    m: dict[int, dict[str, pulp.LpVariable]]
    load: dict[int, pulp.LpVariable]
    cmax: pulp.LpVariable
    stations: list[int]


STATUS_NAMES: dict[pulp.LpSolveStatus, str] = {
    pulp.LpSolveStatus.Optimal: "OPTIMAL",
    pulp.LpSolveStatus.Infeasible: "INFEASIBLE",
    pulp.LpSolveStatus.Unbounded: "UNBOUNDED",
    pulp.LpSolveStatus.Undefined: "UNDEFINED",
    pulp.LpSolveStatus.TimeLimit: "TIME_LIMIT",
    pulp.LpSolveStatus.MemoryLimit: "MEMORY_LIMIT",
    pulp.LpSolveStatus.NodeLimit: "NODE_LIMIT",
    pulp.LpSolveStatus.GapLimit: "GAP_LIMIT",
    pulp.LpSolveStatus.IterationLimit: "ITERATION_LIMIT",
    pulp.LpSolveStatus.SolutionLimit: "SOLUTION_LIMIT",
    pulp.LpSolveStatus.Interrupted: "INTERRUPTED",
    pulp.LpSolveStatus.Stopped: "STOPPED",
    pulp.LpSolveStatus.NumericalError: "NUMERICAL_ERROR",
    pulp.LpSolveStatus.NotSolved: "NOT_SOLVED",
}

LIMIT_WITH_SOLUTION = {
    "TIME_LIMIT",
    "GAP_LIMIT",
    "NODE_LIMIT",
    "ITERATION_LIMIT",
    "SOLUTION_LIMIT",
    "INTERRUPTED",
    "STOPPED",
}


def solver_status_name(status: pulp.LpSolveStatus) -> str:
    return STATUS_NAMES.get(status, str(status).upper())


def check_solver() -> tuple[bool, str | None]:
    solver: pulp.LpSolver
    try:
        if SOLVER_BACKEND == "cbc":
            solver = pulp.COIN_CMD(msg=False)
            path = solver.available()
            if path:
                return True, str(path)
            return False, "CBC executable not found. Install pulp[cbc]."
        solver = pulp.HiGHS(msg=False)
        if solver.available():
            return True, _solver_version()
        return False, "HiGHS is not available. Install highspy."
    except Exception as exc:  # pragma: no cover - defensive
        return False, str(exc)


def _value(variable: pulp.LpVariable | None) -> float:
    if variable is None:
        return 0.0
    value = variable.value()
    return float(value) if value is not None else 0.0


def _input_hash(req: OptimizeRequest) -> str:
    payload = json.dumps(
        req.model_dump(mode="json"),
        sort_keys=True,
        separators=(",", ":"),
        ensure_ascii=False,
    )
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def _metadata(
    req: OptimizeRequest,
    solver_status: str,
    started_at: float,
    *,
    lexicographic_proven: bool,
    stage1_objective: float | None = None,
    stage2_objective: float | None = None,
) -> RunMetadata:
    input_hash = _input_hash(req)
    return RunMetadata(
        run_id=str(uuid.uuid4()),
        app_version=APP_VERSION,
        data_version=input_hash[:12],
        model_version=MODEL_VERSION,
        solver_version=_solver_version(),
        objective=req.config.objective,
        input_hash=input_hash,
        solver_status=solver_status,
        solve_time_sec=round(time.perf_counter() - started_at, 3),
        created_at=datetime.now(UTC).isoformat(),
        lexicographic_proven=lexicographic_proven,
        stage1_objective=stage1_objective,
        stage2_objective=stage2_objective,
    )


def _build_model(
    req: OptimizeRequest,
    validation: ValidationResult,
    *,
    stage: int,
    cmax_upper: float | None = None,
    workers_fixed: int | None = None,
) -> ModelVars:
    operations = req.operations
    op_ids = [op.id for op in operations]
    stations = list(range(1, validation.station_count + 1))
    workers = validation.available_workers
    worker_ids = [worker.id for worker in workers]
    machine_types = sorted(validation.required_machine_types)

    problem = pulp.LpProblem(f"linebalance_stage{stage}", pulp.LpMinimize)
    x = problem.add_variable_dicts("x", (op_ids, stations), cat="Binary")
    y = problem.add_variable_dicts("y", (stations, worker_ids), cat="Binary")
    z = problem.add_variable_dict("z", stations, cat="Binary")
    m = (
        problem.add_variable_dicts("m", (stations, machine_types), cat="Binary")
        if machine_types
        else {station: {} for station in stations}
    )
    load = problem.add_variable_dict("load", stations, lowBound=0)
    cmax = problem.add_variable("cmax", lowBound=0)

    # 1. Each operation is assigned to exactly one station.
    for op_index, op in enumerate(operations, start=1):
        problem += (
            pulp.lpSum(x[op.id][station] for station in stations) == 1,
            f"assign_{op_index}",
        )

    # 2. Each used station has exactly one worker; each worker has at most one station.
    for station in stations:
        problem += (
            pulp.lpSum(y[station][worker_id] for worker_id in worker_ids) == z[station],
            f"station_worker_{station}",
        )
    for worker_index, worker in enumerate(workers, start=1):
        problem += (
            pulp.lpSum(y[station][worker.id] for station in stations) <= 1,
            f"worker_once_{worker_index}",
        )

    # 3. Station/operation linkage and prefix symmetry breaking.
    for op_index, op in enumerate(operations, start=1):
        for station in stations:
            problem += (
                x[op.id][station] <= z[station],
                f"x_station_{op_index}_{station}",
            )
    for station in stations:
        problem += (
            z[station] <= pulp.lpSum(x[op.id][station] for op in operations),
            f"station_has_operation_{station}",
        )
    for station in stations[:-1]:
        problem += z[station] >= z[station + 1], f"prefix_{station}"

    # 4. Skill eligibility. Skill grade is an eligibility gate only; it does
    # not change standard SAM in the MVP.
    for op_index, op in enumerate(operations, start=1):
        eligible_worker_ids = [
            worker.id for worker in workers if (op.id, worker.id) in validation.eligible
        ]
        for station in stations:
            problem += (
                x[op.id][station]
                <= pulp.lpSum(
                    y[station][worker_id] for worker_id in eligible_worker_ids
                ),
                f"skill_{op_index}_{station}",
            )

    # 5. Machine compatibility and inventory.
    # MVP assumption: one station can host at most one machine type. Manual
    # operations have machine_type=None and do not consume a machine.
    for op_index, op in enumerate(operations, start=1):
        machine_type = op.machine_type
        if machine_type is None:
            continue
        for station in stations:
            problem += (
                x[op.id][station] <= m[station][machine_type],
                f"machine_required_{op_index}_{station}",
            )

    for station in stations:
        if machine_types:
            problem += (
                pulp.lpSum(m[station][machine_type] for machine_type in machine_types)
                <= 1,
                f"one_machine_{station}",
            )
        for machine_index, machine_type in enumerate(machine_types, start=1):
            problem += (
                m[station][machine_type] <= z[station],
                (f"machine_station_{station}_{machine_index}"),
            )
            problem += (
                m[station][machine_type]
                <= pulp.lpSum(
                    x[op.id][station]
                    for op in operations
                    if op.machine_type == machine_type
                ),
                f"machine_needed_{station}_{machine_index}",
            )

    for machine_index, machine_type in enumerate(machine_types, start=1):
        problem += (
            pulp.lpSum(m[station][machine_type] for station in stations)
            <= validation.machine_capacity.get(machine_type, 0),
            f"machine_capacity_{machine_index}",
        )

    # A worker cannot staff a station equipped with a machine they cannot operate.
    for station in stations:
        for worker_index, worker in enumerate(workers, start=1):
            certified = set(worker.machine_types)
            for machine_index, machine_type in enumerate(machine_types, start=1):
                if "ANY" in certified or machine_type in certified:
                    continue
                problem += (
                    y[station][worker.id] + m[station][machine_type] <= 1,
                    f"worker_machine_{station}_{worker_index}_{machine_index}",
                )

    # 6. Precedence: predecessor station <= successor station.
    for pair_index, (predecessor, successor) in enumerate(
        validation.precedence_pairs, start=1
    ):
        problem += (
            pulp.lpSum(station * x[predecessor][station] for station in stations)
            <= pulp.lpSum(station * x[successor][station] for station in stations),
            f"precedence_{pair_index}",
        )

    # 7. Headcount limit.
    problem += (
        pulp.lpSum(z[station] for station in stations) <= validation.max_workers,
        "max_workers",
    )

    # 8. Station load is linear in x because the MVP uses standard SAM, not a
    # worker-dependent effective time. This is the key correction to keep the
    # model a true MILP without big-M load linearization.
    for station in stations:
        problem += (
            load[station]
            == pulp.lpSum(
                validation.planning_sam[op.id] * x[op.id][station] for op in operations
            ),
            f"load_definition_{station}",
        )
        problem += load[station] <= cmax, f"cmax_{station}"
        if req.config.objective == "min_workers":
            problem += (
                load[station] <= validation.effective_takt_time_sec * z[station],
                f"effective_takt_{station}",
            )

    if cmax_upper is not None:
        problem += cmax <= cmax_upper + 1e-5, "stage_cmax"
    if workers_fixed is not None:
        problem += (
            pulp.lpSum(z[station] for station in stations) <= workers_fixed,
            "stage_workers",
        )

    if stage == 1:
        if req.config.objective == "min_bottleneck":
            problem.setObjective(cmax)
        else:
            problem.setObjective(pulp.lpSum(z[station] for station in stations))
    else:
        if req.config.objective == "min_bottleneck":
            problem.setObjective(pulp.lpSum(z[station] for station in stations))
        else:
            problem.setObjective(cmax)

    return ModelVars(
        problem=problem,
        x=x,
        y=y,
        z=z,
        m=m,
        load=load,
        cmax=cmax,
        stations=stations,
    )


def _station_sort_key(station_id: str) -> tuple[int, str]:
    match = re.search(r"(\d+)", station_id)
    return (int(match.group(1)) if match else 10**9, station_id)


def _layout_from_baseline(
    req: OptimizeRequest,
    validation: ValidationResult,
) -> Layout | None:
    """Convert a complete baseline assignment into a compact warm-start layout."""
    baseline = req.baseline_assignment
    if baseline is None or not baseline.items:
        return None

    station_ids = sorted(
        {item.station_id for item in baseline.items}, key=_station_sort_key
    )
    if not station_ids:
        return None
    station_map = {
        station_id: index for index, station_id in enumerate(station_ids, start=1)
    }

    operation_by_id = validation.operation_by_id
    worker_by_id = validation.worker_by_id
    assignment: dict[str, int] = {}
    station_worker: dict[int, str] = {}
    station_machines: dict[int, set[str]] = {}
    loads: dict[int, float] = dict.fromkeys(station_map.values(), 0.0)
    seen_ops: set[str] = set()

    for item in baseline.items:
        if item.operation_id not in operation_by_id:
            return None
        if item.operation_id in seen_ops:
            return None
        if item.worker_id not in worker_by_id:
            return None
        worker = worker_by_id[item.worker_id]
        operation = operation_by_id[item.operation_id]
        if not worker.available:
            return None
        if (operation.id, worker.id) not in validation.eligible:
            return None

        station = station_map[item.station_id]
        if station in station_worker and station_worker[station] != worker.id:
            return None
        station_worker[station] = worker.id
        assignment[operation.id] = station
        seen_ops.add(operation.id)
        loads[station] += validation.planning_sam[operation.id]
        if operation.machine_type is not None:
            station_machines.setdefault(station, set()).add(operation.machine_type)

    if len(seen_ops) != len(req.operations):
        return None
    if any(len(machine_types) > 1 for machine_types in station_machines.values()):
        return None

    for predecessor, successor in validation.precedence_pairs:
        if assignment.get(predecessor, 0) > assignment.get(successor, 0):
            return None

    return Layout(
        assignment=assignment,
        station_worker=station_worker,
        station_machines=station_machines,
        loads=loads,
    )


def _apply_layout(
    model: ModelVars,
    req: OptimizeRequest,
    validation: ValidationResult,
    layout: Layout,
) -> bool:
    """Set a feasible layout as a MIP start. The solver still owns the result."""
    if layout.station_count > len(model.stations):
        return False
    if set(layout.assignment) != {operation.id for operation in req.operations}:
        return False
    if len(set(layout.station_worker.values())) != layout.station_count:
        return False

    for operation in req.operations:
        for station in model.stations:
            model.x[operation.id][station].setInitialValue(
                1 if layout.assignment.get(operation.id) == station else 0
            )

    machine_types = sorted(validation.required_machine_types)
    for station in model.stations:
        for worker in validation.available_workers:
            model.y[station][worker.id].setInitialValue(
                1 if layout.station_worker.get(station) == worker.id else 0
            )
        model.z[station].setInitialValue(1 if station in layout.station_worker else 0)
        for machine_type in machine_types:
            model.m[station][machine_type].setInitialValue(
                1 if machine_type in layout.station_machines.get(station, set()) else 0
            )
        model.load[station].setInitialValue(layout.loads.get(station, 0.0))
    model.cmax.setInitialValue(layout.max_load)
    return True


def _apply_solution_warm_start(
    model: ModelVars,
    source: ModelVars,
    req: OptimizeRequest,
    validation: ValidationResult,
) -> bool:
    """Copy a stage-1 solution into the stage-2 model."""
    if set(model.stations) != set(source.stations):
        return False

    def binary(variable: pulp.LpVariable | None) -> float:
        # HiGHS rejects initial values such as 1.0000000000000122 for a binary
        # variable. Round every binary MIP start explicitly.
        return 1.0 if _value(variable) > 0.5 else 0.0

    for operation in req.operations:
        for station in model.stations:
            model.x[operation.id][station].setInitialValue(
                binary(source.x[operation.id][station])
            )
    machine_types = sorted(validation.required_machine_types)
    for station in model.stations:
        for worker in validation.available_workers:
            model.y[station][worker.id].setInitialValue(
                binary(source.y[station][worker.id])
            )
        model.z[station].setInitialValue(binary(source.z[station]))
        for machine_type in machine_types:
            model.m[station][machine_type].setInitialValue(
                binary(source.m[station].get(machine_type))
            )
        model.load[station].setInitialValue(max(0.0, _value(source.load[station])))
    model.cmax.setInitialValue(max(0.0, _value(source.cmax)))
    return True


def _apply_warm_start(
    model: ModelVars,
    req: OptimizeRequest,
    validation: ValidationResult,
) -> bool:
    """Try a balanced greedy layout first, then a valid baseline.

    The greedy layout is only a MIP start. It prevents the solver from spending
    the whole time limit on worker-station symmetry and a poor incumbent.
    """
    layout = best_warm_start_layout(
        req.operations,
        validation.available_workers,
        sam_by_id=validation.planning_sam,
        effective_takt_sec=validation.effective_takt_time_sec,
        max_stations=validation.station_count,
        eligible=validation.eligible,
    )
    if layout is None:
        layout = _layout_from_baseline(req, validation)
    if layout is None:
        return False
    return _apply_layout(model, req, validation, layout)


def _solver_version() -> str:
    if SOLVER_BACKEND == "cbc":
        return f"PuLP {pulp.__version__} / CBC"
    try:
        from importlib.metadata import version as package_version

        highs_version = package_version("highspy")
    except Exception:  # pragma: no cover - defensive
        highs_version = "unknown"
    return f"PuLP {pulp.__version__} / HiGHS {highs_version}"


def _solve(
    problem: pulp.LpProblem, time_limit: float, *, warm_start: bool = False
) -> Any:
    limit = max(1, math.ceil(time_limit))
    solver: pulp.LpSolver
    if SOLVER_BACKEND == "cbc":
        solver = pulp.COIN_CMD(
            msg=False,
            timeLimit=limit,
            warmStart=warm_start,
            keepFiles=warm_start,
        )
    else:
        solver = pulp.HiGHS(
            msg=False,
            timeLimit=limit,
            threads=SOLVER_THREADS,
            warmStart=warm_start,
        )
    return problem.solve(solver)


def _classify_status(status_name: str, has_solution: bool) -> ResponseStatus:
    if status_name == "OPTIMAL":
        return "OPTIMAL"
    if status_name == "INFEASIBLE":
        return "INFEASIBLE"
    if status_name in LIMIT_WITH_SOLUTION:
        return "FEASIBLE_LIMIT" if has_solution else "ERROR"
    return "ERROR"


def _base_fields(req: OptimizeRequest, validation: ValidationResult) -> dict[str, Any]:
    return {
        "data_source": DATA_POLICY,
        "line_name": req.line_name,
        "style_code": req.style_code,
        "shift_id": req.config.shift_id,
        "sam_basis": req.config.sam_basis,
        "allowance_applied_pct": round(validation.allowance_applied_pct, 2),
        "takt_time_sec": validation.takt_time_sec,
        "effective_takt_time_sec": validation.effective_takt_time_sec,
        "available_seconds": validation.net_available_seconds,
    }


def _data_error_response(
    req: OptimizeRequest,
    validation: ValidationResult,
    started_at: float,
    solver_available: bool,
    solver_message: str | None,
) -> OptimizeResponse:
    return OptimizeResponse(
        status="INFEASIBLE",
        solver_status="DATA_ERROR",
        has_solution=False,
        solver_available=solver_available,
        solver_message=solver_message,
        solve_time_sec=round(time.perf_counter() - started_at, 3),
        diagnostics=Diagnostics(
            feasible=False,
            error_type="DATA",
            issues=validation.errors,
            suggestions=_data_suggestions(validation),
        ),
        warnings=list(validation.warnings),
        metadata=_metadata(
            req,
            "DATA_ERROR",
            started_at,
            lexicographic_proven=False,
        ),
        **_base_fields(req, validation),
    )


def _model_infeasible_response(
    req: OptimizeRequest,
    validation: ValidationResult,
    started_at: float,
    solver_available: bool,
    solver_message: str | None,
    solver_status: str = "INFEASIBLE",
) -> OptimizeResponse:
    return OptimizeResponse(
        status="INFEASIBLE",
        solver_status=solver_status,
        has_solution=False,
        solver_available=solver_available,
        solver_message=solver_message,
        solve_time_sec=round(time.perf_counter() - started_at, 3),
        diagnostics=Diagnostics(
            feasible=False,
            error_type="MODEL",
            issues=[
                (
                    "No feasible assignment exists under the current skill, machine, "
                    "precedence, takt and headcount constraints."
                )
            ],
            suggestions=_model_suggestions(req),
        ),
        warnings=list(validation.warnings),
        metadata=_metadata(
            req,
            solver_status,
            started_at,
            lexicographic_proven=False,
        ),
        **_base_fields(req, validation),
    )


def _solver_error_response(
    req: OptimizeRequest,
    validation: ValidationResult,
    started_at: float,
    solver_status: str,
    message: str,
    solver_available: bool,
    solver_message: str | None,
) -> OptimizeResponse:
    return OptimizeResponse(
        status="ERROR",
        solver_status=solver_status,
        has_solution=False,
        solver_available=solver_available,
        solver_message=solver_message,
        solve_time_sec=round(time.perf_counter() - started_at, 3),
        diagnostics=Diagnostics(
            feasible=False,
            error_type="SOLVER",
            issues=[message],
            suggestions=[
                (
                    "Check that the configured solver (HiGHS by default) is installed "
                    "and available on the server."
                ),
                "Try a larger solver_time_limit_sec or a smaller data set.",
                "If the problem is infeasible, relax takt/headcount/machine limits.",
            ],
        ),
        warnings=list(validation.warnings),
        metadata=_metadata(
            req,
            solver_status,
            started_at,
            lexicographic_proven=False,
        ),
        **_base_fields(req, validation),
    )


def _data_suggestions(validation: ValidationResult) -> list[str]:
    suggestions = [
        "Fix the flagged data issues and run validation again.",
        "Check duplicate IDs, predecessor references and the precedence graph.",
        "Verify that every operation has at least one qualified, machine-certified worker.",
    ]
    lowered = " ".join(validation.errors).lower()
    if "cycle" in lowered:
        suggestions.insert(0, "Remove the precedence cycle before optimizing.")
    if "machine" in lowered:
        suggestions.insert(
            0, "Add an available machine or change the operation's machine_type."
        )
    if "grade" in lowered or "skill" in lowered:
        suggestions.insert(
            0, "Add a qualified worker or lower the required skill grade."
        )
    if "headcount" in lowered or "max_workers" in lowered:
        suggestions.insert(0, "Increase max_workers or reduce the target output.")
    return list(dict.fromkeys(suggestions))


def _model_suggestions(req: OptimizeRequest) -> list[str]:
    suggestions = [
        "Increase max_workers or reduce target_qty to relax the capacity requirement.",
        "Split operations whose planning SAM is above effective takt.",
        "Add machine capacity or change machine_type for bottleneck operations.",
        "Cross-train workers so more operations have eligible operators.",
    ]
    if req.config.objective == "min_workers":
        suggestions.insert(
            0,
            "For min_workers mode, effective takt is a hard constraint. Reduce "
            "target_qty, increase shift time, or add workers.",
        )
    return suggestions


def _post_warnings(
    req: OptimizeRequest,
    validation: ValidationResult,
    stations: list[Station],
    worker_summary: list[WorkerSummary],
    kpis: Kpis,
) -> list[WarningItem]:
    warnings = list(validation.warnings)
    for station in stations:
        if station.standard_utilization_pct > 100.5:
            warnings.append(
                WarningItem(
                    severity="critical",
                    code="station_over_effective_takt",
                    message=(
                        f"Station {station.station} ({station.worker_name}) is above "
                        f"effective takt ({station.standard_utilization_pct:.1f}%). "
                        "Rebalance or add capacity."
                    ),
                    station=station.station,
                    worker_id=station.worker_id,
                )
            )
        elif station.standard_utilization_pct >= 90.0:
            warnings.append(
                WarningItem(
                    severity="warning",
                    code="station_near_effective_takt",
                    message=(
                        f"Station {station.station} ({station.worker_name}) is near "
                        f"effective takt ({station.standard_utilization_pct:.1f}%). "
                        "Monitor this station."
                    ),
                    station=station.station,
                    worker_id=station.worker_id,
                )
            )
        elif station.standard_utilization_pct < 60.0:
            warnings.append(
                WarningItem(
                    severity="info",
                    code="station_underutilized",
                    message=(
                        f"Station {station.station} ({station.worker_name}) is underutilized "
                        f"({station.standard_utilization_pct:.1f}%). Consider combining tasks."
                    ),
                    station=station.station,
                    worker_id=station.worker_id,
                )
            )

    unused = [worker for worker in worker_summary if not worker.used]
    if unused:
        warnings.append(
            WarningItem(
                severity="info",
                code="unused_workers",
                message=(
                    f"{len(unused)} available worker(s) are not used: "
                    + ", ".join(worker.worker_name for worker in unused[:8])
                    + ("..." if len(unused) > 8 else "")
                ),
            )
        )

    if len(stations) >= validation.max_workers:
        warnings.append(
            WarningItem(
                severity="info",
                code="headcount_limit_binding",
                message=(
                    f"The solution uses {len(stations)} of {validation.max_workers} allowed "
                    "workers. The headcount limit is binding."
                ),
            )
        )

    if kpis.capacity_per_shift + 1e-6 < req.config.target_qty:
        warnings.append(
            WarningItem(
                severity="critical",
                code="capacity_target_not_met",
                message=(
                    f"Projected capacity is {kpis.capacity_per_shift:.0f} pcs/shift against "
                    f"a target of {req.config.target_qty} pcs at "
                    f"{req.config.planned_efficiency:.0%} planned efficiency. "
                    f"The line is short by "
                    f"{req.config.target_qty - kpis.capacity_per_shift:.0f} pcs."
                ),
            )
        )
    return warnings


def _post_suggestions(
    req: OptimizeRequest,
    warnings: list[WarningItem],
    stations: list[Station],
) -> list[str]:
    suggestions: list[str] = []
    codes = {warning.code for warning in warnings}
    if "single_point_of_failure" in codes:
        suggestions.append(
            "Cross-train at least one backup worker for single-point operations."
        )
    if "station_over_effective_takt" in codes or "capacity_target_not_met" in codes:
        suggestions.append(
            "Move work from the bottleneck station, split the longest operation, or "
            "improve planned efficiency."
        )
    if "unused_workers" in codes:
        suggestions.append(
            "Use unused qualified workers for bottleneck relief or reduce max_workers."
        )
    if "machine_capacity_shared" in codes:
        suggestions.append(
            "Check machine allocation and add capacity for shared machine types."
        )
    if req.config.objective == "min_bottleneck" and stations:
        suggestions.append(
            "Run a second scenario with min_workers to compare headcount against bottleneck time."
        )
    return list(dict.fromkeys(suggestions))


def _verify_solution(
    req: OptimizeRequest,
    validation: ValidationResult,
    station_ops: dict[int, list],
    station_worker: dict[int, Worker],
) -> list[str]:
    issues: list[str] = []
    seen_ops: dict[str, int] = {}
    seen_workers: dict[str, int] = {}
    station_of: dict[str, int] = {}
    for station, operations in station_ops.items():
        worker = station_worker[station]
        for operation in operations:
            seen_ops[operation.id] = seen_ops.get(operation.id, 0) + 1
            station_of[operation.id] = station
            if skill_grade(worker, operation) < operation.skill_required:
                issues.append(
                    f"{operation.id} is assigned to {worker.id} below required grade."
                )
            if not worker_can_operate_machine(worker, operation.machine_type):
                issues.append(
                    f"{operation.id} needs {operation.machine_type}, but {worker.id} "
                    "is not certified."
                )
        seen_workers[worker.id] = seen_workers.get(worker.id, 0) + 1

    if len(seen_ops) != len(req.operations):
        issues.append("Not every operation was assigned exactly once.")
    if any(count != 1 for count in seen_ops.values()):
        issues.append("An operation was assigned more than once.")
    if any(count != 1 for count in seen_workers.values()):
        issues.append("A worker was assigned to more than one station.")
    for predecessor, successor in validation.precedence_pairs:
        if station_of.get(predecessor, 0) > station_of.get(successor, 0):
            issues.append(f"Precedence violated: {predecessor} after {successor}.")
    return issues


def _extract_solution(
    req: OptimizeRequest,
    validation: ValidationResult,
    model: ModelVars,
    started_at: float,
    *,
    response_status: ResponseStatus,
    solver_status: str,
    solver_available: bool,
    solver_message: str | None,
    lexicographic_proven: bool,
    stage1_objective: float | None,
    stage2_objective: float | None,
) -> OptimizeResponse:
    operations = req.operations
    operation_by_id = validation.operation_by_id
    workers = validation.available_workers

    used_stations = [
        station for station in model.stations if _value(model.z[station]) > 0.5
    ]
    if not used_stations:
        return _solver_error_response(
            req,
            validation,
            started_at,
            "EXTRACTION_ERROR",
            "The solver returned no used station.",
            solver_available,
            solver_message,
        )

    worker_by_station: dict[int, Worker] = {}
    for station in used_stations:
        for worker in workers:
            if _value(model.y[station][worker.id]) > 0.5:
                worker_by_station[station] = worker
                break
        if station not in worker_by_station:
            return _solver_error_response(
                req,
                validation,
                started_at,
                "EXTRACTION_ERROR",
                f"Station {station} has no assigned worker.",
                solver_available,
                solver_message,
            )

    operations_by_station: dict[int, list] = {station: [] for station in used_stations}
    for operation in operations:
        assigned_station = None
        for station in used_stations:
            if _value(model.x[operation.id][station]) > 0.5:
                assigned_station = station
                break
        if assigned_station is None:
            return _solver_error_response(
                req,
                validation,
                started_at,
                "EXTRACTION_ERROR",
                f"Operation {operation.id} is not assigned to any station.",
                solver_available,
                solver_message,
            )
        operations_by_station[assigned_station].append(operation)

    topo_index = {
        operation_id: index for index, operation_id in enumerate(validation.topo_order)
    }
    for station in used_stations:
        operations_by_station[station].sort(
            key=lambda operation: topo_index.get(operation.id, 0)
        )

    verification_issues = _verify_solution(
        req, validation, operations_by_station, worker_by_station
    )
    if verification_issues:
        return _solver_error_response(
            req,
            validation,
            started_at,
            "VERIFICATION_ERROR",
            "Solver solution failed post-check: " + "; ".join(verification_issues),
            solver_available,
            solver_message,
        )

    ordered_stations = sorted(used_stations)
    station_number = {
        station: index for index, station in enumerate(ordered_stations, start=1)
    }

    max_load = max(
        sum(
            validation.planning_sam[operation.id]
            for operation in operations_by_station[station]
        )
        for station in ordered_stations
    )

    stations_out: list[Station] = []
    assignment: list[AssignedOperation] = []

    for station in ordered_stations:
        worker = worker_by_station[station]
        station_operations = operations_by_station[station]
        load = sum(
            validation.planning_sam[operation.id] for operation in station_operations
        )
        machine_types = [
            machine_type
            for machine_type in sorted(validation.required_machine_types)
            if _value(model.m[station].get(machine_type)) > 0.5
        ]
        station_out = build_station(
            station_number=station_number[station],
            worker=worker,
            operations=station_operations,
            machine_types=machine_types,
            planning_sam=validation.planning_sam,
            takt_time_sec=validation.takt_time_sec,
            effective_takt_time_sec=validation.effective_takt_time_sec,
            planned_efficiency=req.config.planned_efficiency,
            is_bottleneck=abs(load - max_load) <= 1e-6,
        )
        stations_out.append(station_out)
        for sequence, operation in enumerate(station_operations, start=1):
            grade = skill_grade(worker, operation)
            assignment.append(
                AssignedOperation(
                    id=operation.id,
                    name=operation.name,
                    sam_sec=operation.sam_sec,
                    planning_sam_sec=validation.planning_sam[operation.id],
                    machine_type=operation.machine_type,
                    skill_code=operation.skill_code,
                    skill_required=operation.skill_required,
                    skill_grade=grade,
                    skill_surplus=max(0, grade - operation.skill_required),
                    is_quality_gate=operation.is_quality_gate,
                    station=station_out.station,
                    sequence_in_station=sequence,
                    worker_id=worker.id,
                    worker_name=worker.name,
                )
            )

    assignment.sort(key=lambda item: (item.station, item.sequence_in_station))

    used_worker_ids = {worker.id for worker in worker_by_station.values()}
    worker_summary: list[WorkerSummary] = []
    for worker in workers:
        operation_ids = [
            operation.id
            for station in ordered_stations
            if worker_by_station[station].id == worker.id
            for operation in operations_by_station[station]
        ]
        operation_ids.sort(key=lambda operation_id: topo_index.get(operation_id, 0))
        qualified = sum(
            1
            for operation in operations
            if (operation.id, worker.id) in validation.eligible
        )
        worker_summary.append(
            WorkerSummary(
                worker_id=worker.id,
                worker_name=worker.name,
                used=worker.id in used_worker_ids,
                station=next(
                    (
                        station_number[station]
                        for station in ordered_stations
                        if worker_by_station[station].id == worker.id
                    ),
                    None,
                ),
                operation_ids=operation_ids,
                assigned_sam_sec=round(
                    sum(
                        operation_by_id[operation_id].sam_sec
                        for operation_id in operation_ids
                    ),
                    3,
                ),
                assigned_planning_sam_sec=round(
                    sum(
                        validation.planning_sam[operation_id]
                        for operation_id in operation_ids
                    ),
                    3,
                ),
                skills=worker.skills,
                machine_types=worker.machine_types,
                qualified_operations=qualified,
                versatility_pct=round(qualified / len(operations) * 100, 2),
            )
        )

    kpis = compute_kpis(
        stations=stations_out,
        takt_time_sec=validation.takt_time_sec,
        effective_takt_time_sec=validation.effective_takt_time_sec,
        available_seconds=validation.net_available_seconds,
        target_qty=req.config.target_qty,
        planned_efficiency=req.config.planned_efficiency,
    )

    warnings = _post_warnings(req, validation, stations_out, worker_summary, kpis)
    baseline_comparison = build_baseline_comparison(req, validation, stations_out, kpis)
    if baseline_comparison is not None and baseline_comparison.violations:
        warnings.append(
            WarningItem(
                severity="warning",
                code="baseline_violations",
                message=(
                    f"The current-state baseline has {len(baseline_comparison.violations)} "
                    "constraint violation(s); see the baseline comparison for details."
                ),
            )
        )

    planning = build_planning_summary(
        req=req,
        validation=validation,
        stations=stations_out,
        worker_summary=worker_summary,
        kpis=kpis,
    )
    actuals_analysis = analyze_actuals(req)

    return OptimizeResponse(
        status=response_status,
        solver_status=solver_status,
        has_solution=True,
        solver_available=solver_available,
        solver_message=solver_message,
        solve_time_sec=round(time.perf_counter() - started_at, 3),
        stations=stations_out,
        assignment=assignment,
        worker_summary=worker_summary,
        kpis=kpis,
        planning=planning,
        baseline_comparison=baseline_comparison,
        actuals_analysis=actuals_analysis,
        warnings=warnings,
        diagnostics=Diagnostics(
            feasible=True,
            error_type="NONE",
            issues=[],
            suggestions=_post_suggestions(req, warnings, stations_out),
        ),
        metadata=_metadata(
            req,
            solver_status,
            started_at,
            lexicographic_proven=lexicographic_proven,
            stage1_objective=stage1_objective,
            stage2_objective=stage2_objective,
        ),
        **_base_fields(req, validation),
    )


def _stage_objective(req: OptimizeRequest, model: ModelVars, *, stage: int) -> float:
    """Return the objective value optimized by one lexicographic stage.

    ``min_bottleneck`` minimizes Cmax first and the used-station count second;
    ``min_workers`` uses the opposite order. Reporting Cmax for both stages (or
    the station count for both stages) makes the metadata contradict the model,
    even when the assignment itself is correct.
    """
    if stage not in (1, 2):
        raise ValueError(f"Lexicographic stage must be 1 or 2, got {stage}.")

    minimize_cmax = (req.config.objective == "min_bottleneck" and stage == 1) or (
        req.config.objective == "min_workers" and stage == 2
    )
    if minimize_cmax:
        return round(_value(model.cmax), 6)
    return float(sum(1 for station in model.stations if _value(model.z[station]) > 0.5))


def solve_line_balancing(req: OptimizeRequest) -> OptimizeResponse:
    started_at = time.perf_counter()
    validation = validate_request(req)
    solver_available, solver_path = check_solver()
    solver_message = f"{SOLVER_BACKEND.upper()}: {solver_path}" if solver_path else None

    if validation.errors:
        return _data_error_response(
            req,
            validation,
            started_at,
            solver_available,
            solver_message,
        )

    if not solver_available:
        return _solver_error_response(
            req,
            validation,
            started_at,
            "SOLVER_UNAVAILABLE",
            f"{SOLVER_BACKEND.upper()} is not available in this environment.",
            solver_available,
            solver_message,
        )

    try:
        first = _build_model(req, validation, stage=1)
        warm_started = _apply_warm_start(first, req, validation)
        first_stats = _solve(
            first.problem,
            req.config.solver_time_limit_sec,
            warm_start=warm_started,
        )
        first_status = solver_status_name(first_stats.status)

        if first_status == "INFEASIBLE":
            return _model_infeasible_response(
                req,
                validation,
                started_at,
                solver_available,
                solver_message,
            )

        if not first_stats.has_solution:
            return _solver_error_response(
                req,
                validation,
                started_at,
                f"{first_status}_NO_SOLUTION",
                f"The solver stopped with status {first_status} and no feasible solution.",
                solver_available,
                solver_message,
            )

        stage1_objective = _stage_objective(req, first, stage=1)
        stage1_workers = sum(
            1 for station in first.stations if _value(first.z[station]) > 0.5
        )

        elapsed = time.perf_counter() - started_at
        remaining = req.config.solver_time_limit_sec - elapsed
        final_model = first
        final_status = first_status
        stage2_objective: float | None = None
        lexicographic_proven = first_status == "OPTIMAL"
        tie_break_note = ""

        if remaining >= 1.0:
            second = _build_model(
                req,
                validation,
                stage=2,
                cmax_upper=stage1_objective
                if req.config.objective == "min_bottleneck"
                else None,
                workers_fixed=stage1_workers
                if req.config.objective == "min_workers"
                else None,
            )
            second_warm_started = _apply_solution_warm_start(
                second, first, req, validation
            )
            second_stats = _solve(
                second.problem,
                remaining,
                warm_start=second_warm_started,
            )
            second_status = solver_status_name(second_stats.status)
            if second_stats.has_solution:
                final_model = second
                final_status = second_status
                stage2_objective = _stage_objective(req, second, stage=2)
                lexicographic_proven = (
                    first_status == "OPTIMAL" and second_status == "OPTIMAL"
                )
            else:
                tie_break_note = (
                    f" Tie-break stage returned {second_status} without a solution; "
                    "the stage-1 solution was retained and lexicographic optimality "
                    "is not claimed."
                )
                final_status = first_status
                lexicographic_proven = False
        else:
            tie_break_note = (
                " No time remained for the tie-break stage; lexicographic optimality "
                "is not claimed."
            )
            lexicographic_proven = False

        response_status: ResponseStatus
        if first_status == "OPTIMAL" and lexicographic_proven:
            response_status = "OPTIMAL"
        elif final_model is not None:
            response_status = "FEASIBLE_LIMIT"
        else:
            response_status = "ERROR"

        message = solver_message or ""
        if tie_break_note:
            message = (message + tie_break_note).strip()

        return _extract_solution(
            req,
            validation,
            final_model,
            started_at,
            response_status=response_status,
            solver_status=final_status,
            solver_available=solver_available,
            solver_message=message or None,
            lexicographic_proven=lexicographic_proven,
            stage1_objective=(
                round(stage1_objective, 3) if stage1_objective is not None else None
            ),
            stage2_objective=(
                round(stage2_objective, 3) if stage2_objective is not None else None
            ),
        )
    except Exception as exc:  # pragma: no cover - defensive
        return _solver_error_response(
            req,
            validation,
            started_at,
            "SOLVER_ERROR",
            f"Solver failed: {exc}",
            solver_available,
            solver_message,
        )
