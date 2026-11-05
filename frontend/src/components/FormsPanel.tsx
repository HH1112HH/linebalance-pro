import { useState, type ReactNode } from "react";
import { analyzeActuals, calculateTimeStudy } from "../api";
import type {
  ActualsAnalysis,
  LossCategory,
  OperationInput,
  SampleRequest,
  TimeStudyResult,
} from "../types";
import {
  apiErrorMessage,
  displayOperationName,
  lossCategoryLabel,
  useLanguage,
} from "../i18n";
import { clone, formatNumber, formatPct, todayIso } from "../utils";

interface Props {
  mode: "actuals" | "time-study";
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
  mode,
  request,
  operations,
  currentAnalysis,
  onApply,
}: Props) {
  const { t } = useLanguage();
  const [actualTab, setActualTab] = useState<"production" | "downtime">("production");

  if (mode === "time-study") {
    return (
      <section className="forms-section" aria-label={t("forms.timeStudyAria")}>
        <div className="forms-grid single">
          <TimeStudyForm operations={operations} />
        </div>
      </section>
    );
  }

  return (
    <section className="forms-section" aria-label={t("forms.actualsAria")}>
      <div className="form-switch">
        <div>
          <span className="eyebrow">{t("forms.shopFloor")}</span>
          <h3>{t("forms.logEvent")}</h3>
        </div>
        <div className="segmented" role="group" aria-label={t("forms.actualsFormAria")}>
          <button
            type="button"
            className={actualTab === "production" ? "is-active" : undefined}
            aria-pressed={actualTab === "production"}
            onClick={() => setActualTab("production")}
          >
            {t("forms.tab.production")}
          </button>
          <button
            type="button"
            className={actualTab === "downtime" ? "is-active" : undefined}
            aria-pressed={actualTab === "downtime"}
            onClick={() => setActualTab("downtime")}
          >
            {t("forms.tab.downtime")}
          </button>
        </div>
      </div>

      <div className="forms-grid single">
        {actualTab === "production" ? (
          <ActualProductionForm
            request={request}
            currentAnalysis={currentAnalysis}
            onApply={onApply}
          />
        ) : (
          <DowntimeForm
            request={request}
            currentAnalysis={currentAnalysis}
            onApply={onApply}
          />
        )}
      </div>
    </section>
  );
}

function ActualProductionForm({
  request,
  currentAnalysis,
  onApply,
}: Pick<Props, "request" | "currentAnalysis" | "onApply">) {
  const { language, t } = useLanguage();
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
      setError(
        apiErrorMessage(
          caught instanceof Error ? caught.message : String(caught),
          language,
          t,
        ),
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="panel form-card">
      <div className="form-head">
        <span className="form-step">01</span>
        <div>
          <h3>{t("forms.production.title")}</h3>
          <p>{t("forms.production.note")}</p>
        </div>
      </div>

      <div className="field-grid two-col">
        <Field label={t("forms.field.target")}>
          <input
            type="number"
            min={1}
            step={1}
            value={target}
            onChange={(event) => setTarget(Number(event.target.value))}
          />
        </Field>
        <Field label={t("forms.field.actualOutput")}>
          <input
            type="number"
            min={0}
            step={1}
            value={actualOutput}
            onChange={(event) => setActualOutput(Number(event.target.value))}
          />
        </Field>
        <Field label={t("forms.field.laborMinutes")}>
          <input
            type="number"
            min={0}
            step={1}
            value={laborMinutes}
            onChange={(event) => setLaborMinutes(Number(event.target.value))}
          />
        </Field>
        <Field label={t("forms.field.attendance")}>
          <input
            type="number"
            min={0}
            step={1}
            value={attendance}
            onChange={(event) => setAttendance(Number(event.target.value))}
          />
        </Field>
        <Field label={t("forms.field.downtimeMinutes")}>
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
        {busy ? t("forms.calculating") : t("forms.applyActuals")}
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
}: Pick<Props, "request" | "currentAnalysis" | "onApply">) {
  const { language, t } = useLanguage();
  const [start, setStart] = useState("08:15");
  const [end, setEnd] = useState("08:40");
  const [station, setStation] = useState("ST05");
  const [category, setCategory] = useState<LossCategory>("MACHINE");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const duration = Math.max(0, parseTime(end) - parseTime(start));

  async function submit() {
    if (duration <= 0) {
      setError(t("forms.error.endAfterStart"));
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
      setError(
        apiErrorMessage(
          caught instanceof Error ? caught.message : String(caught),
          language,
          t,
        ),
      );
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
          <h3>{t("forms.downtime.title")}</h3>
          <p>{t("forms.downtime.note")}</p>
        </div>
      </div>

      <div className="field-grid two-col">
        <Field label={t("forms.field.start")}>
          <input
            type="time"
            value={start}
            onChange={(event) => setStart(event.target.value)}
          />
        </Field>
        <Field label={t("forms.field.end")}>
          <input
            type="time"
            value={end}
            onChange={(event) => setEnd(event.target.value)}
          />
        </Field>
        <Field label={t("forms.field.station")}>
          <select value={station} onChange={(event) => setStation(event.target.value)}>
            <option value="">{t("forms.lineLevel")}</option>
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
        <Field label={t("forms.field.lossCategory")}>
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value as LossCategory)}
          >
            {LOSS_CATEGORIES.map((item) => (
              <option key={item} value={item}>
                {lossCategoryLabel(item, t)}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t("forms.field.duration")}>
          <input
            value={`${formatNumber(duration, 0)}${t("unit.minutesSuffix")}`}
            readOnly
          />
        </Field>
        <Field label={t("forms.field.note")}>
          <input
            value={note}
            maxLength={120}
            placeholder={t("forms.defaultDowntimeNote")}
            onChange={(event) => setNote(event.target.value)}
          />
        </Field>
      </div>

      <button type="button" className="primary-button" onClick={submit} disabled={busy}>
        {busy ? t("forms.calculating") : t("forms.addDowntime")}
      </button>

      {error ? <p className="form-error">{error}</p> : null}
      {currentAnalysis ? <ActualsMini analysis={currentAnalysis} /> : null}

      {recentEvents.length > 0 ? (
        <div className="event-log">
          <span className="tiny-note">{t("forms.latestEvents")}</span>
          {recentEvents.map((event, index) => (
            <div className="event-row" key={`${event.start_time}-${index}`}>
              <span>{event.station_id || t("forms.lineLevel")}</span>
              <span>{lossCategoryLabel(event.loss_category, t)}</span>
              <span>
                {formatNumber(event.duration_minutes, 0)}
                {t("unit.minutesSuffix")}
              </span>
            </div>
          ))}
        </div>
      ) : null}
    </article>
  );
}

function TimeStudyForm({ operations }: { operations: OperationInput[] }) {
  const { language, t } = useLanguage();
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
      setError(t("forms.error.chooseOperation"));
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
      setError(
        apiErrorMessage(
          caught instanceof Error ? caught.message : String(caught),
          language,
          t,
        ),
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="panel form-card">
      <div className="form-head">
        <span className="form-step">03</span>
        <div>
          <h3>{t("forms.timeStudy.title")}</h3>
          <p>{t("forms.timeStudy.note")}</p>
        </div>
      </div>

      <p className="form-note">{t("forms.timeStudy.guardrail")}</p>

      <div className="field-grid two-col">
        <Field label={t("forms.field.operation")} wide>
          <select
            value={operationId}
            onChange={(event) => selectOperation(event.target.value)}
          >
            {operations.map((operation) => (
              <option key={operation.id} value={operation.id}>
                {operation.id} · {displayOperationName(operation, language)}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t("forms.field.observed")}>
          <input
            type="number"
            min={0.1}
            step={0.1}
            value={observed}
            onChange={(event) => setObserved(Number(event.target.value))}
          />
        </Field>
        <Field label={t("forms.field.rating")}>
          <input
            type="number"
            min={0.3}
            max={2}
            step={0.05}
            value={rating}
            onChange={(event) => setRating(Number(event.target.value))}
          />
        </Field>
        <Field label={t("forms.field.allowance")}>
          <input
            type="number"
            min={0}
            max={50}
            step={1}
            value={Math.round(allowance * 100)}
            onChange={(event) => setAllowance(Number(event.target.value) / 100)}
          />
        </Field>
        <Field label={t("forms.field.approvedSam")}>
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
        {busy ? t("forms.calculating") : t("forms.calculateTimeStudy")}
      </button>

      {error ? <p className="form-error">{error}</p> : null}

      {result ? (
        <div className="time-study-result">
          <div>
            <span>{t("forms.result.normal")}</span>
            <strong>
              {formatNumber(result.normal_time_sec, 2)}
              {t("unit.secondsSuffix")}
            </strong>
          </div>
          <div>
            <span>{t("forms.result.standard")}</span>
            <strong>
              {formatNumber(result.standard_time_sec, 2)}
              {t("unit.secondsSuffix")}
            </strong>
          </div>
          <div>
            <span>{t("forms.result.approved")}</span>
            <strong>
              {result.approved_sam_sec === null
                ? "—"
                : `${formatNumber(result.approved_sam_sec, 2)}${t("unit.secondsSuffix")}`}
            </strong>
          </div>
          <div>
            <span>{t("forms.result.variance")}</span>
            <strong>
              {result.variance_pct === null
                ? "—"
                : `${result.variance_pct > 0 ? "+" : ""}${formatNumber(result.variance_pct, 2)}%`}
            </strong>
          </div>
          <p className="form-note">
            {t("forms.result.note", {
              operation: selected
                ? `${selected.id} · ${displayOperationName(selected, language)}.`
                : "",
            })}
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
  const { t } = useLanguage();
  return (
    <div className="actuals-mini">
      <div>
        <span>{t("forms.mini.achievement")}</span>
        <strong>{formatPct(analysis.production_achievement_pct, 2)}</strong>
      </div>
      <div>
        <span>{t("forms.mini.labor")}</span>
        <strong>
          {analysis.actual_labor_efficiency_pct === null
            ? "—"
            : formatPct(analysis.actual_labor_efficiency_pct, 2)}
        </strong>
      </div>
      <div>
        <span>{t("forms.mini.downtime")}</span>
        <strong>
          {formatNumber(analysis.downtime_minutes, 0)}
          {t("unit.minutesSuffix")}
        </strong>
      </div>
    </div>
  );
}

function parseTime(value: string): number {
  const [hours, minutes] = value.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return 0;
  return hours * 60 + minutes;
}
