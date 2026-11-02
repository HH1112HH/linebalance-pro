export type ScenarioKey = "A" | "B";
export type ViewKey = ScenarioKey | "custom";

export type SamBasis = "INCLUDES_ALLOWANCE" | "EXCLUDES_ALLOWANCE";
export type StationStatus = "bottleneck" | "watch" | "normal" | "underutilized";
export type LossCategory =
  "MACHINE" | "MATERIAL" | "MANPOWER" | "QUALITY" | "CHANGEOVER" | "OTHER";

export interface LineConfig {
  shift_id: string;
  shift_name: string;
  shift_minutes: number;
  break_minutes: number;
  target_qty: number;
  working_days: number;
  sam_basis: SamBasis;
  allowance_pct: number;
  planned_efficiency: number;
  max_workers: number | null;
  solver_time_limit_sec: number;
  objective: "min_workers" | "min_bottleneck";
}

export interface OperationInput {
  id: string;
  name: string;
  sam_sec: number;
  predecessors: string[];
  machine_type: string | null;
  skill_code: string;
  skill_required: number;
  is_quality_gate: boolean;
  sequence: number;
}

export interface WorkerInput {
  id: string;
  name: string;
  skills: Record<string, number>;
  machine_types: string[];
  available: boolean;
  worker_status: string;
}

export interface MachineInput {
  id: string;
  machine_type: string;
  available: boolean;
  capacity: number;
}

export interface ActualsInput {
  actual_output: number | null;
  actual_direct_labor_minutes: number | null;
  downtime_minutes: number | null;
  attendance_hc: number | null;
}

export interface DailyActualInput {
  date: string;
  shift_id: string;
  line_id: string;
  style_code: string;
  target_output: number;
  actual_output: number;
  actual_direct_labor_minutes: number | null;
  downtime_minutes: number;
  attendance_hc: number | null;
  note: string;
}

export interface DowntimeEventInput {
  start_time: string;
  end_time: string;
  line_id: string;
  station_id: string;
  loss_category: LossCategory;
  duration_minutes: number;
  note: string;
}

export interface HeadcountStandardInput {
  line_id: string;
  work_center: string;
  standard_hc: number;
  planned_hc: number;
  actual_hc: number;
}

export interface BaselineAssignmentItem {
  operation_id: string;
  station_id: string;
  worker_id: string;
}

export interface BaselineAssignment {
  items: BaselineAssignmentItem[];
  source_note: string;
}

export interface SampleRequest {
  line_name: string;
  style_code: string;
  config: LineConfig;
  operations: OperationInput[];
  workers: WorkerInput[];
  machines: MachineInput[];
  actuals: ActualsInput | null;
  headcount_standard: HeadcountStandardInput | null;
  baseline_assignment: BaselineAssignment | null;
  daily_actuals: DailyActualInput[];
  downtime_events: DowntimeEventInput[];
}

export interface Kpis {
  takt_time_sec: number;
  effective_takt_time_sec: number;
  available_seconds: number;
  total_sam_sec: number;
  total_planning_sam_sec: number;
  workers_used: number;
  bottleneck_station: number;
  bottleneck_load_sec: number;
  planned_labor_utilization_pct: number;
  balance_efficiency_pct: number;
  balance_delay_pct: number;
  smoothness_index: number;
  capacity_per_shift: number;
  target_qty: number;
  target_achievement_pct: number;
  meets_target: boolean;
  output_per_operator: number;
  total_idle_sec: number;
  total_overload_sec: number;
  planned_efficiency: number;
}

export interface StationResult {
  station: number;
  worker_id: string;
  worker_name: string;
  operation_ids: string[];
  operation_names: string[];
  machine_types: string[];
  standard_load_sec: number;
  raw_sam_sec: number;
  standard_utilization_pct: number;
  idle_sec: number;
  overload_sec: number;
  capacity_pcs_h: number;
  status: StationStatus;
}

export interface BaselineMetrics {
  stations_used: number;
  workers_used: number;
  bottleneck_station: string;
  bottleneck_load_sec: number;
  balance_efficiency_pct: number;
  capacity_per_shift: number;
  target_achievement_pct: number;
  smoothness_index: number;
  total_idle_sec: number;
  total_overload_sec: number;
}

export interface BaselineComparison {
  before: BaselineMetrics | null;
  after: BaselineMetrics;
  station_delta: number | null;
  worker_delta: number | null;
  bottleneck_delta_sec: number | null;
  balance_efficiency_delta_pct: number | null;
  capacity_delta_pcs: number | null;
  target_achievement_delta_pct: number | null;
  violations: string[];
  notes: string[];
}

export interface MachineRequirement {
  machine_type: string;
  required_stations: number;
  available_capacity: number;
  gap: number;
  coverage_pct: number;
  demand_ratio_pct: number;
  basis: "optimized_stations" | "operation_count";
}

export interface CapacityPlan {
  garment_sam_min: number;
  garment_planning_sam_min: number;
  net_shift_minutes: number;
  working_days: number;
  planned_efficiency: number;
  sam_basis: string;
  allowance_applied_pct: number;
  target_qty_per_day: number;
  period_target_qty: number;
  required_hc: number;
  available_hc: number;
  hc_gap: number;
  theoretical_capacity_per_shift: number;
  bottleneck_capacity_per_shift: number;
  daily_capacity: number;
  period_capacity: number;
  capacity_gap: number;
  capacity_achievement_pct: number;
  theoretical_capacity_achievement_pct: number;
  machine_requirements: MachineRequirement[];
  notes: string[];
}

export interface SkillCoverageItem {
  operation_id: string;
  operation_name: string;
  required_grade: number;
  eligible_workers: number;
  worker_ids: string[];
  status: "ok" | "tight" | "critical";
}

export interface TransferSuggestion {
  worker_id: string;
  worker_name: string;
  reason: string;
  suggested_operation_ids: string[];
}

export interface HeadcountControl {
  line_id: string;
  work_center: string;
  standard_hc: number;
  planned_hc: number;
  actual_hc: number;
  attendance_hc: number;
  optimized_hc: number;
  hc_gap: number;
  adherence_pct: number;
  attendance_pct: number;
  skill_coverage: SkillCoverageItem[];
  transfer_suggestions: TransferSuggestion[];
  notes: string[];
}

export interface PlanningSummary {
  capacity: CapacityPlan;
  headcount: HeadcountControl;
}

export interface ActualsAnalysis {
  period_days: number;
  target_output: number;
  actual_output: number;
  production_achievement_pct: number;
  actual_direct_labor_minutes: number | null;
  actual_labor_efficiency_pct: number | null;
  downtime_minutes: number;
  downtime_pct_of_planned_time: number;
  downtime_by_category: Record<string, number>;
  notes: string[];
}

export interface WarningItem {
  severity: "info" | "warning" | "critical";
  code: string;
  message: string;
  station: number | null;
  operation_id: string | null;
  worker_id: string | null;
}

export interface Diagnostics {
  feasible: boolean;
  error_type: "NONE" | "DATA" | "MODEL" | "SOLVER";
  issues: string[];
  suggestions: string[];
}

export interface RunMetadata {
  run_id: string;
  app_version: string;
  data_version: string;
  model_version: string;
  solver_version: string;
  objective: string;
  input_hash: string;
  solver_status: string;
  solve_time_sec: number;
  created_at: string;
  lexicographic_proven: boolean;
  stage1_objective: number | null;
  stage2_objective: number | null;
}

export interface OptimizeResult {
  status: "OPTIMAL" | "FEASIBLE_LIMIT" | "INFEASIBLE" | "ERROR";
  solver_status: string;
  has_solution: boolean;
  solver_available: boolean;
  solver_message: string | null;
  solve_time_sec: number;
  data_source: string;
  line_name: string;
  style_code: string;
  shift_id: string;
  sam_basis: string;
  allowance_applied_pct: number;
  takt_time_sec: number;
  effective_takt_time_sec: number;
  available_seconds: number;
  stations: StationResult[];
  assignment: Array<Record<string, unknown>>;
  worker_summary: Array<Record<string, unknown>>;
  kpis: Kpis | null;
  planning: PlanningSummary | null;
  baseline_comparison: BaselineComparison | null;
  actuals_analysis: ActualsAnalysis | null;
  warnings: WarningItem[];
  diagnostics: Diagnostics;
  metadata: RunMetadata | null;
}

export interface TimeStudyRecord {
  operation_id: string;
  observed_time_sec: number;
  performance_rating: number;
  allowance_pct: number;
  approved_sam_sec: number | null;
  revision_date: string;
  status: "DRAFT" | "APPROVED" | "SUPERSEDED";
}

export interface TimeStudyResult {
  operation_id: string;
  normal_time_sec: number;
  standard_time_sec: number;
  approved_sam_sec: number | null;
  variance_pct: number | null;
  notes: string[];
}

export interface HealthResponse {
  status: string;
  version: string;
  solver: string;
  solver_backend: string;
  solver_available: boolean;
  data_policy: string;
  scenario_persistence: string;
}

export interface BaselineStation {
  station: string;
  load_sec: number;
  operation_ids: string[];
}

export interface Snapshot {
  id: string;
  name: string;
  savedAt: string;
  scenario: ScenarioKey;
  request: SampleRequest;
  result: OptimizeResult;
}
