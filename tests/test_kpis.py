from __future__ import annotations

import math

import pytest

from backend.app.kpis import build_station, compute_kpis, station_status
from backend.app.models import LineConfig, Operation, Station, Worker
from backend.app.utils import (
    calculate_time_study,
    effective_allowance_pct,
    effective_takt_time_sec,
    net_available_seconds,
    planning_sam_sec,
    takt_time_sec,
)


def make_station(number: int, load: float) -> Station:
    return Station(
        station=number,
        worker_id=f"W{number}",
        worker_name=f"Worker {number}",
        operation_ids=[f"OP{number}"],
        operation_names=[f"Operation {number}"],
        machine_types=[],
        standard_load_sec=load,
        raw_sam_sec=load,
        standard_utilization_pct=0.0,
        idle_sec=0.0,
        overload_sec=0.0,
        capacity_pcs_h=0.0,
        status="normal",
    )


def base_config(**overrides) -> LineConfig:
    values = dict(
        shift_minutes=480,
        break_minutes=30,
        target_qty=420,
        planned_efficiency=0.85,
    )
    values.update(overrides)
    return LineConfig(**values)


def test_time_bases_demand_takt_and_effective_takt():
    config = base_config()

    assert net_available_seconds(config) == pytest.approx(27_000.0)
    assert takt_time_sec(config) == pytest.approx(64.285714, rel=1e-6)
    assert effective_takt_time_sec(config) == pytest.approx(54.642857, rel=1e-6)


def test_allowance_included_is_not_applied_twice():
    config = base_config(sam_basis="INCLUDES_ALLOWANCE", allowance_pct=0.125)
    operation = Operation(id="OP1", name="May", sam_sec=40.0)

    assert effective_allowance_pct(config) == 0.0
    assert planning_sam_sec(operation, config) == pytest.approx(40.0)


def test_allowance_excluded_is_applied_once():
    config = base_config(sam_basis="EXCLUDES_ALLOWANCE", allowance_pct=0.125)
    operation = Operation(id="OP1", name="May", sam_sec=40.0)

    assert effective_allowance_pct(config) == pytest.approx(0.125)
    assert planning_sam_sec(operation, config) == pytest.approx(45.0)


def test_time_study_aggregate_formula():
    normal, standard = calculate_time_study(
        observed_time_sec=40.0,
        performance_rating=1.10,
        allowance_pct=0.125,
    )

    assert normal == pytest.approx(44.0)
    assert standard == pytest.approx(49.5)


def test_station_status_thresholds():
    assert station_status(101.0, False) == "bottleneck"
    assert station_status(100.5, False) == "watch"
    assert station_status(90.0, False) == "watch"
    assert station_status(60.0, False) == "normal"
    assert station_status(59.9, False) == "underutilized"
    assert station_status(10.0, True) == "bottleneck"


def test_build_station_uses_effective_takt_and_planning_sam():
    config = base_config()
    worker = Worker(id="W1", name="Worker 1", skills={"OP1": 2, "OP2": 2})
    operations = [
        Operation(id="OP1", name="May 1", sam_sec=20.0),
        Operation(id="OP2", name="May 2", sam_sec=28.0),
    ]

    station = build_station(
        station_number=1,
        worker=worker,
        operations=operations,
        machine_types=[],
        planning_sam={operation.id: operation.sam_sec for operation in operations},
        takt_time_sec=takt_time_sec(config),
        effective_takt_time_sec=effective_takt_time_sec(config),
        planned_efficiency=config.planned_efficiency,
        is_bottleneck=False,
    )

    assert station.standard_load_sec == pytest.approx(48.0)
    assert station.raw_sam_sec == pytest.approx(48.0)
    assert station.standard_utilization_pct == pytest.approx(87.84, abs=0.01)
    assert station.idle_sec == pytest.approx(6.643, abs=0.001)
    assert station.overload_sec == 0.0
    assert station.capacity_pcs_h == pytest.approx(63.75)
    assert station.status == "normal"


def test_line_kpis_with_known_loads():
    config = base_config()
    stations = [
        make_station(1, 48.0),
        make_station(2, 30.0),
        make_station(3, 58.0),
        make_station(4, 40.0),
    ]

    kpis = compute_kpis(
        stations=stations,
        takt_time_sec=takt_time_sec(config),
        effective_takt_time_sec=effective_takt_time_sec(config),
        available_seconds=net_available_seconds(config),
        target_qty=config.target_qty,
        planned_efficiency=config.planned_efficiency,
    )

    assert kpis.workers_used == 4
    assert kpis.total_planning_sam_sec == pytest.approx(176.0)
    assert kpis.bottleneck_station == 3
    assert kpis.bottleneck_load_sec == pytest.approx(58.0)
    assert kpis.planned_labor_utilization_pct == pytest.approx(68.44, abs=0.01)
    assert kpis.balance_efficiency_pct == pytest.approx(75.86, abs=0.01)
    assert kpis.balance_delay_pct == pytest.approx(24.14, abs=0.01)
    assert kpis.smoothness_index == pytest.approx(math.sqrt(1208.0), abs=0.01)
    assert kpis.capacity_per_shift == pytest.approx(395.7, abs=0.1)
    assert kpis.target_achievement_pct == pytest.approx(94.21, abs=0.01)
    assert kpis.meets_target is False
    assert kpis.output_per_operator == pytest.approx(98.9, abs=0.1)
    assert kpis.total_idle_sec == pytest.approx(45.929, abs=0.001)
    assert kpis.total_overload_sec == pytest.approx(3.357, abs=0.001)


def test_empty_station_list_returns_zero_kpis():
    config = base_config()

    kpis = compute_kpis(
        stations=[],
        takt_time_sec=takt_time_sec(config),
        effective_takt_time_sec=effective_takt_time_sec(config),
        available_seconds=net_available_seconds(config),
        target_qty=config.target_qty,
        planned_efficiency=config.planned_efficiency,
    )

    assert kpis.workers_used == 0
    assert kpis.bottleneck_load_sec == 0.0
    assert kpis.capacity_per_shift == 0.0
    assert kpis.meets_target is False
