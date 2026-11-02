import type { OptimizeResult } from "../types";
import { cx, formatNumber, formatPct, formatSigned } from "../utils";

interface Props {
  result: OptimizeResult;
}

export default function KpiGrid({ result }: Props) {
  const kpis = result.kpis;
  const before = result.baseline_comparison?.before;
  if (!kpis) {
    return (
      <section className="kpi-grid" aria-label="Key performance indicators">
        <div className="empty-state">
          No KPI output. The solver did not return a feasible line.
        </div>
      </section>
    );
  }

  const overTakt = kpis.bottleneck_load_sec - kpis.effective_takt_time_sec;
  const workerDelta = before ? kpis.workers_used - before.workers_used : null;
  const lbeDelta = before
    ? kpis.balance_efficiency_pct - before.balance_efficiency_pct
    : null;
  const capacityDelta = before
    ? kpis.capacity_per_shift - before.capacity_per_shift
    : null;
  const targetGap = kpis.target_qty - kpis.capacity_per_shift;

  const cards = [
    {
      label: "Bottleneck",
      value: `${formatNumber(kpis.bottleneck_load_sec, 1)}s`,
      sub:
        overTakt > 0
          ? `${formatNumber(overTakt, 2)}s above effective takt`
          : `${formatNumber(Math.abs(overTakt), 2)}s below effective takt`,
      foot: `Station ${kpis.bottleneck_station} · max load`,
      tone: overTakt > 0 ? "warn" : "good",
    },
    {
      label: "Line balance efficiency",
      value: formatPct(kpis.balance_efficiency_pct, 2),
      sub:
        lbeDelta === null
          ? "No baseline"
          : `${formatSigned(lbeDelta, 2, " pp")} vs baseline`,
      foot: "Planning SAM / (workers × bottleneck)",
      tone: "good",
    },
    {
      label: "Workers on line",
      value: `${kpis.workers_used}`,
      sub:
        workerDelta === null
          ? "No baseline"
          : `${formatSigned(workerDelta, 0)} vs baseline ${before?.workers_used}`,
      foot: "One worker per station",
      tone: workerDelta !== null && workerDelta < 0 ? "good" : "neutral",
    },
    {
      label: "Capacity / shift",
      value: formatNumber(kpis.capacity_per_shift, 1),
      sub:
        capacityDelta === null
          ? "pcs / shift"
          : `${formatSigned(capacityDelta, 1)} pcs vs baseline`,
      foot: `Bottleneck-constrained · target ${kpis.target_qty}`,
      tone: "neutral",
    },
    {
      label: "Target achievement",
      value: formatPct(kpis.target_achievement_pct, 2),
      sub:
        targetGap > 0
          ? `${formatNumber(targetGap, 1)} pcs short per shift`
          : `${formatNumber(Math.abs(targetGap), 1)} pcs above target`,
      foot: kpis.meets_target ? "Target met" : "Target not met",
      tone: kpis.meets_target ? "good" : "bad",
    },
    {
      label: "Output / operator",
      value: formatNumber(kpis.output_per_operator, 2),
      sub: "pcs / operator / shift",
      foot: `${formatNumber(kpis.planned_labor_utilization_pct, 1)}% planned labor utilization`,
      tone: "neutral",
    },
  ];

  return (
    <section className="kpi-grid" aria-label="Key performance indicators">
      {cards.map((card) => (
        <article key={card.label} className={cx("kpi-card", `tone-${card.tone}`)}>
          <span className="kpi-label">{card.label}</span>
          <strong className="kpi-value">{card.value}</strong>
          <span className="kpi-sub">{card.sub}</span>
          <span className="kpi-foot">{card.foot}</span>
        </article>
      ))}
    </section>
  );
}
