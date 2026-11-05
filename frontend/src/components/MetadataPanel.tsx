import type { OptimizeResult } from "../types";
import {
  optimizationStatusLabel,
  severityLabel,
  useLanguage,
  warningMessage,
} from "../i18n";
import type { SampleRequest } from "../types";
import { cx, formatNumber } from "../utils";

interface Props {
  result: OptimizeResult;
  request: SampleRequest;
}

export default function MetadataPanel({ result, request }: Props) {
  const { language, t } = useLanguage();
  const metadata = result.metadata;
  const warnings = result.warnings;
  const critical = warnings.filter((item) => item.severity === "critical").length;
  const warning = warnings.filter((item) => item.severity === "warning").length;

  return (
    <section className="panel metadata-panel" aria-labelledby="run-title">
      <div className="panel-head">
        <div>
          <span className="eyebrow">{t("metadata.eyebrow")}</span>
          <h2 id="run-title">{t("metadata.title")}</h2>
        </div>
        <span
          className={cx(
            "status-pill",
            result.status === "OPTIMAL"
              ? "status-optimal"
              : result.status === "FEASIBLE_LIMIT"
                ? "status-watch"
                : "status-bottleneck",
          )}
        >
          {optimizationStatusLabel(result.status, t)}
        </span>
      </div>

      <div className="run-grid">
        <div>
          <span>{t("metadata.solver")}</span>
          <strong>{metadata?.solver_version ?? "—"}</strong>
        </div>
        <div>
          <span>{t("metadata.solveTime")}</span>
          <strong>
            {formatNumber(result.solve_time_sec, 2)}
            {t("unit.secondsSuffix")}
          </strong>
        </div>
        <div>
          <span>{t("metadata.proof")}</span>
          <strong>
            {metadata?.lexicographic_proven
              ? t("metadata.proven")
              : t("metadata.notProven")}
          </strong>
        </div>
        <div>
          <span>{t("metadata.model")}</span>
          <strong>{metadata?.model_version ?? "—"}</strong>
        </div>
        <div>
          <span>{t("metadata.dataVersion")}</span>
          <strong className="mono">{metadata?.data_version ?? "—"}</strong>
        </div>
        <div>
          <span>{t("metadata.dataPolicy")}</span>
          <strong>{t("metadata.syntheticOnly")}</strong>
        </div>
      </div>

      <div className="warning-summary">
        <span>{t("metadata.warnings", { count: warnings.length })}</span>
        <span className={critical > 0 ? "delta-bad" : ""}>
          {t("metadata.critical", { count: critical })}
        </span>
        <span className={warning > 0 ? "delta-warn" : ""}>
          {t("metadata.warning", { count: warning })}
        </span>
        <span>
          {result.diagnostics.feasible
            ? t("metadata.feasible")
            : t("metadata.notFeasible")}
        </span>
      </div>

      {warnings.length > 0 ? (
        <details className="warning-details">
          <summary>{t("metadata.showNotes")}</summary>
          <ul>
            {warnings.map((item, index) => (
              <li key={`${item.code}-${index}`}>
                <span className={`severity severity-${item.severity}`}>
                  {severityLabel(item.severity, t)}
                </span>
                <span>{warningMessage(item, request, result, language, t)}</span>
              </li>
            ))}
          </ul>
        </details>
      ) : null}

      <p className="panel-footnote">{t("metadata.footnote")}</p>
    </section>
  );
}
