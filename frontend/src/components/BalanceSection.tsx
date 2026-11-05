import { useState } from "react";
import type { BaselineStation, OptimizeResult } from "../types";
import { cx } from "../utils";
import BaselinePanel from "./BaselinePanel";
import StationTable from "./StationTable";
import WorkloadPanel from "./WorkloadPanel";

interface Props {
  result: OptimizeResult;
  baselineStations: BaselineStation[];
}

type BalanceView = "loads" | "map" | "baseline";

const TABS: Array<{ key: BalanceView; label: string }> = [
  { key: "loads", label: "Station loads" },
  { key: "map", label: "Assignment map" },
  { key: "baseline", label: "Before / after" },
];

export default function BalanceSection({ result, baselineStations }: Props) {
  const [view, setView] = useState<BalanceView>("loads");

  return (
    <div className="section-stack">
      <div className="view-tabs" role="tablist" aria-label="Line balance view">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            id={`balance-tab-${tab.key}`}
            type="button"
            role="tab"
            aria-selected={view === tab.key}
            aria-controls="balance-panel"
            className={cx("view-tab", view === tab.key && "is-active")}
            onClick={() => setView(tab.key)}
          >
            {tab.label}
          </button>
        ))}
        <span className="view-tabs-note">Planning SAM basis · synthetic line</span>
      </div>

      <div
        id="balance-panel"
        role="tabpanel"
        aria-labelledby={`balance-tab-${view}`}
        className="tab-panel"
      >
        {view === "loads" ? (
          <WorkloadPanel result={result} baselineStations={baselineStations} />
        ) : null}
        {view === "map" ? <StationTable result={result} /> : null}
        {view === "baseline" ? <BaselinePanel result={result} /> : null}
      </div>
    </div>
  );
}
