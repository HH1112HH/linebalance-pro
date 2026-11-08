from __future__ import annotations

import pytest

from backend.app.materials import analyze_materials, compare_material_analyses
from backend.app.models import MaterialAnalysisRequest
from backend.app.sample_materials import build_sample_material_response


def test_sample_material_case_reconciles_to_documented_totals() -> None:
    sample = build_sample_material_response()

    assert sample.inspected_pcs == 1_820
    assert sample.before.standard_cost_vnd == pytest.approx(22_222_200)
    assert sample.before.actual_cost_vnd == pytest.approx(23_205_000)
    assert sample.before.variance_vnd == pytest.approx(982_800)
    assert sample.before.variance_pct == pytest.approx(4.42, abs=0.01)
    assert sample.after.actual_cost_vnd == pytest.approx(22_686_300)
    assert sample.after.variance_vnd == pytest.approx(464_100)
    assert sample.after.variance_pct == pytest.approx(2.09, abs=0.01)
    assert sample.comparison.variance_reduction_vnd == pytest.approx(518_700)
    assert sample.comparison.variance_reduction_pct == pytest.approx(52.78, abs=0.01)
    assert sample.comparison.before_cost_per_pc_vnd == pytest.approx(12_750)
    assert sample.comparison.after_cost_per_pc_vnd == pytest.approx(12_465)
    assert sample.comparison.cost_per_pc_delta_vnd == pytest.approx(-285)
    assert sample.after.excess_materials == 3


def test_material_analysis_keeps_line_costs_and_totals_consistent() -> None:
    request = MaterialAnalysisRequest.model_validate(
        {
            "style_code": "TEE-001",
            "inspected_pcs": 100,
            "materials": [
                {
                    "material_id": "MAT-A",
                    "material_name": "Thread",
                    "unit": "m",
                    "standard_qty_per_pc": 2.0,
                    "actual_qty_per_pc": 2.5,
                    "unit_cost_vnd": 10,
                },
                {
                    "material_id": "MAT-B",
                    "material_name": "Tape",
                    "unit": "m",
                    "standard_qty_per_pc": 0.5,
                    "actual_qty_per_pc": 0.4,
                    "unit_cost_vnd": 20,
                },
            ],
        }
    )

    result = analyze_materials(request)

    assert result.standard_cost_vnd == pytest.approx(3_000)
    assert result.actual_cost_vnd == pytest.approx(3_300)
    assert result.variance_vnd == pytest.approx(300)
    assert result.variance_pct == pytest.approx(10.0)
    assert result.excess_materials == 1
    assert [line.material_id for line in result.lines] == ["MAT-A", "MAT-B"]
    assert result.lines[0].variance_vnd == pytest.approx(500)
    assert result.lines[0].variance_pct == pytest.approx(25.0)
    assert result.lines[1].variance_vnd == pytest.approx(-200)
    assert result.lines[1].is_excess is False


def test_material_analysis_rejects_duplicate_material_ids() -> None:
    request = MaterialAnalysisRequest.model_validate(
        {
            "style_code": "TEE-001",
            "inspected_pcs": 10,
            "materials": [
                {
                    "material_id": "MAT-A",
                    "material_name": "Thread",
                    "unit": "m",
                    "standard_qty_per_pc": 2,
                    "actual_qty_per_pc": 2,
                    "unit_cost_vnd": 10,
                },
                {
                    "material_id": "MAT-A",
                    "material_name": "Thread duplicate",
                    "unit": "m",
                    "standard_qty_per_pc": 2,
                    "actual_qty_per_pc": 2,
                    "unit_cost_vnd": 10,
                },
            ],
        }
    )

    with pytest.raises(ValueError, match="Material IDs must be unique"):
        analyze_materials(request)


def test_material_comparison_rejects_mismatched_denominators() -> None:
    sample = build_sample_material_response()

    with pytest.raises(ValueError, match="same inspected pcs"):
        compare_material_analyses(
            sample.before, sample.before.model_copy(update={"inspected_pcs": 10})
        )
