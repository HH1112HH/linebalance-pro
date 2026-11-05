import type { OptimizeResult } from "../types";
import { useLanguage } from "../i18n";
import { cx, formatNumber, formatPct, formatSigned } from "../utils";

interface Props {
  result: OptimizeResult;
}

type MetricIconName = "bottleneck" | "balance" | "workers" | "capacity";

export default function OverviewMetrics({ result }: Props) {
  const { t } = useLanguage();
  const kpis = result.kpis;
  const before = result.baseline_comparison?.before;

  if (!kpis) {
    return <div className="empty-state">{t("metrics.empty")}</div>;
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
      label: t("metric.bottleneck.label"),
      value: `${formatNumber(kpis.bottleneck_load_sec, 1)}${t("unit.secondsSuffix")}`,
      note:
        overTakt > 0
          ? t("metric.bottleneck.over", { value: formatNumber(overTakt, 2) })
          : t("metric.bottleneck.inside", {
              value: formatNumber(Math.abs(overTakt), 2),
            }),
      foot: t("metric.bottleneck.foot", {
        station: kpis.bottleneck_station.toString().padStart(2, "0"),
      }),
      tone: overTakt > 0 ? "warn" : "good",
      icon: "bottleneck",
    },
    {
      label: t("metric.lbe.label"),
      value: formatPct(kpis.balance_efficiency_pct, 2),
      note:
        lbeDelta === null
          ? t("metric.noBaseline")
          : t("metric.lbe.delta", {
              value: formatSigned(lbeDelta, 2, t("unit.percentagePointsSuffix")),
            }),
      foot: t("metric.lbe.foot"),
      tone: "good",
      icon: "balance",
    },
    {
      label: t("metric.workers.label"),
      value: `${kpis.workers_used}`,
      note:
        workerDelta === null
          ? t("metric.noBaseline")
          : t("metric.workers.delta", {
              value: formatSigned(workerDelta, 0),
              base: before?.workers_used ?? "—",
            }),
      foot: t("metric.workers.foot"),
      tone: workerDelta !== null && workerDelta < 0 ? "good" : "neutral",
      icon: "workers",
    },
    {
      label: t("metric.capacity.label"),
      value: `${formatNumber(kpis.capacity_per_shift, 1)}${t("unit.piecesSuffix")}`,
      note:
        targetGap > 0
          ? t("metric.capacity.short", { value: formatNumber(targetGap, 1) })
          : t("metric.capacity.above", {
              value: formatNumber(Math.abs(targetGap), 1),
            }),
      foot:
        capacityDelta === null
          ? t("metric.capacity.foot", { target: kpis.target_qty })
          : t("metric.capacity.delta", {
              value: formatSigned(capacityDelta, 1, t("unit.piecesSuffix")),
            }),
      tone: kpis.meets_target ? "good" : "bad",
      icon: "capacity",
    },
  ];

  return (
    <div className="overview-metrics-stack">
      <section className="overview-metrics" aria-label={t("metrics.aria")}>
        {cards.map((card) => (
          <article key={card.label} className={cx("metric-card", `tone-${card.tone}`)}>
            <div className="metric-head">
              <span className="metric-label" title={card.foot}>
                {card.label}
              </span>
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

      <section className="overview-summary" aria-label={t("metrics.secondaryAria")}>
        <article className="overview-summary-card" title={t("metric.utilization.foot")}>
          <span>{t("metric.utilization.label")}</span>
          <strong>{formatPct(kpis.planned_labor_utilization_pct, 2)}</strong>
          <small>{t("metric.utilization.foot")}</small>
        </article>
        <article className="overview-summary-card" title={t("metric.idle.note")}>
          <span>{t("metric.idle.label")}</span>
          <strong>
            {formatNumber(kpis.total_idle_sec, 1)}
            {t("unit.secondsSuffix")}
          </strong>
          <small>{t("metric.idle.note")}</small>
        </article>
        <article className="overview-summary-card">
          <span>{t("metric.workstations.label")}</span>
          <strong>{result.stations.length}</strong>
          <small>{t("metric.workstations.foot")}</small>
        </article>
        <article className="overview-summary-card">
          <span>{t("metric.actualOutput.label")}</span>
          <strong>
            {result.actuals_analysis
              ? `${formatNumber(result.actuals_analysis.actual_output, 0)}${t("unit.piecesSuffix")}`
              : "—"}
          </strong>
          <small>
            {result.actuals_analysis
              ? t("metric.actualOutput.period", {
                  days: result.actuals_analysis.period_days,
                })
              : t("metric.actualOutput.missing")}
          </small>
        </article>
      </section>
    </div>
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
