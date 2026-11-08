"""Build the synthetic scenario workbook from the CSV templates.

Run from the repository root:

    .venv\\Scripts\\python.exe scripts\\build_scenario_workbook.py

The workbook has four sheets: operations, workers, worker_skills and machines.
Sheet values are plain values (no formulas), matching the CSV templates.
"""

from __future__ import annotations

import csv
from pathlib import Path

from openpyxl import Workbook

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "docs" / "data" / "scenario_master"

SHEETS = (
    ("operations", "operations.csv"),
    ("workers", "workers.csv"),
    ("worker_skills", "worker_skills.csv"),
    ("machines", "machines.csv"),
)


def typed_cell(value: str) -> object:
    if value == "":
        return None
    if value.lower() in {"true", "false"}:
        return value.lower() == "true"
    try:
        number = float(value)
    except ValueError:
        return value
    return int(number) if number.is_integer() else number


def main() -> None:
    workbook = Workbook()
    workbook.remove(workbook.active)
    for sheet_name, filename in SHEETS:
        sheet = workbook.create_sheet(sheet_name)
        with (DATA / filename).open(encoding="utf-8-sig", newline="") as handle:
            for row in csv.reader(handle):
                sheet.append([typed_cell(value) for value in row])
    output = DATA / "scenario_master.xlsx"
    workbook.save(output)
    print(f"Wrote {output} with {len(SHEETS)} sheets.")


if __name__ == "__main__":
    main()
