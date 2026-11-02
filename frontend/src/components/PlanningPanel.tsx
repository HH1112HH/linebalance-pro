import type { OptimizeResult } from "../types";
import { cx, formatNumber, formatPct } from "../utils";

interface Props {
  result: OptimizeResult;
}

export default function PlanningPanel({ result }: Props) {
  const planning = result.planning;
  if (!planning) {
    return (
      <section className="panel" aria-labelledby="planning-title">
        <div className="panel-head">
          <div>
            <span className="eyebrow">Capacity & HC</span>
            <h2 id="planning-title">Planning summary</h2>
          </div>
        </div>
        <div className="empty-state">No planning summary for this result.</div>
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
          <span className="eyebrow">Capacity & HC</span>
          <h2 id="planning-title">Planning summary</h2>
        </div>
        <span className="panel-chip">Bottleneck-constrained</span>
      </div>

      <div className="mini-stat-grid">
        <div className="mini-stat">
          <span>Theoretical capacity</span>
          <strong>{formatNumber(capacity.theoretical_capacity_per_shift, 1)}</strong>
          <small>pcs/shift · ignores balance</small>
        </div>
        <div className="mini-stat mini-stat-accent">
          <span>Bottleneck capacity</span>
          <strong>{formatNumber(capacity.bottleneck_capacity_per_shift, 1)}</strong>
          <small>pcs/shift · used for target</small>
        </div>
        <div className="mini-stat">
          <span>Required HC</span>
          <strong>{formatNumber(capacity.required_hc, 2)}</strong>
          <small>theoretical estimate</small>
        </div>
        <div className="mini-stat">
          <span>Available HC</span>
          <strong>{capacity.available_hc}</strong>
          <small>workers in scenario</small>
        </div>
        <div className="mini-stat">
          <span>Period target</span>
          <strong>{formatNumber(capacity.period_target_qty, 0)}</strong>
          <small>{capacity.working_days} working days</small>
        </div>
        <div className="mini-stat">
          <span>Period capacity</span>
          <strong>{formatNumber(capacity.period_capacity, 1)}</strong>
          <small>gap {formatNumber(capacity.capacity_gap, 1)} pcs</small>
        </div>
      </div>

      <div className="capacity-callout">
        <strong>
          {formatPct(capacity.capacity_achievement_pct, 2)} of period target
        </strong>
        <span>
          Theoretical capacity is{" "}
          {formatPct(capacity.theoretical_capacity_achievement_pct, 1)} of target, but
          it ignores precedence, machine and balance constraints. The bottleneck number
          is the honest planning number.
        </span>
      </div>

      <div className="subhead">
        <h3>Machine allocation coverage</h3>
        <span className="tiny-note">Not machine utilization</span>
      </div>
      <div className="table-wrap">
        <table className="data-table compact-table">
          <thead>
            <tr>
              <th>Machine type</th>
              <th className="num">Required stations</th>
              <th className="num">Available</th>
              <th className="num">Gap</th>
              <th className="num">Coverage</th>
            </tr>
          </thead>
          <tbody>
            {capacity.machine_requirements.map((item) => (
              <tr key={item.machine_type}>
                <td>{item.machine_type}</td>
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
      <p className="panel-footnote">
        Coverage compares required stations with available machine capacity. It does not
        measure runtime, speed loss or quality, so it must never be labelled machine
        utilization or OEE.
      </p>

      <div className="subhead">
        <h3>Headcount control</h3>
        <span className="tiny-note">Standard vs actual vs optimized</span>
      </div>
      <div className="hc-strip">
        <div>
          <span>Standard</span>
          <strong>{headcount.standard_hc}</strong>
        </div>
        <div>
          <span>Planned</span>
          <strong>{headcount.planned_hc}</strong>
        </div>
        <div>
          <span>Actual</span>
          <strong>{headcount.actual_hc}</strong>
        </div>
        <div>
          <span>Attendance</span>
          <strong>{headcount.attendance_hc}</strong>
        </div>
        <div className="hc-accent">
          <span>Optimized</span>
          <strong>{headcount.optimized_hc}</strong>
        </div>
        <div>
          <span>Adherence</span>
          <strong>{formatPct(headcount.adherence_pct, 1)}</strong>
        </div>
        <div>
          <span>Attendance</span>
          <strong>{formatPct(headcount.attendance_pct, 1)}</strong>
        </div>
      </div>

      {tightSkills.length > 0 ? (
        <div className="skill-watch">
          <span className="tiny-note">Skill coverage watch</span>
          <ul>
            {tightSkills.slice(0, 4).map((item) => (
              <li key={item.operation_id}>
                <span className={`status-dot status-${item.status}`} />
                <strong>{item.operation_id}</strong> {item.operation_name}
                <em>
                  grade {item.required_grade} · {item.eligible_workers} eligible
                </em>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="skill-ok">All skill coverage checks are OK.</p>
      )}

      {headcount.transfer_suggestions.length > 0 ? (
        <div className="transfer-note">
          <span className="tiny-note">Transfer suggestions</span>
          {headcount.transfer_suggestions.slice(0, 3).map((item) => (
            <p key={item.worker_id}>
              <strong>{item.worker_id}</strong> {item.reason}
            </p>
          ))}
        </div>
      ) : null}
    </section>
  );
}
