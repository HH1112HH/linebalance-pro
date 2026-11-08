# Data Dictionary — LineBalance Pro

> **Phiên bản:** 1.0  
> **Ngày:** 2026-11-08  
> **Phạm vi:** MVP 1 line / 1 style / 1 shift; dữ liệu synthetic.  
> **Nguồn sự thật:** `backend/app/models.py` cho API contract, `frontend/src/types.ts` cho mirror TypeScript, `KPI_SPEC.md` cho công thức KPI.  
> **Quy tắc:** nếu tài liệu này khác code, sửa một trong hai và thêm test; không để UI tự định nghĩa lại field hoặc công thức.

---

## 1. Quy ước chung

### 1.1. Đơn vị

| Đại lượng | Đơn vị | Ghi chú |
|---|---|---|
| Thời gian công đoạn, takt, bottleneck, idle, overload | giây (`sec`) | Lưu full precision; round 3 chữ số khi hiển thị |
| Thời gian ca, nghỉ, downtime, rework | phút (`min`) | `shift_minutes`, `break_minutes`, `downtime_minutes` |
| Công suất | pcs/shift hoặc pcs/giờ | Field ghi rõ đơn vị trong tên |
| Tỷ lệ, hiệu suất, coverage | % | Lưu dạng 0–100; round 2 chữ số khi hiển thị |
| Tiền | VND | Dataset case study; không phải payroll thật |
| Khối lượng nguyên phụ liệu | mét/pc (`m/pc`) | `material_consumption.csv` |
| Khoảng cách layout | mét (`m`), operator-minute | `layout_route_observations.csv` |

### 1.2. Quy ước làm tròn

- Giây: 3 chữ số thập phân.
- Phần trăm: 2 chữ số thập phân.
- Capacity: 1 chữ số thập phân.
- Giữ precision trung gian; chỉ round ở output/UI.

### 1.3. Data policy

- Toàn bộ dữ liệu public là **synthetic**. Không có dữ liệu sản xuất, lương, khách hàng hoặc định mức thật của HBI.
- Không có tên công nhân thật; worker ID là synthetic.
- Dataset case study ghi cột `data_policy = SYNTHETIC`.
- Không dùng kết quả synthetic để claim production achievement, cash saving, OEE hoặc target đạt.

---

## 2. Request models

### 2.1. `Operation`

Một công đoạn trong routing. Grain: một dòng / một operation.

| Field | Kiểu | Đơn vị | Bắt buộc | Ý nghĩa |
|---|---|---|---|---|
| `id` | string | — | Có | Operation ID, unique trong request; tối đa 40 ký tự |
| `name` | string | — | Có | Tên công đoạn |
| `sam_sec` | float | sec | Có | SAM gốc; `> 0`, `<= 3600` |
| `predecessors` | string[] | — | Không | Operation ID phải hoàn thành trước; unique, không tự tham chiếu |
| `machine_type` | string \| null | — | Không | `null` = công đoạn thủ công; không dùng mã giả `MANUAL` |
| `skill_code` | string | — | Không | Nhóm kỹ năng; mặc định `SEWING` |
| `skill_required` | int | grade 0–3 | Không | Grade tối thiểu; 0 = không yêu cầu |
| `is_quality_gate` | bool | — | Không | Quality gate, không được bỏ qua khi xếp line |
| `sequence` | int \| null | — | Không | Thứ tự hiển thị/routing; không thay thế precedence |

### 2.2. `Worker`

| Field | Kiểu | Ý nghĩa |
|---|---|---|
| `id` | string | Worker ID, unique |
| `name` | string | Tên synthetic |
| `skills` | `Record<string, int>` | Map operation ID hoặc skill code → grade 0–3; 0 = không đủ điều kiện |
| `machine_types` | string[] | Máy worker được chứng nhận vận hành; `ANY` = mọi máy |
| `available` | bool | Có sẵn trong ca |
| `worker_status` | string | Trạng thái vận hành, mặc định `ACTIVE` |

### 2.3. `Machine`

| Field | Kiểu | Ý nghĩa |
|---|---|---|
| `id` | string | Machine ID, unique |
| `machine_type` | string | Loại máy; operation chỉ dùng máy cùng `machine_type` |
| `available` | bool | Máy sẵn sàng |
| `capacity` | int | Số station có thể dùng record này đồng thời; mặc định 1 |

### 2.4. `LineConfig`

| Field | Kiểu | Đơn vị | Ý nghĩa |
|---|---|---|---|
| `shift_id` | string | — | ID ca |
| `shift_name` | string | — | Tên hiển thị |
| `shift_minutes` | float | min | Tổng thời gian ca theo lịch |
| `break_minutes` | float | min | Nghỉ kế hoạch |
| `target_qty` | int | pcs/shift | Sản lượng mục tiêu |
| `working_days` | int | ngày | Số ngày kế hoạch |
| `sam_basis` | enum | — | `INCLUDES_ALLOWANCE` hoặc `EXCLUDES_ALLOWANCE` |
| `allowance_pct` | float | fraction | Chỉ áp dụng một lần khi `EXCLUDES_ALLOWANCE`; phải `0` khi SAM đã gồm allowance |
| `planned_efficiency` | float | fraction | Hiệu suất kế hoạch, dùng một lần trong capacity |
| `max_workers` | int \| null | người | Giới hạn worker được dùng |
| `solver_time_limit_sec` | int | sec | Time limit, 1–60 |
| `objective` | enum | — | `min_workers` hoặc `min_bottleneck` |

### 2.5. `ProductionActuals`

Summary actuals cho một ngày/ca. Grain: một record summary.

| Field | Kiểu | Đơn vị | Ý nghĩa |
|---|---|---|---|
| `actual_output` | int \| null | pcs | Sản lượng thực tế |
| `actual_direct_labor_minutes` | float \| null | phút | Tổng direct labor minutes thực tế; không dùng elapsed shift time |
| `downtime_minutes` | float \| null | phút | Downtime tổng |
| `attendance_hc` | int \| null | người | HC có mặt |

### 2.6. `DailyProductionActual`

Grain: một dòng / ngày / line / shift. Dùng cho actuals analysis.

| Field | Kiểu | Đơn vị |
|---|---|---|
| `date` | string | ISO date |
| `shift_id` | string | — |
| `line_id` | string | — |
| `style_code` | string | — |
| `target_output` | int | pcs |
| `actual_output` | int | pcs |
| `actual_direct_labor_minutes` | float \| null | phút |
| `downtime_minutes` | float | phút |
| `attendance_hc` | int \| null | người |
| `note` | string | — |

### 2.7. `DowntimeEvent`

| Field | Kiểu | Đơn vị | Ý nghĩa |
|---|---|---|---|
| `start_time` | string | ISO datetime | Bắt đầu |
| `end_time` | string | ISO datetime | Kết thúc |
| `line_id` | string | — | Line |
| `station_id` | string | — | Station; có thể rỗng nếu line-level |
| `loss_category` | enum | — | `MACHINE`, `MATERIAL`, `MANPOWER`, `QUALITY`, `CHANGEOVER`, `OTHER` |
| `duration_minutes` | float | phút | `> 0`, `<= 1440` |
| `note` | string | — | Mô tả |

### 2.8. `HeadcountStandard`

| Field | Kiểu | Ý nghĩa |
|---|---|---|
| `line_id` | string | Line |
| `work_center` | string | Work center, mặc định `SEWING` |
| `standard_hc` | int | HC định biên |
| `planned_hc` | int | HC kế hoạch |
| `actual_hc` | int | HC thực tế |

### 2.9. `BaselineAssignment`

Baseline là **input**, không phải output optimizer.

| Field | Kiểu | Ý nghĩa |
|---|---|---|
| `items` | array | Mỗi item: `operation_id`, `station_id`, `worker_id` |
| `source_note` | string | Ghi rõ baseline synthetic/current-state |

### 2.10. `OptimizeRequest`

| Field | Kiểu | Ý nghĩa |
|---|---|---|
| `line_name` | string | Tên line hiển thị |
| `style_code` | string | Mã style |
| `config` | `LineConfig` | Cấu hình ca/target |
| `operations` | `Operation[]` | 1–200 operations |
| `workers` | `Worker[]` | 1–100 workers |
| `machines` | `Machine[]` | 0–200 machines |
| `actuals` | `ProductionActuals \| null` | Summary actuals |
| `headcount_standard` | `HeadcountStandard \| null` | HC standard |
| `baseline_assignment` | `BaselineAssignment \| null` | Baseline để so sánh |
| `daily_actuals` | `DailyProductionActual[]` | Tối đa 31 dòng |
| `downtime_events` | `DowntimeEvent[]` | Tối đa 500 events |

---

## 3. Response models

### 3.1. `OptimizeResponse`

| Field | Kiểu | Ý nghĩa |
|---|---|---|
| `status` | enum | `OPTIMAL`, `FEASIBLE_LIMIT`, `INFEASIBLE`, `ERROR` |
| `solver_status` | string | Trạng thái thô từ solver |
| `has_solution` | bool | Có assignment hay không |
| `solver_available` | bool | Solver khả dụng |
| `solver_message` | string \| null | Thông tin solver |
| `solve_time_sec` | float | Thời gian giải |
| `data_source` | string | `synthetic-demo-only` |
| `line_name`, `style_code`, `shift_id` | string | Context |
| `sam_basis` | string | Cơ sở SAM |
| `allowance_applied_pct` | float | Allowance thực sự áp dụng, không double count |
| `takt_time_sec` | float | Demand takt |
| `effective_takt_time_sec` | float | Effective takt / planning cycle allowance |
| `available_seconds` | float | Net available seconds |
| `stations` | `Station[]` | Kết quả station |
| `assignment` | `AssignedOperation[]` | Operation → station → worker |
| `worker_summary` | `WorkerSummary[]` | Tải và kỹ năng từng worker |
| `kpis` | `Kpis \| null` | KPI line |
| `planning` | `PlanningSummary \| null` | Capacity + HC |
| `baseline_comparison` | `BaselineComparison \| null` | Before/after nếu có baseline |
| `actuals_analysis` | `ActualsAnalysis \| null` | Phân tích actuals |
| `warnings` | `WarningItem[]` | Cảnh báo có code/severity |
| `diagnostics` | `Diagnostics` | Feasibility, error type, gợi ý |
| `metadata` | `RunMetadata \| null` | Run metadata |

### 3.2. `AssignedOperation`

Grain: một operation được gán.

| Field | Kiểu | Ý nghĩa |
|---|---|---|
| `id`, `name` | string | Operation |
| `sam_sec` | float | SAM gốc |
| `planning_sam_sec` | float | SAM dùng trong model, đã áp allowance đúng một lần |
| `machine_type` | string \| null | Máy |
| `skill_code` | string | Nhóm kỹ năng |
| `skill_required` | int | Grade yêu cầu |
| `skill_grade` | int | Grade của worker được gán |
| `skill_surplus` | int | Grade dư so với yêu cầu |
| `is_quality_gate` | bool | Quality gate |
| `station` | int | Station number |
| `sequence_in_station` | int | Thứ tự trong station |
| `worker_id`, `worker_name` | string | Worker |

### 3.3. `Station`

Grain: một station được dùng.

| Field | Kiểu | Đơn vị | Ý nghĩa |
|---|---|---|---|
| `station` | int | — | Station number |
| `worker_id`, `worker_name` | string | — | Worker |
| `operation_ids`, `operation_names` | string[] | — | Operations trong station |
| `machine_types` | string[] | — | Máy trong station |
| `standard_load_sec` | float | sec | Tổng planning SAM |
| `raw_sam_sec` | float | sec | Tổng SAM gốc |
| `standard_utilization_pct` | float | % | Load / effective takt; **không** phải machine utilization |
| `idle_sec` | float | sec | Idle so với effective takt |
| `overload_sec` | float | sec | Overload so với effective takt |
| `capacity_pcs_h` | float | pcs/h | Capacity theo station |
| `status` | enum | — | `bottleneck`, `watch`, `normal`, `underutilized` |

### 3.4. `Kpis`

| Field | Kiểu | Đơn vị | Ý nghĩa |
|---|---|---|---|
| `takt_time_sec` | float | sec | Demand takt = net seconds / target |
| `effective_takt_time_sec` | float | sec | Net seconds × planned efficiency / target |
| `available_seconds` | float | sec | Net available seconds |
| `total_sam_sec` | float | sec | Tổng SAM gốc |
| `total_planning_sam_sec` | float | sec | Tổng planning SAM |
| `workers_used` | int | người | Worker được dùng |
| `bottleneck_station` | int | — | Station bottleneck |
| `bottleneck_load_sec` | float | sec | Load bottleneck |
| `planned_labor_utilization_pct` | float | % | Planning SAM / available time |
| `balance_efficiency_pct` | float | % | LBE |
| `balance_delay_pct` | float | % | 100 − LBE |
| `smoothness_index` | float | sec | Chỉ số cân bằng |
| `capacity_per_shift` | float | pcs/shift | **Bottleneck-constrained** planning capacity |
| `target_qty` | int | pcs/shift | Target |
| `target_achievement_pct` | float | % | Capacity / target |
| `meets_target` | bool | — | Target có đạt theo planning capacity |
| `output_per_operator` | float | pcs/người | Capacity / workers |
| `total_idle_sec` | float | sec | Tổng idle |
| `total_overload_sec` | float | sec | Tổng overload |
| `planned_efficiency` | float | fraction | Hiệu suất kế hoạch |

### 3.5. `CapacityPlan`

| Field | Kiểu | Đơn vị | Ý nghĩa |
|---|---|---|---|
| `garment_sam_min` | float | min | SAM gốc / 60 |
| `garment_planning_sam_min` | float | min | Planning SAM / 60 |
| `net_shift_minutes` | float | min | Shift − break |
| `working_days` | int | ngày | Kỳ kế hoạch |
| `planned_efficiency` | float | fraction | Hiệu suất |
| `sam_basis` | string | — | Cơ sở SAM |
| `allowance_applied_pct` | float | % | Allowance áp dụng |
| `target_qty_per_day` | int | pcs/ngày | Target ngày |
| `period_target_qty` | int | pcs/kỳ | Target kỳ |
| `required_hc` | float | người | HC lý thuyết |
| `available_hc` | int | người | HC hiện có |
| `hc_gap` | float | người | Available − required |
| `theoretical_capacity_per_shift` | float | pcs/shift | Bỏ qua precedence/machine/line balance; **không** dùng claim target |
| `bottleneck_capacity_per_shift` | float | pcs/shift | Từ bottleneck thật |
| `daily_capacity` | float | pcs/ngày | Capacity dùng cho target achievement |
| `period_capacity` | float | pcs/kỳ | Capacity kỳ |
| `capacity_gap` | float | pcs | Capacity − target |
| `capacity_achievement_pct` | float | % | Bottleneck capacity / target |
| `theoretical_capacity_achievement_pct` | float | % | Theoretical / target; chỉ tham khảo |
| `machine_requirements` | `MachineRequirement[]` | — | Máy |
| `notes` | string[] | — | Ghi chú |

### 3.6. `MachineRequirement`

| Field | Kiểu | Ý nghĩa |
|---|---|---|
| `machine_type` | string | Loại máy |
| `required_stations` | int | Số station cần |
| `available_capacity` | int | Capacity khả dụng |
| `gap` | int | Thiếu/thừa |
| `coverage_pct` | float | Coverage, **không** phải utilization |
| `demand_ratio_pct` | float | Demand ratio, **không** phải utilization |
| `basis` | enum | `optimized_stations` hoặc `operation_count` |

### 3.7. `HeadcountControl`

| Field | Kiểu | Ý nghĩa |
|---|---|---|
| `line_id`, `work_center` | string | Context |
| `standard_hc`, `planned_hc`, `actual_hc` | int | HC |
| `attendance_hc` | int | HC có mặt |
| `optimized_hc` | int | HC từ optimizer |
| `hc_gap` | int | Chênh lệch |
| `adherence_pct` | float | Planned / standard |
| `attendance_pct` | float | Attendance / planned |
| `skill_coverage` | `SkillCoverageItem[]` | Coverage theo operation |
| `transfer_suggestions` | `TransferSuggestion[]` | Gợi ý điều chuyển |
| `notes` | string[] | Ghi chú |

### 3.8. `BaselineComparison`

| Field | Kiểu | Ý nghĩa |
|---|---|---|
| `before` | `BaselineMetrics \| null` | Baseline; null nếu không có baseline assignment |
| `after` | `BaselineMetrics` | Kết quả optimizer |
| `station_delta`, `worker_delta` | int \| null | After − before |
| `bottleneck_delta_sec` | float \| null | After − before |
| `balance_efficiency_delta_pct` | float \| null | After − before |
| `capacity_delta_pcs` | float \| null | After − before |
| `target_achievement_delta_pct` | float \| null | After − before |
| `violations` | string[] | Baseline violations |
| `notes` | string[] | Ghi chú |

### 3.9. `ActualsAnalysis`

Grain: kỳ actuals.

| Field | Kiểu | Đơn vị | Ý nghĩa |
|---|---|---|---|
| `period_days` | int | ngày | Số ngày |
| `target_output` | int | pcs | Tổng target |
| `actual_output` | int | pcs | Tổng actual |
| `production_achievement_pct` | float | % | Actual / target |
| `actual_direct_labor_minutes` | float \| null | phút | Direct labor |
| `actual_labor_efficiency_pct` | float \| null | % | Earned minutes / actual minutes |
| `downtime_minutes` | float | phút | Tổng downtime |
| `downtime_pct_of_planned_time` | float | % | Downtime / planned time |
| `downtime_by_category` | object | phút | Theo category |
| `notes` | string[] | — | Ghi chú |

### 3.10. `RunMetadata`

| Field | Kiểu | Ý nghĩa |
|---|---|---|
| `run_id` | string | ID lần chạy |
| `app_version`, `data_version`, `model_version`, `solver_version` | string | Version |
| `objective` | string | Objective |
| `input_hash` | string | Hash input |
| `solver_status` | string | Trạng thái solver |
| `solve_time_sec` | float | Thời gian giải |
| `created_at` | string | Timestamp |
| `lexicographic_proven` | bool | Chỉ `true` khi cả hai stage được chứng minh |

### 3.11. `Diagnostics` và `WarningItem`

| Model | Field | Ý nghĩa |
|---|---|---|
| `Diagnostics` | `feasible` | Có nghiệm hợp lệ |
|  | `error_type` | `NONE`, `DATA`, `MODEL`, `SOLVER` |
|  | `issues` | Danh sách lỗi |
|  | `suggestions` | Gợi ý xử lý |
| `WarningItem` | `severity` | `info`, `warning`, `critical` |
|  | `code` | Mã warning |
|  | `message` | Nội dung |
|  | `station`, `operation_id`, `worker_id` | Context |

### 3.12. Time study và readiness

`TimeStudyRecord` là request; `TimeStudyResult` là response của `/api/time-study/calculate`.

**Request — `TimeStudyRecord`**

| Field | Kiểu | Ý nghĩa |
|---|---|---|
| `operation_id` | string | Operation |
| `observed_time_sec` | float | Thời gian quan sát; chỉ cho human/walking work |
| `performance_rating` | float | Hệ số performance, 0.3–2.0 |
| `allowance_pct` | float | Allowance, 0–0.5 |
| `approved_sam_sec` | float \| null | SAM đã duyệt |
| `revision_date` | string | Ngày revision |
| `status` | enum | `DRAFT`, `APPROVED`, `SUPERSEDED` |

**Response — `TimeStudyResult`**

| Field | Kiểu | Ý nghĩa |
|---|---|---|
| `operation_id` | string | Operation |
| `normal_time_sec` | float | Observed × performance rating |
| `standard_time_sec` | float | Normal × (1 + allowance) |
| `approved_sam_sec` | float \| null | SAM đã duyệt |
| `variance_pct` | float \| null | So với approved SAM |
| `notes` | string[] | Ghi chú |

### 3.13. Readiness và process flow (T06)

**Request — `ReadinessEvaluationRequest`** (`POST /api/readiness/evaluate`)

| Field | Kiểu | Ý nghĩa |
|---|---|---|
| `style_code` | string | Style đang được đánh giá |
| `items` | `ReadinessItem[]` (1–100) | Checklist item cần đánh giá |

| `ReadinessItem` field | Kiểu | Ý nghĩa |
|---|---|---|
| `key` | string | Key duy nhất trong checklist |
| `label` | string | Nhãn hiển thị |
| `required` | bool | Có tính vào readiness % hay không |
| `status` | enum | `NOT_STARTED`, `IN_PROGRESS`, `COMPLETED`, `BLOCKED` |
| `note` | string | Owner/evidence/note, tối đa 500 ký tự |

**Response — `StyleReadiness`**

| Field | Kiểu | Ý nghĩa |
|---|---|---|
| `style_code` | string | Style |
| `items` | `ReadinessItem[]` | Checklist sau validation |
| `readiness_pct` | float | Required items hoàn tất / tổng required items × 100; làm tròn 2 chữ số |
| `ready` | bool | Tất cả required items `COMPLETED`, có ít nhất một required item, và không item nào `BLOCKED` |
| `blocking_items` | string[] | Key của item `BLOCKED` hoặc required item chưa `COMPLETED` |

**Request — `ProcessFlowRequest`** (`POST /api/process-flow/build`)

| Field | Kiểu | Ý nghĩa |
|---|---|---|
| `style_code` | string | Style |
| `operations` | `Operation[]` (1–200) | Routing và precedence graph |
| `assignments` | `ProcessFlowAssignment[]` (0–200) | Rỗng = routing-only; nếu có thì phải gán đủ mỗi operation đúng một lần |

`ProcessFlowAssignment`: `operation_id`, `station`, `worker_id`, `worker_name`. Worker chỉ thuộc một station; mỗi station chỉ có một worker.

**Response — `ProcessFlowResponse`**

| Field | Kiểu | Ý nghĩa |
|---|---|---|
| `style_code` | string | Style |
| `nodes` | `ProcessFlowNode[]` | Operation, SAM, machine, quality gate, predecessors; có thêm station/worker khi optimized |
| `edges` | `{source, target}[]` | Directed precedence edges; không tự tạo cạnh |
| `has_assignment` | bool | Có optimized assignments hay không |

`ProcessFlowNode.layer` là longest-path layer trong DAG; `order` là thứ tự deterministic trong layer để layout UI. Đây là metadata hiển thị, không phải KPI.

**Giới hạn T06 hiện tại:** checklist và process-flow viewer chạy trên style/routing đang chọn trong optimizer. Chưa có style master/routing editor, checklist persistence, release approval, import dữ liệu mới hoặc multi-style workflow. Checklist UI reset khi rời trang; không phải hồ sơ launch production.

### 3.14. Material usage variance (T13)

**Request — `MaterialAnalysisRequest`** (`POST /api/materials/analyze`)

| Field | Kiểu | Ý nghĩa |
|---|---|---|
| `style_code` | string | Style của case |
| `inspected_pcs` | int (1–10,000,000) | Số pcs dùng làm mẫu số |
| `phase` | enum | `CURRENT` (what-if), `BEFORE`, `AFTER` |
| `materials` | `MaterialUsageInput[]` (1–50) | Danh sách vật tư; `material_id` không được trùng |

`MaterialUsageInput`: `material_id`, `material_name`, `unit`, `standard_qty_per_pc` (>0), `actual_qty_per_pc` (≥0), `unit_cost_vnd` (>0).

**Response — `MaterialAnalysisResult`**

| Field | Kiểu | Ý nghĩa |
|---|---|---|
| `standard_cost_vnd` | float | Định mức × pcs × đơn giá |
| `actual_cost_vnd` | float | Thực tế × pcs × đơn giá |
| `variance_vnd` | float | Actual − standard; dương = vượt định mức |
| `variance_pct` | float | Chênh lệch tiêu hao so với định mức, % |
| `excess_materials` | int | Số vật tư có actual > standard |
| `lines` | `MaterialVarianceLine[]` | Chi tiết từng vật tư |
| `material_count` | int | Số vật tư |
| `data_policy` | string | `synthetic-demo-only` |
| `notes` | string[] | Ghi chú phương pháp |

`MaterialVarianceLine` bổ sung `standard_qty`, `actual_qty`, `standard_cost_vnd`, `actual_cost_vnd`, `variance_vnd`, `variance_pct`, `is_excess`.

**Response — `MaterialSampleResponse`** (`GET /api/materials/sample`)

| Field | Kiểu | Ý nghĩa |
|---|---|---|
| `style_code`, `inspected_pcs` | string, int | Metadata case T13 |
| `materials` | `MaterialUsageInput[]` | Input mặc định cho what-if |
| `before`, `after` | `MaterialAnalysisResult` | Hai giai đoạn cùng định mức/đơn giá |
| `comparison` | `MaterialComparison` | Standard, before/after cost, variance reduction, cost/pc |
| `data_policy`, `notes` | string, string[] | Nhãn synthetic và giới hạn diễn giải |

**Giới hạn material hiện tại:** chỉ tính **usage variance** với đơn giá cố định; không phải purchase-price variance. Chưa có material master/BOM editor/persistence; CSV import có ở API và UI upload/preview, nhưng chưa có material Excel import. Số tiền là cost avoidance trong dataset synthetic, không phải cash saving đã được Finance xác nhận.

### 3.15. Material CSV import

**Endpoint:** `POST /api/materials/import?phase=BEFORE` với body `text/csv` (UTF-8, cho phép BOM).

**UI:** panel “Materials” có chọn phase `BEFORE`/`AFTER`, chọn file CSV, đọc file ở client rồi gửi nguyên body `text/csv`; hiển thị preview, cảnh báo và lỗi localized. Client chặn file > 2 MB trước khi gửi.

**Response — `MaterialImportPreview`**

| Field | Kiểu | Ý nghĩa |
|---|---|---|
| `style_code` | string | Style đọc từ CSV; phải nhất quán |
| `phase` | enum | Phase được chọn để import |
| `inspected_pcs` | int | Tổng pcs của phase sau khi cộng các dòng |
| `row_count` | int | Số dòng được dùng |
| `ignored_rows` | int | Số dòng thuộc phase khác |
| `materials` | `MaterialUsageInput[]` | Tiêu hao/pc đã aggregate theo pcs |
| `analysis` | `MaterialAnalysisResult` | Kết quả usage variance |
| `data_policy` | string | `synthetic-demo-only` |
| `warnings` | string[] | Cảnh báo phase bị bỏ qua, cột derived bị bỏ |

**Quy tắc import:**

- Cột bắt buộc: `phase`, `style_code`, `material_id`, `material_name`, `unit`, `standard_qty_per_pc`, `actual_qty_per_pc`, `inspected_pcs`, `unit_cost_vnd`.
- `data_policy` (nếu có) phải là `SYNTHETIC`.
- `standard_qty_per_pc`, `actual_qty_per_pc`, `unit_cost_vnd` được aggregate có trọng số theo `inspected_pcs`.
- Mọi vật tư phải có cùng tổng `inspected_pcs`; tên/đơn vị/đơn giá/định mức của cùng `material_id` phải nhất quán.
- Cột derived (`standard_cost_vnd`, `actual_cost_vnd`, `variance_vnd`) bị bỏ qua và tính lại.
- Giới hạn 5.000 dòng dữ liệu; body vẫn chịu giới hạn chung 2 MB.
- Lỗi trả `415` nếu không phải `text/csv`; `422` kèm số dòng và tên cột; `413` nếu quá giới hạn body.
- Không persist file hoặc kết quả import; đây là preview/analysis, không phải material master. UI không thay đổi case T13 hoặc dữ liệu optimizer.

### 3.16. Scenario master-data CSV import

**Endpoint:** `POST /api/import/scenario` với JSON gồm bốn chuỗi CSV: `operations_csv`, `workers_csv`, `worker_skills_csv`, `machines_csv`. Dùng JSON thay vì multipart để không thêm dependency; mỗi trường tối đa 2.000.000 ký tự và chịu giới hạn body chung của API.

**UI:** panel “Import routing, crew and machines” trong section Solver. Người dùng chọn bốn file CSV; client giới hạn tổng 2 MB, đọc text và gửi một request. Preview hiển thị counts, số lớp thứ tự, machine types và bảng công đoạn. Nút “Apply & solve” thay operations/workers/machines của kịch bản hiện tại, xóa `baseline_assignment`, chỉ giữ actuals/headcount/daily inputs khi `style_code` và `line_name` trùng, sau đó gọi `/api/optimize` trước khi commit state.

**Request — `ScenarioImportRequest`**

| Field | Kiểu | Ý nghĩa |
|---|---|---|
| `operations_csv` | string | Toàn bộ nội dung `operations.csv` |
| `workers_csv` | string | Toàn bộ nội dung `workers.csv` |
| `worker_skills_csv` | string | Toàn bộ nội dung `worker_skills.csv` |
| `machines_csv` | string | Toàn bộ nội dung `machines.csv`; được phép rỗng nếu không có công đoạn dùng máy |

**Response — `ScenarioImportPreview`**

| Field | Kiểu | Ý nghĩa |
|---|---|---|
| `line_name`, `style_code` | string \| null | Metadata đọc từ operations; phải nhất quán |
| `operations` | `Operation[]` | Routing đã normalize |
| `workers` | `Worker[]` | Công nhân kèm `skills` map `operation_id → grade` |
| `machines` | `Machine[]` | Máy đã normalize |
| `counts` | `ScenarioImportCounts` | Operations, workers, skill assignments, machines, precedence layers, machine types |
| `data_policy` | string | `synthetic-demo-only` |

**Quy tắc import:**

- Bốn file phải là UTF-8 (cho phép BOM); header được trim; header rỗng hoặc trùng bị từ chối.
- `operations` bắt buộc: `operation_id`, `operation_name`, `sam_sec`, `predecessor_ids`, `machine_type`, `skill_code`, `skill_required`, `is_quality_gate`, `sequence`. Tùy chọn: `line_name`, `style_code`, `data_policy`.
- `workers` bắt buộc: `worker_id`, `worker_name`. Tùy chọn: `available`, `worker_status`, `machine_types`.
- `worker_skills` bắt buộc: `worker_id`, `operation_id`, `skill_grade` (`A`=3, `B`=2, `C`=1, `NONE`/`0`=0, hoặc số 0–3).
- `machines` bắt buộc: `machine_id`, `machine_type`, `available`, `capacity`. File được phép rỗng nếu mọi công đoạn là thủ công.
- `machine_type` rỗng/`MANUAL`/`NONE` nghĩa là thủ công; mỗi loại máy thực tế phải có ít nhất một máy available.
- `predecessor_ids` và `machine_types` phân tách bằng `|`, `;` hoặc `,`.
- `line_name` và `style_code` nếu có phải nhất quán trên toàn bộ operations.
- `data_policy` nếu có phải là `SYNTHETIC`.
- Cột `efficiency_factor` bị từ chối rõ ràng: hiệu suất riêng theo công nhân không thuộc import; SAM đã duyệt theo công đoạn là cơ sở duy nhất.
- Giới hạn: 200 operations, 100 workers, 10.000 skill rows, 200 machines.
- Lỗi cấu trúc/tham chiếu/chu trình/thiếu máy trả `422` với detail dạng `operations CSV is missing columns: ...` hoặc `[operations] Row 3: ...`.
- Import chỉ bảo đảm cấu trúc và tham chiếu. Eligibility về skill/precedence/machine vẫn do `validate_request` của optimizer kiểm tra lại khi apply.
- Không persist file, preview hoặc scenario; đây là master-data import tạm trong phiên, không phải style master hay routing editor.
- Templates: `docs/data/scenario_master/{operations,workers,worker_skills,machines}.csv` — 40 operations, 24 workers, 576 skill rows, 23 machines; round-trip qua `validate_request` với 0 lỗi.

`ScenarioCreateRequest` / `ScenarioSummary` / `ScenarioDetail` / `ScenarioListResponse` và tầng `scenario_service.py`/`scenario_store.py` đã có trong repo. Phase 4 đã bật trên private staging với PostgreSQL (xem §3.18). `/api/import/scenario` chỉ validate/preview trong bộ nhớ; frontend lưu snapshot cá nhân trong `localStorage` mặc định và có thể dùng tài khoản demo để lưu/mở scenario trên server.

### 3.17. Scenario Excel workbook import

**Endpoint:** `POST /api/import/scenario/excel` với body nhị phân `.xlsx` và header `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`. Đây là adapter mỏng: mỗi sheet được chuyển thành CSV text rồi đi qua đúng `parse_scenario_bundle` của §3.16, nên toàn bộ quy tắc cột, tham chiếu, precedence, machine coverage và `efficiency_factor` được dùng chung.

**Workbook contract:**

| Sheet | Bắt buộc | Nội dung |
|---|---|---|
| `operations` | Có | Cùng cột với `operations.csv` |
| `workers` | Có | Cùng cột với `workers.csv` |
| `worker_skills` | Có | Cùng cột với `worker_skills.csv` |
| `machines` | Không | Cùng cột với `machines.csv`; bỏ trống nếu mọi công đoạn thủ công |

- Tên sheet không phân biệt hoa/thường; khoảng trắng và dấu gạch ngang được chuẩn hóa, ví dụ `Worker Skills` → `worker_skills`. Sheet lạ bị bỏ qua; tên chuẩn hóa trùng nhau bị từ chối.
- Dòng không rỗng đầu tiên là header; các dòng sau là dữ liệu. Ô trống được bỏ; giá trị boolean/float/int được chuyển thành text trước khi parse.
- Dùng **giá trị tĩnh**, không dùng công thức. Workbook được đọc với `data_only=True`; ô công thức chưa có cached value sẽ thành rỗng.
- Giới hạn: body 2 MB; tối đa 30 worksheet, 2.000 zip entry, 20.000.000 byte uncompressed, 10.001 dòng/sheet (header + 10.000 dòng); sau đó vẫn áp dụng giới hạn 200 operations / 100 workers / 10.000 skill rows / 200 machines.
- Lỗi: `415` nếu sai MIME; `413` nếu quá body limit; `422` nếu file không phải `.xlsx`, thiếu sheet bắt buộc, sheet rỗng, hoặc dữ liệu sai theo contract CSV. Detail actionable, ví dụ `Excel workbook is missing required sheets: worker_skills.` hoặc `[operations] Row 3: ...`.
- Không persist file, preview hoặc scenario. Đây không phải style master/routing editor.
- Template: `docs/data/scenario_master/scenario_master.xlsx` (4 sheet, 40/24/576/23) sinh từ bốn CSV bằng `scripts/build_scenario_workbook.py`; test `test_committed_workbook_template_matches_csv_templates` giữ template đồng bộ.

### 3.18. Phase 4 scenario persistence + demo accounts — private staging

> **Trạng thái 2026-11-08:** Phase 4.2–4.6 đã triển khai trên **private staging Neon PostgreSQL 18.6**: migration `001`, repository PostgreSQL, bốn endpoint `/api/scenarios`, demo accounts admin/viewer, session cookie và frontend server-scenario client. Compute và snapshot nội bộ vẫn dùng được khi chưa đăng nhập; Neon persistence vẫn tắt mặc định (`localStorage`). Chưa public deployment.

Contract đã có:

- `POST /api/scenarios`: `ScenarioCreateRequest` chỉ nhận `name` + `request`; server validate, chạy lại optimizer và chỉ lưu `OPTIMAL`/`FEASIBLE_LIMIT`, không nhận result do client gửi. Trả `201` + `Location`; replay cùng `Idempotency-Key` + cùng input hash trả `200`.
- `GET /api/scenarios?limit=&cursor=`: summary cursor pagination, không trả request/result; limit 1–100, mặc định 50.
- `GET /api/scenarios/{id}`: request + result đầy đủ; ID khác workspace trả generic `404`.
- `DELETE /api/scenarios/{id}`: hard delete + audit `delete`, trả `204`.
- `GET /api/auth/session`: trả `authenticated`, `username`, `role`, `login_enabled`, `expires_at`; không trả mật khẩu/secret.
- `POST /api/auth/login`: `LoginRequest {username, password}`; thành công đặt cookie HttpOnly `lb_session` (HTTPS: `__Host-lb_session`), `SameSite=Lax`, TTL mặc định 8 giờ. Session là token HMAC stateless, chứa role + fingerprint mật khẩu; đổi mật khẩu thu hồi phiên cũ.
- `POST /api/auth/logout`: xóa cookie, trả `204`.
- Auth cho scenario: `Authorization: Bearer <SCENARIO_API_TOKEN>` **hoặc** session cookie. Admin được create/delete; viewer chỉ list/get. Cookie write yêu cầu `Origin` hợp lệ (CSRF); bearer write không cần.
- Tài khoản demo lấy từ env (`AUTH_ADMIN_USERS`, `AUTH_VIEWER_USERS`) và dùng chung `AUTH_DEMO_PASSWORD`; không có bảng user/session trong PostgreSQL. Một `workspace_id` từ env dùng chung cho admin + viewer.
- Lỗi: `400` cursor invalid, `401` thiếu/sai token/session/mật khẩu, `403` viewer write hoặc Origin bị từ chối, `404`, `409` idempotency/quota, `413` payload > 1.500.000 byte, `422` request/solve invalid, `429` login/write rate limit, `503` persistence tắt/misconfigured/DB lỗi hoặc login chưa cấu hình.
- Bảng `scenarios` lưu JSONB request/result + cột summary; `scenario_audit` append-only; `schema_migrations` ghi version/checksum. `created_at` là `timestamptz`, service trả ISO 8601 UTC.
- Migration forward-only `backend/migrations/001_scenarios.sql` + `scripts/migrate.py`; không `Base.metadata.create_all()` lúc startup.
- DB lỗi/tắt → endpoint scenario `503`; optimize/export vẫn chạy.

Residual: quota dùng count/insert chưa advisory lock; list query còn select JSONB; DB role là owner; chưa có purge audit; auth demo dùng chung mật khẩu, không có IdP/MFA, viewer đọc được mọi scenario trong workspace. Chi tiết schema, threat model, runbook ở [`docs/POSTGRESQL_PERSISTENCE_DESIGN.md`](POSTGRESQL_PERSISTENCE_DESIGN.md).

---

## 4. API endpoints

| Method | Endpoint | Request | Response |
|---|---|---|---|
| `GET` | `/api/health` | — | Solver status, limits, data policy |
| `GET` | `/api/sample` | — | `OptimizeRequest` scenario A |
| `GET` | `/api/sample/feasible` | — | `OptimizeRequest` scenario B |
| `GET` | `/api/samples` | — | `{stretch_420, feasible_400}` |
| `POST` | `/api/optimize` | `OptimizeRequest` | `OptimizeResponse` |
| `POST` | `/api/export` | `{request, result, language}` | XLSX binary |
| `POST` | `/api/actuals/analyze` | `OptimizeRequest` (dùng `actuals`, `daily_actuals`, `downtime_events`) | `ActualsAnalysis` |
| `POST` | `/api/time-study/calculate` | `TimeStudyRecord` | `TimeStudyResult` |
| `POST` | `/api/readiness/evaluate` | `ReadinessEvaluationRequest` | `StyleReadiness` |
| `POST` | `/api/process-flow/build` | `ProcessFlowRequest` | `ProcessFlowResponse` |
| `GET` | `/api/materials/sample` | — | `MaterialSampleResponse` |
| `POST` | `/api/materials/analyze` | `MaterialAnalysisRequest` | `MaterialAnalysisResult` |
| `POST` | `/api/materials/import?phase=BEFORE` | `text/csv` body | `MaterialImportPreview` |
| `POST` | `/api/import/scenario` | `ScenarioImportRequest` (4 CSV strings) | `ScenarioImportPreview` |
| `POST` | `/api/import/scenario/excel` | `.xlsx` binary body (4 sheets) | `ScenarioImportPreview` |
| `POST` | `/api/scenarios` | `ScenarioCreateRequest` | `ScenarioDetail` (`201`/`200`) |
| `GET` | `/api/scenarios?limit=&cursor=` | — | `ScenarioListResponse` |
| `GET` | `/api/scenarios/{id}` | — | `ScenarioDetail` |
| `DELETE` | `/api/scenarios/{id}` | — | `204` |
| `GET` | `/api/auth/session` | — | `AuthSessionResponse` |
| `POST` | `/api/auth/login` | `LoginRequest` | `AuthSessionResponse` + session cookie |
| `POST` | `/api/auth/logout` | — | `204` |

**Chưa có API** cho upload Excel vật tư, style master/routing edit, checklist persistence, OEE, material master/BOM hoặc protection pay. `/api/scenarios` yêu cầu bearer token hoặc tài khoản demo; admin ghi, viewer chỉ đọc. Frontend lưu snapshot cá nhân trong `localStorage` mặc định và có thể lưu/mở scenario server khi đăng nhập; readiness draft chỉ nằm trong component state.

---

## 5. Dataset grains trong `docs/data`

Tất cả dataset dưới đây là synthetic và chỉ dùng cho case study/playbook, không phải input trực tiếp của optimizer trừ khi được chuyển thành `OptimizeRequest`.

| File | Grain | Khóa | Kỳ | Ghi chú |
|---|---|---|---|---|
| `quality_inspection_summary.csv` | phase × date | `phase, date` | 5 ngày/giai đoạn | 364 pcs/ngày; tổng 1,820 pcs/giai đoạn; mẫu số cho defect rate |
| `quality_defects.csv` | phase × date × defect_type | `phase, date, defect_type` | 5 ngày/giai đoạn | 45 defect BEFORE; 18 AFTER; rework 3 phút/defect |
| `quality_setup_audit.csv` | phase × changeover_date | `phase, changeover_date` | 5 lần/giai đoạn | Guide presence, first-piece check, misalignment 2h |
| `material_consumption.csv` | phase × date × material_id | `phase, date, material_id` | 5 ngày/giai đoạn | 3 vật tư; 1,820 pcs/giai đoạn; standard vs actual |
| `kaizen_cost_model.csv` | category × item | `category, item` | — | `ASSUMPTION` rows để trống cột tiền; `IMPLEMENTATION` rows cộng 12,000,000 VND |
| `hourly_actuals.csv` | date × hour × line | `date, hour_start` | 1 ngày | Planned/actual, WIP, downtime theo giờ |
| `waste_observation.csv` | date × station × waste_type | `date, station_id, waste_type` | 1 ngày | Đo theo operator-minute, piece, line-minute |
| `oee_machine_log.csv` | date × hour × machine | `date, machine_id, hour_start` | 1 ngày | A/P/Q cho PRESS-01; synthetic |
| `smed_changeover_study.csv` | changeover × phase | `changeover_id` | 5 lần/giai đoạn | Element-level thời gian changeover |
| `layout_route_observations.csv` | phase × trial | `phase, trial` | 5 trials/giai đoạn | Round-trip distance, operator time, aisle crossings |
| `scenario_master/operations.csv` | operation | `operation_id` | — | 40 công đoạn mẫu; template cho `POST /api/import/scenario` |
| `scenario_master/workers.csv` | worker | `worker_id` | — | 24 công nhân; không có `efficiency_factor` |
| `scenario_master/worker_skills.csv` | worker × operation | `worker_id, operation_id` | — | 576 lượt kỹ năng; grade A/B/C |
| `scenario_master/machines.csv` | machine | `machine_id` | — | 23 máy; 4 loại máy |
| `scenario_master/scenario_master.xlsx` | 4 sheet | sheet name | — | Workbook mẫu cho `POST /api/import/scenario/excel`; sinh từ bốn CSV |

### 5.1. Quality denominator

`quality_inspection_summary.csv` là nguồn mẫu số. Công thức:

```text
defect_rate_pct = defect_count / inspected_pcs × 100
FPY_pct         = (inspected_pcs − defect_count) / inspected_pcs × 100
rework_min      = defect_count × rework_min_each
```

Tổng BEFORE: 1,820 inspected; 45 defects; 135 rework minutes.  
Tổng AFTER: 1,820 inspected; 18 defects; 54 rework minutes.

### 5.2. Material standard

`material_consumption.csv` so sánh **standard consumption** (BOM/định mức) với **actual consumption** (issue/return record), cùng style, line, 1,820 pcs/giai đoạn.

```text
standard_cost_vnd = standard_qty_per_pc × inspected_pcs × unit_cost_vnd
actual_cost_vnd   = actual_qty_per_pc   × inspected_pcs × unit_cost_vnd
variance_vnd      = actual_cost_vnd − standard_cost_vnd
variance_pct      = (actual_qty_per_pc / standard_qty_per_pc − 1) × 100
```

Kết quả synthetic:

| Giai đoạn | Standard cost | Actual cost | Excess vs standard |
|---|---:|---:|---:|
| BEFORE | 22,222,200 VND | 23,205,000 VND | 982,800 VND (4.42%) |
| AFTER | 22,222,200 VND | 22,686,300 VND | 464,100 VND (2.09%) |

Excess giảm 518,700 VND (**52.8%**). Đây là material cost avoidance trong cửa sổ so sánh, không phải cash saving đã được Finance xác nhận.

Cùng công thức này được expose qua `GET /api/materials/sample` và `POST /api/materials/analyze`, với UI “Materials” cho case T13 và what-if. API chỉ trả usage variance; không có material master/BOM/import.

### 5.3. Kaizen cost model

`kaizen_cost_model.csv` tách rõ:

- `ASSUMPTION`: labor rate (có `unit_cost_vnd = 60,000`, `total_vnd` trống), paid hours/shift và working days/month (cả hai cột tiền để trống vì không phải tiền).
- `IMPLEMENTATION`: các hạng mục có chi phí thật trong model; tổng 12,000,000 VND.

---

## 6. Sample JSON files

| File | Vai trò |
|---|---|
| `frontend/src/data/sample_request_A.json` | Request scenario A (target 420), dùng cho UI demo |
| `frontend/src/data/sample_request_B.json` | Request scenario B (target 400), dùng cho UI demo |
| `frontend/src/data/sample_result_A.json` | Kết quả A đã serialize |
| `frontend/src/data/sample_result_B.json` | Kết quả B đã serialize |
| `frontend/src/data/baseline_stations.json` | Baseline station load hiển thị trong before/after |

Source of truth cho sample request là `backend/app/sample_data.py`; JSON trong frontend là snapshot demo. Nếu sửa sample data, phải regenerate JSON và chạy test/UI check.

---

## 7. Data-quality rules

### 7.1. Identity và reference

- `Operation.id`, `Worker.id`, `Machine.id` unique trong request.
- `predecessors` chỉ tham chiếu operation tồn tại; không self-reference; không duplicate.
- `baseline_assignment.items` chỉ tham chiếu operation/worker tồn tại.
- `machine_type` của operation phải có machine tương ứng nếu khác `null`.
- `worker.machine_types` phải cover machine type của operation được gán, trừ khi worker có `ANY`.

### 7.2. Assignment invariants

- Mỗi operation được gán đúng **một** station.
- Mỗi worker được gán tối đa **một** station.
- Precedence: predecessor phải ở station trước hoặc cùng station với thứ tự hợp lệ.
- Skill: `skill_grade >= skill_required`.
- Machine: station không vượt `Machine.capacity` cho cùng `machine_type`.
- Quality gate không bị bỏ qua.
- `standard_load_sec` = tổng `planning_sam_sec` của các operation trong station.

### 7.3. Numeric invariants

- `sam_sec > 0`; `shift_minutes > break_minutes`; `target_qty > 0`.
- Allowance chỉ áp dụng một lần:
  - `INCLUDES_ALLOWANCE` → `allowance_applied_pct = 0`;
  - `EXCLUDES_ALLOWANCE` → cộng `allowance_pct` vào planning SAM đúng một lần.
- `takt_time_sec = available_seconds / target_qty`.
- `effective_takt_time_sec = available_seconds × planned_efficiency / target_qty`.
- `capacity_per_shift` là bottleneck-constrained; không thay bằng theoretical capacity.
- `machine coverage`/`demand_ratio` không được gọi là machine utilization.
- Không chia cho 0: dùng `safe_div`, trả 0/default.
- Readiness: key duy nhất; phải có ít nhất một required item; optional `BLOCKED` vẫn chặn `ready`.
- Process flow: operation IDs duy nhất; predecessor phải tồn tại và không tự tham chiếu; DAG phải acyclic.
- Process flow optimized: đủ một assignment/operation; một worker tối đa một station; một station tối đa một worker.

### 7.4. Status rules

- Chỉ trả `OPTIMAL` khi `metadata.lexicographic_proven = true`.
- Nếu hết time limit mà có incumbent: `FEASIBLE_LIMIT`.
- Không có assignment hợp lệ: `INFEASIBLE`.
- Lỗi validation/solver: `ERROR`, message actionable, không lộ stack trace.

### 7.5. Dataset rules

- Mọi file CSV phải có header; không đổi tên cột tùy tiện.
- Cột `data_policy` phải là `SYNTHETIC`.
- Tổng defect trong `quality_defects.csv` phải khớp `quality_inspection_summary.csv`.
- Tổng chi phí trong `material_consumption.csv` phải khớp standard/actual đã công bố.
- `kaizen_cost_model.csv`: dòng `ASSUMPTION` không được có số tiền; dòng `IMPLEMENTATION` phải cộng đúng tổng.
- Không hard-code số liệu mới trong component; UI lấy từ `result`, `data.ts` hoặc API.

---

## 8. Những gì chưa có

Các mục sau **không** nằm trong data contract hiện tại:

- Material master/BOM editor; API hiện chỉ có usage-variance analysis và CSV preview trên synthetic T13.
- Import Excel cho vật tư; material CSV đã có API `text/csv` và UI upload/preview. Scenario master data đã có CSV và workbook `.xlsx`.
- User table/identity provider, multi-tenant workspace isolation và production RBAC. Demo accounts admin/viewer dùng chung mật khẩu + một workspace; frontend có panel lưu/mở scenario server nhưng snapshot người dùng vẫn mặc định ở `localStorage`.
- Style master/routing editor và checklist persistence.
- OEE API.
- Protection pay formula/calculator; official HR/Finance policy is pending (`docs/PROTECTION_PAY_POLICY_INTAKE.md`).
- Multi-line/multi-plant.
- Production authentication/RBAC (chỉ có demo accounts admin/viewer, không có IdP/MFA).
- Real-time MES/machine integration.

Khi thêm một trong các mục trên, cập nhật `models.py`, `frontend/src/types.ts`, `README.md`, tài liệu liên quan và test trước khi mở rộng UI. Protection pay không được triển khai cho tới khi policy và acceptance test vectors được HR/Finance phê duyệt.
