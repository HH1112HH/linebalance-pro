import type { OptimizeResult, SampleRequest } from "../types";
import { displayLineName, displayShiftName, useLanguage } from "../i18n";
import { formatNumber, formatPct } from "../utils";

interface Props {
  request: SampleRequest;
  result: OptimizeResult;
}

export default function RunInputSummary({ request, result }: Props) {
  const { t } = useLanguage();
  const items: Array<{ label: string; value: string | number; mono?: boolean }> = [
    { label: t("summary.line"), value: displayLineName(request.line_name, t) },
    { label: t("summary.style"), value: request.style_code },
    {
      label: t("summary.shift"),
      value: `${displayShiftName(request.config.shift_name, t)} · ${request.config.shift_id}`,
    },
    {
      label: t("summary.target"),
      value: t("summary.targetValue", {
        value: formatNumber(request.config.target_qty, 0),
      }),
    },
    {
      label: t("summary.maxWorkers"),
      value: request.config.max_workers ?? "—",
    },
    {
      label: t("summary.efficiency"),
      value: formatPct(request.config.planned_efficiency * 100, 0),
    },
    {
      label: t("summary.samBasis"),
      value:
        result.sam_basis === "INCLUDES_ALLOWANCE"
          ? t("sam.includes")
          : t("sam.excludes", {
              pct: formatNumber(result.allowance_applied_pct * 100, 1),
            }),
    },
    {
      label: t("summary.allowance"),
      value: formatPct(result.allowance_applied_pct * 100, 1),
    },
    {
      label: t("summary.solverLimit"),
      value: `${formatNumber(request.config.solver_time_limit_sec, 0)}${t(
        "unit.secondsSuffix",
      )}`,
    },
    {
      label: t("summary.objective"),
      value: t(
        request.config.objective === "min_workers"
          ? "summary.objective.minWorkers"
          : "summary.objective.minBottleneck",
      ),
    },
    { label: t("summary.operations"), value: request.operations.length },
    { label: t("summary.workers"), value: request.workers.length },
    { label: t("summary.machines"), value: request.machines.length },
    {
      label: t("summary.baselineRows"),
      value: request.baseline_assignment?.items.length ?? 0,
    },
    {
      label: t("summary.dataHash"),
      value: result.metadata?.data_version ?? "—",
      mono: true,
    },
  ];

  return (
    <section className="panel run-input-panel" aria-labelledby="run-input-title">
      <div className="panel-head">
        <div>
          <span className="eyebrow">{t("summary.eyebrow")}</span>
          <h2 id="run-input-title">{t("summary.title")}</h2>
        </div>
        <span className="panel-chip chip-muted">{t("summary.chip")}</span>
      </div>

      <dl className="run-input-grid">
        {items.map((item) => (
          <div key={item.label}>
            <dt>{item.label}</dt>
            <dd className={item.mono ? "mono" : undefined} title={String(item.value)}>
              {item.value}
            </dd>
          </div>
        ))}
      </dl>
      <p className="panel-footnote">{t("summary.note")}</p>
    </section>
  );
}
