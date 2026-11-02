# LineBalance Pro — Review Checklist & Decision Log

> **Phiên bản:** 1.3  
> **Ngày:** 2026-11-02  
> **Cập nhật lần cuối:** 2026-11-02 — bổ sung định hướng sau audit 10 nhóm IE/Lean; ưu tiên knowledge-first, đóng băng phạm vi phần mềm.  
> **Mục đích:** Ghi lại đầy đủ các điểm review P0/P1/P2, quyết định kỹ thuật, trạng thái code và điều kiện nghiệm thu.  
> **Nguyên tắc:** Tài liệu này là nguồn sự thật cho các sửa đổi. Nếu `ROADMAP.md` cũ mâu thuẫn với file này, file này được ưu tiên.

---

## 0. Cách đọc trạng thái

| Ký hiệu | Ý nghĩa |
|---|---|
| `[x]` | Đã hoàn thành và đã kiểm tra |
| `[~]` | Đã sửa code, chưa đạt nghiệm thu hoặc chưa có UI/test |
| `[ ]` | Chưa làm |
| `[!]` | Đang bị chặn bởi lỗi kỹ thuật |

---

## 0.1. Định hướng cập nhật sau audit 10 nhóm IE/Lean — 2026-11-02

> **Mục này thay thế các số liệu/trạng thái cũ trong file.** Các mục 10.1 và 11 bên dưới là lịch sử; khi mâu thuẫn, đọc theo mục này.

### Kết quả audit

- 10 nhóm nội dung IE/Lean: **3 nhóm thiếu hoàn toàn** (Hourly Production Control, Lean 8 Wastes, Cross-functional Management), **7 nhóm chỉ có một phần**, **0 nhóm đủ**.
- 5 việc kỹ thuật: HiGHS đã dùng mặc định; baseline đã rebuild **24 station/24 worker/61.0s**; `KPI_SPEC.md` đã có; pytest có **25 test pass**; T07/T08 case study đã có; frontend đã build, public URL còn chờ deploy.

### Quyết định hướng làm

1. **Đóng băng phạm vi phần mềm.** Không thêm module mới ngoài T01–T06; T07–T08 chỉ là case study; T09–T16 là backlog.
2. **Ưu tiên lấp kiến thức Lean/Six Sigma/vận hành.** Deliverable chính là `docs/IE_OPERATIONS_PLAYBOOK.md` + `docs/INTERVIEW_PREP.md` (chưa tạo) + case study T07/T08.
3. **Không nhồi nội dung Lean vào `MODEL.md`.** `MODEL.md` giữ vai trò spec toán.
4. **Frontend tối thiểu:** chỉ 3 màn hình nhập Actual Production, Downtime, Time Study + dashboard đọc kết quả. Không làm full MES, multi-plant, realtime, ML, CAD, full auth.

### Thứ tự học/làm

1. Time Study & Standard Work
2. Hourly Production Control
3. Lean 8 Wastes
4. DMAIC & Kaizen A3
5. OEE & Downtime
6. Layout & Ergonomics
7. SMED & Changeover
8. Cross-functional Management
9. Interview English

### Thứ tự thực thi dự án

| Thứ tự | Việc | Điều kiện xong |
|---:|---|---|
| 1 | Cập nhật CHECKLIST/ROADMAP + tạo khung playbook | `[x]` Không còn câu “API vẫn CBC”; có mục 10 nhóm |
| 2 | Viết 5 nhóm P0 của playbook | `[x]` Time Study, Hourly, 8 Wastes, DMAIC & Kaizen A3 done; OEE mới có công thức, chưa có A/P/Q |
| 3 | Rebuild baseline 24/24 | `[x]` 24 station/24 worker/61.0s; precedence/skill/machine valid |
| 4 | Viết T07/T08 case study trên baseline mới | `[x]` DMAIC/RCA + A3/Control Plan + before/after; xem `docs/CASE_STUDY_QUALITY_RCA.md`, `docs/CASE_STUDY_KAIZEN.md` |
| 5 | `KPI_SPEC.md` + pytest | `[x]` KPI khớp code; 25 test pass cho core constraints/API |
| 6 | Frontend tối thiểu + deploy | `[~]` 3 form nhập + dashboard đã build; public URL còn chờ deploy |

### Không làm trong đợt này

- Multi-plant, MES integration, realtime, full auth, ML/DL, CAD layout.
- Không thêm KPI mới nếu chưa có dữ liệu.
- Không dùng dữ liệu thật của HBI; chỉ synthetic.

---

## 0.2. Review log 3 module IE/Lean — 2026-11-02

> **Kết quả:** 10 P0 đã sửa trong playbook/CSV; 12/13 mục review done, 1 mục P1 còn partial (OEE).
> Chi tiết từng item nằm trong `docs/IE_OPERATIONS_PLAYBOOK.md` §2.1.

### P0 đã sửa

| # | Vấn đề | Cách sửa | File |
|---:|---|---|---|
| 1 | PR áp đồng loạt cho machine time | `NT = Σ OT_e × PR_e`; machine automatic `PR_e = 1.00` | Playbook §3.2–3.6; endpoint hiện tại vẫn aggregate, element-level chỉ documented |
| 2 | Allowance không có cơ sở | Thêm `allowance_basis`; không cộng allowance hai lần | Playbook §3.2–3.6 |
| 3 | OP060 5 cycle bị hiểu là xác nhận SAM | Ghi rõ là bài luyện tập; 12.5% là giả định synthetic | Playbook §3.5 |
| 4 | 54.64s bị gọi là Takt | Đổi thành Effective Takt / Planning Cycle Allowance; Demand Takt = 64.29s | Playbook §3.7 |
| 5 | Cộng human + machine + walking máy móc | Thêm labor content / operator cycle / machine cycle / station cycle và overlap | Playbook §3.6.1 |
| 6 | `productive_hours_elapsed` mơ hồ | Đổi thành `elapsed_scheduled_production_hours`; gồm downtime, loại break | Playbook §4.3 |
| 7 | WIP cap 25 không có nguồn | Gắn buffer `ST05-IN`, ghi rõ là giả định synthetic; CSV có `buffer_id`/`wip_cap` | Playbook §4.4–4.7; `hourly_actuals.csv` |
| 8 | 12:00 chưa kích hoạt Red | Ghi rõ gap −23.21% và projected 76.8% → **Red** | Playbook §4.6 |
| 9 | Overproduction 15 phút sai | Đổi thành **15 pcs early output**; không gán thời gian | Playbook §5.4–5.6; `waste_observation.csv` |
| 10 | Pareto trộn operator/machine/line-minutes | Tách 4 cơ sở đo; Pareto labor riêng top 3 = 77.2% | Playbook §5.4–5.6; `waste_observation.csv` |

### P1 status

| # | Vấn đề | Trạng thái | Bằng chứng / việc còn lại |
|---:|---|---|---|
| 11 | DMAIC Control Plan / reaction plan | `[x]` | §6–7 playbook; `docs/CASE_STUDY_QUALITY_RCA.md`; `docs/CASE_STUDY_KAIZEN.md` |
| 12 | Mura và Muri | `[x]` | §5.3.1 |
| 13 | OEE đủ A × P × Q | `[~]` | Có công thức §8; cần synthetic runtime/performance/quality data trước khi tính |

### Việc kỹ thuật tiếp theo

1. `[x]` Rebuild baseline **24 station / 24 worker / 61.0s** trong `sample_data.py` — 2026-11-02.
2. `[x]` Rerun scenario A/B; before/after đã cập nhật.
3. `[x]` Tạo `KPI_SPEC.md` — 2026-11-02.
4. `[x]` Thêm pytest cho KPI, constraints và API — **25 passed**.
5. `[x]` Viết T07/T08 case study — `docs/CASE_STUDY_QUALITY_RCA.md`, `docs/CASE_STUDY_KAIZEN.md`.
6. `[~]` Frontend tối thiểu đã build; deploy public còn chờ.

---

## 1. Bảng tổng hợp 13 mục ưu tiên

| # | Mục | Ưu tiên | Quyết định | Trạng thái |
|---|---|---|---|---|
| 1 | Sửa công thức MILP và tuyến tính hóa workload | P0 | Dùng SAM cố định cho MVP; bỏ effective time phụ thuộc worker | `[x]` code xong; 24-worker optimum 58.0s đã chứng minh bằng HiGHS; API dùng HiGHS mặc định, CBC chỉ là fallback; có pytest |
| 2 | Sửa logic gán máy và precedence trong station | P0 | Một station một loại máy; `machine_type=None` cho công đoạn thủ công | `[x]` code xong; pytest kiểm tra precedence/skill/machine |
| 3 | Triển khai lexicographic optimization đúng nghĩa | P0 | Hai bước giải thật; chỉ claim OPTIMAL khi cả hai bước chứng minh tối ưu | `[x]` code xong; small-instance test kiểm tra `lexicographic_proven`; full 40-op vẫn là benchmark thủ công |
| 4 | Bổ sung baseline assignment để so sánh | P0 | Bắt buộc có baseline mới hiển thị before/after; không tự tạo số liệu | `[x]` baseline 24 station/24 worker/61.0s; before/after A đã rerun, không vi phạm |
| 5 | Chuẩn hóa Takt, SAM, allowance và efficiency | P0 | Mỗi yếu tố tính đúng một lần; định nghĩa trong `KPI_SPEC.md` | `[x]` code xong; `KPI_SPEC.md` đã tạo; có pytest |
| 6 | Bổ sung production actuals và loss-time data model | P0 | Thêm daily actuals, downtime events, actual LE | `[x]` model + hàm phân tích xong; actual LE dùng planning SAM; có pytest |
| 7 | Bảo vệ API và database public | P0 | Giới hạn request, rate limit, concurrency, tắt scenario API public | `[x]` code xong; pytest kiểm tra body limit/rate limit/health |
| 8 | Sửa KPI Labor Efficiency và Machine Allocation | P1 | Đổi tên thành Planned Labor Utilization; Machine Capacity Coverage/Demand Ratio | `[x]` code xong; KPI_SPEC và pytest xác nhận tên/công thức |
| 9 | Thêm Time Study & SAM Validation | P1 | Model + endpoint tính Normal/Standard Time | `[~]` endpoint + UI aggregate xong; element-level chưa |
| 10 | Thêm Layout Engineering case study | P1 | Case study + SVG đơn giản; không làm CAD trong MVP | `[ ]` |
| 11 | Thêm Supervisor Approval và audit trail | P1 | Data model + workflow duyệt; không tự động áp dụng phương án | `[ ]` |
| 12 | Bổ sung Material Standardization case | P2 | Case study định mức chỉ/băng keo/viền | `[ ]` |
| 13 | Chuẩn bị 5 tình huống phỏng vấn bằng tiếng Anh | P1 | `docs/INTERVIEW_PREP.md` | `[ ]` |

---

## 2. Sáu lỗi P0 — quyết định và cách sửa

### P0-1. MILP không còn tuyến tính do `worker_at_s`

**Vấn đề:**  
`Load_s = Σ effective_time(i, worker_at_s) × x_is` là tích của biến chọn công đoạn và biến chọn công nhân. Nếu `effective_time` phụ thuộc worker, mô hình không còn là MILP tuyến tính thông thường.

**Quyết định cho MVP:**  
Dùng **SAM cố định** làm thời gian tiêu chuẩn:

```text
Load_s = Σ_i planning_sam_i × x_is
```

Trong đó:

```text
planning_sam_i = SAM_i × (1 + allowance_i)
```

- `allowance_i = 0` nếu `sam_basis = INCLUDES_ALLOWANCE`.
- `allowance_i = allowance_pct` nếu `sam_basis = EXCLUDES_ALLOWANCE`.
- Skill grade chỉ là **điều kiện đủ năng lực**, không phải hệ số năng suất.
- `performance_rate` / `efficiency_factor` của worker **không dùng** trong MVP. Chỉ đưa vào khi có dữ liệu time study đáng tin cậy.

**Vì sao không dùng `a_isw` ngay:**  
`a_isw` đúng về mặt toán học nhưng tạo thêm `operations × stations × workers` biến nhị phân. Với 40 × 24 × 24 = 23.040 biến, bài toán nặng hơn nhiều trong khi dữ liệu năng suất cá nhân chưa đủ tin cậy. MVP ưu tiên mô hình đúng và giải được.

**Hướng nâng cấp sau này:**  
Khi có time study theo worker, thêm `a_isw` với:

```text
a_isw <= x_is
a_isw <= y_sw
a_isw >= x_is + y_sw - 1
Load_s = Σ_i Σ_w t_iw × a_isw
```

**Code:** `backend/app/optimizer.py`, `backend/app/utils.py`, `backend/app/models.py`.  
**Nghiệm thu:** mô hình không có tích biến; sample solve trả nghiệm; test kiểm tra load = tổng planning SAM.

---

### P0-2. Ràng buộc máy có thể gây vô nghiệm không hợp lý

**Vấn đề:**  
`Σ_k m_sk <= 1` cộng với `x_is <= m_sk` khiến hai công đoạn khác loại máy không thể cùng station. Đây là giả định MVP, nhưng phải nói rõ. Ngoài ra, không được bắt công đoạn thủ công dùng máy giả `MANUAL`.

**Quyết định:**  
- MVP: **một station tối đa một loại máy**.
- Công đoạn thủ công: `machine_type = None`, không tiêu thụ máy, không sinh biến `m`.
- Công đoạn cần máy: `machine_type = OVERLOCK | COVERSTITCH | SINGLE | IRON | ...`.
- Máy có `available` và `capacity`; tổng station dùng loại máy không vượt capacity.
- Worker phải được chứng nhận loại máy mới được đứng station có máy đó.

**Hướng nâng cấp:**  
Cho phép một station nhiều máy theo từng operation, với biến `m_isw` hoặc `m_isk`, và kiểm soát capacity theo từng máy vật lý. Không làm trong MVP.

**Code:** `models.py` (`machine_type: str | None`), `validation.py`, `optimizer.py`, `sample_data.py`.  
**Nghiệm thu:** công đoạn thủ công không cần máy; hai loại máy khác nhau không cùng station; capacity được tôn trọng.

---

### P0-3. Chưa có quy tắc thứ tự công đoạn trong cùng station

**Vấn đề:**  
`station(pred) <= station(succ)` chỉ đảm bảo thứ tự giữa các station. Nếu A và B cùng station, cần biết A làm trước B.

**Quyết định:**  
- Dùng **Topological Sort** từ precedence DAG.
- Kiểm tra cycle trước khi giải.
- Sắp xếp operation trong station theo topological order.
- Ghi `sequence_in_station` vào assignment.
- Sau khi giải, chạy post-check: mọi precedence pair phải có `station(pred) <= station(succ)`; nếu cùng station thì thứ tự topo phải đúng.

**Code:** `validation._topological_order`, `optimizer._verify_solution`, `AssignedOperation.sequence_in_station`.  
**Nghiệm thu:** không có precedence violation; thứ tự trong station deterministic.

---

### P0-4. Lexicographic optimization phải là hai bước giải thật

**Vấn đề:**  
Ghi hai objective trong tài liệu không đủ. Cần giải tuần tự và xử lý timeout trung thực.

**Thuật toán:**

**Chế độ `min_bottleneck`:**

1. Giải stage 1: `min Cmax`.
2. Nếu stage 1 `OPTIMAL`, giữ `Cmax <= Cmax* + ε`, giải stage 2: `min Σ z_s`.
3. Chỉ trả `OPTIMAL` nếu cả hai stage `OPTIMAL`.
4. Nếu stage 1 `TIME_LIMIT` nhưng có nghiệm: stage 2 chỉ là best-effort; trả `FEASIBLE_LIMIT`, `lexicographic_proven = false`.
5. Nếu stage 1 không có nghiệm: `ERROR`.
6. Nếu stage 1 `INFEASIBLE`: `INFEASIBLE`.

**Chế độ `min_workers`:**

1. Giải stage 1: `min Σ z_s`, với ràng buộc cứng `Load_s <= effective_takt × z_s`.
2. Nếu `OPTIMAL`, giữ `Σ z_s <= HC*`, giải stage 2: `min Cmax`.
3. Chỉ trả `OPTIMAL` nếu cả hai stage `OPTIMAL`.

**Quy tắc trạng thái:**

| Tình huống | Status |
|---|---|
| Cả hai stage chứng minh tối ưu | `OPTIMAL` |
| Có nghiệm, stage 1 hoặc stage 2 timeout | `FEASIBLE_LIMIT` |
| Không có nghiệm do ràng buộc | `INFEASIBLE` |
| Lỗi dữ liệu | `INFEASIBLE` + `error_type=DATA` |
| Lỗi solver | `ERROR` |

**Code:** `optimizer.solve_line_balancing`, `RunMetadata.lexicographic_proven`.  
**Nghiệm thu:** không bao giờ trả `OPTIMAL` khi `lexicographic_proven=false`; metadata ghi stage objective.

---

### P0-5. Thiếu baseline để so sánh Before/After

**Vấn đề:**  
Roadmap cũ vừa nói "xuất phương án trước tối ưu" vừa loại heuristic fallback. Không có nguồn baseline rõ ràng.

**Quyết định:**  
- Baseline là **dữ liệu đầu vào**, không phải output của optimizer.
- Thêm `baseline_assignment` gồm `operation_id`, `station_id`, `worker_id`.
- Nếu có baseline đầy đủ: tính before/after cho station, worker, bottleneck, LBE, capacity, target achievement.
- Nếu baseline thiếu hoặc sai: hiển thị violation, không bịa số before.
- Nếu không có baseline: chỉ hiển thị optimized result; UI ghi "No baseline provided".
- Sample baseline là synthetic, ghi rõ "not an optimizer output".

**Code:** `baseline.py`, `models.BaselineAssignment`, `sample_data._baseline_from_layout`.  
**Nghiệm thu:** before/after có cùng đơn vị, cùng kỳ; baseline violation được liệt kê; không có baseline thì comparison = null.

---

### P0-6. Tránh tính trùng allowance và efficiency

**Vấn đề:**  
Công thức cũ trừ allowance khỏi thời gian khả dụng, sau đó lại dùng planned efficiency. Nếu SAM đã bao gồm allowance, năng lực bị tính thiếu hai lần.

**Quyết định — định nghĩa chuẩn:**

```text
Net available seconds = (shift_minutes - break_minutes) × 60
```

- Không trừ allowance ở đây.
- Không trừ efficiency ở đây.

```text
planning_sam_i = SAM_i × (1 + allowance_i)
```

- `allowance_i = 0` nếu `sam_basis = INCLUDES_ALLOWANCE` (mặc định).
- `allowance_i = allowance_pct` nếu `sam_basis = EXCLUDES_ALLOWANCE`.

```text
Takt time = Net available seconds / target_qty
Effective takt = Net available seconds × planned_efficiency / target_qty
```

```text
Capacity per shift = Net available seconds × planned_efficiency / bottleneck planning SAM
```

```text
Required HC = Period target × garment planning SAM minutes
              / (net shift minutes × working days × planned_efficiency)
```

**Quy tắc:** mỗi yếu tố chỉ xuất hiện một lần:
- Allowance: trong `planning_sam` hoặc không, tùy `sam_basis`.
- Efficiency: trong capacity và effective takt.
- Break: trong net available.
- SAM: trong planning SAM.

**Code:** `utils.py`, `kpis.py`, `planning.py`, `validation.py`.  
**Nghiệm thu:** hand calculation khớp; không có công thức nào vừa trừ allowance vừa nhân efficiency lên cùng một đại lượng.

---

## 3. Năm chức năng nghiệp vụ IE còn thiếu

### T09 — Time Study & SAM Validation `[~]`

**Mục tiêu:** Không chỉ dùng SAM từ TechPack, mà biết SAM hình thành và được phê duyệt thế nào.

**Model:** `TimeStudyRecord`, `TimeStudyResult`.

**Công thức:**

```text
Normal Time = Observed Time × Performance Rating
Standard Time = Normal Time × (1 + Allowance)
```

**Endpoint:** `POST /api/time-study/calculate`.

**Còn lại:** UI nhập liệu, lưu revision, so sánh approved SAM với SAM đang dùng.

---

### T10 — Layout Engineering & Workplace Design `[ ]`

**Quyết định:**  
- Process Flow Diagram ≠ Physical Layout.
- MVP chưa làm CAD.
- Phase 1.5: SVG 2D đơn giản, kéo thả station, hiển thị máy, đo khoảng cách, so sánh layout hiện tại/đề xuất.
- Không đưa vào critical path 8 ngày.

**Deliverable trước mắt:** case study layout + hình SVG minh họa.

---

### T11 — Daily Production Monitoring & Loss Time `[~]`

**Model:** `DailyProductionActual`, `DowntimeEvent`, `ActualsAnalysis`.

**Phân loại downtime:** `MACHINE`, `MATERIAL`, `MANPOWER`, `QUALITY`, `CHANGEOVER`, `OTHER`.

**Actual labor efficiency:**

```text
LE_actual = Actual output × garment SAM minutes / Actual direct labor minutes × 100%
```

- Chỉ tính khi có `actual_direct_labor_minutes`.
- Không dùng thời gian trôi qua của ca thay cho direct labor minutes.
- Output cấp chuyền không đủ để suy ra hiệu suất riêng từng công nhân.

**Còn lại:** UI nhập actuals/downtime, biểu đồ loss Pareto.

---

### T12 — Supervisor Approval & Manual Adjustment `[ ]`

**Quyết định:**  
Optimizer chỉ tạo **Proposed Assignment**. Không tự động áp dụng vào sản xuất.

**Workflow:**

```text
Optimizer → Proposed → IE Review → Supervisor Approval
          → Manual Adjustment (nếu cần) → Approved Plan
          → Actual vs Planned
```

**Cần lưu:** người chỉnh, lý do, thời điểm, constraint re-check, approved plan, so sánh actual/planned.

**MVP:** có thể chỉ lưu localStorage; chưa cần auth/Postgres.  
**Phase 1.5:** bảng approval + audit trail.

---

### T13 — Material Standardization `[ ]`

**Quyết định:** Chỉ làm case study, không làm module.

**Nội dung:** định mức chỉ, băng keo 3M, viền; standard vs actual consumption; material variance; waste reduction.

**Deliverable:** `docs/CASE_STUDY_MATERIAL.md`.

---

## 4. Sửa KPI

| KPI cũ | Vấn đề | KPI mới | Công thức |
|---|---|---|---|
| Labor Efficiency (planned) | `Total SAM / (Stations × Takt)` không phải labor efficiency thực tế | **Planned Labor Utilization at Takt** | `Total planning SAM / (workers used × takt) × 100` |
| Machine Allocation | Không có runtime để đo utilization | **Machine Capacity Coverage** | `Available machine capacity / required stations × 100` |
| Machine Allocation | Không có runtime | **Machine Demand Ratio** | `Required stations / available capacity × 100` |
| Machine Utilization | Thiếu runtime/downtime thật | **Roadmap only** | Chỉ tính khi có `MachineRuntime / PlannedProductionTime` |

**Actual Labor Efficiency** chỉ dùng khi có actual direct labor minutes:

```text
LE_actual = Actual output × Garment SAM minutes / Actual direct labor minutes × 100%
```

**Machine Utilization** chỉ dùng khi có runtime:

```text
MU = Machine runtime / Planned production time × 100%
```

**Quy tắc:** Không hiển thị Machine Utilization trong MVP. Không gọi machine allocation là machine utilization.

---

## 5. An toàn hệ thống khi deploy public

| Hạng mục | Quyết định | Trạng thái |
|---|---|---|
| Request validation | Max 200 operations, 100 workers, 200 machines | `[~]` |
| File upload | Chưa mở upload server; import CSV/Excel xử lý ở frontend | `[ ]` |
| Rate limiting | 60 request/phút/IP, cấu hình env | `[~]` |
| Solver timeout | Max 60s; sample 40 ops dùng 60s để prove cả 2 stage; 20s có thể trả `FEASIBLE_LIMIT` | `[~]` |
| Concurrent requests | Semaphore 2 solver cùng lúc | `[~]` |
| Database security | Public demo không mở API ghi/xóa scenario; dùng localStorage | `[~]` |
| Error logging | Log lỗi API/solver, không trả stack trace | `[~]` |
| Data privacy | Chỉ synthetic, không tên/lương/dữ liệu thật | `[x]` |

**Quyết định:** Public demo dùng **localStorage** cho scenario cá nhân. Postgres chỉ bật khi có môi trường riêng và `SCENARIO_PERSISTENCE=postgres`, không mở công khai.

---

## 6. Tái lập và truy vết kết quả

Mỗi lần chạy phải có `RunMetadata`:

| Field | Mục đích |
|---|---|
| `run_id` | Mã lần chạy |
| `data_version` | Hash 12 ký tự của input |
| `model_version` | `MILP-SAM-v2.0` |
| `solver_version` | `PuLP 4.2.0 / HiGHS 1.15.1` (CBC chỉ là fallback tùy chọn) |
| `objective` | `min_bottleneck` hoặc `min_workers` |
| `input_hash` | SHA-256 canonical JSON |
| `solver_status` | Trạng thái solver (HiGHS mặc định) |
| `solve_time_sec` | Thời gian giải |
| `created_at` | Thời điểm chạy |
| `lexicographic_proven` | Có chứng minh tối ưu hai bước không |
| `stage1_objective` | Giá trị stage 1 |
| `stage2_objective` | Giá trị stage 2 |

**Quy tắc:** Khi SAM thay đổi, `input_hash` đổi; kết quả cũ không bị trộn với dữ liệu mới.

---

## 7. Chuẩn bị phỏng vấn

### 7.1. Năm tình huống

| Case | Nội dung | Điểm cần thể hiện |
|---|---|---|
| 1. Bottleneck | Chuyền không đạt target | Đọc workload, xác định bottleneck, phân tích nguyên nhân, hành động |
| 2. Manpower shortage | Thiếu người ở công đoạn quan trọng | Skill matrix, điều chuyển, cross-training, ưu tiên công đoạn |
| 3. New style | Nhận mã hàng mới | Routing, SAM, machine, skill, readiness checklist, trial |
| 4. Quality problem | Tỷ lệ lỗi tăng | Pareto, fishbone 4M, corrective action, before/after |
| 5. Line moving | Chuyển mã hàng sang chuyền khác | Máy, người, layout, changeover, kế hoạch chuyển |

### 7.2. Thuật ngữ tiếng Anh cần giải thích

- Standard Minute Value (SMV/SAM)
- Takt Time
- Cycle Time
- Line Balancing
- Standard Headcount
- Production Efficiency
- Bottleneck
- Manpower Planning
- Changeover Time
- Continuous Improvement

**Deliverable:** `docs/INTERVIEW_PREP.md` (chưa tạo).

---

## 8. Backlog T09–T16

| Task | Nội dung | Ưu tiên | Trạng thái |
|---|---|---|---|
| T09 | Time Study & SAM Validation | P1 | `[~]` |
| T10 | Layout Engineering & Workplace Design | P1 | `[ ]` |
| T11 | Actual Production & Loss Time Monitoring | P1 | `[~]` |
| T12 | Supervisor Approval & Manual Adjustment | P1 | `[ ]` |
| T13 | Material Standardization Case Study | P2 | `[ ]` |
| T14 | Optimization Audit & Reproducibility | P1 | `[~]` |
| T15 | API Security & Resource Protection | P0 | `[~]` |
| T16 | Interview Case & English Preparation | P1 | `[ ]` |

---

## 9. Kế hoạch 8 ngày đã điều chỉnh

| Ngày | Việc chính | Gate |
|---|---|---|
| **Day 0–1** | Sửa P0: MILP SAM, machine, precedence, lexicographic, baseline, time basis | Sample solve có nghiệm, test core pass |
| **Day 1** | T01: CSV/Excel, data dictionary, validation | Import 40/24/23 pass |
| **Day 2** | T02: MODEL.md, optimizer tests, benchmark nhỏ | Hand-check khớp |
| **Day 3** | T02: solver ổn định, status, baseline before/after | 50 ops / 25 workers có kết quả |
| **Day 4** | T03 + T04: capacity, HC, skill coverage | Công thức khớp tay |
| **Day 5** | T05: KPI dashboard, workload, bottleneck, export | KPI khớp backend |
| **Day 6** | T06: new style, readiness, process flow | **MVP gate** |
| **Day 7** | Deploy Netlify + Render + security smoke test | Public URL + health 200 |
| **Day 8** | T07/T08 case study, T09/T10/T12 docs, interview prep | Demo 7 phút |

**Cut lines nếu trễ:**

1. Layout SVG → chỉ case study.
2. Approval workflow → chỉ data model + mô tả.
3. Material case study → báo cáo ngắn.
4. Process flow nâng cao → chỉ readiness checklist.
5. Transfer suggestion → giữ skill coverage.

**Không cắt:**

- MILP correctness.
- Validation.
- Baseline before/after.
- Test core constraints.
- Public URL.
- Export.
- README/benchmark.

---

## 10. Trạng thái kỹ thuật hiện tại

### 10.1. Cập nhật solver — 2026-11-02

**Kết luận ngắn:** Công thức MILP đã đúng. Vấn đề còn lại là **solver backend, warm start và baseline**, không phải mô hình.

#### Kết quả đo với HiGHS 1.15.1 / PuLP 4.2.0

| Kịch bản | Workers | Trạng thái | Bottleneck | Stations | Capacity @85% | Kết quả target |
|---|---:|---|---:|---:|---:|---|
| A — stretch 420 | 24 | `OPTIMAL` | 58.0s | 23 | 395.7 | Không đạt 420 |
| B — feasible 400 | 26 available / 25 used | `OPTIMAL` | 56.0s | 25 | 409.8 | Đạt 400 |
| Thêm 3 worker (exploratory) | 27 | `OPTIMAL` | 56.0s | 27 | 409.8 | Không đạt 420 |
| Thêm 4 worker | 28 | `TIME_LIMIT` (56.0) | 56.0s | 27 | 409.8 | Không đạt 420 |
| Thêm 5–6 worker | 29–30 | Chưa kết luận | — | — | — | Chưa chứng minh |

- 24-worker optimum **58.0s** được chứng minh trong **~19.5s** khi có greedy warm start.
- 26-worker optimum **56.0s** được chứng minh trong **~41.5s**.
- Target 420 cần bottleneck **≤54.64s**. Với 24 worker, đây là **không khả thi**; 58.0s là optimum thật, không phải timeout.
- 29–30 worker: greedy tìm được layout 28 station / 54.0s nhưng warm start bị lỗi station-index gap và HiGHS trả nghiệm kém hơn. Cần compact index rồi test lại. **Không claim 420 khả thi cho đến khi có test.**

#### Quyết định solver

- **Chuyển solver chính sang HiGHS** (`pulp.HiGHS`, `highspy==1.15.1`).
- Lý do: CBC trong một test với `timeLimit=20` chạy **920s** và không trả nghiệm; HiGHS tôn trọng time limit và chứng minh được optimum.
- Giữ PuLP làm modeling layer; kiến trúc A không đổi.
- CBC chỉ là fallback tùy chọn qua env `SOLVER_BACKEND=cbc`, không dùng mặc định.
- Cần thêm `highspy==1.15.1` vào `backend/requirements.txt`; kiểm tra wheel Linux/Python 3.12 trên Render.
- `solver_version` trong metadata đổi thành `PuLP 4.2.0 / HiGHS 1.15.1`.

#### Quyết định warm start

- Không dùng baseline 10-station làm MIP start.
- Dùng **greedy list-scheduling** theo topological order:
  - tôn trọng skill, machine, precedence;
  - thử target load = effective takt, 56, 58, 62;
  - compact station index về `1..n` trước khi set initial value;
  - chọn layout có max load nhỏ nhất.
- Warm start chỉ là MIP start; kết quả cuối vẫn từ MILP, status vẫn honest.
- Đã test: 24 worker → warm start 58.0s, HiGHS chứng minh `OPTIMAL` 58.0s trong 19.5s; 26 worker → warm start 58.0s, HiGHS chứng minh `OPTIMAL` 56.0s trong 41.5s.

#### Baseline hiện trạng — đã rebuild

- Baseline hiện tại: **24 station / 24 worker / 61.0s**, build bằng first-fit với `target_sec=60`, `max_stations=24`.
- Baseline là **input**, không phải output optimizer; label rõ là synthetic current-state, không phải HBI thật.
- Before/after scenario A: 24→23 station, 24→23 worker, bottleneck 61.0→58.0s, LBE 72.34%→79.39%, capacity 376.2→395.7 pcs/shift, target 420 achievement 89.58%→94.21%.
- Baseline không vi phạm precedence/skill/machine trong lần chạy này.

#### Quyết định target mẫu — đã chốt

- **Làm cả hai scenario**, không chọn một:
  1. **Scenario A — Current/Stretch 420:** 24 worker, target 420. Kết quả `OPTIMAL` 58.0s, capacity 395.7. UI ghi rõ **không đạt target** và đề xuất manpower/cross-training.
  2. **Scenario B — Feasible 400:** 26 worker, target 400. Kết quả `OPTIMAL` 56.0s, capacity 409.8. UI ghi rõ **đạt target** và so sánh với Scenario A.
- Cả hai dùng cùng routing, SAM, máy, skill matrix; chỉ khác headcount và target.
- Không được tự đổi target mà không ghi lý do. Mọi số liệu phải lấy từ lần chạy thật, không hard-code trong UI.
- UI phải hiển thị rõ đây là **synthetic demo data**, không phải dữ liệu HBI thật.

#### Việc còn lại (P0)

- [x] Thêm `highspy==1.15.1`; đổi `_solve` sang HiGHS; test status/time limit.
- [x] Implement greedy warm start + compact station index.
- [x] Rebuild sample baseline 24/24/61.0s.
- [x] Chạy lại sample 24/26 worker; ghi kết quả thật vào checklist.
- [x] Test lexicographic 2 stage với HiGHS (manual run).
- [x] Tạo `KPI_SPEC.md`; `[ ]` `DATA_DICTIONARY.md`, `SECURITY.md`.
- [x] Sửa `requirements.txt`, `render.yaml`, `DEPLOYMENT.md`.
- [ ] pytest core + API security.

### 10.2. Đã sửa trong code

- `models.py`: `machine_type=None`, baseline, actuals, downtime, metadata, time study, KPI mới.
- `utils.py`: SAM/allowance/efficiency một lần; bỏ `effective_time`.
- `validation.py`: eligibility theo skill + machine; topological order; lower bounds theo planning SAM.
- `kpis.py`: planned labor utilization, LBE, capacity, smoothness; bỏ skill-adjusted KPI.
- `baseline.py`: before/after comparison + violations.
- `actuals.py`: actual LE + downtime by category.
- `planning.py`: required HC/capacity theo planning SAM; machine coverage/demand ratio.
- `optimizer.py`: load tuyến tính theo SAM; machine constraints; lexicographic hai stage; post-check.
- `main.py`: giới hạn request, rate limit, concurrency, security headers, time study endpoint, tắt scenario API public.
- `excel.py`: export KPI/baseline/actuals/metadata mới.

### 10.3. Đã hoàn thành

`[x]` P0-1 và P0-4 đã đạt các điều kiện:

1. `[x]` API dùng HiGHS thay CBC và trả đúng status.
2. `[x]` Greedy warm start + compact index được implement trong optimizer.
3. `[x]` Sample 24 worker trả `OPTIMAL` 58.0s trong ≤60s; nếu đặt 20s thì chấp nhận `FEASIBLE_LIMIT`.
4. `[x]` Sample 26 available / 25 used, target 400, trả `OPTIMAL` 56.0s trong ≤60s.
5. `[x]` Test core constraints pass (25 pytest).

**Không được ghi “OPTIMAL” nếu `lexicographic_proven=false`.**

---

## 11. Definition of Done cho đợt sửa này

- [x] 24-worker sample được chứng minh `OPTIMAL` 58.0s bằng HiGHS + greedy warm start.
- [x] API dùng HiGHS thay CBC; `solver_version` ghi đúng.
- [x] Greedy warm start + compact station index được implement trong `optimizer.py`.
- [x] Sample 40 ops / 24 workers trả `OPTIMAL` 58.0s trong ≤60s; nếu đặt 20s thì chấp nhận `FEASIBLE_LIMIT`.
- [x] Sample 26 worker trả `OPTIMAL` 56.0s trong ≤60s.
- [x] Tất cả operation được gán đúng một station (pytest optimizer).
- [x] Không worker nào ở hai station (pytest optimizer).
- [x] Không vi phạm precedence/skill/machine (pytest optimizer).
- [x] Load station = tổng planning SAM (pytest optimizer).
- [x] Baseline before/after khớp hand calculation; baseline 24/24/61.0 đã được dùng cho A/B, không vi phạm.
- [x] KPI khớp `KPI_SPEC.md` (pytest KPI/actuals/baseline).
- [ ] API trả đúng 4 status: `OPTIMAL`, `FEASIBLE_LIMIT`, `INFEASIBLE`, `ERROR`.
- [~] Body limit/rate limit đã test; concurrency chưa test tự động.
- [ ] Export XLSX mở được.
- [~] `KPI_SPEC.md` đã tạo; `MODEL.md` cần rà lại; `DATA_DICTIONARY.md`, `SECURITY.md` chưa có.
- [x] Quyết định target 420 vs 400 được ghi rõ trong `KPI_SPEC.md`, `ROADMAP.md`, `CHECKLIST.md`; UI đã có selector A/B và target card.
- [x] T07 Quality RCA case study: DMAIC + fishbone + 5 Why + before/after + Control Plan.
- [x] T08 Kaizen case study: A3 + before/after + estimated/verified saving + Control Plan.

---

> **Kết luận:** Các điểm review đã được ghi lại đầy đủ, kèm kết quả đo solver mới nhất. API đã dùng HiGHS, warm start đã có, baseline đã rebuild 24/24/61.0s, A/B đã rerun, `KPI_SPEC.md` đã tạo và 25 pytest đã pass; frontend tối thiểu đã build. Ưu tiên tiếp theo: deploy public + acceptance. Không được claim `OPTIMAL` nếu chưa chứng minh cả hai stage lexicographic.
