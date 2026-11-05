import type { OptimizeResult } from "../types";
import { useLanguage } from "../i18n";
import { cx, formatNumber, formatPct } from "../utils";

interface Props {
  result: OptimizeResult;
  compact?: boolean;
}

export default function TaktPanel({ result, compact = false }: Props) {
  const { t } = useLanguage();
  const kpis = result.kpis;
  if (!kpis) return null;

  const demand = kpis.takt_time_sec;
  const effective = kpis.effective_takt_time_sec;
  const bottleneck = kpis.bottleneck_load_sec;
  const scale = Math.max(demand, bottleneck) * 1.08;
  const effectivePct = (effective / scale) * 100;
  const demandPct = (demand / scale) * 100;
  const bottleneckPct = (bottleneck / scale) * 100;
  const over = bottleneck - effective;

  return (
    <section
      className={cx("panel takt-panel", compact && "is-compact")}
      aria-labelledby="takt-title"
    >
      <div className="panel-head">
        <div>
          <span className="eyebrow">{t("takt.eyebrow")}</span>
          <h2 id="takt-title">
            {compact ? t("takt.title.compact") : t("takt.title.full")}
          </h2>
        </div>
        <span className="panel-chip">{t("takt.chip")}</span>
      </div>

      <div className="takt-track" aria-hidden="true">
        <div
          className="takt-fill"
          style={{
            width: `${bottleneckPct}%`,
            background: `linear-gradient(90deg, var(--emerald-bright) 0%, var(--emerald) ${effectivePct}%, var(--red) ${effectivePct}%, var(--red) 100%)`,
          }}
        />
        <div className="takt-marker" style={{ left: `${effectivePct}%` }}>
          <span>
            {t("takt.marker.effective", { value: formatNumber(effective, 2) })}
          </span>
        </div>
        <div className="takt-marker marker-demand" style={{ left: `${demandPct}%` }}>
          <span>{t("takt.marker.demand", { value: formatNumber(demand, 2) })}</span>
        </div>
      </div>

      <div className="takt-rail-note">
        <span className={over > 0 ? "takt-gap" : "takt-gap is-ok"}>
          {over > 0
            ? t("takt.over", { value: formatNumber(over, 2) })
            : t("takt.inside", { value: formatNumber(Math.abs(over), 2) })}
        </span>
        <span>{t("takt.scale", { value: formatNumber(scale, 1) })}</span>
      </div>

      {compact ? (
        <div className="takt-facts">
          <div>
            <span>{t("takt.demand.label")}</span>
            <strong>
              {formatNumber(demand, 2)}
              {t("unit.secondsSuffix")}
            </strong>
          </div>
          <div>
            <span>{t("takt.effective.label")}</span>
            <strong>
              {formatNumber(effective, 2)}
              {t("unit.secondsSuffix")}
            </strong>
          </div>
          <div>
            <span>{t("takt.gap.label")}</span>
            <strong className={over > 0 ? "value-bad" : "value-good"}>
              {over > 0 ? "+" : ""}
              {formatNumber(over, 2)}
              {t("unit.secondsSuffix")}
            </strong>
          </div>
        </div>
      ) : null}

      {compact ? (
        <p className="panel-footnote">
          {t("takt.footnote", {
            pct: formatPct(kpis.planned_efficiency * 100, 0),
          })}
        </p>
      ) : null}

      {compact ? null : (
        <div className="takt-explain">
          <article>
            <span className="eyebrow">{t("takt.demand.label")}</span>
            <strong>
              {formatNumber(demand, 2)}
              {t("unit.secondsSuffix")}
            </strong>
            <p>
              {t("takt.demand.body", {
                seconds: formatNumber(kpis.available_seconds, 0),
                target: kpis.target_qty,
              })}
            </p>
          </article>
          <article>
            <span className="eyebrow">{t("takt.effective.label")}</span>
            <strong>
              {formatNumber(effective, 2)}
              {t("unit.secondsSuffix")}
            </strong>
            <p>
              {t("takt.effective.body", {
                seconds: formatNumber(kpis.available_seconds, 0),
                pct: formatPct(kpis.planned_efficiency * 100, 0),
                target: kpis.target_qty,
              })}
            </p>
          </article>
          <article className="takt-decision">
            <span className="eyebrow">{t("metric.bottleneck.label")}</span>
            <strong>
              {formatNumber(bottleneck, 2)}
              {t("unit.secondsSuffix")}
            </strong>
            <p>
              {over > 0
                ? t("takt.bottleneck.body.over", {
                    value: formatNumber(over, 2),
                    pct: formatPct(kpis.target_achievement_pct, 2),
                  })
                : t("takt.bottleneck.body.ok")}
            </p>
          </article>
        </div>
      )}
    </section>
  );
}
