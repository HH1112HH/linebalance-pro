import type { OptimizeResult } from "../types";
import { formatNumber, formatPct } from "../utils";

interface Props {
  result: OptimizeResult;
}

export default function StationTable({ result }: Props) {
  if (result.stations.length === 0) return null;

  return (
    <section className="panel station-table-panel" aria-labelledby="station-title">
      <div className="panel-head">
        <div>
          <span className="eyebrow">Assignment detail</span>
          <h2 id="station-title">Station, worker and operation map</h2>
        </div>
        <span className="panel-chip chip-muted">
          {result.stations.length} stations
        </span>
      </div>

      <div className="table-wrap station-table-wrap">
        <table className="data-table station-table">
          <thead>
            <tr>
              <th>Station</th>
              <th>Worker</th>
              <th>Operations</th>
              <th className="num">Load</th>
              <th className="num">Utilization</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {result.stations.map((station) => (
              <tr key={station.station}>
                <td className="mono">ST{station.station}</td>
                <td>
                  <span className="row-label">{station.worker_id}</span>
                  <span className="row-note">{station.worker_name}</span>
                </td>
                <td>
                  <span
                    className="ops-cell"
                    title={station.operation_names.join(", ")}
                  >
                    {station.operation_ids.join(" · ")}
                  </span>
                </td>
                <td className="num mono">
                  {formatNumber(station.standard_load_sec, 1)}s
                </td>
                <td className="num mono">
                  {formatPct(station.standard_utilization_pct, 1)}
                </td>
                <td>
                  <span className={`status-pill status-${station.status}`}>
                    {station.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="panel-footnote">
        Utilization is station load divided by the line bottleneck, not machine
        runtime. Manual operations have no machine requirement.
      </p>
    </section>
  );
}
