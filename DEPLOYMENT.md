# Kế hoạch 8 ngày & deploy Netlify — LineBalance Pro

> **Cập nhật trạng thái triển khai — 2026-11-02:**
>
> - **Phương án A đã chọn:** Netlify React/TypeScript frontend + FastAPI backend trên Render.
> - **Solver chính:** HiGHS 1.15.1 qua `pulp.HiGHS`; CBC chỉ là fallback tùy chọn (`SOLVER_BACKEND=cbc`).
> - **Render:** `rootDir: backend`, build `pip install -r requirements.txt`, start `uvicorn app.main:app`.
> - **Netlify:** `base = "frontend"`, `publish = "dist"` (Netlify resolve relative to base, không phải `frontend/dist`).
> - **Kết quả đo thật:** 40 operations / 24 workers → `OPTIMAL` 58.0s, 23 stations, ~28s; 26 workers / target 400 → `OPTIMAL` 56.0s, 25 stations, ~42s. Không dùng heuristic làm kết quả cuối.
> - **Dữ liệu:** synthetic demo only; không có dữ liệu HBI thật.

> **Kết luận nhanh:** Netlify **không chạy được Streamlit** và không phải môi trường phù hợp để chạy PuLP/HiGHS dạng server Python liên tục. Với 8 ngày, có 3 hướng:
>
> 1. **Netlify frontend + FastAPI/PuLP backend** — giữ được lõi OR, app public trên Netlify. **Khuyến nghị nếu mục tiêu là CV IE/OR.**
> 2. **All-in Netlify: React/TS + heuristic optimizer chạy trong browser** — deploy 1 nơi, nhanh, nhưng mất PuLP/MILP.
> 3. **Streamlit Community Cloud + Netlify landing page** — nhanh nhất, nhưng app thật không nằm trên Netlify.
>
> Đừng cố deploy Streamlit lên Netlify. Nó sẽ không chạy.

---

## 1. Netlify thực tế làm được gì?

Netlify mạnh về:

- Static site / SPA (React, Vite, Next.js static, Astro...).
- Serverless Functions viết bằng **JavaScript/TypeScript hoặc Go**.
- Edge Functions (JS/TS).
- Forms, Blobs, Database, deploy previews, CDN.

Netlify **không** phù hợp để:

- Chạy Streamlit (cần web server + websocket liên tục).
- Chạy FastAPI/Flask/Django dạng server thường trực.
- Chạy PuLP/CBC với binary native trong serverless function.
- Chạy tác vụ tối ưu dài hơn giới hạn thời gian của function.

Vì vậy, câu hỏi không phải “làm sao deploy Streamlit lên Netlify”, mà là:

> **Chọn kiến trúc nào để có một app web nhỏ, public trên Netlify, và vẫn giữ được giá trị của project?**

---

## 2. Ba phương án

| Tiêu chí | A. Netlify + FastAPI/PuLP | B. All-in Netlify (client-side) | C. Streamlit Cloud + Netlify landing |
|---|---|---|---|
| App thật nằm ở đâu | Netlify frontend, API trên Render/Railway | Toàn bộ trên Netlify | Streamlit Cloud |
| Giữ được PuLP/MILP | Có | Không (heuristic JS) | Có |
| Độ khó trong 8 ngày | Trung bình–cao | Trung bình | Thấp |
| Deploy | 2 nơi | 1 nơi | 2 nơi |
| Cold start | Có (Render free) | Không | Có |
| CV impact | Cao: full-stack + OR | Cao: frontend + thuật toán | Trung bình: quen thuộc |
| Rủi ro | API/CORS/deploy | Thuật toán JS | Không đúng yêu cầu Netlify |
| Khuyến nghị | **Nếu muốn giữ OR** | **Nếu muốn đúng Netlify** | **Nếu deadline gấp** |

---

## 3. Phương án A — Netlify frontend + FastAPI/PuLP backend

### 3.1. Kiến trúc

```text
┌──────────────────────────────────────────────┐
│ Browser                                      │
│ React + Vite + TypeScript + Tailwind         │
│ Recharts/Plotly, PapaParse, SheetJS          │
│                                              │
│ fetch("/api/optimize")                       │
└──────────────────────┬───────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────┐
│ Netlify                                      │
│ - Static build (frontend/dist)               │
│ - Redirect /api/* → Render API               │
│ - SPA fallback /* → /index.html              │
└──────────────────────┬───────────────────────┘
                       │ proxy
                       ▼
┌──────────────────────────────────────────────┐
│ Render / Railway / Fly.io                    │
│ FastAPI + Uvicorn                            │
│ - /api/health                                │
│ - /api/optimize                              │
│ - /api/export                                │
│ PuLP/HiGHS, Pandas, OpenPyXL                 │
└──────────────────────────────────────────────┘
```

**Ưu điểm:**

- Giữ được mô hình MILP/PuLP — lõi giá trị của project.
- Frontend trên Netlify có domain đẹp, deploy preview, CDN.
- Có thể gọi API qua `/api/*` cùng origin, tránh CORS.
- Thể hiện được tư duy full-stack: frontend, API, optimizer, deploy.

**Nhược điểm:**

- Phải quản lý 2 deployment.
- Render free tier có cold start (15 phút không dùng → ngủ).
- Cần xử lý loading/error/timeout.

### 3.2. Repo structure

```text
linebalance-pro/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── KpiCards.tsx
│   │   │   ├── WorkloadChart.tsx
│   │   │   ├── AssignmentTable.tsx
│   │   │   ├── SkillMatrix.tsx
│   │   │   └── WarningPanel.tsx
│   │   ├── lib/
│   │   │   ├── api.ts
│   │   │   ├── types.ts
│   │   │   └── csv.ts
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
│   │   └── kpis.py
│   ├── requirements.txt
│   └── render.yaml
├── data/
│   ├── operations_sample.csv
│   └── workers_sample.csv
├── netlify.toml
└── README.md
```

### 3.3. `netlify.toml`

```toml
[build]
  base = "frontend"
  command = "npm run build"
  publish = "dist"

# API proxy: /api/optimize → https://linebalance-api.onrender.com/api/optimize
[[redirects]]
  from = "/api/*"
  to = "https://linebalance-api.onrender.com/api/:splat"
  status = 200
  force = true

# SPA fallback
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

**Lưu ý:**

- Đặt redirect `/api/*` **trước** `/*`.
- Nếu dùng custom domain, cập nhật `allow_origins` trong FastAPI.
- Proxy giúp browser gọi `/api/...` cùng origin, không cần CORS.

### 3.4. FastAPI skeleton

```python
# backend/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .models import OptimizeRequest, OptimizeResponse
from .optimizer import solve_line_balancing

app = FastAPI(title="LineBalance API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://your-site.netlify.app",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
def health():
    return {"status": "ok"}

@app.post("/api/optimize", response_model=OptimizeResponse)
def optimize(req: OptimizeRequest):
    return solve_line_balancing(req)
```

```python
# backend/app/optimizer.py
import pulp

def solve_line_balancing(req):
    prob = pulp.LpProblem("line_balancing", pulp.LpMinimize)
    # ... build variables/constraints
    solver = pulp.HiGHS(msg=False, timeLimit=60, threads=2, warmStart=True)
    prob.solve(solver)
    # ... return assignment, kpis, warnings, solver_status
```

### 3.5. `render.yaml`

```yaml
services:
  - type: web
    name: linebalance-api
    runtime: python
    plan: free
    buildCommand: pip install -r requirements.txt
    startCommand: uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

`requirements.txt`:

```text
fastapi
uvicorn[standard]
pulp[cbc]
highspy==1.15.1
pandas
openpyxl
pydantic
```

### 3.6. Frontend API client

```ts
// frontend/src/lib/api.ts
export async function optimize(payload: OptimizeRequest) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 90_000);

  try {
    const res = await fetch("/api/optimize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.detail ?? `API error ${res.status}`);
    }

    return await res.json();
  } finally {
    clearTimeout(timeout);
  }
}
```

**Cold start handling:**

- Khi app mount, gọi `/api/health` để đánh thức backend.
- Hiển thị: "Đang đánh thức server, lần đầu có thể mất 30–60 giây..."
- Nếu quá 90 giây, hiện nút "Thử lại".
- Trước demo, mở app trước 2–3 phút để warm up.

### 3.7. Lịch 8 ngày — Phương án A

| Ngày | Việc chính | Output | Điều kiện hoàn thành |
|---|---|---|---|
| **Day 1** | Chốt scope, data model, sample data, repo, FastAPI skeleton, React shell. Deploy "hello world" lên Netlify + Render sớm. | Repo, `/api/health`, trang Netlify | Public URL chạy, API health OK |
| **Day 2** | Optimizer PuLP: precedence, takt, skill, machine; validation; test. | `optimizer.py`, `validation.py`, pytest | Case 30 ops/10 workers đúng constraints |
| **Day 3** | API `/api/optimize`, response schema, error handling; nối frontend gọi API. | End-to-end optimize | Nhập liệu → bấm optimize → nhận JSON |
| **Day 4** | UI nhập liệu: bảng operations, workers, CSV upload, takt calculator. | Input tab | CSV mẫu import được; validation hiển thị |
| **Day 5** | Dashboard kết quả: KPI cards, workload chart, assignment table, bottleneck warnings. | Results tab | Biểu đồ đúng, bottleneck highlight |
| **Day 6** | Skill Matrix heatmap, what-if 2–3 kịch bản, export CSV/Excel. | Skill + What-if + Export | So sánh được baseline vs optimized |
| **Day 7** | Deploy production: Netlify proxy, Render env, CORS, responsive, loading/error states, warm-up. | Public app | Chạy được trên mobile + desktop |
| **Day 8** | Test cuối, README, demo video 3 phút, CV bullets, rehearsal. | README + video | Demo trơn tru, không lỗi |

### 3.8. Scope cắt nếu chậm

Cắt theo thứ tự:

1. What-if nâng cao → chỉ giữ 2 kịch bản.
2. Excel export → CSV.
3. Skill heatmap → bảng skill.
4. Shift KPI scorecard → 4 KPI cơ bản.
5. Precedence flow diagram → bảng station sequence.

**Không cắt:**

- Optimizer core.
- Validation.
- Workload chart.
- Bottleneck warning.
- Public URL.
- README.

### 3.9. Acceptance criteria

- [ ] Netlify URL public, HTTPS.
- [ ] API health check OK.
- [ ] 40 công đoạn / 24 công nhân chứng minh `OPTIMAL` trong ≤ 60 giây.
- [ ] 26 công nhân / target 400 chứng minh `OPTIMAL` trong ≤ 60 giây.
- [ ] Cold start có loading state, không treo UI.
- [ ] Infeasible có thông báo nguyên nhân + gợi ý.
- [ ] Mobile responsive.
- [ ] Export CSV/Excel hoạt động.
- [ ] README có kiến trúc, cách chạy local, cách deploy.
- [ ] Không lộ API key/secret trong frontend.
- [ ] Ghi rõ dữ liệu là synthetic.

### 3.10. Rủi ro & cách giảm

| Rủi ro | Cách giảm |
|---|---|
| Render free tier ngủ | Warm-up `/api/health`; loading state; demo sớm |
| Netlify proxy sai | Test `/api/health` qua domain Netlify trước |
| CORS | Dùng proxy; chỉ cần CORS cho localhost |
| Solver timeout | HiGHS + warm start; `timeLimit=60`; trả `FEASIBLE_LIMIT` trung thực, không lấy heuristic làm kết quả cuối |
| API trả JSON quá lớn | Chỉ trả assignment + KPI, không trả toàn bộ log |
| Frontend chậm | Code splitting, tránh import cả Plotly nếu không cần |
| Deploy lỗi | Deploy sớm từ Day 1, không để Day 8 |
| Scope creep | Đóng băng 5 tab; mọi ý mới vào roadmap |

---

## 4. Phương án B — All-in Netlify (client-side)

### 4.1. Kiến trúc

```text
┌──────────────────────────────────────────────┐
│ Netlify static site                          │
│ React + Vite + TypeScript + Tailwind         │
│                                              │
│ Input → Optimizer (Web Worker) → Dashboard   │
│ - Greedy + Local Search                      │
│ - Optional: glpk.js nếu muốn MILP            │
└──────────────────────────────────────────────┘
```

Không backend. Toàn bộ chạy trong browser.

### 4.2. Thuật toán client-side

Vì không có PuLP/CBC, dùng heuristic:

1. **Topological sort** công đoạn theo precedence.
2. **Greedy assignment**: xếp công đoạn vào trạm theo thứ tự, tôn trọng takt + skill + machine.
3. **Local search**: thử move/swap công đoạn giữa trạm để giảm số trạm, giảm bottleneck, giảm idle.
4. **KPI engine**: tính efficiency, balance delay, smoothness, bottleneck.
5. **Web Worker**: chạy optimizer nền, không block UI.

**Ưu điểm:**

- Deploy 1 nơi, không cold start, không CORS, không server cost.
- App load nhanh, phù hợp "small web app".
- Thể hiện được frontend + thuật toán.

**Nhược điểm:**

- Không còn PuLP/MILP; khó claim "exact optimization".
- Heuristic có thể không tối ưu.
- Nếu muốn MILP trong browser, phải dùng `glpk.js` — thêm rủi ro.

### 4.3. Lịch 8 ngày — Phương án B

| Ngày | Việc chính |
|---|---|
| Day 1 | Setup Vite/React/TS/Tailwind, data model, sample data, UI shell |
| Day 2 | Input tables, CSV upload, validation, takt calculator |
| Day 3 | Greedy + local search optimizer, unit test |
| Day 4 | KPI engine, workload chart, assignment table |
| Day 5 | Skill matrix, bottleneck warnings, what-if |
| Day 6 | Export CSV/Excel, polish UI, responsive |
| Day 7 | Deploy Netlify, fix build, test production |
| Day 8 | README, demo video, CV, rehearsal |

### 4.4. Khi nào chọn B?

- Bạn muốn **đúng nghĩa toàn bộ app trên Netlify**.
- Bạn không muốn quản lý backend/cold start.
- Bạn chấp nhận đổi PuLP/MILP sang heuristic.
- Bạn muốn thể hiện kỹ năng frontend.

---

## 5. Phương án C — Streamlit Cloud + Netlify landing page

### 5.1. Kiến trúc

```text
Netlify: landing page giới thiệu project
   └── Button / iframe → Streamlit Community Cloud app
```

- Streamlit app deploy trên Streamlit Community Cloud.
- Netlify chỉ host landing page/portfolio.
- Có thể thử nhúng bằng `?embed=true`, nhưng cần test.

**Ưu điểm:**

- Nhanh nhất, giữ Streamlit/PuLP.
- Không cần viết frontend mới.

**Nhược điểm:**

- App thật không nằm trên Netlify.
- Streamlit Cloud có giới hạn tài nguyên, cold start.
- Khó tùy biến UI hơn React.

### 5.2. Khi nào chọn C?

- Deadline 8 ngày quá gấp.
- Bạn muốn giữ Streamlit và chỉ cần một portfolio page trên Netlify.
- Bạn chấp nhận câu chuyện "Netlify landing page + Streamlit app".

---

## 6. Khuyến nghị cho 8 ngày

### Nếu mục tiêu là CV HBI Shift Line Engineer

Chọn **Phương án A**:

> **Netlify frontend + FastAPI/PuLP backend**

Vì:

- Giữ được lõi OR/MILP — thứ tạo khác biệt so với một app CRUD.
- Có câu chuyện full-stack: React → Netlify → FastAPI → PuLP.
- Public URL trên Netlify.
- 8 ngày đủ nếu scope chỉ gồm: optimizer + Line Balancing Pivot + Shift KPI scorecard + Skill Matrix + what-if + export.

### Nếu mục tiêu là "app phải nằm trọn trên Netlify"

Chọn **Phương án B**.

Nhưng phải đổi câu chuyện CV:

- Không nói "MILP/PuLP".
- Nói "heuristic line balancing in the browser" hoặc "client-side optimization".
- Nếu muốn giữ MILP, thêm `glpk.js` — nhưng chỉ làm nếu còn thời gian.

### Nếu deadline quá gấp

Chọn **Phương án C**.

Nhưng đừng gọi là "deploy app lên Netlify". Gọi đúng:

> "Netlify portfolio landing page + Streamlit Cloud demo."

---

## 7. Scope 8 ngày đề xuất

Dù chọn A hay B, scope nên là:

### Làm

- 1 style, 1 line, 1 shift.
- 40–60 operations.
- 20–30 workers.
- Precedence + takt + skill + machine.
- Optimizer + validation.
- KPI: line efficiency, balance efficiency, balance delay, bottleneck, output capacity.
- Workload chart + assignment table + warnings.
- Skill matrix heatmap + skill gap.
- What-if 2–3 kịch bản.
- Export CSV/Excel.
- Public URL.
- README + demo video.

### Không làm

- Full 3 pivot.
- Multi-line/multi-plant.
- Auth/database.
- MES integration.
- Real-time.
- CAD layout.
- ML/DL.
- Drill-down 4 tầng.
- Loss Pareto nâng cao.

> Với 8 ngày, **1 pivot tốt + 1 scorecard tốt** thuyết phục hơn **3 pivot nông**.

---

## 8. Checklist deploy Netlify (Phương án A)

### Trước khi deploy

- [ ] `npm run build` local thành công.
- [ ] `npm run preview` chạy được.
- [ ] API local chạy ở `localhost:8000`.
- [ ] Frontend gọi API qua biến môi trường hoặc proxy.
- [ ] Không hardcode URL backend trong code.
- [ ] Không có secret trong frontend.
- [ ] `.gitignore` đúng.

### Netlify

- [ ] Connect GitHub repo.
- [ ] Base directory: `frontend`.
- [ ] Build command: `npm run build`.
- [ ] Publish directory: `dist` (Netlify resolves it relative to the `frontend` base; do not enter `frontend/dist`).
- [ ] Thêm redirect `/api/*` → Render.
- [ ] Thêm SPA fallback `/*` → `/index.html`.
- [ ] Test `https://your-site.netlify.app/api/health`.
- [ ] Test optimize từ domain Netlify.
- [ ] Test mobile.
- [ ] Test cold start.

### Render

- [ ] Web Service, Python runtime.
- [ ] Build command: `pip install -r requirements.txt`.
- [ ] Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
- [ ] Health check path: `/api/health` (canonical). `/health` là alias cho uptime monitor bên ngoài.
- [ ] Environment variables (nếu có).
- [ ] Test API bằng Postman/curl.
- [ ] Kiểm tra timeout solver.
- [ ] Warm up trước demo.

### Sau khi deploy

- [ ] README có link public.
- [ ] README có sơ đồ kiến trúc.
- [ ] README có hướng dẫn chạy local.
- [ ] README có disclaimer dữ liệu synthetic.
- [ ] Demo video 3 phút.
- [ ] CV bullet cập nhật.

---

## 9. Câu chuyện CV theo từng phương án

### Phương án A

```text
• Built and deployed a full-stack IE decision-support app on Netlify
  (React/TypeScript) with a FastAPI + PuLP optimization API on Render.

• Formulated a skill-aware MILP for garment line balancing under takt,
  precedence, machine and multi-skill constraints; proved optimal solutions
  for 40 operations / 24 workers in about 28 seconds (HiGHS, warm start).

• Implemented workload/bottleneck dashboards, skill-gap alerts and what-if
  scenario comparison; exported assignment plans to Excel.

• Documented deployment architecture, cold-start handling and production
  roadmap for MES integration; used synthetic data only.
```

### Phương án B

```text
• Built a client-side IE line-balancing web app in React/TypeScript,
  deployed entirely on Netlify; no backend required.

• Implemented a precedence-aware greedy + local-search optimizer in a
  Web Worker, with takt, skill and machine constraints.

• Automated workload, line-efficiency, balance-delay and bottleneck
  analytics; supported CSV import and Excel export.

• Validated on 3 synthetic garment styles and 20+ scenarios; documented
  trade-offs versus an exact MILP approach.
```

### Phương án C

```text
• Built a Streamlit + PuLP line-balancing prototype and a Netlify
  portfolio landing page with a public demo link.

• Optimized garment line assignments under takt, precedence and
  multi-skill constraints; automated bottleneck and efficiency KPIs.
```

---

## 10. Quyết định chọn phương án

Trả lời 3 câu:

1. **Bạn muốn giữ PuLP/MILP không?**
   - Có → A.
   - Không → B.

2. **Bạn muốn app thật nằm trọn trên Netlify không?**
   - Có → B.
   - Không → A hoặc C.

3. **Bạn có sẵn sàng quản lý 2 deployment không?**
   - Có → A.
   - Không → B hoặc C.

### Mặc định đề xuất

> **A — Netlify frontend + FastAPI/PuLP backend**, nếu mục tiêu là CV IE/OR và bạn muốn giữ lõi tối ưu.
>
> **B — All-in Netlify**, nếu bạn muốn đơn giản vận hành và chấp nhận heuristic.

---

## 11. Next step

Nếu chọn A, thứ tự làm:

1. Scaffold `frontend/` + `backend/`.
2. Deploy "hello world" lên Netlify + Render ngay Day 1.
3. Làm optimizer + API.
4. Làm UI input → results.
5. Thêm skill matrix + what-if + export.
6. Test cold start + mobile.
7. README + demo video.

Nếu chọn B, thứ tự làm:

1. Scaffold Vite/React/TS.
2. Làm input + validation.
3. Làm greedy + local search trong Web Worker.
4. Làm dashboard + skill + what-if.
5. Deploy Netlify.
6. Test + README + demo.

> **Nguyên tắc 8 ngày:** deploy sớm, cắt sâu, không thêm feature mới sau Day 6. Một app nhỏ chạy thật tốt hơn một app lớn demo nửa vời.
