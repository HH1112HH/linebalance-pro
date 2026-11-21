from __future__ import annotations

import csv
from collections import defaultdict
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.sample_case_studies import (
    DEFECT_TYPE_LABELS,
    build_layout_case_study,
    build_quality_case_study,
)

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "docs" / "data"
client = TestClient(app)


def _read_csv(name: str) -> list[dict[str, str]]:
    with (DATA / name).open(encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle))


def test_quality_case_matches_documented_totals() -> None:
    case = build_quality_case_study()

    before, after = case.phases
    assert before.phase == "BEFORE"
    assert after.phase == "AFTER"
    assert before.inspected_pcs == 1_820
    assert before.defect_count == 45
    assert before.defect_rate_pct == pytest.approx(2.47, abs=0.01)
    assert before.first_pass_yield_pct == pytest.approx(97.53, abs=0.01)
    assert before.rework_min_total == pytest.approx(135)
    assert before.dpmo == 24_725
    assert before.z_benchmark == pytest.approx(3.47, abs=0.01)

    assert after.inspected_pcs == 1_820
    assert after.defect_count == 18
    assert after.defect_rate_pct == pytest.approx(0.99, abs=0.01)
    assert after.first_pass_yield_pct == pytest.approx(99.01, abs=0.01)
    assert after.rework_min_total == pytest.approx(54)
    assert after.dpmo == 9_890
    assert after.z_benchmark == pytest.approx(3.83, abs=0.01)


def test_quality_pareto_order_and_cumulative() -> None:
    before, after = build_quality_case_study().phases

    assert [row.defect_code for row in before.pareto] == [
        "MISALIGNMENT",
        "UNEVEN_WIDTH",
        "PUCKERING",
        "SKIPPED_STITCH",
    ]
    assert before.pareto[0].count == 18
    assert before.pareto[0].share_pct == pytest.approx(40.0)
    assert before.pareto[1].cumulative_pct == pytest.approx(66.67, abs=0.01)
    assert before.pareto[-1].cumulative_pct == pytest.approx(100.0)

    assert after.top_defect_type == "Cổ không đều"
    assert after.pareto[0].defect_code == "UNEVEN_WIDTH"
    assert after.pareto[0].count == 6
    assert after.pareto[0].share_pct == pytest.approx(33.33, abs=0.01)
    assert after.pareto[0].cumulative_pct == pytest.approx(33.33, abs=0.01)


def test_quality_defect_comparison_deltas() -> None:
    rows = {row.defect_code: row for row in build_quality_case_study().defect_types}

    assert rows["MISALIGNMENT"].before_count == 18
    assert rows["MISALIGNMENT"].after_count == 5
    assert rows["MISALIGNMENT"].delta_count == -13
    assert rows["MISALIGNMENT"].delta_pct == pytest.approx(-72.22, abs=0.01)
    assert rows["UNEVEN_WIDTH"].delta_pct == pytest.approx(-50.0, abs=0.01)
    assert rows["PUCKERING"].delta_pct == pytest.approx(-55.56, abs=0.01)
    assert rows["SKIPPED_STITCH"].delta_pct == pytest.approx(-50.0, abs=0.01)


def test_quality_setup_audit_and_p_chart() -> None:
    case = build_quality_case_study()
    summary = case.setup_audit_summary

    assert summary.before_changeovers == 5
    assert summary.before_guide_present == 1
    assert summary.before_first_piece_check == 2
    assert summary.before_misalignment_after_changeover == 14
    assert summary.before_total_misalignment == 18
    assert summary.before_misalignment_share_pct == pytest.approx(77.78, abs=0.01)
    assert summary.after_changeovers == 5
    assert summary.after_guide_present == 5
    assert summary.after_first_piece_check == 5
    assert summary.after_misalignment_after_changeover == 2

    before_chart, after_chart = case.p_chart
    assert before_chart.ucl_pct == pytest.approx(4.91, abs=0.01)
    assert before_chart.lcl_pct == pytest.approx(0.03, abs=0.01)
    assert after_chart.ucl_pct == pytest.approx(2.55, abs=0.01)
    assert after_chart.lcl_pct == pytest.approx(0.0, abs=0.01)
    assert before_chart.out_of_control_points == 0
    assert after_chart.out_of_control_points == 0

    assert sum(point.out_of_control for point in case.daily) == 0
    assert len(case.daily) == 10


def test_quality_two_proportion_test() -> None:
    test = build_quality_case_study().two_proportion_test

    assert test.p1_pct == pytest.approx(2.47, abs=0.01)
    assert test.p2_pct == pytest.approx(0.99, abs=0.01)
    assert test.pooled_pct == pytest.approx(1.73, abs=0.01)
    assert test.z_stat == pytest.approx(3.43, abs=0.01)
    assert test.p_value == pytest.approx(0.0006, abs=0.0001)
    assert test.ci_low_pct == pytest.approx(0.64, abs=0.01)
    assert test.ci_high_pct == pytest.approx(2.33, abs=0.01)


def test_layout_case_matches_documented_totals() -> None:
    case = build_layout_case_study()

    before, after = case.phases
    assert before.trial_count == 5
    assert before.mean_distance_m == pytest.approx(43.6)
    assert before.mean_time_min == pytest.approx(6.0)
    assert before.mean_crossings == pytest.approx(2.0)
    assert before.distance_per_shift_m == pytest.approx(130.8)
    assert before.time_per_shift_min == pytest.approx(18.0)

    assert after.trial_count == 5
    assert after.mean_distance_m == pytest.approx(12.8)
    assert after.mean_time_min == pytest.approx(2.0)
    assert after.mean_crossings == pytest.approx(0.0)
    assert after.distance_per_shift_m == pytest.approx(38.4)
    assert after.time_per_shift_min == pytest.approx(6.0)

    assert case.distance_reduction_pct == pytest.approx(70.64, abs=0.01)
    assert case.time_reduction_pct == pytest.approx(66.67, abs=0.01)
    assert case.crossings_per_shift_before == pytest.approx(6.0)
    assert case.crossings_per_shift_after == pytest.approx(0.0)


def test_quality_case_matches_docs_csv() -> None:
    case = build_quality_case_study()
    inspections = _read_csv("quality_inspection_summary.csv")
    defects = _read_csv("quality_defects.csv")
    audits = _read_csv("quality_setup_audit.csv")

    csv_totals: dict[str, int] = defaultdict(int)
    for row in defects:
        csv_totals[row["phase"]] += int(row["defect_count"])
    assert csv_totals["BEFORE"] == 45
    assert csv_totals["AFTER"] == 18

    csv_types: dict[str, dict[str, int]] = {"BEFORE": {}, "AFTER": {}}
    for row in defects:
        phase_types = csv_types[row["phase"]]
        phase_types[row["defect_type"]] = phase_types.get(row["defect_type"], 0) + int(
            row["defect_count"]
        )
    for phase in case.phases:
        api_types = {row.defect_type: row.count for row in phase.pareto}
        assert api_types == csv_types[phase.phase]

    api_daily = {(point.phase, point.date): point for point in case.daily}
    for row in inspections:
        key = (row["phase"], row["date"])
        point = api_daily[key]
        assert point.inspected_pcs == int(row["inspected_pcs"])
        assert point.defect_count == int(row["defect_count"])

    api_audit = {(row.phase, row.changeover_date): row for row in case.setup_audit}
    for row in audits:
        key = (row["phase"], row["changeover_date"])
        audit = api_audit[key]
        assert audit.guide_present is (row["guide_present"] == "1")
        assert audit.first_piece_check is (row["first_piece_check"] == "1")
        assert audit.misalignment_next_2h == int(row["misalignment_next_2h"])

    assert set(DEFECT_TYPE_LABELS.values()) == set(csv_types["BEFORE"])


def test_layout_case_matches_docs_csv() -> None:
    case = build_layout_case_study()
    trials = _read_csv("layout_route_observations.csv")

    api_trials = {(row.phase, row.trial): row for row in case.trials}
    assert len(api_trials) == len(trials)
    for row in trials:
        key = (row["phase"], int(row["trial"]))
        trial = api_trials[key]
        assert trial.distance_m == pytest.approx(float(row["round_trip_distance_m"]))
        assert trial.time_min == pytest.approx(float(row["operator_trip_time_min"]))
        assert trial.crossings == int(row["shared_aisle_crossings"])


def test_case_study_api_endpoints() -> None:
    quality = client.get("/api/case-studies/quality")
    assert quality.status_code == 200
    payload = quality.json()
    assert payload["data_policy"] == "synthetic-demo-only"
    assert payload["operation_id"] == "OP060"
    assert payload["phases"][0]["defect_count"] == 45
    assert payload["phases"][1]["defect_count"] == 18

    layout = client.get("/api/case-studies/layout")
    assert layout.status_code == 200
    payload = layout.json()
    assert payload["data_policy"] == "synthetic-demo-only"
    assert payload["trips_per_shift"] == 3
    assert payload["distance_reduction_pct"] == pytest.approx(70.64, abs=0.01)
