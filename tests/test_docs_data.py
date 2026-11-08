from __future__ import annotations

import csv
from collections import defaultdict
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "docs" / "data"


def read_csv(name: str) -> list[dict[str, str]]:
    with (DATA / name).open(encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle))


def phase_totals(rows: list[dict[str, str]], field: str) -> dict[str, float]:
    totals: dict[str, float] = defaultdict(float)
    for row in rows:
        totals[row["phase"]] += float(row[field])
    return dict(totals)


def test_quality_inspection_summary_matches_defect_log() -> None:
    summary = read_csv("quality_inspection_summary.csv")
    defects = read_csv("quality_defects.csv")

    assert len(summary) == 10
    assert {row["phase"] for row in summary} == {"BEFORE", "AFTER"}
    assert all(int(row["inspected_pcs"]) == 364 for row in summary)

    inspected = phase_totals(summary, "inspected_pcs")
    assert inspected["BEFORE"] == 1_820
    assert inspected["AFTER"] == 1_820

    summary_defects = phase_totals(summary, "defect_count")
    assert summary_defects["BEFORE"] == 45
    assert summary_defects["AFTER"] == 18

    rework = phase_totals(summary, "rework_min_total")
    assert rework["BEFORE"] == 135
    assert rework["AFTER"] == 54

    daily_defects: dict[tuple[str, str], int] = defaultdict(int)
    for row in defects:
        daily_defects[(row["phase"], row["date"])] += int(row["defect_count"])

    for row in summary:
        key = (row["phase"], row["date"])
        assert int(row["defect_count"]) == daily_defects[key]

    for row in summary:
        expected_rate = int(row["defect_count"]) / int(row["inspected_pcs"]) * 100
        assert float(row["defect_rate_pct"]) == pytest.approx(expected_rate, abs=1e-3)
        assert float(row["rework_min_total"]) == pytest.approx(
            int(row["defect_count"]) * float(row["rework_min_each"])
        )


def test_material_consumption_reconciles() -> None:
    rows = read_csv("material_consumption.csv")

    assert len(rows) == 30
    assert {row["phase"] for row in rows} == {"BEFORE", "AFTER"}
    assert {row["material_id"] for row in rows} == {
        "MAT-THREAD",
        "MAT-TAPE3M",
        "MAT-BINDING",
    }
    assert all(int(row["inspected_pcs"]) == 364 for row in rows)
    assert all(row["data_policy"] == "SYNTHETIC" for row in rows)

    for row in rows:
        inspected = int(row["inspected_pcs"])
        unit_cost = float(row["unit_cost_vnd"])
        standard = float(row["standard_qty_per_pc"]) * inspected * unit_cost
        actual = float(row["actual_qty_per_pc"]) * inspected * unit_cost
        assert float(row["standard_cost_vnd"]) == pytest.approx(standard)
        assert float(row["actual_cost_vnd"]) == pytest.approx(actual)
        assert float(row["variance_vnd"]) == pytest.approx(actual - standard)
        expected_pct = (
            float(row["actual_qty_per_pc"]) / float(row["standard_qty_per_pc"]) - 1
        ) * 100
        assert float(row["variance_pct"]) == pytest.approx(expected_pct, abs=1e-3)

    standard_cost = phase_totals(rows, "standard_cost_vnd")
    actual_cost = phase_totals(rows, "actual_cost_vnd")
    assert standard_cost["BEFORE"] == pytest.approx(22_222_200)
    assert standard_cost["AFTER"] == pytest.approx(22_222_200)
    assert actual_cost["BEFORE"] == pytest.approx(23_205_000)
    assert actual_cost["AFTER"] == pytest.approx(22_686_300)

    excess_before = actual_cost["BEFORE"] - standard_cost["BEFORE"]
    excess_after = actual_cost["AFTER"] - standard_cost["AFTER"]
    reduction = excess_before - excess_after
    assert excess_before == pytest.approx(982_800)
    assert excess_after == pytest.approx(464_100)
    assert reduction == pytest.approx(518_700)
    assert reduction / excess_before == pytest.approx(0.5277777778, abs=1e-9)

    quantity_totals: dict[tuple[str, str], float] = defaultdict(float)
    count_totals: dict[tuple[str, str], int] = defaultdict(int)
    for row in rows:
        key = (row["phase"], row["material_id"])
        quantity_totals[key] += float(row["actual_qty_per_pc"]) * int(
            row["inspected_pcs"]
        )
        count_totals[key] += int(row["inspected_pcs"])

    for phase in ("BEFORE", "AFTER"):
        assert count_totals[(phase, "MAT-THREAD")] == 1_820
        assert count_totals[(phase, "MAT-TAPE3M")] == 1_820
        assert count_totals[(phase, "MAT-BINDING")] == 1_820

    assert quantity_totals[("BEFORE", "MAT-THREAD")] / 1_820 == pytest.approx(46.8)
    assert quantity_totals[("AFTER", "MAT-THREAD")] / 1_820 == pytest.approx(45.9)
    assert quantity_totals[("BEFORE", "MAT-TAPE3M")] / 1_820 == pytest.approx(0.38)
    assert quantity_totals[("AFTER", "MAT-TAPE3M")] / 1_820 == pytest.approx(0.36)
    assert quantity_totals[("BEFORE", "MAT-BINDING")] / 1_820 == pytest.approx(0.66)
    assert quantity_totals[("AFTER", "MAT-BINDING")] / 1_820 == pytest.approx(0.62)


def test_kaizen_cost_model_separates_assumptions_from_money() -> None:
    rows = read_csv("kaizen_cost_model.csv")

    assumptions = [row for row in rows if row["category"] == "ASSUMPTION"]
    implementation = [
        row
        for row in rows
        if row["category"] == "IMPLEMENTATION"
        and row["item"] != "Total implementation cost"
    ]
    total_rows = [
        row
        for row in rows
        if row["category"] == "IMPLEMENTATION"
        and row["item"] == "Total implementation cost"
    ]

    assert len(assumptions) == 3
    assumption_by_item = {row["item"]: row for row in assumptions}
    assert assumption_by_item["Direct labor rate"]["unit_cost_vnd"] == "60000"
    assert assumption_by_item["Direct labor rate"]["total_vnd"] == ""
    for item in ("Paid hours per shift", "Working days per month"):
        assert assumption_by_item[item]["unit_cost_vnd"] == ""
        assert assumption_by_item[item]["total_vnd"] == ""

    assert len(implementation) == 3
    assert sum(float(row["total_vnd"]) for row in implementation) == pytest.approx(
        12_000_000
    )
    assert len(total_rows) == 1
    assert float(total_rows[0]["total_vnd"]) == pytest.approx(12_000_000)


def test_new_documentation_is_linked() -> None:
    data_dictionary = (ROOT / "DATA_DICTIONARY.md").read_text(encoding="utf-8")
    readme = (ROOT / "README.md").read_text(encoding="utf-8")

    assert "quality_inspection_summary.csv" in data_dictionary
    assert "material_consumption.csv" in data_dictionary
    assert "/api/readiness/evaluate" in data_dictionary
    assert "/api/process-flow/build" in data_dictionary
    assert "DATA_DICTIONARY.md" in readme
    assert "CASE_STUDY_MATERIAL_STANDARD.md" in readme
    assert "PROTECTION_PAY_POLICY_INTAKE.md" in readme
