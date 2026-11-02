from __future__ import annotations

from .heuristics import build_layout
from .models import (
    BaselineAssignment,
    BaselineAssignmentItem,
    DailyProductionActual,
    DowntimeEvent,
    HeadcountStandard,
    LineConfig,
    Machine,
    Operation,
    OptimizeRequest,
    ProductionActuals,
    Worker,
)


def _op(
    op_id: str,
    name: str,
    sam_sec: float,
    predecessors: list[str],
    machine_type: str | None,
    skill_code: str,
    skill_required: int,
    is_quality_gate: bool = False,
) -> Operation:
    return Operation(
        id=op_id,
        name=name,
        sam_sec=sam_sec,
        predecessors=predecessors,
        machine_type=machine_type,
        skill_code=skill_code,
        skill_required=skill_required,
        is_quality_gate=is_quality_gate,
    )


OPERATIONS: list[Operation] = [
    _op("OP010", "Kiểm tra nguyên phụ liệu", 20, [], None, "INSPECTION", 1, True),
    _op("OP020", "Ép mex cổ", 28, ["OP010"], "IRON", "FINISHING", 2),
    _op("OP030", "May vai trái", 30, ["OP020"], "OVERLOCK", "SEWING", 2),
    _op("OP040", "May vai phải", 30, ["OP020"], "OVERLOCK", "SEWING", 2),
    _op("OP050", "Nối vai", 26, ["OP030", "OP040"], "OVERLOCK", "SEWING", 2),
    _op("OP060", "May cổ", 45, ["OP050"], "OVERLOCK", "SEWING", 3),
    _op("OP070", "Diễu cổ", 35, ["OP060"], "COVERSTITCH", "SEWING", 2),
    _op("OP320", "May nẹp cổ", 30, ["OP060"], "SINGLE", "SEWING", 3),
    _op("OP330", "Diễu nẹp cổ", 22, ["OP320"], "SINGLE", "SEWING", 2),
    _op("OP080", "Tra tay trái", 40, ["OP070", "OP330"], "OVERLOCK", "SEWING", 3),
    _op("OP090", "Tra tay phải", 40, ["OP070"], "OVERLOCK", "SEWING", 3),
    _op("OP100", "May sườn trái", 34, ["OP080", "OP090"], "OVERLOCK", "SEWING", 2),
    _op("OP110", "May sườn phải", 34, ["OP080", "OP090"], "OVERLOCK", "SEWING", 2),
    _op("OP120", "Diễu sườn", 28, ["OP100", "OP110"], "COVERSTITCH", "SEWING", 2),
    _op("OP130", "May lai", 46, ["OP120"], "COVERSTITCH", "SEWING", 3),
    _op("OP340", "May bèo lai", 35, ["OP130"], "COVERSTITCH", "SEWING", 2),
    _op("OP140", "Diễu lai", 30, ["OP340"], "COVERSTITCH", "SEWING", 2),
    _op("OP280", "May túi trái", 38, ["OP120"], "SINGLE", "SEWING", 2),
    _op("OP290", "May túi phải", 38, ["OP120"], "SINGLE", "SEWING", 2),
    _op("OP300", "Diễu túi trái", 26, ["OP280"], "SINGLE", "SEWING", 2),
    _op("OP310", "Diễu túi phải", 26, ["OP290"], "SINGLE", "SEWING", 2),
    _op("OP350", "Kiểm tra túi", 20, ["OP300", "OP310"], None, "INSPECTION", 2, True),
    _op("OP360", "Ủi túi", 18, ["OP350"], "IRON", "FINISHING", 2),
    _op("OP370", "May tag", 16, ["OP070"], None, "FINISHING", 1),
    _op("OP150", "May gấu tay trái", 24, ["OP080"], "OVERLOCK", "SEWING", 2),
    _op("OP160", "May gấu tay phải", 24, ["OP090"], "OVERLOCK", "SEWING", 2),
    _op("OP170", "Diễu gấu tay trái", 20, ["OP150"], "COVERSTITCH", "SEWING", 2),
    _op("OP180", "Diễu gấu tay phải", 20, ["OP160"], "COVERSTITCH", "SEWING", 2),
    _op(
        "OP190",
        "Kiểm tra thân áo",
        28,
        ["OP140", "OP170", "OP180", "OP360", "OP370"],
        None,
        "INSPECTION",
        2,
        True,
    ),
    _op("OP200", "Cắt chỉ", 18, ["OP190"], None, "FINISHING", 1),
    _op("OP210", "Ủi thân", 26, ["OP200"], "IRON", "FINISHING", 2),
    _op("OP220", "Ủi tay", 22, ["OP200"], "IRON", "FINISHING", 2),
    _op("OP380", "Cắt chỉ tay", 15, ["OP200"], None, "FINISHING", 1),
    _op("OP230", "Gấp áo", 18, ["OP210", "OP220"], None, "FINISHING", 1),
    _op("OP390", "Gấp tay áo", 14, ["OP380"], None, "FINISHING", 1),
    _op("OP240", "Đóng gói", 20, ["OP230", "OP390"], None, "FINISHING", 1),
    _op("OP250", "Dán nhãn", 14, ["OP240"], None, "FINISHING", 1),
    _op("OP260", "Kiểm tra cuối", 24, ["OP250"], None, "INSPECTION", 3, True),
    _op("OP270", "Nhập kho", 12, ["OP260"], None, "FINISHING", 1),
    _op("OP400", "Đóng thùng", 25, ["OP270"], None, "FINISHING", 1),
]

for _index, _operation in enumerate(OPERATIONS, start=1):
    _operation.sequence = _index * 10


SEWING_MACHINES = ["OVERLOCK", "COVERSTITCH", "SINGLE"]


def _worker(
    worker_id: str,
    name: str,
    sewing: int,
    finishing: int,
    inspection: int,
    machines: list[str],
    available: bool = True,
) -> Worker:
    grades = {"SEWING": sewing, "FINISHING": finishing, "INSPECTION": inspection}
    skills: dict[str, int] = {}
    for operation in OPERATIONS:
        grade = grades[operation.skill_code]
        if grade > 0:
            skills[operation.id] = grade
    return Worker(
        id=worker_id,
        name=name,
        skills=skills,
        machine_types=machines,
        available=available,
        worker_status="ACTIVE" if available else "ABSENT",
    )


WORKERS: list[Worker] = [
    _worker("W01", "Nguyễn Thu Hà", 1, 2, 2, ["IRON"]),
    _worker("W02", "Trần Minh Anh", 1, 2, 2, ["IRON"]),
    _worker("W03", "Lê Hoàng Yến", 3, 0, 0, SEWING_MACHINES),
    _worker("W04", "Phạm Quốc Bảo", 3, 0, 0, SEWING_MACHINES),
    _worker("W05", "Võ Thanh Tùng", 3, 0, 0, SEWING_MACHINES),
    _worker("W06", "Đặng Thị Mai", 3, 0, 0, SEWING_MACHINES),
    _worker("W07", "Bùi Văn Nam", 2, 0, 0, SEWING_MACHINES),
    _worker("W08", "Hoàng Thị Lan", 2, 0, 0, SEWING_MACHINES),
    _worker("W09", "Ngô Quang Huy", 2, 0, 0, SEWING_MACHINES),
    _worker("W10", "Dương Thị Hồng", 2, 0, 0, SEWING_MACHINES),
    _worker("W11", "Trịnh Văn Long", 3, 0, 0, SEWING_MACHINES),
    _worker("W12", "Lý Thị Ngọc", 3, 0, 0, SEWING_MACHINES),
    _worker("W13", "Phan Anh Tuấn", 3, 0, 0, SEWING_MACHINES),
    _worker("W14", "Vũ Thị Hạnh", 2, 0, 0, ["OVERLOCK", "SINGLE"]),
    _worker("W15", "Đỗ Văn Thắng", 2, 0, 0, ["OVERLOCK", "SINGLE"]),
    _worker("W16", "Nguyễn Thị Kim", 2, 0, 0, ["OVERLOCK", "SINGLE"]),
    _worker("W17", "Trần Văn Dũng", 2, 1, 0, SEWING_MACHINES),
    _worker("W18", "Lê Thị Thu", 2, 1, 0, SEWING_MACHINES),
    _worker("W19", "Phạm Văn Hùng", 0, 2, 2, ["IRON"]),
    _worker("W20", "Nguyễn Thị Bích", 0, 2, 2, ["IRON"]),
    _worker("W21", "Võ Thị Ánh", 0, 2, 1, ["IRON"]),
    _worker("W22", "Bùi Quốc Cường", 0, 2, 1, ["IRON"]),
    _worker("W23", "Đinh Thị Hòa", 0, 1, 3, []),
    _worker("W24", "Hồ Văn Sơn", 0, 2, 3, ["IRON"]),
]


MACHINES: list[Machine] = [
    *[
        Machine(id=f"OL-{index:02d}", machine_type="OVERLOCK", available=True, capacity=1)
        for index in range(1, 9)
    ],
    *[
        Machine(
            id=f"CS-{index:02d}",
            machine_type="COVERSTITCH",
            available=True,
            capacity=1,
        )
        for index in range(1, 7)
    ],
    *[
        Machine(id=f"SN-{index:02d}", machine_type="SINGLE", available=True, capacity=1)
        for index in range(1, 6)
    ],
    *[
        Machine(id=f"IR-{index:02d}", machine_type="IRON", available=True, capacity=1)
        for index in range(1, 5)
    ],
]


def _baseline_from_layout(layout, note: str) -> BaselineAssignment:
    """Convert a heuristic layout into the explicit baseline input schema."""
    items = [
        BaselineAssignmentItem(
            operation_id=operation_id,
            station_id=f"ST{station:02d}",
            worker_id=layout.station_worker[station],
        )
        for operation_id, station in sorted(
            layout.assignment.items(), key=lambda item: (item[1], item[0])
        )
    ]
    return BaselineAssignment(items=items, source_note=note)


_SAMPLE_SAM = {operation.id: operation.sam_sec for operation in OPERATIONS}
_SAMPLE_BASELINE_LAYOUT = build_layout(
    OPERATIONS,
    WORKERS,
    sam_by_id=_SAMPLE_SAM,
    target_sec=60.0,
    max_stations=24,
)
if _SAMPLE_BASELINE_LAYOUT is None:
    raise RuntimeError("Synthetic baseline layout could not be built.")

SAMPLE_BASELINE = _baseline_from_layout(
    _SAMPLE_BASELINE_LAYOUT,
    note=(
        "Synthetic current-state baseline: first-fit 60s station target, one worker "
        "per station, respects skill/machine/precedence. Not an optimizer output."
    ),
)

# Two extra workers are used only by the feasible 400-piece scenario. They share
# the same routing, SAM, machines and skill matrix as the 24-worker scenario.
EXTRA_WORKERS: list[Worker] = [
    _worker("W25", "Nguyễn Hải Đăng", 3, 0, 0, SEWING_MACHINES),
    _worker("W26", "Trần Thị Quỳnh", 3, 0, 0, SEWING_MACHINES),
]

FEASIBLE_WORKERS: list[Worker] = [*WORKERS, *EXTRA_WORKERS]


SAMPLE_REQUEST = OptimizeRequest(
    line_name="Line A — Basic Tee",
    style_code="BASIC-TEE-001",
    config=LineConfig(
        shift_id="SHIFT_01",
        shift_name="Ca 1",
        shift_minutes=480,
        break_minutes=30,
        target_qty=420,
        working_days=5,
        sam_basis="INCLUDES_ALLOWANCE",
        allowance_pct=0.0,
        planned_efficiency=0.85,
        max_workers=24,
        # Both lexicographic stages must finish inside this limit. With the
        # balanced warm start, 60s proves 58.0s + 23 stations in about 28s.
        solver_time_limit_sec=60,
        objective="min_bottleneck",
    ),
    operations=OPERATIONS,
    workers=WORKERS,
    machines=MACHINES,
    actuals=ProductionActuals(
        actual_output=360,
        actual_direct_labor_minutes=20 * 450,
        downtime_minutes=60,
        attendance_hc=22,
    ),
    headcount_standard=HeadcountStandard(
        line_id="LINE_01",
        work_center="SEWING",
        standard_hc=24,
        planned_hc=24,
        actual_hc=24,
    ),
    baseline_assignment=SAMPLE_BASELINE,
    daily_actuals=[
        DailyProductionActual(
            date="2026-10-26",
            shift_id="SHIFT_01",
            line_id="LINE_01",
            style_code="BASIC-TEE-001",
            target_output=420,
            actual_output=380,
            actual_direct_labor_minutes=20 * 450,
            downtime_minutes=50,
            attendance_hc=22,
        ),
        DailyProductionActual(
            date="2026-10-27",
            shift_id="SHIFT_01",
            line_id="LINE_01",
            style_code="BASIC-TEE-001",
            target_output=420,
            actual_output=360,
            actual_direct_labor_minutes=21 * 450,
            downtime_minutes=60,
            attendance_hc=21,
        ),
        DailyProductionActual(
            date="2026-10-28",
            shift_id="SHIFT_01",
            line_id="LINE_01",
            style_code="BASIC-TEE-001",
            target_output=420,
            actual_output=350,
            actual_direct_labor_minutes=22 * 450,
            downtime_minutes=70,
            attendance_hc=22,
        ),
        DailyProductionActual(
            date="2026-10-29",
            shift_id="SHIFT_01",
            line_id="LINE_01",
            style_code="BASIC-TEE-001",
            target_output=420,
            actual_output=370,
            actual_direct_labor_minutes=22 * 450,
            downtime_minutes=55,
            attendance_hc=23,
        ),
        DailyProductionActual(
            date="2026-10-30",
            shift_id="SHIFT_01",
            line_id="LINE_01",
            style_code="BASIC-TEE-001",
            target_output=420,
            actual_output=360,
            actual_direct_labor_minutes=21 * 450,
            downtime_minutes=65,
            attendance_hc=22,
        ),
    ],
    downtime_events=[
        DowntimeEvent(
            start_time="2026-10-27T08:15:00",
            end_time="2026-10-27T08:40:00",
            line_id="LINE_01",
            station_id="ST05",
            loss_category="MACHINE",
            duration_minutes=25,
            note="Overlock thread break and adjustment.",
        ),
        DowntimeEvent(
            start_time="2026-10-27T10:05:00",
            end_time="2026-10-27T10:20:00",
            line_id="LINE_01",
            station_id="ST03",
            loss_category="MATERIAL",
            duration_minutes=15,
            note="Waited for collar interlining.",
        ),
        DowntimeEvent(
            start_time="2026-10-27T13:10:00",
            end_time="2026-10-27T13:20:00",
            line_id="LINE_01",
            station_id="ST08",
            loss_category="MANPOWER",
            duration_minutes=10,
            note="Operator moved to cover an absent workstation.",
        ),
        DowntimeEvent(
            start_time="2026-10-27T15:30:00",
            end_time="2026-10-27T15:40:00",
            line_id="LINE_01",
            station_id="ST12",
            loss_category="QUALITY",
            duration_minutes=10,
            note="Rework on collar alignment.",
        ),
    ],
)


# Scenario B keeps the same product, routing, SAM, machines and baseline.
# Only the target and the two extra operators change. This makes the comparison
# a clean manpower/target trade-off rather than a different line.
SAMPLE_FEASIBLE_REQUEST = SAMPLE_REQUEST.model_copy(deep=True)
SAMPLE_FEASIBLE_REQUEST.line_name = "Line A — Basic Tee (feasible 400 plan)"
SAMPLE_FEASIBLE_REQUEST.config.target_qty = 400
SAMPLE_FEASIBLE_REQUEST.config.max_workers = 26
SAMPLE_FEASIBLE_REQUEST.config.solver_time_limit_sec = 60
SAMPLE_FEASIBLE_REQUEST.workers = [
    worker.model_copy(deep=True) for worker in FEASIBLE_WORKERS
]
SAMPLE_FEASIBLE_REQUEST.headcount_standard = HeadcountStandard(
    line_id="LINE_01",
    work_center="SEWING",
    standard_hc=24,
    planned_hc=26,
    actual_hc=24,
)
