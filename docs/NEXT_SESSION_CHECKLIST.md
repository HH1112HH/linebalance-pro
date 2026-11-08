# Next session checklist — Neon + demo login + login UI

> **Ngày dự kiến:** 2026-11-09
> **Mục tiêu:** bật Neon/demo auth trên public demo, hoàn thiện giao diện đăng nhập, kiểm chứng end-to-end và cập nhật docs.
> **Nguyên tắc:** synthetic data only; không commit secret; không claim production identity; `OPTIMAL` chỉ khi solver chứng minh.

---

## 0. Baseline đã xác nhận (2026-11-08)

- [x] UI public: `https://linebalance-pro.netlify.app` — `GET /` 200.
- [x] API public: `https://linebalance-pro.onrender.com` — `GET /api/health` 200.
- [x] Netlify proxy `/api/*` → Render hoạt động; SPA fallback hoạt động.
- [x] Render: `rootDir=backend`, health check `/api/health`, `SOLVER_BACKEND=highs`, deploy `live`.
- [x] Public hiện tại: `SCENARIO_PERSISTENCE=localStorage`, `auth.enabled=false`, login button bị disabled.
- [x] Login UI đã có sẵn trong code: `frontend/src/components/AuthDialog.tsx`, mở từ `Topbar` và `ServerSnapshotsPanel`.
- [x] Backend auth đã có: `/api/auth/session`, `/api/auth/login`, `/api/auth/logout`; cookie HttpOnly/SameSite=Lax; role admin/viewer.
- [x] Neon private staging đã có migration `001`; `.env.local` (gitignored) đã có `DATABASE_URL`, `SCENARIO_API_TOKEN`, `AUTH_DEMO_PASSWORD`, `AUTH_SESSION_SECRET`.
- [x] `scripts/verify.ps1` pass — 138 passed, 3 skipped, coverage 86.19%.

**Kết luận:** không cần viết lại login từ đầu. Việc chính là **bật auth/Neon trên Render** và **thêm trang `/login` full-screen** dùng chung form với modal hiện có.

### 0.1. Quyết định đã chốt (2026-11-08)

| Hạng mục | Chốt |
|---|---|
| Giao diện đăng nhập | Trang full-screen `/login` + giữ modal quick sign-in |
| Mật khẩu demo | Tách `AUTH_ADMIN_PASSWORD` (private) / `AUTH_VIEWER_PASSWORD` (public demo), fallback `AUTH_DEMO_PASSWORD` |
| Neon | Bật `SCENARIO_PERSISTENCE=postgres` trên Render |

---

## 1. Quyết định đã chốt (đọc trước khi code)

### 1.1. Kiểu giao diện đăng nhập — ✅ chốt **B**

- [x] **B — trang login full-screen, không thêm router:**
  - route mềm `/login` đọc bằng `window.location.pathname`; Netlify SPA fallback `/* → /index.html` đã có nên deep-link chạy được;
  - `LoginPage` full-screen: branding + form + link “quay lại workspace”;
  - giữ `AuthDialog` cho quick sign-in từ Topbar;
  - tách `LoginForm` dùng chung cho cả page và modal (tránh lặp logic form);
  - đăng nhập xong: `history.replaceState(null, "", "/")` rồi đóng page;
  - nếu đã đăng nhập mà mở `/login`: hiện trạng thái đã đăng nhập + nút logout/quay lại.
- [ ] ~~A — chỉ nâng cấp modal~~ (phương án dự phòng nếu tụt giờ).
- [ ] ~~C — chỉ bật auth, không đổi UI~~ (không dùng).

### 1.2. Mật khẩu demo public — ✅ chốt **A**

- [x] **A — tách mật khẩu admin/viewer:**
  - `AUTH_ADMIN_PASSWORD` cho `admin` — **private**, chỉ bạn giữ;
  - `AUTH_VIEWER_PASSWORD` cho `test1`–`test4` — có thể public để visitor xem server scenarios;
  - `AUTH_DEMO_PASSWORD` giữ làm fallback cho local/backward compatibility;
  - viewer không thể create/delete scenario (đã có `403` ở backend).
- [x] `AuthSettings` cần thêm `admin_password` / `viewer_password`; `enabled` = có ít nhất một password; `password_for(role)` chọn đúng password.
- [x] Fingerprint trong session token phải **theo role** (`password_fingerprint_for(role)`) để rotate password admin không đá viewer ra và ngược lại.
- [x] Validate: mỗi password ≥ 8 ký tự; admin ≠ viewer; có password thì bắt buộc `AUTH_SESSION_SECRET` ≥ 32 byte; cảnh báo nếu < 12 ký tự.
- [ ] ~~B — một mật khẩu không public~~ (fallback nếu tụt giờ).
- [ ] ~~C — public mật khẩu dùng chung~~ (không dùng vì ai cũng thành admin).

### 1.3. Neon public — ✅ chốt **A**

- [x] **A — bật `SCENARIO_PERSISTENCE=postgres` trên Render**, dùng Neon private staging hiện có (PostgreSQL 18.6).
- [ ] Trước khi bật: chạy `scripts/migrate.py --check`; nếu fail thì `--apply` có kiểm soát rồi check lại.
- [ ] Sau khi bật: `scenario_store.mode=postgres`, `ready=true`, `schema_version=001`; login admin/viewer chạy qua Netlify proxy.
- [ ] Nếu Neon lỗi: rollback về `localStorage` (xem §7), không làm sập `/api/optimize`.
- [ ] ~~B — giữ localStorage~~ (chỉ dùng khi rollback).

### 1.4. Security pre-flight

- [ ] Rotate Render API key đã xuất hiện trong chat; lưu vào password manager, không commit.
- [ ] Nếu Neon password/DSN từng xuất hiện ngoài `.env.local`, rotate lại trước khi public.
- [ ] Xác nhận `.env.local` vẫn gitignored: `git check-ignore -v .env.local`.
- [ ] Không in DSN/token/password ra log, chat, screenshot.

---

## 2. Backend + Neon (75–105 phút)

### 2.1. Migration / dữ liệu

- [ ] Kiểm tra schema:
  ```powershell
  .venv\Scripts\python.exe scripts\migrate.py --check
  ```
- [ ] Nếu `--check` fail: chạy `--apply` có kiểm soát, rồi `--check` lại.
- [ ] Xác nhận `schema_migrations.version=001` và bảng `scenarios`, `scenario_audit` tồn tại.
- [ ] Không chạy auto-migrate lúc app startup.

### 2.2. Env trên Render

Set qua Render Dashboard → Environment (hoặc Render API; nếu dùng API `PUT /env-vars` phải gửi **toàn bộ** danh sách hiện có):

```text
SCENARIO_PERSISTENCE=postgres
DATABASE_URL=<Neon DSN, sslmode=require>
SCENARIO_API_TOKEN=<random 32+ bytes>
SCENARIO_WORKSPACE_ID=demo
AUTH_ADMIN_PASSWORD=<private, ≥ 12 ký tự>
AUTH_VIEWER_PASSWORD=<public demo, ≥ 8 ký tự>
AUTH_SESSION_SECRET=<random 32+ bytes>
AUTH_ADMIN_USERS=admin
AUTH_VIEWER_USERS=test1,test2,test3,test4
AUTH_SESSION_TTL_SEC=28800
AUTH_COOKIE_SECURE=auto
# AUTH_DEMO_PASSWORD chỉ giữ nếu cần fallback local; không set trên public.
```

- [ ] Giữ `SOLVER_BACKEND=highs`, `SOLVER_THREADS=2`, `MAX_CONCURRENT_SOLVES=2`, `PYTHON_VERSION=3.12.8`.
- [ ] `FRONTEND_ORIGINS` có thể thêm `https://linebalance-pro.netlify.app`; proxy same-origin vẫn là chính.
- [ ] Deploy/restart Render; chờ deploy `live`.

### 2.3. Health + auth smoke

- [ ] `GET /api/health` trả `200` với:
  - `scenario_store.mode=postgres`
  - `scenario_store.ready=true`
  - `scenario_store.schema_version=1`
  - `auth.enabled=true`
- [ ] `GET /api/auth/session` anonymous trả `authenticated=false`, `login_enabled=true`.
- [ ] Login sai mật khẩu → `401`.
- [ ] Login đúng admin → `200` + cookie `HttpOnly`, `Secure`, `SameSite=Lax`.
- [ ] Login viewer → `200`, role `viewer`.
- [ ] Logout → `204`; session sau logout `authenticated=false`.
- [ ] `POST /api/scenarios` bằng admin → `201`; list/get `200`; delete `204`; get-after-delete `404`.
- [ ] Viewer create/delete → `403`.
- [ ] Thiếu/sai bearer token → `401`; persistence lỗi → `503` (không làm sập `/api/optimize`).
- [ ] `OPTIMAL`/`FEASIBLE_LIMIT` vẫn đúng; không hạ chuẩn status.

### 2.4. Role passwords (đã chốt 1.2.A)

- [ ] `backend/app/auth.py`:
  - thêm `admin_password` / `viewer_password` vào `AuthSettings`; giữ `password` làm fallback từ `AUTH_DEMO_PASSWORD`;
  - `enabled` = có ít nhất một password; `configured` vẫn yêu cầu `session_secret` hợp lệ;
  - thêm `password_for(role)` và `password_fingerprint_for(role)`; token payload `pwd` dùng fingerprint theo role;
  - `verify_session_token` so fingerprint theo `role` trong payload, không dùng một fingerprint chung;
  - `authenticate_demo_user`: lấy role trước, so sánh constant-time với password của role; username lạ vẫn phải chạy một phép so sánh giả để giảm lệch timing.
- [ ] Validate: mỗi password ≥ 8 ký tự; admin ≠ viewer; secret ≥ 32 byte; cảnh báo password < 12 ký tự.
- [ ] `tests/test_auth_api.py`:
  - admin password **không** đăng nhập được `test1`; viewer password **không** đăng nhập được `admin`;
  - fallback `AUTH_DEMO_PASSWORD` vẫn pass khi không set password riêng;
  - rotate password admin làm token admin cũ invalid nhưng token viewer còn hiệu lực (và ngược lại);
  - thiếu secret / password quá ngắn / trùng password → `config_error` đúng.
- [ ] `main.py`: health chỉ trả `auth.enabled`, roles, TTL; không lộ password/fingerprint.
- [ ] `.env.local`: thêm hai biến mới để test local; không commit.

---

## 3. Login UI (120–180 phút)

### 3.1. Component / state

- [ ] Tạo `frontend/src/components/LoginForm.tsx` dùng chung: username, password, show/hide, chips, error, submit.
- [ ] `frontend/src/components/AuthDialog.tsx`: bọc `LoginForm` trong modal; giữ ESC/focus trap/trả focus.
- [ ] `frontend/src/components/LoginPage.tsx`: full-screen, branding + `LoginForm` + link quay lại; trạng thái đã đăng nhập.
- [ ] `frontend/src/App.tsx`: state `loginPageOpen`, đọc `/login` lúc mount; `handleLogin` dùng chung; `history.replaceState` khi xong.
- [ ] `frontend/src/components/Topbar.tsx`: Sign in enabled khi `login_enabled=true`; thêm link mở `/login` (hoặc modal có link “mở trang đăng nhập”).
- [ ] `frontend/src/components/ServerSnapshotsPanel.tsx`: prompt login khi anonymous; banner viewer read-only; empty/loading/error; session expired → reset + mở login.
- [ ] `frontend/src/i18n.tsx`: chuỗi EN/VI cho page, chip, role, show/hide, lỗi, disabled, “quay lại workspace”.
- [ ] `frontend/src/styles.css`: layout full-screen, chip, password toggle, focus ring; kiểm tra 390px không tràn ngang.

### 3.2. Trang login `/login` (đã chốt 1.1.B)

- [ ] `LoginPage` full-screen, không thêm router dependency.
- [ ] Deep-link: `window.location.pathname === "/login"` → mở page; Netlify `/* → /index.html` đã có.
- [ ] Đăng nhập thành công: `history.replaceState(null, "", "/")`, đóng page, hiện notice.
- [ ] Đã đăng nhập mà vào `/login`: hiện session hiện tại + nút logout/quay lại, không hiện form trống.
- [ ] `AuthDialog` vẫn dùng được cho quick sign-in; cả hai dùng chung `LoginForm` + `handleLogin`.
- [ ] Không hard-code password trong frontend; không log password/session.
- [ ] Test tay: mở trực tiếp `https://…/login`, refresh vẫn vào đúng page, sau login URL về `/`.

### 3.3. UX/accessibility checklist

- [ ] Label cho input; `autoComplete="username"` / `"current-password"`.
- [ ] Modal dùng `aria-modal` + `aria-labelledby`; trang `/login` dùng `<main>` + heading rõ.
- [ ] Focus vào username khi mở modal/page; ESC chỉ đóng modal, không đóng page.
- [ ] Không horizontal scroll ở 390px và 1440px.
- [ ] Loading state khi submit; không double-submit.
- [ ] Error message actionable: sai mật khẩu, quá nhiều lần thử, server chưa cấu hình, mất kết nối.
- [ ] Không hiển thị token/session trong UI.

---

## 4. Test + verify (30–45 phút)

- [ ] Backend:
  ```powershell
  .venv\Scripts\python.exe -m pytest
  .venv\Scripts\python.exe -m ruff check backend tests
  .venv\Scripts\python.exe -m ruff format --check backend tests
  .venv\Scripts\python.exe -m mypy backend/app
  ```
- [ ] Frontend:
  ```powershell
  npm --prefix frontend run lint
  npm --prefix frontend run format:check
  npm --prefix frontend run typecheck
  npm --prefix frontend run build
  ```
- [ ] Full gate:
  ```powershell
  powershell -ExecutionPolicy Bypass -File scripts/verify.ps1
  ```
- [ ] Nếu có Playwright: chạy `frontend/scripts/ui-check.mjs` + `responsive-check.mjs`; thêm smoke login admin/viewer nếu kịp.
- [ ] Manual browser 1440px + 390px: `/login` direct link + refresh, modal quick sign-in, show/hide password, admin save, viewer read-only, logout, refresh session.
- [ ] `git diff --check` sạch; không có secret trong diff.

---

## 5. Deploy (30 phút)

- [ ] Commit nhỏ, message rõ:
  - `feat(auth): support separate admin and viewer demo passwords`
  - `feat(ui): add full-screen demo login page`
  - `feat(ui): polish login form and dialog`
  - `docs: document public Neon auth rollout`
- [ ] Push `main`.
- [ ] Kiểm tra Render auto-deploy; nếu không trigger, trigger thủ công bằng Render API/dashboard.
- [ ] Build + deploy Netlify:
  ```powershell
  npm --prefix frontend run build
  npx --yes netlify-cli@latest deploy --prod --no-build --dir frontend/dist --site a5ab6684-ddb0-4fff-aeb8-c1db1d572841
  ```
- [ ] Warm up API trước smoke: `GET /api/health`.

### Public smoke bắt buộc

- [ ] `GET https://linebalance-pro.netlify.app/` → 200.
- [ ] `GET https://linebalance-pro.netlify.app/login` → 200 (SPA fallback) và mở đúng trang login.
- [ ] `GET https://linebalance-pro.netlify.app/api/health` → 200, `scenario_store.mode=postgres`, `auth.enabled=true`.
- [ ] Mở UI → `/login` → admin login → URL về `/` → save scenario → list → load → delete.
- [ ] Modal quick sign-in vẫn hoạt động từ Topbar.
- [ ] Logout → refresh → vẫn logged out.
- [ ] Viewer login → list/get OK; save/delete bị chặn (UI + API 403).
- [ ] Sai mật khẩu hiển thị lỗi EN/VI; rate limit 429 có thông điệp.
- [ ] Cookie: HttpOnly + Secure + SameSite=Lax (DevTools/curl).
- [ ] Không có secret trong bundle/network response.
- [ ] Mobile 390px: modal không tràn, nút bấm được.

---

## 6. Docs + CV (45 phút)

- [ ] `README.md`: live demo, demo accounts, login, server persistence, disclaimer synthetic.
- [ ] `DEPLOYMENT.md` §8.2: env Neon/auth, role passwords, smoke results, rollback.
- [ ] `SECURITY.md`: demo auth caveats, shared workspace, no production identity, rate limits.
- [ ] `docs/POSTGRESQL_PERSISTENCE_DESIGN.md`: public status.
- [ ] `CHECKLIST.md`: append entry ngày 2026-11-09 với evidence.
- [ ] Screenshot desktop + mobile: login page `/login`, login modal, admin server panel, viewer read-only.
- [ ] CV bullet chỉ cập nhật sau khi public smoke pass:
  - “Deployed React/TypeScript UI on Netlify + FastAPI/PuLP API on Render, with Neon-backed demo scenarios and role-based demo login.”

---

## 7. Rollback (nếu lỗi)

- [ ] Neon/DB lỗi:
  - set `SCENARIO_PERSISTENCE=localStorage`;
  - bỏ/disable `AUTH_*` secrets nếu login lỗi;
  - restart Render;
  - xác nhận `/api/optimize` + export + localStorage vẫn chạy; `/api/scenarios` trả `503`.
- [ ] UI lỗi: Netlify → Deploys → restore deploy trước.
- [ ] Auth lỗi: giữ login disabled, public vẫn dùng compute/local snapshots.
- [ ] Ghi lại rollback drill + health JSON vào `CHECKLIST.md`.

---

## 8. Definition of Done

- [ ] Public login hoạt động qua Netlify proxy, không lỗi CORS/cookie.
- [ ] `/login` deep-link + refresh hoạt động; login xong URL về `/`.
- [ ] Admin và viewer đúng quyền; viewer không thể ghi/xóa.
- [ ] Neon persistence `ready=true`, `schema_version=1`.
- [ ] Login UI có loading/error/disabled/empty states; EN/VI đầy đủ.
- [ ] 1440px + 390px không tràn ngang; keyboard/focus OK.
- [ ] `scripts/verify.ps1` pass.
- [ ] Không secret trong repo/log/frontend.
- [ ] Docs + `CHECKLIST.md` cập nhật; screenshot có.
- [ ] Rollback drill pass.

---

## 9. Nếu tụt giờ — cắt theo thứ tự

1. Bỏ trang login riêng, chỉ nâng cấp modal.
2. Bỏ role passwords riêng, giữ shared password **không public** (visitor không login).
3. Giữ Neon nhưng chỉ smoke API, chưa làm screenshot/CV bullet.
4. Không bật Neon public; giữ `localStorage`, chỉ polish UI disabled state.

**Không cắt:** kiểm tra secret, 401/403/429, cookie flags, rollback, `verify.ps1`.
