import type { OptimizeResult } from "../types";
import { formatNumber, formatPct } from "../utils";

interface Props {
  result: OptimizeResult;
}

export default function TaktPanel({ result }: Props) {
  const kpis = result.kpis;
  if (!kpis) return null;

  const demand = kpis.takt_time_sec;
  const effective = kpis.effective_takt_time_sec;
  const bottleneck = kpis.bottleneck_load_sec;
  const scale = Math.max(demand, bottleneck) * 1.08;
  const effectivePct = (effective / scale) * 100;
  const demandPct = (demand / scale) * 100;
  const bottleneckPct = (bottleneck / scale) * 100;
  const over = bottleneck - effective;

  return (
    <section className="panel takt-panel" aria-labelledby="takt-title">
      <div className="panel-head">
        <div>
          <span className="eyebrow">Takt & cycle time</span>
          <h2 id="takt-title">Two takts, one decision</h2>
        </div>
        <span className="panel-chip">Time basis: seconds / piece</span>
      </div>

      <div className="takt-track" aria-hidden="true">
        <div
          className="takt-fill"
          style={{
            width: `${bottleneckPct}%`,
            background: `linear-gradient(90deg, var(--teal) 0%, var(--teal) ${effectivePct}%, var(--red) ${effectivePct}%, var(--red) 100%)`,
          }}
        />
        <div className="takt-marker" style={{ left: `${effectivePct}%` }}>
          <span>Effective {formatNumber(effective, 2)}s</span>
        </div>
        <div className="takt-marker marker-demand" style={{ left: `${demandPct}%` }}>
          <span>Demand {formatNumber(demand, 2)}s</span>
        </div>
      </div>

      <div className="takt-explain">
        <article>
          <span className="eyebrow">Demand takt</span>
          <strong>{formatNumber(demand, 2)}s</strong>
          <p>
            27,000 available seconds ÷ {kpis.target_qty} pcs. This is the customer
            requirement at 100% of scheduled time.
          </p>
        </article>
        <article>
          <span className="eyebrow">Effective takt</span>
          <strong>{formatNumber(effective, 2)}s</strong>
          <p>
            27,000s × {formatPct(kpis.planned_efficiency * 100, 0)} planned efficiency ÷{" "}
            {kpis.target_qty} pcs. This is the planning cycle allowance, not the demand
            takt.
          </p>
        </article>
        <article className="takt-decision">
          <span className="eyebrow">Bottleneck</span>
          <strong>{formatNumber(bottleneck, 2)}s</strong>
          <p>
            {over > 0
              ? `The line is ${formatNumber(over, 2)}s above the effective takt. Capacity is capped at ${formatPct(kpis.target_achievement_pct, 2)} of target.`
              : "The bottleneck is inside the effective takt. The line can meet the target at the planned efficiency."}
          </p>
        </article>
      </div>
    </section>
  );
}
