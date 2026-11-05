import { useState } from "react";
import type { OptimizeResult, StationStatus } from "../types";
import { displayOperationName, stationStatusLabel, useLanguage } from "../i18n";
import { cx, formatNumber, formatPct } from "../utils";

interface Props {
  result: OptimizeResult;
}

type SortKey =
  | "station"
  | "worker"
  | "operations"
  | "load"
  | "takt"
  | "idle"
  | "utilization"
  | "status";
type SortDirection = "asc" | "desc";
type StatusFilter = "all" | StationStatus;

const STATUS_ORDER: Record<StationStatus, number> = {
  bottleneck: 0,
  watch: 1,
  normal: 2,
  underutilized: 3,
};

export default function StationTable({ result }: Props) {
  const { language, t } = useLanguage();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("load");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const kpis = result.kpis;

  if (result.stations.length === 0 || !kpis) return null;

  const normalizedQuery = query.trim().toLocaleLowerCase();
  const stations = result.stations
    .filter((station) => statusFilter === "all" || station.status === statusFilter)
    .filter((station) => {
      if (!normalizedQuery) return true;
      return [
        `ST${station.station.toString().padStart(2, "0")}`,
        station.worker_id,
        station.worker_name,
        ...station.operation_ids,
        ...station.operation_names.map((name, index) =>
          displayOperationName(
            { id: station.operation_ids[index] ?? "", name },
            language,
          ),
        ),
      ]
        .join(" ")
        .toLocaleLowerCase()
        .includes(normalizedQuery);
    })
    .sort(
      (left, right) =>
        sortStations(left, right, sortKey) * directionMultiplier(sortDirection),
    );

  function toggleSort(nextKey: SortKey) {
    if (nextKey === sortKey) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(nextKey);
    setSortDirection(nextKey === "load" || nextKey === "utilization" ? "desc" : "asc");
  }

  function nextSortDirection(nextKey: SortKey): SortDirection {
    if (nextKey === sortKey) return sortDirection === "asc" ? "desc" : "asc";
    return nextKey === "load" || nextKey === "utilization" ? "desc" : "asc";
  }

  const columns: Array<{ key: SortKey; label: string; numeric?: boolean }> = [
    { key: "station", label: t("station.col.station") },
    { key: "worker", label: t("station.col.worker") },
    { key: "operations", label: t("station.col.operationsCount"), numeric: true },
    { key: "load", label: t("station.col.load"), numeric: true },
    { key: "takt", label: t("station.col.takt"), numeric: true },
    { key: "idle", label: t("station.col.idle"), numeric: true },
    { key: "utilization", label: t("station.col.utilization"), numeric: true },
    { key: "status", label: t("station.col.status") },
  ];

  return (
    <section className="panel station-table-panel" aria-labelledby="station-title">
      <div className="panel-head">
        <div>
          <span className="eyebrow">{t("station.eyebrow")}</span>
          <h2 id="station-title">{t("station.title")}</h2>
        </div>
        <span className="panel-chip chip-muted">
          {t("station.chip", { count: result.stations.length })}
        </span>
      </div>

      <div className="station-table-controls">
        <label className="station-search">
          <span className="sr-only">{t("station.searchAria")}</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("station.searchPlaceholder")}
            aria-label={t("station.searchAria")}
          />
        </label>
        <label className="station-status-filter">
          <span>{t("station.filter.status")}</span>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
            aria-label={t("station.filter.status")}
          >
            <option value="all">{t("station.filter.all")}</option>
            {(["bottleneck", "watch", "normal", "underutilized"] as const).map(
              (status) => (
                <option key={status} value={status}>
                  {stationStatusLabel(status, t)}
                </option>
              ),
            )}
          </select>
        </label>
        <span className="station-result-count">
          {stations.length} / {result.stations.length}
        </span>
      </div>

      {stations.length === 0 ? (
        <div className="empty-state">{t("station.noResults")}</div>
      ) : (
        <div className="table-wrap station-table-wrap">
          <table className="data-table station-table">
            <thead>
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={column.numeric ? "num" : undefined}
                    aria-sort={
                      sortKey === column.key
                        ? sortDirection === "asc"
                          ? "ascending"
                          : "descending"
                        : "none"
                    }
                  >
                    <button
                      type="button"
                      className="table-sort-button"
                      onClick={() => toggleSort(column.key)}
                      aria-label={`${t("station.sortBy", { column: column.label })} ${t(
                        nextSortDirection(column.key) === "asc"
                          ? "station.sortAscending"
                          : "station.sortDescending",
                      )}`}
                    >
                      {column.label}
                      <span aria-hidden="true">
                        {sortKey === column.key
                          ? sortDirection === "asc"
                            ? " ↑"
                            : " ↓"
                          : " ↕"}
                      </span>
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stations.map((station) => (
                <tr
                  key={station.station}
                  className={cx(
                    station.status === "bottleneck" && "row-is-bottleneck",
                    station.status === "watch" && "row-is-watch",
                  )}
                >
                  <td className="mono">
                    ST{station.station.toString().padStart(2, "0")}
                  </td>
                  <td>
                    <span className="row-label">{station.worker_id}</span>
                    <span className="row-note">{station.worker_name}</span>
                  </td>
                  <td className="num mono">
                    <span>
                      {t("station.operationCount", {
                        count: station.operation_ids.length,
                      })}
                    </span>
                    <span
                      className="row-note ops-cell"
                      title={station.operation_names
                        .map((name, index) =>
                          displayOperationName(
                            { id: station.operation_ids[index] ?? "", name },
                            language,
                          ),
                        )
                        .join(", ")}
                    >
                      {station.operation_ids.join(" · ")}
                    </span>
                  </td>
                  <td className="num mono">
                    {formatNumber(station.standard_load_sec, 1)}
                    {t("unit.secondsSuffix")}
                  </td>
                  <td className="num mono">
                    {formatNumber(kpis.effective_takt_time_sec, 2)}
                    {t("unit.secondsSuffix")}
                  </td>
                  <td className="num mono">
                    {formatNumber(station.idle_sec, 1)}
                    {t("unit.secondsSuffix")}
                  </td>
                  <td className="num mono">
                    {formatPct(station.standard_utilization_pct, 1)}
                  </td>
                  <td>
                    <span className={`status-pill status-${station.status}`}>
                      {stationStatusLabel(station.status, t)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="panel-footnote">{t("station.footnote")}</p>
    </section>
  );
}

function directionMultiplier(direction: SortDirection): number {
  return direction === "asc" ? 1 : -1;
}

function sortStations(
  left: OptimizeResult["stations"][number],
  right: OptimizeResult["stations"][number],
  key: SortKey,
): number {
  switch (key) {
    case "station":
      return left.station - right.station;
    case "worker":
      return left.worker_name.localeCompare(right.worker_name);
    case "operations":
      return left.operation_ids.length - right.operation_ids.length;
    case "load":
      return left.standard_load_sec - right.standard_load_sec;
    case "takt":
      return 0;
    case "idle":
      return left.idle_sec - right.idle_sec;
    case "utilization":
      return left.standard_utilization_pct - right.standard_utilization_pct;
    case "status":
      return STATUS_ORDER[left.status] - STATUS_ORDER[right.status];
  }
}
