import { useState, type ReactNode } from "react";
import { analyzeActuals, calculateTimeStudy } from "../api";
import type {
  ActualsAnalysis,
  LossCategory,
  OperationInput,
  SampleRequest,
  TimeStudyResult,
} from "../types";
import { clone, formatNumber, formatPct, todayIso } from "../utils";

interface Props {
  request: SampleRequest;
  operations: OperationInput[];
  currentAnalysis: ActualsAnalysis | null;
  onApply: (next: SampleRequest, analysis: ActualsAnalysis) => void;
}

const LOSS_CATEGORIES: LossCategory[] = [
  "MACHINE",
  "MATERIAL",
  "MANPOWER",
  "QUALITY",
  "CHANGEOVER",
  "OTHER",
];

export default function FormsPanel({
  request,
  operations,
  currentAnalysis,
  onApply,
}: Props) {
  return (
    <section className="forms-section" aria-labelledby="forms-title">
      <div className="section-heading">
        <div>
          <span className="eyebrow">Shop-floor inputs</span>
          <h2 id="forms-title">Three small inputs, one control loop</h2>
        </div>
        <p>
          These forms update the dashboard through the API. They do not write back to
          the optimizer automatically; re-run the solver after changing method or SAM.
        </p>
      </div>

      <div className="forms-grid">
        <ActualProductionForm
          request={request}
          currentAnalysis={currentAnalysis}
          onApply={onApply}
        />
        <DowntimeForm
          request={request}
          currentAnalysis={currentAnalysis}
          onApply={onApply}
        />
        <TimeStudyForm operations={operations} />
      </div>
    </section>
  );
}

function ActualProductionForm({
  request,
  currentAnalysis,
  onApply,
}: Omit<Props, "operations">) {
  const [target, setTarget] = useState(request.config.target_qty);
  const [actualOutput, setActualOutput] = useState(request.actuals?.actual_output ?? 0);
  const [laborMinutes, setLaborMinutes] = useState(
    request.actuals?.actual_direct_labor_minutes ?? 0,
  );
  const [downtime, setDowntime] = useState(request.actuals?.downtime_minutes ?? 0);
  const [attendance, setAttendance] = useState(request.actuals?.attendance_hc ?? 0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setError(null);
    const next = clone(request);
    next.config.target_qty = Math.max(1, Math.round(target));
    next.actuals = {
      actual_output: Math.max(0, Math.round(actualOutput)),
      actual_direct_labor_minutes: Math.max(0, laborMinutes),
      downtime_minutes: Math.max(0, downtime),
      attendance_hc: Math.max(0, Math.round(attendance)),
    };
    next.daily_actuals = [];
    try {
      const result = await analyzeActuals(next);
      onApply(next, result);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="panel form-card">
      <div className="form-head">
        <span className="form-step">01</span>
        <div>
          <h3>Actual production</h3>
          <p>One shift snapshot. Replaces the 5-day sample view.</p>
        </div>
      </div>

      <div className="field-grid two-col">
        <Field label="Target output">
          <input
            type="number"
            min={1}
            step={1}
            value={target}
            onChange={(event) => setTarget(Number(event.target.value))}
          />
        </Field>
        <Field label="Actual output">
          <input
            type="number"
            min={0}
            step={1}
            value={actualOutput}
            onChange={(event) => setActualOutput(Number(event.target.value))}
          />
        </Field>
        <Field label="Direct labor minutes">
          <input
            type="number"
            min={0}
            step={1}
            value={laborMinutes}
            onChange={(event) => setLaborMinutes(Number(event.target.value))}
          />
        </Field>
        <Field label="Attendance HC">
          <input
            type="number"
            min={0}
            step={1}
            value={attendance}
            onChange={(event) => setAttendance(Number(event.target.value))}
          />
        </Field>
        <Field label="Downtime minutes">
          <input
            type="number"
            min={0}
            step={1}
            value={downtime}
            onChange={(event) => setDowntime(Number(event.target.value))}
          />
        </Field>
      </div>

      <button type="button" className="primary-button" onClick={submit} disabled={busy}>
        {busy ? "Calculating…" : "Apply actuals"}
      </button>

      {error ? <p className="form-error">{error}</p> : null}
      {currentAnalysis ? <ActualsMini analysis={currentAnalysis} /> : null}
    </article>
  );
}

function DowntimeForm({
  request,
  currentAnalysis,
  onApply,
}: Omit<Props, "operations">) {
  const [start, setStart] = useState("08:15");
  const [end, setEnd] = useState("08:40");
  const [station, setStation] = useState("ST05");
  const [category, setCategory] = useState<LossCategory>("MACHINE");
  const [note, setNote] = useState("Overlock thread break");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const duration = Math.max(0, parseTime(end) - parseTime(start));

  async function submit() {
    if (duration <= 0) {
      setError("End time must be after start time.");
      return;
    }
    setBusy(true);
    setError(null);
    const next = clone(request);
    next.daily_actuals = [];
    next.actuals = {
      actual_output: request.actuals?.actual_output ?? 0,
      actual_direct_labor_minutes: request.actuals?.actual_direct_labor_minutes ?? null,
      downtime_minutes: (request.actuals?.downtime_minutes ?? 0) + duration,
      attendance_hc: request.actuals?.attendance_hc ?? null,
    };
    next.downtime_events = [
      ...request.downtime_events,
      {
        start_time: start,
        end_time: end,
        line_id: request.headcount_standard?.line_id ?? "LINE_01",
        station_id: station,
        loss_category: category,
        duration_minutes: duration,
        note,
      },
    ];
    try {
      const result = await analyzeActuals(next);
      onApply(next, result);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setBusy(false);
    }
  }

  const recentEvents = request.downtime_events.slice(-4).reverse();

  return (
    <article className="panel form-card">
      <div className="form-head">
        <span className="form-step">02</span>
        <div>
          <h3>Downtime event</h3>
          <p>Log one loss. Duration is added to the shift total.</p>
        </div>
      </div>

      <div className="field-grid two-col">
        <Field label="Start">
          <input
            type="time"
            value={start}
            onChange={(event) => setStart(event.target.value)}
          />
        </Field>
        <Field label="End">
          <input
            type="time"
            value={end}
            onChange={(event) => setEnd(event.target.value)}
          />
        </Field>
        <Field label="Station">
          <select value={station} onChange={(event) => setStation(event.target.value)}>
            <option value="">Line level</option>
            {request.baseline_assignment
              ? Array.from(
                  new Set(
                    request.baseline_assignment.items.map((item) => item.station_id),
                  ),
                )
                  .sort()
                  .map((id) => (
                    <option key={id} value={id}>
                      {id}
                    </option>
                  ))
              : null}
          </select>
        </Field>
        <Field label="Loss category">
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value as LossCategory)}
          >
            {LOSS_CATEGORIES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Duration">
          <input value={`${formatNumber(duration, 0)} min`} readOnly />
        </Field>
        <Field label="Note">
          <input
            value={note}
            maxLength={120}
            onChange={(event) => setNote(event.target.value)}
          />
        </Field>
      </div>

      <button type="button" className="primary-button" onClick={submit} disabled={busy}>
        {busy ? "Calculating…" : "Add downtime"}
      </button>

      {error ? <p className="form-error">{error}</p> : null}
      {currentAnalysis ? <ActualsMini analysis={currentAnalysis} /> : null}

      {recentEvents.length > 0 ? (
        <div className="event-log">
          <span className="tiny-note">Latest events</span>
          {recentEvents.map((event, index) => (
            <div className="event-row" key={`${event.start_time}-${index}`}>
              <span>{event.station_id || "LINE"}</span>
              <span>{event.loss_category}</span>
              <span>{formatNumber(event.duration_minutes, 0)}m</span>
            </div>
          ))}
        </div>
      ) : null}
    </article>
  );
}

function TimeStudyForm({ operations }: { operations: OperationInput[] }) {
  const first = operations[0];
  const [operationId, setOperationId] = useState(first?.id ?? "");
  const [observed, setObserved] = useState(first?.sam_sec ?? 30);
  const [rating, setRating] = useState(1.0);
  const [allowance, setAllowance] = useState(0.12);
  const [approved, setApproved] = useState<number | null>(first?.sam_sec ?? null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TimeStudyResult | null>(null);

  const selected = operations.find((item) => item.id === operationId);

  function selectOperation(id: string) {
    setOperationId(id);
    const operation = operations.find((item) => item.id === id);
    setObserved(operation?.sam_sec ?? 0);
    setApproved(operation?.sam_sec ?? null);
    setResult(null);
  }

  async function submit() {
    if (!operationId || observed <= 0) {
      setError("Choose an operation and enter an observed time above zero.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const next = await calculateTimeStudy({
        operation_id: operationId,
        observed_time_sec: observed,
        performance_rating: rating,
        allowance_pct: allowance,
        approved_sam_sec: approved,
        revision_date: todayIso(),
        status: "DRAFT",
      });
      setResult(next);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="panel form-card">
      <div className="form-head">
        <span className="form-step">03</span>
        <div>
          <h3>Time study</h3>
          <p>Normal time and standard time. Draft only — no auto-SAM update.</p>
        </div>
      </div>

      <p className="form-note">
        Aggregate calculation: enter human/walking observed time only. Do not apply the
        performance rating to machine automatic time; split mixed elements first
        (playbook §3.6).
      </p>

      <div className="field-grid two-col">
        <Field label="Operation" wide>
          <select
            value={operationId}
            onChange={(event) => selectOperation(event.target.value)}
          >
            {operations.map((operation) => (
              <option key={operation.id} value={operation.id}>
                {operation.id} · {operation.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Observed time (s)">
          <input
            type="number"
            min={0.1}
            step={0.1}
            value={observed}
            onChange={(event) => setObserved(Number(event.target.value))}
          />
        </Field>
        <Field label="Performance rating">
          <input
            type="number"
            min={0.3}
            max={2}
            step={0.05}
            value={rating}
            onChange={(event) => setRating(Number(event.target.value))}
          />
        </Field>
        <Field label="Allowance %">
          <input
            type="number"
            min={0}
            max={50}
            step={1}
            value={Math.round(allowance * 100)}
            onChange={(event) => setAllowance(Number(event.target.value) / 100)}
          />
        </Field>
        <Field label="Approved SAM (s)">
          <input
            type="number"
            min={0}
            step={0.1}
            value={approved ?? ""}
            onChange={(event) =>
              setApproved(event.target.value === "" ? null : Number(event.target.value))
            }
          />
        </Field>
      </div>

      <button type="button" className="primary-button" onClick={submit} disabled={busy}>
        {busy ? "Calculating…" : "Calculate time study"}
      </button>

      {error ? <p className="form-error">{error}</p> : null}

      {result ? (
        <div className="time-study-result">
          <div>
            <span>Normal time</span>
            <strong>{formatNumber(result.normal_time_sec, 2)}s</strong>
          </div>
          <div>
            <span>Standard time</span>
            <strong>{formatNumber(result.standard_time_sec, 2)}s</strong>
          </div>
          <div>
            <span>Approved SAM</span>
            <strong>
              {result.approved_sam_sec === null
                ? "—"
                : `${formatNumber(result.approved_sam_sec, 2)}s`}
            </strong>
          </div>
          <div>
            <span>Variance</span>
            <strong>
              {result.variance_pct === null
                ? "—"
                : `${result.variance_pct > 0 ? "+" : ""}${formatNumber(result.variance_pct, 2)}%`}
            </strong>
          </div>
          <p className="form-note">
            {selected ? `${selected.id} · ${selected.name}. ` : ""}
            Draft record only. Re-time-study and approve before changing SAM in the
            optimizer.
          </p>
        </div>
      ) : null}
    </article>
  );
}

function Field({
  label,
  children,
  wide,
}: {
  label: string;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <label className={wide ? "field field-wide" : "field"}>
      <span>{label}</span>
      {children}
    </label>
  );
}

function ActualsMini({ analysis }: { analysis: ActualsAnalysis }) {
  return (
    <div className="actuals-mini">
      <div>
        <span>Achievement</span>
        <strong>{formatPct(analysis.production_achievement_pct, 2)}</strong>
      </div>
      <div>
        <span>Labor efficiency</span>
        <strong>
          {analysis.actual_labor_efficiency_pct === null
            ? "—"
            : formatPct(analysis.actual_labor_efficiency_pct, 2)}
        </strong>
      </div>
      <div>
        <span>Downtime</span>
        <strong>{formatNumber(analysis.downtime_minutes, 0)} min</strong>
      </div>
    </div>
  );
}

function parseTime(value: string): number {
  const [hours, minutes] = value.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return 0;
  return hours * 60 + minutes;
}
