from __future__ import annotations

from fastapi.testclient import TestClient

from backend.app import main as main_module
from backend.app.main import app

client = TestClient(app)


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


def test_optimize_endpoint_returns_solution_and_kpis():
    response = client.post(
        "/api/optimize",
        json={
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
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] in {"OPTIMAL", "FEASIBLE_LIMIT"}
    assert payload["has_solution"] is True
    assert payload["kpis"] is not None
    assert payload["takt_time_sec"] == 450.0
    assert payload["effective_takt_time_sec"] == 382.5


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
