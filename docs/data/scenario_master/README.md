# Scenario master-data CSV and Excel templates

Synthetic/demo templates for `POST /api/import/scenario`,
`POST /api/import/scenario/excel` and the Solver panel **Import routing, crew
and machines**. They reproduce the same 40-operation, 24-worker, 23-machine
scenario used by the optimizer demo.

| File | Rows | Grain | Key |
|---|---:|---|---|
| `operations.csv` | 40 | operation | `operation_id` |
| `workers.csv` | 24 | worker | `worker_id` |
| `worker_skills.csv` | 576 | worker × operation | `worker_id, operation_id` |
| `machines.csv` | 23 | machine | `machine_id` |
| `scenario_master.xlsx` | 4 sheets | sheet | sheet name |

All rows carry `data_policy=SYNTHETIC` where the column is present.

The workbook has the same data in four sheets named `operations`, `workers`,
`worker_skills` and `machines`. It is generated from the CSV files with:

```powershell
.venv\Scripts\python.exe scripts\build_scenario_workbook.py
```

## Upload

### Four CSV files

Choose all four files in the Solver panel and select **Validate import**, then
**Apply & solve**. The browser sends one JSON request:

```json
{
  "operations_csv": "<contents of operations.csv>",
  "workers_csv": "<contents of workers.csv>",
  "worker_skills_csv": "<contents of worker_skills.csv>",
  "machines_csv": "<contents of machines.csv>"
}
```

### One Excel workbook

Choose `scenario_master.xlsx` in the same panel and select **Validate
workbook**. The browser sends the binary `.xlsx` body with
`Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
to `/api/import/scenario/excel`. Sheet names are case-insensitive; spaces and
dashes are normalized, so `Worker Skills` also works. The `machines` sheet may
be omitted when every operation is manual.

Use plain values, not formulas; the reader uses `data_only=True` and a formula
without a cached value becomes blank. The preview and apply behavior is shared
with the CSV path.

## Column contract

**operations** — required: `operation_id`, `operation_name`, `sam_sec`,
`predecessor_ids`, `machine_type`, `skill_code`, `skill_required`,
`is_quality_gate`, `sequence`; optional: `line_name`, `style_code`,
`data_policy`.

**workers** — required: `worker_id`, `worker_name`; optional: `available`,
`worker_status`, `machine_types`. `efficiency_factor` is rejected: worker-specific
performance is not part of this import, and approved SAM per operation remains
the only basis.

**worker_skills** — required: `worker_id`, `operation_id`, `skill_grade`
(`A`=3, `B`=2, `C`=1, `NONE`/`0`=0, or a number 0–3).

**machines** — required: `machine_id`, `machine_type`, `available`,
`capacity`; the sheet/file may be empty when every operation is manual.

Lists (`predecessor_ids`, `machine_types`) use `|`, `;` or `,` as separators.
`machine_type` blank/`MANUAL`/`NONE` means manual. Every real machine type used
by an operation needs at least one available machine.

## Limits and semantics

- CSV: UTF-8 (BOM allowed); up to 200 operations, 100 workers, 10,000 skill rows
  and 200 machines.
- Excel: body 2 MB; up to 30 worksheets, 2,000 zip entries, 20,000,000 bytes
  uncompressed, 10,001 rows per sheet; the same field limits then apply.
- `line_name` and `style_code` must be consistent across operations rows.
- The API validates structure, IDs, references, precedence cycles, skill grades
  and machine coverage only. Optimizer eligibility is re-checked when the
  preview is applied.
- Nothing is persisted. Applying replaces the working routing/crew/machines,
  clears the old baseline, keeps actuals only when style and line match, and
  reruns `/api/optimize`.
- These files are synthetic/demo master data, not an HBI style master or a
  production routing release.
