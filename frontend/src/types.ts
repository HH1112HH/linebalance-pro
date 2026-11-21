export type ScenarioKey = "A" | "B";
export type ViewKey = ScenarioKey | "custom";
export type SectionKey =
  | "overview"
  | "balance"
  | "capacity"
  | "actuals"
  | "time-study"
  | "style-setup"
  | "materials"
  | "quality"
  | "layout"
  | "solver";

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

export type ReadinessKey =
  | "operation_routing"
  | "sam_approved"
  | "machine_ready"
  | "manpower_assigned"
  | "skill_coverage"
  | "layout_ready"
  | "material_ready"
  | "production_trial";
export type ReadinessStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "BLOCKED";

export interface ReadinessDraftItem {
  key: ReadinessKey;
  required: boolean;
  status: ReadinessStatus;
  note: string;
}

export interface ReadinessItemInput extends ReadinessDraftItem {
  label: string;
}

export interface ReadinessEvaluationRequest {
  style_code: string;
  items: ReadinessItemInput[];
}

export interface StyleReadinessResult {
  style_code: string;
  items: ReadinessItemInput[];
  readiness_pct: number;
  ready: boolean;
  blocking_items: string[];
}

export interface ProcessFlowAssignment {
  operation_id: string;
  station: number;
  worker_id: string;
  worker_name: string;
}

export interface ProcessFlowRequest {
  style_code: string;
  operations: OperationInput[];
  assignments: ProcessFlowAssignment[];
}

export interface ProcessFlowNode {
  operation_id: string;
  name: string;
  sam_sec: number;
  machine_type: string | null;
  is_quality_gate: boolean;
  predecessors: string[];
  layer: number;
  order: number;
  station: number | null;
  worker_id: string | null;
  worker_name: string | null;
}

export interface ProcessFlowEdge {
  source: string;
  target: string;
}

export interface ProcessFlowResult {
  style_code: string;
  nodes: ProcessFlowNode[];
  edges: ProcessFlowEdge[];
  has_assignment: boolean;
}

export type MaterialPhase = "CURRENT" | "BEFORE" | "AFTER";

export interface MaterialUsageInput {
  material_id: string;
  material_name: string;
  unit: string;
  standard_qty_per_pc: number;
  actual_qty_per_pc: number;
  unit_cost_vnd: number;
}

export interface MaterialAnalysisRequest {
  style_code: string;
  inspected_pcs: number;
  phase: MaterialPhase;
  materials: MaterialUsageInput[];
}

export interface MaterialVarianceLine {
  material_id: string;
  material_name: string;
  unit: string;
  standard_qty_per_pc: number;
  actual_qty_per_pc: number;
  unit_cost_vnd: number;
  standard_qty: number;
  actual_qty: number;
  standard_cost_vnd: number;
  actual_cost_vnd: number;
  variance_vnd: number;
  variance_pct: number;
  is_excess: boolean;
}

export interface MaterialAnalysisResult {
  style_code: string;
  phase: MaterialPhase;
  inspected_pcs: number;
  material_count: number;
  standard_cost_vnd: number;
  actual_cost_vnd: number;
  variance_vnd: number;
  variance_pct: number;
  excess_materials: number;
  lines: MaterialVarianceLine[];
  data_policy: string;
  notes: string[];
}

export interface MaterialComparison {
  standard_cost_vnd: number;
  before_cost_vnd: number;
  after_cost_vnd: number;
  before_variance_vnd: number;
  after_variance_vnd: number;
  variance_reduction_vnd: number;
  variance_reduction_pct: number;
  before_cost_per_pc_vnd: number;
  after_cost_per_pc_vnd: number;
  cost_per_pc_delta_vnd: number;
}

export interface MaterialSampleResult {
  style_code: string;
  inspected_pcs: number;
  materials: MaterialUsageInput[];
  before: MaterialAnalysisResult;
  after: MaterialAnalysisResult;
  comparison: MaterialComparison;
  data_policy: string;
  notes: string[];
}

export interface MaterialImportPreview {
  style_code: string;
  phase: MaterialPhase;
  inspected_pcs: number;
  row_count: number;
  ignored_rows: number;
  materials: MaterialUsageInput[];
  analysis: MaterialAnalysisResult;
  data_policy: string;
  warnings: string[];
}

export interface ScenarioImportRequest {
  operations_csv: string;
  workers_csv: string;
  worker_skills_csv: string;
  machines_csv: string;
}

export interface ScenarioImportCounts {
  operations: number;
  workers: number;
  skill_assignments: number;
  machines: number;
  precedence_layers: number;
  machine_types: string[];
}

export interface ScenarioImportPreview {
  line_name: string | null;
  style_code: string | null;
  operations: OperationInput[];
  workers: WorkerInput[];
  machines: MachineInput[];
  counts: ScenarioImportCounts;
  data_policy: string;
}

export interface HealthResponse {
  status: string;
  version: string;
  solver: string;
  solver_backend: string;
  solver_available: boolean;
  data_policy: string;
  scenario_persistence: string;
  auth?: {
    enabled: boolean;
    mode: string;
    roles: string[];
    session_ttl_sec: number;
  };
  scenario_auth?: string;
}

export type AuthRole = "admin" | "viewer";

export interface AuthSession {
  authenticated: boolean;
  login_enabled: boolean;
  username: string | null;
  role: AuthRole | null;
  expires_at: string | null;
}

export interface ServerScenarioSummary {
  id: string;
  name: string;
  created_at: string;
  status: "OPTIMAL" | "FEASIBLE_LIMIT";
  solver_status: string;
  line_name: string;
  style_code: string;
  workers_used: number;
  stations_used: number;
  balance_efficiency_pct: number;
  model_version: string;
  data_version: string;
}

export interface ServerScenarioDetail extends ServerScenarioSummary {
  result_origin: "server-solve";
  schema_version: number;
  request: SampleRequest;
  result: OptimizeResult;
}

export interface ServerScenarioList {
  items: ServerScenarioSummary[];
  next_cursor: string | null;
}

export interface ScenarioCreateRequest {
  name: string;
  request: SampleRequest;
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

export type CaseStudyPhase = "BEFORE" | "AFTER";

export interface QualityParetoRow {
  defect_code: string;
  defect_type: string;
  count: number;
  share_pct: number;
  cumulative_pct: number;
}

export interface QualityPhaseSummary {
  phase: CaseStudyPhase;
  start_date: string;
  end_date: string;
  days: number;
  inspected_pcs: number;
  defect_count: number;
  defect_rate_pct: number;
  first_pass_yield_pct: number;
  rework_min_total: number;
  top_defect_type: string | null;
  dpmo: number;
  z_benchmark: number | null;
  pareto: QualityParetoRow[];
}

export interface QualityDefectComparison {
  defect_code: string;
  defect_type: string;
  before_count: number;
  after_count: number;
  delta_count: number;
  delta_pct: number | null;
}

export interface QualityDailyPoint {
  phase: CaseStudyPhase;
  date: string;
  inspected_pcs: number;
  defect_count: number;
  defect_rate_pct: number;
  out_of_control: boolean;
}

export interface QualityPChartPhase {
  phase: CaseStudyPhase;
  mean_rate_pct: number;
  ucl_pct: number;
  lcl_pct: number;
  out_of_control_points: number;
}

export interface QualitySetupAuditRow {
  phase: CaseStudyPhase;
  changeover_date: string;
  guide_present: boolean;
  first_piece_check: boolean;
  misalignment_next_2h: number;
}

export interface QualitySetupAuditSummary {
  before_changeovers: number;
  before_guide_present: number;
  before_first_piece_check: number;
  before_misalignment_after_changeover: number;
  before_total_misalignment: number;
  before_misalignment_share_pct: number;
  after_changeovers: number;
  after_guide_present: number;
  after_first_piece_check: number;
  after_misalignment_after_changeover: number;
}

export interface TwoProportionTest {
  p1_pct: number;
  p2_pct: number;
  pooled_pct: number;
  z_stat: number;
  p_value: number;
  ci_low_pct: number;
  ci_high_pct: number;
}

export interface QualityCaseStudyResult {
  line_id: string;
  style_code: string;
  operation_id: string;
  operation_name: string;
  phases: QualityPhaseSummary[];
  defect_types: QualityDefectComparison[];
  daily: QualityDailyPoint[];
  p_chart: QualityPChartPhase[];
  setup_audit: QualitySetupAuditRow[];
  setup_audit_summary: QualitySetupAuditSummary;
  two_proportion_test: TwoProportionTest;
  data_policy: string;
}

export interface LayoutRouteTrial {
  phase: CaseStudyPhase;
  trial: number;
  date: string;
  from_point: string;
  to_point: string;
  distance_m: number;
  time_min: number;
  crossings: number;
}

export interface LayoutPhaseSummary {
  phase: CaseStudyPhase;
  trial_count: number;
  mean_distance_m: number;
  mean_time_min: number;
  mean_crossings: number;
  trips_per_shift: number;
  distance_per_shift_m: number;
  time_per_shift_min: number;
}

export interface LayoutCaseStudyResult {
  line_id: string;
  station_id: string;
  trips_per_shift: number;
  trials: LayoutRouteTrial[];
  phases: LayoutPhaseSummary[];
  distance_reduction_pct: number;
  time_reduction_pct: number;
  crossings_per_shift_before: number;
  crossings_per_shift_after: number;
  data_policy: string;
}
