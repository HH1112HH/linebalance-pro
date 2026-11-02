from __future__ import annotations

import pytest

from backend.app.actuals import analyze_actuals
from backend.app.models import (
    DailyProductionActual,
    LineConfig,
    Operation,
    OptimizeRequest,
    ProductionActuals,
    Worker,
)


def make_request(**overrides) -> OptimizeRequest:
    values = dict(
        line_name="Test line",
        style_code="TEST-001",
        config=LineConfig(
            shift_minutes=480,
            break_minutes=30,
            target_qty=100,
            sam_basis="EXCLUDES_ALLOWANCE",
            allowance_pct=0.20,
        ),
        operations=[Operation(id="OP1", name="May", sam_sec=60.0)],
        workers=[Worker(id="W1", name="Worker 1", skills={"OP1": 2})],
    )
    values.update(overrides)
    return OptimizeRequest(**values)


def test_actual_labor_efficiency_uses_planning_sam():
    request = make_request(
        actuals=ProductionActuals(
            actual_output=100,
            actual_direct_labor_minutes=120.0,
            downtime_minutes=60.0,
            attendance_hc=1,
        )
    )

    analysis = analyze_actuals(request)

    assert analysis is not None
    assert analysis.period_days == 1
    assert analysis.target_output == 100
    assert analysis.actual_output == 100
    assert analysis.production_achievement_pct == pytest.approx(100.0)
    # 60s raw SAM x 1.20 allowance = 72s = 1.2 standard minutes.
    assert analysis.actual_labor_efficiency_pct == pytest.approx(100.0)
    assert analysis.downtime_pct_of_planned_time == pytest.approx(12.5)
    assert "planning SAM" in " ".join(analysis.notes)


def test_missing_labor_minutes_returns_null_efficiency():
    request = make_request(
        actuals=ProductionActuals(
            actual_output=90,
            actual_direct_labor_minutes=None,
            downtime_minutes=0,
        )
    )

    analysis = analyze_actuals(request)

    assert analysis is not None
    assert analysis.actual_labor_efficiency_pct is None
    assert any("not calculated" in note for note in analysis.notes)


def test_daily_actuals_aggregate_target_actual_and_labor():
    request = make_request(
        daily_actuals=[
            DailyProductionActual(
                date="2026-10-26",
                target_output=100,
                actual_output=90,
                actual_direct_labor_minutes=100.0,
                downtime_minutes=20.0,
            ),
            DailyProductionActual(
                date="2026-10-27",
                target_output=100,
                actual_output=80,
                actual_direct_labor_minutes=100.0,
                downtime_minutes=30.0,
            ),
        ]
    )

    analysis = analyze_actuals(request)

    assert analysis is not None
    assert analysis.period_days == 2
    assert analysis.target_output == 200
    assert analysis.actual_output == 170
    assert analysis.production_achievement_pct == pytest.approx(85.0)
    # 170 x 1.2 planning minutes / 200 actual labor minutes = 102%.
    assert analysis.actual_labor_efficiency_pct == pytest.approx(102.0)
    assert analysis.downtime_minutes == pytest.approx(50.0)
    assert analysis.downtime_pct_of_planned_time == pytest.approx(5.21, abs=0.01)


def test_no_actuals_returns_none():
    assert analyze_actuals(make_request()) is None
