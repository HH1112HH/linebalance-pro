# LineBalance Pro — Review Checklist & Decision Log

> **Phiên bản:** 1.3  
> **Ngày:** 2026-11-02  
> **Cập nhật lần cuối:** 2026-11-08 — Phase 1 T06, Phase 2 usage-variance, Phase 3.1–3.4 import, Phase 4.1–4.6 (PostgreSQL/Neon, private + demo-auth scenario API, frontend server scenarios) đã triển khai; verify + smoke pass. Public deployment và least-privilege DB role vẫn chưa làm.
>
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

> **Ghi chú lịch sử:** scope freeze nêu trên được người dùng cho phép mở rộng theo phase ngày 2026-11-08; xem decision log §12. Entry mới nhất tại §12 ưu tiên khi có mâu thuẫn.

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

---

## 12. Nhật ký quyết định

### 2026-11-02 — Đóng gói repo công khai

- Chọn giấy phép **MIT** (`LICENSE`); copyright ghi theo tài khoản GitHub `HH1112HH`.
- Thêm `SECURITY.md`: kênh báo lỗi qua GitHub private advisory, scope, control hiện có và data policy synthetic.
- Thêm `CONTRIBUTING.md`: setup local, quality gate `scripts/verify.ps1`, quy ước commit và checklist PR.
- Giữ nguyên phạm vi demo: không thêm auth, database, multi-plant hoặc dữ liệu thật.
- Không đổi semantics KPI/MILP; `v0.2.0` vẫn là release tính năng, các tài liệu mới nằm trên `main`.

### 2026-11-02 — Bổ sung Six Sigma metrics cho T07 (docs-only)

- Thêm DPMO, Z-benchmark, two-proportion z-test và p-chart vào `docs/CASE_STUDY_QUALITY_RCA.md` §6A và playbook §6.5.1.
- Kết quả chạy lại từ CSV: DPMO **24,725 → 9,890**; Z-benchmark **3.47 → 3.83**; z = **3.43**, p ≈ **0.0006** (2 phía), 95% CI **0.64–2.33 điểm %**; p-chart không có điểm ngoài limit (5 điểm/giai đoạn).
- Giả định: 1 cơ hội/áo, inspection độc lập, dữ liệu synthetic, không cộng 1.5σ shift; không claim production significance hoặc “Six Sigma certified”.
- Phạm vi: chỉ docs/case study; không thêm API, model hoặc test code. `KPI_SPEC.md` §12A ghi công thức docs-only, không thay đổi KPI contract.
- Lý do: Module 4 cần phần Six Sigma định lượng; case study trước đây chỉ có defect rate/FPY, chưa có DPMO/sigma/test.

### 2026-11-02 — Chạy Module 5 / T08 Kaizen A3

- Verify T08 từ `sample_result_A_stretch_420.json` và `docs/data/kaizen_cost_model.csv`: baseline **24/24/61.0s**; after **23/23/58.0s**; LBE **72.34 → 79.39%**; capacity **376.2 → 395.7 pcs/shift**; target 420 achievement **94.21%**; estimated saving **11.7M VND/month**; payback **1.03 tháng**.
- Sửa README benchmark scenario A thành **“23 used (24 available)”** để khớp `workers_used = 23` trong sample result.
- Sửa unit labor cost reduction từ **8.89% → 8.88%** (2.55 / 28.71) để khớp số làm tròn.
- Thêm **§7.6 Sensitivity** vào case study: payback **0.88–1.23 tháng** khi rate 50–70k VND/h và 22–26 ngày; break-even rate **61,538 VND/h**; break-even **26.67 ngày**; không redeploy → cash saving = 0.
- Cập nhật A3 Results ghi cả **estimated** và **synthetic verified 22 ngày** (9.9M, net −2.1M), không chỉ con số estimated.
- Phạm vi docs-only; không đổi API/MILP/KPI contract.

### 2026-11-02 — Chạy Module 6 / OEE & Downtime (docs-only, synthetic)

- Thêm `docs/data/oee_machine_log.csv`: log synthetic 8 bucket cho máy `PRESS-01` (IRON), ca 2026-10-27, ideal cycle 40.0 s/pc, planned 450 phút, ghi rõ `SYNTHETIC`.
- Kết quả tính lại từ CSV: Availability **85.56%**, Performance **87.79%**, Quality **97.24%**, OEE **73.04%**; đồng nhất thức theo thời gian khớp 450.00 phút (valuable 328.67 + quality 9.33 + performance 47.00 + downtime 65.00).
- Loss lớn nhất: changeover 40 phút (61.5% downtime), breakdown 25 phút (38.5%); performance loss 47 phút trong đó minor stop 23 phút đo được và 24 phút speed/hesitation chưa tách.
- Quyết định: ideal cycle lấy từ spec/element máy, **không dùng SAM**; minor stop thuộc P; `MATERIAL`/`MANPOWER` không tính vào OEE máy.
- Quyết định: OEE chỉ áp dụng cho máy là pacer. Station thủ công (ví dụ OP060 trong Module 1: máy 20 s, station 45 s, tỉ lệ 44.44%) bị đánh dấu `N/A`, không tính OEE.
- Ghi rõ giới hạn: giả định máy là pacer chưa được time study xác nhận; chưa có API OEE (vẫn `N/A` trong phần mềm).
- Phạm vi: chỉ docs/CSV; không thay đổi backend, API, `types.ts` hay KPI đã triển khai. `KPI_SPEC.md` §12.1 ghi công thức docs-only.

### 2026-11-02 — Chạy Module 8 / SMED & Changeover (docs-only, synthetic)

- Thêm `docs/data/smed_changeover_study.csv`: 5 lần changeover BEFORE (2026-10-19 → 10-23) và 5 lần AFTER pilot (2026-11-02 → 11-06) cho `PRESS-01`, ghi rõ `SYNTHETIC`.
- Kết quả tính lại từ CSV: thời gian dừng/lần từ **1500 s (25.00 phút)** xuống **505 s (8.42 phút)**, giảm 995 s (**66.3%**); việc external làm khi máy dừng 270 s → 0; external khi máy chạy 510 s; tổng công lao động 1500 s → 1015 s (−32.3%).
- Waterfall: 1500 → 1230 (tách I/E) → 1000 (chuyển I → E) → 505 (tối ưu I); khớp tổng từng element.
- Tác động OEE giả định (P và Q giữ nguyên): Availability **85.56% → 89.24%**, OEE **73.04% → 76.18%** (+3.1 pp); downtime còn lại breakdown 51.6%, changeover 48.4%.
- Quyết định: external work vẫn tính vào công lao động; không gọi là miễn phí. Thời gian tiết kiệm không tự thành sản lượng; kiểm tra nhu cầu trước (Module 3). Không quy đổi tiền (Module 5).
- Quyết định: changeover chỉ đưa vào OEE khi đo theo mốc last good → first good. Changeover 08:00 (15 phút) là ứng viên SMED tiếp theo.
- Giới hạn: 5 lần mỗi giai đoạn, chưa có video thật; giảm E02/E07 phụ thuộc bệ làm nóng phụ chưa được EHS/Maintenance xác nhận.
- Phạm vi: chỉ docs/CSV; không thêm changeover API, backend hay `types.ts`. `KPI_SPEC.md` §12.2 ghi định nghĩa docs-only.

### 2026-11-02 — Chạy Module 7 / Layout & Ergonomics (docs-only, synthetic)

- Bổ sung `docs/CASE_STUDY_LAYOUT_ERGONOMICS.md`, `docs/layout_study_before_after.svg` và `docs/data/layout_route_observations.csv`; cập nhật playbook §9.1–9.12 và link trong README.
- Dùng baseline Module 3 tại ST01 (3 trips/shift × 6 operator-min = 18 operator-min) và 5 route trials synthetic mỗi giai đoạn.
- Kết quả case: round trip **43.6 → 12.8 m**; time/trip **6.0 → 2.0 phút**; với 3 trips/shift, distance **130.8 → 38.4 m** (−70.64%), operator travel **18 → 6 operator-min** (−66.67%), shared-aisle crossings **6 → 0**.
- Quyết định: đề xuất line-side two-bin POU + scheduled milk run, giữ nguyên station/routing/WIP cap; không kết luận cần U-shape hoặc re-layout toàn line.
- Giới hạn: handler replenishment time, tote mass/force, EHS clearance, ergonomics thật và production pilot chưa đo; **không claim net labor/cash saving hoặc safety/output improvement**.
- Ghi định nghĩa transport route (m và operator-minutes, không cộng chéo) trong `KPI_SPEC.md` §11; docs-only, không phải KPI API.
- Phạm vi docs-only; không đổi KPI API, backend, `types.ts`, CAD hay feature software. Checklist lịch sử ở CHECKLIST §1 item 10 được giữ nguyên; trạng thái cập nhật ghi tại entry này.

### 2026-11-02 — Hoàn thiện Module 9–10 (docs-only)

- Module 9: thay outline bằng stakeholder responsibilities, RACI mẫu (mỗi dòng một A), decision boundary, operating rhythm, escalation/handover template và Red case lúc 12:00 từ hourly synthetic. Ghi rõ site SOP/authority matrix được ưu tiên.
- Giữ 25 phút category `MACHINE` tách khỏi 15 phút category `MATERIAL`; common line-stop basis chưa xác nhận nên không cộng thành 40 line-min.
- Module 10: tạo `docs/INTERVIEW_PREP.md` với intro 60 giây, 5 STAR case tiếng Anh, cross-functional answer, technical follow-ups, glossary, portfolio demo 7 phút và honesty checklist.
- Cập nhật playbook §1, §2, §11–§13 và Appendix B; thêm link interview guide vào README.
- Quy tắc: mọi kết quả project đều synthetic; hypothetical answer dùng “I would”; không claim HBI production experience, public deployment, OEE, saving hoặc target achievement nếu chưa có evidence thật.
- Phạm vi docs-only; không thêm API/backend/UI. Module 9 RACI cần xác nhận theo site thật; Module 10 cần cá nhân hóa bằng CV/kinh nghiệm thật trước phỏng vấn.

### 2026-11-06 — Cockpit UI 6 mục (UI-only)

- Chuyển dashboard một trang dài thành cockpit 6 mục: Overview, Line balance, Capacity & people, Actuals, Time study, Solver & data; sidebar tối + topbar scenario/API/export/re-run.
- Overview chỉ giữ 4 KPI, takt vs bottleneck, target health và top 5 station load; assignment map đầy đủ chuyển sang Line balance với 3 tab Station loads / Assignment map / Before / after.
- Actuals gộp form production + downtime thành tab; Time study tách màn riêng, giữ guide 4 bước; Solver & data gộp metadata, snapshot localStorage và policy strip.
- Thuần presentation: không đổi API, Pydantic schema, `types.ts` contract, KPI/MILP semantics hay sample data. Mọi số vẫn lấy từ `result`, `data.ts` hoặc API; nhãn synthetic giữ nguyên.
- Design system: Manrope + IBM Plex Mono, emerald accent, card 12–16px; breakpoint 1240/1100/1024/900/720/520/390; không thêm thư viện UI.
- Kiểm chứng: 1440×900 Overview vừa một màn hình (scrollHeight 900); 390×900 không tràn ngang (scrollWidth 390); tab/form/snapshot save-load-delete chạy; console không lỗi.
- `scripts/verify.ps1` pass: 26 pytest, coverage 85.74%, ruff/mypy/eslint/prettier/tsc/Vite build. Ảnh: `frontend_screenshot.png`, `frontend_mobile.png`.
- Lighthouse snapshot desktop: Accessibility **100**, Best Practices **100**, SEO **100**; sửa contrast của muted text/nav accessible name và thêm `frontend/public/robots.txt`.
- Còn chờ: public deploy Render/Netlify, benchmark 50 ops / 25 workers, xác nhận site cho Module 6–9. Snapshot vẫn chỉ lưu trong browser.

### 2026-11-06 — Bilingual industrial analysis dashboard (UI-only)

- Thêm nút EN/VI có lưu lựa chọn trong browser; dịch navigation, topbar, KPI, workload, planning, actuals, time study, solver và snapshot.
- Nâng Overview thành cockpit phân tích: KPI từ response hiện có, actual output chỉ khi có `actuals_analysis`, takt/target health, Yamazumi top stations và bottleneck review.
- Line balance giữ tabs hiện tại; assignment table có tìm kiếm, lọc status và sắp xếp theo cột. Workload chart hiển thị trục giây, effective/demand takt, tooltip và legend.
- Bổ sung run-input summary; XLSX tiếp tục dùng endpoint hiện có. Không thêm chart/UI library, API field hoặc KPI công thức mới.
- Giao diện dùng primary blue cùng màu trạng thái xanh/vàng/đỏ. Bỏ giới hạn chiều cao/scroll dọc lồng ở chart, table và danh sách; căn đều Takt/Target; Solver & data hết khoảng trống do flex fill.
- Vì sample/API chỉ có một line/shift và không có lịch sử theo ngày, line/shift là ngữ cảnh cố định và lọc date-range được ghi rõ là chưa khả dụng; không sinh mock time series.
- Mọi số trong dashboard vẫn lấy từ `result`, `request` hoặc sample data tổng hợp; không đổi KPI/MILP/API semantics. Kiểm tra desktop 1440px, tablet 768/1024px, mobile 390px; tìm kiếm/lọc/sort station chạy, không tràn ngang.
- Kiểm tra: `scripts/verify.ps1` pass — 26 pytest, coverage 85.74%, Ruff/mypy, ESLint, Prettier, TypeScript và Vite build; `git diff --check` pass. Ảnh desktop: `frontend_dashboard.png`; EN/VI, scenario A/B, actuals/time study/solver và table search/filter/sort đã smoke-test trên browser.

### 2026-11-06 — Blue/indigo palette refinement (UI-only)

- Theo phản hồi giao diện, bỏ accent xanh lá/lime và nền sidebar xanh rêu; chuyển positive/optimal/normal sang xanh chàm, sidebar navy, giữ amber cho watch và đỏ cho bottleneck/error, slate cho underutilized.
- Áp dụng hướng review `critique → colorize → audit → polish` của Impeccable cho dashboard hiện có; giữ typography/layout đã thống nhất, không thêm gradient màu sặc sỡ hoặc thư viện.
- Chỉ đổi presentation tokens/màu; không đổi trạng thái, công thức KPI, dữ liệu, API hoặc semantics. Contrast/focus/responsive được kiểm tra lại cùng quality gate.
- Contrast tính được: primary #1E40AF/white **8.72:1**, positive-dark #334691/positive-soft #EDF1FF **7.68:1**, amber #8A5A0D/amber-soft #FDF4E3 **5.42:1**, red #9F3A24/red-soft #FBEAE5 **5.80:1**. Ảnh cập nhật: `frontend_dashboard.png`, `frontend_dashboard_mobile.png`.
- Sau đổi palette, `scripts/verify.ps1` pass: 26 pytest, coverage 85.74%, Ruff/mypy, ESLint, Prettier, TypeScript và Vite build; `git diff --check` pass. Browser console sạch; 390/768/1024/1440px không tràn ngang.

### 2026-11-06 — Chuẩn hóa EN/VI và thuật ngữ IE (UI-only)

- Rà soát cả 6 mục ở chế độ EN và VI; mỗi chế độ dùng một ngôn ngữ, chỉ giữ tên riêng/mã kỹ thuật. Không còn nhãn, trạng thái, warning, ghi chú actuals hoặc thông báo lỗi tiếng Anh trong VI.
- Thuật ngữ VI đã chốt: Solver → **Tối ưu hóa**; Takt → **nhịp**; allowance → **phụ cấp thời gian**; baseline → **hiện trạng**; Yamazumi → **biểu đồ tải trạm**; SAM → **định mức**; Excel → **bảng tính**. Giữ nguyên `LineBalance`, `ST09`, `OP100`, `W14`, `SHIFT_01`, `BASIC-TEE-001`, `HBI`, `PuLP`, `HiGHS`, `MILP-SAM-v2.0`.
- Dịch ở client các chuỗi lấy từ API: trạng thái tối ưu, data policy, warning theo `code`, actuals notes, machine type, tên chuyền/ca/công đoạn mẫu và lỗi API. Thêm helper hiển thị solver để giữ đúng tên **HiGHS** thay vì `HIGHS`.
- Sửa footnote `standard_utilization_pct` ở cả EN/VI: tải trạm chia **nhịp hiệu dụng**, không phải tải nút cổ chai; thống nhất với `KPI_SPEC.md`.
- Thuần presentation: không đổi API, Pydantic schema, `types.ts`, KPI/MILP semantics hay sample data.
- Kiểm chứng: `scripts/verify.ps1` pass — 26 pytest, coverage 85.74%, Ruff/mypy, ESLint, Prettier, TypeScript, Vite build; `git diff --check` pass. Browser 1440/1024/768/390px không tràn ngang; console không lỗi; đã thử 6 mục, form actuals, time study, warning details, snapshot save/load/delete và error state ở cả EN/VI.
- Ảnh cập nhật theo giao diện EN mới: `frontend_dashboard.png`, `frontend_dashboard_mobile.png`.

### 2026-11-08 — Light analytics UI, mobile before/after table, localized XLSX export

- Đổi dashboard sang hệ **light analytics**: nền sáng, chữ gần đen, xanh dương đậm làm màu chính, sidebar sáng; amber/red chỉ dùng cho cảnh báo. Font VI dùng **Lexend** (EN giữ **Manrope**), giữ **IBM Plex Mono** cho nhãn/số; tăng cỡ chữ nhãn nhỏ và kiểm tra contrast WCAG 4.5:1.
- Mobile ≤520px: bảng **Trước / sau** chuyển từ bảng ngang bị cắt sang dạng card xếp dọc, mỗi chỉ số có nhãn + Hiện trạng/Tối ưu/Chênh lệch; loại bỏ tràn ngang và không cần vuốt ngang. Sửa cột tải trạm để "48.0 giây" không bị wrap; cho giá trị nhịp xuống dòng thay vì ellipsis.
- XLSX export nhận `language: "en" | "vi"` theo UI (mặc định `en`), localize tên sheet, tiêu đề, header, nhãn KPI, trạng thái, severity, nhóm downtime, warning và ghi chú; tên file có hậu tố `_en`/`_vi`. Thêm test VI export và test parity bảng dịch.
- Lỗi backend không chạy: HTTP 5xx rỗng được map sang thông báo "không kết nối được dịch vụ tối ưu hóa" thay vì lỗi chung.
- Thuần presentation + export contract; không đổi KPI/MILP semantics, sample data hay công thức.
- Kiểm chứng: `scripts/verify.ps1` pass — 30 pytest, coverage 85.04%, Ruff/mypy, ESLint, Prettier, TypeScript, Vite build. Browser 360/390/768/1024/1440px không tràn ngang; console sạch; export VI trả sheet `Tổng quan/Phân công/Tải trạm/Kỹ năng CN/Trước sau/Thực tế/Cảnh báo`, export EN giữ nguyên.

### 2026-11-08 — Benchmark 50 operations / 25 workers

- Thêm `benchmarks/build_cases.py`, `benchmarks/run_benchmark.py` và 3 fixture synthetic 50 operations × 25 workers; kết quả chính thức lưu tại `benchmarks/results/local_2026-11-06.json`.
- Kết quả một lần chạy local (Windows, Python 3.14.3, PuLP 4.2.0/HiGHS 1.15.1, 60s): `balanced_50x25` — `OPTIMAL`, bottleneck 50.0s, capacity 459.0, solve 1.339s; `extended_50x25` — `OPTIMAL`, bottleneck 64.0s, capacity 358.6, solve 26.313s; `stress_50x25` — `FEASIBLE_LIMIT` / `TIME_LIMIT`, incumbent 64.0s, solve 60.213s, `lexicographic_proven=false` (**không phải optimal**).
- `scripts/verify.ps1` và CI lint/format cả `benchmarks/`; `benchmarks/RESULTS.md` ghi protocol, cách đọc stage objective và caveat single-run/Python version.
- Không dùng số benchmark làm cam kết production; deploy target vẫn là Python 3.12 và cần chạy lại trên môi trường gần production nếu muốn trích dẫn trong CV.

### 2026-11-08 — Rà soát dữ liệu/tài liệu theo JD HBI (docs/data-only)

- Sửa `docs/data/kaizen_cost_model.csv`: tách `ASSUMPTION` (labor rate, 7.5 giờ/ca, 26 ngày/tháng) khỏi cột tiền; paid hours/working days để trống `unit_cost_vnd`/`total_vnd`, labor rate chỉ có `unit_cost_vnd`. Dòng `IMPLEMENTATION` vẫn cộng đúng **12,000,000 VND**. Trước đó các giả định 7.5/26 bị đặt vào cột VND, làm sai bản chất dữ liệu.
- Thêm `docs/data/quality_inspection_summary.csv`: 5 ngày × 364 pcs/giai đoạn = **1,820 pcs**; BEFORE **45 defect / 135 rework min**, AFTER **18 / 54**. Đây là mẫu số còn thiếu cho defect rate/FPY; `quality_defects.csv` chỉ có tử số theo defect type.
- Thêm `docs/data/material_consumption.csv` và `docs/CASE_STUDY_MATERIAL_STANDARD.md` cho **T13 material standardization**: chỉ 45.0→46.8→45.9 m/pc; băng keo 0.35→0.38→0.36; viền 0.60→0.66→0.62; 1,820 pcs/giai đoạn. Standard cost **22,222,200 VND**; actual BEFORE **23,205,000**; AFTER **22,686,300**; excess giảm **518,700 VND (52.8%)**. Đây là case study docs-only, không phải module phần mềm; actual vẫn cao hơn định mức nên không claim “đạt định mức” hay cash saving.
- Thêm `DATA_DICTIONARY.md`: request/response models, API endpoints thực tế, grain/unit của `docs/data`, quy tắc data-quality và danh sách tính năng chưa có (import CSV/Excel, PostgreSQL, readiness/process flow, OEE API, protection pay).
- Sửa `README.md`: bỏ câu “not dated production history” vì sample có 5 daily actual records (2026-10-26 → 2026-10-30); ghi rõ đây là demo data, không phải production history. Thêm link `DATA_DICTIONARY.md` và material case; ghi public demo **chưa live**.
- Sửa `ROADMAP.md`: hạ các claim chưa đúng — T06 New Style/readiness/process flow **chưa có API/UI** (chỉ có schema unused); material norms chuyển từ “Roadmap” sang **case study T13**; process flow **chưa triển khai**; T07/T08 deliverables bổ sung CSV mới; public deploy/PostgreSQL/import CSV là roadmap; CV bullets bỏ “deployed public demo on Netlify + Render + PostgreSQL”.
- Cập nhật `docs/CASE_STUDY_QUALITY_RCA.md` (mẫu số theo ngày + nguồn CSV), `docs/CASE_STUDY_KAIZEN.md` (cách đọc CSV assumption/implementation), `docs/IE_OPERATIONS_PLAYBOOK.md` (Appendix B + Appendix C material standard), `docs/INTERVIEW_PREP.md` (Case 6 material standard).
- Thêm `tests/test_docs_data.py`: kiểm tra tổng quality 45/18 trên 1,820; rework 135/54; material standard/actual cost và excess 982,800/464,100/518,700; assumption rows không có tiền; implementation cost 12,000,000; README/DATA_DICTIONARY link tồn tại.
- Phạm vi: docs/data/test-only; **không** đổi API, Pydantic schema, `types.ts`, KPI/MILP semantics hay sample runtime. Không thêm feature mới, không claim HBI production data.

### 2026-11-08 — Quyết định mở rộng scope theo phase (người dùng phê duyệt)

- Quyết định scope freeze tại §0.1 được mở rộng theo yêu cầu mới; triển khai từng phase, giữ nguyên KPI/MILP semantics và chỉ dùng synthetic/demo data.
- **Phase 1 — T06:** readiness checklist API/UI và process-flow DAG API/UI dựa trên style/routing/result đang chọn. Không bao gồm style master, routing editor, persistent launch record hoặc release approval.
- **Phase 2 — T18:** material standard module dựa trên case study synthetic T13; không thay đổi định mức/BOM thật và không claim cash saving.
- **Phase 3 — Import:** CSV/Excel import có schema validation, lỗi actionable và giới hạn upload.
- **Phase 4 — Persistence:** PostgreSQL scenario persistence là optional, disabled-by-default; không bật endpoint ghi công khai khi chưa có auth/security review.
- **Phase 5 — Deploy:** chuẩn bị cấu hình và checklist; public deployment chỉ thực hiện khi người dùng cấp quyền/tài khoản và xác nhận môi trường.
- **Protection pay:** chưa implement công thức; chỉ có thể chuẩn bị policy intake/acceptance template. Chờ policy HR chính thức và phê duyệt trước khi tính bất kỳ khoản nào.
- Các mục phase 2–5 chưa được xem là hoàn thành khi chỉ mới có docs hoặc config. Cập nhật trạng thái từng phase bằng entry mới, không sửa lịch sử.

### 2026-11-08 — Đổi nhãn Cockpit → Dashboard

- Thay nhãn phụ `Cockpit` / `Buồng lái` bằng `Dashboard` / `Bảng điều khiển` ở sidebar và header Tổng quan; giữ nhãn mục `Overview` / `Tổng quan`.
- Dùng **Bảng điều khiển** thay vì **Biểu đồ** vì `dashboard` là bảng điều khiển/tổng hợp, còn `biểu đồ` (chart) đã dùng cho biểu đồ tải trạm; tránh lẫn hai khái niệm.
- Chỉ đổi i18n/UI copy; không đổi KPI, dữ liệu hay logic.

### 2026-11-08 — Phase 1 delivered: T06 readiness + process flow (limited)

- Thêm `ReadinessEvaluationRequest`, `StyleReadiness`, `ProcessFlowRequest/Response` và `backend/app/style_setup.py`; endpoint `POST /api/readiness/evaluate`, `POST /api/process-flow/build`.
- Readiness tính % trên required items, trả `ready` và `blocking_items`; process flow dựng DAG theo precedence hiện có, thêm station/worker khi có assignment. Không tự tạo cạnh hoặc dữ liệu.
- UI “New style”: checklist readiness và process-flow DAG ngang; mobile 390px chuyển danh sách dọc. EN/VI; loading/error/empty state.
- Giới hạn: chưa có style master, routing editor, checklist persistence, release approval hoặc multi-style workflow. Checklist reset khi rời trang.
- Kiểm chứng: `tests/test_style_setup.py`; pytest 47 pass, coverage 85.2%; browser 1440/390px không tràn ngang; sample 40 operations, 23 layers, 51 edges.

### 2026-11-08 — Phase 2 delivered: material usage variance (limited)

- Thêm `backend/app/materials.py`, `backend/app/sample_materials.py`, models `MaterialUsageInput`, `MaterialAnalysisRequest`, `MaterialVarianceLine`, `MaterialAnalysisResult`, `MaterialComparison`, `MaterialSampleResponse`.
- Endpoint `GET /api/materials/sample` (case T13 synthetic) và `POST /api/materials/analyze` (CURRENT/BEFORE/AFTER). Từ chối `material_id` trùng bằng 422; giới hạn 50 vật tư, pcs tới 10,000,000.
- UI “Materials”: bảng before/after + what-if calculator; EN/VI; loading/error/empty state; input có min/max khớp backend. Sửa footnote kết quả để không hiển thị raw English notes trong UI tiếng Việt.
- Kết quả sample: standard 22,222,200 VND; actual BEFORE 23,205,000; AFTER 22,686,300; excess 982,800 → 464,100; giảm 518,700 VND (52.78%). After vẫn cao hơn standard; đây là cost avoidance, không phải cash saving đã được Finance xác nhận.
- Giới hạn: chỉ usage variance với đơn giá cố định; chưa có material master, BOM editor, import CSV/Excel, persistence hoặc purchase-price variance.
- Kiểm chứng: `tests/test_materials.py` + API tests; `scripts/verify.ps1` pass — **54 pytest**, coverage **86.28%**, Ruff/format/mypy, ESLint, Prettier, TypeScript, Vite build. API smoke: M1 vượt +1,000,000 VND (6.67%), M2 dưới −100,000 VND (−2.5%), duplicate ID 422. Browser 1440/390px: document không tràn ngang; bảng cuộn trong `.table-wrap`; EN/VI đúng; validation pcs=0 hiển thị lỗi và xóa kết quả cũ.

### 2026-11-08 — Phase 3.1 delivered: material CSV import API (limited)

- Thêm `backend/app/material_import.py` (`parse_material_csv`, `MaterialImportError`) và model `MaterialImportPreview`.
- Endpoint `POST /api/materials/import?phase=BEFORE|AFTER|CURRENT`: nhận body `text/csv` UTF-8 (cho phép BOM), trả `materials`, `analysis`, `row_count`, `ignored_rows`, `warnings`; không persist file.
- Quy tắc: cột bắt buộc `phase, style_code, material_id, material_name, unit, standard_qty_per_pc, actual_qty_per_pc, inspected_pcs, unit_cost_vnd`; `data_policy` nếu có phải `SYNTHETIC`; aggregate có trọng số theo `inspected_pcs`; mọi vật tư phải cùng tổng pcs; metadata cùng `material_id` phải nhất quán; cột derived bị bỏ và tính lại; tối đa 5.000 dòng.
- Lỗi: `415` nếu không phải `text/csv`; `422` kèm số dòng/tên cột hoặc UTF-8 không hợp lệ; `413` theo body limit chung 2 MB.
- Cố ý dùng raw `text/csv` thay vì multipart để không thêm dependency `python-multipart`; UI upload và Excel import chưa làm.
- Kiểm chứng: `tests/test_material_import.py` 14 test (sample BEFORE/AFTER khớp 22,222,200 / 23,205,000 / 22,686,300; weighted average; lỗi cột/CSV rỗng/non-synthetic/số sai/metadata lệch/pcs lệch; API 200/415/422). `scripts/verify.ps1` pass — **68 pytest**, coverage **86.50%**, Ruff/format/mypy, ESLint, Prettier, TypeScript, Vite build.
- Live smoke (port 8021, `docs/data/material_consumption.csv`): phase BEFORE, 15 dòng dùng + 15 dòng AFTER bỏ qua, 1.820 pcs, standard 22.222.200, actual 23.205.000, variance 982.800, pct 4.42; cảnh báo bỏ phase khác và bỏ cột derived.

### 2026-11-08 — Phase 3.2 delivered: material CSV upload UI (limited)

- Thêm `importMaterialCsv` trong `frontend/src/api.ts`, type `MaterialImportPreview` trong `types.ts`, panel “Kiểm tra file CSV vật tư” trong `MaterialsPanel.tsx`.
- UI cho chọn phase `BEFORE`/`AFTER`, chọn file `.csv`, đọc bằng `file.text()`, gửi body `text/csv; charset=utf-8` tới `/api/materials/import`, hiển thị preview gồm standard/actual/variance, số pcs, số dòng dùng/bỏ qua, cảnh báo và bảng vật tư.
- Client chặn file > 2 MB và chưa chọn file; server vẫn là nguồn validation cuối (5.000 dòng, policy SYNTHETIC, cột bắt buộc, pcs nhất quán).
- Cảnh báo backend được localize EN/VI; lỗi import thường gặp có thông điệp VI riêng; lỗi dòng cụ thể hiển thị generic ở VI và chi tiết ở EN.
- Không persist file/kết quả, không thay case T13 hoặc dữ liệu optimizer; chưa có Excel/general import.
- Kiểm chứng: `npm run lint`, `format:check`, `typecheck`, `build` pass. Browser 1440px và 390px: không tràn ngang trang; bảng preview cuộn trong `.table-wrap` (520/321px ở mobile); controls xếp 1 cột ở 390px; EN/VI đúng; empty, lỗi thiếu cột (422 → thông điệp VI) và success state hoạt động.
- Live smoke qua UI: BEFORE 22.222.200 / 23.205.000 / 982.800; AFTER 22.222.200 / 22.686.300 / 464.100; file thiếu cột bị chặn và xóa preview cũ.

### 2026-11-08 — Phase 3.3 delivered: scenario master-data CSV import (limited)

- Thêm `backend/app/scenario_import.py` để parse/normalize bốn CSV operations/workers/worker_skills/machines; models `ScenarioImportRequest`, `ScenarioImportCounts`, `ScenarioImportPreview`; endpoint `POST /api/import/scenario`.
- Dùng JSON chứa bốn chuỗi CSV thay vì multipart để không thêm dependency. Validate header/cột bắt buộc, ID trùng, predecessor thiếu/tự tham chiếu, chu trình precedence, skill grade, worker/operation tham chiếu, machine coverage, `line_name`/`style_code` nhất quán, `data_policy=SYNTHETIC` và giới hạn 200 operations / 100 workers / 10.000 skill rows / 200 machines.
- Từ chối rõ ràng cột `efficiency_factor`; hiệu suất riêng theo công nhân không được đưa vào import, SAM đã duyệt theo công đoạn vẫn là cơ sở duy nhất.
- Templates `docs/data/scenario_master/{operations,workers,worker_skills,machines}.csv`: 40 operations, 24 workers, 576 skill rows, 23 machines, 23 precedence layers; round-trip qua `validate_request` với 0 lỗi.
- UI `ScenarioImportPanel.tsx` trong section Solver: chọn bốn file, client giới hạn tổng 2 MB, preview counts/machine types/bảng công đoạn. “Apply & solve” thay routing/crew/machines, xóa `baseline_assignment`, chỉ giữ actuals/headcount/daily inputs khi style và line trùng, gọi `/api/optimize` trước khi commit state.
- Cảnh báo/lỗi import có thông điệp EN/VI; lỗi cấu trúc trả `422` với detail actionable (`operations CSV is missing columns: ...`, `[operations] Row 3: ...`).
- Docs: thêm contract §3.16 vào `DATA_DICTIONARY.md`, template README, cập nhật `README.md`/`ROADMAP.md`.
- Kiểm chứng: `tests/test_scenario_import.py` 18 test pass. `scripts/verify.ps1` pass — **86 pytest**, coverage **86.67%**, Ruff/format/mypy, ESLint, Prettier, TypeScript, Vite build.
- Browser 390px: upload đủ bốn file, preview VI hiển thị 40/24/576/23; **Apply & solve** trả `OPTIMAL` trong 22,51 giây, notice `notice.importApplied` hiển thị đúng, kết quả commit vào dashboard (23 công nhân, bottleneck 58,0s, capacity 395,7, target 420 chưa đạt). Ảnh: `scenario-preview-390.png`.
- Error state: workers CSV có cột `efficiency_factor` bị chặn, preview cũ bị xóa, hiển thị thông điệp VI `scenarioImport.errorEfficiency`; upload lại workers hợp lệ phục hồi preview. Đã sửa thứ tự mapping để lỗi này ưu tiên hơn `errorDetail`.
- EN/VI: panel, hint, counts, bảng và nút đổi ngôn ngữ đúng; 1440px không tràn ngang trang (`scrollWidth = clientWidth = 1425`), bảng nằm trong `.table-wrap` với `overflow-x: auto`.
- Giới hạn: import chỉ đảm bảo cấu trúc/tham chiếu; eligibility do optimizer kiểm tra lại. Không persist file/scenario; đây không phải style master/routing editor. Material Excel import chưa làm.

### 2026-11-08 — Phase 3.4 delivered: scenario Excel workbook import (limited)

- Thêm `backend/app/scenario_excel.py`: nhận body `.xlsx`, kiểm tra zip entry/tổng uncompressed, đọc workbook `read_only=True, data_only=True`, tìm bốn sheet `operations`, `workers`, `worker_skills`, `machines` (không phân biệt hoa/thường, chuẩn hóa khoảng trắng/gạch ngang), chuyển từng sheet thành CSV rồi tái dùng `parse_scenario_bundle`.
- Endpoint `POST /api/import/scenario/excel` với MIME `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`; trả `415` sai MIME, `413` quá body limit, `422` file/sheet/dữ liệu không hợp lệ.
- Giới hạn an toàn: 2 MB body, 30 worksheet, 2.000 zip entry, 20.000.000 byte uncompressed, 10.001 dòng/sheet; giữ nguyên giới hạn 200 operations / 100 workers / 10.000 skill rows / 200 machines.
- Sheet `machines` được phép thiếu khi mọi công đoạn thủ công. Dùng giá trị tĩnh, không dùng công thức; ô công thức không có cached value sẽ thành rỗng.
- Thêm `scripts/build_scenario_workbook.py` và template `docs/data/scenario_master/scenario_master.xlsx` (4 sheet, 40/24/576/23, 19.960 byte); test đồng bộ template với CSV.
- UI `ScenarioImportPanel.tsx`: thêm form workbook `.xlsx` dưới form bốn CSV, dùng chung preview/apply; client chặn file > 2 MB; nhãn/hint/empty state EN/VI; lỗi thiếu sheet và file không hợp lệ có thông điệp VI riêng.
- Docs: `DATA_DICTIONARY.md` §3.17, `docs/data/scenario_master/README.md`, `README.md`, `ROADMAP.md`.
- Kiểm chứng: `tests/test_scenario_excel.py` 10 test pass; `scripts/verify.ps1` pass — **96 pytest**, coverage **86.45%**, Ruff/format/mypy, ESLint, Prettier, TypeScript, Vite build.
- Live API: workbook mẫu trả 200 với 40/24/576/23/23; file rác trả 422 `Excel file is not a valid .xlsx workbook.`; sai MIME trả 415.
- Browser 1440px và 390px: form Excel hiển thị đúng EN/VI, preview 40/24/576/23, **Apply & solve** trả `OPTIMAL`; workbook thiếu `worker_skills` báo `Workbook thiếu các sheet bắt buộc: worker_skills.`; không tràn ngang trang (390/390, 1425/1425), input rộng 295px ở 390px.
- Giới hạn: đây là adapter Excel cho scenario master data, không phải material Excel import, style master hay routing editor; không persist file/scenario.

### 2026-11-08 — Phase 4.1/4.3 delivered: design + DB-free scenario service/store

- Hoàn tất decision log cho thiết kế Phase 4 tại `docs/POSTGRESQL_PERSISTENCE_DESIGN.md`: schema `scenarios`/`scenario_audit`/`schema_migrations`, API private bearer token, migration forward-only, threat model, runbook và acceptance gate.
- Thay `ScenarioSaveRequest` bằng `ScenarioCreateRequest` (`name` + `request`, không nhận result từ client) và mở rộng `ScenarioSummary`/`ScenarioDetail`/`ScenarioListResponse` theo contract §6.2. Chưa có endpoint nên không có backward-compatibility burden.
- Thêm `backend/app/scenario_store.py`: `ScenarioRecord`, `ScenarioAuditEvent`, `ScenarioRepository` protocol và `InMemoryScenarioRepository` thread-safe cho unit test. Fake store **không được expose qua API** vì process memory không phải persistence.
- Thêm `backend/app/scenario_service.py`: validate request trước khi solve, giới hạn payload 1.500.000 byte, quota 200/workspace, `Idempotency-Key` replay cùng hash → trả row cũ / khác hash → 409, chỉ lưu `OPTIMAL`/`FEASIBLE_LIMIT`, kiểm tra `metadata.input_hash`, cursor base64url `created_at|uuid`, list 1–100 (mặc định 50), delete + audit.
- Lỗi service có status code nội bộ để API map sau: 400 cursor/idempotency key, 404, 409 conflict/quota, 413 payload, 422 request/solve, 500 metadata mismatch.
- `tests/test_scenario_service.py` 14 test: create/summary/audit, idempotent replay, idempotency conflict, quota, solver status bị từ chối, metadata hash/missing, invalid request không gọi solver, payload limit, key/name validation, cursor invalid, pagination, workspace isolation + delete audit.
- Kiểm chứng: `scripts/verify.ps1` pass — **110 pytest**, coverage **87.33%**, Ruff/format/mypy, ESLint, Prettier, TypeScript, Vite build.
- **Chưa làm (blocked):** không có `DATABASE_URL`, psycopg, migration `001`, `/api/scenarios`, auth middleware, health `scenario_store`, integration test Postgres hay security sign-off. Frontend vẫn lưu snapshot trong `localStorage`. Gate tiếp theo là 4.2 migration + real repository/API khi có DB private/staging và token.

### 2026-11-08 — Phase 4.2/4.3/4.4 delivered: PostgreSQL persistence + private scenario API (private staging)

- Neon PostgreSQL **18.6** (AWS `us-east-2`) được dùng làm private staging. Migration `backend/migrations/001_scenarios.sql` apply thành công qua `scripts/migrate.py`; `--check` idempotent, `schema_migrations.version=001`, checksum `0f3a34e5bef86a935341fadd79dfc3405f9bcc36890562949301e000f1fb06ff`. Bảng `scenarios`, `scenario_audit`, `schema_migrations` và index đã kiểm chứng.
- Pin `psycopg[binary]==3.3.8` và `psycopg_pool==3.3.3`; không thêm SQLAlchemy/Alembic, không `create_all()` lúc startup.
- `backend/app/persistence.py`: `ScenarioSettings` đọc env, payload cap 1.500.000 byte, lazy pool, health snapshot, `ScenarioUnavailableError`; `main.py` đóng pool qua lifespan shutdown.
- API private: `POST/GET/DELETE /api/scenarios` + `GET /api/scenarios/{id}`; bearer token so sánh bằng `compare_digest`, thiếu/sai token `401`, persistence tắt/misconfigured `503`; body limit, rate limit write `429`, CORS cho `Authorization`/`Idempotency-Key`/`DELETE`; `/api/health` trả `scenario_store`.
- Server re-solve trước khi lưu; chỉ lưu `OPTIMAL`/`FEASIBLE_LIMIT`; kiểm tra `metadata.input_hash`; `Idempotency-Key` 8–64 ký tự `A-Za-z0-9._:-`, replay cùng hash `200`, khác hash `409`; hard delete + audit.
- Test: `tests/test_scenario_api.py` 13 test (auth, CRUD, pagination, idempotency, quota, 413/429/422/503), `tests/test_scenario_store_postgres.py` 3 integration test opt-in, gồm regression **session timezone `America/New_York`**: `timestamptz` vẫn round-trip UTC (`+00:00`), cursor phân trang đúng khi ngày/giờ địa phương lệch UTC.
- Kiểm chứng: full pytest **126 test** pass (gồm 3 integration Neon), coverage **86.54%**; Ruff/format/mypy pass. Smoke private staging: health `200` (`mode=postgres`, `ready=true`, `schema_version=1`), unauth `401`, create `201` + `Location`, replay `200`, list/get `200`, delete `204`, get-after-delete `404`; `created_at` là UTC.
- Rollback drill: `SCENARIO_PERSISTENCE=localStorage` → `/api/health` 200 (`reason=disabled`), `/api/optimize` 200 `OPTIMAL`, `/api/scenarios` 503.
- **Residual (chưa đạt Phase 4 done):** frontend vẫn lưu scenario trong `localStorage`, chưa có client server; quota đang `count` rồi `insert` (chưa dùng `pg_advisory_xact_lock`); list query còn select `request_json`/`result_json` dù response list không trả; DB role đang là owner `neondb_owner`; chưa deploy Render/public. Neon password đã từng xuất hiện trong chat → phải rotate trước khi coi security sign-off hoàn tất.

### 2026-11-08 — Phase 4.5: rotation + security review + docs sync

- Rotate Neon password bằng `ALTER ROLE neondb_owner` với mật khẩu random 32 byte; `.env.local` (gitignored) được cập nhật, reconnect và `scripts/migrate.py --check` xác nhận schema `001` sạch; 3 integration test PostgreSQL pass lại sau rotation. Không in DSN/mật khẩu ra log.
- Test integration thêm `_RedactedDatabaseUrl` để pytest không render DSN khi fail; regression timezone `America/New_York` xác nhận `timestamptz` round-trip UTC và cursor đúng.
- Security review: bearer token so sánh constant-time, `401`/`503` đúng; workspace filter bắt buộc; SQL parameterized; token/DSN không trả qua API/health/log; CORS allowlist; body/payload/rate limit; lifespan đóng pool. Rollback drill pass (persistence tắt → optimize `OPTIMAL`, scenarios `503`).
- Residual accepted cho private staging: DB role owner `neondb_owner` (chưa tạo role least-privilege); quota count/insert chưa advisory lock; chưa có purge audit; chưa có frontend server-scenario client. Không claim public deployment.
- Docs sync: `docs/POSTGRESQL_PERSISTENCE_DESIGN.md`, `ROADMAP.md`, `README.md`, `SECURITY.md`, `DEPLOYMENT.md`, `DATA_DICTIONARY.md`.
- Kiểm chứng cuối: `scripts/verify.ps1` pass — **123 pytest passed, 3 skipped** (Postgres opt-in), coverage **85.39%**, Ruff/format/mypy, ESLint, Prettier, TypeScript, Vite build.

### 2026-11-08 — Phase 4.6: demo accounts + frontend server-scenario client (Model C)

- Chọn **Model C** thay vì anonymous session: tài khoản demo cấu hình bằng env, không lưu user/session trong PostgreSQL; Neon chỉ lưu scenario. Không cần migration `002` và không mở anonymous write.
- `backend/app/auth.py`: `AUTH_DEMO_PASSWORD`, `AUTH_SESSION_SECRET`, `AUTH_ADMIN_USERS` (mặc định `admin`), `AUTH_VIEWER_USERS` (mặc định `test1`–`test4`), `AUTH_SESSION_TTL_SEC` (mặc định 8 giờ), `AUTH_COOKIE_SECURE=auto|always|never`. Mật khẩu dùng chung cho demo, kiểm tra constant-time; username không hợp lệ và sai mật khẩu đều trả `401`.
- Session là HMAC-SHA256 token ký stateless trong cookie HttpOnly `lb_session` (HTTPS dùng `__Host-lb_session`), `SameSite=Lax`, `Secure` khi HTTPS/forwarded proto. Token chứa role, hạn dùng và fingerprint mật khẩu, nên đổi mật khẩu thu hồi phiên cũ. Không có refresh token, không lưu session server-side.
- API: `GET /api/auth/session`, `POST /api/auth/login`, `POST /api/auth/logout`; guard scenario chấp nhận bearer token hoặc session. Viewer chỉ được list/get; admin được create/delete. Cookie write bắt buộc `Origin` hợp lệ (CSRF); bearer write không cần Origin. Hợp đồng lỗi: `401` thiếu/sai phiên, `403` viewer write hoặc Origin bị từ chối, `503` login/persistence tắt hoặc cấu hình sai, `429` vượt rate limit login/write.
- CORS bật `allow_credentials=True` với allowlist tường minh + regex Netlify; không dùng `*` khi có credentials. Health chỉ trả metadata auth (`enabled`, `mode`, `roles`, TTL), không lộ mật khẩu/secret.
- Frontend: dialog đăng nhập tối giản, chip user/role + logout trên topbar, panel **Server scenarios** trong section Solver. Admin thấy form lưu/xóa; viewer thấy banner chỉ đọc và không có nút ghi. Client dùng `credentials: "include"` và xử lý `401` bằng cách kết thúc phiên UI. Optimizer, export và snapshot `localStorage` vẫn dùng được khi chưa đăng nhập.
- Cấu hình local: thêm `AUTH_*` vào `.env.local` (gitignored, không commit); tạo `scripts/run_backend.ps1` nạp `.env.local` rồi chạy uvicorn, biến môi trường có sẵn được ưu tiên. `pytest`/`scripts/verify.ps1` không tự nạp file này.
- Kiểm chứng backend: `pytest` **138 passed, 3 skipped** (Postgres opt-in; 141 collected), coverage **86.19%**; Ruff check/format, mypy pass. `tests/test_auth_api.py` 15 test cho login, cookie flags, role, CSRF, expiry, tampering, logout, rate limit, login tắt, audit actor và health không lộ secret.
- Kiểm chứng frontend: ESLint, Prettier check, `tsc --noEmit`, Vite build pass. Browser 1440px và 390px (emulated) không tràn ngang; dialog rộng 420/366px, focus vào username; admin panel và viewer read-only banner hiển thị đúng.
- Smoke Neon qua backend thật: health `200` (`auth.enabled=true`, `scenario_store.ready=true`), anonymous list `401`, sai mật khẩu `401`, admin login `200` + cookie HttpOnly/SameSite/TTL 8h, cookie write thiếu Origin `403`, admin create `201` (`server-solve`, `OPTIMAL`, 23 workers/23 stations), list/get `200`, viewer login `200`, viewer list `200` nhưng create `403`, delete `204`, get-after-delete `404`, logout `204`, list sau logout `401`. Tổng **29/29 smoke check pass**; scenario smoke đã xóa khỏi Neon.
- Kiểm chứng cuối sau đồng bộ docs/config: `powershell -ExecutionPolicy Bypass -File scripts/verify.ps1` pass — **138 passed, 3 skipped**, coverage **86.19%**, Ruff check/format, mypy, ESLint, Prettier, `tsc --noEmit` và Vite build. `git diff --check` sạch.
- **Giới hạn còn lại:** đây là auth demo dùng chung mật khẩu, không phải identity provider/least privilege; admin và viewer dùng chung `SCENARIO_WORKSPACE_ID` nên viewer đọc được mọi scenario trong workspace; chưa có user table, audit theo từng cá nhân (audit chỉ có actor label/username), quota advisory lock, purge audit hay deploy public. Render vẫn mặc định `SCENARIO_PERSISTENCE=localStorage`; bật Neon + auth là bước deploy riêng.
