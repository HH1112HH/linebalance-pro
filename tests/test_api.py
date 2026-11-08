from __future__ import annotations

from io import BytesIO

from fastapi.testclient import TestClient
from openpyxl import load_workbook

from backend.app import main as main_module
from backend.app.main import app

client = TestClient(app)


def _small_optimize_payload() -> dict:
    return {
        "line_name": "API test line",
        "style_code": "TEST-001",
        "config": {
            "shift_minutes": 480,
            "break_minutes": 30,
            "target_qty": 60,
            "planned_efficiency": 0.85,
            "max_workers": 2,
            "solver_time_limit_sec": 10,
        },
        "operations": [
            {
                "id": "OP1",
                "name": "Manual operation",
                "sam_sec": 20.0,
                "skill_code": "SEWING",
                "skill_required": 1,
                "sequence": 1,
            },
            {
                "id": "OP2",
                "name": "Machine operation",
                "sam_sec": 30.0,
                "predecessors": ["OP1"],
                "machine_type": "SINGLE",
                "skill_code": "SEWING",
                "skill_required": 1,
                "sequence": 2,
            },
        ],
        "workers": [
            {
                "id": "W1",
                "name": "Worker 1",
                "skills": {"OP1": 2, "OP2": 2},
                "machine_types": ["SINGLE"],
            },
            {"id": "W2", "name": "Worker 2", "skills": {"OP1": 2}},
        ],
        "machines": [{"id": "M1", "machine_type": "SINGLE", "capacity": 1}],
    }


def test_health_reports_solver_and_public_limits():
    response = client.get("/api/health")
    alias = client.get("/health")

    assert response.status_code == 200
    assert alias.status_code == 200
    assert alias.json()["status"] == "ok"
    payload = response.json()
    assert payload["status"] == "ok"
    assert payload["data_policy"] == "synthetic-demo-only"
    assert payload["solver_available"] is True
    assert payload["solver_backend"] == "highs"
    assert payload["limits"]["max_operations"] == 200
    assert payload["limits"]["max_workers"] == 100
    assert payload["limits"]["max_machines"] == 200
    assert payload["limits"]["max_solver_time_sec"] == 60


def test_sample_endpoints_expose_two_scenarios_and_baseline():
    stretch = client.get("/api/sample")
    feasible = client.get("/api/sample/feasible")

    assert stretch.status_code == 200
    assert feasible.status_code == 200

    stretch_data = stretch.json()
    feasible_data = feasible.json()

    assert stretch_data["config"]["target_qty"] == 420
    assert stretch_data["config"]["max_workers"] == 24
    assert len(stretch_data["baseline_assignment"]["items"]) == 40
    assert (
        len(
            {
                item["station_id"]
                for item in stretch_data["baseline_assignment"]["items"]
            }
        )
        == 24
    )

    assert feasible_data["config"]["target_qty"] == 400
    assert feasible_data["config"]["max_workers"] == 26
    assert len(feasible_data["workers"]) == 26


def test_actuals_analyze_endpoint_returns_period_summary():
    sample = client.get("/api/sample").json()
    response = client.post("/api/actuals/analyze", json=sample)

    assert response.status_code == 200
    payload = response.json()
    assert payload["period_days"] == 5
    assert payload["target_output"] == 2100
    assert payload["actual_output"] == 1820
    assert payload["production_achievement_pct"] == 86.67
    assert payload["actual_labor_efficiency_pct"] == 67.34
    assert payload["downtime_minutes"] == 300.0


def test_time_study_endpoint_calculates_and_marks_draft():
    response = client.post(
        "/api/time-study/calculate",
        json={
            "operation_id": "OP060",
            "observed_time_sec": 40.0,
            "performance_rating": 1.0,
            "allowance_pct": 0.125,
            "approved_sam_sec": 45.0,
            "status": "DRAFT",
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["normal_time_sec"] == 40.0
    assert payload["standard_time_sec"] == 45.0
    assert payload["variance_pct"] == 0.0
    assert any("not approved" in note for note in payload["notes"])


def test_readiness_endpoint_calculates_required_completion_and_blockers():
    response = client.post(
        "/api/readiness/evaluate",
        json={
            "style_code": "TEE-001",
            "items": [
                {
                    "key": "routing",
                    "label": "Approved routing",
                    "required": True,
                    "status": "COMPLETED",
                },
                {
                    "key": "material",
                    "label": "Material ready",
                    "required": True,
                    "status": "IN_PROGRESS",
                },
                {
                    "key": "optional",
                    "label": "Optional note",
                    "required": False,
                    "status": "NOT_STARTED",
                },
            ],
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["readiness_pct"] == 50.0
    assert payload["ready"] is False
    assert payload["blocking_items"] == ["material"]


def test_process_flow_endpoint_returns_routing_edges_and_station_assignment():
    response = client.post(
        "/api/process-flow/build",
        json={
            "style_code": "TEE-001",
            "operations": [
                {"id": "OP2", "name": "Join", "sam_sec": 20, "predecessors": ["OP1"]},
                {"id": "OP1", "name": "Prepare", "sam_sec": 10},
            ],
            "assignments": [
                {
                    "operation_id": "OP1",
                    "station": 1,
                    "worker_id": "W1",
                    "worker_name": "Worker 1",
                },
                {
                    "operation_id": "OP2",
                    "station": 2,
                    "worker_id": "W2",
                    "worker_name": "Worker 2",
                },
            ],
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["has_assignment"] is True
    assert [(node["operation_id"], node["layer"]) for node in payload["nodes"]] == [
        ("OP1", 0),
        ("OP2", 1),
    ]
    assert payload["edges"] == [{"source": "OP1", "target": "OP2"}]
    assert payload["nodes"][1]["station"] == 2


def test_process_flow_endpoint_returns_actionable_validation_error():
    response = client.post(
        "/api/process-flow/build",
        json={
            "style_code": "TEE-001",
            "operations": [
                {
                    "id": "OP1",
                    "name": "Prepare",
                    "sam_sec": 10,
                    "predecessors": ["MISSING"],
                }
            ],
        },
    )

    assert response.status_code == 422
    assert "references missing predecessor MISSING" in response.json()["detail"]


def test_material_sample_endpoint_returns_reconciled_case() -> None:
    response = client.get("/api/materials/sample")

    assert response.status_code == 200
    payload = response.json()
    assert payload["style_code"] == "BASIC-TEE-001"
    assert payload["inspected_pcs"] == 1_820
    assert payload["before"]["variance_vnd"] == 982_800
    assert payload["after"]["variance_vnd"] == 464_100
    assert payload["comparison"]["variance_reduction_vnd"] == 518_700
    assert len(payload["materials"]) == 3


def test_material_analysis_endpoint_calculates_usage_variance() -> None:
    response = client.post(
        "/api/materials/analyze",
        json={
            "style_code": "TEE-001",
            "inspected_pcs": 100,
            "materials": [
                {
                    "material_id": "MAT-A",
                    "material_name": "Thread",
                    "unit": "m",
                    "standard_qty_per_pc": 2,
                    "actual_qty_per_pc": 2.5,
                    "unit_cost_vnd": 10,
                }
            ],
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["standard_cost_vnd"] == 2_000
    assert payload["actual_cost_vnd"] == 2_500
    assert payload["variance_vnd"] == 500
    assert payload["variance_pct"] == 25.0
    assert payload["excess_materials"] == 1


def test_material_analysis_endpoint_rejects_duplicate_ids() -> None:
    material = {
        "material_id": "MAT-A",
        "material_name": "Thread",
        "unit": "m",
        "standard_qty_per_pc": 2,
        "actual_qty_per_pc": 2.5,
        "unit_cost_vnd": 10,
    }
    response = client.post(
        "/api/materials/analyze",
        json={
            "style_code": "TEE-001",
            "inspected_pcs": 100,
            "materials": [material, material],
        },
    )

    assert response.status_code == 422
    assert "Material IDs must be unique" in response.json()["detail"]


def test_optimize_endpoint_returns_solution_and_kpis():
    response = client.post("/api/optimize", json=_small_optimize_payload())

    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] in {"OPTIMAL", "FEASIBLE_LIMIT"}
    assert payload["has_solution"] is True
    assert payload["kpis"] is not None
    assert payload["takt_time_sec"] == 450.0
    assert payload["effective_takt_time_sec"] == 382.5


def test_export_endpoint_returns_readable_workbook():
    payload = _small_optimize_payload()
    optimized = client.post("/api/optimize", json=payload)
    assert optimized.status_code == 200

    response = client.post(
        "/api/export",
        json={"request": payload, "result": optimized.json()},
    )

    assert response.status_code == 200
    assert response.headers["content-type"] == (
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )
    assert response.content[:2] == b"PK"
    assert "linebalance_TEST-001_en.xlsx" in response.headers["content-disposition"]

    workbook = load_workbook(BytesIO(response.content))
    assert set(workbook.sheetnames) == {
        "Summary",
        "Assignment",
        "Station_KPI",
        "Worker_Skill",
        "Warnings",
    }
    summary = workbook["Summary"]
    assert summary["A1"].value == "LineBalance Pro — Optimization Report"
    assert summary["B4"].value == "API test line"


def test_export_endpoint_honors_vietnamese_language():
    payload = _small_optimize_payload()
    optimized = client.post("/api/optimize", json=payload)
    assert optimized.status_code == 200

    response = client.post(
        "/api/export",
        json={
            "request": payload,
            "result": optimized.json(),
            "language": "vi",
        },
    )

    assert response.status_code == 200
    workbook = load_workbook(BytesIO(response.content))
    assert set(workbook.sheetnames) == {
        "Tổng quan",
        "Phân công",
        "Tải trạm",
        "Kỹ năng CN",
        "Cảnh báo",
    }
    summary = workbook["Tổng quan"]
    assert summary["A1"].value == "LineBalance Pro — Báo cáo tối ưu hóa"
    assert summary["A4"].value == "Chuyền"
    assert summary["B4"].value == "API test line"
    assert summary["A6"].value == "Trạng thái"


def test_excel_translation_tables_are_in_sync():
    from backend.app.excel import TEXT

    assert set(TEXT["en"]) == set(TEXT["vi"])
    assert all(value for value in TEXT["en"].values())
    assert all(value for value in TEXT["vi"].values())


def test_body_limit_returns_413(monkeypatch):
    monkeypatch.setattr(main_module, "MAX_BODY_BYTES", 20)
    response = client.post(
        "/api/time-study/calculate",
        json={
            "operation_id": "OP060",
            "observed_time_sec": 40.0,
            "performance_rating": 1.0,
            "allowance_pct": 0.125,
        },
    )

    assert response.status_code == 413


def test_rate_limit_returns_429(monkeypatch):
    monkeypatch.setattr(main_module, "RATE_LIMIT_MAX", 1)
    main_module._rate_buckets.clear()

    first = client.get("/")
    second = client.get("/")

    assert first.status_code == 200
    assert second.status_code == 429
    assert "Retry-After" in second.headers
