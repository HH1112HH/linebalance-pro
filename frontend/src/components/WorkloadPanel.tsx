import { useState } from "react";
import type { BaselineStation, OptimizeResult, StationStatus } from "../types";
import { stationStatusLabel, useLanguage } from "../i18n";
import { cx, formatNumber } from "../utils";

interface Props {
  result: OptimizeResult;
  baselineStations: BaselineStation[];
  compact?: boolean;
  onViewAll?: () => void;
}

interface WorkloadRow {
  key: string;
  label: string;
  worker: string;
  load: number;
  status: StationStatus;
  operationIds: string[];
}

const COMPACT_ROWS = 5;

export default function WorkloadPanel({
  result,
  baselineStations,
  compact = false,
  onViewAll,
}: Props) {
  const { t } = useLanguage();
  const [view, setView] = useState<"optimized" | "baseline">("optimized");
  const kpis = result.kpis;

  const optimizedRows: WorkloadRow[] = result.stations.map((station) => ({
    key: `ST${station.station}`,
    label: `ST${station.station.toString().padStart(2, "0")}`,
    worker: station.worker_id,
    load: station.standard_load_sec,
    status: station.status,
    operationIds: station.operation_ids,
  }));

  const maxLoad = Math.max(
    0,
    ...optimizedRows.map((row) => row.load),
    ...baselineStations.map((row) => row.load_sec),
  );
  const effectiveTakt = kpis?.effective_takt_time_sec ?? 0;
  const demandTakt = kpis?.takt_time_sec ?? 0;

  const baselineRows: WorkloadRow[] = baselineStations.map((station) => ({
    key: station.station,
    label: station.station,
    worker: "—",
    load: station.load_sec,
    status: baselineStatus(station.load_sec, maxLoad, effectiveTakt),
    operationIds: station.operation_ids,
  }));

  const allRows = view === "optimized" ? optimizedRows : baselineRows;
  const rows = compact
    ? [...allRows].sort((a, b) => b.load - a.load).slice(0, COMPACT_ROWS)
    : allRows;
  const scale = Math.max(1, demandTakt, ...allRows.map((row) => row.load)) * 1.08;
  const maxRow = allRows.reduce(
    (best, row) => (row.load > best.load ? row : best),
    allRows[0] ?? { load: 0, label: "—" },
  );

  return (
    <section
      className={cx("panel workload-panel", compact && "is-compact")}
      aria-labelledby="workload-title"
    >
      <div className="panel-head">
        <div>
          <span className="eyebrow">{t("workload.eyebrow")}</span>
          <h2 id="workload-title">
            {compact ? t("workload.title.compact") : t("workload.title.full")}
          </h2>
        </div>
        <div className="panel-head-actions">
          {compact ? (
            onViewAll ? (
              <button type="button" className="ghost-button" onClick={onViewAll}>
                {t("workload.allStations")} <span aria-hidden="true">→</span>
              </button>
            ) : null
          ) : (
            <div className="segmented" role="group" aria-label={t("workload.viewAria")}>
              <button
                type="button"
                className={cx(view === "optimized" && "is-active")}
                onClick={() => setView("optimized")}
              >
                {t("workload.optimized")}
              </button>
              <button
                type="button"
                className={cx(view === "baseline" && "is-active")}
                onClick={() => setView("baseline")}
              >
                {t("workload.baseline")}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="workload-summary">
        <span>
          {compact
            ? t("workload.summary.compact", {
                shown: rows.length,
                total: allRows.length,
              })
            : t("workload.summary.full", { total: allRows.length })}
        </span>
        <span>
          <strong>
            {t("workload.summary.maxLoad", {
              value: formatNumber(maxRow.load, 1),
            })}
          </strong>
        </span>
        <span>
          <strong>
            {t("workload.summary.effective", {
              value: formatNumber(effectiveTakt, 2),
            })}
          </strong>
        </span>
        <span>
          <strong>
            {t("workload.summary.demand", {
              value: formatNumber(demandTakt, 2),
            })}
          </strong>
        </span>
      </div>

      <div className="workload-legend">
        <span>
          <i className="swatch swatch-bottleneck" /> {t("workload.legend.bottleneck")}
        </span>
        <span>
          <i className="swatch swatch-watch" /> {t("workload.legend.watch")}
        </span>
        <span>
          <i className="swatch swatch-normal" /> {t("workload.legend.normal")}
        </span>
        <span>
          <i className="swatch swatch-underutilized" />
          {t("workload.legend.underutilized")}
        </span>
        <span className="legend-spacer" />
        <span>
          <i className="line-swatch line-effective" />
          {t("workload.legend.effective")}
        </span>
        <span>
          <i className="line-swatch line-demand" /> {t("workload.legend.demand")}
        </span>
      </div>

      <div className="workload-axis" aria-hidden="true">
        <span className="workload-axis-title">{t("workload.axis.load")}</span>
        <div className="workload-axis-track">
          {[0, 0.25, 0.5, 0.75, 1].map((fraction) => (
            <span
              key={fraction}
              style={{ left: `${fraction * 100}%` }}
              className={fraction === 0 ? "is-start" : fraction === 1 ? "is-end" : ""}
            >
              {t("workload.axis.scale", {
                value: formatNumber(scale * fraction, 0),
              })}
            </span>
          ))}
        </div>
      </div>

      <div className={cx("workload-rows", compact && "is-compact")}>
        {rows.map((row) => (
          <div
            className="wl-row"
            key={row.key}
            role="group"
            title={t("workload.rowTooltip", {
              station: row.label,
              worker: row.worker,
              load: formatNumber(row.load, 1),
              status: stationStatusLabel(row.status, t),
            })}
            aria-label={t("workload.rowTooltip", {
              station: row.label,
              worker: row.worker,
              load: formatNumber(row.load, 1),
              status: stationStatusLabel(row.status, t),
            })}
          >
            <div className="wl-id">
              <strong>{row.label}</strong>
              <span>{row.worker}</span>
            </div>
            <div className="wl-track">
              <div
                className={cx("wl-bar", `status-${row.status}`)}
                style={{ width: `${Math.max(1.5, (row.load / scale) * 100)}%` }}
              />
              <div
                className="wl-line line-effective"
                style={{ left: `${(effectiveTakt / scale) * 100}%` }}
              />
              <div
                className="wl-line line-demand"
                style={{ left: `${(demandTakt / scale) * 100}%` }}
              />
            </div>
            <div className="wl-load">
              {formatNumber(row.load, 1)}
              {t("unit.secondsSuffix")}
            </div>
            <div className="wl-ops" title={row.operationIds.join(", ")}>
              {row.operationIds.join(" · ")}
            </div>
          </div>
        ))}
      </div>

      {compact ? null : <p className="panel-footnote">{t("workload.footnote")}</p>}
    </section>
  );
}

function baselineStatus(
  load: number,
  maxLoad: number,
  effectiveTakt: number,
): StationStatus {
  if (Math.abs(load - maxLoad) < 1e-6) return "bottleneck";
  if (load >= effectiveTakt) return "watch";
  if (load < effectiveTakt * 0.6) return "underutilized";
  return "normal";
}
