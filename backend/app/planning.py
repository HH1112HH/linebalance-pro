from __future__ import annotations

from .models import (
    CapacityPlan,
    HeadcountControl,
    HeadcountStandard,
    Kpis,
    MachineRequirement,
    OptimizeRequest,
    PlanningSummary,
    SkillCoverageItem,
    Station,
    TransferSuggestion,
    WorkerSummary,
)
from .utils import pct, safe_div
from .validation import ValidationResult


def _headcount_standard(
    req: OptimizeRequest, validation: ValidationResult
) -> HeadcountStandard:
    available_hc = max(1, len(validation.available_workers))
    if req.headcount_standard is not None:
        return req.headcount_standard
    return HeadcountStandard(
        line_id=req.line_name,
        work_center="SEWING",
        standard_hc=max(1, validation.max_workers or available_hc),
        planned_hc=max(1, validation.max_workers or available_hc),
        actual_hc=available_hc,
    )


def _machine_requirements(
    req: OptimizeRequest,
    validation: ValidationResult,
    stations: list[Station],
) -> list[MachineRequirement]:
    requirements: list[MachineRequirement] = []
    for machine_type in sorted(validation.required_machine_types):
        optimized_stations = sum(
            1 for station in stations if machine_type in station.machine_types
        )
        operation_count = sum(
            1 for operation in req.operations if operation.machine_type == machine_type
        )
        required = optimized_stations or operation_count
        available = validation.machine_capacity.get(machine_type, 0)
        requirements.append(
            MachineRequirement(
                machine_type=machine_type,
                required_stations=required,
                available_capacity=available,
                gap=required - available,
                coverage_pct=round(
                    min(100.0, pct(available, required)) if required else 100.0, 2
                ),
                demand_ratio_pct=round(
                    pct(required, available) if available else 0.0, 2
                ),
                basis="optimized_stations" if optimized_stations else "operation_count",
            )
        )
    return requirements


def _skill_coverage(validation: ValidationResult) -> list[SkillCoverageItem]:
    items: list[SkillCoverageItem] = []
    for operation in validation.operation_by_id.values():
        worker_ids = sorted(
            worker.id
            for worker in validation.available_workers
            if (operation.id, worker.id) in validation.eligible
        )
        eligible = len(worker_ids)
        status = "critical" if eligible == 0 else "tight" if eligible == 1 else "ok"
        items.append(
            SkillCoverageItem(
                operation_id=operation.id,
                operation_name=operation.name,
                required_grade=operation.skill_required,
                eligible_workers=eligible,
                worker_ids=worker_ids,
                status=status,
            )
        )
    items.sort(key=lambda item: (item.eligible_workers, item.operation_id))
    return items


def _transfer_suggestions(
    validation: ValidationResult,
    stations: list[Station],
    worker_summary: list[WorkerSummary],
) -> list[TransferSuggestion]:
    if not stations:
        return []
    bottleneck = max(stations, key=lambda station: station.standard_load_sec)
    bottleneck_operation_ids = set(bottleneck.operation_ids)
    unused = [worker for worker in worker_summary if not worker.used]
    suggestions: list[TransferSuggestion] = []
    for worker in unused:
        qualified = sorted(
            operation_id
            for operation_id in bottleneck_operation_ids
            if (operation_id, worker.worker_id) in validation.eligible
        )
        if qualified:
            suggestions.append(
                TransferSuggestion(
                    worker_id=worker.worker_id,
                    worker_name=worker.worker_name,
                    reason=(
                        f"Unused and qualified for bottleneck station "
                        f"{bottleneck.station} ({bottleneck.standard_load_sec:.1f}s)."
                    ),
                    suggested_operation_ids=qualified,
                )
            )
    return suggestions[:8]


def build_planning_summary(
    req: OptimizeRequest,
    validation: ValidationResult,
    stations: list[Station],
    worker_summary: list[WorkerSummary],
    kpis: Kpis,
) -> PlanningSummary:
    garment_sam_min = sum(operation.sam_sec for operation in req.operations) / 60.0
    garment_planning_sam_min = sum(validation.planning_sam.values()) / 60.0
    net_shift_minutes = validation.net_available_seconds / 60.0
    working_days = req.config.working_days
    planned_efficiency = req.config.planned_efficiency
    target_qty_per_day = req.config.target_qty
    period_target_qty = target_qty_per_day * working_days
    available_hc = len(validation.available_workers)
    available_minutes_per_worker = net_shift_minutes * working_days

    required_hc = safe_div(
        period_target_qty * garment_planning_sam_min,
        available_minutes_per_worker * planned_efficiency,
    )
    # Theoretical capacity ignores precedence, machine and balance constraints.
    # The realistic capacity is the optimizer's bottleneck-constrained capacity.
    theoretical_daily_capacity = safe_div(
        available_hc * net_shift_minutes * planned_efficiency,
        garment_planning_sam_min,
    )
    bottleneck_daily_capacity = kpis.capacity_per_shift
    daily_capacity = bottleneck_daily_capacity
    period_capacity = daily_capacity * working_days
    capacity_gap = period_capacity - period_target_qty
    capacity_achievement = pct(period_capacity, period_target_qty)
    theoretical_achievement = pct(
        theoretical_daily_capacity * working_days, period_target_qty
    )

    capacity = CapacityPlan(
        garment_sam_min=round(garment_sam_min, 4),
        garment_planning_sam_min=round(garment_planning_sam_min, 4),
        net_shift_minutes=round(net_shift_minutes, 2),
        working_days=working_days,
        planned_efficiency=planned_efficiency,
        sam_basis=req.config.sam_basis,
        allowance_applied_pct=round(validation.allowance_applied_pct, 2),
        target_qty_per_day=target_qty_per_day,
        period_target_qty=period_target_qty,
        required_hc=round(required_hc, 2),
        available_hc=available_hc,
        hc_gap=round(required_hc - available_hc, 2),
        theoretical_capacity_per_shift=round(theoretical_daily_capacity, 1),
        bottleneck_capacity_per_shift=round(bottleneck_daily_capacity, 1),
        daily_capacity=round(daily_capacity, 1),
        period_capacity=round(period_capacity, 1),
        capacity_gap=round(capacity_gap, 1),
        capacity_achievement_pct=round(capacity_achievement, 2),
        theoretical_capacity_achievement_pct=round(theoretical_achievement, 2),
        machine_requirements=_machine_requirements(req, validation, stations),
        notes=[
            "Net available time = (shift minutes - break minutes) x 60. "
            "Allowance is applied once inside planning SAM, never again here.",
            "Theoretical capacity = available HC x net shift minutes x planned "
            "efficiency / planning garment SAM. It ignores precedence, machine "
            "and line-balance constraints, so it is not a promise of output.",
            "Daily/period capacity and target achievement use the optimizer's "
            "bottleneck-constrained capacity, not the theoretical capacity.",
            "Required HC is a theoretical estimate. Skill, machine, precedence and "
            "bottleneck constraints can require more people than this estimate.",
        ],
    )

    standard = _headcount_standard(req, validation)
    actual_hc = standard.actual_hc
    attendance_hc = (
        req.actuals.attendance_hc
        if req.actuals is not None and req.actuals.attendance_hc is not None
        else actual_hc
    )
    optimized_hc = kpis.workers_used
    headcount = HeadcountControl(
        line_id=standard.line_id,
        work_center=standard.work_center,
        standard_hc=standard.standard_hc,
        planned_hc=standard.planned_hc,
        actual_hc=actual_hc,
        attendance_hc=attendance_hc,
        optimized_hc=optimized_hc,
        hc_gap=actual_hc - standard.standard_hc,
        adherence_pct=round(pct(actual_hc, standard.standard_hc), 2),
        attendance_pct=round(pct(attendance_hc, actual_hc), 2),
        skill_coverage=_skill_coverage(validation),
        transfer_suggestions=_transfer_suggestions(
            validation, stations, worker_summary
        ),
        notes=[
            "HC gap = actual HC - standard HC; positive means excess, negative means shortage.",
            "Attendance is a manual input in the MVP; there is no HR/MES integration.",
            "Optimized HC is the number of stations used by the MILP solution.",
            "Transfer suggestions only include unused workers who are eligible for "
            "the bottleneck operation.",
        ],
    )

    return PlanningSummary(capacity=capacity, headcount=headcount)
