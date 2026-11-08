from __future__ import annotations

from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.material_import import MaterialImportError, parse_material_csv

client = TestClient(app)
DATA_FILE = Path("docs/data/material_consumption.csv")

HEADER = (
    "phase,style_code,material_id,material_name,unit,"
    "standard_qty_per_pc,actual_qty_per_pc,inspected_pcs,unit_cost_vnd"
)


def _csv(*rows: str) -> str:
    return "\n".join([HEADER, *rows])


def test_parse_sample_csv_reconciles_before_totals() -> None:
    preview = parse_material_csv(DATA_FILE.read_text(encoding="utf-8"), phase="BEFORE")

    assert preview.style_code == "BASIC-TEE-001"
    assert preview.phase == "BEFORE"
    assert preview.inspected_pcs == 1_820
    assert preview.row_count == 15
    assert preview.ignored_rows == 15
    assert len(preview.materials) == 3
    assert preview.analysis.standard_cost_vnd == pytest.approx(22_222_200)
    assert preview.analysis.actual_cost_vnd == pytest.approx(23_205_000)
    assert preview.analysis.variance_vnd == pytest.approx(982_800)
    assert preview.analysis.variance_pct == pytest.approx(4.42, abs=0.01)
    assert preview.analysis.excess_materials == 3

    thread = next(
        item for item in preview.analysis.lines if item.material_id == "MAT-THREAD"
    )
    assert thread.actual_qty_per_pc == pytest.approx(46.8)
    assert any("other phases" in warning for warning in preview.warnings)
    assert any("Derived cost columns" in warning for warning in preview.warnings)


def test_parse_sample_csv_reconciles_after_totals() -> None:
    preview = parse_material_csv(DATA_FILE.read_text(encoding="utf-8"), phase="AFTER")

    assert preview.inspected_pcs == 1_820
    assert preview.analysis.standard_cost_vnd == pytest.approx(22_222_200)
    assert preview.analysis.actual_cost_vnd == pytest.approx(22_686_300)
    assert preview.analysis.variance_vnd == pytest.approx(464_100)
    assert preview.analysis.excess_materials == 3


def test_weighted_average_uses_inspected_pcs() -> None:
    text = _csv(
        "BEFORE,S1,MAT-A,Thread,m,10,12,100,5",
        "BEFORE,S1,MAT-A,Thread,m,10,14,300,5",
    )

    preview = parse_material_csv(text, phase="BEFORE")

    assert preview.inspected_pcs == 400
    assert preview.materials[0].actual_qty_per_pc == pytest.approx(13.5)
    assert preview.analysis.actual_cost_vnd == pytest.approx(27_000)


def test_missing_column_is_actionable() -> None:
    text = "phase,style_code,material_id\nBEFORE,S1,MAT-A\n"

    with pytest.raises(MaterialImportError, match="Missing CSV columns"):
        parse_material_csv(text, phase="BEFORE")


def test_empty_csv_is_rejected() -> None:
    with pytest.raises(MaterialImportError, match="CSV is empty"):
        parse_material_csv("  \n", phase="BEFORE")


def test_non_synthetic_policy_is_rejected() -> None:
    text = (
        "phase,style_code,material_id,material_name,unit,"
        "standard_qty_per_pc,actual_qty_per_pc,inspected_pcs,unit_cost_vnd,"
        "data_policy\n"
        "BEFORE,S1,MAT-A,Thread,m,10,11,100,5,PRODUCTION\n"
    )

    with pytest.raises(MaterialImportError, match="SYNTHETIC"):
        parse_material_csv(text, phase="BEFORE")


def test_invalid_number_reports_row() -> None:
    text = _csv("BEFORE,S1,MAT-A,Thread,m,ten,11,100,5")

    with pytest.raises(MaterialImportError, match="Row 2: standard_qty_per_pc"):
        parse_material_csv(text, phase="BEFORE")


def test_inconsistent_unit_cost_is_rejected() -> None:
    text = _csv(
        "BEFORE,S1,MAT-A,Thread,m,10,11,100,5",
        "BEFORE,S1,MAT-A,Thread,m,10,11,100,6",
    )

    with pytest.raises(MaterialImportError, match="unit_cost_vnd 6"):
        parse_material_csv(text, phase="BEFORE")


def test_materials_must_cover_same_pcs() -> None:
    text = _csv(
        "BEFORE,S1,MAT-A,Thread,m,10,11,100,5",
        "BEFORE,S1,MAT-B,Tape,m,1,1,50,7",
    )

    with pytest.raises(MaterialImportError, match="same pcs"):
        parse_material_csv(text, phase="BEFORE")


def test_missing_phase_rows_are_rejected() -> None:
    text = _csv("AFTER,S1,MAT-A,Thread,m,10,11,100,5")

    with pytest.raises(MaterialImportError, match="No rows found for phase BEFORE"):
        parse_material_csv(text, phase="BEFORE")


def test_import_endpoint_returns_preview() -> None:
    response = client.post(
        "/api/materials/import?phase=BEFORE",
        content=DATA_FILE.read_text(encoding="utf-8"),
        headers={"Content-Type": "text/csv"},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["phase"] == "BEFORE"
    assert payload["inspected_pcs"] == 1_820
    assert payload["row_count"] == 15
    assert payload["analysis"]["actual_cost_vnd"] == pytest.approx(23_205_000)
    assert payload["analysis"]["excess_materials"] == 3


def test_import_endpoint_requires_csv_content_type() -> None:
    response = client.post(
        "/api/materials/import?phase=BEFORE",
        json={"phase": "BEFORE"},
    )

    assert response.status_code == 415


def test_import_endpoint_returns_422_for_bad_csv() -> None:
    response = client.post(
        "/api/materials/import?phase=BEFORE",
        content=_csv("BEFORE,S1,MAT-A,Thread,m,ten,11,100,5"),
        headers={"Content-Type": "text/csv"},
    )

    assert response.status_code == 422
    assert "Row 2" in response.json()["detail"]


def test_import_endpoint_rejects_non_utf8_body() -> None:
    response = client.post(
        "/api/materials/import?phase=BEFORE",
        content=b"\xff\xfe\x00\x00",
        headers={"Content-Type": "text/csv"},
    )

    assert response.status_code == 422
    assert "UTF-8" in response.json()["detail"]
