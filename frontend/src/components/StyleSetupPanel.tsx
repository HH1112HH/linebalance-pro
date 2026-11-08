import { useEffect, useMemo, useState, type FormEvent } from "react";
import type { CSSProperties } from "react";
import { buildProcessFlow, evaluateReadiness } from "../api";
import { STYLE_READINESS_TEMPLATE } from "../data";
import {
  apiErrorMessage,
  displayOperationName,
  machineTypeLabel,
  useLanguage,
  type MessageKey,
} from "../i18n";
import type {
  ProcessFlowNode,
  ProcessFlowResult,
  ReadinessDraftItem,
  ReadinessEvaluationRequest,
  ReadinessKey,
  ReadinessStatus,
  SampleRequest,
  OptimizeResult,
  StyleReadinessResult,
} from "../types";
import { cx, formatNumber, formatPct } from "../utils";

interface Props {
  request: SampleRequest;
  result: OptimizeResult;
}

const READINESS_LABEL_KEYS: Record<ReadinessKey, MessageKey> = {
  operation_routing: "style.item.operation_routing",
  sam_approved: "style.item.sam_approved",
  machine_ready: "style.item.machine_ready",
  manpower_assigned: "style.item.manpower_assigned",
  skill_coverage: "style.item.skill_coverage",
  layout_ready: "style.item.layout_ready",
  material_ready: "style.item.material_ready",
  production_trial: "style.item.production_trial",
};

const READINESS_STATUS_KEYS: Record<ReadinessStatus, MessageKey> = {
  NOT_STARTED: "style.status.NOT_STARTED",
  IN_PROGRESS: "style.status.IN_PROGRESS",
  COMPLETED: "style.status.COMPLETED",
  BLOCKED: "style.status.BLOCKED",
};

const READINESS_STATUSES: ReadinessStatus[] = [
  "NOT_STARTED",
  "IN_PROGRESS",
  "COMPLETED",
  "BLOCKED",
];

const FLOW_NODE_WIDTH = 176;
const FLOW_NODE_HEIGHT = 124;
const FLOW_COLUMN_GAP = 58;
const FLOW_ROW_GAP = 24;
const FLOW_MARGIN = 24;

type FlowState =
  | { key: string; status: "success"; result: ProcessFlowResult }
  | { key: string; status: "error"; error: string };

export default function StyleSetupPanel({ request, result }: Props) {
  const { language, t } = useLanguage();
  const [items, setItems] = useState<ReadinessDraftItem[]>(() =>
    STYLE_READINESS_TEMPLATE.map((item) => ({ ...item })),
  );
  const [readiness, setReadiness] = useState<StyleReadinessResult | null>(null);
  const [readinessError, setReadinessError] = useState<string | null>(null);
  const [evaluating, setEvaluating] = useState(false);
  const [flowState, setFlowState] = useState<FlowState | null>(null);
  const [flowMode, setFlowMode] = useState<"routing" | "optimized">("optimized");
  const [flowAttempt, setFlowAttempt] = useState(0);
  const activeFlowMode = result.has_solution ? flowMode : "routing";
  const processFlowRequest = useMemo(() => {
    const assignments =
      activeFlowMode === "optimized" && result.has_solution
        ? result.stations.flatMap((station) =>
            station.operation_ids.map((operationId) => ({
              operation_id: operationId,
              station: station.station,
              worker_id: station.worker_id,
              worker_name: station.worker_name,
            })),
          )
        : [];
    return {
      style_code: request.style_code,
      operations: request.operations,
      assignments,
    };
  }, [activeFlowMode, request.operations, request.style_code, result]);
  const flowRequestKey = `${JSON.stringify(processFlowRequest) ?? ""}:${flowAttempt}`;
  const matchingFlowState = flowState?.key === flowRequestKey ? flowState : null;
  const flowLoading = matchingFlowState === null;
  const flowError =
    matchingFlowState?.status === "error" ? matchingFlowState.error : null;
  const flow =
    matchingFlowState?.status === "success" ? matchingFlowState.result : null;

  useEffect(() => {
    let cancelled = false;
    buildProcessFlow(processFlowRequest)
      .then((payload) => {
        if (!cancelled) {
          setFlowState({ key: flowRequestKey, status: "success", result: payload });
        }
      })
      .catch((caught: unknown) => {
        if (!cancelled) {
          setFlowState({
            key: flowRequestKey,
            status: "error",
            error: caught instanceof Error ? caught.message : String(caught),
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [flowRequestKey, processFlowRequest]);

  function updateItem(key: ReadinessKey, update: Partial<ReadinessDraftItem>) {
    setItems((current) =>
      current.map((item) => (item.key === key ? { ...item, ...update } : item)),
    );
    setReadiness(null);
    setReadinessError(null);
  }

  async function handleEvaluate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setEvaluating(true);
    setReadinessError(null);
    setReadiness(null);

    const payload: ReadinessEvaluationRequest = {
      style_code: request.style_code,
      items: items.map((item) => ({
        ...item,
        label: t(READINESS_LABEL_KEYS[item.key]),
      })),
    };

    try {
      setReadiness(await evaluateReadiness(payload));
    } catch (caught) {
      setReadinessError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setEvaluating(false);
    }
  }

  return (
    <div className="style-setup-grid">
      <section className="panel readiness-panel" aria-label={t("style.readiness.aria")}>
        <div className="panel-head">
          <div>
            <span className="eyebrow">{t("style.readiness.eyebrow")}</span>
            <h2>{t("style.readiness.title")}</h2>
          </div>
          <span className="panel-chip chip-muted">{request.style_code}</span>
        </div>
        <p className="panel-intro">{t("style.readiness.note")}</p>

        <form className="readiness-form" onSubmit={handleEvaluate}>
          <div className="readiness-items">
            {items.map((item) => (
              <article className="readiness-item" key={item.key}>
                <div className="readiness-item-head">
                  <strong>{t(READINESS_LABEL_KEYS[item.key])}</strong>
                  <label className="readiness-required">
                    <input
                      type="checkbox"
                      checked={item.required}
                      onChange={(event) =>
                        updateItem(item.key, { required: event.currentTarget.checked })
                      }
                    />
                    <span>{t("style.readiness.required")}</span>
                  </label>
                </div>
                <div className="readiness-item-fields">
                  <label className="field">
                    <span>{t("style.readiness.status")}</span>
                    <select
                      value={item.status}
                      onChange={(event) =>
                        updateItem(item.key, {
                          status: event.currentTarget.value as ReadinessStatus,
                        })
                      }
                    >
                      {READINESS_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {t(READINESS_STATUS_KEYS[status])}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="field">
                    <span>{t("style.readiness.evidence")}</span>
                    <input
                      value={item.note}
                      maxLength={500}
                      onChange={(event) =>
                        updateItem(item.key, { note: event.currentTarget.value })
                      }
                    />
                  </label>
                </div>
              </article>
            ))}
          </div>

          {readinessError ? (
            <p className="form-error" role="alert">
              {apiErrorMessage(readinessError, language, t) ||
                t("style.readiness.apiError")}
            </p>
          ) : null}

          <div className="readiness-actions">
            <button className="primary-button" type="submit" disabled={evaluating}>
              {evaluating
                ? t("style.readiness.evaluating")
                : t("style.readiness.evaluate")}
            </button>
            <p className="panel-footnote">{t("style.dataPolicy")}</p>
          </div>
        </form>

        <ReadinessResult result={readiness} error={readinessError} />
      </section>

      <section className="panel process-flow-panel" aria-label={t("style.flow.aria")}>
        <div className="panel-head process-flow-head">
          <div>
            <span className="eyebrow">{t("style.flow.routingView")}</span>
            <h2>{t("style.flow.title")}</h2>
          </div>
          <div className="segmented" role="group" aria-label={t("style.flow.aria")}>
            <button
              type="button"
              className={activeFlowMode === "routing" ? "is-active" : undefined}
              aria-pressed={activeFlowMode === "routing"}
              onClick={() => setFlowMode("routing")}
            >
              {t("style.flow.routingOnly")}
            </button>
            <button
              type="button"
              className={activeFlowMode === "optimized" ? "is-active" : undefined}
              aria-pressed={activeFlowMode === "optimized"}
              disabled={!result.has_solution}
              onClick={() => setFlowMode("optimized")}
            >
              {t("style.flow.optimized")}
            </button>
          </div>
        </div>
        <p className="panel-intro">{t("style.flow.note")}</p>

        {flowLoading ? (
          <div className="empty-state" role="status" aria-live="polite">
            {t("style.flow.loading")}
          </div>
        ) : flowError ? (
          <div className="flow-error" role="alert">
            <p>{apiErrorMessage(flowError, language, t) || t("style.flow.error")}</p>
            <button
              className="secondary-button is-compact"
              type="button"
              onClick={() => setFlowAttempt((attempt) => attempt + 1)}
            >
              {t("style.flow.retry")}
            </button>
          </div>
        ) : flow?.nodes.length ? (
          <>
            <div className="flow-summary">
              <span className="panel-chip chip-muted">
                {flow.has_assignment
                  ? t("style.flow.optimizedView")
                  : t("style.flow.routingView")}
              </span>
              <span className="mono">
                {t("style.flow.operationCount", {
                  count: formatNumber(flow.nodes.length, 0),
                })}
              </span>
            </div>
            <ProcessFlowDiagram flow={flow} language={language} />
          </>
        ) : (
          <div className="empty-state">{t("style.flow.empty")}</div>
        )}
      </section>
    </div>
  );
}

function ReadinessResult({
  result,
  error,
}: {
  result: StyleReadinessResult | null;
  error: string | null;
}) {
  const { t } = useLanguage();
  if (error) return null;
  if (!result) {
    return (
      <div className="empty-state readiness-empty">{t("style.readiness.empty")}</div>
    );
  }

  return (
    <div
      className={cx("readiness-result", result.ready ? "is-ready" : "is-blocked")}
      aria-label={t("style.readiness.resultAria")}
      aria-live="polite"
    >
      <div className="readiness-score">
        <strong>{formatPct(result.readiness_pct, 2)}</strong>
        <span>{t("style.readiness.progress")}</span>
      </div>
      <div className="readiness-outcome">
        <strong>
          {result.ready ? t("style.readiness.ready") : t("style.readiness.notReady")}
        </strong>
        {result.blocking_items.length ? (
          <div>
            <span>{t("style.readiness.blockers")}</span>
            <ul>
              {result.blocking_items.map((key) => (
                <li key={key}>{readinessItemLabel(key, t)}</li>
              ))}
            </ul>
          </div>
        ) : (
          <p>{t("style.readiness.noBlockers")}</p>
        )}
      </div>
    </div>
  );
}

function readinessItemLabel(key: string, t: (key: MessageKey) => string): string {
  const item = STYLE_READINESS_TEMPLATE.find((candidate) => candidate.key === key);
  return item ? t(READINESS_LABEL_KEYS[item.key]) : key;
}

function ProcessFlowDiagram({
  flow,
  language,
}: {
  flow: ProcessFlowResult;
  language: "en" | "vi";
}) {
  const { t } = useLanguage();
  const maxLayer = Math.max(...flow.nodes.map((node) => node.layer));
  const maxOrder = Math.max(...flow.nodes.map((node) => node.order));
  const svgWidth =
    FLOW_MARGIN * 2 + (maxOrder + 1) * FLOW_NODE_WIDTH + maxOrder * FLOW_COLUMN_GAP;
  const svgHeight =
    FLOW_MARGIN * 2 + (maxLayer + 1) * FLOW_NODE_HEIGHT + maxLayer * FLOW_ROW_GAP;
  const positions = new Map(
    flow.nodes.map((node) => [
      node.operation_id,
      {
        x: FLOW_MARGIN + node.order * (FLOW_NODE_WIDTH + FLOW_COLUMN_GAP),
        y: FLOW_MARGIN + node.layer * (FLOW_NODE_HEIGHT + FLOW_ROW_GAP),
      },
    ]),
  );
  const nodesById = new Map(flow.nodes.map((node) => [node.operation_id, node]));

  return (
    <>
      <div className="flow-canvas" role="group" aria-label={t("style.flow.canvasAria")}>
        <svg
          className="process-flow-svg"
          width={svgWidth}
          height={svgHeight}
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          role="img"
          aria-label={t("style.flow.canvasAria")}
        >
          <defs>
            <marker
              id="process-flow-arrow"
              markerWidth="8"
              markerHeight="8"
              refX="6"
              refY="4"
              orient="auto"
            >
              <path d="M0,0 L8,4 L0,8 z" className="flow-arrowhead" />
            </marker>
          </defs>
          {flow.edges.map((edge) => {
            const source = positions.get(edge.source);
            const target = positions.get(edge.target);
            if (!source || !target) return null;
            const startX = source.x + FLOW_NODE_WIDTH / 2;
            const startY = source.y + FLOW_NODE_HEIGHT;
            const endX = target.x + FLOW_NODE_WIDTH / 2;
            const endY = target.y;
            const controlY = startY + (endY - startY) / 2;
            return (
              <path
                key={`${edge.source}-${edge.target}`}
                className="flow-edge"
                d={`M ${startX} ${startY} C ${startX} ${controlY}, ${endX} ${controlY}, ${endX} ${endY}`}
                markerEnd="url(#process-flow-arrow)"
              />
            );
          })}
          {flow.nodes.map((node) => {
            const position = positions.get(node.operation_id);
            if (!position) return null;
            return (
              <FlowNode
                key={node.operation_id}
                node={node}
                x={position.x}
                y={position.y}
                hasAssignment={flow.has_assignment}
                language={language}
              />
            );
          })}
        </svg>
      </div>

      <ol className="flow-mobile-list" aria-label={t("style.flow.mobileAria")}>
        {flow.nodes.map((node) => {
          const predecessorNames = node.predecessors
            .map((predecessor) => nodesById.get(predecessor))
            .filter((predecessor): predecessor is ProcessFlowNode =>
              Boolean(predecessor),
            )
            .map((predecessor) =>
              displayOperationName(
                { id: predecessor.operation_id, name: predecessor.name },
                language,
              ),
            );
          return (
            <li className="flow-mobile-item" key={node.operation_id}>
              <article
                className={cx(
                  "flow-mobile-card",
                  node.station !== null && "is-assigned",
                )}
                style={stationStyle(node.station)}
              >
                <div className="flow-mobile-card-head">
                  <span className="mono">{node.operation_id}</span>
                  {node.station !== null ? (
                    <span className="flow-station-chip">
                      {t("style.flow.station", { station: node.station })}
                    </span>
                  ) : null}
                </div>
                <strong>
                  {displayOperationName(
                    { id: node.operation_id, name: node.name },
                    language,
                  )}
                </strong>
                <span>
                  {t("style.flow.sam", { seconds: formatNumber(node.sam_sec, 3) })}
                </span>
                <span>
                  {node.machine_type
                    ? t("style.flow.machine", {
                        machine: machineTypeLabel(node.machine_type, t),
                      })
                    : t("style.flow.manual")}
                </span>
                {node.worker_name ? (
                  <span>{t("style.flow.worker", { worker: node.worker_name })}</span>
                ) : null}
                {node.is_quality_gate ? (
                  <span className="flow-quality-label">
                    {t("style.flow.qualityGate")}
                  </span>
                ) : null}
                <small>
                  {t("style.flow.predecessors", {
                    operations: predecessorNames.length
                      ? predecessorNames.join(", ")
                      : t("style.flow.start"),
                  })}
                </small>
              </article>
            </li>
          );
        })}
      </ol>
    </>
  );
}

function FlowNode({
  node,
  x,
  y,
  hasAssignment,
  language,
}: {
  node: ProcessFlowNode;
  x: number;
  y: number;
  hasAssignment: boolean;
  language: "en" | "vi";
}) {
  const { t } = useLanguage();
  const operationName = displayOperationName(
    { id: node.operation_id, name: node.name },
    language,
  );
  const machineName = node.machine_type
    ? machineTypeLabel(node.machine_type, t)
    : t("style.flow.manual");
  const clippedName =
    operationName.length > 25 ? `${operationName.slice(0, 24)}…` : operationName;

  return (
    <g
      className={cx(
        "flow-node",
        node.station !== null && "is-assigned",
        node.is_quality_gate && "is-quality-gate",
      )}
      style={stationStyle(node.station)}
    >
      <title>
        {`${node.operation_id} · ${operationName} · ${formatNumber(node.sam_sec, 3)}s`}
      </title>
      <rect
        className="flow-node-card"
        x={x}
        y={y}
        width={FLOW_NODE_WIDTH}
        height={FLOW_NODE_HEIGHT}
        rx="12"
      />
      <text className="flow-node-id" x={x + 12} y={y + 19}>
        {node.operation_id}
      </text>
      {node.is_quality_gate ? (
        <text
          className="flow-node-gate"
          x={x + FLOW_NODE_WIDTH - 12}
          y={y + 19}
          textAnchor="end"
        >
          {t("style.flow.qualityGate")}
        </text>
      ) : null}
      <text className="flow-node-name" x={x + 12} y={y + 41}>
        {clippedName}
      </text>
      <text className="flow-node-detail" x={x + 12} y={y + 61}>
        {t("style.flow.sam", { seconds: formatNumber(node.sam_sec, 3) })}
      </text>
      <text className="flow-node-detail" x={x + 12} y={y + 80}>
        {node.machine_type
          ? t("style.flow.machine", { machine: machineName })
          : machineName}
      </text>
      {hasAssignment && node.station !== null ? (
        <text className="flow-node-assignment" x={x + 12} y={y + 101}>
          {t("style.flow.station", { station: node.station })}
          {node.worker_name ? ` · ${node.worker_name}` : ""}
        </text>
      ) : null}
    </g>
  );
}

function stationStyle(station: number | null): CSSProperties | undefined {
  if (station === null) return undefined;
  return { "--station-hue": `${(station * 47) % 360}` } as CSSProperties;
}
