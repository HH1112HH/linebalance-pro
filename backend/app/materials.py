from __future__ import annotations

from .models import (
    MaterialAnalysisRequest,
    MaterialAnalysisResult,
    MaterialComparison,
    MaterialVarianceLine,
)
from .utils import pct, safe_div

QTY_DIGITS = 3
MONEY_DIGITS = 0
PCT_DIGITS = 2

MATERIAL_NOTES = [
    "Standard cost = standard qty/pc x inspected pcs x unit cost.",
    "Actual cost = actual qty/pc x inspected pcs x unit cost.",
    "Positive variance means actual usage is above standard (unfavorable).",
    "This is material usage variance, not purchase-price variance.",
    "Synthetic/demo analysis only; not a verified production result or Finance-approved saving.",
]


def analyze_materials(request: MaterialAnalysisRequest) -> MaterialAnalysisResult:
    """Calculate material usage variance from per-piece standards and actuals.

    All quantities are converted to period totals using ``inspected_pcs`` so
    that cost and usage share the same denominator. The function is pure and
    returns deterministic output in request order.
    """
    material_ids = [material.material_id for material in request.materials]
    if len(set(material_ids)) != len(material_ids):
        raise ValueError("Material IDs must be unique within one analysis.")

    lines: list[MaterialVarianceLine] = []
    for material in request.materials:
        standard_qty = material.standard_qty_per_pc * request.inspected_pcs
        actual_qty = material.actual_qty_per_pc * request.inspected_pcs
        standard_cost = standard_qty * material.unit_cost_vnd
        actual_cost = actual_qty * material.unit_cost_vnd
        variance = actual_cost - standard_cost
        variance_pct = pct(
            material.actual_qty_per_pc - material.standard_qty_per_pc,
            material.standard_qty_per_pc,
        )

        lines.append(
            MaterialVarianceLine(
                material_id=material.material_id,
                material_name=material.material_name,
                unit=material.unit,
                standard_qty_per_pc=round(material.standard_qty_per_pc, QTY_DIGITS),
                actual_qty_per_pc=round(material.actual_qty_per_pc, QTY_DIGITS),
                unit_cost_vnd=round(material.unit_cost_vnd, MONEY_DIGITS),
                standard_qty=round(standard_qty, QTY_DIGITS),
                actual_qty=round(actual_qty, QTY_DIGITS),
                standard_cost_vnd=round(standard_cost, MONEY_DIGITS),
                actual_cost_vnd=round(actual_cost, MONEY_DIGITS),
                variance_vnd=round(variance, MONEY_DIGITS),
                variance_pct=round(variance_pct, PCT_DIGITS),
                is_excess=variance > 0,
            )
        )

    standard_cost_total = sum(line.standard_cost_vnd for line in lines)
    actual_cost_total = sum(line.actual_cost_vnd for line in lines)
    variance_total = actual_cost_total - standard_cost_total
    variance_total_pct = pct(variance_total, standard_cost_total)

    return MaterialAnalysisResult(
        style_code=request.style_code,
        phase=request.phase,
        inspected_pcs=request.inspected_pcs,
        material_count=len(lines),
        standard_cost_vnd=round(standard_cost_total, MONEY_DIGITS),
        actual_cost_vnd=round(actual_cost_total, MONEY_DIGITS),
        variance_vnd=round(variance_total, MONEY_DIGITS),
        variance_pct=round(variance_total_pct, PCT_DIGITS),
        excess_materials=sum(1 for line in lines if line.is_excess),
        lines=lines,
        notes=list(MATERIAL_NOTES),
    )


def compare_material_analyses(
    before: MaterialAnalysisResult,
    after: MaterialAnalysisResult,
) -> MaterialComparison:
    """Compare two material analyses with the same pcs and unit costs."""
    if before.inspected_pcs != after.inspected_pcs:
        raise ValueError(
            "Before/after material comparisons need the same inspected pcs."
        )
    if before.style_code != after.style_code:
        raise ValueError("Before/after material comparisons need the same style code.")

    variance_reduction = before.variance_vnd - after.variance_vnd
    before_cost_per_pc = safe_div(before.actual_cost_vnd, before.inspected_pcs)
    after_cost_per_pc = safe_div(after.actual_cost_vnd, after.inspected_pcs)

    return MaterialComparison(
        standard_cost_vnd=after.standard_cost_vnd,
        before_cost_vnd=before.actual_cost_vnd,
        after_cost_vnd=after.actual_cost_vnd,
        before_variance_vnd=before.variance_vnd,
        after_variance_vnd=after.variance_vnd,
        variance_reduction_vnd=round(variance_reduction, MONEY_DIGITS),
        variance_reduction_pct=round(
            pct(variance_reduction, before.variance_vnd), PCT_DIGITS
        ),
        before_cost_per_pc_vnd=round(before_cost_per_pc, MONEY_DIGITS),
        after_cost_per_pc_vnd=round(after_cost_per_pc, MONEY_DIGITS),
        cost_per_pc_delta_vnd=round(
            after_cost_per_pc - before_cost_per_pc, MONEY_DIGITS
        ),
    )
