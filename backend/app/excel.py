from __future__ import annotations

import re
from io import BytesIO

from openpyxl import Workbook
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter

from .models import ExportPayload, OptimizeRequest, OptimizeResponse, WarningItem

HEADER_FILL = PatternFill("solid", fgColor="1E40AF")
HEADER_FONT = Font(color="FFFFFF", bold=True)
SECTION_FONT = Font(color="1E3A8A", bold=True, size=12)
THIN_BORDER = Border(bottom=Side(style="thin", color="DBEAFE"))

TEXT: dict[str, dict[str, str]] = {
    "en": {
        "yes": "Yes",
        "no": "No",
        "manual": "Manual",
        "status_optimal": "Proven optimal",
        "status_feasible": "Feasible · optimality not proven",
        "status_infeasible": "Infeasible",
        "status_error": "Error",
        "summary_sheet": "Summary",
        "assignment_sheet": "Assignment",
        "station_sheet": "Station_KPI",
        "worker_sheet": "Worker_Skill",
        "baseline_sheet": "Baseline_Compare",
        "actuals_sheet": "Actuals",
        "warnings_sheet": "Warnings",
        "report_title": "LineBalance Pro — Optimization Report",
        "report_note": (
            "Synthetic/demo data only. Not a production standard. "
            "Machine allocation is not machine utilization."
        ),
        "line": "Line",
        "style": "Style",
        "status": "Status",
        "solver_status": "Solver status",
        "solve_time_s": "Solve time (s)",
        "sam_basis": "SAM basis",
        "sam_includes": "SAM includes allowance",
        "sam_excludes": "SAM excludes allowance",
        "allowance_applied_pct": "Allowance applied (%)",
        "takt_time_s": "Takt time (s)",
        "effective_takt_s": "Effective takt (s)",
        "net_available_s": "Net available seconds",
        "planned_efficiency": "Planned efficiency",
        "workers_used": "Workers used",
        "total_sam_s": "Total SAM (s)",
        "total_planning_sam_s": "Total planning SAM (s)",
        "bottleneck_station": "Bottleneck station",
        "bottleneck_load_s": "Bottleneck load (s)",
        "planned_labor_utilization_takt_pct": ("Planned labor utilization at takt (%)"),
        "balance_efficiency_pct": "Balance efficiency (%)",
        "balance_delay_pct": "Balance delay (%)",
        "smoothness_index": "Smoothness index",
        "capacity_per_shift_pcs": "Capacity per shift (pcs)",
        "target_qty": "Target qty",
        "target_achievement_pct": "Target achievement (%)",
        "output_per_operator_pcs": "Output per operator (pcs)",
        "run_id": "Run ID",
        "data_version": "Data version",
        "model_version": "Model version",
        "solver_version": "Solver version",
        "input_hash": "Input hash",
        "lexicographic_proven": "Lexicographic proven",
        "stage1_objective": "Stage 1 objective",
        "stage2_objective": "Stage 2 objective",
        "assignment_title": "Operation → station → worker assignment",
        "station": "Station",
        "sequence_in_station": "Sequence in station",
        "worker_id": "Worker ID",
        "worker": "Worker",
        "operation_id": "Operation ID",
        "operation": "Operation",
        "machine": "Machine",
        "skill": "Skill",
        "required": "Required",
        "grade": "Grade",
        "sam_s": "SAM (s)",
        "planning_sam_s": "Planning SAM (s)",
        "quality_gate": "Quality gate",
        "station_kpi_title": "Station workload and bottleneck view",
        "operations": "Operations",
        "planning_load_s": "Planning load (s)",
        "raw_sam_s": "Raw SAM (s)",
        "utilization_vs_effective_takt_pct": ("Utilization vs effective takt (%)"),
        "idle_s": "Idle (s)",
        "overload_s": "Overload (s)",
        "capacity_pcs_h": "Capacity (pcs/h)",
        "station_bottleneck": "Bottleneck",
        "station_watch": "Watch",
        "station_normal": "Normal",
        "station_underutilized": "Underutilized",
        "worker_skill_title": "Worker skill and allocation summary",
        "used": "Used",
        "machine_types": "Machine types",
        "qualified_operations": "Qualified operations",
        "versatility_pct": "Versatility (%)",
        "assigned_sam_s": "Assigned SAM (s)",
        "assigned_planning_sam_s": "Assigned planning SAM (s)",
        "baseline_title": "Before/after line balancing comparison",
        "before_stations": "Before stations",
        "before_workers": "Before workers",
        "before_bottleneck_station": "Before bottleneck station",
        "before_bottleneck_load_s": "Before bottleneck load (s)",
        "before_balance_efficiency_pct": "Before balance efficiency (%)",
        "before_capacity_pcs_shift": "Before capacity (pcs/shift)",
        "before_target_achievement_pct": "Before target achievement (%)",
        "after_stations": "After stations",
        "after_workers": "After workers",
        "after_bottleneck_station": "After bottleneck station",
        "after_bottleneck_load_s": "After bottleneck load (s)",
        "after_balance_efficiency_pct": "After balance efficiency (%)",
        "after_capacity_pcs_shift": "After capacity (pcs/shift)",
        "after_target_achievement_pct": "After target achievement (%)",
        "station_delta": "Station delta",
        "worker_delta": "Worker delta",
        "bottleneck_improvement_s": "Bottleneck improvement (s)",
        "balance_efficiency_delta_pct": "Balance efficiency delta (%)",
        "capacity_delta_pcs": "Capacity delta (pcs)",
        "target_achievement_delta_pct": "Target achievement delta (%)",
        "baseline_violations": "Baseline violations",
        "actuals_title": "Actual production and loss-time analysis",
        "period_days": "Period days",
        "target_output": "Target output",
        "actual_output": "Actual output",
        "production_achievement_pct": "Production achievement (%)",
        "actual_direct_labor_minutes": "Actual direct labor minutes",
        "actual_labor_efficiency_pct": "Actual labor efficiency (%)",
        "downtime_minutes": "Downtime minutes",
        "downtime_pct_planned": "Downtime (% of planned time)",
        "downtime_by_category": "Downtime by category",
        "loss_machine": "Machine",
        "loss_material": "Material",
        "loss_manpower": "Manpower",
        "loss_quality": "Quality",
        "loss_unspecified": "Unspecified",
        "warnings_title": "Warnings and diagnostics",
        "severity": "Severity",
        "code": "Code",
        "message": "Message",
        "severity_info": "Info",
        "severity_warning": "Warning",
        "severity_critical": "Critical",
    },
    "vi": {
        "yes": "Có",
        "no": "Không",
        "manual": "Thủ công",
        "status_optimal": "Đã chứng minh tối ưu",
        "status_feasible": "Có phương án khả thi · chưa chứng minh tối ưu",
        "status_infeasible": "Không khả thi",
        "status_error": "Lỗi",
        "summary_sheet": "Tổng quan",
        "assignment_sheet": "Phân công",
        "station_sheet": "Tải trạm",
        "worker_sheet": "Kỹ năng CN",
        "baseline_sheet": "Trước sau",
        "actuals_sheet": "Thực tế",
        "warnings_sheet": "Cảnh báo",
        "report_title": "LineBalance Pro — Báo cáo tối ưu hóa",
        "report_note": (
            "Chỉ dùng dữ liệu tổng hợp/minh họa. Không phải định mức sản xuất. "
            "Phân bổ máy không phải hiệu suất máy."
        ),
        "line": "Chuyền",
        "style": "Mã hàng",
        "status": "Trạng thái",
        "solver_status": "Trạng thái tối ưu hóa",
        "solve_time_s": "Thời gian giải (giây)",
        "sam_basis": "Cơ sở định mức",
        "sam_includes": "Định mức đã bao gồm phụ cấp thời gian",
        "sam_excludes": "Định mức chưa gồm phụ cấp thời gian",
        "allowance_applied_pct": "Phụ cấp thời gian đã áp dụng (%)",
        "takt_time_s": "Nhịp theo nhu cầu (giây)",
        "effective_takt_s": "Nhịp hiệu dụng (giây)",
        "net_available_s": "Thời gian khả dụng ròng (giây)",
        "planned_efficiency": "Hiệu suất kế hoạch",
        "workers_used": "Công nhân sử dụng",
        "total_sam_s": "Tổng định mức (giây)",
        "total_planning_sam_s": "Tổng định mức kế hoạch (giây)",
        "bottleneck_station": "Trạm nút cổ chai",
        "bottleneck_load_s": "Tải nút cổ chai (giây)",
        "planned_labor_utilization_takt_pct": ("Tỷ lệ sử dụng lao động theo nhịp (%)"),
        "balance_efficiency_pct": "Hiệu suất cân bằng (%)",
        "balance_delay_pct": "Độ trễ cân bằng (%)",
        "smoothness_index": "Chỉ số độ mượt tải",
        "capacity_per_shift_pcs": "Năng lực mỗi ca (sản phẩm)",
        "target_qty": "Mục tiêu sản lượng",
        "target_achievement_pct": "Mức đạt mục tiêu (%)",
        "output_per_operator_pcs": "Sản lượng mỗi công nhân (sản phẩm)",
        "run_id": "Mã lần chạy",
        "data_version": "Phiên bản dữ liệu",
        "model_version": "Phiên bản mô hình",
        "solver_version": "Phiên bản bộ tối ưu hóa",
        "input_hash": "Mã băm đầu vào",
        "lexicographic_proven": "Đã chứng minh tối ưu hai bước",
        "stage1_objective": "Mục tiêu bước 1",
        "stage2_objective": "Mục tiêu bước 2",
        "assignment_title": "Phân công công đoạn → trạm → công nhân",
        "station": "Trạm",
        "sequence_in_station": "Thứ tự trong trạm",
        "worker_id": "Mã công nhân",
        "worker": "Công nhân",
        "operation_id": "Mã công đoạn",
        "operation": "Công đoạn",
        "machine": "Máy",
        "skill": "Kỹ năng",
        "required": "Yêu cầu",
        "grade": "Bậc",
        "sam_s": "Định mức (giây)",
        "planning_sam_s": "Định mức kế hoạch (giây)",
        "quality_gate": "Điểm kiểm tra chất lượng",
        "station_kpi_title": "Tải trạm và góc nhìn nút cổ chai",
        "operations": "Công đoạn",
        "planning_load_s": "Tải kế hoạch (giây)",
        "raw_sam_s": "Định mức gốc (giây)",
        "utilization_vs_effective_takt_pct": (
            "Tỷ lệ sử dụng so với nhịp hiệu dụng (%)"
        ),
        "idle_s": "Nhàn rỗi (giây)",
        "overload_s": "Quá tải (giây)",
        "capacity_pcs_h": "Năng lực (sản phẩm/giờ)",
        "station_bottleneck": "Nút cổ chai",
        "station_watch": "Theo dõi",
        "station_normal": "Bình thường",
        "station_underutilized": "Thiếu tải",
        "worker_skill_title": "Tóm tắt kỹ năng và phân công công nhân",
        "used": "Được sử dụng",
        "machine_types": "Loại máy",
        "qualified_operations": "Công đoạn đủ điều kiện",
        "versatility_pct": "Độ đa năng (%)",
        "assigned_sam_s": "Định mức được giao (giây)",
        "assigned_planning_sam_s": "Định mức kế hoạch được giao (giây)",
        "baseline_title": "So sánh cân bằng chuyền trước/sau",
        "before_stations": "Số trạm hiện trạng",
        "before_workers": "Công nhân hiện trạng",
        "before_bottleneck_station": "Trạm nút cổ chai hiện trạng",
        "before_bottleneck_load_s": "Tải nút cổ chai hiện trạng (giây)",
        "before_balance_efficiency_pct": "Hiệu suất cân bằng hiện trạng (%)",
        "before_capacity_pcs_shift": "Năng lực hiện trạng (sản phẩm/ca)",
        "before_target_achievement_pct": "Mức đạt mục tiêu hiện trạng (%)",
        "after_stations": "Số trạm tối ưu",
        "after_workers": "Công nhân tối ưu",
        "after_bottleneck_station": "Trạm nút cổ chai tối ưu",
        "after_bottleneck_load_s": "Tải nút cổ chai tối ưu (giây)",
        "after_balance_efficiency_pct": "Hiệu suất cân bằng tối ưu (%)",
        "after_capacity_pcs_shift": "Năng lực tối ưu (sản phẩm/ca)",
        "after_target_achievement_pct": "Mức đạt mục tiêu tối ưu (%)",
        "station_delta": "Chênh lệch số trạm",
        "worker_delta": "Chênh lệch công nhân",
        "bottleneck_improvement_s": "Cải thiện nút cổ chai (giây)",
        "balance_efficiency_delta_pct": ("Chênh lệch hiệu suất cân bằng (điểm %)"),
        "capacity_delta_pcs": "Chênh lệch năng lực (sản phẩm)",
        "target_achievement_delta_pct": ("Chênh lệch mức đạt mục tiêu (điểm %)"),
        "baseline_violations": "Vi phạm hiện trạng",
        "actuals_title": "Phân tích sản xuất thực tế và thời gian tổn thất",
        "period_days": "Số ngày trong kỳ",
        "target_output": "Sản lượng mục tiêu",
        "actual_output": "Sản lượng thực tế",
        "production_achievement_pct": "Mức đạt sản lượng (%)",
        "actual_direct_labor_minutes": "Phút lao động trực tiếp thực tế",
        "actual_labor_efficiency_pct": "Hiệu suất lao động thực tế (%)",
        "downtime_minutes": "Phút thời gian dừng",
        "downtime_pct_planned": "Thời gian dừng (% thời gian kế hoạch)",
        "downtime_by_category": "Thời gian dừng theo nhóm",
        "loss_machine": "Máy",
        "loss_material": "Nguyên liệu",
        "loss_manpower": "Nhân lực",
        "loss_quality": "Chất lượng",
        "loss_unspecified": "Chưa phân loại",
        "warnings_title": "Cảnh báo và chẩn đoán",
        "severity": "Mức độ",
        "code": "Mã",
        "message": "Thông điệp",
        "severity_info": "Thông tin",
        "severity_warning": "Cảnh báo",
        "severity_critical": "Nghiêm trọng",
    },
}

NOTE_TRANSLATIONS = {
    (
        "Synthetic current-state baseline: first-fit 60s station target, one worker "
        "per station, respects skill/machine/precedence. Not an optimizer output."
    ): (
        "Hiện trạng tổng hợp: xếp lần lượt theo mục tiêu trạm 60 giây, một công nhân "
        "mỗi trạm, tôn trọng kỹ năng/máy/thứ tự công đoạn. Không phải kết quả của bộ "
        "tối ưu hóa."
    ),
    (
        "Bottleneck delta is reported as before - after, so a positive value is an "
        "improvement."
    ): (
        "Chênh lệch nút cổ chai tính theo hiện trạng - tối ưu, nên giá trị dương là "
        "cải thiện."
    ),
    (
        "Baseline violations are listed but do not block the comparison; a real "
        "current-state layout may violate the assumptions of the optimized model."
    ): (
        "Các vi phạm hiện trạng được liệt kê nhưng không chặn so sánh; bố trí hiện "
        "trạng thực tế có thể vi phạm giả định của mô hình tối ưu."
    ),
    (
        "No complete baseline metrics were computed because the baseline is incomplete."
    ): ("Không tính được đầy đủ chỉ số hiện trạng vì dữ liệu hiện trạng chưa đầy đủ."),
    (
        "Downtime events and the summary downtime differ; the summary value is used "
        "for total downtime, and the category table shows event-level detail."
    ): (
        "Sự kiện dừng và tổng thời gian dừng không khớp; tổng thời gian dừng dùng giá "
        "trị tổng hợp, còn bảng theo nhóm hiển thị chi tiết từng sự kiện."
    ),
    (
        "Production achievement uses the reported target for the same period. Actual "
        "labor efficiency uses planning SAM (allowance applied once), not raw SAM. "
        "Downtime percentage uses planned shift minutes, not net available minutes."
    ): (
        "Mức đạt sản lượng dùng mục tiêu báo cáo cùng kỳ. Hiệu suất lao động thực tế "
        "dùng định mức kế hoạch (phụ cấp thời gian áp dụng một lần), không dùng định "
        "mức gốc. Tỷ lệ thời gian dừng dùng số phút ca kế hoạch, không dùng thời gian "
        "khả dụng ròng."
    ),
    (
        "Actual labor efficiency is not calculated because actual direct labor "
        "minutes were not provided. Elapsed shift time is not a substitute."
    ): (
        "Không tính hiệu suất lao động thực tế vì chưa có phút lao động trực tiếp "
        "thực tế. Thời gian ca đã trôi qua không thay thế được."
    ),
}


def _t(language: str, key: str) -> str:
    table = TEXT.get(language, TEXT["en"])
    return table.get(key, TEXT["en"].get(key, key))


def _yes_no(language: str, value: bool) -> str:
    return _t(language, "yes") if value else _t(language, "no")


def _display_status(language: str, status: str) -> str:
    key = {
        "OPTIMAL": "status_optimal",
        "FEASIBLE_LIMIT": "status_feasible",
        "INFEASIBLE": "status_infeasible",
        "ERROR": "status_error",
    }.get(status.upper())
    return _t(language, key) if key else status


def _station_status(language: str, status: str) -> str:
    key = {
        "bottleneck": "station_bottleneck",
        "watch": "station_watch",
        "normal": "station_normal",
        "underutilized": "station_underutilized",
    }.get(status.lower())
    return _t(language, key) if key else status


def _sam_basis(language: str, basis: str) -> str:
    key = {
        "INCLUDES_ALLOWANCE": "sam_includes",
        "EXCLUDES_ALLOWANCE": "sam_excludes",
    }.get(basis.upper())
    return _t(language, key) if key else basis


def _loss_category(language: str, code: str) -> str:
    key = {
        "MACHINE": "loss_machine",
        "MATERIAL": "loss_material",
        "MANPOWER": "loss_manpower",
        "QUALITY": "loss_quality",
        "UNSPECIFIED": "loss_unspecified",
    }.get(code.upper())
    return _t(language, key) if key else code


def _severity(language: str, severity: str) -> str:
    key = {
        "info": "severity_info",
        "warning": "severity_warning",
        "critical": "severity_critical",
    }.get(severity.lower())
    return _t(language, key) if key else severity


def _localized_note(language: str, note: str) -> str:
    if language != "vi":
        return note
    translated = NOTE_TRANSLATIONS.get(note)
    if translated:
        return translated
    missing_days = re.match(
        r"Direct labor minutes are missing for (\d+) day\(s\); actual labor "
        r"efficiency uses only the reported days\.",
        note,
    )
    if missing_days:
        return (
            f"Thiếu phút lao động trực tiếp cho {missing_days.group(1)} ngày; "
            "hiệu suất lao động thực tế chỉ dùng các ngày đã báo cáo."
        )
    return note


def _worker_name(result: OptimizeResponse, worker_id: str | None) -> str:
    if not worker_id:
        return "—"
    for worker in result.worker_summary:
        if worker.worker_id == worker_id:
            return worker.worker_name
    return worker_id


def _utilization_from_message(message: str) -> str:
    match = re.search(r"\(([\d.]+)%\)", message)
    return match.group(1) if match else "—"


def _localized_warning(
    language: str,
    warning: WarningItem,
    result: OptimizeResponse,
    request: OptimizeRequest,
) -> str:
    if language != "vi":
        return warning.message
    suffix = warning.message
    worker = _worker_name(result, warning.worker_id)
    utilization = _utilization_from_message(suffix)
    code = warning.code
    if code == "station_over_effective_takt":
        return (
            f"Trạm {warning.station} ({worker}) vượt nhịp hiệu dụng "
            f"({utilization}%). Hãy cân bằng lại hoặc tăng năng lực."
        )
    if code == "station_near_effective_takt":
        return (
            f"Trạm {warning.station} ({worker}) gần nhịp hiệu dụng "
            f"({utilization}%). Hãy theo dõi trạm này."
        )
    if code == "station_underutilized":
        return (
            f"Trạm {warning.station} ({worker}) thiếu tải ({utilization}%). "
            "Hãy xem xét gộp công đoạn."
        )
    if code == "unused_workers":
        unused = [item for item in result.worker_summary if not item.used]
        names = ", ".join(item.worker_name for item in unused[:8])
        ellipsis = "..." if len(unused) > 8 else ""
        return f"{len(unused)} công nhân sẵn có chưa được sử dụng: {names}{ellipsis}"
    if code == "headcount_limit_binding":
        allowed = request.config.max_workers or len(result.stations)
        return (
            f"Phương án dùng {len(result.stations)} trên {allowed} công nhân cho phép. "
            "Giới hạn nhân sự đang ràng buộc."
        )
    if code == "capacity_target_not_met":
        capacity = result.kpis.capacity_per_shift if result.kpis else 0.0
        gap = max(request.config.target_qty - capacity, 0.0)
        return (
            f"Năng lực dự kiến {capacity:.0f} sản phẩm/ca so với mục tiêu "
            f"{request.config.target_qty} sản phẩm ở hiệu suất kế hoạch "
            f"{request.config.planned_efficiency:.0%}. Chuyền thiếu {gap:.0f} sản phẩm."
        )
    if code == "machine_capacity_shared":
        match = re.search(
            r"(\d+) operations need (\w+), but only (\d+) machine", suffix
        )
        if match:
            return (
                f"{match.group(1)} công đoạn cần {match.group(2)}, nhưng chỉ có "
                f"{match.group(3)} máy. Một số công đoạn phải dùng chung trạm."
            )
        return "Một số công đoạn phải dùng chung trạm do số máy có hạn."
    if code == "allowance_ignored":
        return (
            "Định mức đã bao gồm phụ cấp thời gian; phụ cấp không được cộng thêm để "
            "tránh tính hai lần."
        )
    if code == "baseline_violations":
        count = (
            len(result.baseline_comparison.violations)
            if result.baseline_comparison
            else 0
        )
        return f"Hiện trạng có {count} vi phạm ràng buộc; xem trang Trước sau."
    if code == "max_workers_clamped":
        available = sum(1 for item in request.workers if item.available)
        requested = request.config.max_workers or available
        return (
            f"Giới hạn công nhân {requested} vượt số {available} công nhân sẵn có; "
            "giới hạn đã được điều chỉnh."
        )
    if code == "operation_over_effective_takt":
        return f"Công đoạn {warning.operation_id} vượt nhịp hiệu dụng."
    if code == "operation_over_demand_takt":
        return f"Công đoạn {warning.operation_id} vượt nhịp theo nhu cầu."
    if code == "single_point_of_failure":
        return (
            f"Công nhân {worker} là điểm lỗi đơn cho công đoạn {warning.operation_id}."
        )
    if code == "takt_unreachable_lower_bound":
        return (
            "Ngay cả trước khi xếp thứ tự, nút cổ chai tốt nhất vẫn vượt nhịp hiệu "
            "dụng. Chuyền không thể đạt mục tiêu năng lực với dữ liệu hiện tại."
        )
    if code == "worker_no_qualified_operation":
        return f"Công nhân {worker} không có công đoạn phù hợp với kỹ năng."
    return "Cảnh báo khác từ bộ tối ưu hóa."


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
    language = payload.language
    workbook = Workbook()

    summary = workbook.active
    summary.title = _t(language, "summary_sheet")
    summary["A1"] = _t(language, "report_title")
    summary["A1"].font = Font(size=16, bold=True, color="1E3A8A")
    summary["A2"] = _t(language, "report_note")
    summary["A2"].font = Font(italic=True, color="475569")

    rows = [
        (_t(language, "line"), request.line_name),
        (_t(language, "style"), request.style_code),
        (_t(language, "status"), _display_status(language, result.status)),
        (_t(language, "solver_status"), result.solver_status),
        (_t(language, "solve_time_s"), result.solve_time_sec),
        (_t(language, "sam_basis"), _sam_basis(language, result.sam_basis)),
        (_t(language, "allowance_applied_pct"), result.allowance_applied_pct),
        (_t(language, "takt_time_s"), result.takt_time_sec),
        (_t(language, "effective_takt_s"), result.effective_takt_time_sec),
        (_t(language, "net_available_s"), result.available_seconds),
        (_t(language, "planned_efficiency"), request.config.planned_efficiency),
    ]
    if result.kpis:
        rows.extend(
            [
                (_t(language, "workers_used"), result.kpis.workers_used),
                (_t(language, "total_sam_s"), result.kpis.total_sam_sec),
                (
                    _t(language, "total_planning_sam_s"),
                    result.kpis.total_planning_sam_sec,
                ),
                (_t(language, "bottleneck_station"), result.kpis.bottleneck_station),
                (_t(language, "bottleneck_load_s"), result.kpis.bottleneck_load_sec),
                (
                    _t(language, "planned_labor_utilization_takt_pct"),
                    result.kpis.planned_labor_utilization_pct,
                ),
                (
                    _t(language, "balance_efficiency_pct"),
                    result.kpis.balance_efficiency_pct,
                ),
                (_t(language, "balance_delay_pct"), result.kpis.balance_delay_pct),
                (_t(language, "smoothness_index"), result.kpis.smoothness_index),
                (
                    _t(language, "capacity_per_shift_pcs"),
                    result.kpis.capacity_per_shift,
                ),
                (_t(language, "target_qty"), result.kpis.target_qty),
                (
                    _t(language, "target_achievement_pct"),
                    result.kpis.target_achievement_pct,
                ),
                (
                    _t(language, "output_per_operator_pcs"),
                    result.kpis.output_per_operator,
                ),
            ]
        )
    if result.metadata:
        rows.extend(
            [
                (_t(language, "run_id"), result.metadata.run_id),
                (_t(language, "data_version"), result.metadata.data_version),
                (_t(language, "model_version"), result.metadata.model_version),
                (_t(language, "solver_version"), result.metadata.solver_version),
                (_t(language, "input_hash"), result.metadata.input_hash),
                (
                    _t(language, "lexicographic_proven"),
                    _yes_no(language, result.metadata.lexicographic_proven),
                ),
                (
                    _t(language, "stage1_objective"),
                    result.metadata.stage1_objective,
                ),
                (
                    _t(language, "stage2_objective"),
                    result.metadata.stage2_objective,
                ),
            ]
        )

    current_row = 4
    for label, value in rows:
        summary.cell(row=current_row, column=1, value=label).font = Font(bold=True)
        summary.cell(row=current_row, column=2, value=value)
        current_row += 1
    summary.column_dimensions["A"].width = 38
    summary.column_dimensions["B"].width = 38

    assignment = workbook.create_sheet(_t(language, "assignment_sheet"))
    assignment["A1"] = _t(language, "assignment_title")
    assignment["A1"].font = SECTION_FONT
    _write_header(
        assignment,
        3,
        [
            _t(language, "station"),
            _t(language, "sequence_in_station"),
            _t(language, "worker_id"),
            _t(language, "worker"),
            _t(language, "operation_id"),
            _t(language, "operation"),
            _t(language, "machine"),
            _t(language, "skill"),
            _t(language, "required"),
            _t(language, "grade"),
            _t(language, "sam_s"),
            _t(language, "planning_sam_s"),
            _t(language, "quality_gate"),
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
            item.machine_type or _t(language, "manual"),
            item.skill_code,
            item.skill_required,
            item.skill_grade,
            item.sam_sec,
            item.planning_sam_sec,
            _yes_no(language, item.is_quality_gate),
        ]
        for column, value in enumerate(values, start=1):
            cell = assignment.cell(row=row_index, column=column, value=value)
            cell.border = THIN_BORDER
    _auto_width(assignment)

    station_sheet = workbook.create_sheet(_t(language, "station_sheet"))
    station_sheet["A1"] = _t(language, "station_kpi_title")
    station_sheet["A1"].font = SECTION_FONT
    _write_header(
        station_sheet,
        3,
        [
            _t(language, "station"),
            _t(language, "worker"),
            _t(language, "operations"),
            _t(language, "planning_load_s"),
            _t(language, "raw_sam_s"),
            _t(language, "utilization_vs_effective_takt_pct"),
            _t(language, "idle_s"),
            _t(language, "overload_s"),
            _t(language, "capacity_pcs_h"),
            _t(language, "status"),
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
            _station_status(language, station.status),
        ]
        for column, value in enumerate(values, start=1):
            cell = station_sheet.cell(row=row_index, column=column, value=value)
            cell.border = THIN_BORDER
    _auto_width(station_sheet)

    skill_sheet = workbook.create_sheet(_t(language, "worker_sheet"))
    skill_sheet["A1"] = _t(language, "worker_skill_title")
    skill_sheet["A1"].font = SECTION_FONT
    _write_header(
        skill_sheet,
        3,
        [
            _t(language, "worker_id"),
            _t(language, "worker"),
            _t(language, "used"),
            _t(language, "station"),
            _t(language, "machine_types"),
            _t(language, "qualified_operations"),
            _t(language, "versatility_pct"),
            _t(language, "assigned_sam_s"),
            _t(language, "assigned_planning_sam_s"),
            _t(language, "operations"),
        ],
    )
    for row_index, worker in enumerate(result.worker_summary, start=4):
        values = [
            worker.worker_id,
            worker.worker_name,
            _yes_no(language, worker.used),
            worker.station,
            ", ".join(worker.machine_types) or _t(language, "manual"),
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
        baseline_sheet = workbook.create_sheet(_t(language, "baseline_sheet"))
        baseline_sheet["A1"] = _t(language, "baseline_title")
        baseline_sheet["A1"].font = SECTION_FONT
        comparison = result.baseline_comparison
        rows = []
        if comparison.before:
            rows.extend(
                [
                    (
                        _t(language, "before_stations"),
                        comparison.before.stations_used,
                    ),
                    (_t(language, "before_workers"), comparison.before.workers_used),
                    (
                        _t(language, "before_bottleneck_station"),
                        comparison.before.bottleneck_station,
                    ),
                    (
                        _t(language, "before_bottleneck_load_s"),
                        comparison.before.bottleneck_load_sec,
                    ),
                    (
                        _t(language, "before_balance_efficiency_pct"),
                        comparison.before.balance_efficiency_pct,
                    ),
                    (
                        _t(language, "before_capacity_pcs_shift"),
                        comparison.before.capacity_per_shift,
                    ),
                    (
                        _t(language, "before_target_achievement_pct"),
                        comparison.before.target_achievement_pct,
                    ),
                ]
            )
        rows.extend(
            [
                (_t(language, "after_stations"), comparison.after.stations_used),
                (_t(language, "after_workers"), comparison.after.workers_used),
                (
                    _t(language, "after_bottleneck_station"),
                    comparison.after.bottleneck_station,
                ),
                (
                    _t(language, "after_bottleneck_load_s"),
                    comparison.after.bottleneck_load_sec,
                ),
                (
                    _t(language, "after_balance_efficiency_pct"),
                    comparison.after.balance_efficiency_pct,
                ),
                (
                    _t(language, "after_capacity_pcs_shift"),
                    comparison.after.capacity_per_shift,
                ),
                (
                    _t(language, "after_target_achievement_pct"),
                    comparison.after.target_achievement_pct,
                ),
                (_t(language, "station_delta"), comparison.station_delta),
                (_t(language, "worker_delta"), comparison.worker_delta),
                (
                    _t(language, "bottleneck_improvement_s"),
                    comparison.bottleneck_delta_sec,
                ),
                (
                    _t(language, "balance_efficiency_delta_pct"),
                    comparison.balance_efficiency_delta_pct,
                ),
                (
                    _t(language, "capacity_delta_pcs"),
                    comparison.capacity_delta_pcs,
                ),
                (
                    _t(language, "target_achievement_delta_pct"),
                    comparison.target_achievement_delta_pct,
                ),
            ]
        )
        for row_index, (label, value) in enumerate(rows, start=3):
            baseline_sheet.cell(row=row_index, column=1, value=label).font = Font(
                bold=True
            )
            baseline_sheet.cell(row=row_index, column=2, value=value)
        row_index = len(rows) + 5
        baseline_sheet.cell(
            row=row_index, column=1, value=_t(language, "baseline_violations")
        ).font = Font(bold=True)
        for violation in comparison.violations:
            row_index += 1
            baseline_sheet.cell(row=row_index, column=1, value=violation)
        for note in comparison.notes:
            row_index += 1
            baseline_sheet.cell(
                row=row_index, column=1, value=_localized_note(language, note)
            )
        baseline_sheet.column_dimensions["A"].width = 44
        baseline_sheet.column_dimensions["B"].width = 24

    if result.actuals_analysis:
        actuals_sheet = workbook.create_sheet(_t(language, "actuals_sheet"))
        actuals_sheet["A1"] = _t(language, "actuals_title")
        actuals_sheet["A1"].font = SECTION_FONT
        analysis = result.actuals_analysis
        rows = [
            (_t(language, "period_days"), analysis.period_days),
            (_t(language, "target_output"), analysis.target_output),
            (_t(language, "actual_output"), analysis.actual_output),
            (
                _t(language, "production_achievement_pct"),
                analysis.production_achievement_pct,
            ),
            (
                _t(language, "actual_direct_labor_minutes"),
                analysis.actual_direct_labor_minutes,
            ),
            (
                _t(language, "actual_labor_efficiency_pct"),
                analysis.actual_labor_efficiency_pct,
            ),
            (_t(language, "downtime_minutes"), analysis.downtime_minutes),
            (
                _t(language, "downtime_pct_planned"),
                analysis.downtime_pct_of_planned_time,
            ),
        ]
        for row_index, (label, value) in enumerate(rows, start=3):
            actuals_sheet.cell(row=row_index, column=1, value=label).font = Font(
                bold=True
            )
            actuals_sheet.cell(row=row_index, column=2, value=value)
        row_index = len(rows) + 5
        actuals_sheet.cell(
            row=row_index, column=1, value=_t(language, "downtime_by_category")
        ).font = Font(bold=True)
        for category, minutes in analysis.downtime_by_category.items():
            row_index += 1
            actuals_sheet.cell(
                row=row_index,
                column=1,
                value=_loss_category(language, category),
            )
            actuals_sheet.cell(row=row_index, column=2, value=minutes)
        for note in analysis.notes:
            row_index += 1
            actuals_sheet.cell(
                row=row_index, column=1, value=_localized_note(language, note)
            )
        actuals_sheet.column_dimensions["A"].width = 44
        actuals_sheet.column_dimensions["B"].width = 24

    warning_sheet = workbook.create_sheet(_t(language, "warnings_sheet"))
    warning_sheet["A1"] = _t(language, "warnings_title")
    warning_sheet["A1"].font = SECTION_FONT
    _write_header(
        warning_sheet,
        3,
        [
            _t(language, "severity"),
            _t(language, "code"),
            _t(language, "message"),
            _t(language, "station"),
            _t(language, "operation"),
            _t(language, "worker"),
        ],
    )
    row_index = 4
    for warning in result.warnings:
        values = [
            _severity(language, warning.severity),
            warning.code,
            _localized_warning(language, warning, result, request),
            warning.station,
            warning.operation_id,
            warning.worker_id,
        ]
        for column, value in enumerate(values, start=1):
            cell = warning_sheet.cell(row=row_index, column=column, value=value)
            cell.border = THIN_BORDER
        row_index += 1
    for issue in result.diagnostics.issues:
        warning_sheet.cell(
            row=row_index,
            column=1,
            value=_t(language, "status_error"),
        )
        warning_sheet.cell(row=row_index, column=2, value="diagnostic")
        warning_sheet.cell(row=row_index, column=3, value=issue)
        row_index += 1
    _auto_width(warning_sheet)

    output = BytesIO()
    workbook.save(output)
    return output.getvalue()
