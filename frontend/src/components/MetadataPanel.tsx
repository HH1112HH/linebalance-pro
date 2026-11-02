import type { OptimizeResult } from "../types";
import { cx, formatNumber } from "../utils";

interface Props {
  result: OptimizeResult;
}

export default function MetadataPanel({ result }: Props) {
  const metadata = result.metadata;
  const warnings = result.warnings;
  const critical = warnings.filter((item) => item.severity === "critical").length;
  const warning = warnings.filter((item) => item.severity === "warning").length;

  return (
    <section className="panel metadata-panel" aria-labelledby="run-title">
      <div className="panel-head">
        <div>
          <span className="eyebrow">Run provenance</span>
          <h2 id="run-title">Solver and data notes</h2>
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
          {result.status}
        </span>
      </div>

      <div className="run-grid">
        <div>
          <span>Solver</span>
          <strong>{metadata?.solver_version ?? "—"}</strong>
        </div>
        <div>
          <span>Solve time</span>
          <strong>{formatNumber(result.solve_time_sec, 2)}s</strong>
        </div>
        <div>
          <span>Lexicographic proof</span>
          <strong>{metadata?.lexicographic_proven ? "Proven" : "Not proven"}</strong>
        </div>
        <div>
          <span>Model</span>
          <strong>{metadata?.model_version ?? "—"}</strong>
        </div>
        <div>
          <span>Data version</span>
          <strong className="mono">{metadata?.data_version ?? "—"}</strong>
        </div>
        <div>
          <span>Data policy</span>
          <strong>Synthetic only</strong>
        </div>
      </div>

      <div className="warning-summary">
        <span>
          <strong>{warnings.length}</strong> warnings
        </span>
        <span className={critical > 0 ? "delta-bad" : ""}>{critical} critical</span>
        <span className={warning > 0 ? "delta-warn" : ""}>{warning} warning</span>
        <span>{result.diagnostics.feasible ? "Feasible" : "Not feasible"}</span>
      </div>

      {warnings.length > 0 ? (
        <details className="warning-details">
          <summary>Show constraint notes</summary>
          <ul>
            {warnings.map((item, index) => (
              <li key={`${item.code}-${index}`}>
                <span className={`severity severity-${item.severity}`}>
                  {item.severity}
                </span>
                <span>{item.message}</span>
              </li>
            ))}
          </ul>
        </details>
      ) : null}

      <p className="panel-footnote">
        This public demo uses synthetic data only. The sample baseline is an input, not
        an optimizer output. Scenario write/delete is disabled on the API; saved
        snapshots stay in this browser.
      </p>
    </section>
  );
}
