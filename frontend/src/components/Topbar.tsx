import { sectionLabel } from "../sections";
import type { HealthResponse, ScenarioKey, SectionKey, ViewKey } from "../types";
import { cx } from "../utils";

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
  const connected = Boolean(health?.solver_available) && !healthError;

  return (
    <header className="topbar">
      <div className="topbar-context">
        <span className="topbar-root">Workspace</span>
        <span className="topbar-sep">/</span>
        <strong>{sectionLabel(section)}</strong>
        {view === "custom" ? (
          <span className="topbar-snapshot">
            {snapshotName ? `Snapshot · ${snapshotName}` : "Working copy"}
          </span>
        ) : null}
      </div>

      <div className="topbar-controls">
        <div className="scenario-switch" role="group" aria-label="Planning scenario">
          {(Object.keys(scenarios) as ScenarioKey[]).map((key) => {
            const item = scenarios[key];
            return (
              <button
                key={key}
                type="button"
                className={cx("switch-button", view === key && "is-active")}
                aria-pressed={view === key}
                onClick={() => onSelectScenario(key)}
                title={`${item.title} · target ${item.target} pcs · ${item.workersUsed} workers`}
              >
                <span className="switch-code">{item.code}</span>
                <span className="switch-copy">
                  <strong>{item.title}</strong>
                  <small>{item.target} pcs</small>
                </span>
              </button>
            );
          })}
          {view === "custom" ? <span className="custom-chip">Custom</span> : null}
        </div>

        <span className={cx("api-chip", connected ? "is-ok" : "is-off")}>
          <i aria-hidden="true" />
          {connected
            ? `API · ${health?.solver_backend?.toUpperCase() ?? "READY"}`
            : healthError
              ? "API offline"
              : "API check…"}
        </span>

        <div className="topbar-actions">
          <button
            type="button"
            className="secondary-button is-compact"
            onClick={onExport}
            disabled={exporting || !hasSolution}
          >
            {exporting ? "Building…" : "Export XLSX"}
          </button>
          <button
            type="button"
            className="primary-button is-compact"
            onClick={onRerun}
            disabled={solving}
          >
            {solving ? "Solving…" : "Re-run"}
          </button>
        </div>
      </div>
    </header>
  );
}
