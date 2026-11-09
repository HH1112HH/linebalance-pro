import type { OptimizeResult } from "../types";
import { useLanguage } from "../i18n";
import { formatNumber, formatPct, formatSigned } from "../utils";

interface Props {
  result: OptimizeResult;
}

export default function TargetHealthPanel({ result }: Props) {
  const { t } = useLanguage();
  const kpis = result.kpis;
  if (!kpis) {
    return (
      <section className="panel target-panel" aria-labelledby="target-title">
        <div className="panel-head">
          <div>
            <span className="eyebrow">{t("target.eyebrow")}</span>
            <h2 id="target-title">{t("target.title")}</h2>
          </div>
        </div>
        <div className="empty-state">{t("target.empty")}</div>
      </section>
    );
  }

  const before = result.baseline_comparison?.before;
  const pct = Math.min(100, Math.max(0, kpis.target_achievement_pct));
  const gap = kpis.target_qty - kpis.capacity_per_shift;
  const delta = before ? kpis.capacity_per_shift - before.capacity_per_shift : null;
  const donutColor = kpis.meets_target ? "var(--emerald-bright)" : "var(--red)";
  const formula = t("target.formula", {
    seconds: formatNumber(kpis.available_seconds, 0),
    pct: formatPct(kpis.planned_efficiency * 100, 0),
    bottleneck: formatNumber(kpis.bottleneck_load_sec, 1),
    capacity: formatNumber(kpis.capacity_per_shift, 1),
  });

  return (
    <section className="panel target-panel" aria-labelledby="target-title">
      <div className="panel-head">
        <div>
          <span className="eyebrow">{t("target.eyebrow")}</span>
          <h2 id="target-title">{t("target.title")}</h2>
        </div>
        <span className={kpis.meets_target ? "panel-chip" : "panel-chip chip-alert"}>
          {kpis.meets_target ? t("target.met") : t("target.gap")}
        </span>
      </div>

      <div className="target-body">
        <div
          className="target-donut"
          role="img"
          aria-label={t("target.aria", {
            pct: formatPct(kpis.target_achievement_pct, 2),
          })}
          style={{
            background: `conic-gradient(${donutColor} 0 ${pct}%, var(--surface-muted) ${pct}% 100%)`,
          }}
        >
          <div className="target-donut-inner">
            <strong className={kpis.meets_target ? "value-good" : "value-bad"}>
              {formatPct(kpis.target_achievement_pct, 1)}
            </strong>
            <span>{t("target.of")}</span>
          </div>
        </div>

        <div className="target-facts">
          <div>
            <span>{t("target.target")}</span>
            <strong>{formatNumber(kpis.target_qty, 0)}</strong>
            <small>{t("target.pcsShift")}</small>
          </div>
          <div>
            <span>{t("target.capacity")}</span>
            <strong className={gap > 0 ? "value-bad" : "value-good"}>
              {formatNumber(kpis.capacity_per_shift, 1)}
            </strong>
            <small>{t("target.bottleneckConstrained")}</small>
          </div>
          <div>
            <span>{gap > 0 ? t("target.short") : t("target.surplus")}</span>
            <strong className={gap > 0 ? "value-bad" : "value-good"}>
              {formatNumber(Math.abs(gap), 1)}
            </strong>
            <small>{t("target.pcsShift")}</small>
          </div>
        </div>
      </div>

      <div className="target-formula">
        <code>{formula}</code>
        {delta === null ? null : (
          <span className="target-delta">
            {t("target.delta", {
              value: formatSigned(delta, 1, t("unit.piecesSuffix")),
            })}
          </span>
        )}
      </div>

      <p className="panel-footnote">{t("target.footnote")}</p>
    </section>
  );
}
