import type { ActualsAnalysis } from "../types";
import { actualsNoteLabel, lossCategoryLabel, useLanguage } from "../i18n";
import { cx, formatNumber, formatPct } from "../utils";

interface Props {
  actuals: ActualsAnalysis | null;
}

export default function ActualsPanel({ actuals }: Props) {
  const { language, t } = useLanguage();
  if (!actuals) {
    return (
      <section className="panel" aria-labelledby="actuals-title">
        <div className="panel-head">
          <div>
            <span className="eyebrow">{t("actuals.eyebrow")}</span>
            <h2 id="actuals-title">{t("actuals.title")}</h2>
          </div>
        </div>
        <div className="empty-state">{t("actuals.empty")}</div>
      </section>
    );
  }

  const categories = Object.entries(actuals.downtime_by_category).sort(
    (a, b) => b[1] - a[1],
  );
  const maxCategory = Math.max(1, ...categories.map(([, value]) => value));
  const periodLabel =
    actuals.period_days === 1
      ? t("actuals.period.shift")
      : t("actuals.period.days", { days: actuals.period_days });

  return (
    <section className="panel actuals-panel" aria-labelledby="actuals-title">
      <div className="panel-head">
        <div>
          <span className="eyebrow">{t("actuals.eyebrow")}</span>
          <h2 id="actuals-title">{t("actuals.title")}</h2>
        </div>
        <span className="panel-chip chip-muted">{periodLabel}</span>
      </div>

      <div className="actuals-stats">
        <div>
          <span>{t("actuals.output")}</span>
          <strong>
            {formatNumber(actuals.actual_output, 0)}
            {t("unit.piecesSuffix")}
          </strong>
          <small>
            {t("actuals.target", {
              value: formatNumber(actuals.target_output, 0),
            })}
          </small>
        </div>
        <div>
          <span>{t("actuals.achievement")}</span>
          <strong>{formatPct(actuals.production_achievement_pct, 2)}</strong>
          <small>{t("actuals.actualTarget")}</small>
        </div>
        <div>
          <span>{t("actuals.laborEfficiency")}</span>
          <strong>
            {actuals.actual_labor_efficiency_pct === null
              ? "—"
              : formatPct(actuals.actual_labor_efficiency_pct, 2)}
          </strong>
          <small>{t("actuals.samBasis")}</small>
        </div>
        <div>
          <span>{t("actuals.downtime")}</span>
          <strong>
            {formatNumber(actuals.downtime_minutes, 0)}
            {t("unit.minutesSuffix")}
          </strong>
          <small>
            {t("actuals.ofPlanned", {
              pct: formatPct(actuals.downtime_pct_of_planned_time, 2),
            })}
          </small>
        </div>
      </div>

      <div className="subhead">
        <h3>{t("actuals.byCategory")}</h3>
        <span className="tiny-note">{t("actuals.summaryDetail")}</span>
      </div>
      {categories.length === 0 ? (
        <p className="muted-text">{t("actuals.noDowntime")}</p>
      ) : (
        <div className="downtime-bars">
          {categories.map(([category, value]) => (
            <div className="dt-row" key={category}>
              <span className="dt-label">{lossCategoryLabel(category, t)}</span>
              <div className="dt-track">
                <div
                  className={cx("dt-bar", category === "UNSPECIFIED" && "dt-bar-muted")}
                  style={{ width: `${Math.max(2, (value / maxCategory) * 100)}%` }}
                />
              </div>
              <span className="dt-value">
                {formatNumber(value, 0)}
                {t("unit.minutesSuffix")}
              </span>
            </div>
          ))}
        </div>
      )}

      <ul className="note-list">
        {actuals.notes.slice(0, 3).map((note) => (
          <li key={note}>{actualsNoteLabel(note, language, t)}</li>
        ))}
      </ul>
    </section>
  );
}
