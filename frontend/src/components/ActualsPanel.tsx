import type { ActualsAnalysis } from "../types";
import { cx, formatNumber, formatPct } from "../utils";

interface Props {
  actuals: ActualsAnalysis | null;
}

export default function ActualsPanel({ actuals }: Props) {
  if (!actuals) {
    return (
      <section className="panel" aria-labelledby="actuals-title">
        <div className="panel-head">
          <div>
            <span className="eyebrow">Actuals</span>
            <h2 id="actuals-title">Production actuals</h2>
          </div>
        </div>
        <div className="empty-state">
          No actuals supplied. Log a production snapshot in the input panel to calculate
          achievement and labor efficiency.
        </div>
      </section>
    );
  }

  const categories = Object.entries(actuals.downtime_by_category).sort(
    (a, b) => b[1] - a[1],
  );
  const maxCategory = Math.max(1, ...categories.map(([, value]) => value));
  const periodLabel =
    actuals.period_days === 1 ? "1 shift" : `${actuals.period_days} days`;

  return (
    <section className="panel actuals-panel" aria-labelledby="actuals-title">
      <div className="panel-head">
        <div>
          <span className="eyebrow">Actuals</span>
          <h2 id="actuals-title">Production actuals</h2>
        </div>
        <span className="panel-chip chip-muted">{periodLabel}</span>
      </div>

      <div className="actuals-stats">
        <div>
          <span>Output</span>
          <strong>{formatNumber(actuals.actual_output, 0)}</strong>
          <small>target {formatNumber(actuals.target_output, 0)}</small>
        </div>
        <div>
          <span>Production achievement</span>
          <strong>{formatPct(actuals.production_achievement_pct, 2)}</strong>
          <small>actual / target</small>
        </div>
        <div>
          <span>Actual labor efficiency</span>
          <strong>
            {actuals.actual_labor_efficiency_pct === null
              ? "—"
              : formatPct(actuals.actual_labor_efficiency_pct, 2)}
          </strong>
          <small>planning SAM basis</small>
        </div>
        <div>
          <span>Downtime</span>
          <strong>{formatNumber(actuals.downtime_minutes, 0)} min</strong>
          <small>
            {formatPct(actuals.downtime_pct_of_planned_time, 2)} of planned time
          </small>
        </div>
      </div>

      <div className="subhead">
        <h3>Downtime by category</h3>
        <span className="tiny-note">Summary total vs event detail</span>
      </div>
      {categories.length === 0 ? (
        <p className="muted-text">No downtime events recorded.</p>
      ) : (
        <div className="downtime-bars">
          {categories.map(([category, value]) => (
            <div className="dt-row" key={category}>
              <span className="dt-label">{category}</span>
              <div className="dt-track">
                <div
                  className={cx("dt-bar", category === "UNSPECIFIED" && "dt-bar-muted")}
                  style={{ width: `${Math.max(2, (value / maxCategory) * 100)}%` }}
                />
              </div>
              <span className="dt-value">{formatNumber(value, 0)}m</span>
            </div>
          ))}
        </div>
      )}

      <ul className="note-list">
        {actuals.notes.slice(0, 3).map((note) => (
          <li key={note}>{note}</li>
        ))}
      </ul>
    </section>
  );
}
