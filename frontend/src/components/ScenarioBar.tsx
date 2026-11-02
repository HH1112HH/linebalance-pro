import type { ScenarioKey, ViewKey } from "../types";
import { cx } from "../utils";

export interface ScenarioMeta {
  code: ScenarioKey;
  title: string;
  target: number;
  availableWorkers: number;
  bottleneck: number;
  workersUsed: number;
  meetsTarget: boolean;
}

interface Props {
  active: ViewKey;
  snapshotName: string | null;
  scenarios: Record<ScenarioKey, ScenarioMeta>;
  onSelect: (key: ScenarioKey) => void;
}

export default function ScenarioBar({
  active,
  snapshotName,
  scenarios,
  onSelect,
}: Props) {
  return (
    <section className="scenario-bar" aria-label="Scenario selector">
      <div className="scenario-intro">
        <span className="eyebrow">Planning scenario</span>
        <p>
          Same 40-operation routing, SAM, machines and synthetic baseline. Only HC
          availability and target change.
        </p>
      </div>

      <div className="scenario-options">
        {(Object.keys(scenarios) as ScenarioKey[]).map((key) => {
          const item = scenarios[key];
          return (
            <button
              key={key}
              type="button"
              className={cx("scenario-card", active === key && "is-active")}
              onClick={() => onSelect(key)}
              aria-pressed={active === key}
            >
              <span className="scenario-code">{item.code}</span>
              <span className="scenario-copy">
                <span className="scenario-title">
                  {item.title} <em>{item.target}</em>
                </span>
                <span className="scenario-meta">
                  {item.availableWorkers} workers available · target {item.target}
                </span>
              </span>
              <span className="scenario-result">
                <strong>{item.bottleneck.toFixed(1)}s</strong>
                <span>{item.workersUsed} workers</span>
              </span>
              <span
                className={cx(
                  "scenario-flag",
                  item.meetsTarget ? "flag-good" : "flag-warn",
                )}
              >
                {item.meetsTarget ? "Target met" : "Target not met"}
              </span>
            </button>
          );
        })}
      </div>

      {active === "custom" ? (
        <div className="scenario-custom">
          <span className="dot" />{" "}
          {snapshotName ? (
            <>
              Viewing saved snapshot <strong>{snapshotName}</strong>
            </>
          ) : (
            "Working copy — not linked to a saved snapshot"
          )}
        </div>
      ) : null}
    </section>
  );
}
