# AGENTS.md — LineBalance Pro

> Quy tắc bắt buộc cho mọi thay đổi code trong repo này.
> Mục tiêu: đúng nghiệp vụ IE, đúng KPI, dễ kiểm chứng, chạy gọn, không lẫn dữ liệu giữa các project.

---

## 0. Trước khi sửa code (bắt buộc)

1. Đọc `CHECKLIST.md` §0.1–0.2 và §10–11 để biết trạng thái và quyết định mới nhất.
2. Đọc `ROADMAP.md` §1.2 (nguyên tắc thiết kế), §14 (Definition of Done) và phần liên quan.
3. Chạm KPI → đọc `KPI_SPEC.md`. Chạm MILP → đọc `MODEL.md`.
4. Chạm deploy → đọc `DEPLOYMENT.md`, `render.yaml`, `netlify.toml`.
5. Chạy `scripts/verify.ps1` trước khi bắt đầu nếu cần biết baseline hiện tại.
6. Không tự đổi scope, target, công thức KPI hoặc trạng thái solver nếu chưa ghi quyết định vào `CHECKLIST.md`.

### Quick commands

```powershell
# Backend
.venv\Scripts\python.exe -m pytest
.venv\Scripts\python.exe -m ruff check backend tests
.venv\Scripts\python.exe -m ruff format --check backend tests
.venv\Scripts\python.exe -m mypy backend/app
.venv\Scripts\python.exe -m uvicorn backend.app.main:app --reload --port 8000

# Frontend
npm --prefix frontend run dev
npm --prefix frontend run lint
npm --prefix frontend run format:check
npm --prefix frontend run typecheck
npm --prefix frontend run build

# Toàn bộ kiểm tra
powershell -ExecutionPolicy Bypass -File scripts/verify.ps1
```

---

## 1. Nguyên tắc bất biến

- **Correctness > UI.** Không đánh bóng dashboard khi model/KPI/API chưa đúng.
- **Một nguồn sự thật cho mỗi con số.** Công thức ở backend, contract ở `KPI_SPEC.md`, type ở `types.ts`.
- **Solver trả trạng thái trung thực.** Không báo `OPTIMAL` khi chưa chứng minh lexicographic.
- **Tách lớp rõ ràng.** Validation → MILP → KPI → Planning → API → UI.
- **Không bịa công thức hoặc số liệu.** Mọi con số phải có công thức, test và nguồn.
- **Chỉ dùng dữ liệu synthetic/demo.** Ghi rõ trong UI, README và API.
- **Không hard-code kết quả mẫu trong component.** UI lấy từ `result`, `data.ts` hoặc API.
- **Không commit secret.** API key, token, `.env` chỉ nằm trong biến môi trường.
- **Không trộn dữ liệu vault giữa các project.** Xem §14.

---

## 2. Ranh giới kiến trúc

| Layer | File | Được làm | Không được làm |
|---|---|---|---|
| Schema | `backend/app/models.py` | Pydantic model, validator, field constraints | Solver, KPI, HTTP |
| Validation | `backend/app/validation.py` | Normalize, validate, eligibility, topological order | Solve, format UI |
| Solver | `backend/app/optimizer.py` | Build MILP, solve, status, metadata | UI strings, KPI formulas |
| KPI | `backend/app/kpis.py` | Pure calculation | I/O, HTTP, solver |
| Planning | `backend/app/planning.py` | Capacity, HC, machine requirements | Solve, UI |
| Baseline | `backend/app/baseline.py` | Before/after comparison | UI |
| Actuals | `backend/app/actuals.py` | Actuals analysis | Planning, solver |
| API | `backend/app/main.py` | HTTP, middleware, error mapping | Business logic |
| API client | `frontend/src/api.ts` | Fetch, parse error | Business rules |
| Contract | `frontend/src/types.ts` | TypeScript types khớp backend | Logic |
| UI helpers | `frontend/src/utils.ts` | Formatting, pure helpers | Data fetching |
| Components | `frontend/src/components/*` | Presentation, local UI state | Core KPI formulas |
| App | `frontend/src/App.tsx` | Compose, state, handlers | Business formulas |
| Sample data | `frontend/src/data.ts` | Import JSON mẫu, label synthetic | Hard-code số mới trong JSX |

**Khi thêm field/endpoint:**

1. Cập nhật Pydantic model (`models.py`) và/hoặc `main.py`.
2. Cập nhật `frontend/src/types.ts` và `frontend/src/api.ts` nếu frontend dùng.
3. Cập nhật sample data nếu contract thay đổi.
4. Thêm test backend + test type/build frontend.
5. Cập nhật tài liệu liên quan (xem §9).

---

## 3. Python backend

- Target deploy là **Python 3.12** (`render.yaml`); không dùng tính năng chỉ có ở 3.13+.
- Module Python mới nên bắt đầu bằng `from __future__ import annotations`.
- Type hint cho public function và function nội bộ quan trọng: `list[...]`, `dict[...]`, `X | None`.
- Pydantic v2 ở boundary; không trả `dict` không type trong API.
- Hàm tính toán phải **pure**: nhận data, trả data; không đọc file/network trong `kpis.py`, `planning.py`.
- Chia số dùng `safe_div`; mẫu số 0 trả `0`/`default`, không crash.
- Quy ước làm tròn:
  - giây: 3 chữ số thập phân;
  - phần trăm: 2;
  - capacity: 1;
  - giữ precision trung gian, chỉ round ở output.
- Thứ tự phải **deterministic**: sort ID, dùng heap cho topological order; không lặp `set` để tạo output.
- Logging dùng `logging`, không dùng `print`.
- Chỉ bắt exception ở boundary; message phải actionable; không `except:` trần.
- Hằng số đặt ở đầu module; không magic number rải rác.
- Dependency pin trong `backend/requirements.txt`; thêm dependency mới phải có lý do và cập nhật file.
- Không thêm I/O, sleep, random không seed vào hàm tính KPI.

---

## 4. Frontend

- TypeScript strict; **không dùng `any`**, không `@ts-ignore` để che lỗi.
- `types.ts` là contract; không khai báo interface trùng lặp trong component.
- Mọi gọi API nằm trong `api.ts`; component nhận props, không tự `fetch`.
- Công thức KPI cốt lõi ở backend. UI chỉ được tính **display-only** (delta, gap, format).
- Format số/ngày qua `utils.ts`; không rải `toFixed`/`toLocaleString` trong JSX.
- Mỗi async panel phải có **loading / error / empty** state.
- Accessibility: label cho input, `aria-label` cho section, button có `type="button"`, focus rõ ràng.
- Responsive: kiểm tra tối thiểu 1440px và 390px; không horizontal scroll.
- Không hard-code số liệu mẫu mới trong JSX; dùng `result`, `data.ts` hoặc API.
- `useMemo` chỉ dùng khi đo được chi phí; không tối ưu sớm.
- Style dùng class CSS hiện có; inline style chỉ khi giá trị động.
- Không thêm UI library mới nếu stack hiện tại làm được.

---

## 5. Domain / KPI / solver

- `KPI_SPEC.md` là contract. Mọi KPI phải khớp công thức và checklist test trong đó.
- Allowance chỉ áp dụng **một lần**:
  - `INCLUDES_ALLOWANCE` → allowance applied = 0;
  - `EXCLUDES_ALLOWANCE` → cộng allowance vào planning SAM đúng một lần.
- Phân biệt rõ:
  - `takt_time_sec` = demand takt;
  - `effective_takt_time_sec` = đã trừ planned efficiency;
  - không gọi effective takt là “takt”.
- `capacity_per_shift` là **bottleneck-constrained capacity**, không phải sản lượng thực tế.
- Machine `coverage_pct` / `demand_ratio_pct` không được gọi là “machine utilization”.
- Chỉ trả `OPTIMAL` khi `metadata.lexicographic_proven == true`; nếu không, dùng `FEASIBLE_LIMIT`.
- API chỉ trả 4 status: `OPTIMAL`, `FEASIBLE_LIMIT`, `INFEASIBLE`, `ERROR`.
- Baseline là **input**, không phải output optimizer; label rõ là synthetic current-state.
- Không dùng dữ liệu HBI thật; không bịa công thức protection pay/quality/safety.
- Time study aggregate chỉ cho human/walking work; không áp performance rating cho machine automatic time.
- Nếu đổi semantics: cập nhật `KPI_SPEC.md`, test, label UI và ghi `CHECKLIST.md`.

---

## 6. API / security / vận hành

- Giữ `/api/health` rẻ và trả trạng thái solver.
- Giữ các giới hạn: body size, rate limit, concurrency; cấu hình qua env.
- CORS dùng allowlist; không `*` khi có credentials.
- Giữ security headers và `Cache-Control: no-store` cho API.
- Lỗi trả JSON `{ "detail": "..." }`, message actionable; không lộ stack trace.
- Secret chỉ qua env; không đưa key vào repo hoặc log.
- Env vars mới phải được ghi trong `DEPLOYMENT.md` (và `render.yaml` nếu deploy).
- Solver phải có time limit; không request không giới hạn.
- Endpoint mới phải có test happy path + validation + limit (nếu áp dụng).

---

## 7. Testing và kiểm chứng

- Mọi bug fix phải có **regression test**.
- Test core invariants:
  - mỗi operation đúng 1 station;
  - mỗi worker tối đa 1 station;
  - không vi phạm precedence/skill/machine;
  - `standard_load_sec` = tổng planning SAM.
- Test KPI mirror theo checklist trong `KPI_SPEC.md` §14.
- Test API: health, sample, optimize, actuals, time study, 413, 429; concurrency nếu có thể.
- Backend phải pass `ruff check`, `ruff format --check` và `mypy`.
- Frontend phải pass `npm run lint`, `npm run format:check` và `npm run build` (đã gồm `tsc --noEmit`).
- Thay đổi UI lớn: chạy `frontend/scripts/ui-check.mjs` và `responsive-check.mjs`.
- Trước khi báo done: chạy `scripts/verify.ps1` và ghi lại command + kết quả.

---

## 8. Performance và “chạy gọn”

- Giữ solver time limit, greedy warm start và compact station index; không xoá để “đơn giản hoá”.
- Không tính lại KPI trong render; derive một lần từ `result`.
- Không thêm dependency chỉ để giải quyết một dòng code.
- Chỉ lazy-load panel nặng khi bundle tăng; đo trước, tối ưu sau.
- Xoá dead code, unused import, unused dependency.
- Hàm nhỏ, một trách nhiệm; tránh abstraction sớm.
- API không trả field không dùng; giữ payload mẫu ở mức hợp lý.
- Không chạy việc nặng ở import time; lazy init nếu cần.
- Log production không được quá noisy.

---

## 9. Tài liệu và decision log

| Thay đổi | Phải cập nhật |
|---|---|
| KPI/công thức | `KPI_SPEC.md` + test + label UI |
| MILP/constraint/status | `MODEL.md` + `CHECKLIST.md` + test |
| API/schema | `types.ts` + tài liệu + test |
| Scope/priority | `ROADMAP.md` + `CHECKLIST.md` |
| Deploy/env | `DEPLOYMENT.md` + `render.yaml`/`netlify.toml` |
| Sample data | label synthetic + `data.ts`/`sample_data.py` + test |

- `CHECKLIST.md` là decision log: **append** entry mới có ngày, không sửa lịch sử.
- Không đổi semantics âm thầm; ghi lý do và evidence.

---

## 10. Git / workflow (khi repo được khởi tạo)

- Commit nhỏ, một thay đổi logic mỗi commit.
- Message: `type(scope): summary` — `feat`, `fix`, `test`, `docs`, `chore`, `refactor`, `perf`.
- Không commit `.venv`, `node_modules`, `dist`, `__pycache__`, `.pytest_cache`, `.obsidian-mcp`, `.codegraph`, `.env`.
- Không rewrite thay đổi của user; kiểm tra trước khi xoá file lạ.
- Trước commit: `scripts/verify.ps1` pass + docs đã cập nhật.

---

## 11. Definition of Done (task)

- [ ] Code chạy local.
- [ ] Có test cho logic chính hoặc regression test.
- [ ] `scripts/verify.ps1` pass.
- [ ] API/schema/types/docs đã cập nhật.
- [ ] UI có loading/error/empty state.
- [ ] Không hard-code số liệu.
- [ ] KPI semantics đã review.
- [ ] Có evidence: test output, build output, screenshot hoặc log.
- [ ] `CHECKLIST.md` có entry nếu thay đổi quyết định/scope/semantics.

---

## 12. Khi hoàn thành project (final checklist)

- [ ] `README.md`: kiến trúc, cách chạy, env, synthetic data, giới hạn.
- [ ] Public URL HTTPS + `/api/health` trả 200.
- [ ] Test suite và build pass từ clean clone.
- [ ] Benchmark 50 ops / 25 workers có kết quả.
- [ ] Demo script 7 phút chạy được.
- [ ] Screenshot desktop + mobile.
- [ ] Không còn dead code / unused dependency.
- [ ] Dependency audit; pin version.
- [ ] Accessibility và responsive đã kiểm tra.
- [ ] Error/loading/empty state đầy đủ.
- [ ] Security: CORS, headers, rate limit, body limit, no secrets.
- [ ] Docs: `KPI_SPEC.md`, `MODEL.md`, `ROADMAP.md`, `CHECKLIST.md`, `DEPLOYMENT.md`.
- [ ] Data policy hiển thị rõ trong UI và README.
- [ ] Hướng dẫn backup/export dữ liệu.

---

## 13. Anti-patterns (cấm)

- Claim `OPTIMAL` khi `lexicographic_proven=false`.
- Gọi machine coverage là “utilization”.
- Gọi theoretical capacity là “capacity” để claim target.
- Hard-code thêm số liệu mẫu trong component; dùng `data.ts`/API, không nhân rộng fallback demo hiện có.
- Tính KPI trong JSX.
- Đổi target/công thức mà không cập nhật `KPI_SPEC.md` + `CHECKLIST.md`.
- Dùng dữ liệu HBI thật hoặc bịa công thức.
- Thêm `any` / `@ts-ignore` để im lặng TypeScript.
- Thêm dependency cho một one-liner.
- Bắt exception rộng rồi trả 200.
- Commit secret.
- Copy `opencode.json` sang project khác mà không đổi path.
- Dùng CBC làm mặc định.
- Xoá warm start/time limit để “đơn giản”.
- Làm UI trước khi model/KPI đúng.

---

## 14. MCP / vault / data isolation

- `vault` và `obsidian-vault` là **project-local**, nằm trong `opencode.json` của project.
- Global config chỉ có `codegraph`, `jina`, `chrome-devtools`.
- Project mới: chạy
  ```powershell
  & "$env:USERPROFILE\.config\opencode\scripts\New-ProjectMcpConfig.ps1" `
    -ProjectPath "D:\CV\ProjectMoi" -VaultId projectmoi
  ```
- Không copy file `opencode.json` sang project khác nếu chưa đổi path.
- `codegraph`: truyền `projectPath`; chỉ query project đã có `.codegraph/`.
- Vault chỉ dùng cho notes/docs, không chứa runtime data hoặc secret.
