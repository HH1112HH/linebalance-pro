import { useEffect, useState } from "react";
import { getLayoutCaseStudy } from "../api";
import CaseKpiCard from "./CaseKpiCard";
import { apiErrorMessage, useLanguage } from "../i18n";
import type { MessageKey } from "../i18n";
import type {
  LayoutCaseStudyResult,
  LayoutPhaseSummary,
  LayoutRouteTrial,
} from "../types";
import { formatNumber, formatSigned } from "../utils";

const ERGO_KEYS: MessageKey[] = [
  "layout.ergo.reach",
  "layout.ergo.lift",
  "layout.ergo.push",
  "layout.ergo.posture",
  "layout.ergo.lighting",
  "layout.ergo.aisle",
  "layout.ergo.safety",
];

const CONTROL_KEYS: MessageKey[] = [
  "layout.control.1",
  "layout.control.2",
  "layout.control.3",
  "layout.control.4",
  "layout.control.5",
];

type CaseState =
  | { status: "loading" }
  | { status: "success"; data: LayoutCaseStudyResult }
  | { status: "error"; error: string };

export default function LayoutErgoPanel() {
  const { language, t } = useLanguage();
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<CaseState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    getLayoutCaseStudy()
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
      <section className="panel" aria-label={t("page.layout.title")}>
        <div className="empty-state" role="status" aria-live="polite">
          {t("caseStudy.loading")}
        </div>
      </section>
    );
  }

  if (state.status === "error") {
    return (
      <section className="panel" aria-label={t("page.layout.title")}>
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
      <section className="panel" aria-label={t("page.layout.title")}>
        <div className="empty-state">{t("caseStudy.empty")}</div>
      </section>
    );
  }

  return (
    <>
      <LayoutOverview data={state.data} before={before} after={after} />
      <LayoutTrials data={state.data} />
      <LayoutDiagram data={state.data} />
      <div className="page-grid">
        <LayoutErgonomics />
        <LayoutControl
          savedMinutes={before.time_per_shift_min - after.time_per_shift_min}
        />
      </div>
    </>
  );
}

function LayoutOverview({
  data,
  before,
  after,
}: {
  data: LayoutCaseStudyResult;
  before: LayoutPhaseSummary;
  after: LayoutPhaseSummary;
}) {
  const { t } = useLanguage();
  const distanceDelta = -data.distance_reduction_pct;
  const timeDelta = -data.time_reduction_pct;
  const crossingsDelta =
    data.crossings_per_shift_after - data.crossings_per_shift_before;
  const shiftTimeDelta = after.time_per_shift_min - before.time_per_shift_min;

  return (
    <section className="panel layout-overview" aria-label={t("layout.kpi.aria")}>
      <div className="panel-head">
        <div>
          <span className="eyebrow">
            {data.line_id} · {data.station_id}
          </span>
          <h2>
            {t("layout.diagram.station")} · {t("layout.diagram.pou")}
          </h2>
        </div>
        <span className="panel-chip chip-muted">{t("caseStudy.synthetic")}</span>
      </div>

      <div className="case-kpi-grid">
        <CaseKpiCard
          label={t("layout.kpi.distance")}
          before={`${formatNumber(before.mean_distance_m, 1)} m`}
          after={`${formatNumber(after.mean_distance_m, 1)} m`}
          delta={formatSigned(distanceDelta, 2, "%")}
          hint={t("layout.kpi.perTrip")}
          tone="good"
        />
        <CaseKpiCard
          label={t("layout.kpi.time")}
          before={`${formatNumber(before.mean_time_min, 1)} min`}
          after={`${formatNumber(after.mean_time_min, 1)} min`}
          delta={formatSigned(timeDelta, 2, "%")}
          hint={t("layout.kpi.perTrip")}
          tone="good"
        />
        <CaseKpiCard
          label={t("layout.kpi.crossings")}
          before={formatNumber(data.crossings_per_shift_before, 0)}
          after={formatNumber(data.crossings_per_shift_after, 0)}
          delta={formatSigned(crossingsDelta, 0)}
          hint={t("layout.kpi.perShift", { trips: data.trips_per_shift })}
          tone="good"
        />
        <CaseKpiCard
          label={t("layout.kpi.timePerShift")}
          before={`${formatNumber(before.time_per_shift_min, 1)} min`}
          after={`${formatNumber(after.time_per_shift_min, 1)} min`}
          delta={formatSigned(shiftTimeDelta, 1, " min")}
          hint={t("layout.kpi.perShift", { trips: data.trips_per_shift })}
          tone="good"
        />
      </div>
    </section>
  );
}

function LayoutTrials({ data }: { data: LayoutCaseStudyResult }) {
  const { t } = useLanguage();

  return (
    <section className="panel layout-trials" aria-label={t("layout.trials.title")}>
      <div className="panel-head">
        <div>
          <span className="eyebrow">
            {data.line_id} · {data.station_id}
          </span>
          <h2>{t("layout.trials.title")}</h2>
        </div>
      </div>
      <p className="panel-intro">{t("layout.trials.hint")}</p>

      <div className="table-wrap">
        <table className="data-table layout-trials-table">
          <thead>
            <tr>
              <th scope="col">{t("caseStudy.phase")}</th>
              <th scope="col">{t("layout.trials.trial")}</th>
              <th scope="col">{t("layout.trials.distance")}</th>
              <th scope="col">{t("layout.trials.time")}</th>
              <th scope="col" className="num">
                {t("layout.trials.crossings")}
              </th>
            </tr>
          </thead>
          {data.phases.map((phase) => (
            <tbody key={phase.phase}>
              {trialsFor(data.trials, phase.phase).map((trial) => (
                <tr key={`${trial.phase}-${trial.trial}`}>
                  <td>
                    <span
                      className={`phase-chip ${trial.phase === "BEFORE" ? "is-before" : "is-after"}`}
                    >
                      {trial.phase === "BEFORE"
                        ? t("caseStudy.before")
                        : t("caseStudy.after")}
                    </span>
                  </td>
                  <td className="num">{trial.trial}</td>
                  <td className="num">{formatNumber(trial.distance_m, 1)}</td>
                  <td className="num">{formatNumber(trial.time_min, 1)}</td>
                  <td className="num">{trial.crossings}</td>
                </tr>
              ))}
              <tr className="layout-mean-row">
                <td colSpan={2}>{t("layout.trials.mean")}</td>
                <td className="num">{formatNumber(phase.mean_distance_m, 1)}</td>
                <td className="num">{formatNumber(phase.mean_time_min, 1)}</td>
                <td className="num">{formatNumber(phase.mean_crossings, 1)}</td>
              </tr>
            </tbody>
          ))}
        </table>
      </div>
    </section>
  );
}

function trialsFor(
  trials: LayoutRouteTrial[],
  phase: LayoutRouteTrial["phase"],
): LayoutRouteTrial[] {
  return trials
    .filter((trial) => trial.phase === phase)
    .sort((left, right) => left.trial - right.trial);
}

function LayoutDiagram({ data }: { data: LayoutCaseStudyResult }) {
  const { t } = useLanguage();

  return (
    <section className="panel layout-diagram" aria-label={t("layout.diagram.title")}>
      <div className="panel-head">
        <div>
          <span className="eyebrow">
            {t("layout.kpi.perShift", { trips: data.trips_per_shift })}
          </span>
          <h2>{t("layout.diagram.title")}</h2>
        </div>
      </div>
      <p className="panel-intro">{t("layout.diagram.hint")}</p>

      <div className="diagram-grid">
        <figure className="diagram-figure">
          <figcaption>{t("layout.diagram.before")}</figcaption>
          <BeforeRouteSvg />
          <p className="diagram-note">{t("layout.diagram.fetch")}</p>
        </figure>
        <figure className="diagram-figure">
          <figcaption>{t("layout.diagram.after")}</figcaption>
          <AfterRouteSvg />
          <p className="diagram-note">{t("layout.diagram.shortTrip")}</p>
        </figure>
      </div>

      <div className="diagram-key">
        <span>
          <i className="legend-swatch is-aisle" aria-hidden="true" />
          {t("layout.diagram.aisle")}
        </span>
        <span>
          <i className="legend-swatch is-handler" aria-hidden="true" />
          {t("layout.diagram.handler")}
        </span>
      </div>
    </section>
  );
}

function BeforeRouteSvg() {
  const { t } = useLanguage();

  return (
    <svg
      className="diagram-svg"
      viewBox="0 0 320 190"
      role="img"
      aria-label={t("layout.diagram.before")}
    >
      <title>{t("layout.diagram.before")}</title>
      <defs>
        <marker
          id="layout-arrow-before"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M0,0 L10,5 L0,10 z" className="diagram-arrowhead is-before" />
        </marker>
      </defs>

      <rect x="132" y="18" width="40" height="154" rx="6" className="diagram-aisle" />
      <text x="152" y="184" textAnchor="middle" className="diagram-caption">
        {t("layout.diagram.aisle")}
      </text>

      <rect
        x="14"
        y="72"
        width="80"
        height="58"
        rx="8"
        className="diagram-node is-station"
      />
      <text x="54" y="105" textAnchor="middle" className="diagram-label">
        {t("layout.diagram.station")}
      </text>

      <rect
        x="218"
        y="50"
        width="88"
        height="100"
        rx="8"
        className="diagram-node is-store"
      />
      <text x="262" y="105" textAnchor="middle" className="diagram-label">
        {t("layout.diagram.supermarketShort")}
      </text>

      <polyline
        points="94,112 120,112 120,52 200,52 200,120 94,120"
        className="diagram-route is-before"
        markerEnd="url(#layout-arrow-before)"
      />
      <circle cx="152" cy="52" r="4.5" className="diagram-cross" />
      <circle cx="152" cy="120" r="4.5" className="diagram-cross" />
    </svg>
  );
}

function AfterRouteSvg() {
  const { t } = useLanguage();

  return (
    <svg
      className="diagram-svg"
      viewBox="0 0 320 190"
      role="img"
      aria-label={t("layout.diagram.after")}
    >
      <title>{t("layout.diagram.after")}</title>
      <defs>
        <marker
          id="layout-arrow-after"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M0,0 L10,5 L0,10 z" className="diagram-arrowhead is-after" />
        </marker>
        <marker
          id="layout-arrow-handler"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M0,0 L10,5 L0,10 z" className="diagram-arrowhead is-handler" />
        </marker>
      </defs>

      <rect
        x="14"
        y="72"
        width="80"
        height="58"
        rx="8"
        className="diagram-node is-station"
      />
      <text x="54" y="105" textAnchor="middle" className="diagram-label">
        {t("layout.diagram.station")}
      </text>

      <rect
        x="150"
        y="80"
        width="76"
        height="44"
        rx="8"
        className="diagram-node is-pou"
      />
      <text x="188" y="106" textAnchor="middle" className="diagram-label">
        POU
      </text>

      <line
        x1="94"
        y1="102"
        x2="146"
        y2="102"
        className="diagram-route is-after"
        markerEnd="url(#layout-arrow-after)"
      />
      <path
        d="M254 16 V102 H228"
        className="diagram-route is-handler"
        markerEnd="url(#layout-arrow-handler)"
      />
    </svg>
  );
}

function LayoutErgonomics() {
  const { t } = useLanguage();

  return (
    <section className="panel layout-ergo" aria-label={t("layout.ergo.title")}>
      <div className="panel-head">
        <div>
          <span className="eyebrow">EHS</span>
          <h2>{t("layout.ergo.title")}</h2>
        </div>
      </div>
      <p className="panel-intro">{t("layout.ergo.hint")}</p>

      <ul className="ergo-list">
        {ERGO_KEYS.map((key) => (
          <li key={key}>
            <span className="ergo-check" aria-hidden="true">
              ✓
            </span>
            <span>{t(key)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function LayoutControl({ savedMinutes }: { savedMinutes: number }) {
  const { t } = useLanguage();

  return (
    <section className="panel layout-control" aria-label={t("layout.control.title")}>
      <div className="panel-head">
        <div>
          <span className="eyebrow">{t("layout.diagram.station")}</span>
          <h2>{t("layout.control.title")}</h2>
        </div>
        <span className="panel-chip chip-muted">{CONTROL_KEYS.length}</span>
      </div>

      <ol className="action-list">
        {CONTROL_KEYS.map((key) => (
          <li key={key}>{t(key)}</li>
        ))}
      </ol>

      <p className="reaction-callout">{t("layout.control.reaction")}</p>

      <div className="caveat-block">
        <strong>{t("layout.caveats.title")}</strong>
        <ul className="note-list">
          <li>{t("layout.caveats.1", { minutes: formatNumber(savedMinutes, 1) })}</li>
          <li>{t("layout.caveats.2")}</li>
          <li>{t("layout.caveats.3")}</li>
          <li>{t("layout.caveats.4")}</li>
        </ul>
      </div>
    </section>
  );
}
