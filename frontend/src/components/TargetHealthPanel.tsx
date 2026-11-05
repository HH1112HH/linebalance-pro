import type { OptimizeResult } from "../types";
import { formatNumber, formatPct, formatSigned } from "../utils";

interface Props {
  result: OptimizeResult;
}

export default function TargetHealthPanel({ result }: Props) {
  const kpis = result.kpis;
  if (!kpis) {
    return (
      <section className="panel target-panel" aria-labelledby="target-title">
        <div className="panel-head">
          <div>
            <span className="eyebrow">Target health</span>
            <h2 id="target-title">Can the line hit the target?</h2>
          </div>
        </div>
        <div className="empty-state">No KPI output for this run.</div>
      </section>
    );
  }

  const before = result.baseline_comparison?.before;
  const pct = Math.min(100, Math.max(0, kpis.target_achievement_pct));
  const gap = kpis.target_qty - kpis.capacity_per_shift;
  const delta = before ? kpis.capacity_per_shift - before.capacity_per_shift : null;
  const donutColor = kpis.meets_target ? "var(--emerald-bright)" : "var(--red)";
  const formula = `Capacity = ${formatNumber(
    kpis.available_seconds,
    0,
  )}s × ${formatPct(kpis.planned_efficiency * 100, 0)} ÷ ${formatNumber(
    kpis.bottleneck_load_sec,
    1,
  )}s = ${formatNumber(kpis.capacity_per_shift, 1)} pcs`;

  return (
    <section className="panel target-panel" aria-labelledby="target-title">
      <div className="panel-head">
        <div>
          <span className="eyebrow">Target health</span>
          <h2 id="target-title">Can the line hit the target?</h2>
        </div>
        <span className={kpis.meets_target ? "panel-chip" : "panel-chip chip-alert"}>
          {kpis.meets_target ? "Target met" : "Gap remains"}
        </span>
      </div>

      <div className="target-body">
        <div
          className="target-donut"
          role="img"
          aria-label={`${formatPct(kpis.target_achievement_pct, 2)} of target`}
          style={{
            background: `conic-gradient(${donutColor} 0 ${pct}%, var(--surface-muted) ${pct}% 100%)`,
          }}
        >
          <div className="target-donut-inner">
            <strong>{formatPct(kpis.target_achievement_pct, 1)}</strong>
            <span>of target</span>
          </div>
        </div>

        <div className="target-facts">
          <div>
            <span>Target</span>
            <strong>{formatNumber(kpis.target_qty, 0)}</strong>
            <small>pcs / shift</small>
          </div>
          <div>
            <span>Capacity</span>
            <strong>{formatNumber(kpis.capacity_per_shift, 1)}</strong>
            <small>bottleneck-constrained</small>
          </div>
          <div>
            <span>{gap > 0 ? "Short" : "Surplus"}</span>
            <strong className={gap > 0 ? "value-bad" : "value-good"}>
              {formatNumber(Math.abs(gap), 1)}
            </strong>
            <small>pcs / shift</small>
          </div>
        </div>
      </div>

      <div className="target-formula">
        <code>{formula}</code>
        {delta === null ? null : (
          <span className="target-delta">
            {formatSigned(delta, 1, " pcs")} vs synthetic baseline
          </span>
        )}
      </div>

      <p className="panel-footnote">
        Capacity uses the bottleneck station, not theoretical HC × SAM. The target is
        not claimed when the line cannot support the demand takt.
      </p>
    </section>
  );
}
