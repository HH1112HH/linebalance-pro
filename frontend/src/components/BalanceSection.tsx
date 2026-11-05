import { useState } from "react";
import BottleneckPanel from "./BottleneckPanel";
import type { BaselineStation, OptimizeResult } from "../types";
import { useLanguage, type MessageKey } from "../i18n";
import { cx } from "../utils";
import BaselinePanel from "./BaselinePanel";
import StationTable from "./StationTable";
import WorkloadPanel from "./WorkloadPanel";

interface Props {
  result: OptimizeResult;
  baselineStations: BaselineStation[];
}

type BalanceView = "loads" | "map" | "baseline";

const TABS: Array<{ key: BalanceView; labelKey: MessageKey }> = [
  { key: "loads", labelKey: "balance.tab.loads" },
  { key: "map", labelKey: "balance.tab.map" },
  { key: "baseline", labelKey: "balance.tab.baseline" },
];

export default function BalanceSection({ result, baselineStations }: Props) {
  const { t } = useLanguage();
  const [view, setView] = useState<BalanceView>("loads");

  return (
    <div className="section-stack">
      <div className="view-tabs" role="tablist" aria-label={t("balance.tabsAria")}>
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
            {t(tab.labelKey)}
          </button>
        ))}
        <span className="view-tabs-note">{t("balance.note")}</span>
      </div>

      <div
        id="balance-panel"
        role="tabpanel"
        aria-labelledby={`balance-tab-${view}`}
        className="tab-panel"
      >
        {view === "loads" ? (
          <div className="balance-analysis-grid">
            <WorkloadPanel result={result} baselineStations={baselineStations} />
            <BottleneckPanel result={result} />
          </div>
        ) : null}
        {view === "map" ? <StationTable result={result} /> : null}
        {view === "baseline" ? <BaselinePanel result={result} /> : null}
      </div>
    </div>
  );
}
