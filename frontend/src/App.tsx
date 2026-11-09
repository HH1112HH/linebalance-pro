import { useEffect, useState } from "react";
import ActualsPanel from "./components/ActualsPanel";
import LoginPage from "./components/LoginPage";
import BalanceSection from "./components/BalanceSection";
import FormsPanel from "./components/FormsPanel";
import MetadataPanel from "./components/MetadataPanel";
import MaterialsPanel from "./components/MaterialsPanel";
import OverviewMetrics from "./components/OverviewMetrics";
import BottleneckPanel from "./components/BottleneckPanel";
import PageHeader from "./components/PageHeader";
import PlanningPanel from "./components/PlanningPanel";
import RunInputSummary from "./components/RunInputSummary";
import ScenarioImportPanel from "./components/ScenarioImportPanel";
import ServerSnapshotsPanel from "./components/ServerSnapshotsPanel";
import Sidebar from "./components/Sidebar";
import SnapshotsPanel from "./components/SnapshotsPanel";
import StyleSetupPanel from "./components/StyleSetupPanel";
import TaktPanel from "./components/TaktPanel";
import TargetHealthPanel from "./components/TargetHealthPanel";
import TimeStudyGuide from "./components/TimeStudyGuide";
import Topbar, { type ScenarioMeta } from "./components/Topbar";
import WorkloadPanel from "./components/WorkloadPanel";
import {
  exportWorkbook,
  getAuthSession,
  getHealth,
  login,
  logout,
  runOptimizer,
} from "./api";
import {
  apiErrorMessage,
  displayLineName,
  displayShiftName,
  optimizationStatusLabel,
  useLanguage,
} from "./i18n";
import {
  BASELINE_STATIONS,
  SAMPLE_REQUEST_A,
  SAMPLE_REQUEST_B,
  SAMPLE_RESULT_A,
  SAMPLE_RESULT_B,
} from "./data";
import type {
  ActualsAnalysis,
  AuthSession,
  HealthResponse,
  OptimizeResult,
  SampleRequest,
  ScenarioImportPreview,
  ScenarioKey,
  SectionKey,
  ServerScenarioDetail,
  Snapshot,
  ViewKey,
} from "./types";
import { clone, cx, downloadBlob, formatNumber } from "./utils";

const STORAGE_KEY = "linebalance.snapshots.v1";
const MAX_SNAPSHOTS = 8;

function isLoginPath(): boolean {
  return window.location.pathname.replace(/\/+$/, "") === "/login";
}

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
  const { language, t, locale } = useLanguage();
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
  const [activeServerName, setActiveServerName] = useState<string | null>(null);
  const [authSession, setAuthSession] = useState<AuthSession | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [loginPageOpen, setLoginPageOpen] = useState(isLoginPath);
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [sessionError, setSessionError] = useState(false);
  // Fail closed: never render workspace data until the session endpoint
  // confirms an authenticated user. If the check fails, authSession stays
  // null and the login page is shown instead of sample data.
  const requiresLogin = authChecked && !authSession?.authenticated;
  const loginVisible = loginPageOpen || requiresLogin;

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

  useEffect(() => {
    let cancelled = false;
    getAuthSession()
      .then((session) => {
        if (!cancelled) {
          setAuthSession(session);
          setSessionError(false);
          setAuthChecked(true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setAuthSession(null);
          setSessionError(true);
          setAuthChecked(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const syncPath = () => setLoginPageOpen(isLoginPath());
    window.addEventListener("popstate", syncPath);
    return () => window.removeEventListener("popstate", syncPath);
  }, []);

  useEffect(() => {
    if (!requiresLogin) return;
    if (!isLoginPath()) {
      window.history.replaceState({}, "", "/login");
    }
  }, [requiresLogin]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [loginVisible]);

  function openLoginPage() {
    setAuthError(null);
    setSessionError(false);
    setLoginPageOpen(true);
    if (!isLoginPath()) {
      window.history.pushState({}, "", "/login");
    }
  }

  function closeLoginPage() {
    if (requiresLogin) return;
    setLoginPageOpen(false);
    if (isLoginPath()) {
      window.history.replaceState({}, "", "/");
    }
  }

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
    setActiveServerName(null);
    setSolveError(null);
    setNotice(null);
  }

  async function handleLogin(username: string, password: string) {
    setAuthBusy(true);
    setAuthError(null);
    setSessionError(false);
    try {
      const session = await login(username, password);
      setAuthSession(session);
      setSessionError(false);
      setLoginPageOpen(false);
      if (isLoginPath()) {
        window.history.replaceState({}, "", "/");
      }
      setNotice(t("notice.login", { user: session.username ?? username }));
    } catch (caught) {
      setAuthError(
        apiErrorMessage(
          caught instanceof Error ? caught.message : String(caught),
          language,
          t,
        ),
      );
    } finally {
      setAuthBusy(false);
    }
  }

  async function handleLogout() {
    setAuthBusy(true);
    try {
      await logout();
      setAuthSession((previous) =>
        previous
          ? {
              ...previous,
              authenticated: false,
              username: null,
              role: null,
              expires_at: null,
            }
          : previous,
      );
      setNotice(t("notice.logout"));
    } catch (caught) {
      setSolveError(
        apiErrorMessage(
          caught instanceof Error ? caught.message : String(caught),
          language,
          t,
        ),
      );
    } finally {
      setAuthBusy(false);
    }
  }

  function handleSessionExpired() {
    setAuthSession((previous) =>
      previous
        ? {
            ...previous,
            authenticated: false,
            username: null,
            role: null,
            expires_at: null,
          }
        : previous,
    );
    setNotice(t("notice.sessionExpired"));
  }

  function handleServerLoad(detail: ServerScenarioDetail) {
    setRequest(clone(detail.request));
    setResult(clone(detail.result));
    setView("custom");
    setActiveSnapshot(null);
    setActiveServerName(detail.name);
    setSolveError(null);
    setNotice(t("notice.serverLoaded", { name: detail.name }));
  }

  async function handleRerun() {
    setSolving(true);
    setSolveError(null);
    setNotice(null);
    try {
      const next = await runOptimizer(request);
      setResult(next);
      setActiveSnapshot(null);
      setActiveServerName(null);
      if (next.has_solution) {
        setNotice(
          t("notice.rerun", {
            seconds: formatNumber(next.solve_time_sec, 1),
            status: optimizationStatusLabel(next.status, t),
          }),
        );
      } else {
        setNotice(
          t("notice.solverStatus", {
            status: optimizationStatusLabel(next.status, t),
          }),
        );
      }
    } catch (caught) {
      setSolveError(
        apiErrorMessage(
          caught instanceof Error ? caught.message : String(caught),
          language,
          t,
        ),
      );
    } finally {
      setSolving(false);
    }
  }

  function handleApply(next: SampleRequest, analysis: ActualsAnalysis) {
    setRequest(next);
    setResult((previous) => ({ ...previous, actuals_analysis: analysis }));
    setActiveSnapshot(null);
    setActiveServerName(null);
    setNotice(t("notice.applied"));
  }

  async function handleScenarioImport(preview: ScenarioImportPreview) {
    const sameIdentity =
      (!preview.style_code || preview.style_code === request.style_code) &&
      (!preview.line_name || preview.line_name === request.line_name);
    const next: SampleRequest = {
      ...request,
      line_name: preview.line_name ?? request.line_name,
      style_code: preview.style_code ?? request.style_code,
      operations: preview.operations,
      workers: preview.workers,
      machines: preview.machines,
      baseline_assignment: null,
      actuals: sameIdentity ? request.actuals : null,
      headcount_standard: sameIdentity ? request.headcount_standard : null,
      daily_actuals: sameIdentity ? request.daily_actuals : [],
    };

    setSolving(true);
    setSolveError(null);
    setNotice(null);
    try {
      const nextResult = await runOptimizer(next);
      setRequest(next);
      setResult(nextResult);
      setView("custom");
      setActiveSnapshot(null);
      setActiveServerName(null);
      setNotice(
        t("notice.importApplied", {
          operations: formatNumber(preview.counts.operations, 0),
          workers: formatNumber(preview.counts.workers, 0),
          machines: formatNumber(preview.counts.machines, 0),
          status: optimizationStatusLabel(nextResult.status, t),
        }),
      );
    } catch (caught) {
      setSolveError(
        apiErrorMessage(
          caught instanceof Error ? caught.message : String(caught),
          language,
          t,
        ),
      );
    } finally {
      setSolving(false);
    }
  }

  async function handleExport() {
    setExporting(true);
    setSolveError(null);
    try {
      const blob = await exportWorkbook({ request, result, language });
      downloadBlob(blob, `linebalance_${result.style_code || "plan"}_${language}.xlsx`);
      setNotice(t("notice.export"));
    } catch (caught) {
      setSolveError(
        apiErrorMessage(
          caught instanceof Error ? caught.message : String(caught),
          language,
          t,
        ),
      );
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
      savedAt: new Date().toLocaleString(locale, {
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
      setNotice(t("notice.snapshotSaved", { name }));
      return null;
    } catch {
      return t("error.snapshotSave");
    }
  }

  function handleLoadSnapshot(snapshot: Snapshot) {
    setRequest(clone(snapshot.request));
    setResult(clone(snapshot.result));
    setActiveSnapshot(snapshot);
    setActiveServerName(null);
    setView("custom");
    setSolveError(null);
    setNotice(t("notice.snapshotLoaded", { name: snapshot.name }));
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
      setSolveError(t("error.storage"));
    }
  }

  const samBasisLabel =
    result.sam_basis === "INCLUDES_ALLOWANCE"
      ? t("sam.includes")
      : t("sam.excludes", {
          pct: formatNumber(result.allowance_applied_pct * 100, 1),
        });
  const statusTone =
    result.status === "OPTIMAL"
      ? "status-optimal"
      : result.status === "FEASIBLE_LIMIT"
        ? "status-watch"
        : "status-bottleneck";
  const formKey = `${view}-${activeSnapshot?.id ?? "working"}`;

  const loginPage = (
    <LoginPage
      busy={authBusy}
      error={authError ?? (sessionError ? t("auth.sessionError") : null)}
      loginEnabled={authSession?.login_enabled ?? true}
      session={authSession}
      canLeave={!requiresLogin}
      onLogin={(username, password) => void handleLogin(username, password)}
      onLogout={() => void handleLogout()}
      onBack={closeLoginPage}
    />
  );

  if (!authChecked) {
    return (
      <div className="session-gate" role="status" aria-live="polite">
        <span className="login-brand-mark" aria-hidden="true">
          LB
        </span>
        <span>{t("auth.checking")}</span>
      </div>
    );
  }

  if (requiresLogin) {
    return loginPage;
  }

  return (
    <>
      <div className="app-shell" hidden={loginPageOpen}>
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
            snapshotName={activeSnapshot?.name ?? activeServerName}
            lineName={result.line_name}
            shiftName={displayShiftName(request.config.shift_name, t)}
            shiftId={result.shift_id}
            scenarios={SCENARIO_META}
            health={health}
            healthError={healthError}
            authSession={authSession}
            authBusy={authBusy}
            solving={solving}
            exporting={exporting}
            hasSolution={result.has_solution}
            onSelectScenario={selectScenario}
            onLogout={() => void handleLogout()}
            onRerun={handleRerun}
            onExport={handleExport}
          />

          <main className={`page page-${section}`}>
            {notice || solveError ? (
              <div className="content-alerts">
                {notice ? (
                  <div className="notice">
                    <span>{notice}</span>
                    <button
                      type="button"
                      className="alert-close"
                      aria-label={t("app.dismissNotice")}
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
                      aria-label={t("app.dismissError")}
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
                  eyebrow={t("app.shiftDashboard", {
                    shift: displayShiftName(request.config.shift_name, t),
                  })}
                  title={
                    <>
                      {displayLineName(result.line_name, t)}{" "}
                      <span className="h1-dot">·</span> {result.style_code}
                    </>
                  }
                  description={t("app.shiftSummary", {
                    shiftId: result.shift_id,
                    minutes: formatNumber(request.config.shift_minutes, 0),
                    break: formatNumber(request.config.break_minutes, 0),
                    days: request.config.working_days,
                    samBasis: samBasisLabel,
                  })}
                  actions={
                    <span className={cx("status-pill status-large", statusTone)}>
                      {optimizationStatusLabel(result.status, t)}
                    </span>
                  }
                />

                <OverviewMetrics result={result} />

                <div className="overview-grid">
                  <TaktPanel result={result} compact />
                  <TargetHealthPanel result={result} />
                </div>

                <div className="balance-analysis-grid overview-balance-grid">
                  <WorkloadPanel
                    result={result}
                    baselineStations={BASELINE_STATIONS}
                    compact
                    onViewAll={() => selectSection("balance")}
                  />
                  <BottleneckPanel result={result} compact />
                </div>
              </div>
            ) : null}

            {section === "balance" ? (
              <div className="section-stack">
                <PageHeader
                  eyebrow={t("page.balance.eyebrow")}
                  title={t("page.balance.title")}
                  description={t("page.balance.description")}
                />
                <BalanceSection result={result} baselineStations={BASELINE_STATIONS} />
              </div>
            ) : null}

            {section === "capacity" ? (
              <div className="section-stack">
                <PageHeader
                  eyebrow={t("page.capacity.eyebrow")}
                  title={t("page.capacity.title")}
                  description={t("page.capacity.description")}
                />
                <PlanningPanel result={result} />
              </div>
            ) : null}

            {section === "actuals" ? (
              <div className="section-stack">
                <PageHeader
                  eyebrow={t("page.actuals.eyebrow")}
                  title={t("page.actuals.title")}
                  description={t("page.actuals.description")}
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
                  eyebrow={t("page.timeStudy.eyebrow")}
                  title={t("page.timeStudy.title")}
                  description={t("page.timeStudy.description")}
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

            {section === "style-setup" ? (
              <div className="section-stack">
                <PageHeader
                  eyebrow={t("page.styleSetup.eyebrow")}
                  title={t("page.styleSetup.title")}
                  description={t("page.styleSetup.description")}
                />
                <StyleSetupPanel request={request} result={result} />
              </div>
            ) : null}

            {section === "materials" ? (
              <div className="section-stack">
                <PageHeader
                  eyebrow={t("page.materials.eyebrow")}
                  title={t("page.materials.title")}
                  description={t("page.materials.description")}
                />
                <MaterialsPanel />
              </div>
            ) : null}

            {section === "solver" ? (
              <div className="section-stack">
                <PageHeader
                  eyebrow={t("page.solver.eyebrow")}
                  title={t("page.solver.title")}
                  description={t("page.solver.description")}
                />
                <div className="solver-top-grid">
                  <MetadataPanel result={result} request={request} />
                  <RunInputSummary request={request} result={result} />
                </div>
                <SnapshotsPanel
                  snapshots={snapshots}
                  activeId={activeSnapshot?.id ?? null}
                  onSave={handleSaveSnapshot}
                  onLoad={handleLoadSnapshot}
                  onDelete={handleDeleteSnapshot}
                />
                <ServerSnapshotsPanel
                  key={authSession?.username ?? "anonymous"}
                  session={authSession}
                  request={request}
                  onOpenLogin={openLoginPage}
                  onLoad={handleServerLoad}
                  onNotice={(message) => setNotice(message)}
                  onSessionExpired={handleSessionExpired}
                />
                <ScenarioImportPanel
                  onApply={handleScenarioImport}
                  applying={solving}
                />
                <section className="policy-strip" aria-label={t("policy.aria")}>
                  <article>
                    <span className="eyebrow">{t("policy.data.eyebrow")}</span>
                    <strong>{t("policy.data.title")}</strong>
                    <p>{t("policy.data.body")}</p>
                  </article>
                  <article>
                    <span className="eyebrow">{t("policy.status.eyebrow")}</span>
                    <strong>{t("policy.status.title")}</strong>
                    <p>{t("policy.status.body")}</p>
                  </article>
                  <article>
                    <span className="eyebrow">{t("policy.snapshot.eyebrow")}</span>
                    <strong>{t("policy.snapshot.title")}</strong>
                    <p>{t("policy.snapshot.body")}</p>
                  </article>
                </section>
              </div>
            ) : null}
          </main>

          <footer className="site-footer">
            <div className="footer-credit">
              <span className="footer-author-label">{t("footer.authorLabel")}</span>
              <strong>Hồ Văn Thiên Hoàng</strong>
              <span className="footer-note">{t("footer.left")}</span>
            </div>
            <div className="footer-meta">
              <span>
                {t("footer.right", {
                  operations: request.operations.length,
                  workers: request.workers.length,
                })}
              </span>
            </div>
          </footer>
        </div>
      </div>

      {loginPageOpen ? loginPage : null}
    </>
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
