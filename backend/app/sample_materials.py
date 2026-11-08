from __future__ import annotations

from .materials import analyze_materials, compare_material_analyses
from .models import (
    MaterialAnalysisRequest,
    MaterialSampleResponse,
    MaterialUsageInput,
)

SAMPLE_MATERIAL_STYLE = "BASIC-TEE-001"
SAMPLE_MATERIAL_LINE = "LINE_01"
SAMPLE_MATERIAL_PCS = 1_820

_STANDARD_MATERIALS = [
    ("MAT-THREAD", "Thread 40/2 synthetic", "m", 45.0, 250.0),
    ("MAT-TAPE3M", "3M tape synthetic", "m", 0.35, 1_200.0),
    ("MAT-BINDING", "Binding tape synthetic", "m", 0.60, 900.0),
]

_BEFORE_ACTUAL = {
    "MAT-THREAD": 46.8,
    "MAT-TAPE3M": 0.38,
    "MAT-BINDING": 0.66,
}

_AFTER_ACTUAL = {
    "MAT-THREAD": 45.9,
    "MAT-TAPE3M": 0.36,
    "MAT-BINDING": 0.62,
}

_SAMPLE_NOTES = [
    "Synthetic T13 case study: LINE_01 / BASIC-TEE-001, 3 materials, 1,820 pcs per phase.",
    "The same standard consumption and unit cost are used before and after to isolate usage variance.",
    "All after values remain above standard; this is a partial improvement, not a claim of zero waste.",
    "The excess reduction is cost avoidance inside this dataset, not a cash saving verified by Finance.",
]


def _materials(actual_by_id: dict[str, float]) -> list[MaterialUsageInput]:
    return [
        MaterialUsageInput(
            material_id=material_id,
            material_name=name,
            unit=unit,
            standard_qty_per_pc=standard_qty,
            actual_qty_per_pc=actual_by_id[material_id],
            unit_cost_vnd=unit_cost,
        )
        for material_id, name, unit, standard_qty, unit_cost in _STANDARD_MATERIALS
    ]


def build_sample_material_response() -> MaterialSampleResponse:
    before = analyze_materials(
        MaterialAnalysisRequest(
            style_code=SAMPLE_MATERIAL_STYLE,
            inspected_pcs=SAMPLE_MATERIAL_PCS,
            phase="BEFORE",
            materials=_materials(_BEFORE_ACTUAL),
        )
    )
    after = analyze_materials(
        MaterialAnalysisRequest(
            style_code=SAMPLE_MATERIAL_STYLE,
            inspected_pcs=SAMPLE_MATERIAL_PCS,
            phase="AFTER",
            materials=_materials(_AFTER_ACTUAL),
        )
    )
    return MaterialSampleResponse(
        style_code=SAMPLE_MATERIAL_STYLE,
        inspected_pcs=SAMPLE_MATERIAL_PCS,
        materials=_materials(_AFTER_ACTUAL),
        before=before,
        after=after,
        comparison=compare_material_analyses(before, after),
        notes=_SAMPLE_NOTES,
    )
