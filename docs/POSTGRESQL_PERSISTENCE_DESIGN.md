# Thiết kế Phase 4 — PostgreSQL scenario persistence

> **Trạng thái 2026-11-08:** Phase 4.2–4.6 đã triển khai trên private staging: migration `001` applied, PostgreSQL repository, bốn endpoint `/api/scenarios`, demo accounts admin/viewer, frontend server-scenario client và integration test opt-in. Frontend vẫn mặc định lưu snapshot trong `localStorage`; Neon persistence là opt-in. Neon persistence chưa deploy public; public demo chạy `localStorage` + demo login tắt.
>
> - Đã có `ScenarioCreateRequest`/`ScenarioSummary`/`ScenarioDetail`/`ScenarioListResponse`, `LoginRequest`/`AuthSessionResponse`, `backend/app/scenario_service.py`, `backend/app/scenario_store.py` (protocol + in-memory + PostgreSQL), `backend/app/auth.py`, migration `001` và test service/API.
> - Private staging đã có `DATABASE_URL`, `SCENARIO_API_TOKEN`, `AUTH_DEMO_PASSWORD`, `AUTH_SESSION_SECRET`, migration applied; dependency `psycopg[binary]` + `psycopg_pool` đã pin.
> - Đã có bốn endpoint `/api/scenarios` (bearer token **hoặc** session cookie) và ba endpoint `/api/auth/*`; frontend có dialog đăng nhập và panel Server scenarios, nhưng optimizer/local snapshot vẫn chạy khi chưa đăng nhập.
> - Tài liệu này thay thế đề xuất SQL ngắn trong `ROADMAP.md` §3.6 và quyết định
>   `Base.metadata.create_all()` cũ.
> - Còn lại trước khi coi Phase 4 deploy done: public deployment + secret Render, DB role giới hạn quyền, quota advisory lock, purge audit và security sign-off cho môi trường public.

---

## 1. Mục tiêu và phạm vi

### 1.1. Mục tiêu

Lưu **snapshot scenario** (input đã validate + kết quả do server tạo) để:

- xem lại một phương án đã chạy mà không phụ thuộc `localStorage`;
- so sánh các lần lưu theo thời gian, style, trạng thái solver;
- có dấu vết audit tối thiểu cho thao tác tạo/xóa;
- giữ nguyên khả năng chạy optimizer khi database không sẵn sàng.

### 1.2. Phạm vi

- Chỉ lưu **scenario synthetic/demo**. Không lưu dữ liệu HBI thật, tên công nhân thật,
  lương, dữ liệu HR hoặc dữ liệu production thật.
- Chỉ lưu một **workspace logic** cho mỗi deployment, lấy từ biến môi trường.
- Chỉ mở API ghi/xóa cho **admin** (bearer token hoặc tài khoản demo); viewer chỉ đọc.
- Public demo trên Netlify **mặc định dùng `localStorage`**; server scenarios là opt-in và cần đăng nhập demo. Cookie phiên là first-party nhờ proxy `/api`.
- Kết quả lưu là kết quả **server tự chạy lại optimizer**, không nhận result do client gửi.
- Persistence là **opt-in**, mặc định tắt.

### 1.3. Ngoài phạm vi (non-goals)

| Hạng mục | Lý do |
|---|---|
| Auth/RBAC đầy đủ, multi-user | Phase sau; Phase 4 chỉ có demo accounts admin/viewer, mật khẩu chung và một workspace |
| Multi-tenant, multi-plant | Chưa có nhu cầu và chưa có dữ liệu |
| Public anonymous write API | Rủi ro abuse; public demo vẫn localStorage và cần đăng nhập demo để ghi |
| Style master/routing editor | Thuộc T06/T16, không phải persistence |
| Material master/BOM persistence | Thuộc T18; hiện chỉ có usage variance + import |
| Lưu actuals như system of record | `OptimizeRequest` có actuals synthetic, nhưng DB không phải MES |
| Job queue/async solve | Phase 4 giữ solve đồng bộ, dùng semaphore hiện có |
| Object storage cho file CSV/XLSX | MinIO là roadmap riêng |
| UI quản trị scenario | Phase 4.6 có panel server scenarios trong section Solver; không phải trang quản trị riêng |
| Migration tự động lúc startup | Tránh race và thay đổi schema ngoài kiểm soát |

---

## 2. Hiện trạng và ràng buộc

| Hạng mục | Hiện tại |
|---|---|
| Persistence | `localStorage` key `linebalance.snapshots.v1` là mặc định; tối đa 20 snapshot. Server persistence là opt-in (`postgres`) |
| Backend flag | `SCENARIO_PERSISTENCE` = `localStorage`/`postgres`; `/api/health` trả `scenario_persistence` + `scenario_store` |
| Schema models | `ScenarioCreateRequest`, `ScenarioSummary`, `ScenarioDetail`, `ScenarioListResponse`, `LoginRequest`, `AuthSessionResponse` |
| API scenario | Bốn route `/api/scenarios` đã có; bearer token hoặc session demo; server re-solve |
| Auth | Demo accounts từ env (`admin`, `test1`–`test4`); HMAC session cookie; role admin/viewer; không có user/session table |
| DB dependency | `psycopg[binary]` + `psycopg_pool` đã pin; không SQLAlchemy/Alembic |
| Body limit | 2.000.000 byte toàn API (`MAX_BODY_BYTES`); scenario payload ≤ 1.500.000 byte |
| Rate limit | 60 request/phút/IP; login 10 lần/5 phút; scenario write 5/phút; in-memory, single process |
| Solver | PuLP/HiGHS, time limit 60s, semaphore 2 solve đồng thời |
| CORS | Allowlist qua `FRONTEND_ORIGINS` + regex Netlify; `allow_credentials=True`; không dùng `*` |
| Security headers | `nosniff`, `DENY`, `no-referrer`, `Cache-Control: no-store` |
| Data policy | Synthetic/demo only; auth demo, một workspace dùng chung, không multi-tenant |

### 2.1. Vì sao không dùng thiết kế cũ

Đề xuất cũ trong `ROADMAP.md`:

```sql
CREATE TABLE scenarios (
    id UUID PRIMARY KEY,
    ...
    request_json JSONB NOT NULL,
    result_json JSONB NOT NULL,
    ...
);
```

có ba điểm không còn phù hợp:

1. **Không auth, workspace cố định** — nếu bật trên môi trường có URL công khai thì
   bất kỳ ai cũng ghi/xóa được.
2. **Nhận `result` từ client** — không chứng minh được result do solver tạo; trái với
   nguyên tắc “solver trả trạng thái trung thực”.
3. **`create_all()` lúc startup** — không có migration history, không kiểm soát được
   thay đổi schema, dễ race khi có nhiều instance.

Thiết kế này thay bằng: bearer token hoặc tài khoản demo có role, một workspace từ env,
server re-solve, migration file forward-only.

---

## 3. Quyết định thiết kế

| ID | Quyết định | Lý do |
|---|---|---|
| D1 | Mặc định `SCENARIO_PERSISTENCE=localStorage` | Không thay đổi hành vi public demo |
| D2 | Chỉ bật `postgres` khi có `DATABASE_URL` + `SCENARIO_API_TOKEN`; demo login bật khi có `AUTH_DEMO_PASSWORD` + `AUTH_SESSION_SECRET` | Tránh mở API ghi không bảo vệ |
| D3 | Bearer token cho admin/ops; session cookie HttpOnly cho browser; so sánh/verify constant-time | Browser không cần giữ token; token chỉ dành cho client tin cậy |
| D4 | Một `workspace_id` từ env, không nhận từ client | Cô lập dữ liệu giữa các deployment |
| D5 | `POST /api/scenarios` chỉ nhận `name` + `request`; server tự solve | Không tin result client; metadata nhất quán |
| D6 | Chỉ lưu `OPTIMAL` và `FEASIBLE_LIMIT` | Snapshot có kết quả; không lưu run lỗi/infeasible |
| D7 | UUID do app tạo; không dùng extension `pgcrypto` | Chạy được trên provider không bật extension |
| D8 | JSONB cho request/result; cột summary để list/filter | Cân bằng linh hoạt và hiệu năng |
| D9 | Hard delete + bảng audit append-only | Dữ liệu synthetic, không cần soft delete/retention phức tạp |
| D10 | Cursor pagination, không offset | Ổn định khi có bản ghi mới |
| D11 | `Idempotency-Key` tùy chọn | Tránh tạo trùng khi client retry save |
| D12 | Migration SQL forward-only + runner nhỏ; không Alembic/SQLAlchemy ở v1 | Ít dependency; schema nhỏ, ít thay đổi |
| D13 | Không auto-migrate lúc startup | Tránh race, tách quyền migrate và app |
| D14 | DB lỗi → scenario API 503; optimize/export vẫn chạy | Persistence không được làm hỏng chức năng chính |
| D15 | Panel server scenarios tối giản trong section Solver, không phải trang quản trị riêng | Đủ cho demo; giữ scope UI nhỏ |
| D16 | Demo accounts cấu hình bằng env, không lưu user/session trong PostgreSQL | Tránh migration user table và scope auth production |

> Các quyết định D5, D9, D15, D16 đã được ghi nhận trong `CHECKLIST.md` (Phase 4.6). Nếu
> muốn giữ result client, thêm user table hoặc mở anonymous write, cần ghi quyết định mới
> vào `CHECKLIST.md` trước khi code.

---

## 4. Kiến trúc

```text
┌──────────────────────────────────────────────┐
│ Netlify / local frontend                     │
│ - optimize / export / import                 │
│ - snapshots in localStorage (default)        │
│ - demo login → HttpOnly session cookie       │
│ - Server scenarios panel (admin can write,   │
│   viewer read-only)                          │
└──────────────────────┬───────────────────────┘
                       │ /api/* (same-origin proxy)
                       ▼
┌──────────────────────────────────────────────┐
│ FastAPI backend                              │
│                                              │
│  /api/auth/*      ──► demo accounts (env)    │
│  /api/scenarios*  ──► ScenarioService        │
│       │                  │                   │
│       │                  ├─ validate_request│
│       │                  ├─ solve_line_...   │
│       │                  └─ ScenarioRepository
│       │                          │           │
│  /api/optimize ... (không đổi)   │           │
└──────────────────────────────────┼───────────┘
                                   │ psycopg 3 pool
                                   ▼
                        ┌─────────────────────┐
                        │ PostgreSQL (Neon)   │
                        │ scenarios           │
                        │ scenario_audit      │
                        │ schema_migrations   │
                        └─────────────────────┘

Admin/ops client (curl/Swagger nội bộ)
  Authorization: Bearer <SCENARIO_API_TOKEN>
```

### 4.1. Tầng code dự kiến

| File | Trách nhiệm | Trạng thái |
|---|---|---|
| `backend/app/persistence.py` | Đọc env, tạo connection pool, kiểm tra schema, health snapshot | Đã có — lazy pool, health, đóng pool qua lifespan |
| `backend/app/scenario_store.py` | Repository: create/list/get/delete/audit; SQL parameterized | Đã có — in-memory + PostgreSQL |
| `backend/app/scenario_service.py` | Validate, solve, idempotency, mapping Pydantic ↔ DB | Đã có (DB-free) |
| `backend/app/main.py` | Route, auth/session, CSRF Origin check, error mapping; không chứa SQL | Đã có 4 route scenario + 3 route auth + rate limit |
| `backend/app/auth.py` | Env demo accounts, role mapping, password check, HMAC session token | Đã có |
| `backend/app/models.py` | `ScenarioCreateRequest`, `ScenarioSummary`, `ScenarioDetail`, `ScenarioListResponse`, `LoginRequest`, `AuthSessionResponse` | Đã có |
| `backend/migrations/001_scenarios.sql` | DDL + index + audit + schema_migrations | Đã có — version `001` applied trên Neon staging |
| `scripts/migrate.py` | Apply/check migration, không auto-run | Đã có — `--check`/`--apply`, idempotent |
| `scripts/run_backend.ps1` | Nạp `.env.local` rồi chạy uvicorn local | Đã có |
| `frontend/src/components/AuthDialog.tsx` | Dialog đăng nhập demo tối giản | Đã có |
| `frontend/src/components/ServerSnapshotsPanel.tsx` | Lưu/list/load/delete scenario server theo role | Đã có |
| `tests/test_scenario_service.py` | Unit test với fake store; integration test opt-in | Đã có unit + API; integration opt-in `test_scenario_store_postgres.py` |
| `tests/test_auth_api.py` | Login, cookie flags, role, CSRF, expiry, logout, rate limit | Đã có |

### 4.2. Khởi tạo lazy, fail-safe

- Không kết nối DB ở import time.
- Khi `SCENARIO_PERSISTENCE != "postgres"`: không tạo pool; scenario routes trả 503.
- Khi bật nhưng thiếu `DATABASE_URL`/token: log lỗi cấu hình; scenario routes trả 503;
  `/api/health` báo `ready=false`, `reason=misconfigured`; optimize vẫn chạy.
- Khi DB lỗi: pool có thể reconnect; request scenario trả 503; không crash app.
- Token không bao giờ xuất hiện trong log, response, health hoặc frontend bundle.

---

## 5. Data model

### 5.1. DDL đề xuất — `backend/migrations/001_scenarios.sql`

```sql
CREATE TABLE IF NOT EXISTS schema_migrations (
    version     text PRIMARY KEY,
    checksum    text NOT NULL,
    applied_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS scenarios (
    id                      uuid PRIMARY KEY,
    workspace_id            text NOT NULL
        CHECK (workspace_id ~ '^[a-z0-9][a-z0-9_-]{0,63}$'),
    name                    text NOT NULL
        CHECK (char_length(btrim(name)) BETWEEN 1 AND 120),
    line_name               text NOT NULL
        CHECK (char_length(line_name) <= 120),
    style_code              text NOT NULL
        CHECK (char_length(style_code) <= 80),
    data_policy             text NOT NULL DEFAULT 'synthetic-demo-only'
        CHECK (data_policy = 'synthetic-demo-only'),

    status                  text NOT NULL
        CHECK (status IN ('OPTIMAL', 'FEASIBLE_LIMIT')),
    solver_status           text NOT NULL
        CHECK (char_length(solver_status) <= 80),
    solver_version          text NOT NULL
        CHECK (char_length(solver_version) <= 120),
    model_version           text NOT NULL
        CHECK (char_length(model_version) <= 80),
    app_version             text NOT NULL
        CHECK (char_length(app_version) <= 40),
    data_version            text NOT NULL
        CHECK (char_length(data_version) <= 64),
    input_hash              text NOT NULL
        CHECK (input_hash ~ '^[0-9a-f]{64}$'),

    workers_used            integer NOT NULL
        CHECK (workers_used BETWEEN 0 AND 100),
    stations_used           integer NOT NULL
        CHECK (stations_used BETWEEN 0 AND 200),
    balance_efficiency_pct  numeric(5, 2) NOT NULL
        CHECK (balance_efficiency_pct BETWEEN 0 AND 100),

    result_origin           text NOT NULL DEFAULT 'server-solve'
        CHECK (result_origin = 'server-solve'),
    schema_version          integer NOT NULL DEFAULT 1
        CHECK (schema_version >= 1),

    request_json            jsonb NOT NULL
        CHECK (jsonb_typeof(request_json) = 'object'),
    result_json             jsonb NOT NULL
        CHECK (jsonb_typeof(result_json) = 'object'),
    request_bytes           integer NOT NULL
        CHECK (request_bytes BETWEEN 1 AND 1500000),
    result_bytes            integer NOT NULL
        CHECK (result_bytes BETWEEN 1 AND 1500000),

    idempotency_key         text
        CHECK (
            idempotency_key IS NULL
            OR idempotency_key ~ '^[A-Za-z0-9._:-]{8,64}$'
        ),

    created_at              timestamptz NOT NULL DEFAULT now(),

    CHECK (octet_length(request_json::text) <= 1500000),
    CHECK (octet_length(result_json::text) <= 1500000)
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_scenarios_idempotency
    ON scenarios (workspace_id, idempotency_key)
    WHERE idempotency_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS ix_scenarios_workspace_created
    ON scenarios (workspace_id, created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS ix_scenarios_workspace_style
    ON scenarios (workspace_id, style_code, created_at DESC);

CREATE INDEX IF NOT EXISTS ix_scenarios_workspace_hash
    ON scenarios (workspace_id, input_hash);

CREATE TABLE IF NOT EXISTS scenario_audit (
    id            bigserial PRIMARY KEY,
    scenario_id   uuid NOT NULL,
    workspace_id  text NOT NULL,
    action        text NOT NULL
        CHECK (action IN ('create', 'delete')),
    actor_label   text NOT NULL
        CHECK (char_length(actor_label) <= 80),
    request_id    text
        CHECK (request_id IS NULL OR char_length(request_id) <= 80),
    detail        jsonb NOT NULL DEFAULT '{}'::jsonb
        CHECK (jsonb_typeof(detail) = 'object'),
    created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_scenario_audit_workspace_created
    ON scenario_audit (workspace_id, created_at DESC);
```

### 5.2. Ghi chú schema

- **UUID do app tạo** (`uuid.uuid4()`), không phụ thuộc `gen_random_uuid()`/`pgcrypto`.
- **`status`** chỉ nhận `OPTIMAL`/`FEASIBLE_LIMIT`; `solver_status` giữ raw status
  (ví dụ `Optimal`, `Time limit`) để audit.
- **`workers_used`, `stations_used`, `balance_efficiency_pct`** là cột summary để list
  không phải parse JSONB. Giá trị lấy từ `result.kpis`/`result.stations`.
- **`request_json`, `result_json`** là JSONB canonical do Pydantic `model_dump(mode="json")`
  tạo; không lưu chuỗi JSON thô từ client.
- **`request_bytes`/`result_bytes`** là kích thước sau serialize, dùng để giới hạn và
  monitoring; DB vẫn kiểm tra `octet_length` để phòng ghi trực tiếp.
- **`schema_version`** cho phép migrate JSONB payload sau này; v1 = 1.
- **`idempotency_key`** unique theo workspace; nullable.
- **`scenario_audit`** không có FK để audit sống sót sau hard delete; không lưu request,
  result, token hoặc IP thô. `detail` chỉ chứa metadata an toàn:
  `{"name": "...", "status": "...", "input_hash": "..."}`.
- **Không có `updated_at`** vì snapshot là immutable; chưa có endpoint rename/update.
- **Không có soft delete**; DELETE xóa row và ghi audit. Dữ liệu synthetic, không cần
  retention phức tạp. Audit giữ 90 ngày (xem §9).

### 5.3. Vì sao không tách bảng `scenario_runs`

Mỗi scenario lưu đúng một result tại thời điểm tạo. Nếu sau này cần nhiều lần chạy cho
cùng một scenario, thêm bảng `scenario_runs` và giữ `scenarios` là metadata. Không thêm
bây giờ để tránh join và migration không cần thiết.

---

## 6. API contract đề xuất

Tất cả endpoint dưới `/api/scenarios` đều yêu cầu auth — một trong hai:

```http
Authorization: Bearer <SCENARIO_API_TOKEN>
```

hoặc session cookie do `POST /api/auth/login` cấp (browser demo). Bearer token dành cho
admin/ops; session dùng role admin/viewer.

### 6.1. Tóm tắt endpoint

| Method | Path | Body | Response | Ghi chú |
|---|---|---|---|---|
| `GET` | `/api/scenarios?limit=50&cursor=...` | — | `ScenarioListResponse` | Cursor pagination; admin + viewer |
| `POST` | `/api/scenarios` | `ScenarioCreateRequest` | `201 ScenarioDetail` + `Location` | Server solve rồi lưu; admin only |
| `GET` | `/api/scenarios/{id}` | — | `ScenarioDetail` | 404 nếu khác workspace; admin + viewer |
| `DELETE` | `/api/scenarios/{id}` | — | `204` | Hard delete + audit; admin only |
| `POST` | `/api/scenarios/{id}/reproduce` | — | `ScenarioReproduceResponse` | Optional Phase 4B; không ghi đè |

### 6.2. Request/response models

```python
class ScenarioCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    request: OptimizeRequest
    # Không có result: server tự solve.

class ScenarioSummary(BaseModel):
    id: str
    name: str
    created_at: str          # ISO 8601 UTC
    status: str              # OPTIMAL | FEASIBLE_LIMIT
    solver_status: str
    line_name: str
    style_code: str
    workers_used: int
    stations_used: int
    balance_efficiency_pct: float
    model_version: str
    data_version: str

class ScenarioDetail(ScenarioSummary):
    result_origin: str       # server-solve
    schema_version: int
    request: OptimizeRequest
    result: OptimizeResponse

class ScenarioListResponse(BaseModel):
    items: list[ScenarioSummary]
    next_cursor: str | None = None
```

Các model trên đã được implement trong `models.py` (thay `ScenarioSaveRequest` cũ) và
đã dùng bởi `ScenarioService` + bốn route `/api/scenarios`. `ScenarioCreateRequest`
chỉ nhận `name` + `request`; client không được gửi result.

### 6.3. `POST /api/scenarios`

Request:

```http
POST /api/scenarios HTTP/1.1
Authorization: Bearer <token>
Idempotency-Key: 7f4c2a9e-...
Content-Type: application/json

{
  "name": "A — after rebalance",
  "request": { "...": "OptimizeRequest" }
}
```

Luồng:

1. Auth guard kiểm tra bearer token hoặc session cookie trước khi parse body.
2. Pydantic validate `ScenarioCreateRequest`.
3. Strip/validate `name`; từ chối control character.
4. `validate_request(request)`; nếu lỗi → `422` với danh sách lỗi.
5. Nếu có `Idempotency-Key`:
   - tìm row cùng `(workspace_id, idempotency_key)`;
   - nếu tồn tại và `input_hash` khớp → trả `200` row cũ (không solve lại);
   - nếu tồn tại và `input_hash` khác → `409`.
6. `solve_line_balancing(request)`; nếu `INFEASIBLE`/`ERROR` → `422`, không lưu.
7. Kiểm tra `result.metadata` tồn tại và `result.metadata.input_hash` khớp hash tính lại.
8. Trong transaction:
   - **Hiện tại:** `count` trước rồi `insert`; chưa dùng advisory lock.
   - **Phase 4B:** `pg_advisory_xact_lock(hashtext(workspace_id)::bigint)` để đóng race
     count/insert khi có nhiều request đồng thời;
   - đếm scenario hiện có; nếu `>= SCENARIO_MAX_PER_WORKSPACE` → `409`/`422`;
   - insert row + audit `create`.
9. Trả `201` + `Location`.

Nếu insert bị unique conflict do race idempotency: đọc row hiện có, trả `200` nếu cùng
`input_hash`, ngược lại `409`.

### 6.4. `GET /api/scenarios`

- `limit`: 1–100, mặc định 50.
- `cursor`: opaque base64url của `created_at|id`; invalid → `400`.
- Query:
  ```sql
  SELECT ...
  FROM scenarios
  WHERE workspace_id = %(workspace_id)s
    AND (created_at, id) < (%(created_at)s, %(id)s)
  ORDER BY created_at DESC, id DESC
  LIMIT %(limit)s + 1;
  ```
- Trả tối đa `limit` item; nếu còn dữ liệu, `next_cursor` là cursor của item cuối.
- Response list không trả `request_json`/`result_json`. Query hiện vẫn select hai cột
  này rồi bỏ; projection gọn hơn để Phase 4B vì chưa ảnh hưởng correctness.

### 6.5. `GET /api/scenarios/{id}`

- `WHERE workspace_id = %s AND id = %s`.
- Không tìm thấy (kể cả ID của workspace khác) → `404` generic.
- Trả đầy đủ request + result.

### 6.6. `DELETE /api/scenarios/{id}`

- `DELETE ... WHERE workspace_id = %s AND id = %s RETURNING id`.
- Trong cùng transaction, insert audit `delete`.
- Không tìm thấy → `404`.
- Thành công → `204`, không body.
- Hard delete; không có khôi phục. Nếu cần khôi phục, dùng backup provider.

### 6.7. `POST /api/scenarios/{id}/reproduce` (Phase 4B, optional)

- Đọc request đã lưu, chạy lại solver, trả result mới + so sánh:
  ```json
  {
    "scenario_id": "...",
    "stored_status": "OPTIMAL",
    "reproduced_status": "OPTIMAL",
    "input_hash_matches": true,
    "kpi_delta": {"bottleneck_sec": 0.0, "workers_used": 0}
  }
  ```
- Không ghi đè result cũ; nếu người dùng muốn lưu bản mới, gọi `POST` với
  `Idempotency-Key` mới.
- Endpoint này hữu ích để kiểm chứng “snapshot có tái lập được không”, nhưng có thể để
  phase sau.

### 6.8. Lỗi

| Status | Khi nào | Detail mẫu |
|---:|---|---|
| `400` | Cursor invalid | `Invalid scenario cursor.` |
| `401` | Thiếu/sai token | `Scenario API token is missing or invalid.` |
| `404` | Không tìm thấy trong workspace | `Scenario not found.` |
| `409` | Idempotency conflict / vượt quota | `Idempotency key was already used with a different request.` |
| `413` | Body hoặc payload quá lớn | `Scenario payload exceeds the 1,500,000-byte limit.` |
| `422` | Request invalid / solve INFEASIBLE/ERROR | `Scenario request is invalid: ...` |
| `429` | Vượt rate limit | `Too many scenario writes; retry after 60 seconds.` |
| `503` | Persistence tắt/misconfigured/DB lỗi | `Scenario persistence is unavailable. Optimizer endpoints remain available.` |
| `500` | Lỗi không mong đợi | `Scenario request failed. Check server logs with the request id.` |

Không trả DSN, stack trace, tên bảng, SQL hoặc chi tiết driver.

---

## 7. Bảo mật

### 7.1. Threat model

| Threat | Vector | Giảm thiểu | Residual |
|---|---|---|---|
| Public write abuse | Ai cũng gọi `POST/DELETE` | Tắt mặc định; admin token hoặc demo admin bắt buộc; rate limit; chỉ private staging | Token/mật khẩu demo bị lộ |
| Token theft | Log, repo, frontend bundle, URL | Bearer chỉ env secret; không log; không query string; không `VITE_*`; rotation | Người có quyền server |
| Session theft | XSS, cookie bị đánh cắp | Cookie `HttpOnly`, `SameSite=Lax`, `Secure` khi HTTPS, `__Host-`; TTL 8h; không refresh token | XSS trên origin |
| Brute force credential | Thử token/mật khẩu liên tục | Token ≥ 32 byte random; login rate limit; 401 generic; mật khẩu demo đổi được | Mật khẩu demo yếu/chung |
| SQL injection | `name`, cursor, id | Parameterized query; validate UUID/cursor; không nối chuỗi SQL |  |
| Stored XSS | `name` chứa HTML/script | React escape; reject control char; không `dangerouslySetInnerHTML` | Client khác tự render sai |
| Cross-workspace leak | Đoán UUID | Mọi query filter `workspace_id`; workspace từ env; 404 generic |  |
| DoS bằng save | Gửi nhiều request solve | Global rate limit + write rate limit 5/phút; semaphore 2; solver 60s; quota 200 | Single-process limiter |
| Payload DoS | JSONB cực lớn | Body limit 2 MB; scenario payload 1.5 MB; DB check `octet_length`; quota |  |
| DB outage | DB down/timeout | Pool timeout 5s; 503; optimize không phụ thuộc DB |  |
| Error leakage | DB error trả ra client | Map lỗi; log request id; generic 500/503 |  |
| CSRF | Cookie tự gửi | Cookie write bắt buộc `Origin` hợp lệ; bearer write không dùng cookie; CORS allowlist + `SameSite=Lax` | Origin check là tuyến phòng thủ chính |
| Replay/duplicate | Retry save | `Idempotency-Key` unique; input hash check |  |
| Backup leakage | Backup chứa payload | Chỉ synthetic; provider encryption; không PII |  |
| Dependency compromise | psycopg/pool | Pin version; Dependabot; ít dependency |  |

### 7.2. Auth

Hai đường xác thực cho `/api/scenarios*`:

**A. Bearer token (admin/ops)**

- Token tối thiểu 32 byte random, truyền qua `Authorization: Bearer`.
- So sánh bằng `secrets.compare_digest`; không so sánh `==`.
- Không nhận token qua query string, cookie hoặc body.
- Token cũ có thể giữ trong `SCENARIO_API_TOKEN_PREVIOUS` để rotation; cả hai so sánh
  constant-time, sau đó xóa biến cũ.
- Bearer write không cần `Origin` vì browser không tự gắn token; token không bao giờ
  được nhúng vào bundle public.

**B. Demo session (browser)**

- `GET /api/auth/session`, `POST /api/auth/login`, `POST /api/auth/logout`.
- Tài khoản lấy từ env: `AUTH_ADMIN_USERS` (mặc định `admin`) và `AUTH_VIEWER_USERS`
  (mặc định `test1`–`test4`), dùng chung `AUTH_DEMO_PASSWORD`; không có bảng user/session.
- Session là token HMAC-SHA256 stateless, ký bằng `AUTH_SESSION_SECRET`, chứa username,
  role, hạn dùng và fingerprint mật khẩu. Đổi mật khẩu thu hồi phiên cũ.
- Cookie `lb_session` (HTTPS dùng `__Host-lb_session`), `HttpOnly`, `SameSite=Lax`,
  `Secure` khi HTTPS/forwarded proto, TTL mặc định 8 giờ. Không có refresh token.
- Viewer chỉ được list/get; admin được create/delete. Cookie-authenticated write bắt
  buộc `Origin` nằm trong allowlist (CSRF). `403` cho viewer write hoặc Origin bị từ chối.
- Login và scenario write có rate limit riêng; login sai trả `401` generic, không tiết lộ
  username có tồn tại hay không.

**Thứ tự xử lý**

- Auth/guard chạy trước khi đọc body cho path `/api/scenarios*`; `OPTIONS` được bỏ qua để
  CORS preflight hoạt động.
- Nếu persistence tắt: `503` trước auth. Nếu bật nhưng thiếu cấu hình: `503`
  `misconfigured`. Nếu thiếu/sai credential: `401`. Nếu login/persistence tắt: `503`.
- CORS dùng `allow_credentials=True` với allowlist tường minh + regex Netlify; không dùng
  `*`. Route `/api/*` nên đi qua proxy same-origin để cookie `SameSite=Lax` hoạt động.
- `AUTH_COOKIE_SECURE=auto|always|never`; deploy sau proxy HTTPS phải chạy uvicorn với
  `--proxy-headers --forwarded-allow-ips="*"` để `auto` nhận diện đúng.

### 7.3. Workspace isolation

- `SCENARIO_WORKSPACE_ID` mặc định `demo`, regex `^[a-z0-9][a-z0-9_-]{0,63}$`.
- Không có tham số `workspace_id` từ client.
- Mọi câu SQL (select/insert/delete/audit) đều có `workspace_id`.
- Nếu nhiều deployment dùng chung DB, mỗi deployment một workspace; không có endpoint
  liệt kê workspace.
- Tương lai: thêm `owner_id`/auth subject; không đổi contract hiện tại.

### 7.4. Database role

Đề xuất tách role:

| Role | Quyền | Dùng cho |
|---|---|---|
| `linebalance_migrator` | `CREATE`, `ALTER`, `DROP` trên schema; `USAGE` sequence | `scripts/migrate.py` |
| `linebalance_app` | `CONNECT`, `USAGE` schema, `SELECT/INSERT/DELETE` trên bảng, `USAGE` sequence | API runtime |

- Runtime role không có `CREATE`/`DROP`/`ALTER`.
- Kết nối `sslmode=require` (hoặc `verify-full` nếu có CA).
- `statement_timeout=5s` cho query thường; migration chạy riêng, không dùng pool runtime.
- Không dùng superuser/owner role cho API.

### 7.5. Logging và audit

- Log JSON/structured nếu có thể:
  - `scenario_create`, `scenario_delete`, `scenario_auth_failure`, `scenario_store_error`;
  - field: `request_id`, `workspace_id`, `scenario_id`, `status`, `latency_ms`;
  - không log token, header Authorization, request/result payload, DSN, IP thô.
- Audit DB:
  - `actor_label` lấy từ `SCENARIO_ACTOR_LABEL` (ví dụ `render-admin`), không phải token;
  - `request_id` lấy từ `X-Request-ID` nếu hợp lệ, nếu không tự sinh UUID;
  - `detail` chỉ metadata an toàn;
  - giữ 90 ngày, purge bằng script định kỳ (Phase 4B).
- `GET /api/health` chỉ trả trạng thái tổng hợp, không trả DSN/lỗi driver.

### 7.6. Data policy

- Chỉ chấp nhận `OptimizeRequest` synthetic; `data_policy` trong DB cố định
  `synthetic-demo-only`.
- Không lưu tên người thật, lương, mã nhân viên thật hoặc dữ liệu HBI.
- Không dùng DB làm system of record cho HR/MES.
- Nếu phát hiện dữ liệu thật, xóa row và audit; ghi sự cố theo `SECURITY.md`.

---

## 8. Migration plan

### 8.1. Quyết định

- **Forward-only SQL migration**, không auto-run lúc startup.
- Không dùng Alembic/SQLAlchemy ở v1 để giữ dependency nhỏ; nếu schema thay đổi thường
  xuyên, có thể thêm Alembic ở phase sau.
- Mỗi file migration có checksum SHA-256; runner từ chối nếu file đã apply bị sửa.
- App kiểm tra schema version khi khởi động; thiếu/sai → scenario store `ready=false`,
  API scenario `503`; optimize vẫn chạy.

### 8.2. Runner đề xuất

`scripts/migrate.py`:

```text
python scripts/migrate.py --check
python scripts/migrate.py --apply
```

- Đọc `DATABASE_URL` từ env hoặc `--database-url`.
- Tạo `schema_migrations` nếu chưa có.
- Liệt kê `backend/migrations/*.sql` theo thứ tự tên.
- `--check`: exit 1 nếu có file chưa apply hoặc checksum lệch.
- `--apply`: mỗi file trong một transaction; ghi `version`, `checksum`, `applied_at`.
- Không chạy migration trong `main.py` hoặc `render.yaml` start command.
- Migration đầu tiên: `001_scenarios.sql`.

### 8.3. Quy trình deploy

1. Provision PostgreSQL 16+ (Neon/Supabase/Render Postgres — staging hiện tại dùng Neon 18.6), tạo database riêng.
2. Tạo role migrator/app; lưu `DATABASE_URL` vào secret manager.
3. Chạy `scripts/migrate.py --apply` từ CI/CD hoặc máy admin.
4. Set env private staging:
   - `SCENARIO_PERSISTENCE=postgres`
   - `DATABASE_URL=...`
   - `SCENARIO_API_TOKEN=...`
   - `SCENARIO_WORKSPACE_ID=demo-staging`
   - `AUTH_DEMO_PASSWORD=...`, `AUTH_SESSION_SECRET=...` (bật demo login)
   - `AUTH_ADMIN_USERS=admin`, `AUTH_VIEWER_USERS=test1,test2,test3,test4`
5. Restart API; kiểm tra `/api/health` → `scenario_store.ready=true`.
6. Smoke test create/list/get/delete bằng token.
7. Chỉ khi pass mới cân nhắc bật cho môi trường private khác.

### 8.4. Rollback

- **App rollback:** đặt `SCENARIO_PERSISTENCE=localStorage`, restart. API scenario trả
  503; optimize/export không đổi; dữ liệu DB giữ nguyên.
- **Schema rollback:** không downgrade tự động. Nếu cần, viết migration mới
  `002_...` để sửa; không sửa file `001` đã apply.
- **Data rollback:** restore backup provider nếu cần; dữ liệu synthetic nên chấp nhận
  mất mát trong demo.
- Không xóa bảng khi rollback app; tránh mất dữ liệu ngoài ý muốn.

### 8.5. Backup và retention

| Hạng mục | Đề xuất |
|---|---|
| Backup | Provider automated daily; giữ 7 ngày |
| Restore drill | Chạy thử restore trước khi coi Phase 4 done |
| RPO/RTO | RPO 24h, RTO 2h (demo synthetic) |
| Audit retention | 90 ngày; purge script định kỳ |
| Scenario retention | Không tự xóa; người dùng DELETE hoặc quota 200 |

---

## 9. Cấu hình

| Env | Bắt buộc | Mặc định | Secret | Ghi chú |
|---|---|---|---|---|
| `SCENARIO_PERSISTENCE` | Không | `localStorage` | Không | `localStorage` hoặc `postgres` |
| `DATABASE_URL` | Khi postgres | — | **Có** | `postgresql://user:pass@host/db?sslmode=require` |
| `SCENARIO_API_TOKEN` | Khi postgres | — | **Có** | ≥ 32 byte random; không đưa vào frontend |
| `SCENARIO_API_TOKEN_PREVIOUS` | Không | — | **Có** | Rotation tạm thời |
| `SCENARIO_WORKSPACE_ID` | Không | `demo` | Không | Regex `[a-z0-9][a-z0-9_-]{0,63}` |
| `SCENARIO_ACTOR_LABEL` | Không | `admin` | Không | Ghi vào audit |
| `SCENARIO_MAX_PER_WORKSPACE` | Không | `200` | Không | Quota scenario |
| `SCENARIO_MAX_PAYLOAD_BYTES` | Không | `1500000` | Không | ≤ `MAX_BODY_BYTES` |
| `SCENARIO_SAVE_RATE_LIMIT_MAX` | Không | `5` | Không | Write/phút |
| `SCENARIO_SAVE_RATE_LIMIT_WINDOW_SEC` | Không | `60` | Không | Window |
| `SCENARIO_DB_POOL_MIN` | Không | `1` | Không | psycopg pool |
| `SCENARIO_DB_POOL_MAX` | Không | `5` | Không | psycopg pool |
| `SCENARIO_DB_TIMEOUT_SEC` | Không | `5` | Không | Connect/query timeout |
| `SCENARIO_AUDIT_RETENTION_DAYS` | Không | `90` | Không | Purge Phase 4B |
| `AUTH_DEMO_PASSWORD` | Để bật login | — | **Có** | ≥ 8 ký tự; mật khẩu dùng chung cho demo |
| `AUTH_SESSION_SECRET` | Để bật login | — | **Có** | ≥ 32 byte random; ký session token |
| `AUTH_ADMIN_USERS` | Không | `admin` | Không | Danh sách phẩy; create/delete |
| `AUTH_VIEWER_USERS` | Không | `test1,test2,test3,test4` | Không | Danh sách phẩy; list/get |
| `AUTH_SESSION_TTL_SEC` | Không | `28800` | Không | 8 giờ; tối đa 30 ngày |
| `AUTH_COOKIE_SECURE` | Không | `auto` | Không | `auto`/`always`/`never` |
| `AUTH_LOGIN_RATE_LIMIT_MAX` | Không | `10` | Không | Login attempts / 5 phút |
| `TEST_DATABASE_URL` | Không | — | **Có** | Chỉ test/CI, không production |

- `MAX_BODY_BYTES` hiện tại 2.000.000 vẫn là giới hạn ngoài cùng.
- `SCENARIO_MAX_PAYLOAD_BYTES` phải nhỏ hơn hoặc bằng `MAX_BODY_BYTES`.
- Không thêm `DATABASE_URL`, `SCENARIO_API_TOKEN`, `AUTH_DEMO_PASSWORD` hoặc
  `AUTH_SESSION_SECRET` vào `render.yaml` dạng plaintext; dùng secret env của Render.
  `render.yaml` hiện vẫn để `SCENARIO_PERSISTENCE=localStorage` cho đến khi triển khai thật.

---

## 10. Health check

Giữ field cũ để không breaking frontend:

```json
{
  "status": "ok",
  "scenario_persistence": "postgres",
  "scenario_store": {
    "mode": "postgres",
    "ready": true,
    "schema_version": 1,
    "reason": null
  }
}
```

Khi tắt:

```json
{
  "scenario_persistence": "localStorage",
  "scenario_store": {
    "mode": "localStorage",
    "ready": true,
    "schema_version": null,
    "reason": "disabled"
  }
}
```

Khi lỗi:

```json
{
  "scenario_persistence": "postgres",
  "scenario_store": {
    "mode": "postgres",
    "ready": false,
    "schema_version": null,
    "reason": "database_unavailable"
  }
}
```

`reason` chỉ là enum an toàn: `disabled`, `misconfigured`, `schema_missing`,
`database_unavailable`, `ready`. Không trả exception text hoặc DSN.

Health check DB phải rẻ: `SELECT 1` với timeout ngắn, cache kết quả 5–10 giây để tránh
mỗi lần gọi health đều đập DB. Nếu DB chậm, health vẫn trả 200 cho solver; chỉ
`scenario_store.ready=false`.

---

## 11. Kế hoạch triển khai

| Bước | Nội dung | Điều kiện xong | Ước lượng |
|---|---|---|---|
| 4.1 | Design + decision log | Tài liệu này + `CHECKLIST.md` entry | Done |
| 4.2 | Migration + schema + runner | `migrate --check/--apply` idempotent; test checksum | 0,5 ngày |
| 4.3 | Repository + service + fake store tests | CRUD unit test không cần DB; error mapping | Done (DB-free) |
| 4.4 | API + auth + idempotency + limits | API tests 201/401/404/409/413/422/429/503 | 1 ngày |
| 4.5 | Integration tests + staging smoke | Postgres test pass; health ready; rollback drill | 1 ngày |
| 4.6 | Docs + security review sign-off | `SECURITY.md`, `DEPLOYMENT.md`, `DATA_DICTIONARY.md` | 0,5 ngày |

**Gate trước khi code 4.2:** có `DATABASE_URL`, token, DB provider và xác nhận môi
trường private/staging. Không code migration khi chưa có DB đích để test.

---

## 12. Test plan

### 12.1. Unit test (không cần DB)

- Auth: thiếu token, sai token, token đúng, token previous, constant-time wrapper.
- Name: rỗng, toàn khoảng trắng, > 120, control character, Unicode hợp lệ.
- Payload: > 1.5 MB, JSON không phải object, request invalid.
- Idempotency: cùng key + cùng hash → trả row cũ; cùng key + khác hash → 409.
- Cursor: encode/decode, invalid base64, invalid UUID, invalid timestamp.
- Summary mapping: KPI/status/workers/stations đúng.
- Error mapping: DB operational error → 503; integrity error → 409; unknown → 500.
- Không log token/payload: dùng caplog kiểm tra.

### 12.2. Integration test (opt-in, cần `TEST_DATABASE_URL`)

- Apply migration hai lần: lần hai no-op, không lỗi.
- Checksum mismatch: sửa file đã apply → `--check` fail.
- Create/list/get/delete; workspace isolation.
- Quota 200: create thứ 201 bị chặn.
- Concurrent create cùng idempotency key: một row, không lỗi 500.
- Delete + audit: audit còn, scenario mất.
- DB down: API 503, optimize vẫn 200.
- SQL injection payload trong `name` không ảnh hưởng schema.
- Transaction rollback: lỗi audit → không có scenario row.

Đánh dấu `@pytest.mark.postgres`; mặc định skip nếu không có env. CI mặc định vẫn xanh
khi không có DB; job Postgres là optional.

### 12.3. API/security test

- `201` create + `Location`.
- `200` list, pagination 2 trang.
- `401` missing/wrong token; không đọc body.
- `404` ID không tồn tại và ID workspace khác.
- `409` idempotency conflict.
- `413` body/payload lớn.
- `422` request invalid; `INFEASIBLE` không lưu.
- `429` write rate limit.
- `503` persistence disabled/misconfigured/DB down.
- Security headers vẫn có trên response scenario.
- `OPTIONS` preflight không yêu cầu token nhưng origin bị giới hạn.

### 12.4. Regression

- `scripts/verify.ps1` pass khi persistence tắt.
- `/api/optimize`, `/api/export`, import, actuals, time study không đổi.
- Không thêm dependency mới nếu chưa pin và chưa có lý do.

---

## 13. Operational runbook

### 13.1. Bật persistence

```powershell
# 1. Migration (một lần)
$env:DATABASE_URL = "postgresql://..."
.venv\Scripts\python.exe scripts\migrate.py --check
.venv\Scripts\python.exe scripts\migrate.py --apply

# 2. Env private staging
$env:SCENARIO_PERSISTENCE = "postgres"
$env:SCENARIO_API_TOKEN = "<random-32-byte-token>"
$env:SCENARIO_WORKSPACE_ID = "demo-staging"

# 3. Restart API, kiểm tra health
Invoke-RestMethod http://127.0.0.1:8000/api/health |
  Select-Object scenario_persistence, scenario_store
```

### 13.2. Smoke test

```powershell
$headers = @{ Authorization = "Bearer $env:SCENARIO_API_TOKEN" }
$body = @{ name = "Smoke"; request = (Get-Content sample_request.json -Raw | ConvertFrom-Json) } |
  ConvertTo-Json -Depth 100

$created = Invoke-RestMethod -Method Post -Uri http://127.0.0.1:8000/api/scenarios `
  -Headers $headers -ContentType "application/json" -Body $body
Invoke-RestMethod -Uri http://127.0.0.1:8000/api/scenarios -Headers $headers
Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/scenarios/$($created.id)" -Headers $headers
Invoke-RestMethod -Method Delete -Uri "http://127.0.0.1:8000/api/scenarios/$($created.id)" -Headers $headers
```

### 13.3. Tắt persistence

```powershell
$env:SCENARIO_PERSISTENCE = "localStorage"
# restart API
```

- Scenario API trả 503; frontend vẫn dùng localStorage; optimizer không đổi.
- Không xóa DB; có thể bật lại sau.

### 13.4. Rotate token

1. Set `SCENARIO_API_TOKEN_PREVIOUS` = token cũ, `SCENARIO_API_TOKEN` = token mới.
2. Restart; cả hai token hoạt động.
3. Cập nhật client.
4. Xóa `SCENARIO_API_TOKEN_PREVIOUS`; restart.

### 13.5. Sự cố DB

- Health `ready=false`, reason `database_unavailable`.
- API scenario 503; optimize vẫn chạy.
- Kiểm tra provider status, connection limit, SSL, role password.
- Không retry vô hạn; client backoff.
- Nếu cần khôi phục dữ liệu, restore backup vào DB mới rồi đổi `DATABASE_URL`.

---

## 14. Câu hỏi mở và blocker

| # | Câu hỏi | Đề xuất mặc định |
|---:|---|---|
| 1 | Có chấp nhận save phải solve lại 20–60s? | Có; đổi lại result đáng tin và metadata nhất quán |
| 2 | Có cần UI quản trị scenario trong Phase 4? | Phase 4.6 đã có panel server scenarios tối giản; không phải trang quản trị riêng |
| 3 | Có cần auth/RBAC đầy đủ ngay? | Không; demo accounts admin/viewer ở Phase 4.6, auth production vẫn ở phase sau |
| 4 | Hard delete hay soft delete? | Hard delete + audit; dữ liệu synthetic |
| 5 | Có cho phép trùng tên scenario? | Có; `id` là khóa, list hiển thị thời gian |
| 6 | DB provider/region? | Neon/Supabase/Render Postgres, region gần API |
| 7 | Audit retention? | 90 ngày, purge định kỳ |
| 8 | Có cần `reproduce` endpoint ngay? | Phase 4B, sau CRUD |

**Trạng thái blocker:** private staging đã có `DATABASE_URL`, token, `AUTH_*` và migration
applied. Neon password đã rotate ngày 2026-11-08. Còn public deployment + secret Render,
DB role giới hạn quyền, quota advisory lock, purge audit và security sign-off cho môi
trường public. Không có blocker kỹ thuật cho CRUD + demo login trên staging.

---

## 15. Acceptance criteria cho Phase 4

### 15.1. Design (đã đạt khi tài liệu này được review)

- [x] Có schema DDL, index, audit, migration plan.
- [x] Có threat model và security controls.
- [x] Có API contract, error mapping, env vars.
- [x] Có test plan và rollback/runbook.
- [x] Ghi rõ non-goals và blocker.
- [x] Không thêm code/DB/dependency trong bước design.

### 15.2. Implementation gate (đạt trên private staging; public deploy còn mở)

- [x] `DATABASE_URL` + `SCENARIO_API_TOKEN` + DB private/staging.
- [x] Migration `001` apply thành công, `--check` sạch.
- [x] DB-free unit tests pass; `scripts/verify.ps1` pass khi persistence tắt.
- [x] API tests pass; integration test Postgres pass (gồm timezone non-UTC).
- [x] Smoke create/list/get/delete + 401/404/409/413/422/429/503.
- [x] Demo accounts: `GET/POST /api/auth/*`, signed HttpOnly cookie, role guard, CSRF
      Origin check, password-change revocation, login rate limit.
- [x] Frontend: login dialog, role chip/logout, server scenario panel với loading/error/
      empty state; admin write, viewer read-only; UI check 1440px và 390px.
- [x] Smoke demo auth trên Neon: 29/29 check pass (login admin/viewer, cookie flags, CSRF
      rejection, 401/403, create/list/get/delete, logout, after-logout 401); scenario
      smoke đã xóa.
- [ ] Security review sign-off cho public deployment: auth demo, CORS, SQL injection, log
      leakage, DB role. Đã review token/CORS/SQL/log leakage; Neon password đã rotate ngày
      2026-11-08. Còn residual: app dùng DB role owner `neondb_owner`, demo password dùng
      chung, viewer đọc được mọi scenario trong workspace.
- [x] Docs cập nhật: `DATA_DICTIONARY.md`, `SECURITY.md`, `DEPLOYMENT.md`, `README.md`,
      `CHECKLIST.md`.
- [x] Rollback drill: tắt persistence, optimize vẫn chạy (`OPTIMAL`), scenarios trả 503.
- [ ] Public deployment: Render secret + Netlify env, HTTPS cookie `__Host-`, public smoke
      trên URL thật. Chưa thực hiện vì chưa có credential/quyền deploy.

---

## 16. Tài liệu liên quan

- `ROADMAP.md` §3.6, §10.3 — persistence strategy và env.
- `DATA_DICTIONARY.md` §3.16–3.18 — scenario import và Phase 4 design.
- `SECURITY.md` — scope, reporting, controls.
- `DEPLOYMENT.md` — Render/Netlify, env, rollback.
- `CHECKLIST.md` §12 — decision log.
- `backend/app/models.py` — `OptimizeRequest`, `OptimizeResponse`, `RunMetadata`.
- `backend/app/optimizer.py` — `_input_hash`, `solve_line_balancing`.
