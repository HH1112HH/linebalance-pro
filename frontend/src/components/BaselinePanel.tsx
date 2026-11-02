import type { OptimizeResult } from "../types";
import { cx, formatNumber, formatSigned } from "../utils";

interface Props {
  result: OptimizeResult;
}

type Direction = "lower" | "higher";

interface Row {
  label: string;
  before: number | null;
  after: number;
  digits: number;
  suffix?: string;
  direction: Direction;
  note: string;
}

export default function BaselinePanel({ result }: Props) {
  const comparison = result.baseline_comparison;
  if (!comparison) {
    return (
      <section className="panel" aria-labelledby="baseline-title">
        <div className="panel-head">
          <div>
            <span className="eyebrow">Before / after</span>
            <h2 id="baseline-title">Baseline comparison</h2>
          </div>
        </div>
        <div className="empty-state">
          No baseline provided. Only optimized results are shown.
        </div>
      </section>
    );
  }

  const { before, after } = comparison;
  if (!before) {
    return (
      <section className="panel" aria-labelledby="baseline-title">
        <div className="panel-head">
          <div>
            <span className="eyebrow">Before / after</span>
            <h2 id="baseline-title">Baseline comparison</h2>
          </div>
        </div>
        <div className="empty-state">
          No baseline provided. Only optimized results are shown.
        </div>
      </section>
    );
  }

  const rows: Row[] = [
    {
      label: "Stations used",
      before: before.stations_used,
      after: after.stations_used,
      digits: 0,
      direction: "lower",
      note: "Physical stations with work",
    },
    {
      label: "Workers on line",
      before: before.workers_used,
      after: after.workers_used,
      digits: 0,
      direction: "lower",
      note: "One worker per station",
    },
    {
      label: "Bottleneck load",
      before: before.bottleneck_load_sec,
      after: after.bottleneck_load_sec,
      digits: 1,
      suffix: "s",
      direction: "lower",
      note: `Baseline ${before.bottleneck_station} → station ${after.bottleneck_station}`,
    },
    {
      label: "Balance efficiency",
      before: before.balance_efficiency_pct,
      after: after.balance_efficiency_pct,
      digits: 2,
      suffix: "%",
      direction: "higher",
      note: "LBE = planning SAM / (workers × bottleneck)",
    },
    {
      label: "Capacity / shift",
      before: before.capacity_per_shift,
      after: after.capacity_per_shift,
      digits: 1,
      direction: "higher",
      note: "Bottleneck-constrained pcs / shift",
    },
    {
      label: "Target achievement",
      before: before.target_achievement_pct,
      after: after.target_achievement_pct,
      digits: 2,
      suffix: "%",
      direction: "higher",
      note: after.target_achievement_pct >= 100 ? "Target met" : "Target not met",
    },
    {
      label: "Smoothness index",
      before: before.smoothness_index,
      after: after.smoothness_index,
      digits: 2,
      direction: "lower",
      note: "Lower is smoother",
    },
    {
      label: "Total idle time",
      before: before.total_idle_sec,
      after: after.total_idle_sec,
      digits: 1,
      suffix: "s",
      direction: "lower",
      note: "Against effective takt",
    },
    {
      label: "Total overload",
      before: before.total_overload_sec,
      after: after.total_overload_sec,
      digits: 1,
      suffix: "s",
      direction: "lower",
      note: "Load above effective takt",
    },
  ];

  return (
    <section className="panel baseline-panel" aria-labelledby="baseline-title">
      <div className="panel-head">
        <div>
          <span className="eyebrow">Before / after</span>
          <h2 id="baseline-title">Baseline comparison</h2>
        </div>
        <span className="panel-chip chip-muted">Synthetic baseline input</span>
      </div>

      <div className="baseline-table-wrap">
        <table className="data-table baseline-table">
          <thead>
            <tr>
              <th>Metric</th>
              <th className="num">Baseline</th>
              <th className="num">Optimized</th>
              <th className="num">Delta</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const delta = row.after - (row.before ?? 0);
              const good = row.direction === "lower" ? delta < 0 : delta > 0;
              const flat = Math.abs(delta) < 0.005;
              return (
                <tr key={row.label}>
                  <td>
                    <span className="row-label">{row.label}</span>
                    <span className="row-note">{row.note}</span>
                  </td>
                  <td className="num">{formatValue(row.before, row)}</td>
                  <td className="num strong">{formatValue(row.after, row)}</td>
                  <td
                    className={cx(
                      "num delta",
                      flat ? "delta-flat" : good ? "delta-good" : "delta-bad",
                    )}
                  >
                    {formatDelta(row, delta)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="panel-footnote">
        Baseline is a synthetic first-fit current-state layout, not an optimizer output.
        Deltas are optimized minus baseline; for bottleneck, idle and overload, a
        negative delta is an improvement.
      </p>
    </section>
  );
}

function formatValue(value: number | null, row: Row): string {
  if (value === null) return "—";
  return `${formatNumber(value, row.digits)}${row.suffix ?? ""}`;
}

function formatDelta(row: Row, delta: number): string {
  const suffix = row.suffix ?? "";
  if (row.label === "Bottleneck load") {
    return `${formatSigned(-delta, row.digits, suffix)} improvement`;
  }
  if (row.label === "Target achievement" || row.label === "Balance efficiency") {
    return `${formatSigned(delta, row.digits, suffix === "%" ? " pp" : suffix)}`;
  }
  return formatSigned(delta, row.digits, suffix);
}
