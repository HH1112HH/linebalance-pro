from __future__ import annotations

import csv
import io
import math
from collections.abc import Callable
from dataclasses import dataclass, field
from typing import Literal

from .materials import analyze_materials
from .models import (
    MaterialAnalysisRequest,
    MaterialImportPreview,
    MaterialUsageInput,
)

Phase = Literal["CURRENT", "BEFORE", "AFTER"]
REQUIRED_COLUMNS = (
    "phase",
    "style_code",
    "material_id",
    "material_name",
    "unit",
    "standard_qty_per_pc",
    "actual_qty_per_pc",
    "inspected_pcs",
    "unit_cost_vnd",
)
DERIVED_COLUMNS = ("standard_cost_vnd", "actual_cost_vnd", "variance_vnd")
VALID_PHASES: tuple[Phase, ...] = ("CURRENT", "BEFORE", "AFTER")
MAX_IMPORT_ROWS = 5_000
REL_TOL = 1e-9

CellReader = Callable[[dict[str | None, str | None], str], str]


class MaterialImportError(ValueError):
    """Actionable CSV import error shown to the API caller."""


@dataclass
class _MaterialAccumulator:
    material_name: str
    unit: str
    unit_cost_vnd: float
    standard_qty_per_pc: float
    weighted_standard: float = field(default=0.0)
    weighted_actual: float = field(default=0.0)


def parse_material_csv(text: str, phase: str) -> MaterialImportPreview:
    """Parse and aggregate a synthetic material-consumption CSV.

    The aggregation is weighted by ``inspected_pcs`` so daily rows become one
    per-piece standard/actual value per material. The function has no I/O and
    returns the same analysis used by ``POST /api/materials/analyze``.
    """
    normalized_phase = _normalize_phase(phase)

    cleaned = text.lstrip("\ufeff").strip()
    if not cleaned:
        raise MaterialImportError("CSV is empty.")

    reader = csv.DictReader(io.StringIO(cleaned))
    original_headers = reader.fieldnames or []
    headers = [(header or "").strip() for header in original_headers]
    missing = [column for column in REQUIRED_COLUMNS if column not in headers]
    if missing:
        raise MaterialImportError("Missing CSV columns: " + ", ".join(missing) + ".")
    header_keys = {(header or "").strip(): header for header in original_headers}

    def cell(row: dict[str | None, str | None], name: str) -> str:
        return (row.get(header_keys[name]) or "").strip()

    style_code: str | None = None
    materials: dict[str, _MaterialAccumulator] = {}
    material_order: list[str] = []
    pcs_by_material: dict[str, float] = {}
    ignored_rows = 0
    row_count = 0

    for index, row in enumerate(reader, start=2):
        if not any((value or "").strip() for value in row.values()):
            continue
        if row_count + ignored_rows >= MAX_IMPORT_ROWS:
            raise MaterialImportError(
                f"CSV has more than {MAX_IMPORT_ROWS:,} data rows."
            )

        policy = cell(row, "data_policy") if "data_policy" in header_keys else ""
        if policy and policy.upper() != "SYNTHETIC":
            raise MaterialImportError(
                f"Row {index}: data_policy must be SYNTHETIC for demo imports."
            )

        row_phase = cell(row, "phase").upper()
        if not row_phase:
            raise MaterialImportError(f"Row {index}: phase is required.")
        if row_phase != normalized_phase:
            ignored_rows += 1
            continue

        row_style = cell(row, "style_code")
        if not row_style:
            raise MaterialImportError(f"Row {index}: style_code is required.")
        if style_code is None:
            style_code = row_style
        elif row_style != style_code:
            raise MaterialImportError(
                f"Row {index}: style_code '{row_style}' does not match "
                f"'{style_code}' from earlier rows."
            )

        material_id = cell(row, "material_id")
        if not material_id:
            raise MaterialImportError(f"Row {index}: material_id is required.")

        standard_qty = _number(row, index, "standard_qty_per_pc", cell)
        actual_qty = _number(row, index, "actual_qty_per_pc", cell)
        unit_cost = _number(row, index, "unit_cost_vnd", cell)
        inspected_pcs = _pcs(row, index, cell)

        try:
            MaterialUsageInput(
                material_id=material_id,
                material_name=cell(row, "material_name"),
                unit=cell(row, "unit"),
                standard_qty_per_pc=standard_qty,
                actual_qty_per_pc=actual_qty,
                unit_cost_vnd=unit_cost,
            )
        except ValueError as exc:
            raise MaterialImportError(f"Row {index}: {exc}") from exc

        material = materials.get(material_id)
        if material is None:
            material = _MaterialAccumulator(
                material_name=cell(row, "material_name"),
                unit=cell(row, "unit"),
                unit_cost_vnd=unit_cost,
                standard_qty_per_pc=standard_qty,
            )
            materials[material_id] = material
            material_order.append(material_id)
            pcs_by_material[material_id] = 0.0
        else:
            _assert_consistent(material_id, index, material, row, cell)

        pcs = float(inspected_pcs)
        material.weighted_standard += standard_qty * pcs
        material.weighted_actual += actual_qty * pcs
        pcs_by_material[material_id] += pcs
        row_count += 1

    if row_count == 0:
        raise MaterialImportError(f"No rows found for phase {normalized_phase}.")
    if style_code is None:
        raise MaterialImportError("CSV does not contain a style_code.")

    reference_id = material_order[0]
    reference_pcs = pcs_by_material[reference_id]
    for material_id in material_order[1:]:
        if not math.isclose(
            pcs_by_material[material_id],
            reference_pcs,
            rel_tol=REL_TOL,
            abs_tol=1e-9,
        ):
            raise MaterialImportError(
                f"Material {material_id} totals "
                f"{pcs_by_material[material_id]:,.0f} inspected pcs, but "
                f"{reference_id} totals {reference_pcs:,.0f}. "
                "Every material must cover the same pcs."
            )

    inspected_total = round(reference_pcs)
    if inspected_total <= 0:
        raise MaterialImportError("inspected_pcs must be above zero.")

    inputs: list[MaterialUsageInput] = []
    for material_id in material_order:
        material = materials[material_id]
        pcs = pcs_by_material[material_id]
        inputs.append(
            MaterialUsageInput(
                material_id=material_id,
                material_name=material.material_name,
                unit=material.unit,
                standard_qty_per_pc=material.weighted_standard / pcs,
                actual_qty_per_pc=material.weighted_actual / pcs,
                unit_cost_vnd=material.unit_cost_vnd,
            )
        )

    analysis = analyze_materials(
        MaterialAnalysisRequest(
            style_code=style_code,
            inspected_pcs=inspected_total,
            phase=normalized_phase,
            materials=inputs,
        )
    )

    warnings: list[str] = []
    if ignored_rows:
        warnings.append(
            f"Ignored {ignored_rows:,} rows for other phases; only "
            f"{normalized_phase} was imported."
        )
    if any(column in header_keys for column in DERIVED_COLUMNS):
        warnings.append(
            "Derived cost columns were ignored; standard and actual cost are "
            "recalculated from quantity and unit cost."
        )

    return MaterialImportPreview(
        style_code=style_code,
        phase=normalized_phase,
        inspected_pcs=inspected_total,
        row_count=row_count,
        ignored_rows=ignored_rows,
        materials=inputs,
        analysis=analysis,
        warnings=warnings,
    )


def _normalize_phase(phase: str) -> Phase:
    normalized = phase.strip().upper()
    if normalized not in VALID_PHASES:
        raise MaterialImportError(f"phase must be one of {', '.join(VALID_PHASES)}.")
    return normalized


def _number(
    row: dict[str | None, str | None],
    index: int,
    name: str,
    cell: CellReader,
) -> float:
    value = cell(row, name)
    try:
        parsed = float(value)
    except ValueError as exc:
        raise MaterialImportError(
            f"Row {index}: {name} must be a number; received '{value}'."
        ) from exc
    if not math.isfinite(parsed):
        raise MaterialImportError(f"Row {index}: {name} must be finite.")
    return parsed


def _pcs(
    row: dict[str | None, str | None],
    index: int,
    cell: CellReader,
) -> int:
    value = cell(row, "inspected_pcs")
    try:
        parsed = float(value)
    except ValueError as exc:
        raise MaterialImportError(
            f"Row {index}: inspected_pcs must be a whole number; received '{value}'."
        ) from exc
    if not math.isfinite(parsed) or not parsed.is_integer() or parsed <= 0:
        raise MaterialImportError(
            f"Row {index}: inspected_pcs must be a whole number above zero."
        )
    return int(parsed)


def _assert_consistent(
    material_id: str,
    index: int,
    material: _MaterialAccumulator,
    row: dict[str | None, str | None],
    cell: CellReader,
) -> None:
    material_name = cell(row, "material_name")
    if material_name != material.material_name:
        raise MaterialImportError(
            f"Row {index}: material {material_id} has different material_name "
            f"('{material_name}') than earlier rows ('{material.material_name}')."
        )
    unit = cell(row, "unit")
    if unit != material.unit:
        raise MaterialImportError(
            f"Row {index}: material {material_id} has different unit "
            f"('{unit}') than earlier rows ('{material.unit}')."
        )
    unit_cost = _number(row, index, "unit_cost_vnd", cell)
    if not math.isclose(
        unit_cost, material.unit_cost_vnd, rel_tol=REL_TOL, abs_tol=1e-9
    ):
        raise MaterialImportError(
            f"Row {index}: material {material_id} has unit_cost_vnd "
            f"{unit_cost}, expected {material.unit_cost_vnd} from earlier rows."
        )
    standard_qty = _number(row, index, "standard_qty_per_pc", cell)
    if not math.isclose(
        standard_qty, material.standard_qty_per_pc, rel_tol=REL_TOL, abs_tol=1e-9
    ):
        raise MaterialImportError(
            f"Row {index}: material {material_id} has standard_qty_per_pc "
            f"{standard_qty}, expected {material.standard_qty_per_pc} "
            "from earlier rows."
        )
