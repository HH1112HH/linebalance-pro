import { displayLineName, displayShiftName, useLanguage } from "../i18n";
import { sectionLabel } from "../sections";
import type { HealthResponse, ScenarioKey, SectionKey, ViewKey } from "../types";
import { cx, formatSolverBackend } from "../utils";

export interface ScenarioMeta {
  code: ScenarioKey;
  title: string;
  target: number;
  workersUsed: number;
  meetsTarget: boolean;
}

interface Props {
  section: SectionKey;
  view: ViewKey;
  snapshotName: string | null;
  lineName: string;
  shiftName: string;
  shiftId: string;
  scenarios: Record<ScenarioKey, ScenarioMeta>;
  health: HealthResponse | null;
  healthError: boolean;
  solving: boolean;
  exporting: boolean;
  hasSolution: boolean;
  onSelectScenario: (key: ScenarioKey) => void;
  onRerun: () => void;
  onExport: () => void;
}

export default function Topbar({
  section,
  view,
  snapshotName,
  lineName,
  shiftName,
  shiftId,
  scenarios,
  health,
  healthError,
  solving,
  exporting,
  hasSolution,
  onSelectScenario,
  onRerun,
  onExport,
}: Props) {
  const { language, setLanguage, t } = useLanguage();
  const connected = Boolean(health?.solver_available) && !healthError;

  return (
    <header className="topbar">
      <div className="topbar-main">
        <div className="topbar-context">
          <span className="topbar-root">{t("topbar.workspace")}</span>
          <span className="topbar-sep">/</span>
          <strong>{sectionLabel(section, t)}</strong>
          {view === "custom" ? (
            <span className="topbar-snapshot">
              {snapshotName
                ? t("topbar.snapshot", { name: snapshotName })
                : t("topbar.workingCopy")}
            </span>
          ) : null}
        </div>

        <div className="topbar-actions">
          <div
            className="language-switch"
            role="group"
            aria-label={t("topbar.language")}
          >
            <button
              type="button"
              className={cx("language-button", language === "en" && "is-active")}
              aria-pressed={language === "en"}
              aria-label={t("topbar.english")}
              onClick={() => setLanguage("en")}
              title={t("topbar.english")}
            >
              EN
            </button>
            <button
              type="button"
              className={cx("language-button", language === "vi" && "is-active")}
              aria-pressed={language === "vi"}
              aria-label={t("topbar.vietnamese")}
              onClick={() => setLanguage("vi")}
              title={t("topbar.vietnamese")}
            >
              VI
            </button>
          </div>

          <span className={cx("api-chip", connected ? "is-ok" : "is-off")}>
            <i aria-hidden="true" />
            {connected
              ? t("topbar.apiReady", {
                  solver:
                    formatSolverBackend(health?.solver_backend) || t("topbar.ready"),
                })
              : healthError
                ? t("topbar.apiOffline")
                : t("topbar.apiChecking")}
          </span>

          <button
            type="button"
            className="secondary-button is-compact"
            onClick={onExport}
            disabled={exporting || !hasSolution}
            title={t("report.exportHelp")}
          >
            {exporting ? t("topbar.exporting") : t("topbar.export")}
          </button>
          <button
            type="button"
            className="primary-button is-compact"
            onClick={onRerun}
            disabled={solving}
          >
            {solving ? t("topbar.solving") : t("topbar.rerun")}
          </button>
        </div>
      </div>

      <div
        className="topbar-filter-row"
        role="group"
        aria-label={t("topbar.reportContext")}
      >
        <div className="filter-context-item" title={t("topbar.dateHistoryUnavailable")}>
          <span>{t("topbar.line")}</span>
          <strong>{displayLineName(lineName, t)}</strong>
          <small>{t("topbar.singleLine")}</small>
        </div>
        <div className="filter-context-item" title={`${shiftId} · ${shiftName}`}>
          <span>{t("topbar.shift")}</span>
          <strong>{displayShiftName(shiftName, t)}</strong>
          <small>{shiftId}</small>
        </div>
        <div
          className="filter-context-item filter-context-disabled"
          aria-disabled="true"
          title={t("topbar.dateHistoryUnavailable")}
        >
          <span>{t("topbar.period")}</span>
          <strong>{t("topbar.singleShift")}</strong>
        </div>

        <div
          className="scenario-switch"
          role="group"
          aria-label={t("topbar.scenarioGroup")}
        >
          {(Object.keys(scenarios) as ScenarioKey[]).map((key) => {
            const item = scenarios[key];
            const title = t(key === "A" ? "topbar.scenarioA" : "topbar.scenarioB");
            return (
              <button
                key={key}
                type="button"
                className={cx("switch-button", view === key && "is-active")}
                aria-pressed={view === key}
                onClick={() => onSelectScenario(key)}
                title={t("topbar.scenarioTitle", {
                  title,
                  target: item.target,
                  workers: item.workersUsed,
                })}
              >
                <span className="switch-code">{item.code}</span>
                <span className="switch-copy">
                  <strong>{title}</strong>
                  <small>
                    {item.target} {t("unit.pieces")}
                  </small>
                </span>
              </button>
            );
          })}
          {view === "custom" ? (
            <span className="custom-chip">{t("topbar.custom")}</span>
          ) : null}
        </div>
      </div>
    </header>
  );
}
