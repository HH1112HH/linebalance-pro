import { createContext, useContext } from "react";
import type {
  LossCategory,
  OptimizeResult,
  SampleRequest,
  StationStatus,
  WarningItem,
} from "./types";
import { formatNumber } from "./utils";

export type Language = "en" | "vi";

export type TranslationVars = Record<string, string | number>;

const EN = {
  "nav.overview.label": "Overview",
  "nav.overview.short": "Overview",
  "nav.overview.hint": "Dashboard",
  "nav.balance.label": "Line balance",
  "nav.balance.short": "Balance",
  "nav.balance.hint": "Yamazumi & map",
  "nav.capacity.label": "Capacity & people",
  "nav.capacity.short": "Capacity",
  "nav.capacity.hint": "HC & machines",
  "nav.actuals.label": "Actuals",
  "nav.actuals.short": "Actuals",
  "nav.actuals.hint": "Shift log",
  "nav.timeStudy.label": "Time study",
  "nav.timeStudy.short": "Time study",
  "nav.timeStudy.hint": "Method",
  "nav.styleSetup.label": "New style",
  "nav.styleSetup.short": "Style",
  "nav.styleSetup.hint": "Readiness & flow",
  "nav.materials.label": "Material norms",
  "nav.materials.short": "Materials",
  "nav.materials.hint": "Usage & variance",
  "nav.solver.label": "Solver & data",
  "nav.solver.short": "Solver",
  "nav.solver.hint": "Provenance",

  "topbar.workspace": "Workspace",
  "topbar.snapshot": "Snapshot · {name}",
  "topbar.workingCopy": "Working copy",
  "topbar.custom": "Custom",
  "topbar.scenarioA": "Stretch",
  "topbar.scenarioB": "Feasible",
  "topbar.scenarioTitle": "{title} · target {target} pcs · {workers} workers",
  "topbar.scenarioGroup": "Planning scenario",
  "topbar.apiReady": "API · {solver}",
  "topbar.ready": "Ready",
  "topbar.apiOffline": "API offline",
  "topbar.apiChecking": "API check…",
  "topbar.export": "Export XLSX",
  "topbar.exporting": "Building…",
  "topbar.rerun": "Re-run",
  "topbar.solving": "Solving…",
  "topbar.language": "Language",
  "topbar.english": "English",
  "topbar.vietnamese": "Vietnamese",
  "topbar.login": "Sign in",
  "topbar.logout": "Sign out",
  "topbar.admin": "Admin",
  "topbar.viewer": "Read-only",
  "topbar.signedIn": "{user} · {role}",
  "topbar.loginHelp":
    "Sign in to save scenarios to the demo server. Compute and local snapshots work without an account.",
  "topbar.line": "Line",
  "topbar.shift": "Shift",
  "topbar.period": "Report period",
  "topbar.singleLine": "Single synthetic line",
  "topbar.singleShift": "Current shift · no date history",
  "topbar.dateHistoryUnavailable":
    "Date-range filtering is unavailable because this API has no dated production history.",
  "topbar.reportContext": "Synthetic report context and scenario selection",
  "report.exportHelp":
    "Download the current request, result, KPI and comparison as an XLSX workbook in the selected UI language.",
  "line.sample": "Line A — Basic Tee",
  "line.sampleFeasible": "Line A — Basic Tee · feasible target 400",
  "shift.sample": "Shift {number}",

  "unit.secondsSuffix": "s",
  "unit.minutesSuffix": " min",
  "unit.piecesSuffix": " pcs",
  "unit.pieces": "pcs",
  "unit.piecesPerShift": "pcs / shift",
  "unit.percentagePointsSuffix": " pp",

  "status.optimal": "Proven optimal",
  "status.feasibleLimit": "Feasible · optimality not proven",
  "status.infeasible": "Infeasible",
  "status.error": "Error",
  "dataPolicy.syntheticDemo": "Synthetic demo only",

  "machine.OVERLOCK": "Overlock",
  "machine.COVERSTITCH": "Coverstitch",
  "machine.IRON": "Iron",
  "machine.SINGLE": "Single-needle",

  "sidebar.controlRoom": "IE control room",
  "sidebar.navAria": "Workspace sections",
  "sidebar.synthetic": "Synthetic data only",
  "sidebar.apiOnline": "API online · {solver}",
  "sidebar.staticDemo": "Static demo · API offline",
  "sidebar.checkingApi": "Checking API…",
  "sidebar.healthCheck": "Health check",
  "sidebar.stack": "React · FastAPI · PuLP/HiGHS",

  "app.shiftDashboard": "Shift dashboard · {shift}",
  "app.shiftSummary":
    "{shiftId} · {minutes} min shift − {break} min break · {days} working days · {samBasis}",
  "sam.includes": "SAM includes allowance",
  "sam.excludes": "SAM excludes allowance (+{pct}%)",

  "page.balance.eyebrow": "Balance engineering",
  "page.balance.title": "Line balance",
  "page.balance.description":
    "Station loads, worker assignment and the synthetic before/after delta. Bar length is planning SAM, not machine utilization.",
  "page.capacity.eyebrow": "Planning",
  "page.capacity.title": "Capacity & people",
  "page.capacity.description":
    "Bottleneck capacity, machine coverage and headcount control. Theoretical capacity ignores precedence, skills and balance.",
  "page.actuals.eyebrow": "Shop floor",
  "page.actuals.title": "Actuals",
  "page.actuals.description":
    "Read one shift snapshot and log production or downtime. Inputs refresh the actuals analysis through the API; re-run only when method or SAM changes.",
  "page.timeStudy.eyebrow": "Industrial engineering",
  "page.timeStudy.title": "Time study",
  "page.timeStudy.description":
    "Observed, normal and standard time for human work. This workflow produces a draft record only; approved SAM remains the planning input.",
  "page.styleSetup.eyebrow": "Style launch control",
  "page.styleSetup.title": "New style readiness",
  "page.styleSetup.description":
    "Review launch gates and inspect the active routing before and after the current line assignment. This is a readiness aid, not a release approval.",
  "page.materials.eyebrow": "Material standardization",
  "page.materials.title": "Material usage & variance",
  "page.materials.description":
    "Synthetic T13 case for thread, 3M tape and binding, plus a what-if usage check. Positive variance is usage above standard; totals are cost avoidance, not Finance-verified cash saving.",
  "page.solver.eyebrow": "Run provenance",
  "page.solver.title": "Solver & data",
  "page.solver.description":
    "How this result was produced, what the status means and where local snapshots live.",

  "style.dataPolicy":
    "Synthetic portfolio workflow. Checklist updates are not stored or treated as production sign-off.",
  "style.readiness.aria": "New style readiness checklist",
  "style.readiness.eyebrow": "Launch gates",
  "style.readiness.title": "Readiness checklist",
  "style.readiness.note":
    "Mark required gates, record an owner or evidence note, then calculate readiness. The score counts completed required items only.",
  "style.readiness.required": "Required gate",
  "style.readiness.status": "Status",
  "style.readiness.evidence": "Owner / evidence / note",
  "style.readiness.evaluate": "Evaluate readiness",
  "style.readiness.evaluating": "Evaluating…",
  "style.readiness.empty":
    "No readiness evaluation yet. Complete the checklist and evaluate it.",
  "style.readiness.resultAria": "Readiness evaluation result",
  "style.readiness.progress": "Required gates complete",
  "style.readiness.ready": "Ready for controlled trial",
  "style.readiness.notReady": "Not ready for release",
  "style.readiness.blockers": "Items to close",
  "style.readiness.noBlockers": "No blocking items in this checklist.",
  "style.readiness.apiError": "Could not calculate readiness. Try again.",
  "style.item.operation_routing": "Operation routing approved",
  "style.item.sam_approved": "SAM basis reviewed and approved",
  "style.item.machine_ready": "Machines and attachments ready",
  "style.item.manpower_assigned": "Manpower plan confirmed",
  "style.item.skill_coverage": "Required skill coverage confirmed",
  "style.item.layout_ready": "Layout and material flow reviewed",
  "style.item.material_ready": "Materials and trims available",
  "style.item.production_trial": "Production trial and first-piece check",
  "style.status.NOT_STARTED": "Not started",
  "style.status.IN_PROGRESS": "In progress",
  "style.status.COMPLETED": "Completed",
  "style.status.BLOCKED": "Blocked",
  "style.flow.aria": "Operation process flow",
  "style.flow.title": "Routing process flow",
  "style.flow.note":
    "Edges follow routing precedence. The optimized view adds station and worker from the current solver result.",
  "style.flow.operationCount": "{count} operations",
  "style.flow.routingOnly": "Routing only",
  "style.flow.optimized": "With assignment",
  "style.flow.loading": "Building the process flow…",
  "style.flow.empty": "No process flow is available for this style.",
  "style.flow.error":
    "Could not build the process flow. Check routing inputs and retry.",
  "style.flow.retry": "Retry flow",
  "style.flow.routingView": "Routing view",
  "style.flow.optimizedView": "Optimized assignment view",
  "style.flow.sam": "SAM {seconds}s",
  "style.flow.machine": "Machine: {machine}",
  "style.flow.manual": "Manual operation",
  "style.flow.qualityGate": "Quality gate",
  "style.flow.station": "Station {station}",
  "style.flow.worker": "Worker {worker}",
  "style.flow.predecessors": "From: {operations}",
  "style.flow.start": "Start of route",
  "style.flow.mobileAria": "Process-flow operation list",
  "style.flow.canvasAria": "Precedence process-flow diagram",

  "materials.loading": "Loading the synthetic material case…",
  "materials.error": "Could not load the material case. Check the API and retry.",
  "materials.retry": "Retry",
  "materials.case.aria": "Synthetic material standardization case",
  "materials.case.eyebrow": "T13 portfolio case",
  "materials.case.title": "Before vs after usage",
  "materials.case.note":
    "LINE_01 / BASIC-TEE-001 · 1,820 pcs per phase · same standard and unit cost.",
  "materials.case.standard": "Standard cost",
  "materials.case.standardDetail": "3 materials · same standard",
  "materials.case.before": "Before actual",
  "materials.case.after": "After actual",
  "materials.case.reduction": "Excess reduction",
  "materials.case.excess": "Excess {value}",
  "materials.case.reductionDetail": "{value} less excess than before",
  "materials.table.material": "Material",
  "materials.table.standard": "Standard / pc",
  "materials.table.before": "Before / pc",
  "materials.table.after": "After / pc",
  "materials.table.variance": "Variance vs standard",
  "materials.table.beforeVar": "Before",
  "materials.table.afterVar": "After",
  "materials.case.footnote":
    "After values remain above standard. The reduction is cost avoidance inside a synthetic 1,820-pc window, not verified cash saving.",
  "materials.check.aria": "Material usage variance calculator",
  "materials.check.eyebrow": "What-if",
  "materials.check.title": "Usage variance check",
  "materials.check.note":
    "Edit actual usage or unit cost and recalculate. Defaults are the synthetic after-pilot values.",
  "materials.check.pcs": "Inspected pcs",
  "materials.check.material": "Material",
  "materials.check.actual": "Actual qty / pc",
  "materials.check.unitCost": "Unit cost (VND)",
  "materials.check.standard": "Standard / pc",
  "materials.check.calculate": "Calculate variance",
  "materials.check.calculating": "Calculating…",
  "materials.check.empty": "No what-if calculation yet.",
  "materials.check.pcsError": "Inspected pcs must be a whole number above zero.",
  "materials.check.valuesError":
    "Actual usage must be zero or above, and unit cost must be above zero.",
  "materials.check.error":
    "Could not calculate material variance. Check input values and retry.",
  "materials.result.standard": "Standard cost",
  "materials.result.actual": "Actual cost",
  "materials.result.variance": "Variance",
  "materials.result.excessCount": "{count} of {total} materials above standard",
  "materials.result.variancePct": "{value} vs standard",
  "materials.result.above": "Above standard",
  "materials.result.within": "Within standard",
  "materials.result.footnote":
    "Standard / actual cost = quantity per pc × inspected pcs × unit cost. Positive variance means usage is above standard; this is a usage variance, not a purchase-price variance. Synthetic/demo only — not a verified production result or a Finance-approved saving.",
  "materials.import.aria": "Material CSV import preview",
  "materials.import.eyebrow": "CSV import · API",
  "materials.import.title": "Validate a material CSV",
  "materials.import.note":
    "Upload a synthetic material-consumption CSV. The server aggregates rows by inspected pcs, ignores other phases, and recalculates cost. Nothing is saved.",
  "materials.import.phase": "Phase to import",
  "materials.import.file": "CSV file",
  "materials.import.fileHint": "text/csv, UTF-8 · up to 5,000 data rows / 2 MB",
  "materials.import.submit": "Validate CSV",
  "materials.import.importing": "Validating…",
  "materials.import.empty": "Choose a CSV file to see a validated preview.",
  "materials.import.fileRequired": "Choose a CSV file first.",
  "materials.import.fileTooLarge": "CSV must be 2 MB or smaller.",
  "materials.import.error": "Could not validate this CSV. Check the file and retry.",
  "materials.import.previewTitle": "Validated preview",
  "materials.import.rows": "Rows used",
  "materials.import.ignored": "Rows ignored",
  "materials.import.pcs": "Inspected pcs",
  "materials.import.warnings": "Warnings",
  "materials.import.warningIgnored":
    "Ignored {count} rows for other phases; only {phase} was imported.",
  "materials.import.warningDerived":
    "Derived cost columns were ignored; cost is recalculated from quantity and unit cost.",
  "materials.import.warningGeneric":
    "The server returned an additional import warning.",
  "materials.import.footnote":
    "Preview only: the file and result are not stored. Synthetic/demo data; not a material master or a Finance-approved saving.",
  "materials.import.errorColumns": "The CSV is missing required columns: {columns}.",
  "materials.import.errorPolicy":
    "Only synthetic/demo data is accepted (data_policy = SYNTHETIC).",
  "materials.import.errorRows": "The CSV exceeds the 5,000 data-row limit.",
  "materials.import.errorEmptyCsv": "The CSV is empty.",
  "materials.import.errorEncoding": "The CSV must be UTF-8 encoded.",
  "materials.import.errorPhase": "The CSV has no rows for the selected phase.",
  "materials.import.errorRow":
    "CSV row {row} has invalid data. Check the row values and retry.",

  "scenarioImport.aria": "Scenario master-data CSV or Excel import",
  "scenarioImport.eyebrow": "Master data · CSV / XLSX",
  "scenarioImport.title": "Import routing, crew and machines",
  "scenarioImport.note":
    "Load four synthetic CSV files together or one .xlsx workbook with four sheets. The API checks columns, references and precedence; nothing is stored. Apply replaces the working scenario and reruns the optimizer.",
  "scenarioImport.operations": "Operations CSV",
  "scenarioImport.workers": "Workers CSV",
  "scenarioImport.skills": "Worker skills CSV",
  "scenarioImport.machines": "Machines CSV",
  "scenarioImport.required": "Required",
  "scenarioImport.optional": "Optional",
  "scenarioImport.hint.operations":
    "operation_id, sam_sec, predecessor_ids, machine_type, skill_code…",
  "scenarioImport.hint.workers": "worker_id, worker_name, available, machine_types",
  "scenarioImport.hint.skills": "worker_id, operation_id, skill_grade (A/B/C or 0–3)",
  "scenarioImport.hint.machines": "machine_id, machine_type, available, capacity",
  "scenarioImport.fileMissing": "Choose the {file} first.",
  "scenarioImport.tooLarge": "The four CSV files together must be 2 MB or smaller.",
  "scenarioImport.error": "Could not validate the import. Check the files and retry.",
  "scenarioImport.validating": "Validating import…",
  "scenarioImport.submit": "Validate import",
  "scenarioImport.or": "or",
  "scenarioImport.workbookFile": "Excel workbook",
  "scenarioImport.workbookHint":
    ".xlsx with sheets operations, workers, worker_skills, machines · max 2 MB",
  "scenarioImport.workbookMissing": "Choose an .xlsx workbook first.",
  "scenarioImport.workbookTooLarge": "The workbook must be 2 MB or smaller.",
  "scenarioImport.workbookValidating": "Validating workbook…",
  "scenarioImport.workbookSubmit": "Validate workbook",
  "scenarioImport.empty":
    "Choose the operations, workers and skills files, or one .xlsx workbook, to see a validated preview.",
  "scenarioImport.previewTitle": "Validated scenario",
  "scenarioImport.unknownStyle": "Unnamed style",
  "scenarioImport.count.operations": "Operations",
  "scenarioImport.count.workers": "Workers",
  "scenarioImport.count.skills": "Skill assignments",
  "scenarioImport.count.machines": "Machines",
  "scenarioImport.layers": "Precedence layers",
  "scenarioImport.machineTypes": "Machine types",
  "scenarioImport.table.operation": "Operation",
  "scenarioImport.table.sam": "SAM (s)",
  "scenarioImport.table.predecessors": "Predecessors",
  "scenarioImport.table.machine": "Machine",
  "scenarioImport.table.skill": "Skill requirement",
  "scenarioImport.noPredecessors": "—",
  "scenarioImport.manual": "Manual",
  "scenarioImport.apply": "Apply & solve",
  "scenarioImport.applying": "Applying & solving…",
  "scenarioImport.applyHint":
    "Apply replaces routing, workers and machines, clears the old synthetic baseline, and reruns the optimizer. Actuals inputs are kept only when the imported style and line match the current scenario.",
  "scenarioImport.footnote":
    "Preview only: files are not stored. Imported master data is synthetic/demo; optimizer diagnostics still apply.",
  "scenarioImport.errorColumns": "The CSV is missing required columns: {columns}.",
  "scenarioImport.errorNoRows": "A CSV has no data rows.",
  "scenarioImport.errorEfficiency":
    "Worker-specific efficiency is not supported. Remove the efficiency_factor column and use approved SAM per operation.",
  "scenarioImport.errorWorkbookInvalid": "The file is not a valid .xlsx workbook.",
  "scenarioImport.errorWorkbookSheets":
    "The workbook is missing required sheets: {sheets}.",
  "scenarioImport.errorWorkbookSize":
    "The workbook expands beyond the safe size limit. Reduce its content and retry.",
  "scenarioImport.errorDetail":
    "The import failed validation. Technical detail: {detail}",

  "notice.rerun": "Re-ran the optimizer in {seconds}s · {status}.",
  "notice.solverStatus": "Solver returned {status}. Review diagnostics and inputs.",
  "notice.applied":
    "Shop-floor input applied to the dashboard. Re-run the optimizer only if method, SAM or constraints changed.",
  "notice.importApplied":
    "Imported {operations} operations, {workers} workers and {machines} machines · optimizer returned {status}.",
  "notice.export":
    "XLSX workbook generated from the current request and result in English.",
  "notice.snapshotSaved": 'Snapshot "{name}" saved in this browser.',
  "notice.snapshotLoaded": 'Loaded snapshot "{name}".',
  "notice.login": "Signed in as {user}.",
  "notice.logout": "Signed out. Local snapshots and compute still work.",
  "notice.sessionExpired":
    "The session expired or is invalid. Sign in again to use server scenarios.",
  "notice.serverSaved": 'Scenario "{name}" re-solved and saved on the server.',
  "notice.serverLoaded": 'Loaded server scenario "{name}".',
  "notice.serverDeleted": 'Deleted server scenario "{name}".',
  "error.snapshotSave":
    "Could not save: localStorage may be full. Delete an old snapshot first.",
  "error.storage": "Could not update localStorage.",
  "error.apiUnavailable":
    "The optimization service could not be reached. Check the connection and try again.",
  "error.apiValidation":
    "The submitted data is invalid. Review the inputs and try again.",
  "error.apiRateLimit": "Too many requests. Wait briefly, then try again.",
  "error.apiBodyLimit":
    "The submitted request is too large. Reduce the input and try again.",
  "error.apiGeneric":
    "The request could not be completed. Review the inputs and try again.",
  "app.dismissNotice": "Dismiss notice",
  "app.dismissError": "Dismiss error",

  "metrics.aria": "Key performance indicators",
  "metrics.secondaryAria": "Additional planning and actual indicators",
  "metrics.empty": "No KPI output. The solver did not return a feasible line.",
  "metric.bottleneck.label": "Bottleneck",
  "metric.bottleneck.over": "{value}s above effective takt",
  "metric.bottleneck.inside": "{value}s inside effective takt",
  "metric.bottleneck.foot": "Station {station} sets the pace",
  "metric.lbe.label": "Line balance efficiency",
  "metric.lbe.delta": "{value} vs baseline",
  "metric.lbe.foot": "Planning SAM / (workers × bottleneck)",
  "metric.workers.label": "Workers on line",
  "metric.workers.delta": "{value} vs baseline {base}",
  "metric.workers.foot": "One worker per station",
  "metric.noBaseline": "No synthetic baseline",
  "metric.capacity.label": "Capacity / shift",
  "metric.capacity.short": "{value} pcs short of target",
  "metric.capacity.above": "{value} pcs above target",
  "metric.capacity.foot": "Bottleneck-constrained · target {target}",
  "metric.capacity.delta": "{value} vs baseline · bottleneck-limited",
  "metric.workstations.label": "Workstations",
  "metric.workstations.foot": "Active stations in this plan",
  "metric.idle.label": "Modeled idle time",
  "metric.idle.note": "Sum versus effective takt · not actual idle",
  "metric.actualOutput.label": "Actual output",
  "metric.actualOutput.period": "{days}-day synthetic actuals",
  "metric.actualOutput.missing": "Data not provided",
  "metric.utilization.label": "Planned labor utilization",
  "metric.utilization.foot": "Planning KPI · not actual labor efficiency",

  "takt.eyebrow": "Takt & cycle time",
  "takt.title.compact": "Takt vs bottleneck",
  "takt.title.full": "Two takts, one decision",
  "takt.chip": "Seconds / piece",
  "takt.marker.effective": "Effective {value}s",
  "takt.marker.demand": "Demand {value}s",
  "takt.over": "Bottleneck {value}s above effective takt",
  "takt.inside": "Bottleneck inside effective takt by {value}s",
  "takt.scale": "Bar length = bottleneck load on a 0–{value}s scale.",
  "takt.demand.label": "Demand takt",
  "takt.effective.label": "Effective takt",
  "takt.gap.label": "Takt gap",
  "takt.footnote":
    "Demand takt is the customer requirement; effective takt applies the {pct} planned efficiency allowance before comparing with the bottleneck.",
  "takt.demand.body":
    "{seconds} available seconds ÷ {target} pcs. This is the customer requirement at 100% of scheduled time.",
  "takt.effective.body":
    "{seconds}s × {pct} planned efficiency ÷ {target} pcs. This is the planning cycle allowance, not the demand takt.",
  "takt.bottleneck.body.over":
    "The line is {value}s above the effective takt. Capacity is capped at {pct} of target.",
  "takt.bottleneck.body.ok":
    "The bottleneck is inside the effective takt. The line can meet the target at the planned efficiency.",

  "target.eyebrow": "Target health",
  "target.title": "Can the line hit the target?",
  "target.empty": "No KPI output for this run.",
  "target.met": "Target met",
  "target.gap": "Gap remains",
  "target.of": "of target",
  "target.target": "Target",
  "target.capacity": "Capacity",
  "target.short": "Short",
  "target.surplus": "Surplus",
  "target.pcsShift": "pcs / shift",
  "target.bottleneckConstrained": "bottleneck-constrained",
  "target.formula": "Capacity = {seconds}s × {pct} ÷ {bottleneck}s = {capacity} pcs",
  "target.delta": "{value} vs synthetic baseline",
  "target.footnote":
    "Capacity uses the bottleneck station, not theoretical HC × SAM. The target is not claimed when the line cannot support the demand takt.",
  "target.aria": "{pct} of target",

  "workload.eyebrow": "Yamazumi / station load",
  "workload.title.compact": "Top station loads",
  "workload.title.full": "Where the line loses balance",
  "workload.allStations": "All stations",
  "workload.viewAria": "Workload view",
  "workload.optimized": "Optimized",
  "workload.baseline": "Baseline",
  "workload.summary.compact": "{shown} of {total} stations",
  "workload.summary.full": "{total} stations",
  "workload.summary.maxLoad": "{value}s max load",
  "workload.summary.effective": "{value}s effective takt",
  "workload.summary.demand": "{value}s demand takt",
  "workload.legend.bottleneck": "Bottleneck",
  "workload.legend.watch": "Watch",
  "workload.legend.normal": "Normal",
  "workload.legend.underutilized": "Underutilized",
  "workload.legend.effective": "Effective takt",
  "workload.legend.demand": "Demand takt",
  "workload.axis.load": "Planning SAM / station (seconds per piece)",
  "workload.axis.zero": "0 s",
  "workload.axis.scale": "{value} s",
  "workload.rowTooltip":
    "Station {station} · worker {worker} · planning load {load}s · status {status}",
  "workload.footnote":
    "Bar length is planning SAM per station, not machine utilization. The effective takt is the planning cycle allowance at the planned efficiency; the demand takt is the customer requirement at 100% of scheduled time.",

  "balance.tabsAria": "Line balance view",
  "balance.tab.loads": "Station loads",
  "balance.tab.map": "Assignment map",
  "balance.tab.baseline": "Before / after",
  "balance.note": "Planning SAM basis · synthetic line",

  "station.eyebrow": "Assignment detail",
  "station.title": "Station, worker and operation map",
  "station.chip": "{count} stations",
  "station.col.station": "Station",
  "station.col.worker": "Worker",
  "station.col.operations": "Operations",
  "station.col.load": "Workload (s)",
  "station.col.utilization": "Load / effective takt (%)",
  "station.col.status": "Status",
  "station.col.operationsCount": "Tasks",
  "station.col.takt": "Effective takt",
  "station.col.idle": "Idle vs effective takt",
  "station.searchAria": "Search workstations",
  "station.searchPlaceholder": "Station, worker or operation…",
  "station.filter.status": "Status",
  "station.filter.all": "All statuses",
  "station.sortBy": "Sort by {column}",
  "station.sortAscending": "ascending",
  "station.sortDescending": "descending",
  "station.operationCount": "{count} tasks",
  "station.noResults": "No workstations match these filters.",
  "station.footnote":
    "Utilization is station load divided by the effective takt, not machine runtime. Manual operations have no machine requirement.",
  "bottleneck.eyebrow": "Constraint focus",
  "bottleneck.title": "Bottleneck analysis",
  "bottleneck.empty": "No station-level result is available.",
  "bottleneck.current": "Highest-load station",
  "bottleneck.load": "Planning load",
  "bottleneck.effectiveTakt": "Effective takt",
  "bottleneck.overload": "Load above effective takt",
  "bottleneck.buffer": "Buffer to effective takt",
  "bottleneck.utilization": "Station utilization vs effective takt",
  "bottleneck.priority": "Stations to review",
  "bottleneck.showing": "{shown} of {total} stations",
  "bottleneck.noPriority":
    "No station is flagged for review by the current status rules.",
  "bottleneck.reviewLimit":
    "Priority list follows the model's station status; it does not diagnose root cause.",
  "station.status.bottleneck": "Bottleneck",
  "station.status.watch": "Watch",
  "station.status.normal": "Normal",
  "station.status.underutilized": "Underutilized",

  "baseline.eyebrow": "Before / after",
  "baseline.title": "Baseline comparison",
  "baseline.empty": "No baseline provided. Only optimized results are shown.",
  "baseline.chip": "Synthetic baseline input",
  "baseline.row.stations": "Stations used",
  "baseline.row.stations.note": "Physical stations with work",
  "baseline.row.workers": "Workers on line",
  "baseline.row.workers.note": "One worker per station",
  "baseline.row.bottleneck": "Bottleneck load",
  "baseline.row.bottleneck.note": "Baseline {before} → station {after}",
  "baseline.row.lbe": "Balance efficiency",
  "baseline.row.lbe.note": "LBE = planning SAM / (workers × bottleneck)",
  "baseline.row.capacity": "Capacity / shift",
  "baseline.row.capacity.note": "Bottleneck-constrained pcs / shift",
  "baseline.row.target": "Target achievement",
  "baseline.row.target.met": "Target met",
  "baseline.row.target.missed": "Target not met",
  "baseline.row.smoothness": "Smoothness index",
  "baseline.row.smoothness.note": "Lower is smoother",
  "baseline.row.idle": "Total idle time",
  "baseline.row.idle.note": "Against effective takt",
  "baseline.row.overload": "Total overload",
  "baseline.row.overload.note": "Load above effective takt",
  "baseline.improvement": "{value} improvement",
  "baseline.col.metric": "Metric",
  "baseline.col.before": "Baseline",
  "baseline.col.after": "Optimized",
  "baseline.col.delta": "Delta",
  "baseline.footnote":
    "Baseline is a synthetic first-fit current-state layout, not an optimizer output. Deltas are optimized minus baseline; for bottleneck, idle and overload, a negative delta is an improvement.",

  "planning.eyebrow": "Capacity & HC",
  "planning.title": "Planning summary",
  "planning.empty": "No planning summary for this result.",
  "planning.chip": "Bottleneck-constrained",
  "planning.theoretical.label": "Theoretical capacity",
  "planning.theoretical.note": "pcs/shift · ignores balance",
  "planning.bottleneck.label": "Bottleneck capacity",
  "planning.bottleneck.note": "pcs/shift · used for target",
  "planning.requiredHc.label": "Required HC",
  "planning.requiredHc.note": "theoretical estimate",
  "planning.availableHc.label": "Available HC",
  "planning.availableHc.note": "workers in scenario",
  "planning.periodTarget.label": "Period target",
  "planning.periodTarget.note": "{days} working days",
  "planning.periodCapacity.label": "Period capacity",
  "planning.periodCapacity.note": "gap {value} pcs",
  "planning.periodAchievement": "{pct} of period target",
  "planning.callout":
    "Theoretical capacity is {pct} of target, but it ignores precedence, machine and balance constraints. The bottleneck number is the honest planning number.",
  "planning.machine.title": "Machine allocation coverage",
  "planning.machine.note": "Not machine utilization",
  "planning.machine.col.type": "Machine type",
  "planning.machine.col.required": "Required stations",
  "planning.machine.col.available": "Available",
  "planning.machine.col.gap": "Gap",
  "planning.machine.col.coverage": "Coverage",
  "planning.machine.footnote":
    "Coverage compares required stations with available machine capacity. It does not measure runtime, speed loss or quality, so it must never be labelled machine utilization or OEE.",
  "planning.hc.title": "Headcount control",
  "planning.hc.note": "Standard vs actual vs optimized",
  "planning.hc.standard": "Standard",
  "planning.hc.planned": "Planned",
  "planning.hc.actual": "Actual",
  "planning.hc.attendance": "Attendance",
  "planning.hc.optimized": "Optimized",
  "planning.hc.adherence": "Adherence",
  "planning.hc.attendancePct": "Attendance",
  "planning.skill.title": "Skill coverage watch",
  "planning.skill.item": "grade {grade} · {count} eligible",
  "planning.skill.ok": "All skill coverage checks are OK.",
  "planning.transfer.title": "Transfer suggestions",
  "planning.transfer.reason":
    "{name} is qualified to support bottleneck station ST{station} ({load}s).",

  "actuals.eyebrow": "Actuals",
  "actuals.title": "Production actuals",
  "actuals.empty":
    "No actuals supplied. Log a production snapshot in the input panel to calculate achievement and labor efficiency.",
  "actuals.period.shift": "1 shift",
  "actuals.period.days": "{days} days",
  "actuals.output": "Output",
  "actuals.target": "target {value}",
  "actuals.achievement": "Production achievement",
  "actuals.actualTarget": "actual / target",
  "actuals.laborEfficiency": "Actual labor efficiency",
  "actuals.samBasis": "planning SAM basis",
  "actuals.downtime": "Downtime",
  "actuals.ofPlanned": "{pct} of planned time",
  "actuals.byCategory": "Downtime by category",
  "actuals.summaryDetail": "Summary total vs event detail",
  "actuals.noDowntime": "No downtime events recorded.",
  "actuals.note.missingLabor":
    "Direct labor minutes are missing for {count} day(s); actual labor efficiency uses only reported days.",
  "actuals.note.noLabor":
    "Actual labor efficiency is not calculated because actual direct labor minutes were not provided. Elapsed shift time is not a substitute.",
  "actuals.note.downtimeMismatch":
    "Downtime event totals differ from the summary. The summary is used for total downtime; the category table shows event detail.",
  "actuals.note.method":
    "Production achievement uses the target for the same period. Actual labor efficiency uses planning SAM; downtime percentage uses scheduled shift minutes.",
  "actuals.note.generic": "An additional actuals note is available.",

  "loss.MACHINE": "Machine",
  "loss.MATERIAL": "Material",
  "loss.MANPOWER": "Manpower",
  "loss.QUALITY": "Quality",
  "loss.CHANGEOVER": "Changeover",
  "loss.OTHER": "Other",
  "loss.UNSPECIFIED": "Unspecified",

  "forms.timeStudyAria": "Time study input",
  "forms.actualsAria": "Shop-floor input forms",
  "forms.shopFloor": "Shop-floor input",
  "forms.logEvent": "Log a shift event",
  "forms.actualsFormAria": "Actuals form",
  "forms.tab.production": "Production",
  "forms.tab.downtime": "Downtime",
  "forms.production.title": "Actual production",
  "forms.production.note": "One shift snapshot. Replaces the 5-day sample view.",
  "forms.field.target": "Target output (pcs)",
  "forms.field.actualOutput": "Actual output (pcs)",
  "forms.field.laborMinutes": "Direct labor minutes",
  "forms.field.attendance": "Attendance HC",
  "forms.field.downtimeMinutes": "Downtime minutes",
  "forms.calculating": "Calculating…",
  "forms.applyActuals": "Apply actuals",
  "forms.downtime.title": "Downtime event",
  "forms.downtime.note": "Log one loss. Duration is added to the shift total.",
  "forms.field.start": "Start",
  "forms.field.end": "End",
  "forms.field.station": "Station",
  "forms.field.lossCategory": "Loss category",
  "forms.field.duration": "Duration",
  "forms.field.note": "Note",
  "forms.defaultDowntimeNote": "e.g. Broken thread on the overlock machine",
  "forms.lineLevel": "Line level",
  "forms.addDowntime": "Add downtime",
  "forms.latestEvents": "Latest events",
  "forms.timeStudy.title": "Time study",
  "forms.timeStudy.note":
    "Normal time and standard time. Draft only — no auto-SAM update.",
  "forms.timeStudy.guardrail":
    "Aggregate calculation: enter human/walking observed time only. Do not apply the performance rating to machine automatic time; split mixed elements first (playbook §3.6).",
  "forms.field.operation": "Operation",
  "forms.field.observed": "Observed time (s)",
  "forms.field.rating": "Performance rating",
  "forms.field.allowance": "Allowance %",
  "forms.field.approvedSam": "Approved SAM (s)",
  "forms.calculateTimeStudy": "Calculate time study",
  "forms.result.normal": "Normal time",
  "forms.result.standard": "Standard time",
  "forms.result.approved": "Approved SAM",
  "forms.result.variance": "Variance",
  "forms.result.note":
    "{operation} Draft record only. Re-time-study and approve before changing SAM in the optimizer.",
  "forms.error.endAfterStart": "End time must be after start time.",
  "forms.error.chooseOperation":
    "Choose an operation and enter an observed time above zero.",
  "forms.mini.achievement": "Achievement",
  "forms.mini.labor": "Labor efficiency",
  "forms.mini.downtime": "Downtime",

  "guide.eyebrow": "Method guardrail",
  "guide.title": "How standard time is built",
  "guide.chip": "Draft workflow",
  "guide.step1.title": "Observe the element",
  "guide.step1.body":
    "Use human and walking time only. Split out machine automatic time before applying a performance rating.",
  "guide.step1.code": "observed time",
  "guide.step2.title": "Normalize the pace",
  "guide.step2.body":
    "A rating of 1.00 means the observed pace equals the standard pace. Apply the rating to manual work only.",
  "guide.step2.code": "normal = observed × rating",
  "guide.step3.title": "Add the allowance",
  "guide.step3.body":
    "Allowance covers personal, fatigue and delay time. Apply it once and keep the allowance basis consistent with the line SAM basis.",
  "guide.step3.code": "standard = normal × (1 + allowance)",
  "guide.step4.title": "Approve before use",
  "guide.step4.body":
    "This screen writes a draft record only. Approved SAM is the authoritative number; the optimizer never updates it automatically.",
  "guide.step4.code": "approved SAM → planning input",
  "guide.warning.title": "Do not rate machine automatic time.",
  "guide.warning.body":
    "Mixed elements must be split first, otherwise the performance rating inflates machine time and distorts the SAM.",

  "metadata.eyebrow": "Run provenance",
  "metadata.title": "Solver and data notes",
  "metadata.solver": "Solver",
  "metadata.solveTime": "Solve time",
  "metadata.proof": "Lexicographic proof",
  "metadata.proven": "Proven",
  "metadata.notProven": "Not proven",
  "metadata.model": "Model",
  "metadata.dataVersion": "Data version",
  "metadata.dataPolicy": "Data policy",
  "metadata.syntheticOnly": "Synthetic only",
  "metadata.warnings": "{count} warnings",
  "metadata.critical": "{count} critical",
  "metadata.warning": "{count} warning",
  "metadata.feasible": "Feasible",
  "metadata.notFeasible": "Not feasible",
  "metadata.showNotes": "Show constraint notes",
  "metadata.footnote":
    "This public demo uses synthetic data only. The sample baseline is an input, not an optimizer output. Scenario write/delete requires a signed-in admin demo account; local snapshots stay in this browser.",
  "severity.info": "Info",
  "severity.warning": "Warning",
  "severity.critical": "Critical",

  "warning.allowanceIgnored":
    "The imported SAM already includes allowance, so no extra allowance was added.",
  "warning.baselineViolations":
    "The synthetic baseline has {count} constraint violation(s). See the before/after comparison.",
  "warning.capacityTargetNotMet":
    "Bottleneck-constrained capacity is below the production target.",
  "warning.headcountLimitBinding":
    "The plan uses {used} of {allowed} allowed workers; the headcount limit is binding.",
  "warning.machineCapacityShared":
    "Available machine capacity is shared across operations; review the machine allocation.",
  "warning.maxWorkersClamped":
    "The requested worker limit {requested} exceeded availability ({available}) and was reduced.",
  "warning.operationOverEffectiveTakt":
    "Operation {operation} exceeds effective takt and cannot meet the capacity target in one station.",
  "warning.operationOverDemandTakt":
    "Operation {operation} exceeds demand takt; split it or change the method.",
  "warning.singlePointOfFailure":
    "Only {worker} is qualified for operation {operation}. Cross-training is recommended.",
  "warning.stationOverEffectiveTakt":
    "Station {station} ({worker}) exceeds effective takt at {utilization} utilization. Rebalance or add capacity.",
  "warning.stationNearEffectiveTakt":
    "Station {station} ({worker}) is near effective takt at {utilization} utilization. Monitor it.",
  "warning.stationUnderutilized":
    "Station {station} ({worker}) has low planned load ({utilization}). Consider combining tasks.",
  "warning.taktUnreachable":
    "Even before sequencing, the best possible bottleneck exceeds effective takt. The current crew and data cannot meet the target.",
  "warning.unusedWorkers": "Some available workers are not assigned to this plan.",
  "warning.workerNoQualifiedOperation":
    "Worker {worker} has no qualified operation with the current skill and machine data.",
  "warning.generic": "An additional optimization warning is available.",

  "auth.eyebrow": "Demo account",
  "auth.title": "Sign in",
  "auth.intro":
    "Sign in to save and load scenarios on the server. The optimizer and browser-local snapshots still work without an account.",
  "auth.username": "Username",
  "auth.password": "Password",
  "auth.submit": "Sign in",
  "auth.submitting": "Signing in…",
  "auth.cancel": "Cancel",
  "auth.close": "Close sign-in dialog",
  "auth.disabled":
    "Demo login is not configured on this server. Set AUTH_ADMIN_PASSWORD, AUTH_VIEWER_PASSWORD and AUTH_SESSION_SECRET before using accounts.",
  "auth.demoAccounts":
    "Demo accounts: admin (full access) or test1–test4 (read-only). Viewer password: 12345678.",
  "auth.accountGroup": "Demo accounts",
  "auth.show": "Show",
  "auth.hide": "Hide",
  "auth.showPassword": "Show password",
  "auth.hidePassword": "Hide password",
  "auth.openPage": "Open full sign-in page",
  "auth.page.kicker": "Garment line engineering",
  "auth.page.titleLine1": "Balance every second.",
  "auth.page.titleLine2": "Protect every shift.",
  "auth.page.intro":
    "A quiet control room for line balancing, capacity and IE decisions — built on synthetic data for portfolio review.",
  "auth.page.factSolver": "Solver",
  "auth.page.factData": "Data",
  "auth.page.factDataValue": "Synthetic only",
  "auth.page.factScope": "Scope",
  "auth.page.factScopeValue": "Line · Capacity · IE",
  "auth.page.panelKicker": "Private demo access",
  "auth.page.panelTitle": "Sign in to the control room",
  "auth.page.panelIntro":
    "Save and revisit synthetic scenarios on the demo server. Local work stays in this browser.",
  "auth.page.sessionKicker": "Session active",
  "auth.page.signedInTitle": "Welcome back.",
  "auth.page.signedInBody": "Signed in as {user} · {role}.",
  "auth.page.continue": "Continue to workspace",
  "auth.page.signOut": "Sign out",
  "auth.page.back": "Back to workspace",
  "auth.page.footer": "LineBalance Pro · Synthetic data only · Demo access",

  "serverScenarios.eyebrow": "Server persistence",
  "serverScenarios.title": "Server scenarios",
  "serverScenarios.chip": "Neon-backed demo",
  "serverScenarios.intro":
    "Signed-in accounts can store synthetic scenarios in the demo workspace. Local snapshots stay in this browser.",
  "serverScenarios.loginPrompt":
    "Sign in to save and load server scenarios. Compute and local snapshots do not require an account.",
  "serverScenarios.readOnly":
    "Read-only account: you can load server scenarios but cannot create or delete them.",
  "serverScenarios.nameAria": "Server scenario name",
  "serverScenarios.placeholder": "e.g. A — admin review",
  "serverScenarios.save": "Save to server",
  "serverScenarios.saving": "Saving and re-solving…",
  "serverScenarios.empty": "No server scenarios yet.",
  "serverScenarios.loading": "Loading server scenarios…",
  "serverScenarios.load": "Load",
  "serverScenarios.delete": "Delete",
  "serverScenarios.loadAria": "Load server scenario {name}",
  "serverScenarios.deleteAria": "Delete server scenario {name}",
  "serverScenarios.meta":
    "{savedAt} · {status} · {workers} workers · {stations} stations",
  "serverScenarios.loadMore": "Load more",
  "serverScenarios.confirmDelete":
    'Delete server scenario "{name}"? This cannot be undone.',
  "serverScenarios.errorName": "Give the server scenario a name first.",

  "snapshots.eyebrow": "Local persistence",
  "snapshots.title": "Saved snapshots",
  "snapshots.chip": "localStorage only",
  "snapshots.intro":
    "Save the current request and result in this browser. Sign in to also store synthetic scenarios on the demo server.",
  "snapshots.nameAria": "Snapshot name",
  "snapshots.placeholder": "e.g. A — after rebalance",
  "snapshots.save": "Save snapshot",
  "snapshots.empty": "No snapshots yet. Save one after a re-run.",
  "snapshots.load": "Load",
  "snapshots.delete": "Delete",
  "snapshots.loadAria": "Load snapshot {name}",
  "snapshots.deleteAria": "Delete snapshot {name}",
  "snapshots.meta": "{savedAt} · {status} · {workers} workers",
  "snapshots.error.name": "Give the snapshot a name first.",

  "summary.eyebrow": "Run inputs",
  "summary.title": "Scenario summary",
  "summary.chip": "Reproducible",
  "summary.line": "Line",
  "summary.style": "Style",
  "summary.shift": "Shift",
  "summary.target": "Target",
  "summary.targetValue": "{value} pcs / shift",
  "summary.maxWorkers": "Max workers",
  "summary.efficiency": "Planned efficiency",
  "summary.samBasis": "SAM basis",
  "summary.allowance": "Allowance",
  "summary.solverLimit": "Solver limit",
  "summary.objective": "Objective",
  "summary.operations": "Operations",
  "summary.workers": "Workers",
  "summary.machines": "Machines",
  "summary.baselineRows": "Baseline rows",
  "summary.dataHash": "Data hash",
  "summary.note":
    "These inputs are synthetic and drive the current result. Re-run to reproduce the same case.",
  "summary.objective.minBottleneck": "Min bottleneck",
  "summary.objective.minWorkers": "Min workers",

  "policy.aria": "Data and status policy",
  "policy.data.eyebrow": "Data policy",
  "policy.data.title": "Synthetic only",
  "policy.data.body":
    "No HBI production data. The sample baseline is a current-state input, not an optimizer output.",
  "policy.status.eyebrow": "Status contract",
  "policy.status.title": "Proof before OPTIMAL",
  "policy.status.body":
    "OPTIMAL is only claimed when the lexicographic proof is true. Otherwise the run is labelled FEASIBLE_LIMIT.",
  "policy.snapshot.eyebrow": "Snapshots",
  "policy.snapshot.title": "Local + optional server",
  "policy.snapshot.body":
    "Local snapshots stay in this browser. Signed-in admin accounts can save synthetic scenarios to the Neon-backed demo workspace; read-only accounts cannot write.",
  "footer.authorLabel": "Built by",
  "footer.left":
    "LineBalance Pro · synthetic garment IE demo · not HBI production data",
  "footer.right":
    "React + FastAPI + PuLP/HiGHS · {operations} operations · {workers} workers available",
} as const;

export type MessageKey = keyof typeof EN;

const VI: Record<MessageKey, string> = {
  "nav.overview.label": "Tổng quan",
  "nav.overview.short": "Tổng quan",
  "nav.overview.hint": "Bảng điều khiển",
  "nav.balance.label": "Cân bằng chuyền",
  "nav.balance.short": "Cân bằng",
  "nav.balance.hint": "Biểu đồ & sơ đồ",
  "nav.capacity.label": "Năng lực & nhân sự",
  "nav.capacity.short": "Năng lực",
  "nav.capacity.hint": "Nhân lực & máy",
  "nav.actuals.label": "Thực tế",
  "nav.actuals.short": "Thực tế",
  "nav.actuals.hint": "Nhật ký ca",
  "nav.timeStudy.label": "Nghiên cứu thời gian",
  "nav.timeStudy.short": "Thời gian",
  "nav.timeStudy.hint": "Phương pháp",
  "nav.styleSetup.label": "Mã hàng mới",
  "nav.styleSetup.short": "Mã hàng",
  "nav.styleSetup.hint": "Sẵn sàng & quy trình",
  "nav.materials.label": "Định mức vật tư",
  "nav.materials.short": "Vật tư",
  "nav.materials.hint": "Tiêu hao & chênh lệch",
  "nav.solver.label": "Tối ưu hóa & dữ liệu",
  "nav.solver.short": "Tối ưu hóa",
  "nav.solver.hint": "Nguồn kết quả",

  "topbar.workspace": "Không gian làm việc",
  "topbar.snapshot": "Bản lưu · {name}",
  "topbar.workingCopy": "Bản đang làm",
  "topbar.custom": "Tùy chỉnh",
  "topbar.scenarioA": "Mục tiêu cao",
  "topbar.scenarioB": "Khả thi",
  "topbar.scenarioTitle": "{title} · mục tiêu {target} sản phẩm · {workers} công nhân",
  "topbar.scenarioGroup": "Kịch bản hoạch định",
  "topbar.apiReady": "Tối ưu hóa · {solver}",
  "topbar.ready": "Sẵn sàng",
  "topbar.apiOffline": "Dịch vụ ngoại tuyến",
  "topbar.apiChecking": "Đang kiểm tra dịch vụ…",
  "topbar.export": "Xuất bảng tính",
  "topbar.exporting": "Đang tạo…",
  "topbar.rerun": "Tối ưu lại",
  "topbar.solving": "Đang tối ưu…",
  "topbar.language": "Ngôn ngữ",
  "topbar.english": "Tiếng Anh",
  "topbar.vietnamese": "Tiếng Việt",
  "topbar.login": "Đăng nhập",
  "topbar.logout": "Đăng xuất",
  "topbar.admin": "Quản trị",
  "topbar.viewer": "Chỉ đọc",
  "topbar.signedIn": "{user} · {role}",
  "topbar.loginHelp":
    "Đăng nhập để lưu kịch bản lên máy chủ demo. Tối ưu hóa và bản lưu trong trình duyệt vẫn dùng được khi chưa có tài khoản.",

  "auth.eyebrow": "Tài khoản demo",
  "auth.title": "Đăng nhập",
  "auth.intro":
    "Đăng nhập để lưu và mở kịch bản trên máy chủ. Bộ tối ưu hóa và bản lưu trong trình duyệt vẫn hoạt động khi chưa có tài khoản.",
  "auth.username": "Tên đăng nhập",
  "auth.password": "Mật khẩu",
  "auth.submit": "Đăng nhập",
  "auth.submitting": "Đang đăng nhập…",
  "auth.cancel": "Hủy",
  "auth.close": "Đóng hộp đăng nhập",
  "auth.disabled":
    "Máy chủ chưa bật đăng nhập demo. Cần đặt AUTH_ADMIN_PASSWORD, AUTH_VIEWER_PASSWORD và AUTH_SESSION_SECRET trước khi dùng tài khoản.",
  "auth.demoAccounts":
    "Tài khoản demo: admin (toàn quyền) hoặc test1–test4 (chỉ đọc). Mật khẩu viewer: 12345678.",
  "auth.accountGroup": "Tài khoản demo",
  "auth.show": "Hiện",
  "auth.hide": "Ẩn",
  "auth.showPassword": "Hiện mật khẩu",
  "auth.hidePassword": "Ẩn mật khẩu",
  "auth.openPage": "Mở trang đăng nhập đầy đủ",
  "auth.page.kicker": "Kỹ thuật chuyền may",
  "auth.page.titleLine1": "Cân bằng từng giây.",
  "auth.page.titleLine2": "Bảo toàn từng ca.",
  "auth.page.intro":
    "Không gian điều hành tinh gọn cho cân bằng chuyền, năng lực và quyết định IE — dữ liệu synthetic cho portfolio.",
  "auth.page.factSolver": "Bộ giải",
  "auth.page.factData": "Dữ liệu",
  "auth.page.factDataValue": "Chỉ synthetic",
  "auth.page.factScope": "Phạm vi",
  "auth.page.factScopeValue": "Chuyền · Năng lực · IE",
  "auth.page.panelKicker": "Truy cập demo riêng",
  "auth.page.panelTitle": "Đăng nhập control room",
  "auth.page.panelIntro":
    "Lưu và mở lại kịch bản synthetic trên máy chủ demo. Dữ liệu local vẫn ở trình duyệt này.",
  "auth.page.sessionKicker": "Phiên đang hoạt động",
  "auth.page.signedInTitle": "Chào mừng trở lại.",
  "auth.page.signedInBody": "Đã đăng nhập là {user} · {role}.",
  "auth.page.continue": "Vào workspace",
  "auth.page.signOut": "Đăng xuất",
  "auth.page.back": "Quay lại workspace",
  "auth.page.footer": "LineBalance Pro · Chỉ dữ liệu synthetic · Truy cập demo",

  "serverScenarios.eyebrow": "Lưu trên máy chủ",
  "serverScenarios.title": "Kịch bản máy chủ",
  "serverScenarios.chip": "Demo trên Neon",
  "serverScenarios.intro":
    "Tài khoản đã đăng nhập có thể lưu kịch bản tổng hợp vào không gian demo. Bản lưu nội bộ vẫn nằm trong trình duyệt này.",
  "serverScenarios.loginPrompt":
    "Đăng nhập để lưu và mở kịch bản máy chủ. Tối ưu hóa và bản lưu nội bộ không cần tài khoản.",
  "serverScenarios.readOnly":
    "Tài khoản chỉ đọc: có thể mở kịch bản máy chủ nhưng không thể tạo hoặc xóa.",
  "serverScenarios.nameAria": "Tên kịch bản máy chủ",
  "serverScenarios.placeholder": "Ví dụ: A — quản trị xem lại",
  "serverScenarios.save": "Lưu lên máy chủ",
  "serverScenarios.saving": "Đang lưu và tối ưu lại…",
  "serverScenarios.empty": "Chưa có kịch bản máy chủ.",
  "serverScenarios.loading": "Đang tải kịch bản máy chủ…",
  "serverScenarios.load": "Mở",
  "serverScenarios.delete": "Xóa",
  "serverScenarios.loadAria": "Mở kịch bản máy chủ {name}",
  "serverScenarios.deleteAria": "Xóa kịch bản máy chủ {name}",
  "serverScenarios.meta":
    "{savedAt} · {status} · {workers} công nhân · {stations} trạm",
  "serverScenarios.loadMore": "Tải thêm",
  "serverScenarios.confirmDelete": 'Xóa kịch bản máy chủ "{name}"? Không thể hoàn tác.',
  "serverScenarios.errorName": "Hãy đặt tên kịch bản máy chủ trước.",
  "topbar.line": "Chuyền",
  "topbar.shift": "Ca",
  "topbar.period": "Kỳ báo cáo",
  "topbar.singleLine": "Một chuyền dữ liệu tổng hợp",
  "topbar.singleShift": "Ca hiện tại · chưa có lịch sử theo ngày",
  "topbar.dateHistoryUnavailable":
    "Chưa thể lọc theo ngày vì dịch vụ chưa có dữ liệu sản xuất theo ngày.",
  "topbar.reportContext": "Ngữ cảnh báo cáo và lựa chọn kịch bản",
  "report.exportHelp":
    "Tải bảng tính gồm dữ liệu đầu vào, kết quả, chỉ số và phần so sánh, theo ngôn ngữ giao diện đang chọn.",
  "line.sample": "Chuyền A — Áo thun cơ bản",
  "line.sampleFeasible": "Chuyền A — Áo thun cơ bản · phương án khả thi 400 sản phẩm",
  "shift.sample": "Ca {number}",

  "unit.secondsSuffix": " giây",
  "unit.minutesSuffix": " phút",
  "unit.piecesSuffix": " sản phẩm",
  "unit.pieces": "sản phẩm",
  "unit.piecesPerShift": "sản phẩm / ca",
  "unit.percentagePointsSuffix": " điểm phần trăm",

  "status.optimal": "Đã chứng minh tối ưu",
  "status.feasibleLimit": "Có phương án khả thi · chưa chứng minh tối ưu",
  "status.infeasible": "Không khả thi",
  "status.error": "Lỗi",
  "dataPolicy.syntheticDemo": "Chỉ dùng dữ liệu tổng hợp",

  "machine.OVERLOCK": "Máy vắt sổ",
  "machine.COVERSTITCH": "Máy kansai",
  "machine.IRON": "Bàn ủi",
  "machine.SINGLE": "Máy một kim",

  "sidebar.controlRoom": "Phòng điều khiển kỹ thuật công nghiệp",
  "sidebar.navAria": "Các mục không gian làm việc",
  "sidebar.synthetic": "Chỉ dữ liệu tổng hợp",
  "sidebar.apiOnline": "Dịch vụ tối ưu hóa đang hoạt động · {solver}",
  "sidebar.staticDemo": "Bản minh họa tĩnh · dịch vụ ngoại tuyến",
  "sidebar.checkingApi": "Đang kiểm tra dịch vụ…",
  "sidebar.healthCheck": "Kiểm tra trạng thái",
  "sidebar.stack": "React · FastAPI · PuLP/HiGHS",

  "app.shiftDashboard": "Bảng điều khiển ca · {shift}",
  "app.shiftSummary":
    "{shiftId} · ca {minutes} phút − {break} phút nghỉ · {days} ngày làm việc · {samBasis}",
  "sam.includes": "Định mức đã bao gồm phụ cấp thời gian",
  "sam.excludes": "Định mức chưa gồm phụ cấp thời gian (+{pct}%)",

  "page.balance.eyebrow": "Kỹ thuật cân bằng",
  "page.balance.title": "Cân bằng chuyền",
  "page.balance.description":
    "Tải trạm, phân công công nhân và chênh lệch trước/sau với dữ liệu tổng hợp. Độ dài cột là định mức kế hoạch, không phải hiệu suất máy.",
  "page.capacity.eyebrow": "Hoạch định",
  "page.capacity.title": "Năng lực & nhân sự",
  "page.capacity.description":
    "Năng lực theo nút cổ chai, độ phủ máy và kiểm soát nhân sự. Năng lực lý thuyết bỏ qua thứ tự công đoạn, kỹ năng và cân bằng.",
  "page.actuals.eyebrow": "Hiện trường",
  "page.actuals.title": "Thực tế",
  "page.actuals.description":
    "Xem số liệu của một ca và ghi nhận sản lượng hoặc thời gian dừng. Dữ liệu nhập sẽ làm mới phần phân tích thực tế; chỉ tối ưu lại khi phương pháp hoặc định mức thay đổi.",
  "page.timeStudy.eyebrow": "Kỹ thuật công nghiệp",
  "page.timeStudy.title": "Nghiên cứu thời gian",
  "page.timeStudy.description":
    "Thời gian quan sát, thời gian chuẩn hóa và thời gian chuẩn cho lao động thủ công. Quy trình này chỉ tạo bản nháp; định mức đã phê duyệt vẫn là đầu vào hoạch định.",
  "page.styleSetup.eyebrow": "Kiểm soát đưa mã hàng vào chuyền",
  "page.styleSetup.title": "Mức độ sẵn sàng mã hàng mới",
  "page.styleSetup.description":
    "Rà soát các điều kiện đưa mã hàng vào chuyền và xem routing trước/sau phân công hiện tại. Đây là công cụ hỗ trợ, không thay thế phê duyệt chạy chuyền.",
  "page.materials.eyebrow": "Chuẩn hóa vật tư",
  "page.materials.title": "Tiêu hao & chênh lệch vật tư",
  "page.materials.description":
    "Case T13 tổng hợp cho chỉ, băng keo 3M và viền, kèm kiểm tra what-if. Chênh lệch dương là tiêu hao vượt định mức; tổng tiền là cost avoidance, không phải cash saving đã được Finance xác nhận.",
  "page.solver.eyebrow": "Nguồn gốc kết quả",
  "page.solver.title": "Tối ưu hóa & dữ liệu",
  "page.solver.description":
    "Kết quả được tạo thế nào, trạng thái có nghĩa gì và bản lưu cục bộ nằm ở đâu.",

  "style.dataPolicy":
    "Quy trình minh họa với dữ liệu tổng hợp. Checklist không được lưu và không phải xác nhận sản xuất.",
  "style.readiness.aria": "Danh sách kiểm tra mức độ sẵn sàng mã hàng mới",
  "style.readiness.eyebrow": "Điều kiện đưa vào chuyền",
  "style.readiness.title": "Danh sách kiểm tra sẵn sàng",
  "style.readiness.note":
    "Đánh dấu điều kiện bắt buộc, ghi người phụ trách hoặc bằng chứng rồi tính mức độ sẵn sàng. Điểm chỉ tính các mục bắt buộc đã hoàn tất.",
  "style.readiness.required": "Điều kiện bắt buộc",
  "style.readiness.status": "Trạng thái",
  "style.readiness.evidence": "Người phụ trách / bằng chứng / ghi chú",
  "style.readiness.evaluate": "Tính mức độ sẵn sàng",
  "style.readiness.evaluating": "Đang tính…",
  "style.readiness.empty":
    "Chưa có kết quả đánh giá. Hãy cập nhật checklist rồi tính mức độ sẵn sàng.",
  "style.readiness.resultAria": "Kết quả đánh giá sẵn sàng",
  "style.readiness.progress": "Điều kiện bắt buộc đã hoàn tất",
  "style.readiness.ready": "Sẵn sàng cho chạy thử có kiểm soát",
  "style.readiness.notReady": "Chưa sẵn sàng đưa vào chuyền",
  "style.readiness.blockers": "Mục cần hoàn tất",
  "style.readiness.noBlockers": "Không còn mục chặn trong checklist này.",
  "style.readiness.apiError": "Không tính được mức độ sẵn sàng. Hãy thử lại.",
  "style.item.operation_routing": "Routing công đoạn đã được phê duyệt",
  "style.item.sam_approved": "Cơ sở SAM đã được rà soát và duyệt",
  "style.item.machine_ready": "Máy và cữ gá đã sẵn sàng",
  "style.item.manpower_assigned": "Đã xác nhận phương án nhân lực",
  "style.item.skill_coverage": "Đã xác nhận độ phủ kỹ năng yêu cầu",
  "style.item.layout_ready": "Đã rà soát layout và luồng vật liệu",
  "style.item.material_ready": "Nguyên phụ liệu đã sẵn sàng",
  "style.item.production_trial": "Đã chạy thử và kiểm tra sản phẩm đầu tiên",
  "style.status.NOT_STARTED": "Chưa bắt đầu",
  "style.status.IN_PROGRESS": "Đang thực hiện",
  "style.status.COMPLETED": "Hoàn tất",
  "style.status.BLOCKED": "Đang bị chặn",
  "style.flow.aria": "Luồng công đoạn sản xuất",
  "style.flow.title": "Sơ đồ luồng công đoạn",
  "style.flow.note":
    "Các mũi tên theo quan hệ trước–sau trong routing. Chế độ tối ưu bổ sung trạm và công nhân từ kết quả solver hiện tại.",
  "style.flow.operationCount": "{count} công đoạn",
  "style.flow.routingOnly": "Chỉ routing",
  "style.flow.optimized": "Có phân công",
  "style.flow.loading": "Đang dựng process flow…",
  "style.flow.empty": "Chưa có process flow cho mã hàng này.",
  "style.flow.error": "Không dựng được process flow. Hãy kiểm tra routing rồi thử lại.",
  "style.flow.retry": "Thử dựng lại",
  "style.flow.routingView": "Chế độ routing",
  "style.flow.optimizedView": "Chế độ phân công tối ưu",
  "style.flow.sam": "SAM {seconds} giây",
  "style.flow.machine": "Máy: {machine}",
  "style.flow.manual": "Công đoạn thủ công",
  "style.flow.qualityGate": "Điểm kiểm soát chất lượng",
  "style.flow.station": "Trạm {station}",
  "style.flow.worker": "Công nhân {worker}",
  "style.flow.predecessors": "Trước đó: {operations}",
  "style.flow.start": "Đầu routing",
  "style.flow.mobileAria": "Danh sách công đoạn trong process flow",
  "style.flow.canvasAria": "Sơ đồ process flow theo precedence",

  "materials.loading": "Đang tải case vật tư tổng hợp…",
  "materials.error": "Không tải được case vật tư. Hãy kiểm tra API rồi thử lại.",
  "materials.retry": "Thử lại",
  "materials.case.aria": "Case chuẩn hóa vật tư tổng hợp",
  "materials.case.eyebrow": "Case portfolio T13",
  "materials.case.title": "Tiêu hao trước và sau",
  "materials.case.note":
    "LINE_01 / BASIC-TEE-001 · 1.820 pcs mỗi giai đoạn · cùng định mức và đơn giá.",
  "materials.case.standard": "Chi phí định mức",
  "materials.case.standardDetail": "3 vật tư · cùng định mức",
  "materials.case.before": "Thực tế trước",
  "materials.case.after": "Thực tế sau",
  "materials.case.reduction": "Giảm phần vượt",
  "materials.case.excess": "Vượt {value}",
  "materials.case.reductionDetail": "Giảm {value} phần vượt so với trước",
  "materials.table.material": "Vật tư",
  "materials.table.standard": "Định mức / pc",
  "materials.table.before": "Trước / pc",
  "materials.table.after": "Sau / pc",
  "materials.table.variance": "Chênh lệch so với định mức",
  "materials.table.beforeVar": "Trước",
  "materials.table.afterVar": "Sau",
  "materials.case.footnote":
    "Các giá trị sau vẫn cao hơn định mức. Mức giảm là cost avoidance trong cửa sổ 1.820 pcs tổng hợp, không phải cash saving đã xác nhận.",
  "materials.check.aria": "Máy tính chênh lệch tiêu hao vật tư",
  "materials.check.eyebrow": "What-if",
  "materials.check.title": "Kiểm tra chênh lệch tiêu hao",
  "materials.check.note":
    "Sửa tiêu hao thực tế hoặc đơn giá rồi tính lại. Giá trị mặc định là số sau pilot tổng hợp.",
  "materials.check.pcs": "Số pcs kiểm tra",
  "materials.check.material": "Vật tư",
  "materials.check.actual": "Tiêu hao thực tế / pc",
  "materials.check.unitCost": "Đơn giá (VND)",
  "materials.check.standard": "Định mức / pc",
  "materials.check.calculate": "Tính chênh lệch",
  "materials.check.calculating": "Đang tính…",
  "materials.check.empty": "Chưa có kết quả what-if.",
  "materials.check.pcsError": "Số pcs kiểm tra phải là số nguyên lớn hơn 0.",
  "materials.check.valuesError":
    "Tiêu hao thực tế phải từ 0 trở lên và đơn giá phải lớn hơn 0.",
  "materials.check.error":
    "Không tính được chênh lệch vật tư. Hãy kiểm tra giá trị nhập rồi thử lại.",
  "materials.result.standard": "Chi phí định mức",
  "materials.result.actual": "Chi phí thực tế",
  "materials.result.variance": "Chênh lệch",
  "materials.result.excessCount": "{count}/{total} vật tư vượt định mức",
  "materials.result.variancePct": "{value} so với định mức",
  "materials.result.above": "Vượt định mức",
  "materials.result.within": "Trong định mức",
  "materials.result.footnote":
    "Chi phí định mức / thực tế = tiêu hao mỗi pc × số pcs kiểm tra × đơn giá. Chênh lệch dương là tiêu hao vượt định mức; đây là chênh lệch tiêu hao, không phải chênh lệch giá mua. Chỉ dữ liệu tổng hợp/demo — không phải kết quả sản xuất đã kiểm chứng hay khoản tiết kiệm đã được Finance phê duyệt.",
  "materials.import.aria": "Xem trước import CSV vật tư",
  "materials.import.eyebrow": "Nhập CSV · API",
  "materials.import.title": "Kiểm tra file CSV vật tư",
  "materials.import.note":
    "Tải file CSV tiêu hao vật tư tổng hợp. Server cộng dòng theo số pcs kiểm tra, bỏ qua phase khác và tính lại chi phí. Không lưu file hay kết quả.",
  "materials.import.phase": "Phase cần nhập",
  "materials.import.file": "File CSV",
  "materials.import.fileHint": "text/csv, UTF-8 · tối đa 5.000 dòng dữ liệu / 2 MB",
  "materials.import.submit": "Kiểm tra CSV",
  "materials.import.importing": "Đang kiểm tra…",
  "materials.import.empty": "Chọn file CSV để xem kết quả kiểm tra.",
  "materials.import.fileRequired": "Hãy chọn file CSV trước.",
  "materials.import.fileTooLarge": "File CSV phải có dung lượng tối đa 2 MB.",
  "materials.import.error":
    "Không kiểm tra được file CSV. Hãy xem lại file rồi thử lại.",
  "materials.import.previewTitle": "Kết quả kiểm tra",
  "materials.import.rows": "Số dòng dùng",
  "materials.import.ignored": "Số dòng bỏ qua",
  "materials.import.pcs": "Số pcs kiểm tra",
  "materials.import.warnings": "Cảnh báo",
  "materials.import.warningIgnored":
    "Đã bỏ qua {count} dòng thuộc phase khác; chỉ nhập {phase}.",
  "materials.import.warningDerived":
    "Cột chi phí dẫn xuất đã bị bỏ qua; chi phí được tính lại từ số lượng và đơn giá.",
  "materials.import.warningGeneric": "Server trả thêm một cảnh báo import.",
  "materials.import.footnote":
    "Chỉ xem trước: file và kết quả không được lưu. Dữ liệu tổng hợp/demo; không phải material master hay khoản tiết kiệm đã được Finance phê duyệt.",
  "materials.import.errorColumns": "File CSV thiếu cột bắt buộc: {columns}.",
  "materials.import.errorPolicy":
    "Chỉ chấp nhận dữ liệu tổng hợp/demo (data_policy = SYNTHETIC).",
  "materials.import.errorRows": "File CSV vượt giới hạn 5.000 dòng dữ liệu.",
  "materials.import.errorEmptyCsv": "File CSV đang trống.",
  "materials.import.errorEncoding": "File CSV phải được mã hóa UTF-8.",
  "materials.import.errorPhase": "File CSV không có dòng nào cho phase đã chọn.",
  "materials.import.errorRow":
    "Dòng {row} có dữ liệu không hợp lệ. Hãy kiểm tra giá trị trong dòng rồi thử lại.",

  "scenarioImport.aria": "Nhập CSV hoặc Excel dữ liệu gốc kịch bản",
  "scenarioImport.eyebrow": "Dữ liệu gốc · CSV / XLSX",
  "scenarioImport.title": "Nhập định tuyến, nhân sự và máy",
  "scenarioImport.note":
    "Tải cùng lúc bốn file CSV tổng hợp hoặc một workbook .xlsx có bốn sheet. API kiểm tra cột, tham chiếu và thứ tự công đoạn; không lưu dữ liệu. Áp dụng sẽ thay kịch bản đang làm việc và chạy lại solver.",
  "scenarioImport.operations": "CSV công đoạn",
  "scenarioImport.workers": "CSV công nhân",
  "scenarioImport.skills": "CSV kỹ năng công nhân",
  "scenarioImport.machines": "CSV máy",
  "scenarioImport.required": "Bắt buộc",
  "scenarioImport.optional": "Tùy chọn",
  "scenarioImport.hint.operations":
    "operation_id, sam_sec, predecessor_ids, machine_type, skill_code…",
  "scenarioImport.hint.workers": "worker_id, worker_name, available, machine_types",
  "scenarioImport.hint.skills": "worker_id, operation_id, skill_grade (A/B/C hoặc 0–3)",
  "scenarioImport.hint.machines": "machine_id, machine_type, available, capacity",
  "scenarioImport.fileMissing": "Hãy chọn {file} trước.",
  "scenarioImport.tooLarge": "Tổng dung lượng bốn file CSV phải từ 2 MB trở xuống.",
  "scenarioImport.error":
    "Không kiểm tra được dữ liệu nhập. Hãy xem lại các file rồi thử lại.",
  "scenarioImport.validating": "Đang kiểm tra dữ liệu…",
  "scenarioImport.submit": "Kiểm tra dữ liệu",
  "scenarioImport.or": "hoặc",
  "scenarioImport.workbookFile": "Workbook Excel",
  "scenarioImport.workbookHint":
    ".xlsx với các sheet operations, workers, worker_skills, machines · tối đa 2 MB",
  "scenarioImport.workbookMissing": "Hãy chọn workbook .xlsx trước.",
  "scenarioImport.workbookTooLarge": "Workbook phải có dung lượng tối đa 2 MB.",
  "scenarioImport.workbookValidating": "Đang kiểm tra workbook…",
  "scenarioImport.workbookSubmit": "Kiểm tra workbook",
  "scenarioImport.empty":
    "Chọn file công đoạn, công nhân và kỹ năng, hoặc một workbook .xlsx, để xem bản xem trước đã kiểm tra.",
  "scenarioImport.previewTitle": "Kịch bản đã kiểm tra",
  "scenarioImport.unknownStyle": "Style chưa đặt tên",
  "scenarioImport.count.operations": "Công đoạn",
  "scenarioImport.count.workers": "Công nhân",
  "scenarioImport.count.skills": "Lượt kỹ năng",
  "scenarioImport.count.machines": "Máy",
  "scenarioImport.layers": "Số lớp thứ tự",
  "scenarioImport.machineTypes": "Loại máy",
  "scenarioImport.table.operation": "Công đoạn",
  "scenarioImport.table.sam": "SAM (giây)",
  "scenarioImport.table.predecessors": "Công đoạn trước",
  "scenarioImport.table.machine": "Máy",
  "scenarioImport.table.skill": "Yêu cầu kỹ năng",
  "scenarioImport.noPredecessors": "—",
  "scenarioImport.manual": "Thủ công",
  "scenarioImport.apply": "Áp dụng & tối ưu",
  "scenarioImport.applying": "Đang áp dụng & tối ưu…",
  "scenarioImport.applyHint":
    "Áp dụng sẽ thay định tuyến, công nhân và máy, xóa baseline tổng hợp cũ và chạy lại solver. Dữ liệu thực tế chỉ được giữ khi style và line nhập vào trùng kịch bản hiện tại.",
  "scenarioImport.footnote":
    "Chỉ xem trước: file không được lưu. Dữ liệu gốc nhập vào là tổng hợp/demo; các chẩn đoán của solver vẫn áp dụng.",
  "scenarioImport.errorColumns": "File CSV thiếu cột bắt buộc: {columns}.",
  "scenarioImport.errorNoRows": "Một file CSV không có dòng dữ liệu.",
  "scenarioImport.errorEfficiency":
    "Không hỗ trợ hiệu suất riêng theo công nhân. Hãy bỏ cột efficiency_factor và dùng SAM đã duyệt cho từng công đoạn.",
  "scenarioImport.errorWorkbookInvalid": "File không phải workbook .xlsx hợp lệ.",
  "scenarioImport.errorWorkbookSheets": "Workbook thiếu các sheet bắt buộc: {sheets}.",
  "scenarioImport.errorWorkbookSize":
    "Workbook vượt giới hạn dung lượng an toàn. Hãy giảm nội dung rồi thử lại.",
  "scenarioImport.errorDetail":
    "Dữ liệu nhập không qua kiểm tra. Chi tiết kỹ thuật: {detail}",

  "notice.rerun": "Đã tối ưu lại trong {seconds} giây · {status}.",
  "notice.solverStatus":
    "Lần tối ưu có trạng thái {status}. Hãy kiểm tra dữ liệu và các cảnh báo.",
  "notice.applied":
    "Đã áp dụng dữ liệu hiện trường. Chỉ tối ưu lại khi phương pháp, định mức hoặc ràng buộc thay đổi.",
  "notice.importApplied":
    "Đã nhập {operations} công đoạn, {workers} công nhân và {machines} máy · solver trả trạng thái {status}.",
  "notice.export":
    "Đã tạo bảng tính từ dữ liệu đầu vào và kết quả hiện tại bằng tiếng Việt.",
  "notice.snapshotSaved": 'Đã lưu phương án "{name}" trong trình duyệt này.',
  "notice.snapshotLoaded": 'Đã mở bản lưu "{name}".',
  "notice.login": "Đã đăng nhập với tài khoản {user}.",
  "notice.logout": "Đã đăng xuất. Bản lưu nội bộ và tối ưu hóa vẫn dùng được.",
  "notice.sessionExpired":
    "Phiên đăng nhập đã hết hạn hoặc không hợp lệ. Hãy đăng nhập lại để dùng kịch bản máy chủ.",
  "notice.serverSaved": 'Đã tối ưu lại và lưu kịch bản "{name}" trên máy chủ.',
  "notice.serverLoaded": 'Đã mở kịch bản máy chủ "{name}".',
  "notice.serverDeleted": 'Đã xóa kịch bản máy chủ "{name}".',
  "error.snapshotSave":
    "Không lưu được: bộ nhớ trình duyệt có thể đã đầy. Hãy xóa bớt bản lưu cũ.",
  "error.storage": "Không cập nhật được bộ nhớ trình duyệt.",
  "error.apiUnavailable":
    "Không kết nối được với dịch vụ tối ưu hóa. Hãy kiểm tra kết nối rồi thử lại.",
  "error.apiValidation":
    "Dữ liệu gửi lên chưa hợp lệ. Hãy kiểm tra các trường nhập rồi thử lại.",
  "error.apiRateLimit": "Bạn gửi quá nhiều yêu cầu. Hãy đợi một lát rồi thử lại.",
  "error.apiBodyLimit": "Dữ liệu gửi lên quá lớn. Hãy giảm dung lượng rồi thử lại.",
  "error.apiGeneric":
    "Không thể hoàn tất yêu cầu. Hãy kiểm tra dữ liệu đầu vào rồi thử lại.",
  "app.dismissNotice": "Đóng thông báo",
  "app.dismissError": "Đóng thông báo lỗi",

  "metrics.aria": "Các chỉ số hiệu suất chính",
  "metrics.secondaryAria": "Các chỉ số hoạch định và thực tế bổ sung",
  "metrics.empty": "Chưa có chỉ số. Bộ tối ưu hóa chưa tìm được phương án khả thi.",
  "metric.bottleneck.label": "Nút cổ chai",
  "metric.bottleneck.over": "Vượt nhịp hiệu dụng {value} giây",
  "metric.bottleneck.inside": "Thấp hơn nhịp hiệu dụng {value} giây",
  "metric.bottleneck.foot": "Trạm {station} quyết định nhịp",
  "metric.lbe.label": "Hiệu suất cân bằng chuyền",
  "metric.lbe.delta": "{value} so với hiện trạng",
  "metric.lbe.foot": "Định mức kế hoạch / (công nhân × nút cổ chai)",
  "metric.workers.label": "Công nhân trên chuyền",
  "metric.workers.delta": "{value} so với hiện trạng {base}",
  "metric.workers.foot": "Mỗi trạm một công nhân",
  "metric.noBaseline": "Không có dữ liệu hiện trạng tổng hợp",
  "metric.capacity.label": "Năng lực / ca",
  "metric.capacity.short": "Thiếu {value} sản phẩm so với mục tiêu",
  "metric.capacity.above": "Vượt {value} sản phẩm so với mục tiêu",
  "metric.capacity.foot": "Theo giới hạn nút cổ chai · mục tiêu {target}",
  "metric.capacity.delta": "{value} so với hiện trạng · theo giới hạn nút cổ chai",
  "metric.workstations.label": "Trạm làm việc",
  "metric.workstations.foot": "Số trạm đang hoạt động trong phương án",
  "metric.idle.label": "Thời gian nhàn rỗi theo mô hình",
  "metric.idle.note": "Tổng so với nhịp hiệu dụng · không phải thời gian nhàn thực tế",
  "metric.actualOutput.label": "Sản lượng thực tế",
  "metric.actualOutput.period": "Thực tế tổng hợp {days} ngày",
  "metric.actualOutput.missing": "Chưa có dữ liệu",
  "metric.utilization.label": "Tỷ lệ sử dụng lao động theo kế hoạch",
  "metric.utilization.foot":
    "Chỉ số hoạch định · không phải hiệu suất lao động thực tế",

  "takt.eyebrow": "Nhịp sản xuất & thời gian chu kỳ",
  "takt.title.compact": "Nhịp so với tải nút cổ chai",
  "takt.title.full": "Nhịp nhu cầu và nhịp kế hoạch",
  "takt.chip": "Giây / sản phẩm",
  "takt.marker.effective": "Nhịp hiệu dụng {value} giây",
  "takt.marker.demand": "Nhịp nhu cầu {value} giây",
  "takt.over": "Tải nút cổ chai vượt nhịp hiệu dụng {value} giây",
  "takt.inside": "Tải nút cổ chai thấp hơn nhịp hiệu dụng {value} giây",
  "takt.scale": "Độ dài cột thể hiện tải nút cổ chai trên thang 0–{value} giây.",
  "takt.demand.label": "Nhịp theo nhu cầu",
  "takt.effective.label": "Nhịp hiệu dụng",
  "takt.gap.label": "Chênh lệch tải",
  "takt.footnote":
    "Nhịp theo nhu cầu thể hiện yêu cầu khách hàng; nhịp hiệu dụng đã tính {pct} hiệu suất kế hoạch trước khi so với tải nút cổ chai.",
  "takt.demand.body":
    "{seconds} giây khả dụng ÷ {target} sản phẩm. Đây là yêu cầu khách hàng ở 100% thời gian theo lịch.",
  "takt.effective.body":
    "{seconds} giây × {pct} hiệu suất kế hoạch ÷ {target} sản phẩm. Đây là nhịp cho phép trong hoạch định, không phải nhịp theo nhu cầu.",
  "takt.bottleneck.body.over":
    "Tải nút cổ chai vượt nhịp hiệu dụng {value} giây. Năng lực chỉ đạt {pct} mục tiêu.",
  "takt.bottleneck.body.ok":
    "Tải nút cổ chai nằm trong nhịp hiệu dụng. Chuyền có thể đạt mục tiêu ở hiệu suất kế hoạch.",

  "target.eyebrow": "Khả năng đạt mục tiêu",
  "target.title": "Chuyền có đạt mục tiêu không?",
  "target.empty": "Chưa có chỉ số cho lần tối ưu này.",
  "target.met": "Đạt mục tiêu",
  "target.gap": "Còn thiếu",
  "target.of": "mục tiêu",
  "target.target": "Mục tiêu",
  "target.capacity": "Năng lực",
  "target.short": "Thiếu",
  "target.surplus": "Vượt",
  "target.pcsShift": "sản phẩm / ca",
  "target.bottleneckConstrained": "theo giới hạn nút cổ chai",
  "target.formula":
    "Năng lực = {seconds} giây × {pct} ÷ {bottleneck} giây = {capacity} sản phẩm",
  "target.delta": "{value} so với hiện trạng tổng hợp",
  "target.footnote":
    "Năng lực dựa trên trạm nút cổ chai, không dựa trên tích số công nhân × định mức lý thuyết. Không kết luận đạt mục tiêu nếu chuyền không đáp ứng nhịp theo nhu cầu.",
  "target.aria": "{pct} so với mục tiêu",

  "workload.eyebrow": "Biểu đồ tải trạm",
  "workload.title.compact": "Tải trạm cao nhất",
  "workload.title.full": "Phân bố tải trên chuyền",
  "workload.allStations": "Tất cả trạm",
  "workload.viewAria": "Chế độ xem tải",
  "workload.optimized": "Tối ưu",
  "workload.baseline": "Hiện trạng",
  "workload.summary.compact": "{shown} / {total} trạm",
  "workload.summary.full": "{total} trạm",
  "workload.summary.maxLoad": "Tải lớn nhất {value} giây",
  "workload.summary.effective": "Nhịp hiệu dụng {value} giây",
  "workload.summary.demand": "Nhịp theo nhu cầu {value} giây",
  "workload.legend.bottleneck": "Nút cổ chai",
  "workload.legend.watch": "Theo dõi",
  "workload.legend.normal": "Bình thường",
  "workload.legend.underutilized": "Thiếu tải",
  "workload.legend.effective": "Nhịp hiệu dụng",
  "workload.legend.demand": "Nhịp theo nhu cầu",
  "workload.axis.load": "Định mức kế hoạch / trạm (giây mỗi sản phẩm)",
  "workload.axis.zero": "0 giây",
  "workload.axis.scale": "{value} giây",
  "workload.rowTooltip":
    "Trạm {station} · công nhân {worker} · tải kế hoạch {load} giây · trạng thái {status}",
  "workload.footnote":
    "Độ dài cột là định mức kế hoạch của từng trạm, không phải hiệu suất máy. Nhịp hiệu dụng đã tính hiệu suất kế hoạch; nhịp theo nhu cầu thể hiện yêu cầu khách hàng ở 100% thời gian theo lịch.",

  "balance.tabsAria": "Chế độ xem cân bằng chuyền",
  "balance.tab.loads": "Tải trạm",
  "balance.tab.map": "Sơ đồ phân công",
  "balance.tab.baseline": "Trước / sau",
  "balance.note": "Cơ sở định mức kế hoạch · chuyền dữ liệu tổng hợp",

  "station.eyebrow": "Chi tiết phân công",
  "station.title": "Sơ đồ trạm, công nhân và công đoạn",
  "station.chip": "{count} trạm",
  "station.col.station": "Trạm",
  "station.col.worker": "Công nhân",
  "station.col.operations": "Công đoạn",
  "station.col.load": "Tải công việc (giây)",
  "station.col.utilization": "Mức tải so với nhịp hiệu dụng (%)",
  "station.col.status": "Trạng thái",
  "station.col.operationsCount": "Công đoạn",
  "station.col.takt": "Nhịp hiệu dụng",
  "station.col.idle": "Thời gian nhàn rỗi so với nhịp hiệu dụng",
  "station.searchAria": "Tìm trạm làm việc",
  "station.searchPlaceholder": "Trạm, công nhân hoặc công đoạn…",
  "station.filter.status": "Trạng thái",
  "station.filter.all": "Tất cả trạng thái",
  "station.sortBy": "Sắp xếp theo {column}",
  "station.sortAscending": "tăng dần",
  "station.sortDescending": "giảm dần",
  "station.operationCount": "{count} công đoạn",
  "station.noResults": "Không có trạm phù hợp với bộ lọc.",
  "station.footnote":
    "Tỷ lệ tải là tải trạm chia cho nhịp hiệu dụng, không phải thời gian máy hoạt động. Công đoạn thủ công không cần máy.",
  "bottleneck.eyebrow": "Điểm cần tập trung",
  "bottleneck.title": "Phân tích nút cổ chai",
  "bottleneck.empty": "Chưa có kết quả cấp trạm.",
  "bottleneck.current": "Trạm có tải cao nhất",
  "bottleneck.load": "Tải kế hoạch",
  "bottleneck.effectiveTakt": "Nhịp hiệu dụng",
  "bottleneck.overload": "Tải vượt nhịp hiệu dụng",
  "bottleneck.buffer": "Khoảng dư đến nhịp hiệu dụng",
  "bottleneck.utilization": "Mức tải trạm so với nhịp hiệu dụng",
  "bottleneck.priority": "Trạm cần xem xét",
  "bottleneck.showing": "Hiển thị {shown}/{total} trạm",
  "bottleneck.noPriority":
    "Không có trạm nào bị đánh dấu cần xem xét theo quy tắc trạng thái hiện tại.",
  "bottleneck.reviewLimit":
    "Danh sách ưu tiên theo trạng thái của mô hình; không tự chẩn đoán nguyên nhân gốc.",
  "station.status.bottleneck": "Nút cổ chai",
  "station.status.watch": "Theo dõi",
  "station.status.normal": "Bình thường",
  "station.status.underutilized": "Thiếu tải",

  "baseline.eyebrow": "Trước / sau",
  "baseline.title": "So sánh hiện trạng",
  "baseline.empty": "Chưa có dữ liệu hiện trạng. Chỉ hiển thị kết quả tối ưu.",
  "baseline.chip": "Dữ liệu hiện trạng tổng hợp",
  "baseline.row.stations": "Số trạm sử dụng",
  "baseline.row.stations.note": "Trạm thực tế có công việc",
  "baseline.row.workers": "Công nhân trên chuyền",
  "baseline.row.workers.note": "Mỗi trạm một công nhân",
  "baseline.row.bottleneck": "Tải nút cổ chai",
  "baseline.row.bottleneck.note": "Trạm nút cổ chai: {before} → {after}",
  "baseline.row.lbe": "Hiệu suất cân bằng",
  "baseline.row.lbe.note": "Tổng định mức kế hoạch / (số công nhân × tải nút cổ chai)",
  "baseline.row.capacity": "Năng lực / ca",
  "baseline.row.capacity.note": "Sản phẩm/ca theo giới hạn nút cổ chai",
  "baseline.row.target": "Mức đạt mục tiêu",
  "baseline.row.target.met": "Đạt mục tiêu",
  "baseline.row.target.missed": "Chưa đạt mục tiêu",
  "baseline.row.smoothness": "Chỉ số độ mượt tải",
  "baseline.row.smoothness.note": "Càng thấp, tải càng đồng đều",
  "baseline.row.idle": "Tổng thời gian nhàn rỗi",
  "baseline.row.idle.note": "So với nhịp hiệu dụng",
  "baseline.row.overload": "Tổng quá tải",
  "baseline.row.overload.note": "Tải vượt nhịp hiệu dụng",
  "baseline.improvement": "{value} cải thiện",
  "baseline.col.metric": "Chỉ số",
  "baseline.col.before": "Hiện trạng",
  "baseline.col.after": "Tối ưu",
  "baseline.col.delta": "Chênh lệch",
  "baseline.footnote":
    "Hiện trạng là cách bố trí lần lượt trên dữ liệu tổng hợp, không phải kết quả của bộ tối ưu hóa. Chênh lệch = phương án tối ưu trừ hiện trạng; với tải nút cổ chai, thời gian nhàn rỗi và quá tải, chênh lệch âm là cải thiện.",

  "planning.eyebrow": "Năng lực & nhân sự",
  "planning.title": "Tóm tắt hoạch định",
  "planning.empty": "Không có tóm tắt hoạch định cho kết quả này.",
  "planning.chip": "Giới hạn bởi nút cổ chai",
  "planning.theoretical.label": "Năng lực lý thuyết",
  "planning.theoretical.note": "sản phẩm/ca · chưa xét cân bằng",
  "planning.bottleneck.label": "Năng lực nút cổ chai",
  "planning.bottleneck.note": "sản phẩm/ca · dùng để đánh giá mục tiêu",
  "planning.requiredHc.label": "Công nhân cần thiết",
  "planning.requiredHc.note": "ước tính lý thuyết",
  "planning.availableHc.label": "Công nhân sẵn có",
  "planning.availableHc.note": "theo kịch bản hiện tại",
  "planning.periodTarget.label": "Mục tiêu kỳ",
  "planning.periodTarget.note": "{days} ngày làm việc",
  "planning.periodCapacity.label": "Năng lực kỳ",
  "planning.periodCapacity.note": "chênh lệch {value} sản phẩm",
  "planning.periodAchievement": "{pct} mục tiêu trong kỳ",
  "planning.callout":
    "Năng lực lý thuyết đạt {pct} mục tiêu nhưng bỏ qua thứ tự công đoạn, máy và cân bằng. Con số nút cổ chai mới là con số hoạch định trung thực.",
  "planning.machine.title": "Nhu cầu và năng lực máy",
  "planning.machine.note": "Không phản ánh thời gian sử dụng máy",
  "planning.machine.col.type": "Loại máy",
  "planning.machine.col.required": "Trạm cần",
  "planning.machine.col.available": "Sẵn có",
  "planning.machine.col.gap": "Chênh lệch",
  "planning.machine.col.coverage": "Mức đáp ứng",
  "planning.machine.footnote":
    "Mức đáp ứng so sánh số trạm cần với năng lực máy sẵn có. Chỉ số này không đo thời gian chạy, suy giảm tốc độ hay chất lượng, nên không được gọi là mức sử dụng máy hoặc chỉ số hiệu suất thiết bị tổng thể.",
  "planning.hc.title": "Kiểm soát nhân sự",
  "planning.hc.note": "Định mức, thực tế và phương án tối ưu",
  "planning.hc.standard": "Định mức",
  "planning.hc.planned": "Kế hoạch",
  "planning.hc.actual": "Thực tế",
  "planning.hc.attendance": "Điểm danh",
  "planning.hc.optimized": "Tối ưu",
  "planning.hc.adherence": "Tuân thủ",
  "planning.hc.attendancePct": "Điểm danh",
  "planning.skill.title": "Theo dõi đáp ứng kỹ năng",
  "planning.skill.item": "bậc {grade} · {count} công nhân đủ điều kiện",
  "planning.skill.ok": "Tất cả kiểm tra độ phủ kỹ năng đều đạt.",
  "planning.transfer.title": "Gợi ý điều chuyển",
  "planning.transfer.reason":
    "{name} đủ kỹ năng hỗ trợ trạm nút cổ chai ST{station} ({load} giây).",

  "actuals.eyebrow": "Thực tế",
  "actuals.title": "Sản xuất thực tế",
  "actuals.empty":
    "Chưa có số liệu thực tế. Hãy ghi nhận sản lượng trong biểu mẫu để tính mức đạt và hiệu suất lao động.",
  "actuals.period.shift": "1 ca",
  "actuals.period.days": "{days} ngày",
  "actuals.output": "Sản lượng",
  "actuals.target": "mục tiêu {value} sản phẩm",
  "actuals.achievement": "Mức đạt sản lượng",
  "actuals.actualTarget": "thực tế / mục tiêu",
  "actuals.laborEfficiency": "Hiệu suất lao động thực tế",
  "actuals.samBasis": "theo định mức kế hoạch",
  "actuals.downtime": "Thời gian dừng",
  "actuals.ofPlanned": "{pct} so với thời gian kế hoạch",
  "actuals.byCategory": "Thời gian dừng theo nhóm",
  "actuals.summaryDetail": "Số liệu tổng hợp so với chi tiết sự kiện",
  "actuals.noDowntime": "Chưa ghi nhận sự kiện dừng.",
  "actuals.note.missingLabor":
    "Thiếu số phút lao động trực tiếp cho {count} ngày; hiệu suất lao động chỉ tính trên những ngày có dữ liệu.",
  "actuals.note.noLabor":
    "Không tính hiệu suất lao động vì chưa có số phút lao động trực tiếp thực tế. Không thể thay bằng thời gian ca đã trôi qua.",
  "actuals.note.downtimeMismatch":
    "Tổng thời gian dừng theo sự kiện khác số tổng hợp. Hệ thống dùng số tổng hợp cho tổng thời gian dừng; bảng nhóm vẫn hiển thị chi tiết sự kiện.",
  "actuals.note.method":
    "Mức đạt sản lượng dùng mục tiêu của cùng kỳ. Hiệu suất lao động dùng định mức kế hoạch; tỷ lệ dừng dùng tổng phút ca theo lịch.",
  "actuals.note.generic": "Có ghi chú bổ sung về số liệu thực tế.",

  "loss.MACHINE": "Máy",
  "loss.MATERIAL": "Nguyên liệu",
  "loss.MANPOWER": "Nhân lực",
  "loss.QUALITY": "Chất lượng",
  "loss.CHANGEOVER": "Đổi mã hàng",
  "loss.OTHER": "Khác",
  "loss.UNSPECIFIED": "Chưa phân loại",

  "forms.timeStudyAria": "Nhập nghiên cứu thời gian",
  "forms.actualsAria": "Biểu mẫu nhập hiện trường",
  "forms.shopFloor": "Nhập liệu tại chuyền",
  "forms.logEvent": "Ghi sự kiện trong ca",
  "forms.actualsFormAria": "Biểu mẫu thực tế",
  "forms.tab.production": "Sản xuất",
  "forms.tab.downtime": "Thời gian dừng",
  "forms.production.title": "Sản xuất thực tế",
  "forms.production.note": "Một bản ghi cho một ca. Thay thế số liệu mẫu 5 ngày.",
  "forms.field.target": "Sản lượng mục tiêu (sản phẩm)",
  "forms.field.actualOutput": "Sản lượng thực tế (sản phẩm)",
  "forms.field.laborMinutes": "Phút lao động trực tiếp",
  "forms.field.attendance": "Số công nhân có mặt",
  "forms.field.downtimeMinutes": "Số phút dừng",
  "forms.calculating": "Đang tính…",
  "forms.applyActuals": "Áp dụng thực tế",
  "forms.downtime.title": "Sự kiện dừng",
  "forms.downtime.note": "Ghi một tổn thất. Thời lượng được cộng vào tổng ca.",
  "forms.field.start": "Bắt đầu",
  "forms.field.end": "Kết thúc",
  "forms.field.station": "Trạm",
  "forms.field.lossCategory": "Nhóm tổn thất",
  "forms.field.duration": "Thời lượng",
  "forms.field.note": "Ghi chú",
  "forms.defaultDowntimeNote": "vd. Đứt chỉ trên máy vắt sổ",
  "forms.lineLevel": "Toàn chuyền",
  "forms.addDowntime": "Thêm sự kiện dừng",
  "forms.latestEvents": "Sự kiện gần nhất",
  "forms.timeStudy.title": "Nghiên cứu thời gian",
  "forms.timeStudy.note":
    "Thời gian bình thường và thời gian định mức. Chỉ tạo bản nháp — không tự cập nhật định mức.",
  "forms.timeStudy.guardrail":
    "Chỉ nhập thời gian quan sát của lao động thủ công và đi bộ. Không áp hệ số đánh giá cho thời gian máy tự động; cần tách riêng các phần tử công việc kết hợp trước (hướng dẫn §3.6).",
  "forms.field.operation": "Công đoạn",
  "forms.field.observed": "Thời gian quan sát (giây)",
  "forms.field.rating": "Hệ số đánh giá",
  "forms.field.allowance": "Phụ cấp thời gian (%)",
  "forms.field.approvedSam": "Định mức đã duyệt (giây)",
  "forms.calculateTimeStudy": "Tính nghiên cứu thời gian",
  "forms.result.normal": "Thời gian chuẩn hóa",
  "forms.result.standard": "Thời gian chuẩn",
  "forms.result.approved": "Định mức đã duyệt",
  "forms.result.variance": "Chênh lệch",
  "forms.result.note":
    "{operation} Chỉ là bản nháp. Hãy đo lại và phê duyệt trước khi đổi định mức trong bộ tối ưu hóa.",
  "forms.error.endAfterStart": "Thời gian kết thúc phải sau thời gian bắt đầu.",
  "forms.error.chooseOperation":
    "Hãy chọn công đoạn và nhập thời gian quan sát lớn hơn 0.",
  "forms.mini.achievement": "Mức đạt",
  "forms.mini.labor": "Hiệu suất lao động",
  "forms.mini.downtime": "Thời gian dừng",

  "guide.eyebrow": "Nguyên tắc phương pháp",
  "guide.title": "Cách xây dựng thời gian chuẩn",
  "guide.chip": "Quy trình nháp",
  "guide.step1.title": "Quan sát phần tử",
  "guide.step1.body":
    "Chỉ dùng thời gian của người và đi bộ. Tách thời gian máy tự động trước khi áp hệ số đánh giá.",
  "guide.step1.code": "thời gian quan sát",
  "guide.step2.title": "Chuẩn hóa nhịp",
  "guide.step2.body":
    "Hệ số 1.00 nghĩa là nhịp quan sát bằng nhịp chuẩn. Chỉ áp hệ số cho lao động thủ công.",
  "guide.step2.code": "chuẩn hóa = quan sát × hệ số",
  "guide.step3.title": "Cộng phụ cấp thời gian",
  "guide.step3.body":
    "Phụ cấp bao gồm nhu cầu cá nhân, mệt mỏi và chờ đợi. Chỉ cộng một lần và giữ cơ sở phụ cấp thống nhất với định mức của chuyền.",
  "guide.step3.code": "định mức = bình thường × (1 + phụ cấp)",
  "guide.step4.title": "Phê duyệt trước khi dùng",
  "guide.step4.body":
    "Màn hình này chỉ ghi bản nháp. Định mức đã duyệt là giá trị có thẩm quyền; bộ tối ưu hóa không tự cập nhật.",
  "guide.step4.code": "Định mức đã duyệt → đầu vào hoạch định",
  "guide.warning.title": "Không áp hệ số đánh giá cho thời gian máy tự động.",
  "guide.warning.body":
    "Phần tử hỗn hợp phải được tách trước, nếu không hệ số đánh giá sẽ thổi phồng thời gian máy và làm sai định mức.",

  "metadata.eyebrow": "Nguồn gốc lần tối ưu",
  "metadata.title": "Thông tin tối ưu hóa và dữ liệu",
  "metadata.solver": "Bộ tối ưu hóa",
  "metadata.solveTime": "Thời gian tối ưu hóa",
  "metadata.proof": "Chứng minh tối ưu hai bước",
  "metadata.proven": "Đã chứng minh",
  "metadata.notProven": "Chưa chứng minh",
  "metadata.model": "Mô hình",
  "metadata.dataVersion": "Phiên bản dữ liệu",
  "metadata.dataPolicy": "Chính sách dữ liệu",
  "metadata.syntheticOnly": "Chỉ dữ liệu tổng hợp",
  "metadata.warnings": "{count} cảnh báo",
  "metadata.critical": "{count} nghiêm trọng",
  "metadata.warning": "{count} cảnh báo",
  "metadata.feasible": "Có phương án khả thi",
  "metadata.notFeasible": "Không có phương án khả thi",
  "metadata.showNotes": "Xem ghi chú ràng buộc",
  "metadata.footnote":
    "Phần mềm minh họa công khai chỉ dùng dữ liệu tổng hợp. Hiện trạng mẫu là dữ liệu đầu vào, không phải kết quả của bộ tối ưu hóa. Lưu hoặc xóa kịch bản trên máy chủ cần tài khoản demo quyền quản trị; bản lưu nội bộ vẫn nằm trong trình duyệt này.",
  "severity.info": "Thông tin",
  "severity.warning": "Cảnh báo",
  "severity.critical": "Nghiêm trọng",

  "warning.allowanceIgnored":
    "Định mức nhập vào đã bao gồm phụ cấp thời gian; hệ thống không cộng thêm để tránh tính trùng.",
  "warning.baselineViolations":
    "Bố trí hiện trạng tổng hợp có {count} vi phạm ràng buộc. Xem bảng so sánh trước/sau.",
  "warning.capacityTargetNotMet":
    "Năng lực bị giới hạn bởi nút cổ chai thấp hơn mục tiêu sản lượng.",
  "warning.headcountLimitBinding":
    "Phương án dùng {used}/{allowed} công nhân được phép; giới hạn nhân lực đang chi phối kết quả.",
  "warning.machineCapacityShared":
    "Năng lực máy hiện có phải dùng chung cho nhiều công đoạn; cần xem lại cách phân bổ máy.",
  "warning.maxWorkersClamped":
    "Yêu cầu {requested} công nhân vượt số người khả dụng ({available}); hệ thống đã giảm về mức khả dụng.",
  "warning.operationOverEffectiveTakt":
    "Công đoạn {operation} vượt nhịp hiệu dụng; không thể đạt mục tiêu năng lực khi bố trí riêng tại một trạm.",
  "warning.operationOverDemandTakt":
    "Công đoạn {operation} vượt nhịp theo nhu cầu; cần tách công đoạn hoặc thay đổi phương pháp.",
  "warning.singlePointOfFailure":
    "Chỉ có {worker} đủ điều kiện thực hiện công đoạn {operation}. Nên đào tạo thêm người dự phòng.",
  "warning.stationOverEffectiveTakt":
    "Trạm {station} ({worker}) vượt nhịp hiệu dụng với mức tải {utilization}. Cần cân bằng lại hoặc bổ sung năng lực.",
  "warning.stationNearEffectiveTakt":
    "Trạm {station} ({worker}) gần chạm nhịp hiệu dụng với mức tải {utilization}. Cần theo dõi.",
  "warning.stationUnderutilized":
    "Trạm {station} ({worker}) có mức tải kế hoạch thấp ({utilization}). Có thể xem xét gộp công việc.",
  "warning.taktUnreachable":
    "Ngay cả trước khi xét thứ tự công đoạn, tải nút cổ chai thấp nhất vẫn vượt nhịp hiệu dụng. Nhân lực và dữ liệu hiện tại không đáp ứng mục tiêu.",
  "warning.unusedWorkers":
    "Một số công nhân khả dụng chưa được bố trí trong phương án.",
  "warning.workerNoQualifiedOperation":
    "Công nhân {worker} không đủ điều kiện cho công đoạn nào theo dữ liệu kỹ năng và máy hiện tại.",
  "warning.generic": "Có thêm một cảnh báo từ lần tối ưu này.",

  "snapshots.eyebrow": "Lưu trong trình duyệt",
  "snapshots.title": "Các bản lưu",
  "snapshots.chip": "Chỉ lưu trên trình duyệt",
  "snapshots.intro":
    "Lưu dữ liệu đầu vào và kết quả hiện tại trong trình duyệt này. Đăng nhập để lưu thêm kịch bản tổng hợp trên máy chủ demo.",
  "snapshots.nameAria": "Tên bản lưu",
  "snapshots.placeholder": "vd. A — sau cân bằng lại",
  "snapshots.save": "Lưu phương án",
  "snapshots.empty": "Chưa có bản lưu. Hãy lưu sau khi tối ưu lại.",
  "snapshots.load": "Mở",
  "snapshots.delete": "Xóa",
  "snapshots.loadAria": "Mở bản lưu {name}",
  "snapshots.deleteAria": "Xóa bản lưu {name}",
  "snapshots.meta": "{savedAt} · {status} · {workers} công nhân",
  "snapshots.error.name": "Hãy đặt tên bản lưu trước.",

  "summary.eyebrow": "Dữ liệu đầu vào",
  "summary.title": "Tóm tắt kịch bản",
  "summary.chip": "Có thể tái lập",
  "summary.line": "Chuyền",
  "summary.style": "Mã hàng",
  "summary.shift": "Ca",
  "summary.target": "Mục tiêu",
  "summary.targetValue": "{value} sản phẩm / ca",
  "summary.maxWorkers": "Số công nhân tối đa",
  "summary.efficiency": "Hiệu suất kế hoạch",
  "summary.samBasis": "Cơ sở định mức",
  "summary.allowance": "Phụ cấp thời gian",
  "summary.solverLimit": "Thời gian tối đa để tối ưu hóa",
  "summary.objective": "Mục tiêu tối ưu",
  "summary.operations": "Công đoạn",
  "summary.workers": "Công nhân",
  "summary.machines": "Máy",
  "summary.baselineRows": "Số dòng hiện trạng",
  "summary.dataHash": "Mã kiểm tra dữ liệu",
  "summary.note":
    "Đây là dữ liệu tổng hợp dùng làm đầu vào cho kết quả hiện tại. Tối ưu lại để tái lập cùng kịch bản.",
  "summary.objective.minBottleneck": "Tối thiểu hóa tải nút cổ chai",
  "summary.objective.minWorkers": "Tối thiểu hóa số công nhân",

  "policy.aria": "Chính sách dữ liệu và trạng thái",
  "policy.data.eyebrow": "Chính sách dữ liệu",
  "policy.data.title": "Chỉ dữ liệu tổng hợp",
  "policy.data.body":
    "Không dùng dữ liệu sản xuất HBI. Hiện trạng mẫu là dữ liệu đầu vào, không phải kết quả của bộ tối ưu hóa.",
  "policy.status.eyebrow": "Cam kết trạng thái",
  "policy.status.title": "Chỉ báo tối ưu khi đã chứng minh",
  "policy.status.body":
    "Chỉ báo phương án tối ưu khi cả hai bước đã được chứng minh. Nếu hết thời gian trước khi chứng minh xong, kết quả được ghi là phương án khả thi, chưa chứng minh tối ưu.",
  "policy.snapshot.eyebrow": "Bản lưu",
  "policy.snapshot.title": "Nội bộ + máy chủ tùy chọn",
  "policy.snapshot.body":
    "Bản lưu nội bộ nằm trong trình duyệt này. Tài khoản quản trị đã đăng nhập có thể lưu kịch bản tổng hợp lên không gian demo trên Neon; tài khoản chỉ đọc không thể ghi.",
  "footer.authorLabel": "Người làm",
  "footer.left":
    "LineBalance Pro · phần mềm minh họa kỹ thuật công nghiệp ngành may · không phải dữ liệu sản xuất HBI",
  "footer.right":
    "React · FastAPI · PuLP/HiGHS · {operations} công đoạn · {workers} công nhân sẵn có",
};

export function translate(
  language: Language,
  key: MessageKey,
  vars?: TranslationVars,
): string {
  const template = language === "vi" ? VI[key] : EN[key];
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) => {
    const value = vars[name];
    return value === undefined ? match : String(value);
  });
}

export type Translate = (key: MessageKey, vars?: TranslationVars) => string;

export interface LanguageContextValue {
  language: Language;
  locale: string;
  setLanguage: (language: Language) => void;
  t: Translate;
}

export const LanguageContext = createContext<LanguageContextValue | null>(null);

export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used inside LanguageProvider.");
  }
  return context;
}

const STATION_STATUS_KEYS: Record<StationStatus, MessageKey> = {
  bottleneck: "station.status.bottleneck",
  watch: "station.status.watch",
  normal: "station.status.normal",
  underutilized: "station.status.underutilized",
};

export function stationStatusLabel(status: StationStatus, t: Translate): string {
  return t(STATION_STATUS_KEYS[status]);
}

const SEVERITY_KEYS: Record<string, MessageKey> = {
  info: "severity.info",
  warning: "severity.warning",
  critical: "severity.critical",
};

export function severityLabel(severity: string, t: Translate): string {
  return t(SEVERITY_KEYS[severity] ?? "severity.info");
}

const LOSS_KEYS: Record<LossCategory, MessageKey> = {
  MACHINE: "loss.MACHINE",
  MATERIAL: "loss.MATERIAL",
  MANPOWER: "loss.MANPOWER",
  QUALITY: "loss.QUALITY",
  CHANGEOVER: "loss.CHANGEOVER",
  OTHER: "loss.OTHER",
};

export function lossCategoryLabel(category: string, t: Translate): string {
  if (category === "UNSPECIFIED") return t("loss.UNSPECIFIED");
  if (Object.prototype.hasOwnProperty.call(LOSS_KEYS, category)) {
    return t(LOSS_KEYS[category as LossCategory]);
  }
  return category;
}

const OPTIMIZATION_STATUS_KEYS: Record<string, MessageKey> = {
  OPTIMAL: "status.optimal",
  FEASIBLE_LIMIT: "status.feasibleLimit",
  INFEASIBLE: "status.infeasible",
  ERROR: "status.error",
};

export function optimizationStatusLabel(status: string, t: Translate): string {
  const key = OPTIMIZATION_STATUS_KEYS[status];
  return key ? t(key) : status;
}

export function dataPolicyLabel(policy: string, t: Translate): string {
  if (policy === "synthetic-demo-only" || policy === "synthetic_only") {
    return t("dataPolicy.syntheticDemo");
  }
  return policy;
}

export function displayLineName(name: string, t: Translate): string {
  if (name === "Line A — Basic Tee") return t("line.sample");
  if (name === "Line A — Basic Tee (feasible 400 plan)") {
    return t("line.sampleFeasible");
  }
  return name;
}

export function displayShiftName(name: string, t: Translate): string {
  const sampleShift = name.match(/^Ca\s+(\d+)$/i);
  return sampleShift ? t("shift.sample", { number: sampleShift[1] }) : name;
}

const SAMPLE_OPERATION_NAMES: Record<
  string,
  { en: string; vi: string; source?: string }
> = {
  OP010: { en: "Inspect trims and materials", vi: "Kiểm tra nguyên phụ liệu" },
  OP020: { en: "Fuse collar interfacing", vi: "Ép mex cổ" },
  OP030: { en: "Sew left shoulder", vi: "May vai trái" },
  OP040: { en: "Sew right shoulder", vi: "May vai phải" },
  OP050: { en: "Join shoulders", vi: "Nối vai" },
  OP060: { en: "Attach collar", vi: "May cổ" },
  OP070: { en: "Topstitch collar", vi: "Diễu cổ" },
  OP080: { en: "Set left sleeve", vi: "Tra tay trái" },
  OP090: { en: "Set right sleeve", vi: "Tra tay phải" },
  OP100: { en: "Sew left side seam", vi: "May sườn trái" },
  OP110: { en: "Sew right side seam", vi: "May sườn phải" },
  OP120: { en: "Topstitch side seams", vi: "Diễu sườn" },
  OP130: { en: "Sew bottom hem", vi: "May lai" },
  OP140: { en: "Topstitch bottom hem", vi: "Diễu lai" },
  OP150: { en: "Hem left sleeve", vi: "May gấu tay trái" },
  OP160: { en: "Hem right sleeve", vi: "May gấu tay phải" },
  OP170: { en: "Topstitch left sleeve hem", vi: "Diễu gấu tay trái" },
  OP180: { en: "Topstitch right sleeve hem", vi: "Diễu gấu tay phải" },
  OP190: { en: "Inspect garment body", vi: "Kiểm tra thân áo" },
  OP200: { en: "Trim threads", vi: "Cắt chỉ" },
  OP210: { en: "Press garment body", vi: "Ủi thân" },
  OP220: { en: "Press sleeves", vi: "Ủi tay" },
  OP230: { en: "Fold garment", vi: "Gấp áo" },
  OP240: { en: "Pack garment", vi: "Đóng gói" },
  OP250: { en: "Apply label", vi: "Dán nhãn" },
  OP260: { en: "Final inspection", vi: "Kiểm tra cuối" },
  OP270: { en: "Move to stock", vi: "Nhập kho" },
  OP280: { en: "Sew left pocket", vi: "May túi trái" },
  OP290: { en: "Sew right pocket", vi: "May túi phải" },
  OP300: { en: "Topstitch left pocket", vi: "Diễu túi trái" },
  OP310: { en: "Topstitch right pocket", vi: "Diễu túi phải" },
  OP320: { en: "Sew neck placket", vi: "May nẹp cổ" },
  OP330: { en: "Topstitch neck placket", vi: "Diễu nẹp cổ" },
  OP340: { en: "Attach hem ruffle", vi: "May bèo lai" },
  OP350: { en: "Inspect pockets", vi: "Kiểm tra túi" },
  OP360: { en: "Press pockets", vi: "Ủi túi" },
  OP370: { en: "Sew garment tag", vi: "May nhãn", source: "May tag" },
  OP380: { en: "Trim sleeve threads", vi: "Cắt chỉ tay" },
  OP390: { en: "Fold sleeves", vi: "Gấp tay áo" },
  OP400: { en: "Pack into carton", vi: "Đóng thùng" },
};

export function displayOperationName(
  operation: { id: string; name: string },
  language: Language,
): string {
  const sampleName = SAMPLE_OPERATION_NAMES[operation.id];
  if (
    !sampleName ||
    (operation.name !== sampleName.vi && operation.name !== sampleName.source)
  ) {
    return operation.name;
  }
  return sampleName[language];
}

const MACHINE_TYPE_KEYS: Record<string, MessageKey> = {
  OVERLOCK: "machine.OVERLOCK",
  COVERSTITCH: "machine.COVERSTITCH",
  IRON: "machine.IRON",
  SINGLE: "machine.SINGLE",
};

export function machineTypeLabel(machineType: string, t: Translate): string {
  const key = MACHINE_TYPE_KEYS[machineType.toUpperCase()];
  return key ? t(key) : machineType;
}

export function actualsNoteLabel(
  note: string,
  language: Language,
  t: Translate,
): string {
  if (language === "en") return note;

  const missingLabor = note.match(/missing for (\d+) day/i);
  if (missingLabor) {
    return t("actuals.note.missingLabor", { count: missingLabor[1] });
  }
  if (note.startsWith("Actual labor efficiency is not calculated")) {
    return t("actuals.note.noLabor");
  }
  if (note.startsWith("Downtime events and the summary downtime differ")) {
    return t("actuals.note.downtimeMismatch");
  }
  if (note.startsWith("Production achievement uses the reported target")) {
    return t("actuals.note.method");
  }
  return t("actuals.note.generic");
}

export function warningMessage(
  warning: WarningItem,
  request: SampleRequest,
  result: OptimizeResult,
  language: Language,
  t: Translate,
): string {
  const operation = request.operations.find((item) => item.id === warning.operation_id);
  const worker = request.workers.find((item) => item.id === warning.worker_id);
  const station = result.stations.find((item) => item.station === warning.station);
  const operationLabel = operation
    ? `${operation.id} · ${displayOperationName(operation, language)}`
    : (warning.operation_id ?? "—");
  const workerLabel = worker?.name ?? warning.worker_id ?? "—";
  const stationLabel =
    warning.station === null ? "—" : `ST${warning.station.toString().padStart(2, "0")}`;
  const utilization = station
    ? `${formatNumber(station.standard_utilization_pct, 1)}%`
    : "—";

  switch (warning.code) {
    case "allowance_ignored":
      return t("warning.allowanceIgnored");
    case "baseline_violations":
      return t("warning.baselineViolations", {
        count: result.baseline_comparison?.violations.length ?? 0,
      });
    case "capacity_target_not_met":
      return t("warning.capacityTargetNotMet");
    case "headcount_limit_binding":
      return t("warning.headcountLimitBinding", {
        used: result.kpis?.workers_used ?? result.stations.length,
        allowed:
          request.config.max_workers ??
          request.workers.filter((item) => item.available).length,
      });
    case "machine_capacity_shared":
      return t("warning.machineCapacityShared");
    case "max_workers_clamped": {
      const available = request.workers.filter((item) => item.available).length;
      return t("warning.maxWorkersClamped", {
        requested: request.config.max_workers ?? available,
        available,
      });
    }
    case "operation_over_effective_takt":
      return t("warning.operationOverEffectiveTakt", {
        operation: operationLabel,
      });
    case "operation_over_demand_takt":
      return t("warning.operationOverDemandTakt", {
        operation: operationLabel,
      });
    case "single_point_of_failure":
      return t("warning.singlePointOfFailure", {
        worker: workerLabel,
        operation: operationLabel,
      });
    case "station_over_effective_takt":
      return t("warning.stationOverEffectiveTakt", {
        station: stationLabel,
        worker: station?.worker_name ?? workerLabel,
        utilization,
      });
    case "station_near_effective_takt":
      return t("warning.stationNearEffectiveTakt", {
        station: stationLabel,
        worker: station?.worker_name ?? workerLabel,
        utilization,
      });
    case "station_underutilized":
      return t("warning.stationUnderutilized", {
        station: stationLabel,
        worker: station?.worker_name ?? workerLabel,
        utilization,
      });
    case "takt_unreachable_lower_bound":
      return t("warning.taktUnreachable");
    case "unused_workers":
      return t("warning.unusedWorkers");
    case "worker_no_qualified_operation":
      return t("warning.workerNoQualifiedOperation", { worker: workerLabel });
    default:
      return t("warning.generic");
  }
}

export function apiErrorMessage(
  message: string,
  language: Language,
  t: Translate,
): string {
  const normalized = message.toLowerCase();
  const networkError =
    /failed to fetch|network error|connection refused|offline|^http 5\d\d$/.test(
      normalized,
    );
  if (language === "en") {
    return networkError ? t("error.apiUnavailable") : message;
  }
  if (
    /[ăâđêôơưàáạảãằắặẳẵầấậẩẫèéẹẻẽềếệểễìíịỉĩòóọỏõồốộổỗờớợởỡùúụủũừứựửữỳýỵỷỹ]/i.test(
      message,
    )
  ) {
    return message;
  }
  if (/429|rate limit|too many requests/.test(normalized)) {
    return t("error.apiRateLimit");
  }
  if (/413|request body|too large/.test(normalized)) {
    return t("error.apiBodyLimit");
  }
  if (networkError) {
    return t("error.apiUnavailable");
  }
  if (/missing csv columns/.test(normalized)) {
    const columns = message.match(/missing csv columns:\s*(.+?)\.?$/i);
    return t("materials.import.errorColumns", {
      columns: columns?.[1] ?? "—",
    });
  }
  if (/data_policy must be synthetic/.test(normalized)) {
    return t("materials.import.errorPolicy");
  }
  if (/more than [\d,]+ data rows/.test(normalized)) {
    return t("materials.import.errorRows");
  }
  if (/csv is empty/.test(normalized)) {
    return t("materials.import.errorEmptyCsv");
  }
  if (/must be utf-8/.test(normalized)) {
    return t("materials.import.errorEncoding");
  }
  if (/no rows found for phase/.test(normalized)) {
    return t("materials.import.errorPhase");
  }
  if (/^row \d+:/.test(normalized)) {
    const row = message.match(/^row (\d+):/i);
    return t("materials.import.errorRow", { row: row?.[1] ?? "—" });
  }
  if (/efficiency_factor/.test(normalized)) {
    return t("scenarioImport.errorEfficiency");
  }
  if (/^\[[a-z_]+\]/.test(normalized)) {
    return t("scenarioImport.errorDetail", { detail: message });
  }
  if (/csv is missing columns:/.test(normalized)) {
    const columns = message.match(/csv is missing columns:\s*(.+?)\.?$/i);
    return t("scenarioImport.errorColumns", {
      columns: columns?.[1] ?? "—",
    });
  }
  if (/csv has no data rows/.test(normalized)) {
    return t("scenarioImport.errorNoRows");
  }
  if (/excel workbook is missing required sheets:/.test(normalized)) {
    const sheets = message.match(/missing required sheets:\s*(.+?)\.?$/i);
    return t("scenarioImport.errorWorkbookSheets", {
      sheets: sheets?.[1] ?? "—",
    });
  }
  if (/excel workbook expands beyond/.test(normalized)) {
    return t("scenarioImport.errorWorkbookSize");
  }
  if (
    /excel file is not a valid|excel file could not be read|excel workbook is empty/.test(
      normalized,
    )
  ) {
    return t("scenarioImport.errorWorkbookInvalid");
  }
  if (/422|validation|invalid input|must be greater|not valid/.test(normalized)) {
    return t("error.apiValidation");
  }
  return t("error.apiGeneric");
}
