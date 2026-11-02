# LineBalance Pro — Roadmap đầy đủ

> **Phiên bản:** 1.2 — đã hiệu chỉnh sau technical review và đo solver  
> **Ngày lập:** 2026-11-01  
> **Cập nhật:** 2026-11-02  
>
> **QUAN TRỌNG — đọc trước:**  
> Các điểm review P0/P1/P2, quyết định kỹ thuật và trạng thái code được ghi đầy đủ tại **`CHECKLIST.md`**.  
> Công thức MILP hiệu chỉnh nằm tại **`MODEL.md`**.  
> Định nghĩa SAM/allowance/efficiency/KPI nằm tại **`KPI_SPEC.md`** (đã tạo 2026-11-02).  
> Nếu nội dung bên dưới mâu thuẫn với các file đó, các file đó được ưu tiên.  
>
> **Cập nhật hướng làm 2026-11-02:** xem `CHECKLIST.md` §0.1. Ưu tiên knowledge-first; đóng băng phạm vi phần mềm; 10 nhóm IE/Lean chuyển vào `docs/IE_OPERATIONS_PLAYBOOK.md`.  
>
> **Cập nhật solver 2026-11-02:** xem `CHECKLIST.md` §10.1.  
> - Scenario A — 24 worker available, target 420: optimum **58.0s**, **23 station/23 worker**, capacity **395.7 pcs/shift**, target **không đạt**.  
> - Scenario B — 26 worker available, target 400: optimum **56.0s**, **25 station/25 worker**, capacity **409.8 pcs/shift**, target **đạt**.  
> - Quyết định: dùng **HiGHS** làm solver chính; CBC chỉ là fallback.  
> - Baseline đã rebuild **24 station/24 worker/61.0s**; before/after A: 24→23 station, 61.0→58.0s, LBE 72.34%→79.39%.  
> - T07/T08 case study đã có tại **`docs/CASE_STUDY_QUALITY_RCA.md`** và **`docs/CASE_STUDY_KAIZEN.md`**; dữ liệu synthetic trong `docs/data/`.  
>
> **Các thay đổi lớn so với v1.0:**
> - Load dùng **SAM cố định**, không dùng effective time phụ thuộc worker.
> - Công đoạn thủ công dùng `machine_type=None`, không dùng máy giả `MANUAL`.
> - Lexicographic optimization là **hai bước giải thật**, có xử lý timeout.
> - Before/after chỉ có khi có **baseline assignment**; không tự tạo số liệu.
> - SAM/allowance/efficiency mỗi yếu tố chỉ tính **một lần**.
> - KPI đổi tên: **Planned Labor Utilization**, **Machine Capacity Coverage**, **Machine Demand Ratio**.
> - Public demo dùng **localStorage**; API ghi/xóa scenario bị tắt mặc định.
> - Bổ sung **T09–T16** với ưu tiên P0/P1/P2 rõ ràng.
> **Mục tiêu:** Demo/CV cho vị trí **Shift Line Engineer (IE)** tại HBI Phú Bài  
> **Nguyên tắc xuyên suốt:** Mô hình đúng → Dữ liệu đúng → KPI đúng → API đúng → Dashboard đẹp → Deploy ổn định → Case study thuyết phục.

---

## 0. Tóm tắt điều hành

LineBalance Pro là một web app quản trị và tối ưu hóa chuyền may, tập trung vào 6 việc mà một IE phải làm hằng ngày:

1. Chuẩn hóa dữ liệu sản xuất: operation routing, SAM, worker, skill, machine, shift, target.
2. Cân bằng chuyền bằng MILP/PuLP: gán công đoạn vào trạm, gán công nhân, tôn trọng precedence, skill và machine.
3. Lập kế hoạch năng lực: capacity, required HC, manpower gap, machine requirement.
4. Quản lý định biên và kỹ năng: standard HC vs actual HC, attendance, skill coverage, transfer suggestion.
5. Dashboard KPI và báo cáo sản xuất: production achievement, labor efficiency, LBE, workload, bottleneck, capacity.
6. Chuẩn bị mã hàng mới: routing, SAM, kiểm tra máy/công nhân, process flow, readiness checklist.

Hai case study bổ sung để tạo lợi thế phỏng vấn:

7. Quality Improvement & Root Cause Analysis — Pareto, fishbone, corrective action, before/after.
8. Kaizen & Cost Saving — before/after line balance, HC, bottleneck, capacity, verified saving.

**Stack MVP:**

```text
React + Vite + TypeScript + Tailwind
        │
        ▼
Netlify (static + /api proxy)
        │
        ▼
FastAPI + PuLP 4.2 + HiGHS
        │
        ├── PostgreSQL 16 (scenarios)
        └── CSV/XLSX export
```

**Ngoài critical path của MVP:** Qdrant, MinIO, auth, multi-line, MES, real-time, ML/DL, layout CAD, full quality/kaizen/safety/payroll modules.

**Kết quả cam kết sau 8 ngày:**

- Một public URL HTTPS chạy được.
- Import dữ liệu CSV/Excel và validation rõ ràng.
- Chạy MILP/HiGHS và xem phương án trước/sau tối ưu.
- Dashboard KPI + capacity + HC control + new style/process flow.
- Test suite, benchmark 50 operations / 25 workers, README và 5 tài liệu bàn giao.

---

## 1. Mục tiêu, nguyên tắc và định nghĩa MVP

### 1.1. Mục tiêu

| Mục tiêu | Cách đo |
|---|---|
| Chứng minh hiểu bài toán IE | Giải thích được SAM, takt, LBE, HC standard, capacity, bottleneck |
| Chứng minh năng lực OR | MILP có biến, ràng buộc, objective, trạng thái solver rõ ràng |
| Chứng minh năng lực full-stack | React → API → solver → PostgreSQL → deploy |
| Chứng minh khả năng triển khai | Public URL, test, benchmark, README, demo script |
| Không tạo dữ liệu giả thuyết | Public demo chỉ dùng dữ liệu synthetic, ghi rõ nguồn |

### 1.2. Nguyên tắc thiết kế

1. **Correctness trước UI.** Không đánh bóng dashboard khi model/KPI/API chưa đúng.
2. **Một nguồn sự thật cho dữ liệu.** `DATA_DICTIONARY.md` là hợp đồng giữa frontend, backend và test.
3. **Solver phải trả trạng thái trung thực.** `OPTIMAL`, `FEASIBLE_LIMIT`, `INFEASIBLE`, `ERROR` — không báo optimal khi timeout.
4. **Tách lớp rõ ràng.** Validation → MILP → KPI → Planning → API → UI.
5. **Không giả lập nghiệp vụ chưa có dữ liệu.** Machine allocation ≠ machine utilization; estimated saving ≠ verified saving; protection pay cần policy chính thức.
6. **Depth hơn breadth.** 6 task làm đúng tốt hơn 18 module nông.
7. **Mọi con số phải có công thức và test.** KPI không được “tính tay trong component”.

### 1.3. Định nghĩa MVP

MVP đạt khi:

- Public URL truy cập được bằng HTTPS.
- `/api/health` trả 200 và xác nhận solver available.
- Import được Operations, Workers, Worker Skills, Machines, Shift Config.
- Validation chặn dữ liệu sai và giải thích được lỗi.
- Mỗi operation được gán đúng 1 station; mỗi worker tối đa 1 station.
- Không vi phạm precedence, skill, machine.
- KPI khớp unit tests.
- API phân biệt 4 trạng thái solver.
- Dashboard hiển thị loading, lỗi, timeout, kết quả.
- Export CSV/XLSX hoạt động.
- Benchmark 50 ops / 25 workers được ghi lại.
- README ghi rõ kiến trúc, cách chạy, dữ liệu synthetic.

### 1.4. Ngoài phạm vi MVP

| Hạng mục | Quyết định |
|---|---|
| Multi-plant / multi-line optimization | Roadmap |
| MES / ERP / HR integration | Roadmap |
| Real-time monitoring | Roadmap |
| Authentication / role-based access | Roadmap |
| ML/DL dự đoán năng suất | Roadmap |
| CAD layout / 2D layout editor | Roadmap |
| Full quality management system | Chỉ case study |
| Full kaizen/cost-saving workflow | Chỉ case study |
| Safety/EHS workflow | Roadmap |
| Protection pay calculation | Roadmap, chờ policy HR |
| Qdrant vector search | Roadmap Phase 2 |
| MinIO object storage | Roadmap Phase 2 |
| Heuristic fallback thay MILP | Không làm trong MVP |

---

## 2. Bối cảnh JD HBI và độ phủ

### 2.1. Bảng JD coverage

| Nhóm công việc trong JD | Task chứng minh | Trạng thái MVP |
|---|---|---|
| Improve productivity and plant efficiency | T02, T05 | Có |
| Production planning | T03 | Có |
| Hiring / manpower planning | T03, T04 | Có |
| Machinery planning | T02, T03 | Có |
| Line moving | T06 + roadmap T15 | Một phần |
| Line balancing | T02 | Có — trọng tâm |
| Maintain HC standard | T04 | Có |
| Operator protection pay | Roadmap T22 | Chỉ hiểu nghiệp vụ |
| Improve layout | Roadmap | Chỉ hiểu nghiệp vụ |
| Material standard norms | Roadmap T18 | Roadmap |
| Collect data / IE reports | T01, T05 | Có |
| New style setup | T06 | Có |
| Quality problem analysis | T07 case study | Case study |
| Safety improvement | Roadmap T21 | Chỉ hiểu nghiệp vụ |
| Kaizen projects | T08 case study | Case study |
| Process flow charts | T06 | Có |
| Cost savings | T08 case study | Case study |

### 2.2. Sáu task trọng tâm

| Task | Tên | Vai trò trong phỏng vấn |
|---|---|---|
| T01 | Production Data Management & Standardization | Chứng minh hiểu dữ liệu IE và biết kiểm soát chất lượng dữ liệu |
| T02 | Line Balancing Optimization | Trái tim kỹ thuật: MILP, precedence, skill, machine, bottleneck |
| T03 | Production & Capacity Planning | Chứng minh hiểu capacity, required HC, manpower gap, machine gap |
| T04 | Standard HC & Worker Skill Management | Chứng minh hiểu định biên, attendance, skill matrix, điều chuyển |
| T05 | IE KPI Dashboard & Production Reporting | Chứng minh biết đo lường, phân tích và báo cáo |
| T06 | New Style Setup & Process Flow | Chứng minh hiểu quy trình chuẩn bị mã hàng mới |

### 2.3. Hai case study

| Task | Tên | Sản phẩm |
|---|---|---|
| T07 | Quality Improvement & Root Cause Analysis | Báo cáo Pareto + fishbone + corrective action + before/after |
| T08 | Kaizen & Cost Saving | Báo cáo before/after + verified saving + phương pháp xác nhận |

---

## 3. Kiến trúc hệ thống

### 3.1. Sơ đồ kiến trúc

```text
┌──────────────────────────────────────────────────────────────┐
│ Browser                                                      │
│ React + Vite + TypeScript + Tailwind                         │
│ Recharts · PapaParse · SheetJS · lucide-react                │
│                                                              │
│  Tabs: Data · Optimize · Planning · Workforce · Dashboard    │
│        New Style · Case Studies                              │
└───────────────────────────┬──────────────────────────────────┘
                            │ fetch("/api/*")
                            ▼
┌──────────────────────────────────────────────────────────────┐
│ Netlify                                                      │
│ - Static build (base = frontend, publish = dist)             │
│ - Proxy /api/* → Render API                                  │
│ - SPA fallback /* → /index.html                              │
└───────────────────────────┬──────────────────────────────────┘
                            │ HTTPS
                            ▼
┌──────────────────────────────────────────────────────────────┐
│ Render Web Service                                           │
│ FastAPI + Uvicorn                                            │
│ - /api/health                                                │
│ - /api/sample                                                │
│ - /api/optimize                                              │
│ - /api/plan                                                  │
│ - /api/export                                                │
│ - /api/readiness                                             │
│ - /api/scenarios                                             │
│                                                              │
│ PuLP 4.2 + HiGHS (pulp.HiGHS)                                │
│ PostgreSQL 16 (scenarios, optimization runs)                 │
└──────────────────────────────────────────────────────────────┘
```

### 3.2. Stack

| Layer | Công nghệ | Ghi chú |
|---|---|---|
| Frontend | React 18/19, Vite, TypeScript, Tailwind CSS | SPA, responsive |
| Charts | Recharts | Workload bar, KPI trend, scenario compare |
| CSV/Excel | PapaParse, SheetJS | Import/export |
| Icons | lucide-react | Nhẹ, nhất quán |
| Backend | FastAPI, Uvicorn, Pydantic 2 | API + validation |
| Optimization | PuLP 4.2, HiGHS qua `pulp.HiGHS` | CBC chỉ là fallback tùy chọn qua `SOLVER_BACKEND=cbc` |
| Persistence | PostgreSQL 16 + SQLAlchemy 2 + psycopg 3 | Chỉ bảng scenarios/runs |
| Deploy | Netlify + Render | Free tier cho demo |
| Testing | pytest, httpx/TestClient | Unit + API |
| Docs | Markdown | SCOPE, DATA_DICTIONARY, MODEL, KPI_SPEC, ARCHITECTURE |

### 3.3. Repo structure

```text
linebalance-pro/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   ├── data/
│   │   │   ├── optimize/
│   │   │   ├── planning/
│   │   │   ├── workforce/
│   │   │   ├── dashboard/
│   │   │   ├── new-style/
│   │   │   └── case-studies/
│   │   ├── lib/
│   │   │   ├── api.ts
│   │   │   ├── types.ts
│   │   │   ├── csv.ts
│   │   │   ├── format.ts
│   │   │   └── sample.ts
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── models.py
│   │   ├── validation.py
│   │   ├── optimizer.py
│   │   ├── kpis.py
│   │   ├── planning.py
│   │   ├── readiness.py
│   │   ├── excel.py
│   │   ├── db.py
│   │   └── sample_data.py
│   ├── tests/
│   └── requirements.txt
├── data/
│   ├── operations_sample.csv
│   ├── workers_sample.csv
│   ├── worker_skills_sample.csv
│   ├── machines_sample.csv
│   └── shift_config_sample.json
├── benchmarks/
│   ├── run_benchmark.py
│   └── RESULTS.md
├── docs/
│   ├── CASE_STUDY_PRODUCTION_PLANNING.md
│   ├── CASE_STUDY_QUALITY_RCA.md
│   ├── CASE_STUDY_KAIZEN.md
│   └── BEFORE_AFTER_REPORT.md
├── infra/
│   └── docker-compose.yml
├── netlify.toml
├── render.yaml
├── README.md
├── SCOPE.md
├── DATA_DICTIONARY.md
├── MODEL.md
├── KPI_SPEC.md
├── ROADMAP.md
└── DEPLOYMENT.md
```

### 3.4. Data flow

```text
CSV/Excel hoặc form
        │
        ▼
Validation (ID, SAM, predecessor, cycle, skill, machine, takt)
        │
        ├── lỗi dữ liệu → DATA_ERROR + hướng dẫn sửa
        ▼
MILP model (x, y, z, m, Load, Cmax)
        │
        ▼
HiGHS solve → OPTIMAL / FEASIBLE_LIMIT / INFEASIBLE / ERROR
        │
        ▼
Assignment + Station + KPI + Planning + Warnings
        │
        ├── Dashboard / Workload chart / Skill matrix
        ├── CSV/XLSX export
        └── PostgreSQL scenario save/load
```

### 3.5. Môi trường

| Môi trường | Frontend | Backend | Database |
|---|---|---|---|
| Local | `npm run dev` (Vite, proxy `/api` → `localhost:8000`) | `uvicorn app.main:app --reload` | PostgreSQL local/Docker hoặc fallback |
| Preview | Netlify deploy preview | Render staging (nếu có) | Neon/Supabase branch (nếu có) |
| Production | Netlify production | Render production | Neon/Supabase PostgreSQL 16 |

### 3.6. Persistence strategy

**MVP:** PostgreSQL 16 chỉ để lưu scenario.

```sql
CREATE TABLE scenarios (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    line_name TEXT,
    style_code TEXT,
    request_json JSONB NOT NULL,
    result_json JSONB NOT NULL,
    kpis_json JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

- Không auth. Dùng `demo_workspace` cố định.
- Nếu `DATABASE_URL` không có hoặc DB lỗi: fallback localStorage ở frontend; API scenario trả 503 nhưng optimize vẫn chạy.
- Không dùng Alembic trong MVP; `Base.metadata.create_all()` khi startup.

**Deferred:**

| Service | Khi nào dùng | Lý do defer |
|---|---|---|
| Qdrant | T19 Quality RCA semantic search, T18 material specs, T20 kaizen lessons | MVP chưa có vector data |
| MinIO | Upload CSV/XLSX, tài liệu style, layout file, ảnh defect | MVP sinh export trực tiếp, không cần object storage |
| Auth | Khi có multi-user/real data | Public demo chỉ synthetic, không có dữ liệu nhạy cảm |

`infra/docker-compose.yml` sẽ có Postgres + Qdrant + MinIO để thể hiện stack và phục vụ Phase 2, nhưng MVP deploy chỉ cần Postgres.

---

## 4. Phạm vi chức năng chi tiết

### 4.1. T01 — Production Data Management & Standardization

**Mục tiêu:** Hệ thống tiếp nhận dữ liệu sản xuất qua CSV/Excel, chuẩn hóa và kiểm tra hợp lệ trước khi tối ưu.

**Input:**

| File | Trường chính |
|---|---|
| `operations.csv` | operation_id, operation_name, sam_sec, predecessor_ids, machine_type, skill_code, skill_required, is_quality_gate, sequence |
| `workers.csv` | worker_id, worker_name, available, worker_status, efficiency_factor, machine_types |
| `worker_skills.csv` | worker_id, operation_id, skill_grade (A/B/C hoặc 0–3) |
| `machines.csv` | machine_id, machine_type, available, capacity |
| `shift_config.json` | shift_id, shift_name, shift_minutes, break_minutes, target_qty, working_days, allowance_pct, planned_efficiency, max_workers |

**Validation:**

- ID không trùng.
- SAM > 0.
- Predecessor tồn tại, không self-reference, không cycle.
- Có ít nhất 1 worker available.
- `max_workers` > 0 và ≤ số worker available.
- Mỗi operation có ít nhất 1 worker đủ skill + machine.
- Machine type cần thiết có capacity ≥ 1.
- Takt > 0.
- Cảnh báo: operation vượt takt, single point of failure, machine capacity chia sẻ, worker không có operation nào.

**Output:**

- Bảng dữ liệu đã chuẩn hóa.
- Validation summary: errors/warnings.
- Nút tải sample data và template CSV.

**Acceptance:**

- Import được bộ 40 operations / 24 workers / 23 machines.
- Dữ liệu sai bị chặn với thông báo cụ thể.
- Không crash khi file thiếu cột hoặc sai định dạng.

---

### 4.2. T02 — Line Balancing Optimization

**Mục tiêu:** Tìm phương án gán operation → station → worker tối ưu, tôn trọng precedence, skill, machine và headcount.

**Giả định:**

- Mỗi operation gán đúng 1 station.
- Mỗi station tối đa 1 worker.
- Mỗi worker tối đa 1 station.
- Một station có thể làm nhiều operation liên tiếp.
- Một station tối đa 1 loại machine.
- Không có nhiều worker/machine song song cho cùng operation.

**Biến quyết định:**

| Biến | Ý nghĩa |
|---|---|
| `x[i,s]` | Operation i gán vào station s |
| `y[s,w]` | Worker w làm station s |
| `z[s]` | Station s được sử dụng |
| `m[s,k]` | Station s được trang bị machine type k |
| `Load[s]` | Effective workload của station s |
| `Cmax` | Workload lớn nhất |

**Ràng buộc:**

1. `sum_s x[i,s] = 1` cho mọi operation.
2. `sum_w y[s,w] = z[s]`; `sum_s y[s,w] ≤ 1`.
3. `x[i,s] ≤ sum_{w eligible(i)} y[s,w]`.
4. `x[i,s] ≤ m[s,k]` nếu operation i cần machine k.
5. `sum_k m[s,k] ≤ 1`; `sum_s m[s,k] ≤ available_capacity[k]`.
6. `y[s,w] + m[s,k] ≤ 1` nếu worker w không vận hành được machine k.
7. Precedence: `station(pred) ≤ station(succ)`.
8. `Load[s] = sum_i effective_time(i, worker_at_s) * x[i,s]`.
9. `Load[s] ≤ Cmax`.
10. `sum_s z[s] ≤ max_workers`.
11. Với `min_workers`: `Load[s] ≤ takt * z[s]` (takt là hard constraint).

**Objective:**

- `min_bottleneck` (mặc định): lexicographic `min Cmax`, sau đó `min số station`.
- `min_workers`: lexicographic `min số station`, sau đó `min Cmax`.

**Output:**

- Phương án trước tối ưu (heuristic/initial) và sau tối ưu.
- Bảng assignment: operation, station, worker, machine, SAM, effective time, skill grade.
- Workload chart theo station, đường takt.
- Bottleneck station và warning.
- Solver status + solve time.

**Acceptance:**

- Tất cả operation được gán đúng 1 lần.
- Không worker nào ở 2 station.
- Không vi phạm precedence/skill/machine.
- Bài toán nhỏ có nghiệm tối ưu biết trước khớp.
- API trả đúng 4 trạng thái.
- Benchmark 50 ops / 25 workers có kết quả.

---

### 4.3. T03 — Production & Capacity Planning

**Mục tiêu:** Trả lời: với target output, SAM, HC và máy hiện có, chuyền có đủ năng lực không? Cần thêm bao nhiêu người/máy?

**Input:**

- Target output/ngày.
- Garment SAM (tổng SAM operations).
- Available HC.
- Available machine theo type.
- Working days.
- Shift hours, break, allowance.
- Planned efficiency.

**Công thức:**

```text
Net shift minutes = (shift_minutes - break_minutes) * (1 - allowance_pct)
Period target = target_qty_per_day * working_days
Available minutes per worker = net_shift_minutes * working_days

Required HC = period_target * garment_sam_min
              / (available_minutes_per_worker * planned_efficiency)

Daily capacity = available_hc * net_shift_minutes * planned_efficiency
                 / garment_sam_min

Period capacity = daily_capacity * working_days
Capacity gap = period_capacity - period_target
Capacity achievement % = period_capacity / period_target * 100
```

**Machine requirement:**

- Từ MILP: số station cần theo từng machine type.
- So với available capacity.
- Gap = required stations - available capacity.

**Output:**

- Capacity plan card.
- Required HC vs available HC.
- HC gap.
- Machine requirement table.
- Target vs capacity.
- Cảnh báo thiếu người/máy.
- Ghi chú phân biệt plan-level estimate và MILP feasible plan.

**Acceptance:**

- Công thức khớp hand calculation.
- Thay đổi target/HC/planned efficiency cập nhật đúng.
- Không dùng capacity plan thay thế MILP result mà không ghi chú.

---

### 4.4. T04 — Standard Headcount & Worker Skill Management

**Mục tiêu:** Quản lý định biên, attendance, skill matrix và đề xuất điều chuyển.

**Input:**

- Standard HC, planned HC, actual HC.
- Attendance HC.
- Worker skills A/B/C (0–3).
- Worker availability.
- Optimizer assignment.

**Output:**

| Chỉ số | Công thức |
|---|---|
| HC gap | Actual HC - Standard HC |
| HC adherence | Actual HC / Standard HC × 100% |
| Attendance | Attendance HC / Actual HC × 100% |
| Optimized HC | Số station dùng bởi MILP |
| Skill coverage | Số worker eligible cho từng operation |
| Single point of failure | Operation chỉ có 1 worker eligible |
| Transfer suggestion | Worker chưa dùng nhưng qualified cho bottleneck operation |

**UI:**

- Bảng Standard / Planned / Actual / Optimized HC.
- Skill matrix heatmap: worker × operation, grade 0–3.
- Coverage list: critical/tight/ok.
- Transfer suggestions.

**Acceptance:**

- Attendance thay đổi → gap/adherence cập nhật.
- Skill matrix phản ánh đúng grade.
- Transfer suggestion chỉ đề xuất worker thực sự eligible.
- Không hiển thị dữ liệu lương/thông tin cá nhân thật.

---

### 4.5. T05 — IE KPI Dashboard & Production Reporting

**Mục tiêu:** Dashboard 6 nhóm KPI, ưu tiên các chỉ số có dữ liệu thật; nhóm chưa có dữ liệu ghi rõ “data not provided”.

**Nhóm KPI:**

| Nhóm | KPI MVP | Ghi chú |
|---|---|---|
| Production Performance | Production achievement %, output/hour | Có |
| Manpower & Labor | HC gap, HC adherence, attendance, output/operator | Có |
| Line Balancing | LBE, balance delay, workload ratio, bottleneck | Có |
| Machine & Capacity | Machine allocation, machine gap, capacity achievement | Có một phần |
| Quality & Material Loss | Defect rate, FPY, material variance | Roadmap T18/T19 |
| Kaizen, Cost Saving & Safety | Verified saving, kaizen count, safety closure | Roadmap T20/T21 |

**Nguyên tắc hiển thị:**

- Machine allocation ≠ machine utilization. Chỉ gọi utilization khi có runtime/downtime.
- Estimated saving ≠ verified saving.
- KPI không có dữ liệu phải hiển thị “Data not provided” + link roadmap, không bịa số.

**Output:**

- KPI cards.
- Workload bar chart với takt line.
- Bottleneck panel.
- Scenario comparison.
- Export CSV/XLSX.
- Report snapshot.

**Acceptance:**

- KPI khớp backend/unit tests.
- Không có KPI nào tính trong component mà không có công thức.
- Export chứa đúng dữ liệu đang hiển thị.

---

### 4.6. T06 — New Style Setup & Process Flow

**Mục tiêu:** Mô phỏng quy trình chuẩn bị mã hàng mới và tạo process flow từ routing.

**New Style Setup:**

- Nhập style code, operation routing, SAM.
- Kiểm tra machine availability.
- Kiểm tra worker/skill coverage.
- Kiểm tra precedence.
- Readiness checklist 8 nhóm:

| Nhóm | Nội dung |
|---|---|
| Operation Routing | Danh sách công đoạn |
| SAM | SAM từng công đoạn đã xác nhận |
| Machine | Máy cần thiết đã sẵn sàng |
| Manpower | Đã bố trí đủ người |
| Skill | Worker đáp ứng kỹ năng |
| Layout | Layout mới đã thiết kế |
| Material | Nguyên phụ liệu sẵn sàng |
| Production Trial | Đã chạy thử/xác nhận |

**Readiness:**

```text
Readiness % = Completed required items / Total required items × 100%
Ready = tất cả required items COMPLETED và không có BLOCKED
```

**Process Flow:**

- DAG từ precedence.
- Trước tối ưu: operation + SAM + machine.
- Sau tối ưu: thêm station + worker.
- Node màu theo station; edge thể hiện precedence.
- Không được tạo edge làm sai precedence.

**Acceptance:**

- Readiness không cho “Ready” nếu còn required item chưa completed.
- Process flow phản ánh đúng routing.
- Flow sau tối ưu khớp assignment table.

---

### 4.7. T07 — Quality Improvement & Root Cause Analysis (case study)

**Không xây module phần mềm đầy đủ.** Chỉ cần một case study có số liệu synthetic và phân tích đúng.

**Deliverable:** `docs/CASE_STUDY_QUALITY_RCA.md` (đã có), `docs/data/quality_defects.csv`, `docs/data/quality_setup_audit.csv`.

**Nội dung:**

- Chọn một operation có defect rate cao (ví dụ: Tra tay).
- Defect Pareto theo defect type.
- Fishbone 4M: Man, Machine, Method, Material.
- Root cause + corrective action + owner + due date.
- Before/after defect rate và FPY.
- Kết luận: vấn đề, nguyên nhân, hành động, kết quả.

**Acceptance:**

- Có bảng số liệu trước/sau.
- Có Pareto và fishbone.
- Không khẳng định nhân quả nếu chưa có kiểm chứng.
- Ghi rõ dữ liệu synthetic.

---

### 4.8. T08 — Kaizen & Cost Saving (case study)

**Không xây module phần mềm đầy đủ.** Chỉ cần một case study before/after.

**Deliverable:** `docs/CASE_STUDY_KAIZEN.md` (đã có), `docs/data/kaizen_cost_model.csv`.

**Nội dung:**

- Baseline: LBE, bottleneck, HC, capacity, waiting/changeover.
- Giải pháp kaizen: cân bằng lại operation, giảm bottleneck, giảm changeover, cải tiến layout.
- After: LBE, bottleneck, HC, capacity.
- Cost saving:

```text
Net saving = Baseline cost - Post-improvement cost - Implementation cost
```

- Phân biệt **Estimated saving** và **Verified saving**.
- Phương pháp xác nhận: cùng kỳ, cùng sản lượng, cùng cơ cấu sản phẩm, có baseline đo được.

**Acceptance:**

- Before/after có cùng đơn vị và cùng kỳ so sánh.
- Không tự quy đổi % năng suất thành tiền nếu chưa có chi phí.
- Có phần “what would verify this in production”.

---

## 5. Data model và API contract

### 5.1. Entities

| Entity | Khóa | Trường chính |
|---|---|---|
| Operation | operation_id | name, sam_sec, predecessor_ids, machine_type, skill_code, skill_required, is_quality_gate, sequence |
| Worker | worker_id | name, skills, efficiency_factor, machine_types, available, worker_status |
| Machine | machine_id | machine_type, available, capacity |
| LineConfig | shift_id | shift_minutes, break_minutes, target_qty, working_days, allowance_pct, planned_efficiency, max_workers, objective |
| ProductionActuals | — | actual_output, actual_work_minutes, downtime_minutes, attendance_hc |
| HeadcountStandard | — | line_id, work_center, standard_hc, planned_hc, actual_hc |
| ReadinessItem | key | label, required, status, note |
| Scenario | id | name, request_json, result_json, created_at |

### 5.2. CSV/Excel schemas

**operations.csv**

```csv
operation_id,operation_name,sam_sec,predecessor_ids,machine_type,skill_code,skill_required,is_quality_gate,sequence
OP010,Kiểm tra nguyên phụ liệu,20,,MANUAL,INSPECTION,1,true,10
OP020,Ép mex cổ,28,OP010,IRON,FINISHING,2,false,20
```

**workers.csv**

```csv
worker_id,worker_name,available,worker_status,efficiency_factor,machine_types
W01,Nguyễn Thu Hà,true,ACTIVE,1.00,IRON
W03,Lê Hoàng Yến,true,ACTIVE,0.95,OVERLOCK|COVERSTITCH|SINGLE
```

**worker_skills.csv**

```csv
worker_id,operation_id,skill_grade
W03,OP030,A
W03,OP060,A
W07,OP030,B
```

**machines.csv**

```csv
machine_id,machine_type,available,capacity
OL-01,OVERLOCK,true,1
CS-01,COVERSTITCH,true,1
```

**shift_config.json**

```json
{
  "shift_id": "SHIFT_01",
  "shift_name": "Ca 1",
  "shift_minutes": 480,
  "break_minutes": 30,
  "target_qty": 420,
  "working_days": 5,
  "allowance_pct": 0.10,
  "planned_efficiency": 0.85,
  "max_workers": 24
}
```

### 5.3. API endpoints

| Method | Endpoint | Chức năng |
|---|---|---|
| GET | `/api/health` | Health + solver availability + data policy |
| GET | `/api/sample` | Sample OptimizeRequest |
| POST | `/api/optimize` | Chạy MILP, trả assignment + KPI + planning |
| POST | `/api/plan` | Capacity/HC planning (có thể gọi optimizer nội bộ) |
| POST | `/api/export` | Xuất XLSX |
| POST | `/api/readiness` | Tính readiness từ checklist |
| GET | `/api/scenarios` | Danh sách scenario |
| POST | `/api/scenarios` | Lưu scenario |
| GET | `/api/scenarios/{id}` | Load scenario |
| DELETE | `/api/scenarios/{id}` | Xóa scenario |

### 5.4. Solver statuses

| Status | Ý nghĩa | UI |
|---|---|---|
| `OPTIMAL` | Đã chứng minh tối ưu | Xanh, “Tối ưu” |
| `FEASIBLE_LIMIT` | Có nghiệm nhưng chưa chứng minh tối ưu do time limit | Vàng, “Nghiệm khả thi, chưa tối ưu” |
| `INFEASIBLE` | Không có nghiệm với ràng buộc hiện tại | Đỏ, gợi ý nới ràng buộc |
| `ERROR` | Lỗi dữ liệu/solver | Đỏ, log chi tiết |

**Quy tắc:** Không bao giờ trả `OPTIMAL` khi solver `TIME_LIMIT`.

### 5.5. Validation rules

| Rule | Mức |
|---|---|
| Duplicate operation/worker/machine ID | Error |
| SAM ≤ 0 | Error (Pydantic) |
| Missing predecessor | Error |
| Self-predecessor | Error |
| Precedence cycle | Error |
| No available worker | Error |
| max_workers ≤ 0 | Error |
| Operation has no eligible worker | Error |
| Required machine has no available capacity | Error |
| Operation effective time > takt | Warning (min_bottleneck) / Error (min_workers) |
| Single eligible worker | Warning |
| Worker has no qualified operation | Info |
| Machine capacity shared | Info |
| Max workers clamped | Info |

---

## 6. KPI dictionary

### 6.1. Bảng KPI

| Nhóm | KPI | Công thức | Unit | Nguồn | MVP |
|---|---|---|---|---|---|
| Line Balancing | Takt time | Net available seconds / target qty | s/pc | Shift config | Có |
| Line Balancing | Station standard workload | Σ SAM của operation tại station | s | Assignment | Có |
| Line Balancing | Station effective workload | Σ (SAM / efficiency × skill multiplier) | s | Assignment | Có |
| Line Balancing | Workload ratio | Effective workload / takt × 100 | % | Station | Có |
| Line Balancing | Line balancing efficiency | Total SAM / (stations used × bottleneck standard workload) × 100 | % | KPI engine | Có |
| Line Balancing | Skill-adjusted LBE | Total effective / (stations × bottleneck effective) × 100 | % | KPI engine | Có |
| Line Balancing | Balance delay | 100 - LBE | % | KPI engine | Có |
| Line Balancing | Smoothness index | sqrt(Σ(bottleneck - station load)²) | s | KPI engine | Có |
| Capacity | Capacity per shift | Net available seconds / bottleneck effective load | pcs | KPI engine | Có |
| Capacity | Production achievement | Actual output / target output × 100 | % | Actuals | Có |
| Capacity | Capacity achievement | Period capacity / period target × 100 | % | Planning | Có |
| Manpower | Required HC | Period target × garment SAM min / (available minutes × planned efficiency) | người | Planning | Có |
| Manpower | HC gap | Actual HC - standard HC | người | HC control | Có |
| Manpower | HC adherence | Actual HC / standard HC × 100 | % | HC control | Có |
| Manpower | Attendance | Attendance HC / actual HC × 100 | % | Actuals | Có |
| Labor | Labor efficiency (planned) | Total SAM / (stations × takt) × 100 | % | KPI engine | Có |
| Labor | Labor efficiency (actual) | Actual output × garment SAM min / actual work minutes × 100 | % | Actuals | Có |
| Labor | Output per operator | Capacity / workers used | pcs/người | KPI engine | Có |
| Machine | Machine allocation | Stations with machine type / available machines × 100 | % | Planning | Có |
| Machine | Machine gap | Required stations - available capacity | máy | Planning | Có |
| Machine | Machine utilization | (Available time - downtime) / available time × 100 | % | Downtime data | Roadmap |
| Quality | Defect rate | Defects / inspected × 100 | % | Quality data | Roadmap T19 |
| Quality | FPY | First pass / total × 100 | % | Quality data | Roadmap T19 |
| Material | Material variance | (Actual usage - standard usage) / standard usage × 100 | % | Material data | Roadmap T18 |
| Kaizen | Verified saving | Baseline cost - post cost - implementation cost | tiền | Cost data | Roadmap T20 |
| Safety | Action closure rate | Closed actions / total actions × 100 | % | Safety data | Roadmap T21 |

### 6.2. Ghi chú chất lượng dữ liệu

- **Machine allocation** chỉ là mức sử dụng vị trí máy theo phương án, không phải hiệu suất theo thời gian.
- **Labor efficiency actual** cần actual output và actual work minutes; nếu thiếu, chỉ hiển thị planned efficiency.
- **Capacity plan** là ước lượng cấp kế hoạch; **MILP capacity** là năng lực chi tiết theo bottleneck/skill/machine.
- **Verified saving** phải có baseline, cùng kỳ, cùng sản lượng; estimated saving chỉ là dự báo.
- **Protection pay** không được tính khi chưa có policy chính thức.

---

## 7. Work breakdown structure (WBS)

### 7.1. Task table

| ID | Task | Priority | Phụ thuộc | Output | Acceptance | Estimate |
|---|---|---|---|---|---|---|
| F01 | Repo, môi trường, CI skeleton | P0 | — | Repo chạy local | `npm run dev`, `uvicorn` chạy | 2h |
| F02 | Docs skeleton | P0 | — | SCOPE, DATA_DICTIONARY, MODEL, KPI_SPEC | Review được | 2h |
| T01 | Data Management | P0 | F01, F02 | Import + validation + sample CSV | Import 40/24/23, chặn dữ liệu sai | 1 ngày |
| T02a | MILP formulation | P0 | T01 | MODEL.md + small example | Hand-check khớp | 0.5 ngày |
| T02b | Optimizer PuLP/HiGHS | P0 | T02a | Solver + tests | Sample solve, constraints pass | 1.5 ngày |
| T03 | Capacity Planning | P0 | T02b | Capacity plan + machine gap | Formula test khớp | 0.5 ngày |
| T04 | HC & Skill Management | P0 | T02b | HC control + skill matrix + transfer | Gap/adherence/coverage đúng | 0.5 ngày |
| T05 | KPI Dashboard | P0 | T02b, T03, T04 | KPI cards + charts + export | KPI khớp backend | 1 ngày |
| T06 | New Style & Process Flow | P0 | T01, T02b | Readiness + DAG | Flow khớp assignment | 1 ngày |
| D01 | Integration & Deploy | P0 | T05, T06 | Netlify + Render + Postgres | Public URL + health 200 | 1 ngày |
| D02 | Testing & benchmark | P0 | D01 | Test suite + RESULTS.md | Acceptance checklist pass | 0.5 ngày |
| D03 | Interview package | P1 | D02 | 5 deliverables + demo script | Demo 7 phút chạy được | 0.5 ngày |
| C07 | Quality RCA case study | P1 | T02 | Report | Pareto + fishbone + before/after | 0.5 ngày |
| C08 | Kaizen case study | P1 | T02 | Report | Before/after + verified saving | 0.5 ngày |

### 7.2. Chi tiết task T01–T06

#### T01 — Data Management

- Thiết kế CSV/Excel templates.
- Viết parser + normalization.
- Viết validation (backend) và hiển thị lỗi (frontend).
- Sample data 40 operations / 24 workers / 23 machines.
- Test: duplicate ID, SAM âm, missing predecessor, cycle, missing skill, missing machine.

#### T02 — Line Balancing

- Viết `MODEL.md` với biến, ràng buộc, objective, ví dụ tay.
- Viết `optimizer.py` dùng `pulp.COIN_CMD`, `add_variable_dicts`.
- Xử lý status: OPTIMAL / FEASIBLE_LIMIT / INFEASIBLE / ERROR.
- Test: precedence, skill, machine, worker uniqueness, assignment uniqueness, known optimum.
- Benchmark 50 ops / 25 workers.

#### T03 — Capacity Planning

- Viết `planning.py` pure functions.
- Tính required HC, capacity, gap, machine requirement.
- Test hand calculation.
- UI card + what-if.

#### T04 — HC & Skill

- HC standard/planned/actual/optimized.
- Attendance.
- Skill coverage + single point of failure.
- Transfer suggestion.
- Test gap/adherence/coverage.

#### T05 — KPI Dashboard

- KPI cards.
- Workload chart với takt line.
- Bottleneck panel.
- Scenario comparison.
- Export CSV/XLSX.
- Test KPI formulas.

#### T06 — New Style & Process Flow

- Style form + routing.
- Readiness checklist.
- Readiness calculation + gate.
- DAG layout từ precedence.
- Before/after flow.
- Test readiness gate + flow edges.

---

## 8. Kế hoạch 8 ngày

### 8.1. Day-by-day

| Ngày | Buổi | Việc chính | Deliverable | Gate |
|---|---|---|---|---|
| **Day 1** | Sáng | T01: CSV/Excel templates, data dictionary, validation | `DATA_DICTIONARY.md`, sample CSV | Import 40/24/23 thành công |
|  | Chiều | T01: UI import + error table; repo + deploy hello world | Data tab chạy, health URL | Dữ liệu sai bị chặn |
| **Day 2** | Sáng | T02a: MILP formulation, small example | `MODEL.md` | Hand-check nghiệm nhỏ |
|  | Chiều | T02a: KPI spec, test skeleton | `KPI_SPEC.md` | Công thức khớp ví dụ tay |
| **Day 3** | Sáng | T02b: PuLP/HiGHS optimizer, status handling | `optimizer.py` | Sample solve |
|  | Chiều | T02b: test precedence/skill/machine/assignment | Test suite | Core constraints pass |
| **Day 4** | Sáng | T03: capacity + machine requirement | `planning.py` | Formula test pass |
|  | Chiều | T04: HC control + skill coverage + transfer | Planning tab | Gap/adherence đúng |
| **Day 5** | Sáng | T05: KPI cards + workload chart | Dashboard tab | KPI khớp backend |
|  | Chiều | T05: bottleneck + scenario compare + export | Dashboard MVP | Export chạy |
| **Day 6** | Sáng | T06: new style form + readiness checklist | New Style tab | Readiness gate đúng |
|  | Chiều | T06: process flow DAG before/after | Flow view | Flow khớp assignment |
| **Day 7** | Sáng | Integration: API proxy, CORS, Postgres scenarios | Staging URL | Health 200 |
|  | Chiều | Deploy Netlify + Render + smoke test | Public URL | Public URL chạy |
| **Day 8** | Sáng | T07/T08 case studies; E2E test; benchmark | Case study docs, RESULTS.md | Acceptance pass |
|  | Chiều | README, demo video/script, CV bullets | Interview package | Demo 7 phút |

### 8.2. Gates

| Gate | Thời điểm | Điều kiện |
|---|---|---|
| G1 — Data | End Day 1 | Import + validation + sample data pass |
| G2 — Model | End Day 2 | MODEL.md + hand example + KPI spec |
| G3 — Solver | End Day 3 | Sample solve + core tests pass |
| G4 — Planning | End Day 4 | T03/T04 formulas pass |
| G5 — Dashboard | End Day 5 | KPI + workload + export |
| **G6 — MVP** | **End Day 6** | **T01–T06 chạy end-to-end local** |
| G7 — Deploy | End Day 7 | Public URL + health + optimize |
| G8 — Acceptance | End Day 8 | Test, benchmark, docs, demo |

### 8.3. Cut lines

Nếu trễ, cắt theo thứ tự:

1. Process flow nâng cao → chỉ giữ readiness checklist.
2. Transfer suggestion → giữ skill coverage.
3. Scenario comparison → giữ single-run dashboard.
4. T04 skill heatmap → giữ HC gap/adherence.
5. T03 machine requirement table → giữ required HC/capacity.

**Không cắt:**

- MILP correctness.
- Validation.
- Test core constraints.
- Public URL.
- Export.
- README/benchmark.

### 8.4. Daily checklist

- [ ] Code chạy local.
- [ ] Test mới/cũ pass.
- [ ] Không hard-code dữ liệu thật.
- [ ] Cập nhật docs nếu API/schema đổi.
- [ ] Ghi lại benchmark nếu có thay đổi solver.
- [ ] Commit message rõ ràng.

---

## 9. Testing và benchmark

### 9.1. Test matrix

| File | Nội dung |
|---|---|
| `test_validation.py` | Duplicate ID, SAM, predecessor, cycle, max_workers, no worker, no machine |
| `test_precedence.py` | A trước B, cycle rejected, station order |
| `test_skill_constraints.py` | Worker thiếu skill không được gán, grade A/B/C |
| `test_machine_constraints.py` | Machine required, capacity, worker certification |
| `test_optimizer.py` | Assignment uniqueness, worker uniqueness, known optimum, min_workers, min_bottleneck |
| `test_kpis.py` | Takt, LBE, balance delay, capacity, smoothness |
| `test_planning.py` | Required HC, capacity, HC gap, machine gap |
| `test_readiness.py` | Readiness %, gate |
| `test_api.py` | Health, sample, optimize, export, scenarios |
| `test_status.py` | OPTIMAL / FEASIBLE_LIMIT / INFEASIBLE / ERROR mapping |

### 9.2. Test cases

| ID | Dữ liệu | Kỳ vọng |
|---|---|---|
| TC01 | 5 operations, đủ worker | Có nghiệm hợp lệ |
| TC02 | Operation không có worker đủ skill | DATA_ERROR, không gán sai |
| TC03 | Machine bắt buộc không available | DATA_ERROR hoặc INFEASIBLE phù hợp |
| TC04 | A → B | station(A) ≤ station(B) |
| TC05 | SAM âm | Validation reject |
| TC06 | Worker vắng mặt | Không được gán |
| TC07 | Trùng worker ID | Validation reject |
| TC08 | Station vượt takt | Warning bottleneck |
| TC09 | Solver time limit có nghiệm | FEASIBLE_LIMIT |
| TC10 | Bài toán nhỏ có optimum biết trước | Khớp nghiệm tham chiếu |
| TC11 | max_workers = 1, total SAM > takt | INFEASIBLE (min_workers) |
| TC12 | Machine capacity = 1, 2 operation cùng machine | Không thể tạo 2 station cùng machine |

### 9.3. Benchmark protocol

**Data:** 50 operations / 25 workers / 23 machines / 5 machine types.

**Đo:**

- Solver execution time.
- API response time (warm).
- Cold start time (Render free).
- Solver status.
- Objective value / gap nếu có.
- Số station, workers used, bottleneck.

**Môi trường:**

- Local: Windows, Python 3.14, PuLP 4.2, HiGHS.
- Deploy: Render Linux, Python 3.12.8, HiGHS.

**Ghi vào:** `benchmarks/RESULTS.md`.

**Target:**

- 5 giây là **mục tiêu benchmark**, không phải cam kết.
- 20 giây là time limit mặc định.
- Nếu solver không đạt, ghi rõ và đề xuất: warm start, tighter formulation, hoặc giảm station count.

### 9.4. Acceptance checklist

- [ ] Public URL HTTPS.
- [ ] `/api/health` 200 + solver available.
- [ ] Import CSV/Excel operations/workers/skills/machines.
- [ ] Validation chặn dữ liệu sai.
- [ ] Mỗi operation gán đúng 1 station.
- [ ] Worker không ở 2 station.
- [ ] Không vi phạm skill/machine/precedence.
- [ ] KPI đúng công thức.
- [ ] Bottleneck đúng.
- [ ] API phân biệt 4 status.
- [ ] Frontend có loading/error/timeout.
- [ ] CSV/XLSX export.
- [ ] Benchmark 50/25.
- [ ] README synthetic data.
- [ ] Postgres scenario save/load.
- [ ] Qdrant/MinIO không bắt buộc.

---

## 10. Deployment

### 10.1. Netlify

`netlify.toml`:

```toml
[build]
  base = "frontend"
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/api/*"
  to = "https://linebalance-api.onrender.com/api/:splat"
  status = 200
  force = true

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

**Lưu ý:** Với `base = "frontend"`, publish directory là `dist`, không phải `frontend/dist`.

### 10.2. Render

`render.yaml`:

```yaml
services:
  - type: web
    name: linebalance-api
    runtime: python
    plan: free
    rootDir: backend
    buildCommand: pip install -r requirements.txt
    startCommand: uvicorn app.main:app --host 0.0.0.0 --port $PORT
    healthCheckPath: /api/health
    envVars:
      - key: PYTHON_VERSION
        value: 3.12.8
      - key: FRONTEND_ORIGINS
        value: http://localhost:5173,http://127.0.0.1:5173
      - key: DATABASE_URL
        sync: false
```

### 10.3. PostgreSQL 16

- Provider: Neon/Supabase/Render Postgres.
- `DATABASE_URL` dạng `postgresql+psycopg://...`.
- Startup: `Base.metadata.create_all()`.
- Table: `scenarios`.
- Fallback: nếu không có DB, optimize vẫn chạy; scenario lưu localStorage.

### 10.4. Env vars

| Biến | Nơi dùng | Giá trị |
|---|---|---|
| `FRONTEND_ORIGINS` | Backend CORS | `http://localhost:5173,https://your-site.netlify.app` |
| `DATABASE_URL` | Backend | PostgreSQL connection string |
| `VITE_API_BASE` | Frontend | `/api` (mặc định) |
| `ENABLE_QDRANT` | Backend | `false` (MVP) |
| `ENABLE_MINIO` | Backend | `false` (MVP) |

### 10.5. Smoke test

1. `GET /api/health` → 200, solver available.
2. `GET /api/sample` → 200.
3. `POST /api/optimize` với sample → 200, status.
4. `POST /api/export` → file XLSX mở được.
5. `GET /` Netlify → app load.
6. Netlify `/api/health` → proxy đúng.
7. Postgres scenario save/load.

### 10.6. Rollback

- Netlify: deploy previous build.
- Render: rollback previous deploy.
- DB: không có migration phức tạp; scenario JSONB giữ nguyên.

---

## 11. Bộ sản phẩm khi đi phỏng vấn

### 11.1. Năm deliverables

| # | Deliverable | File/URL | Trạng thái |
|---|---|---|---|
| 1 | Public demo | Netlify URL | Bắt buộc |
| 2 | Technical documentation | `SCOPE.md`, `DATA_DICTIONARY.md`, `MODEL.md`, `KPI_SPEC.md`, `ARCHITECTURE.md` | Bắt buộc |
| 3 | Before/After Line Balancing Report | `docs/BEFORE_AFTER_REPORT.md` | Bắt buộc |
| 4 | Production Planning Case Study | `docs/CASE_STUDY_PRODUCTION_PLANNING.md` | Bắt buộc |
| 5 | IE Improvement Case Study | `docs/CASE_STUDY_QUALITY_RCA.md`, `docs/CASE_STUDY_KAIZEN.md` | Lợi thế |

### 11.2. Demo script 7 phút

1. **Bài toán (1 phút):** chuyền may 40 operations, 24 workers, 23 machines; mục tiêu 420 pcs/shift.
2. **Data (1 phút):** import CSV, validation bắt lỗi thiếu skill/machine.
3. **Optimize (2 phút):** chạy MILP, xem trước/sau, workload chart, bottleneck, solver status.
4. **Planning (1 phút):** required HC, capacity, HC gap, machine gap.
5. **Workforce (1 phút):** standard HC vs actual, skill heatmap, transfer suggestion.
6. **New style (1 phút):** readiness checklist, process flow.
7. **Case study (30 giây):** quality RCA/kaizen before/after.

### 11.3. CV bullets

- Built a MILP-based garment line balancing web app (React/FastAPI/PuLP-HiGHS) that assigns 40+ operations to stations under precedence, skill, and machine constraints.
- Designed KPI engine for takt, line balancing efficiency, bottleneck workload, capacity, and manpower gap; validated with pytest and benchmarked 50 operations / 25 workers.
- Deployed a public demo on Netlify + Render + PostgreSQL; documented data dictionary, MILP formulation, and before/after line balancing report.
- Added capacity planning and standard HC control modules to connect line balancing with production planning and manpower decisions.

### 11.4. Câu hỏi phỏng vấn cần chuẩn bị

- Vì sao dùng MILP thay vì heuristic?
- Vì sao chọn `min Cmax` / `min workers`? Khi nào dùng cái nào?
- Làm sao đảm bảo precedence/skill/machine?
- Làm sao xử lý infeasible? Làm sao phân biệt data error và model infeasible?
- Làm sao benchmark và biết solver có tối ưu?
- KPI nào là planned, KPI nào là actual?
- Machine allocation khác machine utilization thế nào?
- Nếu dữ liệu thật bẩn thì xử lý ra sao?
- Giới hạn của mô hình hiện tại là gì?

---

## 12. Risk register

| Risk | Impact | Likelihood | Mitigation |
|---|---|---|---|
| Solver timeout với 40–50 ops | Cao | Trung bình | Warm start/greedy initial, tighter load formulation, giảm station count, benchmark HiGHS |
| Render cold start | Trung bình | Cao | Hiển thị loading, health check, ghi rõ cold start trong README |
| Postgres free tier hết hạn | Trung bình | Trung bình | Neon/Supabase free, fallback localStorage, export JSON |
| Netlify proxy/CORS | Trung bình | Trung bình | Test `/api/health` qua Netlify, cấu hình `FRONTEND_ORIGINS` |
| Scope creep T13–T22 | Cao | Cao | Roadmap only; cut lines; MVP gate Day 6 |
| Dữ liệu skill/machine không đủ | Cao | Trung bình | Validation rõ, sample synthetic, cảnh báo single point |
| Frontend trễ | Cao | Trung bình | Component reuse, dashboard trước, flow sau |
| Model infeasible do takt | Trung bình | Trung bình | Phân biệt data/model error, gợi ý nới ràng buộc |
| KPI sai semantics | Cao | Trung bình | KPI_SPEC + unit tests + review |
| Public data privacy | Cao | Thấp | Chỉ synthetic, không tên thật/lương/thông tin cá nhân |
| Qdrant/MinIO gây phức tạp | Trung bình | Trung bình | Defer, docker-compose only, feature flag |
| Benchmark không đạt 5s | Trung bình | Trung bình | Ghi rõ target vs actual, tối ưu model, báo cáo trung thực |

### 12.1. Assumptions

- Một factory, một style, một line, một shift trong MVP.
- Mỗi station một worker, mỗi worker một station.
- Một station một machine type.
- Không có parallel workers/machines cho cùng operation.
- Dữ liệu public là synthetic.
- Không có auth/HR/MES integration trong MVP.
- PostgreSQL chỉ lưu scenario, không phải system of record.

### 12.2. Open questions

- Có cần multi-line trong demo không?
- Có cần Excel import thật hay CSV đủ?
- Có cần tiếng Việt + tiếng Anh không?
- Có cần lưu scenario bằng Postgres trong demo hay localStorage đủ?
- Có cần process flow interactive (zoom/drag) hay static SVG đủ?
- Có cần benchmark trên Render Linux hay local đủ?

---

## 13. Roadmap mở rộng sau MVP

### 13.1. Phase 2 — Planning & standardization (2–3 tuần)

| Task | Nội dung | Data cần | Architecture impact | Estimate |
|---|---|---|---|---|
| T15 | Machine Capacity & Line Moving | Machine master, line config, changeover | Scenario compare, machine gap | 1–1.5 tuần |
| T16 | New Style Readiness | Checklist, style master | Có thể localStorage hoặc Postgres | 3–5 ngày |
| T18 | Material Standard Consumption | Material master, BOM, actual usage | Bảng material, import CSV | 1–1.5 tuần |

### 13.2. Phase 3 — Quality, kaizen, safety, protection pay (3–4 tuần)

| Task | Nội dung | Data cần | Architecture impact | Estimate |
|---|---|---|---|---|
| T19 | Quality RCA | Defect, operation, root cause, action | Bảng defect/action; Qdrant optional | 1.5–2 tuần |
| T20 | Kaizen & Cost Saving | Project, baseline/after KPI, cost | Bảng project; workflow | 1–1.5 tuần |
| T21 | Safety Tracking | Checklist, hazard, action | Bảng safety; workflow | 1 tuần |
| T22 | Protection Pay Support | HR policy, eligibility, approval | Cần policy chính thức; không tự đặt công thức | Chờ policy |

### 13.3. Phase 4 — Scale

- Multi-line, multi-plant.
- MES/ERP/HR integration.
- Real-time monitoring.
- Auth/RBAC.
- Qdrant semantic search.
- MinIO document/file storage.
- ML/DL productivity prediction.
- CAD/layout editor.
- Advanced Pareto/NSGA-II multi-objective.

### 13.4. Infrastructure roadmap

| Service | Phase | Use case |
|---|---|---|
| PostgreSQL 16 | MVP | Scenarios, runs |
| Qdrant | Phase 2/3 | Semantic search quality/material/kaizen |
| MinIO | Phase 2/3 | CSV/XLSX, documents, layout files, defect images |
| Auth | Phase 3 | Multi-user, real data |
| Redis | Phase 4 | Cache, job queue |
| Worker queue | Phase 4 | Long optimization jobs |

---

## 14. Definition of Done

Một task được coi là Done khi:

- [ ] Code chạy local.
- [ ] Có test cho logic chính.
- [ ] API/schema được cập nhật trong docs.
- [ ] UI hiển thị loading/error/empty state.
- [ ] Không hard-code dữ liệu thật.
- [ ] Có acceptance evidence (screenshot/log/benchmark).
- [ ] Đã review KPI semantics.
- [ ] Đã commit với message rõ ràng.

MVP Done khi:

- [ ] T01–T06 chạy end-to-end.
- [ ] Public URL hoạt động.
- [ ] Test suite pass.
- [ ] Benchmark có kết quả.
- [ ] 5 deliverables sẵn sàng.
- [ ] Demo script chạy trong 7 phút.
- [ ] README ghi rõ synthetic data và giới hạn.

---

## 15. Appendix

### 15.1. Glossary

| Thuật ngữ | Ý nghĩa |
|---|---|
| SAM | Standard Allowed Minute — thời gian chuẩn cho một công đoạn |
| Takt time | Nhịp sản xuất cần thiết để đạt target |
| LBE | Line Balancing Efficiency |
| Bottleneck | Trạm có workload lớn nhất |
| HC | Headcount — số lao động |
| FPY | First Pass Yield |
| Precedence | Quan hệ công đoạn trước–sau |
| MILP | Mixed Integer Linear Programming |
| CBC | COIN-OR Branch and Cut solver |
| Feasible | Có nghiệm thỏa mọi ràng buộc |
| Optimal | Đã chứng minh tốt nhất theo objective |

### 15.2. References

- PuLP documentation: `pulp[cbc]`, `COIN_CMD`, `LpSolveStatus`.
- Netlify build configuration và redirects/proxies.
- Render Blueprint YAML và free tier limitations.
- HBI Shift Line Engineer JD (do người dùng cung cấp).
- Nội bộ: `PROPOSAL.md`, `DEPLOYMENT.md`, `SCOPE.md`, `DATA_DICTIONARY.md`, `MODEL.md`, `KPI_SPEC.md`.

### 15.3. Nguyên tắc cập nhật roadmap

- Roadmap này là living document.
- Mọi thay đổi scope phải cập nhật: task table, 8-day plan, acceptance, risk.
- Không thêm module mới vào MVP nếu chưa cắt module khác hoặc chưa có thêm thời gian.
- Mọi KPI mới phải có công thức + data source + test trước khi lên dashboard.

---

> **Kết luận:** Giá trị của LineBalance Pro không nằm ở số lượng module, mà ở chỗ nó chứng minh được một chuỗi hoàn chỉnh: dữ liệu sản xuất → mô hình MILP → phương án cân bằng → KPI → kế hoạch năng lực → định biên → báo cáo → triển khai. Đây là câu chuyện phù hợp nhất với vị trí Shift Line Engineer tại HBI.
