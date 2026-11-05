import { useState } from "react";
import type { BaselineStation, OptimizeResult, StationStatus } from "../types";
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
  const [view, setView] = useState<"optimized" | "baseline">("optimized");
  const kpis = result.kpis;

  const optimizedRows: WorkloadRow[] = result.stations.map((station) => ({
    key: `ST${station.station}`,
    label: `ST${station.station}`,
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
          <span className="eyebrow">Yamazumi / station load</span>
          <h2 id="workload-title">
            {compact ? "Top station loads" : "Where the line loses balance"}
          </h2>
        </div>
        <div className="panel-head-actions">
          {compact ? (
            onViewAll ? (
              <button type="button" className="ghost-button" onClick={onViewAll}>
                All stations <span aria-hidden="true">→</span>
              </button>
            ) : null
          ) : (
            <div className="segmented" role="group" aria-label="Workload view">
              <button
                type="button"
                className={cx(view === "optimized" && "is-active")}
                onClick={() => setView("optimized")}
              >
                Optimized
              </button>
              <button
                type="button"
                className={cx(view === "baseline" && "is-active")}
                onClick={() => setView("baseline")}
              >
                Baseline
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="workload-summary">
        <span>
          <strong>{rows.length}</strong>
          {compact ? ` of ${allRows.length}` : ""} stations
        </span>
        <span>
          <strong>{formatNumber(maxRow.load, 1)}s</strong> max load
        </span>
        <span>
          <strong>{formatNumber(effectiveTakt, 2)}s</strong> effective takt
        </span>
        <span>
          <strong>{formatNumber(demandTakt, 2)}s</strong> demand takt
        </span>
      </div>

      <div className="workload-legend">
        <span>
          <i className="swatch swatch-bottleneck" /> Bottleneck
        </span>
        <span>
          <i className="swatch swatch-watch" /> Watch
        </span>
        <span>
          <i className="swatch swatch-normal" /> Normal
        </span>
        <span>
          <i className="swatch swatch-underutilized" /> Underutilized
        </span>
        <span className="legend-spacer" />
        <span>
          <i className="line-swatch line-effective" /> Effective takt
        </span>
        <span>
          <i className="line-swatch line-demand" /> Demand takt
        </span>
      </div>

      <div className={cx("workload-rows", compact && "is-compact")}>
        {rows.map((row) => (
          <div className="wl-row" key={row.key}>
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
            <div className="wl-load">{formatNumber(row.load, 1)}s</div>
            <div className="wl-ops" title={row.operationIds.join(", ")}>
              {row.operationIds.join(" · ")}
            </div>
          </div>
        ))}
      </div>

      {compact ? null : (
        <p className="panel-footnote">
          Bar length is planning SAM per station, not machine utilization. The effective
          takt is the planning cycle allowance at the planned efficiency; the demand
          takt is the customer requirement at 100% of scheduled time.
        </p>
      )}
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
