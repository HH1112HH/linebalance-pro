import type { OptimizeResult } from "../types";
import { cx, formatNumber, formatPct, formatSigned } from "../utils";

interface Props {
  result: OptimizeResult;
}

type MetricIconName = "bottleneck" | "balance" | "workers" | "capacity";

export default function OverviewMetrics({ result }: Props) {
  const kpis = result.kpis;
  const before = result.baseline_comparison?.before;

  if (!kpis) {
    return (
      <div className="empty-state">
        No KPI output. The solver did not return a feasible line.
      </div>
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

  const cards: Array<{
    label: string;
    value: string;
    note: string;
    foot: string;
    tone: "good" | "warn" | "bad" | "neutral";
    icon: MetricIconName;
  }> = [
    {
      label: "Bottleneck",
      value: `${formatNumber(kpis.bottleneck_load_sec, 1)}s`,
      note:
        overTakt > 0
          ? `${formatNumber(overTakt, 2)}s above effective takt`
          : `${formatNumber(Math.abs(overTakt), 2)}s inside effective takt`,
      foot: `Station ${kpis.bottleneck_station} sets the pace`,
      tone: overTakt > 0 ? "warn" : "good",
      icon: "bottleneck",
    },
    {
      label: "Line balance efficiency",
      value: formatPct(kpis.balance_efficiency_pct, 2),
      note:
        lbeDelta === null
          ? "No synthetic baseline"
          : `${formatSigned(lbeDelta, 2, " pp")} vs baseline`,
      foot: "Planning SAM / (workers × bottleneck)",
      tone: "good",
      icon: "balance",
    },
    {
      label: "Workers on line",
      value: `${kpis.workers_used}`,
      note:
        workerDelta === null
          ? "No synthetic baseline"
          : `${formatSigned(workerDelta, 0)} vs baseline ${before?.workers_used ?? "—"}`,
      foot: "One worker per station",
      tone: workerDelta !== null && workerDelta < 0 ? "good" : "neutral",
      icon: "workers",
    },
    {
      label: "Capacity / shift",
      value: formatNumber(kpis.capacity_per_shift, 1),
      note:
        targetGap > 0
          ? `${formatNumber(targetGap, 1)} pcs short of target`
          : `${formatNumber(Math.abs(targetGap), 1)} pcs above target`,
      foot:
        capacityDelta === null
          ? `Bottleneck-constrained · target ${kpis.target_qty}`
          : `${formatSigned(capacityDelta, 1, " pcs")} vs baseline · bottleneck-limited`,
      tone: kpis.meets_target ? "good" : "bad",
      icon: "capacity",
    },
  ];

  return (
    <section className="overview-metrics" aria-label="Key performance indicators">
      {cards.map((card) => (
        <article key={card.label} className={cx("metric-card", `tone-${card.tone}`)}>
          <div className="metric-head">
            <span className="metric-label">{card.label}</span>
            <span className="metric-icon" aria-hidden="true">
              <MetricIcon name={card.icon} />
            </span>
          </div>
          <strong className="metric-value">{card.value}</strong>
          <p className="metric-note">{card.note}</p>
          <span className="metric-foot">{card.foot}</span>
        </article>
      ))}
    </section>
  );
}

function MetricIcon({ name }: { name: MetricIconName }) {
  const common = {
    width: 17,
    height: 17,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (name) {
    case "bottleneck":
      return (
        <svg {...common}>
          <path d="M4 17a8 8 0 1 1 16 0" />
          <path d="m12 14 4-4" />
          <path d="M12 20h.01" />
        </svg>
      );
    case "balance":
      return (
        <svg {...common}>
          <path d="M4 18V9" />
          <path d="M10 18V5" />
          <path d="M16 18v-6" />
          <path d="M22 18H2" />
        </svg>
      );
    case "workers":
      return (
        <svg {...common}>
          <circle cx="9" cy="8" r="3" />
          <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
          <path d="M16 5.5a3 3 0 0 1 0 5.8" />
          <path d="M18 14.5c2 .8 3 2.6 3 5.5" />
        </svg>
      );
    case "capacity":
      return (
        <svg {...common}>
          <path d="M4 7.5 12 3l8 4.5v9L12 21l-8-4.5z" />
          <path d="M4 7.5 12 12l8-4.5" />
          <path d="M12 12v9" />
        </svg>
      );
  }
}
