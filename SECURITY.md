# Security Policy

## Supported versions

| Version | Supported |
|---|---|
| `main` (latest) | Yes |
| `v0.2.x` | Yes |
| Older tags | No |

This is a synthetic-data demo, not a production HR, payroll, or MES system. Security fixes land on `main` first.

## Reporting a vulnerability

Please **do not** open a public issue for security problems.

Use GitHub private vulnerability reporting:

<https://github.com/HH1112HH/linebalance-pro/security/advisories/new>

Include:

- the affected endpoint or file, plus the version or commit;
- reproduction steps or a minimal request;
- the impact you observed (for example solver exhaustion, payload handling, or a header/CORS bypass);
- a suggested fix if you have one.

You can expect an initial response within 7 days. This is a portfolio project maintained on a best-effort basis; there is no bug bounty.

## Scope

In scope:

- API input validation, request size/rate/concurrency limits, CORS, and security headers (`backend/app/main.py`).
- Solver time limits and denial of service through oversized or adversarial models.
- XLSX export handling and response headers.
- Dependency and CI configuration.

Out of scope:

- Accuracy of synthetic data or KPI formulas (see [`KPI_SPEC.md`](KPI_SPEC.md)).
- Production identity, enterprise RBAC, multi-tenancy, and public write APIs are out of scope. Phase 4 ships environment-backed **demo accounts** (admin/viewer) over a single shared workspace and a PostgreSQL staging database; it is not a production authorization system.
- Vulnerabilities in third-party services (Render, Netlify, GitHub) or local browser extensions.

## Existing controls

- Pydantic v2 validation at the API boundary with operation, worker, and machine limits.
- Request body limit, per-client rate limit, and a concurrency guard.
- Solver time limit; no unbounded solve request.
- CORS allowlist through environment variables; no `*` together with credentials.
- Security headers and `Cache-Control: no-store` on API responses.
- Secrets only through environment variables; no credentials in the repository.
- Pinned dependencies, Dependabot updates, and CI quality gates.

## Phase 4 controls (private staging, implemented)

Phase 4 PostgreSQL scenario persistence is enabled on private staging only. Implemented controls:

- Private bearer token (`SCENARIO_API_TOKEN`) with constant-time comparison for admin/ops clients; missing/invalid credentials return `401`; the token is never returned, logged, or shipped to the frontend.
- Environment-backed demo accounts: `AUTH_DEMO_PASSWORD`, `AUTH_SESSION_SECRET`, `AUTH_ADMIN_USERS`, `AUTH_VIEWER_USERS`. Usernames, roles and password live only in server env; the frontend receives only the username, role, login-enabled flag and session TTL.
- Stateless HMAC-SHA256 session token in an HttpOnly, `SameSite=Lax` cookie; `Secure` and the `__Host-` prefix under HTTPS; 8-hour default TTL. The token includes a password fingerprint, so rotating the password invalidates existing sessions.
- Role enforcement: viewers can list/get scenarios; only admins can create/delete. Cookie-authenticated writes also require an allowed `Origin` header (CSRF); bearer-token writes are exempt because a browser does not attach that token automatically.
- Login and scenario-write rate limits; login failures return a generic `401` without revealing whether the username exists. Logs record success/failure but never the password, session token, DSN, or bearer token.
- One `SCENARIO_WORKSPACE_ID`; every query filters by workspace and cross-workspace IDs return a generic `404`.
- Parameterized SQL only; no user input is interpolated into SQL text.
- Append-only audit rows for create/delete; scenario payloads remain synthetic/demo data.
- Persistence disabled by default (`SCENARIO_PERSISTENCE=localStorage`); DB/misconfiguration returns `503` while optimize/export stay available. Connection pool closes during app shutdown.
- Payload cap 1.5 MB inside a 2 MB body limit; write rate limit (default 5/minute); solver time limit still applies.
- CORS allowlist with explicit origins plus the Netlify preview regex and `allow_credentials=True`; `*` is never used with credentials.

Residual risks before any public deployment:

- Demo accounts share one password; there is no identity provider, MFA, password policy, account lockout, or per-user revocation list. Anyone with the demo password can sign in as any listed account.
- Admin and viewers share one workspace, so read-only accounts can read every scenario in that workspace. This is intentional for the demo and must be documented before sharing credentials.
- The app currently connects as the database owner (`neondb_owner`), not a least-privilege scenario role.
- Scenario quota is enforced with `count` then `insert`, without `pg_advisory_xact_lock`; concurrent writes can briefly exceed the soft quota.
- `SCENARIO_AUDIT_RETENTION_DAYS` is documented but no purge job exists yet.
- The Neon password was exposed in chat and was rotated on 2026-11-08; the new DSN is only in the gitignored `.env.local`. The Render secret must be set to the rotated value when a deployment is created.
- Demo auth is not a substitute for production identity, least privilege, or compliance review.

See [`docs/POSTGRESQL_PERSISTENCE_DESIGN.md`](docs/POSTGRESQL_PERSISTENCE_DESIGN.md) for the threat model and test plan.

## Data policy

The public demo uses synthetic data only. Do not submit real factory, payroll, or personal data in issues, pull requests, or demo requests.
