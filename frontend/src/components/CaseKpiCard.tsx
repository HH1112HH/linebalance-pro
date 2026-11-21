interface Props {
  label: string;
  before: string;
  after: string;
  delta: string;
  hint: string;
  tone: "good" | "bad";
}

export default function CaseKpiCard({
  label,
  before,
  after,
  delta,
  hint,
  tone,
}: Props) {
  return (
    <article className="case-kpi-card">
      <span className="case-kpi-label">{label}</span>
      <div className="case-kpi-values">
        <span className="case-kpi-before">{before}</span>
        <span className="case-kpi-arrow" aria-hidden="true">
          →
        </span>
        <span className="case-kpi-after">{after}</span>
      </div>
      <span className={`case-kpi-delta ${tone === "good" ? "is-good" : "is-bad"}`}>
        {delta}
      </span>
      <small>{hint}</small>
    </article>
  );
}
