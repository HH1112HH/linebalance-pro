from __future__ import annotations

import pytest

from backend.app.heuristics import build_layout
from backend.app.models import (
    BaselineAssignment,
    BaselineAssignmentItem,
    LineConfig,
    Machine,
    Operation,
    OptimizeRequest,
    Worker,
)
from backend.app.optimizer import solve_line_balancing
from backend.app.sample_data import (
    OPERATIONS,
    SAMPLE_BASELINE,
    SAMPLE_FEASIBLE_REQUEST,
    SAMPLE_REQUEST,
    WORKERS,
)


def small_request(**config_overrides) -> OptimizeRequest:
    config_values = dict(
        shift_minutes=480,
        break_minutes=30,
        target_qty=60,
        planned_efficiency=0.85,
        max_workers=2,
        solver_time_limit_sec=10,
    )
    config_values.update(config_overrides)
    return OptimizeRequest(
        line_name="Small test line",
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


def test_small_solve_respects_assignment_precedence_skill_and_machine():
    result = solve_line_balancing(small_request())

    assert result.status in {"OPTIMAL", "FEASIBLE_LIMIT"}
    assert result.has_solution is True
    assert result.kpis is not None
    assert result.diagnostics.feasible is True
    if result.status == "OPTIMAL":
        assert result.metadata.lexicographic_proven is True

    assigned = {item.id: item for item in result.assignment}
    assert set(assigned) == {"OP1", "OP2"}
    assert len(result.stations) == len({item.station for item in result.assignment})
    assert len({item.worker_id for item in result.assignment}) == len(result.stations)

    # Precedence: OP1 must be in an earlier station, or earlier inside the same station.
    if assigned["OP1"].station == assigned["OP2"].station:
        assert assigned["OP1"].sequence_in_station < assigned["OP2"].sequence_in_station
    else:
        assert assigned["OP1"].station < assigned["OP2"].station

    # OP2 needs SINGLE machine certification; only W1 has it.
    assert assigned["OP2"].worker_id == "W1"
    assert assigned["OP2"].machine_type == "SINGLE"

    # Station load must equal the sum of its planning SAM.
    for station in result.stations:
        expected = sum(
            assigned[operation_id].planning_sam_sec
            for operation_id in station.operation_ids
        )
        assert station.standard_load_sec == pytest.approx(expected)

    assert result.kpis.bottleneck_load_sec == pytest.approx(
        max(station.standard_load_sec for station in result.stations)
    )
    assert result.kpis.capacity_per_shift == pytest.approx(
        result.kpis.available_seconds
        * result.kpis.planned_efficiency
        / result.kpis.bottleneck_load_sec,
        abs=0.1,
    )


def test_allowance_is_applied_once_in_optimizer_sam():
    result = solve_line_balancing(
        small_request(sam_basis="EXCLUDES_ALLOWANCE", allowance_pct=0.20)
    )

    assert result.has_solution is True
    assigned = {item.id: item for item in result.assignment}
    assert assigned["OP1"].planning_sam_sec == pytest.approx(24.0)
    assert assigned["OP2"].planning_sam_sec == pytest.approx(36.0)
    assert result.kpis is not None
    assert result.kpis.total_planning_sam_sec == pytest.approx(60.0)
    assert result.kpis.total_sam_sec == pytest.approx(50.0)


def test_baseline_comparison_is_computed_from_input_assignment():
    request = small_request()
    request.baseline_assignment = BaselineAssignment(
        items=[
            BaselineAssignmentItem(
                operation_id="OP1", station_id="ST01", worker_id="W2"
            ),
            BaselineAssignmentItem(
                operation_id="OP2", station_id="ST02", worker_id="W1"
            ),
        ],
        source_note="Synthetic test baseline",
    )

    result = solve_line_balancing(request)

    assert result.baseline_comparison is not None
    comparison = result.baseline_comparison
    assert comparison.before is not None
    assert comparison.violations == []
    assert comparison.station_delta == (
        comparison.after.stations_used - comparison.before.stations_used
    )
    assert comparison.worker_delta == (
        comparison.after.workers_used - comparison.before.workers_used
    )
    assert comparison.bottleneck_delta_sec == pytest.approx(
        comparison.before.bottleneck_load_sec - comparison.after.bottleneck_load_sec
    )


def test_no_baseline_returns_no_comparison():
    result = solve_line_balancing(small_request())

    assert result.baseline_comparison is None


def test_sample_baseline_layout_is_24_stations_61_seconds():
    layout = build_layout(
        OPERATIONS,
        WORKERS,
        sam_by_id={operation.id: operation.sam_sec for operation in OPERATIONS},
        target_sec=60.0,
        max_stations=24,
    )

    assert layout is not None
    assert layout.station_count == 24
    assert layout.max_load == pytest.approx(61.0)
    assert len(layout.worker_ids) == 24
    assert set(layout.assignment) == {operation.id for operation in OPERATIONS}


def test_sample_requests_have_expected_scope():
    assert SAMPLE_REQUEST.config.target_qty == 420
    assert SAMPLE_REQUEST.config.max_workers == 24
    assert SAMPLE_REQUEST.config.solver_time_limit_sec == 60
    assert len(SAMPLE_BASELINE.items) == 40
    assert len({item.station_id for item in SAMPLE_BASELINE.items}) == 24
    assert len({item.worker_id for item in SAMPLE_BASELINE.items}) == 24

    assert SAMPLE_FEASIBLE_REQUEST.config.target_qty == 400
    assert SAMPLE_FEASIBLE_REQUEST.config.max_workers == 26
    assert len(SAMPLE_FEASIBLE_REQUEST.workers) == 26
