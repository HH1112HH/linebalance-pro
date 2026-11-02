# KPI Specification — LineBalance Pro

> **Phiên bản:** 1.0  
> **Ngày:** 2026-11-02  
> **Phạm vi:** MVP 1 factory / 1 style / 1 line / 1 shift; dữ liệu synthetic.  
> **Nguồn sự thật:** tài liệu này định nghĩa công thức và tên KPI. Code tương ứng nằm trong `backend/app/kpis.py`, `planning.py`, `actuals.py`, `baseline.py`, `utils.py`.  
> **Quy tắc:** nếu tài liệu và code khác nhau, phải sửa một trong hai và thêm test; không được để dashboard tự tính lại công thức.

---

## 0. Trạng thái implement

| Nhóm | Trạng thái | Nơi implement |
|---|---|---|
| Station KPI | `[x]` | `kpis.py` |
| Line KPI | `[x]` | `kpis.py` |
| Capacity planning | `[x]` | `planning.py` |
| HC & skill | `[x]` | `planning.py` |
| Actuals | `[x]` | `actuals.py` |
| Baseline before/after | `[x]` | `baseline.py` |
| Time Study aggregate | `[x]` | `utils.py`, `/api/time-study/calculate` |
| Time Study element-level | `[ ]` | Chỉ có schema đề xuất trong playbook |
| Hourly Production Control | `[ ]` | CSV + playbook; chưa có backend model |
| 8 Wastes measurement | `[ ]` | CSV + playbook; chưa phải software feature |
| OEE | `[ ]` | Chỉ có công thức; chưa đủ dữ liệu A/P/Q |

---

## 1. Quy ước thời gian

### 1.1. Các đại lượng gốc

```text
shift_minutes          = tổng thời gian ca theo lịch
break_minutes          = nghỉ theo kế hoạch trong ca
net_available_seconds  = (shift_minutes - break_minutes) × 60
planned_efficiency     = hiệu suất kế hoạch, dùng một lần trong capacity
```

`net_available_seconds` **không** trừ allowance và **không** trừ planned efficiency. Hai yếu tố này được xử lý riêng:

- allowance nằm trong `planning_sam_sec`;
- planned efficiency nằm trong công thức capacity.

### 1.2. Demand Takt và Effective Takt

```text
takt_time_sec (Demand Takt)
    = net_available_seconds / target_qty

effective_takt_time_sec (Effective Takt / Planning Cycle Allowance)
    = net_available_seconds × planned_efficiency / target_qty
```

| Field | Tên đúng | Cách dùng | Không được gọi |
|---|---|---|---|
| `takt_time_sec` | Demand Takt | Nhịp theo nhu cầu khách hàng | Không gọi là “effective takt” |
| `effective_takt_time_sec` | Effective Takt / Planning Cycle Allowance | Nhịp kế hoạch sau khi trừ planned efficiency; dùng cho station utilization và Yamazumi | **Không gọi là takt khách hàng** |

Ví dụ scenario A:

```text
net_available_seconds = (480 - 30) × 60 = 27,000s
target_qty = 420
planned_efficiency = 0.85

takt_time_sec = 27,000 / 420 = 64.285714s
effective_takt_time_sec = 27,000 × 0.85 / 420 = 54.642857s
```

`54.64s` là **Planning Cycle Allowance**, không phải Demand Takt. Dashboard, Yamazumi và phỏng vấn phải ghi rõ tên.

---

## 2. SAM và allowance

### 2.1. Raw SAM và planning SAM

```text
raw_sam_sec        = operation.sam_sec
planning_sam_sec   = raw_sam_sec × (1 + effective_allowance_pct)
```

`effective_allowance_pct`:

```text
Nếu sam_basis = INCLUDES_ALLOWANCE:
    effective_allowance_pct = 0
    allowance_pct chỉ là thông tin, không cộng lại

Nếu sam_basis = EXCLUDES_ALLOWANCE:
    effective_allowance_pct = allowance_pct
    allowance được cộng đúng một lần vào planning SAM
```

**Quy tắc bất biến:** allowance, efficiency và performance rating không được nhân hai lần vào cùng một đại lượng.

### 2.2. Tổng SAM

```text
total_sam_sec           = Σ raw_sam_sec của tất cả operation
total_planning_sam_sec  = Σ planning_sam_sec của tất cả operation
```

Trong mô hình hiện tại, `total_planning_sam_sec` cũng bằng tổng load của tất cả station:

```text
total_planning_sam_sec = Σ standard_load_sec(station)
```

### 2.3. Time Study aggregate — giới hạn hiện tại

Endpoint `POST /api/time-study/calculate` chỉ nhận:

```text
observed_time_sec
performance_rating
allowance_pct
```

và trả:

```text
normal_time_sec   = observed_time_sec × performance_rating
standard_time_sec = normal_time_sec × (1 + allowance_pct)
```

**Đây là aggregate calculation**, không phải element-level time study. Không dùng endpoint này để nhân Performance Rating vào machine automatic time.

Element-level đúng:

```text
NT_e = OT_e × PR_e        (human / walking)
NT_e = OT_e               (machine automatic; PR_e = 1.00)
NT_total = Σ NT_e
ST = Σ [NT_e × (1 + allowance_e)]
```

Mỗi element phải có `element_type`, `observed_time_sec`, `performance_rating`, `normal_time_sec`, `allowance_basis`, `allowance_pct`, `standard_time_sec`. Schema này **chưa implement trong backend**; xem playbook §3.8.

---

## 3. Station KPI

### 3.1. Công thức

```text
standard_load_sec(station)
    = Σ planning_sam_sec(operation) của các operation tại station

raw_sam_sec(station)
    = Σ raw_sam_sec(operation) của các operation tại station

standard_utilization_pct(station)
    = standard_load_sec / effective_takt_time_sec × 100

idle_sec(station)
    = max(0, effective_takt_time_sec - standard_load_sec)

overload_sec(station)
    = max(0, standard_load_sec - effective_takt_time_sec)

capacity_pcs_h(station)
    = 3600 × planned_efficiency / standard_load_sec
```

| Field | Unit | Ý nghĩa | Ghi chú |
|---|---|---|---|
| `standard_load_sec` | giây | Load chuẩn của station | Dùng planning SAM, không dùng raw SAM |
| `raw_sam_sec` | giây | SAM gốc của các operation | Chỉ để đối chiếu |
| `standard_utilization_pct` | % | Load station so với Effective Takt | **Không phải machine utilization** |
| `idle_sec` | giây | Thời gian nhàn so với Effective Takt | Không phải idle thực tế trong ca |
| `overload_sec` | giây | Phần vượt Effective Takt | Có thể cùng tồn tại với idle ở station khác |
| `capacity_pcs_h` | pcs/giờ | Năng lực station tại planned efficiency | Không tính downtime/OEE |

### 3.2. Trạng thái station

Code `station_status()` dùng:

```text
Nếu is_bottleneck = true hoặc standard_utilization_pct > 100.5:
    status = "bottleneck"
Ngược lại nếu standard_utilization_pct >= 90:
    status = "watch"
Ngược lại nếu standard_utilization_pct < 60:
    status = "underutilized"
Ngược lại:
    status = "normal"
```

Lưu ý:

- Một station có thể được gắn `bottleneck` vì là station có load lớn nhất, dù utilization chưa vượt 100.5%.
- Ngưỡng 90% và 60% là quy tắc hiển thị của MVP, không phải tiêu chuẩn HBI.
- `standard_utilization_pct` dùng **Effective Takt**, không dùng Demand Takt.

---

## 4. Line KPI

### 4.1. Công thức

```text
workers_used = số station có worker

bottleneck_load_sec
    = max(standard_load_sec của các station)

bottleneck_station
    = station có standard_load_sec lớn nhất

planned_labor_utilization_pct
    = total_planning_sam_sec / (workers_used × takt_time_sec) × 100

balance_efficiency_pct (LBE)
    = total_planning_sam_sec / (workers_used × bottleneck_load_sec) × 100

balance_delay_pct
    = max(0, 100 - balance_efficiency_pct)

smoothness_index
    = sqrt( Σ (bottleneck_load_sec - standard_load_sec(station))² )

capacity_per_shift
    = net_available_seconds × planned_efficiency / bottleneck_load_sec

target_achievement_pct
    = capacity_per_shift / target_qty × 100

meets_target
    = capacity_per_shift >= target_qty

output_per_operator
    = capacity_per_shift / workers_used

total_idle_sec
    = Σ max(0, effective_takt_time_sec - standard_load_sec(station))

total_overload_sec
    = Σ max(0, standard_load_sec(station) - effective_takt_time_sec)
```

### 4.2. Ý nghĩa và giới hạn

| Field | Unit | Ý nghĩa | Không được hiểu là |
|---|---|---|---|
| `planned_labor_utilization_pct` | % | Standard minutes sản xuất tại target chia cho paid minutes tại demand takt | Không phải actual labor efficiency |
| `balance_efficiency_pct` | % | Mức cân bằng load giữa các station | Không phải hiệu suất lao động thực tế |
| `balance_delay_pct` | % | Phần load không cân bằng | Không phải thời gian lãng phí đã đo |
| `smoothness_index` | giây | Độ lệch load so với bottleneck; càng thấp càng tốt | Không phải %; không có ngưỡng chung |
| `capacity_per_shift` | pcs/ca | Năng lực bị chặn bởi bottleneck | Không phải theoretical capacity |
| `target_achievement_pct` | % | Capacity bottleneck / target | Không phải actual output achievement |
| `output_per_operator` | pcs/người/ca | Capacity chia số worker dùng | Không phải năng suất thực tế |
| `total_idle_sec` | giây | Tổng idle so với Effective Takt | Không phải idle thực tế |
| `total_overload_sec` | giây | Tổng overload so với Effective Takt | Không phải overtime |

**Quan trọng:** `planned_labor_utilization_pct` dùng **Demand Takt** ở mẫu số. Đây là metric planning, không phải actual labor efficiency. Actual labor efficiency nằm ở §7.

### 4.3. Ví dụ scenario A

```text
available_seconds        = 27,000
target_qty               = 420
planned_efficiency       = 0.85
workers_used             = 23
bottleneck_load_sec      = 58.0
total_planning_sam_sec   = 1,059.0

takt_time_sec            = 64.285714
effective_takt_time_sec  = 54.642857

planned_labor_utilization_pct
    = 1,059 / (23 × 64.285714) × 100 = 71.62%

balance_efficiency_pct
    = 1,059 / (23 × 58.0) × 100 = 79.39%

balance_delay_pct        = 100 - 79.39 = 20.61%
capacity_per_shift       = 27,000 × 0.85 / 58.0 = 395.7 pcs
target_achievement_pct   = 395.7 / 420 × 100 = 94.21%
meets_target             = false
output_per_operator      = 395.7 / 23 = 17.2 pcs/người/ca
```

### 4.4. Ví dụ scenario B

```text
target_qty               = 400
workers_used             = 25
bottleneck_load_sec      = 56.0
total_planning_sam_sec   = 1,059.0

takt_time_sec            = 27,000 / 400 = 67.5s
effective_takt_time_sec  = 27,000 × 0.85 / 400 = 57.375s

planned_labor_utilization_pct
    = 1,059 / (25 × 67.5) × 100 = 62.76%

balance_efficiency_pct
    = 1,059 / (25 × 56.0) × 100 = 75.64%

capacity_per_shift       = 27,000 × 0.85 / 56.0 = 409.8 pcs
target_achievement_pct   = 409.8 / 400 × 100 = 102.46%
meets_target             = true
```

---

## 5. Capacity Planning

### 5.1. Công thức

```text
garment_sam_min
    = Σ raw_sam_sec / 60

garment_planning_sam_min
    = Σ planning_sam_sec / 60

net_shift_minutes
    = net_available_seconds / 60

period_target_qty
    = target_qty_per_day × working_days

required_hc
    = period_target_qty × garment_planning_sam_min
      / (net_shift_minutes × working_days × planned_efficiency)

theoretical_capacity_per_shift
    = available_hc × net_shift_minutes × planned_efficiency
      / garment_planning_sam_min

bottleneck_capacity_per_shift
    = kpis.capacity_per_shift

daily_capacity
    = bottleneck_capacity_per_shift

period_capacity
    = daily_capacity × working_days

capacity_gap
    = period_capacity - period_target_qty

capacity_achievement_pct
    = period_capacity / period_target_qty × 100

theoretical_capacity_achievement_pct
    = theoretical_capacity_per_shift × working_days
      / period_target_qty × 100
```

### 5.2. Cách đọc

| Field | Ý nghĩa | Cảnh báo |
|---|---|---|
| `theoretical_capacity_per_shift` | Năng lực lý thuyết từ tổng HC và tổng SAM | Bỏ qua precedence, machine, balance; **không phải cam kết sản lượng** |
| `bottleneck_capacity_per_shift` | Năng lực thực tế theo bottleneck optimizer | Dùng cho daily/period capacity |
| `daily_capacity` | Capacity per shift dùng cho target achievement | Bằng bottleneck capacity |
| `period_capacity` | Capacity cho `working_days` | Không cộng thêm ngày ngoài kế hoạch |
| `required_hc` | HC lý thuyết cần để đạt period target | Có thể thấp hơn HC optimizer vì skill/machine/precedence |
| `CapacityPlan.hc_gap` | `required_hc - available_hc` | Dương = thiếu theo lý thuyết; khác `HeadcountControl.hc_gap` |

**Quy tắc:** Không dùng `theoretical_capacity_per_shift` để claim đạt target. Target achievement chính thức dùng `bottleneck_capacity_per_shift`.

> **Cảnh báo trùng tên:** `CapacityPlan.hc_gap` = `required_hc - available_hc`; `HeadcountControl.hc_gap` = `actual_hc - standard_hc`. Hai field cùng tên nhưng khác mẫu số và mục đích. Dashboard phải ghi rõ context, không dùng lẫn.

### 5.3. Machine requirement — không phải utilization

```text
required_stations
    = số station optimizer có machine_type đó
      (fallback: số operation cần machine_type đó)

coverage_pct
    = min(100, available_capacity / required_stations × 100)

demand_ratio_pct
    = required_stations / available_capacity × 100
```

- `available_capacity` là số máy available theo loại, không phải giờ máy chạy.
- `coverage_pct` và `demand_ratio_pct` là **machine capacity coverage / demand ratio**, không phải machine utilization.
- Không suy ra OEE từ các field này.

---

## 6. HC và Skill

### 6.1. Headcount

```text
hc_gap          = actual_hc - standard_hc
adherence_pct   = actual_hc / standard_hc × 100
attendance_pct  = attendance_hc / actual_hc × 100
optimized_hc    = workers_used từ optimizer
```

| Field | Ý nghĩa | Ghi chú |
|---|---|---|
| `HeadcountControl.hc_gap` | Dương = vượt standard; âm = thiếu | Không phải số người cần tuyển ngay; khác `CapacityPlan.hc_gap` |
| `adherence_pct` | Actual HC / standard HC | Không phải attendance |
| `attendance_pct` | Có mặt / actual HC | Manual input; không có HR/MES |
| `optimized_hc` | Số station optimizer dùng | Không phải standard HC |

### 6.2. Skill coverage

```text
eligible_workers(operation)
    = số worker available có skill grade >= operation.skill_required
      và có machine certification nếu operation cần máy

status:
    critical  nếu eligible_workers = 0
    tight     nếu eligible_workers = 1
    ok        nếu eligible_workers >= 2
```

`versatility_pct(worker) = qualified_operations / total_operations × 100`.

**Quy tắc:** Skill grade là **eligibility gate**, không nhân vào SAM và không nhân vào cycle time. Không dùng skill coverage thay cho quality hoặc performance.

---

## 7. Actuals

### 7.1. Công thức

```text
production_achievement_pct
    = actual_output / target_output × 100

actual_labor_efficiency_pct
    = actual_output × garment_planning_sam_min
      / actual_direct_labor_minutes × 100

downtime_pct_of_planned_time
    = downtime_minutes / (shift_minutes × period_days) × 100
```

Trong đó:

- `garment_planning_sam_min = Σ planning_sam_sec / 60` — allowance được áp đúng một lần.
- `actual_direct_labor_minutes` là số phút lao động trực tiếp thực tế, **không phải** thời gian ca trôi qua.
- `target_output` là target của cùng kỳ; với `daily_actuals`, cộng target từng ngày.

### 7.2. Quy tắc

- Không dùng `shift_minutes × attendance_hc` thay cho actual direct labor minutes nếu chưa xác nhận đó là paid direct labor minutes.
- Không dùng elapsed time thay cho actual labor minutes.
- `downtime_pct_of_planned_time` dùng **planned shift minutes**, gồm cả break; đây là quy ước của code, không phải downtime % của net available time.
- Nếu thiếu actual labor minutes, `actual_labor_efficiency_pct = null`; không tự suy diễn.
- `production_achievement_pct` là actual, khác `target_achievement_pct` (planning capacity) ở §4.

### 7.3. Ví dụ actuals summary

```text
actual_output             = 360
target_output             = 420
actual_direct_labor_min  = 9,000
garment_planning_sam_min  = 1,059 / 60 = 17.65

production_achievement_pct
    = 360 / 420 × 100 = 85.71%

actual_labor_efficiency_pct
    = 360 × 17.65 / 9,000 × 100 = 70.60%
```

---

## 8. Baseline Before/After

### 8.1. Cách tính

Baseline là **input**, không phải output optimizer. Nếu không có baseline, chỉ hiển thị after.

```text
before.standard_load(station)
    = Σ planning_sam_sec(operation) trong baseline station

before.bottleneck_load_sec
    = max(before.standard_load)

before.balance_efficiency_pct
    = total_planning_sam / (before.workers_used × before.bottleneck_load) × 100

before.capacity_per_shift
    = net_available_seconds × planned_efficiency / before.bottleneck_load

before.target_achievement_pct
    = before.capacity_per_shift / target_qty × 100
```

After dùng đúng KPI của optimizer.

### 8.2. Delta — đọc đúng dấu

| Field | Công thức | Dấu dương nghĩa là |
|---|---|---|
| `station_delta` | after - before | Nhiều station hơn (xấu nếu mục tiêu là giảm) |
| `worker_delta` | after - before | Nhiều worker hơn (xấu nếu mục tiêu là giảm) |
| `bottleneck_delta_sec` | **before - after** | Bottleneck giảm (tốt) |
| `balance_efficiency_delta_pct` | after - before | Cân bằng tốt hơn |
| `capacity_delta_pcs` | after - before | Capacity tăng |
| `target_achievement_delta_pct` | after - before | Mức đạt target tăng |

**Cảnh báo:** `bottleneck_delta_sec` có dấu ngược với các delta còn lại. UI phải ghi rõ “before − after; positive = improvement”.

### 8.3. Baseline 24/24/61.0s

```text
stations_used            = 24
workers_used             = 24
bottleneck_load_sec      = 61.0
total_planning_sam_sec   = 1,059.0

balance_efficiency_pct   = 1,059 / (24 × 61.0) × 100 = 72.34%
capacity_per_shift       = 27,000 × 0.85 / 61.0 = 376.2 pcs
target 420 achievement   = 376.2 / 420 × 100 = 89.58%
target 400 achievement   = 376.2 / 400 × 100 = 94.06%
```

Scenario A after:

```text
23 station / 23 worker / 58.0s
LBE 79.39%, capacity 395.7, target 420 achievement 94.21%
station_delta = -1, worker_delta = -1
bottleneck_delta_sec = 61.0 - 58.0 = +3.0s
```

---

## 9. Time Study KPI

### 9.1. Aggregate endpoint

```text
normal_time_sec   = observed_time_sec × performance_rating
standard_time_sec = normal_time_sec × (1 + allowance_pct)
variance_pct      = (standard_time_sec - approved_sam_sec) / approved_sam_sec × 100
```

`variance_pct` dương nghĩa là đo ra thời gian cao hơn SAM đang dùng.

### 9.2. Element-level — chưa implement

```text
NT_e = OT_e × PR_e        (HUMAN / WALKING)
NT_e = OT_e               (MACHINE; PR_e = 1.00)
ST   = Σ [NT_e × (1 + allowance_e)]
SAM  = ST / 60
```

**Quy tắc:**

- Machine automatic time không nhận PR của operator.
- Mỗi allowance có `allowance_basis`; không cộng allowance hai lần.
- 5 cycle chỉ là ví dụ; không claim approved SAM nếu chưa đủ sample size, method chuẩn và người duyệt.
- Không tự động cập nhật SAM từ optimizer. Kaizen đổi method → time study lại → approve → cập nhật planning SAM.

### 9.3. Phân biệt các loại cycle

```text
labor_content     = human time + walking time
machine_cycle     = machine automatic time
operator_cycle    = human + walking + waiting của người
station_cycle     = labor_content + machine_time - overlap + unavoidable_waiting
```

Yamazumi dùng `station_cycle` đã xét overlap, không cộng human + machine + walking máy móc.

---

## 10. Hourly Production Control — docs-only

Chưa có backend model; công thức dùng trong playbook và CSV.

```text
working_hours = (shift_minutes - break_minutes) / 60
hourly_plan   = target_qty / working_hours

cum_plan(h)   = Σ planned_output của các bucket đến h
cum_actual(h) = Σ actual_output của các bucket đến h
gap(h)        = cum_actual(h) - cum_plan(h)
gap_pct(h)    = gap(h) / cum_plan(h) × 100

projected_output(h)
    = cum_actual(h)
      / elapsed_scheduled_production_hours(h)
      × working_hours
```

`elapsed_scheduled_production_hours`:

- loại trừ break theo kế hoạch;
- **bao gồm downtime ngoài kế hoạch**;
- không phải machine run time.

Ví dụ 12:00 ngày 2026-10-27:

```text
cum_actual = 172
cum_plan   = 224
gap        = -52
gap_pct    = -23.21%
elapsed_scheduled_production_hours = 4.0
projected  = 172 / 4.0 × 7.5 = 322.5 pcs
projected vs target = 322.5 / 420 = 76.8%
```

Kết luận: gap < −15% và projected < 90% → **Red escalation**.

WIP phải đo theo buffer:

```text
WIP excess = WIP actual - WIP cap
```

Ví dụ `ST05-IN`: 38 − 25 = **13 pcs**. Không gọi là 13 phút.

---

## 11. Waste measurement — docs-only

Bốn cơ sở đo không được cộng chéo:

| Nhóm | Đơn vị | Công thức | Ví dụ |
|---|---|---|---|
| Labor loss | operator-minutes | loss operator-min / total direct labor-min × 100 | 88.25 / 9,450 = 0.93% |
| Machine loss | machine-minutes | loss machine-min / planned machine-min × 100 | 25 / 450 = 5.56% tại ST05 |
| Line stoppage | line-minutes | line stop min / planned production min × 100 | Chưa đo |
| Inventory / early output | pcs | WIP actual − WIP cap; early output | 13 pcs; 15 pcs |

**Quy tắc:**

- Không cộng operator-minutes với machine-minutes hoặc line-minutes.
- Máy dừng 25 phút không tự động là 25 line-minutes.
- Overproduction là **15 pcs early output**, không phải 15 phút.
- Pareto phải cùng một cơ sở đo. Pareto labor hiện tại: Defects 34.0%, Skills 22.8%, Transport 20.4% → top 3 = 77.2%.
- Không quy đổi waste ra tiền nếu chưa có cost data.
- Không gọi machine allocation là machine utilization; waste analysis không thay thế OEE.

---

## 12. OEE — chưa implement

Chỉ tính khi có đủ dữ liệu:

```text
Availability = Run Time / Planned Production Time
Performance  = (Ideal Cycle Time × Total Count) / Run Time
Quality      = Good Count / Total Count
OEE          = Availability × Performance × Quality
```

Không suy ra OEE từ machine allocation, số máy available hoặc tổng downtime. Nếu thiếu một trong ba thành phần, ghi `N/A`, không ước lượng.

---

## 13. Quy tắc đặt tên và anti-pattern

| Không dùng | Dùng đúng | Lý do |
|---|---|---|
| “Takt 54.64s” | “Effective Takt 54.64s” hoặc “Planning Cycle Allowance” | 54.64s đã trừ planned efficiency; Demand Takt là 64.29s |
| “Labor efficiency” cho `planned_labor_utilization_pct` | “Planned Labor Utilization” | Đây là planning metric, không phải actual |
| “Machine utilization” cho `coverage_pct` | “Machine Capacity Coverage” / “Machine Demand Ratio” | Không có runtime/OEE |
| “Capacity” cho theoretical capacity | “Theoretical capacity” | Không dùng để claim target |
| “Output” cho `capacity_per_shift` | “Bottleneck-constrained capacity” | Là năng lực, không phải sản lượng thực tế |
| “Waste 28.5%” | “Labor loss 0.93%” + “Machine loss 5.56%” + “WIP 13 pcs” | Các cơ sở đo khác nhau |
| “SAM updated by optimizer” | “Planning SAM unchanged; re-time-study required” | Optimizer không thay đổi method |
| “Protection pay / quality / safety formula” | Chỉ nêu khi có policy/dữ liệu chính thức | Không bịa công thức |

---

## 14. Checklist test

- [ ] `takt_time_sec = net_available_seconds / target_qty`.
- [ ] `effective_takt_time_sec = net_available_seconds × planned_efficiency / target_qty`.
- [ ] `planning_sam_sec` cộng allowance đúng một lần; `INCLUDES_ALLOWANCE` → allowance applied = 0.
- [ ] `standard_load_sec` bằng tổng planning SAM của station.
- [ ] `standard_utilization_pct` dùng Effective Takt, không dùng Demand Takt.
- [ ] `balance_efficiency_pct = total_planning_sam / (workers_used × bottleneck_load)`.
- [ ] `capacity_per_shift = net_available_seconds × planned_efficiency / bottleneck_load`.
- [ ] `target_achievement_pct` dùng bottleneck capacity.
- [ ] `meets_target` khớp `capacity >= target`.
- [ ] `planned_labor_utilization_pct` không bị gọi là actual labor efficiency.
- [ ] `actual_labor_efficiency_pct` dùng planning SAM và actual direct labor minutes.
- [ ] `downtime_pct_of_planned_time` dùng planned shift minutes.
- [ ] Baseline delta đúng dấu; `bottleneck_delta_sec = before - after`.
- [ ] Machine coverage/demand ratio không bị gọi là utilization.
- [ ] Time study aggregate không nhận machine automatic PR.
- [ ] Hourly projected dùng `elapsed_scheduled_production_hours`.
- [ ] Waste không cộng chéo operator/machine/line-minutes.
- [ ] Zero denominator trả 0 hoặc null theo quy ước, không crash.
- [ ] Tất cả KPI trong response khớp tài liệu này.

---

## 15. Mapping code

| KPI / field | Code |
|---|---|
| `takt_time_sec` | `utils.takt_time_sec()` |
| `effective_takt_time_sec` | `utils.effective_takt_time_sec()` |
| `planning_sam_sec` | `utils.planning_sam_sec()` |
| `standard_load_sec` | `kpis.build_station()` |
| `standard_utilization_pct` | `kpis.build_station()` |
| `balance_efficiency_pct` | `kpis.compute_kpis()` |
| `capacity_per_shift` | `kpis.compute_kpis()` |
| `planned_labor_utilization_pct` | `kpis.compute_kpis()` |
| `required_hc` | `planning.build_planning_summary()` |
| `theoretical_capacity_per_shift` | `planning.build_planning_summary()` |
| `machine coverage/demand ratio` | `planning._machine_requirements()` |
| `actual_labor_efficiency_pct` | `actuals.analyze_actuals()` |
| baseline before/after | `baseline.build_baseline_comparison()` |
| time study aggregate | `utils.calculate_time_study()` |

---

## 16. Kết luận

KPI chỉ đúng khi **tên, đơn vị, mẫu số và nguồn dữ liệu** đúng. Một con số đúng phép tính nhưng sai bản chất nghiệp vụ không được đưa lên dashboard hoặc dùng trong phỏng vấn.

Ba quy tắc không thương lượng:

1. Demand Takt và Effective Takt là hai đại lượng khác nhau.
2. Allowance, efficiency và performance rating mỗi yếu tố chỉ tính một lần.
3. Machine allocation, machine coverage và OEE là ba khái niệm khác nhau.
