import type { OptimizeResult } from "../types";
import { cx, formatNumber, formatPct } from "../utils";

interface Props {
  result: OptimizeResult;
  compact?: boolean;
}

export default function TaktPanel({ result, compact = false }: Props) {
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
    <section
      className={cx("panel takt-panel", compact && "is-compact")}
      aria-labelledby="takt-title"
    >
      <div className="panel-head">
        <div>
          <span className="eyebrow">Takt & cycle time</span>
          <h2 id="takt-title">
            {compact ? "Takt vs bottleneck" : "Two takts, one decision"}
          </h2>
        </div>
        <span className="panel-chip">Seconds / piece</span>
      </div>

      <div className="takt-track" aria-hidden="true">
        <div
          className="takt-fill"
          style={{
            width: `${bottleneckPct}%`,
            background: `linear-gradient(90deg, var(--emerald-bright) 0%, var(--emerald) ${effectivePct}%, var(--red) ${effectivePct}%, var(--red) 100%)`,
          }}
        />
        <div className="takt-marker" style={{ left: `${effectivePct}%` }}>
          <span>Effective {formatNumber(effective, 2)}s</span>
        </div>
        <div className="takt-marker marker-demand" style={{ left: `${demandPct}%` }}>
          <span>Demand {formatNumber(demand, 2)}s</span>
        </div>
      </div>

      <div className="takt-rail-note">
        <span className={over > 0 ? "takt-gap" : "takt-gap is-ok"}>
          {over > 0
            ? `Bottleneck ${formatNumber(over, 2)}s above effective takt`
            : `Bottleneck inside effective takt by ${formatNumber(Math.abs(over), 2)}s`}
        </span>
        <span>
          Bar length = bottleneck load on a 0–{formatNumber(scale, 1)}s scale.
        </span>
      </div>

      {compact ? (
        <div className="takt-facts">
          <div>
            <span>Demand takt</span>
            <strong>{formatNumber(demand, 2)}s</strong>
          </div>
          <div>
            <span>Effective takt</span>
            <strong>{formatNumber(effective, 2)}s</strong>
          </div>
          <div>
            <span>Takt gap</span>
            <strong className={over > 0 ? "value-bad" : "value-good"}>
              {over > 0 ? "+" : ""}
              {formatNumber(over, 2)}s
            </strong>
          </div>
        </div>
      ) : null}

      {compact ? (
        <p className="panel-footnote">
          Demand takt is the customer requirement; effective takt applies the{" "}
          {formatPct(kpis.planned_efficiency * 100, 0)} planned efficiency allowance
          before comparing with the bottleneck.
        </p>
      ) : null}

      {compact ? null : (
        <div className="takt-explain">
          <article>
            <span className="eyebrow">Demand takt</span>
            <strong>{formatNumber(demand, 2)}s</strong>
            <p>
              {formatNumber(kpis.available_seconds, 0)} available seconds ÷{" "}
              {kpis.target_qty} pcs. This is the customer requirement at 100% of
              scheduled time.
            </p>
          </article>
          <article>
            <span className="eyebrow">Effective takt</span>
            <strong>{formatNumber(effective, 2)}s</strong>
            <p>
              {formatNumber(kpis.available_seconds, 0)}s ×{" "}
              {formatPct(kpis.planned_efficiency * 100, 0)} planned efficiency ÷{" "}
              {kpis.target_qty} pcs. This is the planning cycle allowance, not the
              demand takt.
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
      )}
    </section>
  );
}
