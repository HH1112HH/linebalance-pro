import type { OptimizeResult, StationResult } from "../types";
import { displayOperationName, stationStatusLabel, useLanguage } from "../i18n";
import { cx, formatNumber, formatPct } from "../utils";

interface Props {
  result: OptimizeResult;
  compact?: boolean;
}

export default function BottleneckPanel({ result, compact = false }: Props) {
  const { language, t } = useLanguage();
  const kpis = result.kpis;
  const focusStation = kpis
    ? result.stations.find((station) => station.station === kpis.bottleneck_station)
    : undefined;

  if (!kpis || !focusStation) {
    return (
      <section className="panel bottleneck-panel" aria-labelledby="bottleneck-title">
        <div className="panel-head">
          <div>
            <span className="eyebrow">{t("bottleneck.eyebrow")}</span>
            <h2 id="bottleneck-title">{t("bottleneck.title")}</h2>
          </div>
        </div>
        <div className="empty-state">{t("bottleneck.empty")}</div>
      </section>
    );
  }

  const reviewStations = result.stations
    .filter((station) => station.status === "bottleneck" || station.status === "watch")
    .sort((left, right) => right.standard_load_sec - left.standard_load_sec)
    .slice(0, compact ? 3 : 5);
  const focusTone =
    focusStation.status === "bottleneck" && focusStation.overload_sec <= 0
      ? "status-watch"
      : `status-${focusStation.status}`;

  return (
    <section
      className={cx("panel bottleneck-panel", compact && "is-compact")}
      aria-labelledby="bottleneck-title"
    >
      <div className="panel-head">
        <div>
          <span className="eyebrow">{t("bottleneck.eyebrow")}</span>
          <h2 id="bottleneck-title">{t("bottleneck.title")}</h2>
        </div>
        <span className={cx("status-pill", focusTone)}>
          {stationStatusLabel(focusStation.status, t)}
        </span>
      </div>

      <div className="bottleneck-focus">
        <div className="bottleneck-station-id">
          <span>{t("bottleneck.current")}</span>
          <strong>ST{focusStation.station.toString().padStart(2, "0")}</strong>
          <small>{focusStation.worker_name}</small>
        </div>

        <div className="bottleneck-metrics">
          <div>
            <span>{t("bottleneck.load")}</span>
            <strong>
              {formatNumber(focusStation.standard_load_sec, 1)}
              {t("unit.secondsSuffix")}
            </strong>
          </div>
          <div>
            <span>{t("bottleneck.effectiveTakt")}</span>
            <strong>
              {formatNumber(kpis.effective_takt_time_sec, 2)}
              {t("unit.secondsSuffix")}
            </strong>
          </div>
          <div>
            <span>
              {focusStation.overload_sec > 0
                ? t("bottleneck.overload")
                : t("bottleneck.buffer")}
            </span>
            <strong
              className={focusStation.overload_sec > 0 ? "value-bad" : "value-good"}
            >
              {formatNumber(
                focusStation.overload_sec > 0
                  ? focusStation.overload_sec
                  : focusStation.idle_sec,
                2,
              )}
              {t("unit.secondsSuffix")}
            </strong>
          </div>
          <div>
            <span>{t("bottleneck.utilization")}</span>
            <strong>{formatPct(focusStation.standard_utilization_pct, 1)}</strong>
          </div>
        </div>

        <div
          className="bottleneck-operations"
          title={focusStation.operation_names
            .map((name, index) =>
              displayOperationName(
                { id: focusStation.operation_ids[index] ?? "", name },
                language,
              ),
            )
            .join(", ")}
        >
          {focusStation.operation_ids.join(" · ")}
        </div>
      </div>

      <div className="bottleneck-review">
        <div className="subhead">
          <h3>{t("bottleneck.priority")}</h3>
          <span className="tiny-note">
            {t("bottleneck.showing", {
              shown: reviewStations.length,
              total: result.stations.length,
            })}
          </span>
        </div>
        {reviewStations.length > 0 ? (
          <ul>
            {reviewStations.map((station) => (
              <ReviewStation key={station.station} station={station} t={t} />
            ))}
          </ul>
        ) : (
          <p className="muted-text">{t("bottleneck.noPriority")}</p>
        )}
      </div>

      <p className="panel-footnote">{t("bottleneck.reviewLimit")}</p>
    </section>
  );
}

function ReviewStation({
  station,
  t,
}: {
  station: StationResult;
  t: ReturnType<typeof useLanguage>["t"];
}) {
  return (
    <li>
      <span
        className={cx("status-dot", `status-${station.status}`)}
        aria-hidden="true"
      />
      <span className="bottleneck-review-id">
        <strong>ST{station.station.toString().padStart(2, "0")}</strong>
        <small>{station.worker_id}</small>
      </span>
      <span className="bottleneck-review-status">
        {stationStatusLabel(station.status, t)}
      </span>
      <strong className="bottleneck-review-load">
        {formatNumber(station.standard_load_sec, 1)}
        {t("unit.secondsSuffix")}
      </strong>
    </li>
  );
}
