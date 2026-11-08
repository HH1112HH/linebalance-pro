from __future__ import annotations

import csv
import io
import zipfile
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from openpyxl import Workbook

from backend.app.main import app
from backend.app.models import OptimizeRequest
from backend.app.sample_data import SAMPLE_REQUEST
from backend.app.scenario_excel import (
    MAX_UNCOMPRESSED_BYTES,
    XLSX_MIME,
    parse_scenario_workbook,
)
from backend.app.scenario_import import ScenarioImportError
from backend.app.validation import validate_request

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "docs" / "data" / "scenario_master"
client = TestClient(app)

OPS_HEADER = (
    "operation_id,operation_name,sam_sec,predecessor_ids,machine_type,"
    "skill_code,skill_required,is_quality_gate,sequence\n"
)
WORKERS_HEADER = "worker_id,worker_name,available,worker_status,machine_types\n"
SKILLS_HEADER = "worker_id,operation_id,skill_grade\n"
MACHINES_HEADER = "machine_id,machine_type,available,capacity\n"


def read(name: str) -> str:
    return (DATA / name).read_text(encoding="utf-8")


def _typed_cell(value: str) -> object:
    if value == "":
        return None
    if value.lower() in {"true", "false"}:
        return value.lower() == "true"
    try:
        number = float(value)
    except ValueError:
        return value
    return int(number) if number.is_integer() else number


def build_workbook(sheets: dict[str, str]) -> bytes:
    workbook = Workbook()
    workbook.remove(workbook.active)
    for name, text in sheets.items():
        sheet = workbook.create_sheet(name)
        for row in csv.reader(io.StringIO(text.lstrip("\ufeff"))):
            sheet.append([_typed_cell(value) for value in row])
    buffer = io.BytesIO()
    workbook.save(buffer)
    return buffer.getvalue()


def sample_sheets() -> dict[str, str]:
    return {
        "operations": read("operations.csv"),
        "workers": read("workers.csv"),
        "worker_skills": read("worker_skills.csv"),
        "machines": read("machines.csv"),
    }


def sample_workbook() -> bytes:
    return build_workbook(sample_sheets())


def test_sample_workbook_round_trips_into_the_solver_model() -> None:
    preview = parse_scenario_workbook(sample_workbook())

    assert preview.style_code == "BASIC-TEE-001"
    assert preview.line_name == "Line A — Basic Tee"
    assert preview.data_policy == "synthetic-demo-only"
    assert preview.counts.operations == 40
    assert preview.counts.workers == 24
    assert preview.counts.skill_assignments == 576
    assert preview.counts.machines == 23
    assert preview.counts.precedence_layers == 23

    request = OptimizeRequest(
        line_name=preview.line_name or "Imported line",
        style_code=preview.style_code or "IMPORTED",
        config=SAMPLE_REQUEST.config,
        operations=preview.operations,
        workers=preview.workers,
        machines=preview.machines,
    )
    validation = validate_request(request)
    assert validation.errors == []
    assert validation.eligible


def test_committed_workbook_template_matches_csv_templates() -> None:
    preview = parse_scenario_workbook((DATA / "scenario_master.xlsx").read_bytes())

    assert preview.counts.operations == 40
    assert preview.counts.workers == 24
    assert preview.counts.skill_assignments == 576
    assert preview.counts.machines == 23
    assert preview.counts.precedence_layers == 23


def test_sheet_names_are_case_insensitive_and_allow_spaces() -> None:
    sheets = sample_sheets()
    renamed = {
        "Operations": sheets["operations"],
        "Workers": sheets["workers"],
        "Worker Skills": sheets["worker_skills"],
        "Machines": sheets["machines"],
    }

    preview = parse_scenario_workbook(build_workbook(renamed))

    assert preview.counts.operations == 40
    assert preview.counts.skill_assignments == 576


def test_missing_required_sheet_is_named() -> None:
    sheets = sample_sheets()
    sheets.pop("worker_skills")

    with pytest.raises(
        ScenarioImportError, match="missing required sheets: worker_skills"
    ):
        parse_scenario_workbook(build_workbook(sheets))


def test_manual_only_workbook_can_omit_the_machines_sheet() -> None:
    sheets = {
        "operations": OPS_HEADER + "OP1,May 1,20,,MANUAL,SEWING,1,false,10\n",
        "workers": WORKERS_HEADER + "W1,Nguyen A,true,ACTIVE,\n",
        "worker_skills": SKILLS_HEADER + "W1,OP1,A\n",
    }

    preview = parse_scenario_workbook(build_workbook(sheets))

    assert preview.counts.operations == 1
    assert preview.counts.workers == 1
    assert preview.counts.machines == 0
    assert preview.operations[0].machine_type is None


def test_boolean_and_numeric_cells_are_normalized() -> None:
    sheets = {
        "operations": OPS_HEADER + "OP1,May 1,20,,IRON,SEWING,1,false,10\n",
        "workers": WORKERS_HEADER + "W1,Nguyen A,false,ACTIVE,IRON\n",
        "worker_skills": SKILLS_HEADER + "W1,OP1,2\n",
        "machines": MACHINES_HEADER + "M1,IRON,true,1\n",
    }

    preview = parse_scenario_workbook(build_workbook(sheets))

    assert preview.workers[0].available is False
    assert preview.workers[0].skills == {"OP1": 2}
    assert preview.machines[0].available is True
    assert preview.machines[0].capacity == 1


def test_sheet_header_validation_is_shared_with_csv() -> None:
    sheets = sample_sheets()
    sheets["operations"] = "operation_id,operation_name\nOP1,May\n"

    with pytest.raises(
        ScenarioImportError, match=r"missing columns: .*predecessor_ids"
    ):
        parse_scenario_workbook(build_workbook(sheets))


def test_invalid_workbook_is_rejected_with_an_actionable_error() -> None:
    with pytest.raises(ScenarioImportError, match=r"not a valid \.xlsx workbook"):
        parse_scenario_workbook(b"not a workbook")


def test_zip_expansion_limit_is_checked_before_openpyxl() -> None:
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED) as archive:
        archive.writestr("xl/workbook.xml", "<workbook/>")
        archive.writestr(
            "xl/worksheets/sheet1.xml", b"0" * (MAX_UNCOMPRESSED_BYTES + 1)
        )

    with pytest.raises(ScenarioImportError, match="expands beyond"):
        parse_scenario_workbook(buffer.getvalue())


def test_api_returns_preview_and_actionable_errors() -> None:
    response = client.post(
        "/api/import/scenario/excel",
        content=sample_workbook(),
        headers={"Content-Type": XLSX_MIME},
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["counts"]["operations"] == 40
    assert payload["counts"]["skill_assignments"] == 576
    assert payload["data_policy"] == "synthetic-demo-only"

    wrong_type = client.post(
        "/api/import/scenario/excel",
        content=sample_workbook(),
        headers={"Content-Type": "text/csv"},
    )
    assert wrong_type.status_code == 415
    assert XLSX_MIME in wrong_type.json()["detail"]

    bad = client.post(
        "/api/import/scenario/excel",
        content=b"not a workbook",
        headers={"Content-Type": XLSX_MIME},
    )
    assert bad.status_code == 422
    assert "not a valid .xlsx workbook" in bad.json()["detail"]
