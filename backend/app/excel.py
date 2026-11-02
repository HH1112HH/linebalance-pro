from __future__ import annotations

from io import BytesIO

from openpyxl import Workbook
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter

from .models import ExportPayload


HEADER_FILL = PatternFill("solid", fgColor="1E40AF")
HEADER_FONT = Font(color="FFFFFF", bold=True)
SECTION_FONT = Font(color="1E3A8A", bold=True, size=12)
THIN_BORDER = Border(bottom=Side(style="thin", color="DBEAFE"))


def _write_header(ws, row: int, headers: list[str]) -> None:
    for column, header in enumerate(headers, start=1):
        cell = ws.cell(row=row, column=column, value=header)
        cell.fill = HEADER_FILL
        cell.font = HEADER_FONT
        cell.alignment = Alignment(horizontal="center", vertical="center")
    ws.freeze_panes = f"A{row + 1}"


def _auto_width(ws) -> None:
    for column_cells in ws.columns:
        length = 0
        for cell in column_cells:
            value = "" if cell.value is None else str(cell.value)
            length = max(length, len(value))
        ws.column_dimensions[get_column_letter(column_cells[0].column)].width = min(
            max(length + 2, 12), 42
        )


def build_workbook(payload: ExportPayload) -> bytes:
    request = payload.request
    result = payload.result
    workbook = Workbook()

    summary = workbook.active
    summary.title = "Summary"
    summary["A1"] = "LineBalance Pro — Optimization Report"
    summary["A1"].font = Font(size=16, bold=True, color="1E3A8A")
    summary["A2"] = (
        "Synthetic/demo data only. Not a production standard. "
        "Machine allocation is not machine utilization."
    )
    summary["A2"].font = Font(italic=True, color="475569")

    rows = [
        ("Line", request.line_name),
        ("Style", request.style_code),
        ("Status", result.status),
        ("Solver status", result.solver_status),
        ("Solve time (s)", result.solve_time_sec),
        ("SAM basis", result.sam_basis),
        ("Allowance applied (%)", result.allowance_applied_pct),
        ("Takt time (s)", result.takt_time_sec),
        ("Effective takt (s)", result.effective_takt_time_sec),
        ("Net available seconds", result.available_seconds),
        ("Planned efficiency", request.config.planned_efficiency),
    ]
    if result.kpis:
        rows.extend(
            [
                ("Workers used", result.kpis.workers_used),
                ("Total SAM (s)", result.kpis.total_sam_sec),
                ("Total planning SAM (s)", result.kpis.total_planning_sam_sec),
                ("Bottleneck station", result.kpis.bottleneck_station),
                ("Bottleneck load (s)", result.kpis.bottleneck_load_sec),
                (
                    "Planned labor utilization at takt (%)",
                    result.kpis.planned_labor_utilization_pct,
                ),
                ("Balance efficiency (%)", result.kpis.balance_efficiency_pct),
                ("Balance delay (%)", result.kpis.balance_delay_pct),
                ("Smoothness index", result.kpis.smoothness_index),
                ("Capacity per shift (pcs)", result.kpis.capacity_per_shift),
                ("Target qty", result.kpis.target_qty),
                ("Target achievement (%)", result.kpis.target_achievement_pct),
                ("Output per operator (pcs)", result.kpis.output_per_operator),
            ]
        )
    if result.metadata:
        rows.extend(
            [
                ("Run ID", result.metadata.run_id),
                ("Data version", result.metadata.data_version),
                ("Model version", result.metadata.model_version),
                ("Solver version", result.metadata.solver_version),
                ("Input hash", result.metadata.input_hash),
                ("Lexicographic proven", result.metadata.lexicographic_proven),
                ("Stage 1 objective", result.metadata.stage1_objective),
                ("Stage 2 objective", result.metadata.stage2_objective),
            ]
        )

    current_row = 4
    for label, value in rows:
        summary.cell(row=current_row, column=1, value=label).font = Font(bold=True)
        summary.cell(row=current_row, column=2, value=value)
        current_row += 1
    summary.column_dimensions["A"].width = 38
    summary.column_dimensions["B"].width = 38

    assignment = workbook.create_sheet("Assignment")
    assignment["A1"] = "Operation → station → worker assignment"
    assignment["A1"].font = SECTION_FONT
    _write_header(
        assignment,
        3,
        [
            "Station",
            "Sequence in station",
            "Worker ID",
            "Worker",
            "Operation ID",
            "Operation",
            "Machine",
            "Skill",
            "Required",
            "Grade",
            "SAM (s)",
            "Planning SAM (s)",
            "Quality gate",
        ],
    )
    for row_index, item in enumerate(result.assignment, start=4):
        values = [
            item.station,
            item.sequence_in_station,
            item.worker_id,
            item.worker_name,
            item.id,
            item.name,
            item.machine_type or "Manual",
            item.skill_code,
            item.skill_required,
            item.skill_grade,
            item.sam_sec,
            item.planning_sam_sec,
            "Yes" if item.is_quality_gate else "No",
        ]
        for column, value in enumerate(values, start=1):
            cell = assignment.cell(row=row_index, column=column, value=value)
            cell.border = THIN_BORDER
    _auto_width(assignment)

    station_sheet = workbook.create_sheet("Station_KPI")
    station_sheet["A1"] = "Station workload and bottleneck view"
    station_sheet["A1"].font = SECTION_FONT
    _write_header(
        station_sheet,
        3,
        [
            "Station",
            "Worker",
            "Operations",
            "Planning load (s)",
            "Raw SAM (s)",
            "Utilization vs effective takt (%)",
            "Idle (s)",
            "Overload (s)",
            "Capacity (pcs/h)",
            "Status",
        ],
    )
    for row_index, station in enumerate(result.stations, start=4):
        values = [
            station.station,
            station.worker_name,
            ", ".join(station.operation_ids),
            station.standard_load_sec,
            station.raw_sam_sec,
            station.standard_utilization_pct,
            station.idle_sec,
            station.overload_sec,
            station.capacity_pcs_h,
            station.status,
        ]
        for column, value in enumerate(values, start=1):
            cell = station_sheet.cell(row=row_index, column=column, value=value)
            cell.border = THIN_BORDER
    _auto_width(station_sheet)

    skill_sheet = workbook.create_sheet("Worker_Skill")
    skill_sheet["A1"] = "Worker skill and allocation summary"
    skill_sheet["A1"].font = SECTION_FONT
    _write_header(
        skill_sheet,
        3,
        [
            "Worker ID",
            "Worker",
            "Used",
            "Station",
            "Machine types",
            "Qualified operations",
            "Versatility (%)",
            "Assigned SAM (s)",
            "Assigned planning SAM (s)",
            "Operations",
        ],
    )
    for row_index, worker in enumerate(result.worker_summary, start=4):
        values = [
            worker.worker_id,
            worker.worker_name,
            "Yes" if worker.used else "No",
            worker.station,
            ", ".join(worker.machine_types) or "Manual",
            worker.qualified_operations,
            worker.versatility_pct,
            worker.assigned_sam_sec,
            worker.assigned_planning_sam_sec,
            ", ".join(worker.operation_ids),
        ]
        for column, value in enumerate(values, start=1):
            cell = skill_sheet.cell(row=row_index, column=column, value=value)
            cell.border = THIN_BORDER
    _auto_width(skill_sheet)

    if result.baseline_comparison:
        baseline_sheet = workbook.create_sheet("Baseline_Compare")
        baseline_sheet["A1"] = "Before/after line balancing comparison"
        baseline_sheet["A1"].font = SECTION_FONT
        comparison = result.baseline_comparison
        rows = []
        if comparison.before:
            rows.extend(
                [
                    ("Before stations", comparison.before.stations_used),
                    ("Before workers", comparison.before.workers_used),
                    ("Before bottleneck station", comparison.before.bottleneck_station),
                    ("Before bottleneck load (s)", comparison.before.bottleneck_load_sec),
                    ("Before balance efficiency (%)", comparison.before.balance_efficiency_pct),
                    ("Before capacity (pcs/shift)", comparison.before.capacity_per_shift),
                    (
                        "Before target achievement (%)",
                        comparison.before.target_achievement_pct,
                    ),
                ]
            )
        rows.extend(
            [
                ("After stations", comparison.after.stations_used),
                ("After workers", comparison.after.workers_used),
                ("After bottleneck station", comparison.after.bottleneck_station),
                ("After bottleneck load (s)", comparison.after.bottleneck_load_sec),
                ("After balance efficiency (%)", comparison.after.balance_efficiency_pct),
                ("After capacity (pcs/shift)", comparison.after.capacity_per_shift),
                ("After target achievement (%)", comparison.after.target_achievement_pct),
                ("Station delta", comparison.station_delta),
                ("Worker delta", comparison.worker_delta),
                ("Bottleneck improvement (s)", comparison.bottleneck_delta_sec),
                (
                    "Balance efficiency delta (%)",
                    comparison.balance_efficiency_delta_pct,
                ),
                ("Capacity delta (pcs)", comparison.capacity_delta_pcs),
                (
                    "Target achievement delta (%)",
                    comparison.target_achievement_delta_pct,
                ),
            ]
        )
        for row_index, (label, value) in enumerate(rows, start=3):
            baseline_sheet.cell(row=row_index, column=1, value=label).font = Font(bold=True)
            baseline_sheet.cell(row=row_index, column=2, value=value)
        row_index = len(rows) + 5
        baseline_sheet.cell(row=row_index, column=1, value="Baseline violations").font = Font(
            bold=True
        )
        for violation in comparison.violations:
            row_index += 1
            baseline_sheet.cell(row=row_index, column=1, value=violation)
        for note in comparison.notes:
            row_index += 1
            baseline_sheet.cell(row=row_index, column=1, value=note)
        baseline_sheet.column_dimensions["A"].width = 44
        baseline_sheet.column_dimensions["B"].width = 24

    if result.actuals_analysis:
        actuals_sheet = workbook.create_sheet("Actuals")
        actuals_sheet["A1"] = "Actual production and loss-time analysis"
        actuals_sheet["A1"].font = SECTION_FONT
        analysis = result.actuals_analysis
        rows = [
            ("Period days", analysis.period_days),
            ("Target output", analysis.target_output),
            ("Actual output", analysis.actual_output),
            ("Production achievement (%)", analysis.production_achievement_pct),
            ("Actual direct labor minutes", analysis.actual_direct_labor_minutes),
            ("Actual labor efficiency (%)", analysis.actual_labor_efficiency_pct),
            ("Downtime minutes", analysis.downtime_minutes),
            ("Downtime (% of planned time)", analysis.downtime_pct_of_planned_time),
        ]
        for row_index, (label, value) in enumerate(rows, start=3):
            actuals_sheet.cell(row=row_index, column=1, value=label).font = Font(bold=True)
            actuals_sheet.cell(row=row_index, column=2, value=value)
        row_index = len(rows) + 5
        actuals_sheet.cell(row=row_index, column=1, value="Downtime by category").font = Font(
            bold=True
        )
        for category, minutes in analysis.downtime_by_category.items():
            row_index += 1
            actuals_sheet.cell(row=row_index, column=1, value=category)
            actuals_sheet.cell(row=row_index, column=2, value=minutes)
        for note in analysis.notes:
            row_index += 1
            actuals_sheet.cell(row=row_index, column=1, value=note)
        actuals_sheet.column_dimensions["A"].width = 44
        actuals_sheet.column_dimensions["B"].width = 24

    warning_sheet = workbook.create_sheet("Warnings")
    warning_sheet["A1"] = "Warnings and diagnostics"
    warning_sheet["A1"].font = SECTION_FONT
    _write_header(
        warning_sheet,
        3,
        ["Severity", "Code", "Message", "Station", "Operation", "Worker"],
    )
    row_index = 4
    for warning in result.warnings:
        values = [
            warning.severity,
            warning.code,
            warning.message,
            warning.station,
            warning.operation_id,
            warning.worker_id,
        ]
        for column, value in enumerate(values, start=1):
            cell = warning_sheet.cell(row=row_index, column=column, value=value)
            cell.border = THIN_BORDER
        row_index += 1
    for issue in result.diagnostics.issues:
        warning_sheet.cell(row=row_index, column=1, value="error")
        warning_sheet.cell(row=row_index, column=2, value="diagnostic")
        warning_sheet.cell(row=row_index, column=3, value=issue)
        row_index += 1
    _auto_width(warning_sheet)

    output = BytesIO()
    workbook.save(output)
    return output.getvalue()
