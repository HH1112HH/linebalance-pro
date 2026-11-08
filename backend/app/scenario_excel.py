from __future__ import annotations

import csv
import io
import zipfile
from datetime import date, datetime, time
from typing import Any

from openpyxl import load_workbook
from pydantic import ValidationError

from .models import ScenarioImportPreview, ScenarioImportRequest
from .scenario_import import ScenarioImportError, parse_scenario_bundle

XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

SHEET_OPERATIONS = "operations"
SHEET_WORKERS = "workers"
SHEET_WORKER_SKILLS = "worker_skills"
SHEET_MACHINES = "machines"

REQUIRED_SHEETS = (SHEET_OPERATIONS, SHEET_WORKERS, SHEET_WORKER_SKILLS)
KNOWN_SHEETS = (*REQUIRED_SHEETS, SHEET_MACHINES)

MAX_ZIP_ENTRIES = 2_000
MAX_UNCOMPRESSED_BYTES = 20_000_000
MAX_WORKSHEETS = 30
MAX_SHEET_ROWS = 10_001  # header + 10,000 data rows


def parse_scenario_workbook(body: bytes) -> ScenarioImportPreview:
    """Parse one .xlsx workbook with four scenario master-data sheets.

    Sheet names are case-insensitive: ``operations``, ``workers``,
    ``worker_skills`` and optional ``machines``. Each sheet is converted to the
    same CSV text accepted by ``parse_scenario_bundle``, so validation rules are
    shared with the CSV endpoint and nothing is persisted.
    """
    if not body:
        raise ScenarioImportError("Excel workbook is empty.")

    _check_archive(body)
    try:
        workbook = load_workbook(io.BytesIO(body), read_only=True, data_only=True)
    except Exception as exc:  # openpyxl raises several parser-specific errors.
        raise ScenarioImportError("Excel file is not a valid .xlsx workbook.") from exc

    try:
        sheets = _find_sheets(workbook)
        try:
            request = ScenarioImportRequest(
                operations_csv=_sheet_to_csv(
                    sheets[SHEET_OPERATIONS], SHEET_OPERATIONS, required=True
                ),
                workers_csv=_sheet_to_csv(
                    sheets[SHEET_WORKERS], SHEET_WORKERS, required=True
                ),
                worker_skills_csv=_sheet_to_csv(
                    sheets[SHEET_WORKER_SKILLS], SHEET_WORKER_SKILLS, required=True
                ),
                machines_csv=_sheet_to_csv(
                    sheets.get(SHEET_MACHINES), SHEET_MACHINES, required=False
                ),
            )
        except ValidationError as exc:
            raise ScenarioImportError(
                "Excel sheet content exceeds the 2,000,000-character import limit."
            ) from exc
    finally:
        workbook.close()

    return parse_scenario_bundle(request)


def _check_archive(body: bytes) -> None:
    try:
        with zipfile.ZipFile(io.BytesIO(body)) as archive:
            entries = archive.infolist()
            if len(entries) > MAX_ZIP_ENTRIES:
                raise ScenarioImportError(
                    "Excel workbook contains too many embedded files."
                )
            if not any(entry.filename == "xl/workbook.xml" for entry in entries):
                raise ScenarioImportError("Excel file is not a valid .xlsx workbook.")
            uncompressed = sum(entry.file_size for entry in entries)
            if uncompressed > MAX_UNCOMPRESSED_BYTES:
                raise ScenarioImportError(
                    "Excel workbook expands beyond the "
                    f"{MAX_UNCOMPRESSED_BYTES:,}-byte safety limit; "
                    "reduce the content and retry."
                )
    except zipfile.BadZipFile as exc:
        raise ScenarioImportError("Excel file is not a valid .xlsx workbook.") from exc
    except OSError as exc:
        raise ScenarioImportError("Excel file could not be read.") from exc


def _find_sheets(workbook: Any) -> dict[str, Any]:
    if len(workbook.worksheets) > MAX_WORKSHEETS:
        raise ScenarioImportError(
            f"Excel workbook has {len(workbook.worksheets)} worksheets; "
            f"the limit is {MAX_WORKSHEETS}."
        )

    found: dict[str, Any] = {}
    duplicates: set[str] = set()
    for sheet in workbook.worksheets:
        key = _sheet_key(sheet.title)
        if key not in KNOWN_SHEETS:
            continue
        if key in found:
            duplicates.add(key)
        found[key] = sheet

    if duplicates:
        raise ScenarioImportError(
            "Excel workbook has duplicate sheet names: "
            + ", ".join(sorted(duplicates))
            + "."
        )

    missing = [name for name in REQUIRED_SHEETS if name not in found]
    if missing:
        raise ScenarioImportError(
            "Excel workbook is missing required sheets: " + ", ".join(missing) + "."
        )
    return found


def _sheet_key(title: str) -> str:
    return "_".join(title.strip().lower().replace("-", " ").split())


def _sheet_to_csv(sheet: Any | None, label: str, *, required: bool) -> str:
    if sheet is None:
        if required:
            raise ScenarioImportError(f"Excel workbook is missing sheet {label}.")
        return ""
    rows = _sheet_rows(sheet, label)
    if not rows:
        if required:
            raise ScenarioImportError(f"[{label}] Sheet is empty.")
        return ""
    return _rows_to_csv(rows)


def _sheet_rows(sheet: Any, label: str) -> list[list[str]]:
    rows: list[list[str]] = []
    for raw in sheet.iter_rows(values_only=True):
        values = [_cell_text(cell) for cell in raw]
        while values and not values[-1]:
            values.pop()
        if not values or not any(values):
            continue
        rows.append(values)
        if len(rows) > MAX_SHEET_ROWS:
            raise ScenarioImportError(
                f"[{label}] Sheet has more than {MAX_SHEET_ROWS - 1:,} rows."
            )
    return rows


def _rows_to_csv(rows: list[list[str]]) -> str:
    buffer = io.StringIO()
    writer = csv.writer(buffer, lineterminator="\n")
    writer.writerows(rows)
    return buffer.getvalue()


def _cell_text(value: object) -> str:
    if value is None:
        return ""
    if isinstance(value, bool):
        return "true" if value else "false"
    if isinstance(value, datetime | date | time):
        return value.isoformat()
    if isinstance(value, float):
        if value.is_integer():
            return str(int(value))
        return format(value, ".15g")
    if isinstance(value, int):
        return str(value)
    return str(value).strip()
