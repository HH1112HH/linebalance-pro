import type { OptimizeResult } from "../types";
import { useLanguage } from "../i18n";
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
  deltaFormat: "improvement" | "percentage" | "default";
}

export default function BaselinePanel({ result }: Props) {
  const { t } = useLanguage();
  const comparison = result.baseline_comparison;
  if (!comparison) {
    return (
      <section className="panel" aria-labelledby="baseline-title">
        <div className="panel-head">
          <div>
            <span className="eyebrow">{t("baseline.eyebrow")}</span>
            <h2 id="baseline-title">{t("baseline.title")}</h2>
          </div>
        </div>
        <div className="empty-state">{t("baseline.empty")}</div>
      </section>
    );
  }

  const { before, after } = comparison;
  if (!before) {
    return (
      <section className="panel" aria-labelledby="baseline-title">
        <div className="panel-head">
          <div>
            <span className="eyebrow">{t("baseline.eyebrow")}</span>
            <h2 id="baseline-title">{t("baseline.title")}</h2>
          </div>
        </div>
        <div className="empty-state">{t("baseline.empty")}</div>
      </section>
    );
  }

  const rows: Row[] = [
    {
      label: t("baseline.row.stations"),
      before: before.stations_used,
      after: after.stations_used,
      digits: 0,
      direction: "lower",
      note: t("baseline.row.stations.note"),
      deltaFormat: "default",
    },
    {
      label: t("baseline.row.workers"),
      before: before.workers_used,
      after: after.workers_used,
      digits: 0,
      direction: "lower",
      note: t("baseline.row.workers.note"),
      deltaFormat: "default",
    },
    {
      label: t("baseline.row.bottleneck"),
      before: before.bottleneck_load_sec,
      after: after.bottleneck_load_sec,
      digits: 1,
      suffix: t("unit.secondsSuffix"),
      direction: "lower",
      note: t("baseline.row.bottleneck.note", {
        before: before.bottleneck_station,
        after: after.bottleneck_station,
      }),
      deltaFormat: "improvement",
    },
    {
      label: t("baseline.row.lbe"),
      before: before.balance_efficiency_pct,
      after: after.balance_efficiency_pct,
      digits: 2,
      suffix: "%",
      direction: "higher",
      note: t("baseline.row.lbe.note"),
      deltaFormat: "percentage",
    },
    {
      label: t("baseline.row.capacity"),
      before: before.capacity_per_shift,
      after: after.capacity_per_shift,
      digits: 1,
      suffix: t("unit.piecesSuffix"),
      direction: "higher",
      note: t("baseline.row.capacity.note"),
      deltaFormat: "default",
    },
    {
      label: t("baseline.row.target"),
      before: before.target_achievement_pct,
      after: after.target_achievement_pct,
      digits: 2,
      suffix: "%",
      direction: "higher",
      note:
        after.target_achievement_pct >= 100
          ? t("baseline.row.target.met")
          : t("baseline.row.target.missed"),
      deltaFormat: "percentage",
    },
    {
      label: t("baseline.row.smoothness"),
      before: before.smoothness_index,
      after: after.smoothness_index,
      digits: 2,
      suffix: t("unit.secondsSuffix"),
      direction: "lower",
      note: t("baseline.row.smoothness.note"),
      deltaFormat: "default",
    },
    {
      label: t("baseline.row.idle"),
      before: before.total_idle_sec,
      after: after.total_idle_sec,
      digits: 1,
      suffix: t("unit.secondsSuffix"),
      direction: "lower",
      note: t("baseline.row.idle.note"),
      deltaFormat: "default",
    },
    {
      label: t("baseline.row.overload"),
      before: before.total_overload_sec,
      after: after.total_overload_sec,
      digits: 1,
      suffix: t("unit.secondsSuffix"),
      direction: "lower",
      note: t("baseline.row.overload.note"),
      deltaFormat: "default",
    },
  ];

  return (
    <section className="panel baseline-panel" aria-labelledby="baseline-title">
      <div className="panel-head">
        <div>
          <span className="eyebrow">{t("baseline.eyebrow")}</span>
          <h2 id="baseline-title">{t("baseline.title")}</h2>
        </div>
        <span className="panel-chip chip-muted">{t("baseline.chip")}</span>
      </div>

      <div className="baseline-table-wrap">
        <table className="data-table baseline-table">
          <thead>
            <tr>
              <th>{t("baseline.col.metric")}</th>
              <th className="num">{t("baseline.col.before")}</th>
              <th className="num">{t("baseline.col.after")}</th>
              <th className="num">{t("baseline.col.delta")}</th>
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
                  <td className="num" data-label={t("baseline.col.before")}>
                    {formatValue(row.before, row)}
                  </td>
                  <td className="num strong" data-label={t("baseline.col.after")}>
                    {formatValue(row.after, row)}
                  </td>
                  <td
                    className={cx(
                      "num delta",
                      flat ? "delta-flat" : good ? "delta-good" : "delta-bad",
                    )}
                    data-label={t("baseline.col.delta")}
                  >
                    {formatDelta(row, delta, t)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="panel-footnote">{t("baseline.footnote")}</p>
    </section>
  );
}

function formatValue(value: number | null, row: Row): string {
  if (value === null) return "—";
  return `${formatNumber(value, row.digits)}${row.suffix ?? ""}`;
}

function formatDelta(
  row: Row,
  delta: number,
  t: ReturnType<typeof useLanguage>["t"],
): string {
  const suffix = row.suffix ?? "";
  if (row.deltaFormat === "improvement") {
    return t("baseline.improvement", {
      value: formatSigned(-delta, row.digits, suffix),
    });
  }
  if (row.deltaFormat === "percentage") {
    return formatSigned(
      delta,
      row.digits,
      suffix === "%" ? t("unit.percentagePointsSuffix") : suffix,
    );
  }
  return formatSigned(delta, row.digits, suffix);
}
