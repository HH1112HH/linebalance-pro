from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field, field_validator

MANUAL_MACHINE_CODES = {"", "MANUAL", "NONE"}


def _clean_code(value: str) -> str:
    return (value or "").strip().upper()


class Operation(BaseModel):
    """One garment operation in the routing.

    ``machine_type=None`` means the operation is manual and needs no machine.
    Do not use a fake machine type such as ``MANUAL`` in the data model.
    """

    id: str = Field(min_length=1, max_length=40)
    name: str = Field(min_length=1, max_length=160)
    sam_sec: float = Field(gt=0, le=3600)
    predecessors: list[str] = Field(default_factory=list)
    machine_type: str | None = Field(default=None, max_length=40)
    skill_code: str = Field(default="SEWING", max_length=40)
    skill_required: int = Field(default=1, ge=0, le=3)
    is_quality_gate: bool = False
    sequence: int | None = Field(default=None, ge=0)

    @field_validator("id")
    @classmethod
    def strip_id(cls, value: str) -> str:
        return value.strip()

    @field_validator("predecessors")
    @classmethod
    def unique_predecessors(cls, value: list[str]) -> list[str]:
        return list(dict.fromkeys(item.strip() for item in value if item and item.strip()))

    @field_validator("machine_type", mode="before")
    @classmethod
    def normalize_machine_type(cls, value: object) -> str | None:
        if value is None:
            return None
        text = _clean_code(str(value))
        return None if text in MANUAL_MACHINE_CODES else text

    @field_validator("skill_code")
    @classmethod
    def normalize_skill_code(cls, value: str) -> str:
        return _clean_code(value)


class Worker(BaseModel):
    """A worker and their operation-level skill matrix.

    ``skills`` maps either an operation ID (preferred) or a skill code
    (fallback) to a grade from 0 to 3. Grade 0 means "not qualified".

    ``performance_rate`` is intentionally not part of the MVP. The first
    model uses standard SAM for workload and uses skill grade only as an
    eligibility gate. Worker-specific performance belongs to a later phase
    after the factory has reliable time-study data.
    """

    id: str = Field(min_length=1, max_length=40)
    name: str = Field(min_length=1, max_length=160)
    skills: dict[str, int] = Field(default_factory=dict)
    machine_types: list[str] = Field(default_factory=list)
    available: bool = True
    worker_status: str = Field(default="ACTIVE", max_length=40)

    @field_validator("id")
    @classmethod
    def strip_id(cls, value: str) -> str:
        return value.strip()

    @field_validator("skills", mode="before")
    @classmethod
    def normalize_skills(cls, value: object) -> dict[str, int]:
        if value is None:
            return {}
        if not isinstance(value, dict):
            raise TypeError("skills must be a mapping of operation_id/skill_code to grade 0..3")
        grades = {"A": 3, "B": 2, "C": 1, "NONE": 0, "": 0}
        result: dict[str, int] = {}
        for raw_key, raw_grade in value.items():
            key = str(raw_key).strip()
            if not key:
                continue
            if isinstance(raw_grade, str):
                text = raw_grade.strip().upper()
                if text in grades:
                    grade = grades[text]
                else:
                    grade = int(float(text))
            else:
                grade = int(raw_grade)
            result[key] = max(0, min(3, grade))
        return result

    @field_validator("machine_types")
    @classmethod
    def normalize_machine_types(cls, value: list[str]) -> list[str]:
        return list(
            dict.fromkeys(
                _clean_code(item)
                for item in value
                if item and _clean_code(item) not in MANUAL_MACHINE_CODES
            )
        )


class Machine(BaseModel):
    id: str = Field(min_length=1, max_length=40)
    machine_type: str = Field(min_length=1, max_length=40)
    available: bool = True
    capacity: int = Field(
        default=1,
        ge=1,
        le=100,
        description="How many stations can use this machine record at the same time.",
    )

    @field_validator("id")
    @classmethod
    def strip_id(cls, value: str) -> str:
        return value.strip()

    @field_validator("machine_type")
    @classmethod
    def normalize_type(cls, value: str) -> str:
        return _clean_code(value)


class LineConfig(BaseModel):
    shift_id: str = Field(default="SHIFT_01", max_length=40)
    shift_name: str = Field(default="Shift 1", max_length=80)
    shift_minutes: float = Field(default=480, gt=0, le=1440)
    break_minutes: float = Field(default=30, ge=0, le=720)
    target_qty: int = Field(default=420, gt=0, le=100000)
    working_days: int = Field(default=1, ge=1, le=31)

    sam_basis: Literal["INCLUDES_ALLOWANCE", "EXCLUDES_ALLOWANCE"] = Field(
        default="INCLUDES_ALLOWANCE",
        description=(
            "Whether the imported SAM already includes the standard allowance. "
            "If INCLUDES_ALLOWANCE, allowance_pct is ignored to avoid double counting."
        ),
    )
    allowance_pct: float = Field(
        default=0.0,
        ge=0,
        le=0.5,
        description=(
            "Standard allowance applied once when sam_basis=EXCLUDES_ALLOWANCE. "
            "Must stay 0 when sam_basis=INCLUDES_ALLOWANCE."
        ),
    )
    planned_efficiency: float = Field(
        default=0.85,
        gt=0.1,
        le=1.5,
        description="Planned performance versus SAM, applied once in capacity estimates.",
    )

    max_workers: int | None = Field(default=None, ge=1, le=100)
    solver_time_limit_sec: int = Field(default=20, ge=1, le=60)
    objective: Literal["min_workers", "min_bottleneck"] = "min_bottleneck"


class ProductionActuals(BaseModel):
    """Summary actuals for one shift/day. Detailed rows live in DailyProductionActual."""

    actual_output: int | None = Field(default=None, ge=0)
    actual_direct_labor_minutes: float | None = Field(
        default=None,
        ge=0,
        description=(
            "Total direct labor minutes actually paid/worked. Do not use elapsed "
            "shift time; actual labor efficiency needs direct labor minutes."
        ),
    )
    downtime_minutes: float | None = Field(default=None, ge=0)
    attendance_hc: int | None = Field(default=None, ge=0)


class DailyProductionActual(BaseModel):
    date: str = Field(min_length=1, max_length=20)
    shift_id: str = Field(default="SHIFT_01", max_length=40)
    line_id: str = Field(default="LINE_01", max_length=40)
    style_code: str = Field(default="", max_length=80)
    target_output: int = Field(default=0, ge=0)
    actual_output: int = Field(default=0, ge=0)
    actual_direct_labor_minutes: float | None = Field(default=None, ge=0)
    downtime_minutes: float = Field(default=0, ge=0)
    attendance_hc: int | None = Field(default=None, ge=0)
    note: str = Field(default="", max_length=500)


class DowntimeEvent(BaseModel):
    start_time: str = Field(min_length=1, max_length=40)
    end_time: str = Field(min_length=1, max_length=40)
    line_id: str = Field(default="LINE_01", max_length=40)
    station_id: str = Field(default="", max_length=40)
    loss_category: Literal[
        "MACHINE",
        "MATERIAL",
        "MANPOWER",
        "QUALITY",
        "CHANGEOVER",
        "OTHER",
    ] = "OTHER"
    duration_minutes: float = Field(gt=0, le=1440)
    note: str = Field(default="", max_length=500)


class HeadcountStandard(BaseModel):
    line_id: str = Field(default="LINE_01", max_length=40)
    work_center: str = Field(default="SEWING", max_length=80)
    standard_hc: int = Field(default=24, gt=0, le=1000)
    planned_hc: int = Field(default=24, gt=0, le=1000)
    actual_hc: int = Field(default=24, ge=0, le=1000)


class BaselineAssignmentItem(BaseModel):
    operation_id: str = Field(min_length=1, max_length=40)
    station_id: str = Field(min_length=1, max_length=40)
    worker_id: str = Field(min_length=1, max_length=40)


class BaselineAssignment(BaseModel):
    """Current-state assignment used for a real before/after comparison.

    If this is absent, the UI must show only the optimized result and must not
    invent a baseline. The sample data uses a synthetic baseline and says so.
    """

    items: list[BaselineAssignmentItem] = Field(default_factory=list, max_length=500)
    source_note: str = Field(
        default="Synthetic current-state baseline; not an optimizer output.",
        max_length=500,
    )


class OptimizeRequest(BaseModel):
    line_name: str = Field(default="Line A", max_length=120)
    style_code: str = Field(default="BASIC-TEE", max_length=80)
    config: LineConfig
    operations: list[Operation] = Field(min_length=1, max_length=200)
    workers: list[Worker] = Field(min_length=1, max_length=100)
    machines: list[Machine] = Field(default_factory=list, max_length=200)
    actuals: ProductionActuals | None = None
    headcount_standard: HeadcountStandard | None = None
    baseline_assignment: BaselineAssignment | None = None
    daily_actuals: list[DailyProductionActual] = Field(default_factory=list, max_length=31)
    downtime_events: list[DowntimeEvent] = Field(default_factory=list, max_length=500)


class AssignedOperation(BaseModel):
    id: str
    name: str
    sam_sec: float
    planning_sam_sec: float
    machine_type: str | None
    skill_code: str
    skill_required: int
    skill_grade: int
    skill_surplus: int
    is_quality_gate: bool
    station: int
    sequence_in_station: int
    worker_id: str
    worker_name: str


class Station(BaseModel):
    station: int
    worker_id: str
    worker_name: str
    operation_ids: list[str]
    operation_names: list[str]
    machine_types: list[str]
    standard_load_sec: float
    raw_sam_sec: float
    standard_utilization_pct: float
    idle_sec: float
    overload_sec: float
    capacity_pcs_h: float
    status: Literal["bottleneck", "watch", "normal", "underutilized"]


class WorkerSummary(BaseModel):
    worker_id: str
    worker_name: str
    used: bool
    station: int | None
    operation_ids: list[str]
    assigned_sam_sec: float
    assigned_planning_sam_sec: float
    skills: dict[str, int]
    machine_types: list[str]
    qualified_operations: int
    versatility_pct: float


class Kpis(BaseModel):
    takt_time_sec: float
    effective_takt_time_sec: float
    available_seconds: float
    total_sam_sec: float
    total_planning_sam_sec: float
    workers_used: int
    bottleneck_station: int
    bottleneck_load_sec: float
    planned_labor_utilization_pct: float
    balance_efficiency_pct: float
    balance_delay_pct: float
    smoothness_index: float
    capacity_per_shift: float
    target_qty: int
    target_achievement_pct: float
    meets_target: bool
    output_per_operator: float
    total_idle_sec: float
    total_overload_sec: float
    planned_efficiency: float


class WarningItem(BaseModel):
    severity: Literal["info", "warning", "critical"]
    code: str
    message: str
    station: int | None = None
    operation_id: str | None = None
    worker_id: str | None = None


class Diagnostics(BaseModel):
    feasible: bool
    error_type: Literal["NONE", "DATA", "MODEL", "SOLVER"] = "NONE"
    issues: list[str] = Field(default_factory=list)
    suggestions: list[str] = Field(default_factory=list)


class MachineRequirement(BaseModel):
    machine_type: str
    required_stations: int
    available_capacity: int
    gap: int
    coverage_pct: float
    demand_ratio_pct: float
    basis: Literal["optimized_stations", "operation_count"] = "optimized_stations"


class CapacityPlan(BaseModel):
    garment_sam_min: float
    garment_planning_sam_min: float
    net_shift_minutes: float
    working_days: int
    planned_efficiency: float
    sam_basis: str
    allowance_applied_pct: float
    target_qty_per_day: int
    period_target_qty: int
    required_hc: float
    available_hc: int
    hc_gap: float
    theoretical_capacity_per_shift: float = Field(
        description=(
            "Available HC x net shift minutes x planned efficiency / garment planning SAM. "
            "This ignores precedence, machine and line-balance constraints."
        )
    )
    bottleneck_capacity_per_shift: float = Field(
        description=(
            "Realistic capacity from the optimizer bottleneck: "
            "net available seconds x planned efficiency / bottleneck load."
        )
    )
    daily_capacity: float = Field(
        description="Bottleneck-constrained capacity per shift used for target achievement."
    )
    period_capacity: float
    capacity_gap: float
    capacity_achievement_pct: float
    theoretical_capacity_achievement_pct: float
    machine_requirements: list[MachineRequirement] = Field(default_factory=list)
    notes: list[str] = Field(default_factory=list)


class SkillCoverageItem(BaseModel):
    operation_id: str
    operation_name: str
    required_grade: int
    eligible_workers: int
    worker_ids: list[str] = Field(default_factory=list)
    status: Literal["ok", "tight", "critical"]


class TransferSuggestion(BaseModel):
    worker_id: str
    worker_name: str
    reason: str
    suggested_operation_ids: list[str] = Field(default_factory=list)


class HeadcountControl(BaseModel):
    line_id: str
    work_center: str
    standard_hc: int
    planned_hc: int
    actual_hc: int
    attendance_hc: int
    optimized_hc: int
    hc_gap: int
    adherence_pct: float
    attendance_pct: float
    skill_coverage: list[SkillCoverageItem] = Field(default_factory=list)
    transfer_suggestions: list[TransferSuggestion] = Field(default_factory=list)
    notes: list[str] = Field(default_factory=list)


class PlanningSummary(BaseModel):
    capacity: CapacityPlan
    headcount: HeadcountControl


class BaselineMetrics(BaseModel):
    stations_used: int
    workers_used: int
    bottleneck_station: str
    bottleneck_load_sec: float
    balance_efficiency_pct: float
    capacity_per_shift: float
    target_achievement_pct: float
    smoothness_index: float
    total_idle_sec: float
    total_overload_sec: float


class BaselineComparison(BaseModel):
    before: BaselineMetrics | None = None
    after: BaselineMetrics
    station_delta: int | None = None
    worker_delta: int | None = None
    bottleneck_delta_sec: float | None = None
    balance_efficiency_delta_pct: float | None = None
    capacity_delta_pcs: float | None = None
    target_achievement_delta_pct: float | None = None
    violations: list[str] = Field(default_factory=list)
    notes: list[str] = Field(default_factory=list)


class ActualsAnalysis(BaseModel):
    period_days: int
    target_output: int
    actual_output: int
    production_achievement_pct: float
    actual_direct_labor_minutes: float | None = None
    actual_labor_efficiency_pct: float | None = None
    downtime_minutes: float
    downtime_pct_of_planned_time: float
    downtime_by_category: dict[str, float] = Field(default_factory=dict)
    notes: list[str] = Field(default_factory=list)


class RunMetadata(BaseModel):
    run_id: str
    app_version: str
    data_version: str
    model_version: str
    solver_version: str
    objective: str
    input_hash: str
    solver_status: str
    solve_time_sec: float
    created_at: str
    lexicographic_proven: bool
    stage1_objective: float | None = None
    stage2_objective: float | None = None


class ReadinessItem(BaseModel):
    key: str = Field(min_length=1, max_length=80)
    label: str = Field(min_length=1, max_length=200)
    required: bool = True
    status: Literal["NOT_STARTED", "IN_PROGRESS", "COMPLETED", "BLOCKED"] = "NOT_STARTED"
    note: str = Field(default="", max_length=500)


class StyleReadiness(BaseModel):
    style_code: str = Field(min_length=1, max_length=80)
    items: list[ReadinessItem] = Field(default_factory=list)
    readiness_pct: float = 0.0
    ready: bool = False
    blocking_items: list[str] = Field(default_factory=list)


class TimeStudyRecord(BaseModel):
    """Aggregate time-study input for T09 SAM validation.

    Normal time = observed time x performance rating.
    Standard time = normal time x (1 + allowance).

    This endpoint is aggregate, not element-level. ``observed_time_sec`` must
    cover human/walking work only; do not apply the operator performance
    rating to machine automatic time. Split mixed elements and rate each
    element before using this calculation.
    """

    operation_id: str = Field(min_length=1, max_length=40)
    observed_time_sec: float = Field(gt=0, le=3600)
    performance_rating: float = Field(default=1.0, gt=0.3, le=2.0)
    allowance_pct: float = Field(default=0.0, ge=0, le=0.5)
    approved_sam_sec: float | None = Field(default=None, gt=0, le=3600)
    revision_date: str = Field(default="", max_length=20)
    status: Literal["DRAFT", "APPROVED", "SUPERSEDED"] = "DRAFT"


class TimeStudyResult(BaseModel):
    operation_id: str
    normal_time_sec: float
    standard_time_sec: float
    approved_sam_sec: float | None = None
    variance_pct: float | None = None
    notes: list[str] = Field(default_factory=list)


class OptimizeResponse(BaseModel):
    status: Literal["OPTIMAL", "FEASIBLE_LIMIT", "INFEASIBLE", "ERROR"]
    solver_status: str
    has_solution: bool
    solver_available: bool
    solver_message: str | None = None
    solve_time_sec: float
    data_source: str = "synthetic-demo-only"
    line_name: str
    style_code: str
    shift_id: str
    sam_basis: str
    allowance_applied_pct: float
    takt_time_sec: float
    effective_takt_time_sec: float
    available_seconds: float
    stations: list[Station] = Field(default_factory=list)
    assignment: list[AssignedOperation] = Field(default_factory=list)
    worker_summary: list[WorkerSummary] = Field(default_factory=list)
    kpis: Kpis | None = None
    planning: PlanningSummary | None = None
    baseline_comparison: BaselineComparison | None = None
    actuals_analysis: ActualsAnalysis | None = None
    warnings: list[WarningItem] = Field(default_factory=list)
    diagnostics: Diagnostics
    metadata: RunMetadata | None = None


class ExportPayload(BaseModel):
    request: OptimizeRequest
    result: OptimizeResponse


class ScenarioSaveRequest(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    request: OptimizeRequest
    result: OptimizeResponse


class ScenarioSummary(BaseModel):
    id: str
    name: str
    created_at: str
    status: str
    solver_status: str
    workers_used: int
    balance_efficiency_pct: float
    model_version: str
    data_version: str


class ScenarioDetail(BaseModel):
    id: str
    name: str
    created_at: str
    request: OptimizeRequest
    result: OptimizeResponse
