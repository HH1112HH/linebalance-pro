# Contributing

Thanks for taking a look at LineBalance Pro. This is a portfolio/demo project, but issues and focused pull requests are welcome.

## Ground rules

- **Correctness first.** KPI, solver status, and constraints must stay truthful. Never report `OPTIMAL` without `lexicographic_proven=true`.
- **Synthetic data only.** Do not add real factory, payroll, or personal data.
- **One source of truth per number.** Formulas live in the backend and are documented in `KPI_SPEC.md`; `frontend/src/types.ts` mirrors the API contract.
- **Keep the layering.** Validation -> MILP -> KPI -> planning -> API -> UI. No KPI formulas in JSX.

## Setup

Prerequisites: Python 3.12+ and Node 22+.

```powershell
python -m venv .venv
.venv\Scripts\python.exe -m pip install -r backend/requirements-dev.txt
npm --prefix frontend ci

.venv\Scripts\python.exe -m uvicorn backend.app.main:app --reload --port 8000
npm --prefix frontend run dev
```

The API is at `http://127.0.0.1:8000`, the UI at `http://127.0.0.1:5173`.

## Before opening a pull request

Run the single verification gate:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/verify.ps1
```

It runs backend pytest with coverage >= 80%, Ruff lint/format, mypy, frontend ESLint, Prettier check, TypeScript typecheck, and the production build.

Also:

- Add or update tests for behavior changes; bug fixes need a regression test.
- Update the relevant contract: `KPI_SPEC.md`, `MODEL.md`, `frontend/src/types.ts`, or `DEPLOYMENT.md`.
- Record scope or semantics decisions in `CHECKLIST.md` (append, do not rewrite history).

## Commit style

Use `type(scope): summary` with `feat`, `fix`, `test`, `docs`, `chore`, `refactor`, or `perf`.

Examples:

- `feat(api): add machine requirement summary`
- `fix(kpi): apply allowance exactly once`
- `docs(readme): add solver benchmark`

## Pull request checklist

- [ ] `scripts/verify.ps1` passes.
- [ ] New behavior has a test (bug fixes include a regression test).
- [ ] API, schema, and docs are updated together.
- [ ] UI states cover loading, error, and empty.
- [ ] No secrets, real production data, or hard-coded sample results.
- [ ] `CHECKLIST.md` updated when a decision or scope changes.

## Security

Report vulnerabilities privately — see [`SECURITY.md`](SECURITY.md). Do not open a public issue for security reports.
