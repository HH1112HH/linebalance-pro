from __future__ import annotations

from .models import ActualsAnalysis, OptimizeRequest
from .utils import pct, planning_sam_sec


def analyze_actuals(req: OptimizeRequest) -> ActualsAnalysis | None:
    actuals = req.actuals
    if actuals is None and not req.daily_actuals:
        return None

    notes: list[str] = []
    if req.daily_actuals:
        period_days = len(req.daily_actuals)
        target_output = sum(row.target_output for row in req.daily_actuals)
        actual_output = sum(row.actual_output for row in req.daily_actuals)
        downtime_minutes = sum(row.downtime_minutes for row in req.daily_actuals)
        labor_values = [
            row.actual_direct_labor_minutes
            for row in req.daily_actuals
            if row.actual_direct_labor_minutes is not None
        ]
        actual_direct_labor_minutes = (
            round(sum(labor_values), 3) if labor_values else None
        )
        if len(labor_values) < period_days:
            notes.append(
                f"Direct labor minutes are missing for {period_days - len(labor_values)} "
                "day(s); actual labor efficiency uses only the reported days."
            )
    elif actuals is not None:
        period_days = 1
        target_output = req.config.target_qty
        actual_output = actuals.actual_output or 0
        actual_direct_labor_minutes = actuals.actual_direct_labor_minutes
        downtime_minutes = actuals.downtime_minutes or 0
    else:  # pragma: no cover - guarded by the early return
        return None

    # Earned standard minutes must use the same SAM basis as planning:
    # allowance is applied once when sam_basis = EXCLUDES_ALLOWANCE.
    garment_planning_sam_min = (
        sum(planning_sam_sec(op, req.config) for op in req.operations) / 60.0
    )
    production_achievement = pct(actual_output, target_output)
    actual_labor_efficiency = None
    if actual_direct_labor_minutes and actual_direct_labor_minutes > 0:
        actual_labor_efficiency = pct(
            actual_output * garment_planning_sam_min,
            actual_direct_labor_minutes,
        )
    else:
        notes.append(
            "Actual labor efficiency is not calculated because actual direct labor "
            "minutes were not provided. Elapsed shift time is not a substitute."
        )

    downtime_by_category: dict[str, float] = {}
    for event in req.downtime_events:
        downtime_by_category[event.loss_category] = round(
            downtime_by_category.get(event.loss_category, 0.0) + event.duration_minutes,
            3,
        )
    event_total = sum(downtime_by_category.values())
    if downtime_minutes > event_total + 1e-6:
        downtime_by_category["UNSPECIFIED"] = round(
            downtime_by_category.get("UNSPECIFIED", 0.0)
            + (downtime_minutes - event_total),
            3,
        )
    if req.downtime_events and abs(event_total - downtime_minutes) > 1e-6:
        notes.append(
            "Downtime events and the summary downtime differ; the summary value is "
            "used for total downtime, and the category table shows event-level detail."
        )

    planned_minutes = req.config.shift_minutes * period_days
    downtime_pct = pct(downtime_minutes, planned_minutes)
    notes.append(
        "Production achievement uses the reported target for the same period. "
        "Actual labor efficiency uses planning SAM (allowance applied once), not raw SAM. "
        "Downtime percentage uses planned shift minutes, not net available minutes."
    )

    return ActualsAnalysis(
        period_days=period_days,
        target_output=target_output,
        actual_output=actual_output,
        production_achievement_pct=round(production_achievement, 2),
        actual_direct_labor_minutes=actual_direct_labor_minutes,
        actual_labor_efficiency_pct=(
            round(actual_labor_efficiency, 2)
            if actual_labor_efficiency is not None
            else None
        ),
        downtime_minutes=round(downtime_minutes, 3),
        downtime_pct_of_planned_time=round(downtime_pct, 2),
        downtime_by_category=downtime_by_category,
        notes=notes,
    )
