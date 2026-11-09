import type { OptimizeResult } from "../types";
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
            <strong
              className={focusStation.overload_sec > 0 ? "value-bad" : "value-good"}
            >
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
            <strong
              className={focusStation.overload_sec > 0 ? "value-bad" : "value-good"}
            >
              {formatPct(focusStation.standard_utilization_pct, 1)}
            </strong>
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
    </section>
  );
}
