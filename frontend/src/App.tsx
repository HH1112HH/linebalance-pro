import { useEffect, useState } from "react";
import ActualsPanel from "./components/ActualsPanel";
import BalanceSection from "./components/BalanceSection";
import FormsPanel from "./components/FormsPanel";
import MetadataPanel from "./components/MetadataPanel";
import OverviewMetrics from "./components/OverviewMetrics";
import PageHeader from "./components/PageHeader";
import PlanningPanel from "./components/PlanningPanel";
import Sidebar from "./components/Sidebar";
import SnapshotsPanel from "./components/SnapshotsPanel";
import TaktPanel from "./components/TaktPanel";
import TargetHealthPanel from "./components/TargetHealthPanel";
import TimeStudyGuide from "./components/TimeStudyGuide";
import Topbar, { type ScenarioMeta } from "./components/Topbar";
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
  SectionKey,
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
    workersUsed: SAMPLE_RESULT_A.kpis?.workers_used ?? 23,
    meetsTarget: SAMPLE_RESULT_A.kpis?.meets_target ?? false,
  },
  B: {
    code: "B",
    title: "Feasible",
    target: SAMPLE_RESULT_B.kpis?.target_qty ?? 400,
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
  const [section, setSection] = useState<SectionKey>("overview");
  const [view, setView] = useState<ViewKey>("A");
  const [request, setRequest] = useState<SampleRequest>(() => clone(SAMPLE_REQUEST_A));
  const [result, setResult] = useState<OptimizeResult>(() => clone(SAMPLE_RESULT_A));
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

  function selectSection(next: SectionKey) {
    setSection(next);
    window.scrollTo({ top: 0, behavior: "auto" });
  }

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
      downloadBlob(blob, `linebalance_${result.style_code || "plan"}.xlsx`);
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

  const samBasisLabel =
    result.sam_basis === "INCLUDES_ALLOWANCE"
      ? "SAM includes allowance"
      : `SAM excludes allowance (+${formatNumber(result.allowance_applied_pct * 100, 1)}%)`;
  const statusTone =
    result.status === "OPTIMAL"
      ? "status-optimal"
      : result.status === "FEASIBLE_LIMIT"
        ? "status-watch"
        : "status-bottleneck";
  const formKey = `${view}-${activeSnapshot?.id ?? "working"}`;

  return (
    <div className="app-shell">
      <Sidebar
        active={section}
        health={health}
        healthError={healthError}
        onSelect={selectSection}
      />

      <div className="workspace">
        <Topbar
          section={section}
          view={view}
          snapshotName={activeSnapshot?.name ?? null}
          scenarios={SCENARIO_META}
          health={health}
          healthError={healthError}
          solving={solving}
          exporting={exporting}
          hasSolution={result.has_solution}
          onSelectScenario={selectScenario}
          onRerun={handleRerun}
          onExport={handleExport}
        />

        <main className="page">
          {notice || solveError ? (
            <div className="content-alerts">
              {notice ? (
                <div className="notice">
                  <span>{notice}</span>
                  <button
                    type="button"
                    className="alert-close"
                    aria-label="Dismiss notice"
                    onClick={() => setNotice(null)}
                  >
                    ×
                  </button>
                </div>
              ) : null}
              {solveError ? (
                <div className="error-banner" role="alert">
                  <span>{solveError}</span>
                  <button
                    type="button"
                    className="alert-close"
                    aria-label="Dismiss error"
                    onClick={() => setSolveError(null)}
                  >
                    ×
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}

          {section === "overview" ? (
            <div className="section-stack">
              <PageHeader
                eyebrow={`Shift cockpit · ${request.config.shift_name}`}
                title={
                  <>
                    {result.line_name} <span className="h1-dot">·</span>{" "}
                    {result.style_code}
                  </>
                }
                description={`${result.shift_id} · ${formatNumber(
                  request.config.shift_minutes,
                  0,
                )} min shift − ${formatNumber(
                  request.config.break_minutes,
                  0,
                )} min break · ${request.config.working_days} working days · ${samBasisLabel}`}
                actions={
                  <span className={cx("status-pill status-large", statusTone)}>
                    {result.status}
                  </span>
                }
              />

              <OverviewMetrics result={result} />

              <div className="overview-grid">
                <TaktPanel result={result} compact />
                <TargetHealthPanel result={result} />
              </div>

              <WorkloadPanel
                result={result}
                baselineStations={BASELINE_STATIONS}
                compact
                onViewAll={() => selectSection("balance")}
              />
            </div>
          ) : null}

          {section === "balance" ? (
            <div className="section-stack">
              <PageHeader
                eyebrow="Balance engineering"
                title="Line balance"
                description="Station loads, worker assignment and the synthetic before/after delta. Bar length is planning SAM, not machine utilization."
              />
              <BalanceSection result={result} baselineStations={BASELINE_STATIONS} />
            </div>
          ) : null}

          {section === "capacity" ? (
            <div className="section-stack">
              <PageHeader
                eyebrow="Planning"
                title="Capacity & people"
                description="Bottleneck capacity, machine coverage and headcount control. Theoretical capacity ignores precedence, skills and balance."
              />
              <PlanningPanel result={result} />
            </div>
          ) : null}

          {section === "actuals" ? (
            <div className="section-stack">
              <PageHeader
                eyebrow="Shop floor"
                title="Actuals"
                description="Read one shift snapshot and log production or downtime. Inputs refresh the actuals analysis through the API; re-run only when method or SAM changes."
              />
              <div className="page-grid wide-left">
                <ActualsPanel actuals={result.actuals_analysis} />
                <FormsPanel
                  key={`actuals-${formKey}`}
                  mode="actuals"
                  request={request}
                  operations={request.operations}
                  currentAnalysis={result.actuals_analysis}
                  onApply={handleApply}
                />
              </div>
            </div>
          ) : null}

          {section === "time-study" ? (
            <div className="section-stack">
              <PageHeader
                eyebrow="Industrial engineering"
                title="Time study"
                description="Observed, normal and standard time for human work. This workflow produces a draft record only; approved SAM remains the planning input."
              />
              <div className="page-grid wide-left">
                <FormsPanel
                  key={`time-study-${formKey}`}
                  mode="time-study"
                  request={request}
                  operations={request.operations}
                  currentAnalysis={result.actuals_analysis}
                  onApply={handleApply}
                />
                <TimeStudyGuide />
              </div>
            </div>
          ) : null}

          {section === "solver" ? (
            <div className="section-stack">
              <PageHeader
                eyebrow="Run provenance"
                title="Solver & data"
                description="How this result was produced, what the status means and where local snapshots live."
              />
              <div className="page-grid">
                <MetadataPanel result={result} />
                <SnapshotsPanel
                  snapshots={snapshots}
                  activeId={activeSnapshot?.id ?? null}
                  onSave={handleSaveSnapshot}
                  onLoad={handleLoadSnapshot}
                  onDelete={handleDeleteSnapshot}
                />
              </div>
              <section className="policy-strip" aria-label="Data and status policy">
                <article>
                  <span className="eyebrow">Data policy</span>
                  <strong>Synthetic only</strong>
                  <p>
                    No HBI production data. The sample baseline is a current-state
                    input, not an optimizer output.
                  </p>
                </article>
                <article>
                  <span className="eyebrow">Status contract</span>
                  <strong>Proof before OPTIMAL</strong>
                  <p>
                    OPTIMAL is only claimed when the lexicographic proof is true.
                    Otherwise the run is labelled FEASIBLE_LIMIT.
                  </p>
                </article>
                <article>
                  <span className="eyebrow">Snapshots</span>
                  <strong>This browser only</strong>
                  <p>
                    There is no server-side scenario write API. Delete old snapshots to
                    free localStorage.
                  </p>
                </article>
              </section>
            </div>
          ) : null}
        </main>

        <footer className="site-footer">
          <span>
            LineBalance Pro · synthetic garment IE demo · not HBI production data
          </span>
          <span>React + FastAPI + PuLP/HiGHS · 40 operations · 24–26 workers</span>
        </footer>
      </div>
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
