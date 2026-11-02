import { useEffect, useState } from "react";
import ActualsPanel from "./components/ActualsPanel";
import BaselinePanel from "./components/BaselinePanel";
import FormsPanel from "./components/FormsPanel";
import Header from "./components/Header";
import KpiGrid from "./components/KpiGrid";
import MetadataPanel from "./components/MetadataPanel";
import PlanningPanel from "./components/PlanningPanel";
import ScenarioBar, { type ScenarioMeta } from "./components/ScenarioBar";
import SnapshotsPanel from "./components/SnapshotsPanel";
import StationTable from "./components/StationTable";
import TaktPanel from "./components/TaktPanel";
import WorkloadPanel from "./components/WorkloadPanel";
import { exportWorkbook, getHealth, runOptimizer } from "./api";
import {
  BASELINE_STATIONS,
  SAMPLE_REQUEST_A,
  SAMPLE_REQUEST_B,
  SAMPLE_RESULT_A,
  SAMPLE_RESULT_B,
} from "./data";
import type {
  ActualsAnalysis,
  HealthResponse,
  OptimizeResult,
  SampleRequest,
  ScenarioKey,
  Snapshot,
  ViewKey,
} from "./types";
import { clone, cx, downloadBlob, formatNumber } from "./utils";

const STORAGE_KEY = "linebalance.snapshots.v1";
const MAX_SNAPSHOTS = 8;

const SCENARIO_META: Record<ScenarioKey, ScenarioMeta> = {
  A: {
    code: "A",
    title: "Stretch",
    target: SAMPLE_RESULT_A.kpis?.target_qty ?? 420,
    availableWorkers: SAMPLE_REQUEST_A.config.max_workers ?? 24,
    bottleneck: SAMPLE_RESULT_A.kpis?.bottleneck_load_sec ?? 58,
    workersUsed: SAMPLE_RESULT_A.kpis?.workers_used ?? 23,
    meetsTarget: SAMPLE_RESULT_A.kpis?.meets_target ?? false,
  },
  B: {
    code: "B",
    title: "Feasible",
    target: SAMPLE_RESULT_B.kpis?.target_qty ?? 400,
    availableWorkers: SAMPLE_REQUEST_B.config.max_workers ?? 26,
    bottleneck: SAMPLE_RESULT_B.kpis?.bottleneck_load_sec ?? 56,
    workersUsed: SAMPLE_RESULT_B.kpis?.workers_used ?? 25,
    meetsTarget: SAMPLE_RESULT_B.kpis?.meets_target ?? true,
  },
};

const SCENARIO_DATA: Record<
  ScenarioKey,
  { request: SampleRequest; result: OptimizeResult }
> = {
  A: { request: SAMPLE_REQUEST_A, result: SAMPLE_RESULT_A },
  B: { request: SAMPLE_REQUEST_B, result: SAMPLE_RESULT_B },
};

export default function App() {
  const [view, setView] = useState<ViewKey>("A");
  const [request, setRequest] = useState<SampleRequest>(() =>
    clone(SAMPLE_REQUEST_A),
  );
  const [result, setResult] = useState<OptimizeResult>(() =>
    clone(SAMPLE_RESULT_A),
  );
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [healthError, setHealthError] = useState(false);
  const [solving, setSolving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [solveError, setSolveError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [snapshots, setSnapshots] = useState<Snapshot[]>(() => loadSnapshots());
  const [activeSnapshot, setActiveSnapshot] = useState<Snapshot | null>(null);

  useEffect(() => {
    let cancelled = false;
    getHealth()
      .then((payload) => {
        if (!cancelled) setHealth(payload);
      })
      .catch(() => {
        if (!cancelled) setHealthError(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function selectScenario(key: ScenarioKey) {
    const data = SCENARIO_DATA[key];
    setView(key);
    setRequest(clone(data.request));
    setResult(clone(data.result));
    setActiveSnapshot(null);
    setSolveError(null);
    setNotice(null);
  }

  async function handleRerun() {
    setSolving(true);
    setSolveError(null);
    setNotice(null);
    try {
      const next = await runOptimizer(request);
      setResult(next);
      setActiveSnapshot(null);
      if (next.has_solution) {
        setNotice(
          `Re-ran the optimizer in ${formatNumber(next.solve_time_sec, 1)}s · ${next.status}.`,
        );
      } else {
        setNotice(`Solver returned ${next.status}. Review diagnostics and inputs.`);
      }
    } catch (caught) {
      setSolveError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setSolving(false);
    }
  }

  function handleApply(next: SampleRequest, analysis: ActualsAnalysis) {
    setRequest(next);
    setResult((previous) => ({ ...previous, actuals_analysis: analysis }));
    setActiveSnapshot(null);
    setNotice(
      "Shop-floor input applied to the dashboard. Re-run the optimizer only if method, SAM or constraints changed.",
    );
  }

  async function handleExport() {
    setExporting(true);
    setSolveError(null);
    try {
      const blob = await exportWorkbook({ request, result });
      downloadBlob(
        blob,
        `linebalance_${result.style_code || "plan"}.xlsx`,
      );
      setNotice("XLSX export generated from the current request and result.");
    } catch (caught) {
      setSolveError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setExporting(false);
    }
  }

  function handleSaveSnapshot(name: string): string | null {
    const snapshot: Snapshot = {
      id:
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : String(Date.now()),
      name,
      savedAt: new Date().toLocaleString("en-GB", {
        dateStyle: "medium",
        timeStyle: "short",
      }),
      scenario: view === "custom" ? (activeSnapshot?.scenario ?? "A") : view,
      request: clone(request),
      result: clone(result),
    };
    const next = [snapshot, ...snapshots].slice(0, MAX_SNAPSHOTS);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setSnapshots(next);
      setNotice(`Snapshot "${name}" saved in this browser.`);
      return null;
    } catch {
      return "Could not save: localStorage may be full. Delete an old snapshot first.";
    }
  }

  function handleLoadSnapshot(snapshot: Snapshot) {
    setRequest(clone(snapshot.request));
    setResult(clone(snapshot.result));
    setActiveSnapshot(snapshot);
    setView("custom");
    setSolveError(null);
    setNotice(`Loaded snapshot "${snapshot.name}".`);
  }

  function handleDeleteSnapshot(id: string) {
    const next = snapshots.filter((item) => item.id !== id);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setSnapshots(next);
      if (activeSnapshot?.id === id) {
        setActiveSnapshot(null);
        setView("custom");
      }
    } catch {
      setSolveError("Could not update localStorage.");
    }
  }

  const kpis = result.kpis;
  const samBasisLabel =
    result.sam_basis === "INCLUDES_ALLOWANCE"
      ? "SAM includes allowance"
      : `SAM excludes allowance (+${formatNumber(result.allowance_applied_pct * 100, 1)}%)`;

  return (
    <div id="top" className="app">
      <Header health={health} healthError={healthError} />

      <main className="page">
        <ScenarioBar
          active={view}
          snapshotName={activeSnapshot?.name ?? null}
          scenarios={SCENARIO_META}
          onSelect={selectScenario}
        />

        <section id="dashboard" className="summary-band">
          <div className="summary-copy">
            <span className="eyebrow">Line overview</span>
            <h1>
              {result.line_name} <span className="h1-dot">·</span>{" "}
              {result.style_code}
            </h1>
            <p>
              {result.shift_id} · {formatNumber(request.config.shift_minutes, 0)}{" "}
              min shift − {formatNumber(request.config.break_minutes, 0)} min
              break · {request.config.working_days} working days · {samBasisLabel}
            </p>
          </div>
          <div className="summary-actions">
            <span
              className={cx(
                "status-pill status-large",
                result.status === "OPTIMAL"
                  ? "status-optimal"
                  : result.status === "FEASIBLE_LIMIT"
                    ? "status-watch"
                    : "status-bottleneck",
              )}
            >
              {result.status}
            </span>
            <button
              type="button"
              className="primary-button"
              onClick={handleRerun}
              disabled={solving}
            >
              {solving ? "Solving with HiGHS…" : "Re-run optimizer"}
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={handleExport}
              disabled={exporting || !result.has_solution}
            >
              {exporting ? "Building XLSX…" : "Export XLSX"}
            </button>
          </div>
        </section>

        {notice ? <div className="notice">{notice}</div> : null}
        {solveError ? (
          <div className="error-banner" role="alert">
            {solveError}
          </div>
        ) : null}

        <KpiGrid result={result} />

        <div id="takt">
          <TaktPanel result={result} />
        </div>

        <div className="grid-two wide-left">
          <WorkloadPanel result={result} baselineStations={BASELINE_STATIONS} />
          <BaselinePanel result={result} />
        </div>

        <div className="grid-two">
          <PlanningPanel result={result} />
          <ActualsPanel actuals={result.actuals_analysis} />
        </div>

        <div id="forms">
          <FormsPanel
            key={`${view}-${activeSnapshot?.id ?? "working"}`}
            request={request}
            operations={request.operations}
            currentAnalysis={result.actuals_analysis}
            onApply={handleApply}
          />
        </div>

        <div className="grid-two">
          <StationTable result={result} />
          <div id="run">
            <MetadataPanel result={result} />
          </div>
        </div>

        <SnapshotsPanel
          snapshots={snapshots}
          activeId={activeSnapshot?.id ?? null}
          onSave={handleSaveSnapshot}
          onLoad={handleLoadSnapshot}
          onDelete={handleDeleteSnapshot}
        />

        <section className="closing-note">
          <div>
            <span className="eyebrow">What this demo proves</span>
            <h2>Balance the line. Then prove the constraint.</h2>
          </div>
          <p>
            The optimizer uses a two-stage lexicographic MILP: minimize workers,
            then minimize the bottleneck. A result is labelled{" "}
            <strong>OPTIMAL</strong> only when both stages are proven. Capacity
            uses the bottleneck, not theoretical HC × SAM. Target 420 is not
            claimed when the bottleneck cannot support it.
          </p>
          <p className="closing-meta">
            {kpis
              ? `${kpis.workers_used} workers · ${formatNumber(kpis.bottleneck_load_sec, 1)}s bottleneck · ${formatNumber(kpis.capacity_per_shift, 1)} pcs/shift · ${formatNumber(kpis.target_achievement_pct, 2)}% of target`
              : "No feasible KPI result."}
          </p>
        </section>
      </main>

      <footer className="site-footer">
        <span>
          LineBalance Pro · synthetic garment IE demo · not HBI production data
        </span>
        <span>
          Architecture A · React + FastAPI + PuLP/HiGHS · 40 operations · 24–26
          workers
        </span>
      </footer>
    </div>
  );
}

function loadSnapshots(): Snapshot[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (item): item is Snapshot =>
          Boolean(item) &&
          typeof item === "object" &&
          "id" in item &&
          "name" in item &&
          "request" in item &&
          "result" in item,
      )
      .slice(0, MAX_SNAPSHOTS);
  } catch {
    return [];
  }
}
