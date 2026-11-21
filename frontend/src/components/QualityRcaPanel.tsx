import { useEffect, useState } from "react";
import { getQualityCaseStudy } from "../api";
import CaseKpiCard from "./CaseKpiCard";
import { apiErrorMessage, useLanguage } from "../i18n";
import type { MessageKey, Translate } from "../i18n";
import type {
  CaseStudyPhase,
  QualityCaseStudyResult,
  QualityParetoRow,
  QualityPhaseSummary,
} from "../types";
import { formatNumber, formatPct, formatSigned } from "../utils";

const DEFECT_LABEL_KEYS: Record<string, MessageKey> = {
  MISALIGNMENT: "quality.defect.MISALIGNMENT",
  UNEVEN_WIDTH: "quality.defect.UNEVEN_WIDTH",
  PUCKERING: "quality.defect.PUCKERING",
  SKIPPED_STITCH: "quality.defect.SKIPPED_STITCH",
};

const DEFECT_SHORT_KEYS: Record<string, MessageKey> = {
  MISALIGNMENT: "quality.defectShort.MISALIGNMENT",
  UNEVEN_WIDTH: "quality.defectShort.UNEVEN_WIDTH",
  PUCKERING: "quality.defectShort.PUCKERING",
  SKIPPED_STITCH: "quality.defectShort.SKIPPED_STITCH",
};

const COUNTER_KEYS: MessageKey[] = [
  "quality.counter.1",
  "quality.counter.2",
  "quality.counter.3",
  "quality.counter.4",
  "quality.counter.5",
];

const CONTROL_KEYS: MessageKey[] = [
  "quality.control.1",
  "quality.control.2",
  "quality.control.3",
  "quality.control.4",
  "quality.control.5",
];

interface FishboneBranch {
  id: string;
  labelKey: MessageKey;
  hypothesisKey: MessageKey;
  evidenceKey: MessageKey;
  conclusionKey: MessageKey;
  root: boolean;
}

const FISHBONE_BRANCHES: FishboneBranch[] = [
  {
    id: "man",
    labelKey: "quality.fishbone.man",
    hypothesisKey: "quality.fishbone.man.hypothesis",
    evidenceKey: "quality.fishbone.man.evidence",
    conclusionKey: "quality.fishbone.man.conclusion",
    root: false,
  },
  {
    id: "machine",
    labelKey: "quality.fishbone.machine",
    hypothesisKey: "quality.fishbone.machine.hypothesis",
    evidenceKey: "quality.fishbone.machine.evidence",
    conclusionKey: "quality.fishbone.machine.conclusion",
    root: false,
  },
  {
    id: "method",
    labelKey: "quality.fishbone.method",
    hypothesisKey: "quality.fishbone.method.hypothesis",
    evidenceKey: "quality.fishbone.method.evidence",
    conclusionKey: "quality.fishbone.method.conclusion",
    root: true,
  },
  {
    id: "material",
    labelKey: "quality.fishbone.material",
    hypothesisKey: "quality.fishbone.material.hypothesis",
    evidenceKey: "quality.fishbone.material.evidence",
    conclusionKey: "quality.fishbone.material.conclusion",
    root: false,
  },
];

type CaseState =
  | { status: "loading" }
  | { status: "success"; data: QualityCaseStudyResult }
  | { status: "error"; error: string };

export default function QualityRcaPanel() {
  const { language, t } = useLanguage();
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<CaseState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    getQualityCaseStudy()
      .then((data) => {
        if (!cancelled) setState({ status: "success", data });
      })
      .catch((caught: unknown) => {
        if (!cancelled) {
          setState({
            status: "error",
            error: caught instanceof Error ? caught.message : String(caught),
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  if (state.status === "loading") {
    return (
      <section className="panel" aria-label={t("page.quality.title")}>
        <div className="empty-state" role="status" aria-live="polite">
          {t("caseStudy.loading")}
        </div>
      </section>
    );
  }

  if (state.status === "error") {
    return (
      <section className="panel" aria-label={t("page.quality.title")}>
        <div className="flow-error" role="alert">
          <p>{apiErrorMessage(state.error, language, t) || t("caseStudy.error")}</p>
          <button
            className="secondary-button is-compact"
            type="button"
            onClick={() => {
              setState({ status: "loading" });
              setAttempt((current) => current + 1);
            }}
          >
            {t("caseStudy.retry")}
          </button>
        </div>
      </section>
    );
  }

  const before = state.data.phases.find((phase) => phase.phase === "BEFORE");
  const after = state.data.phases.find((phase) => phase.phase === "AFTER");
  if (!before || !after) {
    return (
      <section className="panel" aria-label={t("page.quality.title")}>
        <div className="empty-state">{t("caseStudy.empty")}</div>
      </section>
    );
  }

  return (
    <>
      <QualityOverview data={state.data} before={before} after={after} />
      <QualityPareto data={state.data} before={before} after={after} />
      <QualityFishbone />
      <QualityVerification data={state.data} />
      <div className="page-grid">
        <QualityActions
          eyebrow={state.data.operation_id}
          titleKey="quality.counter.title"
          keys={COUNTER_KEYS}
        />
        <QualityActions
          eyebrow={state.data.operation_id}
          titleKey="quality.control.title"
          keys={CONTROL_KEYS}
        />
      </div>
      <QualitySigma data={state.data} before={before} after={after} />
    </>
  );
}

function QualityOverview({
  data,
  before,
  after,
}: {
  data: QualityCaseStudyResult;
  before: QualityPhaseSummary;
  after: QualityPhaseSummary;
}) {
  const { t } = useLanguage();
  const misalignment = data.defect_types.find(
    (row) => row.defect_code === "MISALIGNMENT",
  );
  const rateDelta = after.defect_rate_pct - before.defect_rate_pct;
  const fpyDelta = after.first_pass_yield_pct - before.first_pass_yield_pct;
  const reworkDelta = after.rework_min_total - before.rework_min_total;

  return (
    <section className="panel quality-overview" aria-label={t("quality.kpi.aria")}>
      <div className="panel-head">
        <div>
          <span className="eyebrow">
            {data.operation_id} · {data.operation_name}
          </span>
          <h2>
            {data.line_id} · {data.style_code}
          </h2>
        </div>
        <span className="panel-chip chip-muted">{t("caseStudy.synthetic")}</span>
      </div>

      <div className="case-meta">
        <span>
          {t("caseStudy.before")}: {before.start_date} → {before.end_date} ·{" "}
          {t("caseStudy.days", { days: before.days })} ·{" "}
          {formatNumber(before.inspected_pcs, 0)} pcs
        </span>
        <span>
          {t("caseStudy.after")}: {after.start_date} → {after.end_date} ·{" "}
          {t("caseStudy.days", { days: after.days })} ·{" "}
          {formatNumber(after.inspected_pcs, 0)} pcs
        </span>
      </div>

      <div className="case-kpi-grid">
        <CaseKpiCard
          label={t("quality.kpi.defectRate")}
          before={formatPct(before.defect_rate_pct, 2)}
          after={formatPct(after.defect_rate_pct, 2)}
          delta={`${formatSigned(rateDelta, 2)} ${t("caseStudy.pp")}`}
          hint={t("quality.kpi.perPhase")}
          tone={rateDelta <= 0 ? "good" : "bad"}
        />
        <CaseKpiCard
          label={t("quality.kpi.fpy")}
          before={formatPct(before.first_pass_yield_pct, 2)}
          after={formatPct(after.first_pass_yield_pct, 2)}
          delta={`${formatSigned(fpyDelta, 2)} ${t("caseStudy.pp")}`}
          hint={t("quality.kpi.fpyHint")}
          tone={fpyDelta >= 0 ? "good" : "bad"}
        />
        <CaseKpiCard
          label={t("quality.kpi.rework")}
          before={`${formatNumber(before.rework_min_total, 0)} min`}
          after={`${formatNumber(after.rework_min_total, 0)} min`}
          delta={`${formatSigned(reworkDelta, 0)} min`}
          hint={t("quality.kpi.reworkHint")}
          tone={reworkDelta <= 0 ? "good" : "bad"}
        />
        <CaseKpiCard
          label={t("quality.kpi.misalignment")}
          before={misalignment ? formatNumber(misalignment.before_count, 0) : "—"}
          after={misalignment ? formatNumber(misalignment.after_count, 0) : "—"}
          delta={
            misalignment
              ? `${formatSigned(misalignment.delta_count, 0)} · ${formatSigned(
                  misalignment.delta_pct,
                  2,
                  "%",
                )}`
              : "—"
          }
          hint={t("quality.kpi.misalignmentHint")}
          tone={misalignment && misalignment.delta_count <= 0 ? "good" : "bad"}
        />
      </div>
    </section>
  );
}

function QualityPareto({
  data,
  before,
  after,
}: {
  data: QualityCaseStudyResult;
  before: QualityPhaseSummary;
  after: QualityPhaseSummary;
}) {
  const { t } = useLanguage();
  const topTwo = before.pareto.slice(0, 2).reduce((sum, row) => sum + row.share_pct, 0);
  const topAfter = after.pareto[0];

  return (
    <section className="panel quality-pareto" aria-label={t("quality.pareto.title")}>
      <div className="panel-head">
        <div>
          <span className="eyebrow">
            {t("caseStudy.before")} / {t("caseStudy.after")}
          </span>
          <h2>{t("quality.pareto.title")}</h2>
        </div>
        <span className="panel-chip chip-muted">
          {t("caseStudy.days", { days: before.days })}
        </span>
      </div>
      <p className="panel-intro">{t("quality.pareto.hint")}</p>

      <div className="pareto-grid">
        <figure className="pareto-figure">
          <figcaption>
            <span className="pareto-phase is-before">{t("caseStudy.before")}</span>
            <span>
              {t("quality.pareto.defects", {
                count: formatNumber(before.defect_count, 0),
              })}
            </span>
          </figcaption>
          <ParetoChart phase="BEFORE" rows={before.pareto} />
        </figure>
        <figure className="pareto-figure">
          <figcaption>
            <span className="pareto-phase is-after">{t("caseStudy.after")}</span>
            <span>
              {t("quality.pareto.defects", {
                count: formatNumber(after.defect_count, 0),
              })}
            </span>
          </figcaption>
          <ParetoChart phase="AFTER" rows={after.pareto} />
        </figure>
      </div>

      <div className="chart-legend">
        <span>
          <i className="legend-swatch is-bar" aria-hidden="true" />
          {t("quality.pareto.count")}
        </span>
        <span>
          <i className="legend-swatch is-line" aria-hidden="true" />
          {t("quality.pareto.cumulative")}
        </span>
      </div>

      <div className="pareto-notes">
        <p>{t("quality.pareto.top2", { pct: formatNumber(topTwo, 2) })}</p>
        {topAfter ? (
          <p>
            {t("quality.pareto.followUp", {
              defect: defectLabel(topAfter.defect_code, topAfter.defect_type, t),
            })}
          </p>
        ) : null}
      </div>

      <div className="table-wrap">
        <table className="data-table quality-defect-table">
          <thead>
            <tr>
              <th scope="col">{t("quality.breakdown.type")}</th>
              <th scope="col" className="num">
                {t("caseStudy.before")}
              </th>
              <th scope="col" className="num">
                {t("caseStudy.after")}
              </th>
              <th scope="col" className="num">
                {t("quality.breakdown.delta")}
              </th>
              <th scope="col" className="num">
                {t("quality.breakdown.deltaPct")}
              </th>
            </tr>
          </thead>
          <tbody>
            {data.defect_types.map((row) => (
              <tr key={row.defect_code}>
                <td>
                  <span className="row-label">
                    {defectLabel(row.defect_code, row.defect_type, t)}
                  </span>
                  <span className="row-note">{row.defect_code}</span>
                </td>
                <td className="num">{formatNumber(row.before_count, 0)}</td>
                <td className="num">{formatNumber(row.after_count, 0)}</td>
                <td className="num">
                  <span
                    className={
                      row.delta_count < 0 ? "delta delta-good" : "delta delta-flat"
                    }
                  >
                    {formatSigned(row.delta_count, 0)}
                  </span>
                </td>
                <td className="num">
                  {row.delta_pct === null ? "—" : formatSigned(row.delta_pct, 2, "%")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

const CHART_WIDTH = 340;
const CHART_HEIGHT = 214;
const CHART_TOP = 18;
const CHART_BOTTOM = 56;
const CHART_LEFT = 30;
const CHART_RIGHT = 34;
const PLOT_WIDTH = CHART_WIDTH - CHART_LEFT - CHART_RIGHT;
const PLOT_HEIGHT = CHART_HEIGHT - CHART_TOP - CHART_BOTTOM;

function ParetoChart({
  phase,
  rows,
}: {
  phase: CaseStudyPhase;
  rows: QualityParetoRow[];
}) {
  const { t } = useLanguage();
  const maxCount = Math.max(1, ...rows.map((row) => row.count));
  const slot = PLOT_WIDTH / Math.max(1, rows.length);
  const barWidth = Math.min(46, slot * 0.56);
  const baseline = CHART_TOP + PLOT_HEIGHT;
  const phaseLabel = phase === "BEFORE" ? t("caseStudy.before") : t("caseStudy.after");

  const bars = rows.map((row, index) => {
    const height = (row.count / maxCount) * PLOT_HEIGHT;
    const x = CHART_LEFT + slot * index + (slot - barWidth) / 2;
    const y = baseline - height;
    return {
      row,
      x,
      y,
      height,
      center: CHART_LEFT + slot * (index + 0.5),
    };
  });

  const linePoints = bars
    .map((bar) => {
      const y = CHART_TOP + PLOT_HEIGHT - (bar.row.cumulative_pct / 100) * PLOT_HEIGHT;
      return `${bar.center},${y}`;
    })
    .join(" ");

  return (
    <svg
      className="pareto-svg"
      viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
      role="img"
      aria-label={`${t("quality.pareto.title")} — ${phaseLabel}`}
    >
      <title>{`${t("quality.pareto.title")} — ${phaseLabel}`}</title>
      {[0, 25, 50, 75, 100].map((tick) => {
        const y = CHART_TOP + PLOT_HEIGHT - (tick / 100) * PLOT_HEIGHT;
        return (
          <g key={tick}>
            <line
              x1={CHART_LEFT}
              y1={y}
              x2={CHART_LEFT + PLOT_WIDTH}
              y2={y}
              className="pareto-grid-line"
            />
            <text
              x={CHART_LEFT + PLOT_WIDTH + 6}
              y={y + 3}
              className="pareto-axis-label"
              textAnchor="start"
            >
              {tick}%
            </text>
          </g>
        );
      })}

      {bars.map((bar) => (
        <g key={bar.row.defect_code}>
          <rect
            x={bar.x}
            y={bar.y}
            width={barWidth}
            height={Math.max(1, bar.height)}
            rx={3}
            className={`pareto-bar is-${phase === "BEFORE" ? "before" : "after"}`}
          >
            <title>
              {defectLabel(bar.row.defect_code, bar.row.defect_type, t)}:{" "}
              {bar.row.count}
            </title>
          </rect>
          <text
            x={bar.center}
            y={bar.y - 4}
            className="pareto-value-label"
            textAnchor="middle"
          >
            {bar.row.count}
          </text>
          <text
            x={bar.center}
            y={baseline + 14}
            className="pareto-axis-label"
            textAnchor="middle"
          >
            {shortDefectLabel(bar.row.defect_code, t)}
          </text>
          <text
            x={bar.center}
            y={baseline + 26}
            className="pareto-axis-label is-muted"
            textAnchor="middle"
          >
            {formatPct(bar.row.share_pct, 1)}
          </text>
        </g>
      ))}

      <polyline points={linePoints} className="pareto-line" />
      {bars.map((bar) => {
        const y =
          CHART_TOP + PLOT_HEIGHT - (bar.row.cumulative_pct / 100) * PLOT_HEIGHT;
        return (
          <circle
            key={`dot-${bar.row.defect_code}`}
            cx={bar.center}
            cy={y}
            r={3}
            className="pareto-dot"
          />
        );
      })}

      <line
        x1={CHART_LEFT}
        y1={baseline}
        x2={CHART_LEFT + PLOT_WIDTH}
        y2={baseline}
        className="pareto-baseline"
      />
    </svg>
  );
}

function QualityFishbone() {
  const { t } = useLanguage();

  return (
    <section
      className="panel quality-fishbone"
      aria-label={t("quality.fishbone.title")}
    >
      <div className="panel-head">
        <div>
          <span className="eyebrow">{t("quality.fishbone.effect")}</span>
          <h2>{t("quality.fishbone.title")}</h2>
        </div>
        <span className="panel-chip chip-alert">{t("quality.fishbone.rootCause")}</span>
      </div>
      <p className="panel-intro">{t("quality.fishbone.hint")}</p>

      <div className="fishbone-grid">
        {FISHBONE_BRANCHES.map((branch) => (
          <article
            key={branch.id}
            className={`fishbone-card${branch.root ? " is-root" : ""}`}
          >
            <header>
              <h3>{t(branch.labelKey)}</h3>
              <span className={`fishbone-status ${branch.root ? "is-root" : ""}`}>
                {branch.root
                  ? t("quality.fishbone.rootCause")
                  : t("quality.fishbone.notConfirmed")}
              </span>
            </header>
            <dl>
              <div>
                <dt>{t("quality.fishbone.hypothesisLabel")}</dt>
                <dd>{t(branch.hypothesisKey)}</dd>
              </div>
              <div>
                <dt>{t("quality.fishbone.evidenceLabel")}</dt>
                <dd>{t(branch.evidenceKey)}</dd>
              </div>
              <div>
                <dt>{t("quality.fishbone.conclusionLabel")}</dt>
                <dd>{t(branch.conclusionKey)}</dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
    </section>
  );
}

function QualityVerification({ data }: { data: QualityCaseStudyResult }) {
  const { t } = useLanguage();
  const summary = data.setup_audit_summary;

  return (
    <section
      className="panel quality-verification"
      aria-label={t("quality.audit.title")}
    >
      <div className="panel-head">
        <div>
          <span className="eyebrow">
            {t("quality.audit.changeover")} · {data.setup_audit.length}
          </span>
          <h2>{t("quality.audit.title")}</h2>
        </div>
        <span className="panel-chip chip-muted">
          {formatPct(summary.before_misalignment_share_pct, 2)}
        </span>
      </div>
      <p className="panel-intro">
        {t("quality.audit.hint", {
          count: summary.before_misalignment_after_changeover,
          total: summary.before_total_misalignment,
          pct: formatNumber(summary.before_misalignment_share_pct, 2),
          guide: summary.before_guide_present,
          changeovers: summary.before_changeovers,
        })}
      </p>

      <div className="quality-verification-grid">
        <div>
          <ol className="why-list">
            {(
              [
                "quality.fiveWhy.1",
                "quality.fiveWhy.2",
                "quality.fiveWhy.3",
                "quality.fiveWhy.4",
                "quality.fiveWhy.5",
              ] as MessageKey[]
            ).map((key) => (
              <li key={key}>{t(key)}</li>
            ))}
          </ol>
        </div>

        <div className="table-wrap">
          <table className="data-table quality-audit-table">
            <thead>
              <tr>
                <th scope="col">{t("quality.audit.changeover")}</th>
                <th scope="col">{t("quality.audit.guide")}</th>
                <th scope="col">{t("quality.audit.firstPiece")}</th>
                <th scope="col" className="num">
                  {t("quality.audit.misalignment")}
                </th>
              </tr>
            </thead>
            <tbody>
              {data.setup_audit.map((row) => (
                <tr key={`${row.phase}-${row.changeover_date}`}>
                  <td>
                    <span className="row-label">{row.changeover_date}</span>
                    <span className="row-note">
                      {row.phase === "BEFORE"
                        ? t("caseStudy.before")
                        : t("caseStudy.after")}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`audit-flag ${row.guide_present ? "is-yes" : "is-no"}`}
                    >
                      {row.guide_present
                        ? t("quality.audit.yes")
                        : t("quality.audit.no")}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`audit-flag ${row.first_piece_check ? "is-yes" : "is-no"}`}
                    >
                      {row.first_piece_check
                        ? t("quality.audit.yes")
                        : t("quality.audit.no")}
                    </span>
                  </td>
                  <td className="num">
                    <span
                      className={
                        row.misalignment_next_2h > 0
                          ? "delta delta-bad"
                          : "delta delta-good"
                      }
                    >
                      {formatNumber(row.misalignment_next_2h, 0)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="panel-footnote">
        {t("quality.audit.afterNote", {
          guide: summary.after_guide_present,
          changeovers: summary.after_changeovers,
          firstPiece: summary.after_first_piece_check,
        })}
      </p>
    </section>
  );
}

function QualityActions({
  eyebrow,
  titleKey,
  keys,
}: {
  eyebrow: string;
  titleKey: MessageKey;
  keys: MessageKey[];
}) {
  const { t } = useLanguage();

  return (
    <section className="panel quality-actions" aria-label={t(titleKey)}>
      <div className="panel-head">
        <div>
          <span className="eyebrow">{eyebrow}</span>
          <h2>{t(titleKey)}</h2>
        </div>
        <span className="panel-chip chip-muted">{keys.length}</span>
      </div>
      <ol className="action-list">
        {keys.map((key) => (
          <li key={key}>{t(key)}</li>
        ))}
      </ol>
    </section>
  );
}

function QualitySigma({
  data,
  before,
  after,
}: {
  data: QualityCaseStudyResult;
  before: QualityPhaseSummary;
  after: QualityPhaseSummary;
}) {
  const { t } = useLanguage();
  const test = data.two_proportion_test;
  const beforeChart = data.p_chart.find((row) => row.phase === "BEFORE");
  const afterChart = data.p_chart.find((row) => row.phase === "AFTER");

  return (
    <section className="panel quality-sigma" aria-label={t("quality.sigma.title")}>
      <div className="panel-head">
        <div>
          <span className="eyebrow">
            {t("quality.sigma.dpmo")} · {t("quality.sigma.z")}
          </span>
          <h2>{t("quality.sigma.title")}</h2>
        </div>
      </div>
      <p className="panel-intro">{t("quality.sigma.hint")}</p>

      <div className="sigma-grid">
        <article className="sigma-card">
          <span>{t("quality.sigma.dpmo")}</span>
          <strong>{formatNumber(before.dpmo, 0)}</strong>
          <small>→ {formatNumber(after.dpmo, 0)}</small>
        </article>
        <article className="sigma-card">
          <span>{t("quality.sigma.z")}</span>
          <strong>{formatNumber(before.z_benchmark, 2)}</strong>
          <small>→ {formatNumber(after.z_benchmark, 2)}</small>
        </article>
        <article className="sigma-card is-wide">
          <span>{t("quality.sigma.zTest")}</span>
          <strong>
            z = {formatNumber(test.z_stat, 2)} · p ≈ {formatPValue(test.p_value)}
          </strong>
          <small>
            {t("quality.sigma.zTestBody", {
              z: formatNumber(test.z_stat, 2),
              p: formatPValue(test.p_value),
              low: formatNumber(test.ci_low_pct, 2),
              high: formatNumber(test.ci_high_pct, 2),
            })}
          </small>
        </article>
      </div>

      {beforeChart && afterChart ? (
        <p className="panel-footnote">
          {t("quality.sigma.pChart", {
            beforeUcl: formatPct(beforeChart.ucl_pct, 2),
            afterUcl: formatPct(afterChart.ucl_pct, 2),
            outBefore: beforeChart.out_of_control_points,
            outAfter: afterChart.out_of_control_points,
            daysBefore: before.days,
            daysAfter: after.days,
          })}
        </p>
      ) : null}

      <div className="caveat-block">
        <strong>{t("quality.caveats.title")}</strong>
        <ul className="note-list">
          <li>{t("quality.caveats.1", { days: before.days })}</li>
          <li>{t("quality.caveats.2", { count: after.defect_count })}</li>
          <li>{t("quality.caveats.3")}</li>
          <li>{t("quality.caveats.4")}</li>
        </ul>
      </div>
    </section>
  );
}

function formatPValue(value: number): string {
  if (value <= 0) return "< 0.0001";
  return formatNumber(value, 4);
}

function defectLabel(code: string, fallback: string, t: Translate): string {
  const key = DEFECT_LABEL_KEYS[code];
  return key ? t(key) : fallback;
}

function shortDefectLabel(code: string, t: Translate): string {
  const key = DEFECT_SHORT_KEYS[code];
  return key ? t(key) : code;
}
