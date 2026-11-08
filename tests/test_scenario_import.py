from __future__ import annotations

from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.models import OptimizeRequest, ScenarioImportRequest
from backend.app.sample_data import SAMPLE_REQUEST
from backend.app.scenario_import import ScenarioImportError, parse_scenario_bundle
from backend.app.validation import validate_request

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "docs" / "data" / "scenario_master"
client = TestClient(app)


def read(name: str) -> str:
    return (DATA / name).read_text(encoding="utf-8")


def bundle(
    operations: str | None = None,
    workers: str | None = None,
    skills: str | None = None,
    machines: str | None = None,
) -> ScenarioImportRequest:
    return ScenarioImportRequest(
        operations_csv=operations if operations is not None else read("operations.csv"),
        workers_csv=workers if workers is not None else read("workers.csv"),
        worker_skills_csv=skills if skills is not None else read("worker_skills.csv"),
        machines_csv=machines if machines is not None else read("machines.csv"),
    )


OPS_HEADER = (
    "operation_id,operation_name,sam_sec,predecessor_ids,machine_type,"
    "skill_code,skill_required,is_quality_gate,sequence\n"
)
WORKERS_HEADER = "worker_id,worker_name,available,worker_status,machine_types\n"
SKILLS_HEADER = "worker_id,operation_id,skill_grade\n"
MACHINES_HEADER = "machine_id,machine_type,available,capacity\n"


def test_sample_master_data_round_trips_into_the_solver_model() -> None:
    preview = parse_scenario_bundle(bundle())

    assert preview.style_code == "BASIC-TEE-001"
    assert preview.line_name == "Line A — Basic Tee"
    assert preview.data_policy == "synthetic-demo-only"
    assert preview.counts.operations == 40
    assert preview.counts.workers == 24
    assert preview.counts.skill_assignments == 576
    assert preview.counts.machines == 23
    assert preview.counts.precedence_layers == 23
    assert preview.counts.machine_types == [
        "COVERSTITCH",
        "IRON",
        "OVERLOCK",
        "SINGLE",
    ]

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


def test_skill_grades_and_availability_are_normalized() -> None:
    operations = OPS_HEADER + "OP1,May 1,20,,MANUAL,SEWING,1,false,10\n"
    workers = WORKERS_HEADER + "w1,Nguyen A,yes,,IRON|SINGLE\n" + "W2,Tran B,no,,,\n"
    skills = SKILLS_HEADER + "W1,OP1,A\nW2,OP1,1\n"
    preview = parse_scenario_bundle(
        bundle(operations=operations, workers=workers, skills=skills, machines="")
    )

    assert preview.workers[0].id == "W1"
    assert preview.workers[0].available is True
    assert preview.workers[0].worker_status == "ACTIVE"
    assert preview.workers[0].skills == {"OP1": 3}
    assert preview.workers[0].machine_types == ["IRON", "SINGLE"]
    assert preview.workers[1].available is False
    assert preview.workers[1].worker_status == "ABSENT"
    assert preview.workers[1].skills == {"OP1": 1}
    assert preview.operations[0].machine_type is None
    assert preview.operations[0].sequence == 10


def test_duplicate_skill_rows_with_same_grade_are_deduplicated() -> None:
    operations = OPS_HEADER + "OP1,May 1,20,,MANUAL,SEWING,1,false,10\n"
    skills = SKILLS_HEADER + "W1,OP1,B\nW1,OP1,2\n"
    workers = WORKERS_HEADER + "W1,Nguyen A,true,ACTIVE,\n"

    preview = parse_scenario_bundle(
        bundle(operations=operations, workers=workers, skills=skills, machines="")
    )

    assert preview.workers[0].skills == {"OP1": 2}
    assert preview.counts.skill_assignments == 1


def test_missing_columns_are_named() -> None:
    with pytest.raises(
        ScenarioImportError, match=r"missing columns: .*predecessor_ids"
    ):
        parse_scenario_bundle(
            bundle(operations="operation_id,operation_name\nOP1,May\n")
        )


def test_duplicate_operation_id_is_rejected() -> None:
    operations = (
        OPS_HEADER
        + "OP1,May 1,20,,MANUAL,SEWING,1,false,10\n"
        + "OP1,May 2,20,,MANUAL,SEWING,1,false,20\n"
    )
    with pytest.raises(ScenarioImportError, match="duplicate operation_id OP1"):
        parse_scenario_bundle(
            bundle(
                operations=operations,
                workers=WORKERS_HEADER + "W1,Nguyen A,true,ACTIVE,\n",
                skills=SKILLS_HEADER + "W1,OP1,A\n",
                machines="",
            )
        )


def test_missing_predecessor_and_self_reference_are_rejected() -> None:
    workers = WORKERS_HEADER + "W1,Nguyen A,true,ACTIVE,\n"
    skills = SKILLS_HEADER + "W1,OP1,A\n"

    missing = OPS_HEADER + "OP1,May 1,20,OP9,MANUAL,SEWING,1,false,10\n"
    with pytest.raises(ScenarioImportError, match="missing predecessor OP9"):
        parse_scenario_bundle(
            bundle(operations=missing, workers=workers, skills=skills, machines="")
        )

    own = OPS_HEADER + "OP1,May 1,20,OP1,MANUAL,SEWING,1,false,10\n"
    with pytest.raises(ScenarioImportError, match="cannot be its own predecessor"):
        parse_scenario_bundle(
            bundle(operations=own, workers=workers, skills=skills, machines="")
        )


def test_precedence_cycle_is_rejected() -> None:
    operations = (
        OPS_HEADER
        + "OP1,May 1,20,OP2,MANUAL,SEWING,1,false,10\n"
        + "OP2,May 2,20,OP1,MANUAL,SEWING,1,false,20\n"
    )
    with pytest.raises(ScenarioImportError, match="Precedence cycle detected"):
        parse_scenario_bundle(
            bundle(
                operations=operations,
                workers=WORKERS_HEADER + "W1,Nguyen A,true,ACTIVE,\n",
                skills=SKILLS_HEADER + "W1,OP1,A\nW1,OP2,A\n",
                machines="",
            )
        )


def test_unknown_worker_or_operation_in_skills_is_rejected() -> None:
    operations = OPS_HEADER + "OP1,May 1,20,,MANUAL,SEWING,1,false,10\n"
    workers = WORKERS_HEADER + "W1,Nguyen A,true,ACTIVE,\n"

    with pytest.raises(ScenarioImportError, match="unknown worker_id W9"):
        parse_scenario_bundle(
            bundle(
                operations=operations,
                workers=workers,
                skills=SKILLS_HEADER + "W9,OP1,A\n",
                machines="",
            )
        )
    with pytest.raises(ScenarioImportError, match="unknown operation_id OP9"):
        parse_scenario_bundle(
            bundle(
                operations=operations,
                workers=workers,
                skills=SKILLS_HEADER + "W1,OP9,A\n",
                machines="",
            )
        )


def test_conflicting_skill_grades_are_rejected() -> None:
    operations = OPS_HEADER + "OP1,May 1,20,,MANUAL,SEWING,1,false,10\n"
    with pytest.raises(ScenarioImportError, match="conflicting grades"):
        parse_scenario_bundle(
            bundle(
                operations=operations,
                workers=WORKERS_HEADER + "W1,Nguyen A,true,ACTIVE,\n",
                skills=SKILLS_HEADER + "W1,OP1,A\nW1,OP1,B\n",
                machines="",
            )
        )


def test_invalid_grade_is_rejected() -> None:
    operations = OPS_HEADER + "OP1,May 1,20,,MANUAL,SEWING,1,false,10\n"
    with pytest.raises(ScenarioImportError, match=r"skill_grade must be 0\.\.3"):
        parse_scenario_bundle(
            bundle(
                operations=operations,
                workers=WORKERS_HEADER + "W1,Nguyen A,true,ACTIVE,\n",
                skills=SKILLS_HEADER + "W1,OP1,4\n",
                machines="",
            )
        )


def test_machine_requirements_need_an_available_machine() -> None:
    operations = OPS_HEADER + "OP1,May 1,20,,SINGLE,SEWING,1,false,10\n"
    with pytest.raises(ScenarioImportError, match="No available machine"):
        parse_scenario_bundle(
            bundle(
                operations=operations,
                workers=WORKERS_HEADER + "W1,Nguyen A,true,ACTIVE,SINGLE\n",
                skills=SKILLS_HEADER + "W1,OP1,A\n",
                machines="",
            )
        )


def test_manual_machine_type_and_optional_machines_are_allowed() -> None:
    operations = (
        OPS_HEADER
        + "OP1,May 1,20,,MANUAL,SEWING,1,false,10\n"
        + "OP2,May 2,20,OP1,,SEWING,1,false,20\n"
    )
    preview = parse_scenario_bundle(
        bundle(
            operations=operations,
            workers=WORKERS_HEADER + "W1,Nguyen A,true,ACTIVE,\n",
            skills=SKILLS_HEADER + "W1,OP1,A\nW1,OP2,B\n",
            machines="",
        )
    )
    assert all(operation.machine_type is None for operation in preview.operations)
    assert preview.machines == []


def test_efficiency_factor_column_is_rejected() -> None:
    workers = "worker_id,worker_name,efficiency_factor\nW1,Nguyen A,1.00\n"
    with pytest.raises(ScenarioImportError, match="efficiency_factor"):
        parse_scenario_bundle(
            bundle(
                operations=OPS_HEADER + "OP1,May 1,20,,MANUAL,SEWING,1,false,10\n",
                workers=workers,
                skills=SKILLS_HEADER + "W1,OP1,A\n",
                machines="",
            )
        )


def test_non_synthetic_policy_is_rejected() -> None:
    operations = (
        "data_policy,operation_id,operation_name,sam_sec,predecessor_ids,"
        "machine_type,skill_code,skill_required,is_quality_gate,sequence\n"
        "REAL,OP1,May 1,20,,MANUAL,SEWING,1,false,10\n"
    )
    with pytest.raises(ScenarioImportError, match="data_policy must be SYNTHETIC"):
        parse_scenario_bundle(
            bundle(
                operations=operations,
                workers=WORKERS_HEADER + "W1,Nguyen A,true,ACTIVE,\n",
                skills=SKILLS_HEADER + "W1,OP1,A\n",
                machines="",
            )
        )


def test_inconsistent_style_codes_are_rejected() -> None:
    operations = (
        "style_code,operation_id,operation_name,sam_sec,predecessor_ids,"
        "machine_type,skill_code,skill_required,is_quality_gate,sequence\n"
        "STYLE-A,OP1,May 1,20,,MANUAL,SEWING,1,false,10\n"
        "STYLE-B,OP2,May 2,20,,MANUAL,SEWING,1,false,20\n"
    )
    with pytest.raises(ScenarioImportError, match="style_code must be consistent"):
        parse_scenario_bundle(
            bundle(
                operations=operations,
                workers=WORKERS_HEADER + "W1,Nguyen A,true,ACTIVE,\n",
                skills=SKILLS_HEADER + "W1,OP1,A\nW1,OP2,A\n",
                machines="",
            )
        )


def test_row_limits_are_enforced() -> None:
    rows = [
        f"OP{index},May {index},20,,MANUAL,SEWING,1,false,{index * 10}"
        for index in range(1, 202)
    ]
    operations = OPS_HEADER + "\n".join(rows) + "\n"
    with pytest.raises(ScenarioImportError, match="the limit is 200"):
        parse_scenario_bundle(
            bundle(
                operations=operations,
                workers=WORKERS_HEADER + "W1,Nguyen A,true,ACTIVE,\n",
                skills=SKILLS_HEADER + "W1,OP1,A\n",
                machines="",
            )
        )


def test_bom_and_blank_lines_are_tolerated() -> None:
    operations = "\ufeff" + OPS_HEADER + "\nOP1,May 1,20,,MANUAL,SEWING,1,false,10\n\n"
    preview = parse_scenario_bundle(
        bundle(
            operations=operations,
            workers=WORKERS_HEADER + "W1,Nguyen A,true,ACTIVE,\n",
            skills=SKILLS_HEADER + "W1,OP1,A\n",
            machines="",
        )
    )
    assert len(preview.operations) == 1


def test_api_returns_preview_and_validation_errors() -> None:
    response = client.post(
        "/api/import/scenario",
        json={
            "operations_csv": read("operations.csv"),
            "workers_csv": read("workers.csv"),
            "worker_skills_csv": read("worker_skills.csv"),
            "machines_csv": read("machines.csv"),
        },
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["counts"]["operations"] == 40
    assert payload["counts"]["workers"] == 24
    assert payload["counts"]["precedence_layers"] == 23
    assert payload["data_policy"] == "synthetic-demo-only"

    bad = client.post(
        "/api/import/scenario",
        json={
            "operations_csv": "operation_id\nOP1\n",
            "workers_csv": read("workers.csv"),
            "worker_skills_csv": read("worker_skills.csv"),
            "machines_csv": read("machines.csv"),
        },
    )
    assert bad.status_code == 422
    assert "missing columns" in bad.json()["detail"]
