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
- Missing authentication, authorization, multi-tenancy, and persistence — documented demo limitations.
- Vulnerabilities in third-party services (Render, Netlify, GitHub) or local browser extensions.

## Existing controls

- Pydantic v2 validation at the API boundary with operation, worker, and machine limits.
- Request body limit, per-client rate limit, and a concurrency guard.
- Solver time limit; no unbounded solve request.
- CORS allowlist through environment variables; no `*` together with credentials.
- Security headers and `Cache-Control: no-store` on API responses.
- Secrets only through environment variables; no credentials in the repository.
- Pinned dependencies, Dependabot updates, and CI quality gates.

## Data policy

The public demo uses synthetic data only. Do not submit real factory, payroll, or personal data in issues, pull requests, or demo requests.
