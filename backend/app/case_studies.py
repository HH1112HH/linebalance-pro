from __future__ import annotations

import math
from collections.abc import Sequence
from typing import Literal

from .models import (
    LayoutCaseStudyResponse,
    LayoutPhaseSummary,
    LayoutRouteObservation,
    QualityCaseStudyResponse,
    QualityDailyPoint,
    QualityDefectComparison,
    QualityDefectRecord,
    QualityInspectionRecord,
    QualityParetoRow,
    QualityPChartPhase,
    QualityPhaseSummary,
    QualitySetupAuditRow,
    QualitySetupAuditSummary,
    TwoProportionTest,
)
from .utils import pct, safe_div

PCT_DIGITS = 2
METRIC_DIGITS = 2
P_VALUE_DIGITS = 4
Z_95 = 1.96
P_CHART_SIGMA = 3.0
DPMO_SCALE = 1_000_000
Z_BENCHMARK_OFFSET = 0.8406
Z_BENCHMARK_SCALE = 29.37
Z_BENCHMARK_DPMO_FACTOR = 2.221
CaseStudyPhase = Literal["BEFORE", "AFTER"]
PHASES: tuple[CaseStudyPhase, ...] = ("BEFORE", "AFTER")


def analyze_quality_case_study(
    *,
    line_id: str,
    style_code: str,
    operation_id: str,
    operation_name: str,
    misalignment_defect_code: str,
    inspections: Sequence[QualityInspectionRecord],
    defects: Sequence[QualityDefectRecord],
    audits: Sequence[QualitySetupAuditRow],
) -> QualityCaseStudyResponse:
    """Aggregate the T07 quality RCA dataset.

    Validates that per-day defect rows reconcile with the inspection summary,
    then returns Pareto shares, FPY, rework, DPMO/Z-benchmark, p-chart limits
    and a two-proportion z-test. The function is pure and deterministic; the
    numbers are synthetic case-study metrics, not production claims.
    """
    inspection_by_day: dict[tuple[str, str], QualityInspectionRecord] = {}
    inspections_by_phase: dict[str, list[QualityInspectionRecord]] = {
        phase: [] for phase in PHASES
    }
    for item in inspections:
        inspection_key = (item.phase, item.date)
        if inspection_key in inspection_by_day:
            raise ValueError(f"Duplicate inspection day {item.phase} {item.date}.")
        inspection_by_day[inspection_key] = item
        inspections_by_phase[item.phase].append(item)

    for phase in PHASES:
        if not inspections_by_phase[phase]:
            raise ValueError(f"Missing inspection data for phase {phase}.")

    type_totals: dict[str, dict[str, int]] = {phase: {} for phase in PHASES}
    defect_names: dict[str, str] = {}
    defects_per_day: dict[tuple[str, str], int] = {}
    for defect in defects:
        defect_key = (defect.phase, defect.date)
        if defect_key not in inspection_by_day:
            raise ValueError(
                f"Defect row has no inspection record for {defect.phase} {defect.date}."
            )
        known_name = defect_names.setdefault(defect.defect_code, defect.defect_type)
        if known_name != defect.defect_type:
            raise ValueError(
                f"Defect code {defect.defect_code} has conflicting type labels."
            )
        phase_types = type_totals[defect.phase]
        phase_types[defect.defect_code] = (
            phase_types.get(defect.defect_code, 0) + defect.defect_count
        )
        defects_per_day[defect_key] = (
            defects_per_day.get(defect_key, 0) + defect.defect_count
        )

    for record_key, inspection in inspection_by_day.items():
        if defects_per_day.get(record_key, 0) != inspection.defect_count:
            raise ValueError(
                "Defect rows do not reconcile with the inspection summary for "
                f"{record_key[0]} {record_key[1]}."
            )

    p_chart: list[QualityPChartPhase] = []
    phases: list[QualityPhaseSummary] = []
    daily: list[QualityDailyPoint] = []

    for phase in PHASES:
        days = sorted(inspections_by_phase[phase], key=lambda item: item.date)
        total_inspected = sum(item.inspected_pcs for item in days)
        total_defects = sum(item.defect_count for item in days)
        total_rework = sum(item.defect_count * item.rework_min_each for item in days)
        rate = pct(total_defects, total_inspected)
        pareto = _pareto_rows(type_totals[phase], defect_names)
        dpmo = round(safe_div(total_defects, total_inspected) * DPMO_SCALE)
        mean_rate_pct, ucl_pct, lcl_pct = _p_chart_limits(days)

        for item in days:
            daily_rate = pct(item.defect_count, item.inspected_pcs)
            daily.append(
                QualityDailyPoint(
                    phase=phase,
                    date=item.date,
                    inspected_pcs=item.inspected_pcs,
                    defect_count=item.defect_count,
                    defect_rate_pct=round(daily_rate, PCT_DIGITS),
                    out_of_control=(daily_rate > ucl_pct or daily_rate < lcl_pct),
                )
            )

        p_chart.append(
            QualityPChartPhase(
                phase=phase,
                mean_rate_pct=round(mean_rate_pct, PCT_DIGITS),
                ucl_pct=round(ucl_pct, PCT_DIGITS),
                lcl_pct=round(lcl_pct, PCT_DIGITS),
                out_of_control_points=sum(
                    1
                    for point in daily
                    if point.phase == phase and point.out_of_control
                ),
            )
        )

        phases.append(
            QualityPhaseSummary(
                phase=phase,
                start_date=days[0].date,
                end_date=days[-1].date,
                days=len(days),
                inspected_pcs=total_inspected,
                defect_count=total_defects,
                defect_rate_pct=round(rate, PCT_DIGITS),
                first_pass_yield_pct=round(100.0 - rate, PCT_DIGITS),
                rework_min_total=round(total_rework, METRIC_DIGITS),
                top_defect_type=pareto[0].defect_type if pareto else None,
                dpmo=dpmo,
                z_benchmark=_z_benchmark(dpmo),
                pareto=pareto,
            )
        )

    audit_rows = _audit_rows(audits)
    audit_summary = _audit_summary(
        audit_rows,
        misalignment_defect_code=misalignment_defect_code,
        type_totals=type_totals["BEFORE"],
    )
    before_phase = phases[0]
    after_phase = phases[1]

    return QualityCaseStudyResponse(
        line_id=line_id,
        style_code=style_code,
        operation_id=operation_id,
        operation_name=operation_name,
        phases=phases,
        defect_types=_defect_comparisons(type_totals, defect_names),
        daily=daily,
        p_chart=p_chart,
        setup_audit=audit_rows,
        setup_audit_summary=audit_summary,
        two_proportion_test=_two_proportion_test(
            before_phase.defect_count,
            before_phase.inspected_pcs,
            after_phase.defect_count,
            after_phase.inspected_pcs,
        ),
    )


def analyze_layout_case_study(
    *,
    line_id: str,
    station_id: str,
    trips_per_shift: int,
    trials: Sequence[LayoutRouteObservation],
) -> LayoutCaseStudyResponse:
    """Summarize measured route trials for the T10 layout case study.

    Means are computed per phase from the raw trials, then scaled by the
    documented trips per shift. Reductions compare operator moving distance
    and time only; material-handler replenishment is out of scope and must
    not be claimed as total labor saving.
    """
    if trips_per_shift <= 0:
        raise ValueError("Trips per shift must be positive.")

    trials_by_phase: dict[str, list[LayoutRouteObservation]] = {
        phase: [] for phase in PHASES
    }
    for item in trials:
        trials_by_phase[item.phase].append(item)

    summaries: list[LayoutPhaseSummary] = []
    for phase in PHASES:
        rows = sorted(trials_by_phase[phase], key=lambda item: item.trial)
        if not rows:
            raise ValueError(f"Missing route trials for phase {phase}.")
        trial_numbers = [row.trial for row in rows]
        if len(set(trial_numbers)) != len(trial_numbers):
            raise ValueError(f"Duplicate trial numbers in phase {phase}.")

        mean_distance = safe_div(sum(row.distance_m for row in rows), len(rows))
        mean_time = safe_div(sum(row.time_min for row in rows), len(rows))
        mean_crossings = safe_div(sum(row.crossings for row in rows), len(rows))
        summaries.append(
            LayoutPhaseSummary(
                phase=phase,
                trial_count=len(rows),
                mean_distance_m=round(mean_distance, METRIC_DIGITS),
                mean_time_min=round(mean_time, METRIC_DIGITS),
                mean_crossings=round(mean_crossings, METRIC_DIGITS),
                trips_per_shift=trips_per_shift,
                distance_per_shift_m=round(
                    mean_distance * trips_per_shift, METRIC_DIGITS
                ),
                time_per_shift_min=round(mean_time * trips_per_shift, METRIC_DIGITS),
            )
        )

    before, after = summaries
    return LayoutCaseStudyResponse(
        line_id=line_id,
        station_id=station_id,
        trips_per_shift=trips_per_shift,
        trials=sorted(
            trials,
            key=lambda item: (PHASES.index(item.phase), item.trial),
        ),
        phases=summaries,
        distance_reduction_pct=round(
            pct(
                before.mean_distance_m - after.mean_distance_m,
                before.mean_distance_m,
            ),
            PCT_DIGITS,
        ),
        time_reduction_pct=round(
            pct(before.mean_time_min - after.mean_time_min, before.mean_time_min),
            PCT_DIGITS,
        ),
        crossings_per_shift_before=round(
            before.mean_crossings * trips_per_shift, METRIC_DIGITS
        ),
        crossings_per_shift_after=round(
            after.mean_crossings * trips_per_shift, METRIC_DIGITS
        ),
    )


def _pareto_rows(
    type_totals: dict[str, int], names: dict[str, str]
) -> list[QualityParetoRow]:
    ordered = sorted(type_totals.items(), key=lambda pair: (-pair[1], pair[0]))
    total = sum(type_totals.values())
    rows: list[QualityParetoRow] = []
    cumulative = 0.0
    for defect_code, count in ordered:
        share = pct(count, total)
        cumulative += share
        rows.append(
            QualityParetoRow(
                defect_code=defect_code,
                defect_type=names.get(defect_code, defect_code),
                count=count,
                share_pct=round(share, PCT_DIGITS),
                cumulative_pct=round(cumulative, PCT_DIGITS),
            )
        )
    return rows


def _defect_comparisons(
    type_totals: dict[str, dict[str, int]], names: dict[str, str]
) -> list[QualityDefectComparison]:
    before = type_totals["BEFORE"]
    after = type_totals["AFTER"]
    ordered = sorted(
        set(before) | set(after),
        key=lambda name: (-before.get(name, 0), name),
    )
    rows: list[QualityDefectComparison] = []
    for defect_code in ordered:
        before_count = before.get(defect_code, 0)
        after_count = after.get(defect_code, 0)
        delta = after_count - before_count
        rows.append(
            QualityDefectComparison(
                defect_code=defect_code,
                defect_type=names.get(defect_code, defect_code),
                before_count=before_count,
                after_count=after_count,
                delta_count=delta,
                delta_pct=(
                    round(pct(delta, before_count), PCT_DIGITS)
                    if before_count
                    else None
                ),
            )
        )
    return rows


def _audit_rows(audits: Sequence[QualitySetupAuditRow]) -> list[QualitySetupAuditRow]:
    if not audits:
        raise ValueError("Setup audit data is required.")
    return sorted(
        audits, key=lambda item: (PHASES.index(item.phase), item.changeover_date)
    )


def _audit_summary(
    audits: Sequence[QualitySetupAuditRow],
    *,
    misalignment_defect_code: str,
    type_totals: dict[str, int],
) -> QualitySetupAuditSummary:
    before = [row for row in audits if row.phase == "BEFORE"]
    after = [row for row in audits if row.phase == "AFTER"]
    if not before or not after:
        raise ValueError("Setup audit needs both BEFORE and AFTER rows.")

    total_misalignment = type_totals.get(misalignment_defect_code, 0)
    misalignment_after_changeover = sum(row.misalignment_next_2h for row in before)
    return QualitySetupAuditSummary(
        before_changeovers=len(before),
        before_guide_present=sum(1 for row in before if row.guide_present),
        before_first_piece_check=sum(1 for row in before if row.first_piece_check),
        before_misalignment_after_changeover=misalignment_after_changeover,
        before_total_misalignment=total_misalignment,
        before_misalignment_share_pct=round(
            pct(misalignment_after_changeover, total_misalignment), PCT_DIGITS
        ),
        after_changeovers=len(after),
        after_guide_present=sum(1 for row in after if row.guide_present),
        after_first_piece_check=sum(1 for row in after if row.first_piece_check),
        after_misalignment_after_changeover=sum(
            row.misalignment_next_2h for row in after
        ),
    )


def _p_chart_limits(
    days: Sequence[QualityInspectionRecord],
) -> tuple[float, float, float]:
    total_inspected = sum(item.inspected_pcs for item in days)
    total_defects = sum(item.defect_count for item in days)
    p_bar = safe_div(total_defects, total_inspected)
    n = safe_div(total_inspected, len(days))
    sigma = math.sqrt(p_bar * (1.0 - p_bar) / n) if p_bar and n else 0.0
    return (
        p_bar * 100.0,
        (p_bar + P_CHART_SIGMA * sigma) * 100.0,
        max(0.0, (p_bar - P_CHART_SIGMA * sigma) * 100.0),
    )


def _z_benchmark(dpmo: int) -> float | None:
    if dpmo <= 0:
        return None
    inside = Z_BENCHMARK_SCALE - Z_BENCHMARK_DPMO_FACTOR * math.log(dpmo)
    if inside < 0:
        return None
    return round(Z_BENCHMARK_OFFSET + math.sqrt(inside), METRIC_DIGITS)


def _two_proportion_test(
    before_defects: int,
    before_inspected: int,
    after_defects: int,
    after_inspected: int,
) -> TwoProportionTest:
    p1 = safe_div(before_defects, before_inspected)
    p2 = safe_div(after_defects, after_inspected)
    pooled = safe_div(
        before_defects + after_defects,
        before_inspected + after_inspected,
    )
    standard_error = math.sqrt(
        pooled
        * (1.0 - pooled)
        * (safe_div(1.0, before_inspected) + safe_div(1.0, after_inspected))
    )
    z_stat = safe_div(p1 - p2, standard_error)
    p_value = math.erfc(abs(z_stat) / math.sqrt(2.0))
    unpooled_error = math.sqrt(
        safe_div(p1 * (1.0 - p1), before_inspected)
        + safe_div(p2 * (1.0 - p2), after_inspected)
    )
    margin = Z_95 * unpooled_error
    return TwoProportionTest(
        p1_pct=round(p1 * 100.0, PCT_DIGITS),
        p2_pct=round(p2 * 100.0, PCT_DIGITS),
        pooled_pct=round(pooled * 100.0, PCT_DIGITS),
        z_stat=round(z_stat, METRIC_DIGITS),
        p_value=round(p_value, P_VALUE_DIGITS),
        ci_low_pct=round((p1 - p2 - margin) * 100.0, PCT_DIGITS),
        ci_high_pct=round((p1 - p2 + margin) * 100.0, PCT_DIGITS),
    )
