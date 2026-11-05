import type { OptimizeResult } from "../types";
import { displayOperationName, machineTypeLabel, useLanguage } from "../i18n";
import { cx, formatNumber, formatPct } from "../utils";

interface Props {
  result: OptimizeResult;
}

export default function PlanningPanel({ result }: Props) {
  const { language, t } = useLanguage();
  const planning = result.planning;
  if (!planning) {
    return (
      <section className="panel" aria-labelledby="planning-title">
        <div className="panel-head">
          <div>
            <span className="eyebrow">{t("planning.eyebrow")}</span>
            <h2 id="planning-title">{t("planning.title")}</h2>
          </div>
        </div>
        <div className="empty-state">{t("planning.empty")}</div>
      </section>
    );
  }

  const capacity = planning.capacity;
  const headcount = planning.headcount;
  const tightSkills = headcount.skill_coverage.filter((item) => item.status !== "ok");

  return (
    <section className="panel planning-panel" aria-labelledby="planning-title">
      <div className="panel-head">
        <div>
          <span className="eyebrow">{t("planning.eyebrow")}</span>
          <h2 id="planning-title">{t("planning.title")}</h2>
        </div>
        <span className="panel-chip">{t("planning.chip")}</span>
      </div>

      <div className="mini-stat-grid">
        <div className="mini-stat">
          <span>{t("planning.theoretical.label")}</span>
          <strong>{formatNumber(capacity.theoretical_capacity_per_shift, 1)}</strong>
          <small>{t("planning.theoretical.note")}</small>
        </div>
        <div className="mini-stat mini-stat-accent">
          <span>{t("planning.bottleneck.label")}</span>
          <strong>{formatNumber(capacity.bottleneck_capacity_per_shift, 1)}</strong>
          <small>{t("planning.bottleneck.note")}</small>
        </div>
        <div className="mini-stat">
          <span>{t("planning.requiredHc.label")}</span>
          <strong>{formatNumber(capacity.required_hc, 2)}</strong>
          <small>{t("planning.requiredHc.note")}</small>
        </div>
        <div className="mini-stat">
          <span>{t("planning.availableHc.label")}</span>
          <strong>{capacity.available_hc}</strong>
          <small>{t("planning.availableHc.note")}</small>
        </div>
        <div className="mini-stat">
          <span>{t("planning.periodTarget.label")}</span>
          <strong>
            {formatNumber(capacity.period_target_qty, 0)}
            {t("unit.piecesSuffix")}
          </strong>
          <small>
            {t("planning.periodTarget.note", { days: capacity.working_days })}
          </small>
        </div>
        <div className="mini-stat">
          <span>{t("planning.periodCapacity.label")}</span>
          <strong>
            {formatNumber(capacity.period_capacity, 1)}
            {t("unit.piecesSuffix")}
          </strong>
          <small>
            {t("planning.periodCapacity.note", {
              value: formatNumber(capacity.capacity_gap, 1),
            })}
          </small>
        </div>
      </div>

      <div className="capacity-callout">
        <strong>
          {t("planning.periodAchievement", {
            pct: formatPct(capacity.capacity_achievement_pct, 2),
          })}
        </strong>
        <span>
          {t("planning.callout", {
            pct: formatPct(capacity.theoretical_capacity_achievement_pct, 1),
          })}
        </span>
      </div>

      <div className="planning-split">
        <div className="planning-block">
          <div className="subhead">
            <h3>{t("planning.machine.title")}</h3>
            <span className="tiny-note">{t("planning.machine.note")}</span>
          </div>
          <div className="table-wrap">
            <table className="data-table compact-table">
              <thead>
                <tr>
                  <th>{t("planning.machine.col.type")}</th>
                  <th className="num">{t("planning.machine.col.required")}</th>
                  <th className="num">{t("planning.machine.col.available")}</th>
                  <th className="num">{t("planning.machine.col.gap")}</th>
                  <th className="num">{t("planning.machine.col.coverage")}</th>
                </tr>
              </thead>
              <tbody>
                {capacity.machine_requirements.map((item) => (
                  <tr key={item.machine_type}>
                    <td>{machineTypeLabel(item.machine_type, t)}</td>
                    <td className="num">{item.required_stations}</td>
                    <td className="num">{item.available_capacity}</td>
                    <td
                      className={cx(
                        "num",
                        item.gap < 0 ? "delta-good" : item.gap > 0 ? "delta-bad" : "",
                      )}
                    >
                      {item.gap > 0 ? `+${item.gap}` : item.gap}
                    </td>
                    <td className="num">{formatPct(item.coverage_pct, 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="panel-footnote">{t("planning.machine.footnote")}</p>
        </div>

        <div className="planning-block">
          <div className="subhead">
            <h3>{t("planning.hc.title")}</h3>
            <span className="tiny-note">{t("planning.hc.note")}</span>
          </div>
          <div className="hc-strip">
            <div>
              <span>{t("planning.hc.standard")}</span>
              <strong>{headcount.standard_hc}</strong>
            </div>
            <div>
              <span>{t("planning.hc.planned")}</span>
              <strong>{headcount.planned_hc}</strong>
            </div>
            <div>
              <span>{t("planning.hc.actual")}</span>
              <strong>{headcount.actual_hc}</strong>
            </div>
            <div>
              <span>{t("planning.hc.attendance")}</span>
              <strong>{headcount.attendance_hc}</strong>
            </div>
            <div className="hc-accent">
              <span>{t("planning.hc.optimized")}</span>
              <strong>{headcount.optimized_hc}</strong>
            </div>
            <div>
              <span>{t("planning.hc.adherence")}</span>
              <strong>{formatPct(headcount.adherence_pct, 1)}</strong>
            </div>
            <div>
              <span>{t("planning.hc.attendancePct")}</span>
              <strong>{formatPct(headcount.attendance_pct, 1)}</strong>
            </div>
          </div>

          {tightSkills.length > 0 ? (
            <div className="skill-watch">
              <span className="tiny-note">{t("planning.skill.title")}</span>
              <ul>
                {tightSkills.slice(0, 4).map((item) => (
                  <li key={item.operation_id}>
                    <span className={`status-dot status-${item.status}`} />
                    <strong>{item.operation_id}</strong>{" "}
                    {displayOperationName(
                      { id: item.operation_id, name: item.operation_name },
                      language,
                    )}
                    <em>
                      {t("planning.skill.item", {
                        grade: item.required_grade,
                        count: item.eligible_workers,
                      })}
                    </em>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="skill-ok">{t("planning.skill.ok")}</p>
          )}

          {headcount.transfer_suggestions.length > 0 ? (
            <div className="transfer-note">
              <span className="tiny-note">{t("planning.transfer.title")}</span>
              {headcount.transfer_suggestions.slice(0, 3).map((item) => (
                <p key={item.worker_id}>
                  <strong>{item.worker_id}</strong>{" "}
                  {t("planning.transfer.reason", {
                    name: item.worker_name,
                    station:
                      result.kpis?.bottleneck_station.toString().padStart(2, "0") ??
                      "—",
                    load: formatNumber(result.kpis?.bottleneck_load_sec, 1),
                  })}
                </p>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
