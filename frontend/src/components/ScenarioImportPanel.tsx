import { useState, type FormEvent } from "react";
import { importScenarioCsvs, importScenarioWorkbook } from "../api";
import { apiErrorMessage, useLanguage } from "../i18n";
import type { MessageKey } from "../i18n";
import type { ScenarioImportPreview } from "../types";
import { formatNumber } from "../utils";

const MAX_IMPORT_BYTES = 2_000_000;

type FileKey = "operations" | "workers" | "skills" | "machines";

interface FileField {
  key: FileKey;
  labelKey: MessageKey;
  hintKey: MessageKey;
  required: boolean;
}

const FILE_FIELDS: FileField[] = [
  {
    key: "operations",
    labelKey: "scenarioImport.operations",
    hintKey: "scenarioImport.hint.operations",
    required: true,
  },
  {
    key: "workers",
    labelKey: "scenarioImport.workers",
    hintKey: "scenarioImport.hint.workers",
    required: true,
  },
  {
    key: "skills",
    labelKey: "scenarioImport.skills",
    hintKey: "scenarioImport.hint.skills",
    required: true,
  },
  {
    key: "machines",
    labelKey: "scenarioImport.machines",
    hintKey: "scenarioImport.hint.machines",
    required: false,
  },
];

type FileMap = Record<FileKey, File | null>;

const EMPTY_FILES: FileMap = {
  operations: null,
  workers: null,
  skills: null,
  machines: null,
};

export default function ScenarioImportPanel({
  onApply,
  applying,
}: {
  onApply: (preview: ScenarioImportPreview) => Promise<void>;
  applying: boolean;
}) {
  const { language, t } = useLanguage();
  const [files, setFiles] = useState<FileMap>(EMPTY_FILES);
  const [workbook, setWorkbook] = useState<File | null>(null);
  const [preview, setPreview] = useState<ScenarioImportPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [validating, setValidating] = useState(false);
  const [workbookValidating, setWorkbookValidating] = useState(false);

  function updateFile(key: FileKey, file: File | null) {
    setFiles((previous) => ({ ...previous, [key]: file }));
    setPreview(null);
    setError(null);
  }

  function updateWorkbook(file: File | null) {
    setWorkbook(file);
    setPreview(null);
    setError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    for (const field of FILE_FIELDS) {
      if (field.required && !files[field.key]) {
        setError(t("scenarioImport.fileMissing", { file: t(field.labelKey) }));
        setPreview(null);
        return;
      }
    }

    const totalBytes = Object.values(files).reduce(
      (total, file) => total + (file?.size ?? 0),
      0,
    );
    if (totalBytes > MAX_IMPORT_BYTES) {
      setError(t("scenarioImport.tooLarge"));
      setPreview(null);
      return;
    }

    setValidating(true);
    setError(null);
    setPreview(null);
    try {
      const [operationsCsv, workersCsv, skillsCsv, machinesCsv] = await Promise.all([
        files.operations?.text() ?? Promise.resolve(""),
        files.workers?.text() ?? Promise.resolve(""),
        files.skills?.text() ?? Promise.resolve(""),
        files.machines?.text() ?? Promise.resolve(""),
      ]);
      const next = await importScenarioCsvs({
        operations_csv: operationsCsv,
        workers_csv: workersCsv,
        worker_skills_csv: skillsCsv,
        machines_csv: machinesCsv,
      });
      setPreview(next);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setValidating(false);
    }
  }

  async function handleWorkbookSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!workbook) {
      setError(t("scenarioImport.workbookMissing"));
      setPreview(null);
      return;
    }
    if (workbook.size > MAX_IMPORT_BYTES) {
      setError(t("scenarioImport.workbookTooLarge"));
      setPreview(null);
      return;
    }

    setWorkbookValidating(true);
    setError(null);
    setPreview(null);
    try {
      const buffer = await workbook.arrayBuffer();
      const next = await importScenarioWorkbook(buffer);
      setPreview(next);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setWorkbookValidating(false);
    }
  }

  return (
    <section className="panel scenario-import" aria-label={t("scenarioImport.aria")}>
      <div className="panel-head">
        <div>
          <span className="eyebrow">{t("scenarioImport.eyebrow")}</span>
          <h2>{t("scenarioImport.title")}</h2>
        </div>
        <span className="panel-chip chip-muted">CSV · XLSX</span>
      </div>
      <p className="panel-intro">{t("scenarioImport.note")}</p>

      <form className="scenario-import-form" onSubmit={handleSubmit}>
        <div className="scenario-import-grid">
          {FILE_FIELDS.map((field) => (
            <label className="field scenario-import-file" key={field.key}>
              <span>
                {t(field.labelKey)}
                <em className="scenario-import-requirement">
                  {field.required
                    ? t("scenarioImport.required")
                    : t("scenarioImport.optional")}
                </em>
              </span>
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={(event) =>
                  updateFile(field.key, event.currentTarget.files?.[0] ?? null)
                }
              />
              <small className="field-hint">{t(field.hintKey)}</small>
            </label>
          ))}
        </div>

        <div className="material-check-actions">
          <button
            className="primary-button"
            type="submit"
            disabled={validating || workbookValidating || applying}
          >
            {validating ? t("scenarioImport.validating") : t("scenarioImport.submit")}
          </button>
        </div>
      </form>

      <div className="scenario-import-divider" role="separator">
        <span>{t("scenarioImport.or")}</span>
      </div>

      <form
        className="scenario-import-form scenario-import-workbook"
        onSubmit={handleWorkbookSubmit}
      >
        <label className="field scenario-import-file">
          <span>{t("scenarioImport.workbookFile")}</span>
          <input
            type="file"
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            onChange={(event) => updateWorkbook(event.currentTarget.files?.[0] ?? null)}
          />
          <small className="field-hint">{t("scenarioImport.workbookHint")}</small>
        </label>

        <div className="material-check-actions">
          <button
            className="primary-button"
            type="submit"
            disabled={workbookValidating || validating || applying}
          >
            {workbookValidating
              ? t("scenarioImport.workbookValidating")
              : t("scenarioImport.workbookSubmit")}
          </button>
        </div>
      </form>

      {error ? (
        <p className="form-error" role="alert">
          {apiErrorMessage(error, language, t) || t("scenarioImport.error")}
        </p>
      ) : null}

      {preview ? (
        <ScenarioImportResult preview={preview} applying={applying} onApply={onApply} />
      ) : (
        <div className="empty-state scenario-import-empty">
          {t("scenarioImport.empty")}
        </div>
      )}
    </section>
  );
}

function ScenarioImportResult({
  preview,
  applying,
  onApply,
}: {
  preview: ScenarioImportPreview;
  applying: boolean;
  onApply: (preview: ScenarioImportPreview) => Promise<void>;
}) {
  const { t } = useLanguage();
  const counts = preview.counts;

  return (
    <div className="scenario-import-preview" aria-live="polite">
      <div className="panel-head">
        <div>
          <span className="eyebrow">{t("scenarioImport.previewTitle")}</span>
          <h3>
            {preview.style_code ?? t("scenarioImport.unknownStyle")}
            {preview.line_name ? ` · ${preview.line_name}` : ""}
          </h3>
        </div>
        <span className="panel-chip chip-muted">{preview.data_policy}</span>
      </div>

      <div className="scenario-import-counts">
        <article>
          <span>{t("scenarioImport.count.operations")}</span>
          <strong>{formatNumber(counts.operations, 0)}</strong>
        </article>
        <article>
          <span>{t("scenarioImport.count.workers")}</span>
          <strong>{formatNumber(counts.workers, 0)}</strong>
        </article>
        <article>
          <span>{t("scenarioImport.count.skills")}</span>
          <strong>{formatNumber(counts.skill_assignments, 0)}</strong>
        </article>
        <article>
          <span>{t("scenarioImport.count.machines")}</span>
          <strong>{formatNumber(counts.machines, 0)}</strong>
        </article>
      </div>

      <div className="scenario-import-meta">
        <span>
          {t("scenarioImport.layers")}:{" "}
          <strong>{formatNumber(counts.precedence_layers, 0)}</strong>
        </span>
        <span>
          {t("scenarioImport.machineTypes")}:{" "}
          <strong>{counts.machine_types.join(", ") || "—"}</strong>
        </span>
      </div>

      <div className="table-wrap">
        <table className="data-table scenario-import-table">
          <thead>
            <tr>
              <th scope="col">{t("scenarioImport.table.operation")}</th>
              <th scope="col" className="num">
                {t("scenarioImport.table.sam")}
              </th>
              <th scope="col">{t("scenarioImport.table.predecessors")}</th>
              <th scope="col">{t("scenarioImport.table.machine")}</th>
              <th scope="col">{t("scenarioImport.table.skill")}</th>
            </tr>
          </thead>
          <tbody>
            {preview.operations.map((operation) => (
              <tr key={operation.id}>
                <td>
                  <span className="row-label">{operation.name}</span>
                  <span className="row-note">
                    {operation.id} · #{operation.sequence}
                  </span>
                </td>
                <td className="num">{formatNumber(operation.sam_sec, 1)}</td>
                <td>
                  {operation.predecessors.length
                    ? operation.predecessors.join(", ")
                    : t("scenarioImport.noPredecessors")}
                </td>
                <td>{operation.machine_type ?? t("scenarioImport.manual")}</td>
                <td>
                  {operation.skill_code} ≥ {operation.skill_required}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="scenario-import-apply">
        <button
          className="primary-button"
          type="button"
          disabled={applying}
          onClick={() => void onApply(preview)}
        >
          {applying ? t("scenarioImport.applying") : t("scenarioImport.apply")}
        </button>
        <p>{t("scenarioImport.applyHint")}</p>
      </div>

      <p className="panel-footnote">{t("scenarioImport.footnote")}</p>
    </div>
  );
}
