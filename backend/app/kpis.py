from __future__ import annotations

import math

from .models import Kpis, Operation, Station, Worker
from .utils import pct, safe_div


def station_status(utilization_pct: float, is_bottleneck: bool) -> str:
    if is_bottleneck or utilization_pct > 100.5:
        return "bottleneck"
    if utilization_pct >= 90.0:
        return "watch"
    if utilization_pct < 60.0:
        return "underutilized"
    return "normal"


def build_station(
    station_number: int,
    worker: Worker,
    operations: list[Operation],
    machine_types: list[str],
    planning_sam: dict[str, float],
    takt_time_sec: float,
    effective_takt_time_sec: float,
    planned_efficiency: float,
    is_bottleneck: bool,
) -> Station:
    standard_load = sum(planning_sam[op.id] for op in operations)
    raw_sam = sum(op.sam_sec for op in operations)
    utilization = pct(standard_load, effective_takt_time_sec)
    return Station(
        station=station_number,
        worker_id=worker.id,
        worker_name=worker.name,
        operation_ids=[op.id for op in operations],
        operation_names=[op.name for op in operations],
        machine_types=machine_types,
        standard_load_sec=round(standard_load, 3),
        raw_sam_sec=round(raw_sam, 3),
        standard_utilization_pct=round(utilization, 2),
        idle_sec=round(max(0.0, effective_takt_time_sec - standard_load), 3),
        overload_sec=round(max(0.0, standard_load - effective_takt_time_sec), 3),
        capacity_pcs_h=round(
            safe_div(3600.0 * planned_efficiency, standard_load), 2
        ),
        status=station_status(utilization, is_bottleneck),
    )


def compute_kpis(
    stations: list[Station],
    takt_time_sec: float,
    effective_takt_time_sec: float,
    available_seconds: float,
    target_qty: int,
    planned_efficiency: float,
) -> Kpis:
    if not stations:
        return Kpis(
            takt_time_sec=round(takt_time_sec, 6),
            effective_takt_time_sec=round(effective_takt_time_sec, 6),
            available_seconds=round(available_seconds, 3),
            total_sam_sec=0.0,
            total_planning_sam_sec=0.0,
            workers_used=0,
            bottleneck_station=0,
            bottleneck_load_sec=0.0,
            planned_labor_utilization_pct=0.0,
            balance_efficiency_pct=0.0,
            balance_delay_pct=0.0,
            smoothness_index=0.0,
            capacity_per_shift=0.0,
            target_qty=target_qty,
            target_achievement_pct=0.0,
            meets_target=False,
            output_per_operator=0.0,
            total_idle_sec=0.0,
            total_overload_sec=0.0,
            planned_efficiency=planned_efficiency,
        )

    workers_used = len(stations)
    total_sam = sum(station.raw_sam_sec for station in stations)
    total_planning_sam = sum(station.standard_load_sec for station in stations)
    bottleneck = max(stations, key=lambda station: station.standard_load_sec)
    bottleneck_load = bottleneck.standard_load_sec

    # Planned labor utilization at demand takt:
    # standard minutes produced at target / paid minutes at target pace.
    planned_labor_utilization = pct(
        total_planning_sam, workers_used * takt_time_sec
    )
    balance_efficiency = pct(
        total_planning_sam, workers_used * bottleneck_load
    )
    balance_delay = max(0.0, 100.0 - balance_efficiency)
    smoothness = math.sqrt(
        sum(
            (bottleneck_load - station.standard_load_sec) ** 2
            for station in stations
        )
    )

    # Capacity uses planned efficiency exactly once.
    capacity = safe_div(
        available_seconds * planned_efficiency,
        bottleneck_load,
    )
    target_achievement = pct(capacity, target_qty)
    output_per_operator = safe_div(capacity, workers_used)
    total_idle = sum(
        max(0.0, effective_takt_time_sec - station.standard_load_sec)
        for station in stations
    )
    total_overload = sum(
        max(0.0, station.standard_load_sec - effective_takt_time_sec)
        for station in stations
    )

    return Kpis(
        takt_time_sec=round(takt_time_sec, 6),
        effective_takt_time_sec=round(effective_takt_time_sec, 6),
        available_seconds=round(available_seconds, 3),
        total_sam_sec=round(total_sam, 3),
        total_planning_sam_sec=round(total_planning_sam, 3),
        workers_used=workers_used,
        bottleneck_station=bottleneck.station,
        bottleneck_load_sec=round(bottleneck_load, 3),
        planned_labor_utilization_pct=round(planned_labor_utilization, 2),
        balance_efficiency_pct=round(balance_efficiency, 2),
        balance_delay_pct=round(balance_delay, 2),
        smoothness_index=round(smoothness, 2),
        capacity_per_shift=round(capacity, 1),
        target_qty=target_qty,
        target_achievement_pct=round(target_achievement, 2),
        meets_target=capacity + 1e-9 >= target_qty,
        output_per_operator=round(output_per_operator, 1),
        total_idle_sec=round(total_idle, 3),
        total_overload_sec=round(total_overload, 3),
        planned_efficiency=planned_efficiency,
    )
