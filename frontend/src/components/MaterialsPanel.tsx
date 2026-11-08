import { useEffect, useState, type FormEvent } from "react";
import { analyzeMaterials, getMaterialSample, importMaterialCsv } from "../api";
import { apiErrorMessage, useLanguage } from "../i18n";
import type { Language, Translate } from "../i18n";
import type {
  MaterialAnalysisResult,
  MaterialImportPreview,
  MaterialPhase,
  MaterialSampleResult,
  MaterialUsageInput,
  MaterialVarianceLine,
} from "../types";
import { formatNumber, formatPct, formatSigned } from "../utils";

const MAX_CSV_BYTES = 2_000_000;

type SampleState =
  | { status: "loading" }
  | { status: "success"; sample: MaterialSampleResult }
  | { status: "error"; error: string };

export default function MaterialsPanel() {
  const { language, t } = useLanguage();
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<SampleState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    getMaterialSample()
      .then((sample) => {
        if (!cancelled) setState({ status: "success", sample });
      })
      .catch((caught: unknown) => {
        if (!cancelled) {
          setState({
            status: "error",
            error: caught instanceof Error ? caught.message : String(caught),
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  if (state.status === "loading") {
    return (
      <section className="panel" aria-label={t("materials.case.aria")}>
        <div className="empty-state" role="status" aria-live="polite">
          {t("materials.loading")}
        </div>
      </section>
    );
  }

  if (state.status === "error") {
    return (
      <section className="panel" aria-label={t("materials.case.aria")}>
        <div className="flow-error" role="alert">
          <p>{apiErrorMessage(state.error, language, t) || t("materials.error")}</p>
          <button
            className="secondary-button is-compact"
            type="button"
            onClick={() => {
              setState({ status: "loading" });
              setAttempt((current) => current + 1);
            }}
          >
            {t("materials.retry")}
          </button>
        </div>
      </section>
    );
  }

  return (
    <>
      <MaterialCase sample={state.sample} />
      <MaterialImportPanel />
      <MaterialCalculator sample={state.sample} />
    </>
  );
}

function MaterialCase({ sample }: { sample: MaterialSampleResult }) {
  const { t } = useLanguage();
  const beforeById = new Map(
    sample.before.lines.map((line) => [line.material_id, line]),
  );

  return (
    <section className="panel material-case" aria-label={t("materials.case.aria")}>
      <div className="panel-head">
        <div>
          <span className="eyebrow">{t("materials.case.eyebrow")}</span>
          <h2>{t("materials.case.title")}</h2>
        </div>
        <span className="panel-chip chip-muted">{sample.style_code}</span>
      </div>
      <p className="panel-intro">{t("materials.case.note")}</p>

      <div className="material-summary-grid">
        <article className="material-summary-card">
          <span>{t("materials.case.standard")}</span>
          <strong>{vnd(sample.comparison.standard_cost_vnd)}</strong>
          <small>{t("materials.case.standardDetail")}</small>
        </article>
        <article className="material-summary-card is-before">
          <span>{t("materials.case.before")}</span>
          <strong>{vnd(sample.comparison.before_cost_vnd)}</strong>
          <small>
            {t("materials.case.excess", {
              value: vnd(sample.comparison.before_variance_vnd),
            })}
          </small>
        </article>
        <article className="material-summary-card is-after">
          <span>{t("materials.case.after")}</span>
          <strong>{vnd(sample.comparison.after_cost_vnd)}</strong>
          <small>
            {t("materials.case.excess", {
              value: vnd(sample.comparison.after_variance_vnd),
            })}
          </small>
        </article>
        <article className="material-summary-card is-reduction">
          <span>{t("materials.case.reduction")}</span>
          <strong>{vnd(sample.comparison.variance_reduction_vnd)}</strong>
          <small>
            {t("materials.case.reductionDetail", {
              value: formatPct(sample.comparison.variance_reduction_pct, 2),
            })}
          </small>
        </article>
      </div>

      <div className="table-wrap">
        <table className="data-table material-case-table">
          <thead>
            <tr>
              <th scope="col">{t("materials.table.material")}</th>
              <th scope="col" className="num">
                {t("materials.table.standard")}
              </th>
              <th scope="col" className="num">
                {t("materials.table.before")}
              </th>
              <th scope="col" className="num">
                {t("materials.table.after")}
              </th>
              <th scope="col" className="num">
                {t("materials.table.beforeVar")}
              </th>
              <th scope="col" className="num">
                {t("materials.table.afterVar")}
              </th>
            </tr>
          </thead>
          <tbody>
            {sample.after.lines.map((line) => {
              const before = beforeById.get(line.material_id);
              return (
                <tr key={line.material_id}>
                  <td>
                    <span className="row-label">{line.material_name}</span>
                    <span className="row-note">
                      {line.material_id} · {line.unit}
                    </span>
                  </td>
                  <td className="num">{formatNumber(line.standard_qty_per_pc, 2)}</td>
                  <td className="num">
                    {before ? formatNumber(before.actual_qty_per_pc, 2) : "—"}
                  </td>
                  <td className="num">{formatNumber(line.actual_qty_per_pc, 2)}</td>
                  <td className="num">
                    <VariancePct line={before ?? line} />
                  </td>
                  <td className="num">
                    <VariancePct line={line} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="panel-footnote">{t("materials.case.footnote")}</p>
    </section>
  );
}

function MaterialImportPanel() {
  const { language, t } = useLanguage();
  const [phase, setPhase] = useState<MaterialPhase>("BEFORE");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<MaterialImportPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) {
      setError(t("materials.import.fileRequired"));
      setPreview(null);
      return;
    }
    if (file.size > MAX_CSV_BYTES) {
      setError(t("materials.import.fileTooLarge"));
      setPreview(null);
      return;
    }

    setImporting(true);
    setError(null);
    setPreview(null);
    try {
      const csvText = await file.text();
      setPreview(await importMaterialCsv(csvText, phase));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setImporting(false);
    }
  }

  return (
    <section className="panel material-import" aria-label={t("materials.import.aria")}>
      <div className="panel-head">
        <div>
          <span className="eyebrow">{t("materials.import.eyebrow")}</span>
          <h2>{t("materials.import.title")}</h2>
        </div>
        <span className="panel-chip chip-muted">text/csv</span>
      </div>
      <p className="panel-intro">{t("materials.import.note")}</p>

      <form className="material-import-form" onSubmit={handleSubmit}>
        <div className="material-import-controls">
          <label className="field">
            <span>{t("materials.import.phase")}</span>
            <select
              value={phase}
              onChange={(event) => {
                setPhase(event.currentTarget.value as MaterialPhase);
                setPreview(null);
                setError(null);
              }}
            >
              <option value="BEFORE">BEFORE</option>
              <option value="AFTER">AFTER</option>
            </select>
          </label>
          <label className="field material-import-file">
            <span>{t("materials.import.file")}</span>
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={(event) => {
                setFile(event.currentTarget.files?.[0] ?? null);
                setPreview(null);
                setError(null);
              }}
            />
            <small className="field-hint">{t("materials.import.fileHint")}</small>
          </label>
        </div>

        {error ? (
          <p className="form-error" role="alert">
            {apiErrorMessage(error, language, t) || t("materials.import.error")}
          </p>
        ) : null}

        <div className="material-check-actions">
          <button className="primary-button" type="submit" disabled={importing}>
            {importing ? t("materials.import.importing") : t("materials.import.submit")}
          </button>
        </div>
      </form>

      {preview ? (
        <MaterialImportResult preview={preview} language={language} />
      ) : (
        <div className="empty-state material-check-empty">
          {t("materials.import.empty")}
        </div>
      )}
    </section>
  );
}

function MaterialImportResult({
  preview,
  language,
}: {
  preview: MaterialImportPreview;
  language: Language;
}) {
  const { t } = useLanguage();
  const analysis = preview.analysis;
  const warnings = localizedImportWarnings(preview.warnings, language, t);

  return (
    <div className="material-check-result" aria-live="polite">
      <div className="panel-head">
        <div>
          <span className="eyebrow">{t("materials.import.previewTitle")}</span>
          <h3>{preview.style_code}</h3>
        </div>
        <span className="panel-chip chip-muted">{preview.phase}</span>
      </div>

      <div className="material-summary-grid">
        <article className="material-summary-card">
          <span>{t("materials.result.standard")}</span>
          <strong>{vnd(analysis.standard_cost_vnd)}</strong>
        </article>
        <article className="material-summary-card is-before">
          <span>{t("materials.result.actual")}</span>
          <strong>{vnd(analysis.actual_cost_vnd)}</strong>
        </article>
        <article
          className={`material-summary-card ${analysis.variance_vnd > 0 ? "is-before" : "is-reduction"}`}
        >
          <span>{t("materials.result.variance")}</span>
          <strong>{vnd(analysis.variance_vnd)}</strong>
          <small>
            {t("materials.result.variancePct", {
              value: formatSigned(analysis.variance_pct, 2, "%"),
            })}
          </small>
        </article>
        <article className="material-summary-card">
          <span>{t("materials.import.pcs")}</span>
          <strong>{formatNumber(preview.inspected_pcs, 0)}</strong>
          <small>
            {t("materials.import.rows")}: {formatNumber(preview.row_count, 0)} ·{" "}
            {t("materials.import.ignored")}: {formatNumber(preview.ignored_rows, 0)}
          </small>
        </article>
      </div>

      {warnings.length ? (
        <div className="material-import-warnings">
          <strong>{t("materials.import.warnings")}</strong>
          <ul className="note-list">
            {warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="table-wrap">
        <table className="data-table material-import-table">
          <thead>
            <tr>
              <th scope="col">{t("materials.table.material")}</th>
              <th scope="col" className="num">
                {t("materials.check.standard")}
              </th>
              <th scope="col" className="num">
                {t("materials.check.actual")}
              </th>
              <th scope="col" className="num">
                {t("materials.check.unitCost")}
              </th>
            </tr>
          </thead>
          <tbody>
            {preview.materials.map((material) => (
              <tr key={material.material_id}>
                <td>
                  <span className="row-label">{material.material_name}</span>
                  <span className="row-note">
                    {material.material_id} · {material.unit}
                  </span>
                </td>
                <td className="num">{formatNumber(material.standard_qty_per_pc, 2)}</td>
                <td className="num">{formatNumber(material.actual_qty_per_pc, 2)}</td>
                <td className="num">{formatNumber(material.unit_cost_vnd, 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="panel-footnote">{t("materials.import.footnote")}</p>
    </div>
  );
}

function localizedImportWarnings(
  warnings: string[],
  language: Language,
  t: Translate,
): string[] {
  if (language === "en") return warnings;
  return warnings.map((warning) => {
    const ignored = warning.match(
      /^Ignored ([\d,]+) rows for other phases; only ([A-Z]+) was imported\.$/,
    );
    if (ignored) {
      return t("materials.import.warningIgnored", {
        count: ignored[1],
        phase: ignored[2],
      });
    }
    if (warning.startsWith("Derived cost columns were ignored")) {
      return t("materials.import.warningDerived");
    }
    return t("materials.import.warningGeneric");
  });
}

function MaterialCalculator({ sample }: { sample: MaterialSampleResult }) {
  const { language, t } = useLanguage();
  const [draft, setDraft] = useState<MaterialUsageInput[]>(() =>
    sample.materials.map((material) => ({ ...material })),
  );
  const [inspectedPcs, setInspectedPcs] = useState(String(sample.inspected_pcs));
  const [result, setResult] = useState<MaterialAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [calculating, setCalculating] = useState(false);

  function updateMaterial(
    materialId: string,
    field: "actual_qty_per_pc" | "unit_cost_vnd",
    value: number,
  ) {
    setDraft((current) =>
      current.map((material) =>
        material.material_id === materialId
          ? { ...material, [field]: value }
          : material,
      ),
    );
    setResult(null);
    setError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const pcs = Number(inspectedPcs);
    if (!Number.isInteger(pcs) || pcs <= 0) {
      setError(t("materials.check.pcsError"));
      setResult(null);
      return;
    }
    if (
      draft.some(
        (material) =>
          !Number.isFinite(material.actual_qty_per_pc) ||
          material.actual_qty_per_pc < 0 ||
          !Number.isFinite(material.unit_cost_vnd) ||
          material.unit_cost_vnd <= 0,
      )
    ) {
      setError(t("materials.check.valuesError"));
      setResult(null);
      return;
    }

    setCalculating(true);
    setError(null);
    setResult(null);
    try {
      setResult(
        await analyzeMaterials({
          style_code: sample.style_code,
          inspected_pcs: pcs,
          phase: "CURRENT",
          materials: draft,
        }),
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setCalculating(false);
    }
  }

  return (
    <section className="panel material-check" aria-label={t("materials.check.aria")}>
      <div className="panel-head">
        <div>
          <span className="eyebrow">{t("materials.check.eyebrow")}</span>
          <h2>{t("materials.check.title")}</h2>
        </div>
      </div>
      <p className="panel-intro">{t("materials.check.note")}</p>

      <form className="material-check-form" onSubmit={handleSubmit}>
        <label className="field material-pcs-field">
          <span>{t("materials.check.pcs")}</span>
          <input
            type="number"
            min={1}
            max={10_000_000}
            step={1}
            value={inspectedPcs}
            onChange={(event) => {
              setInspectedPcs(event.currentTarget.value);
              setResult(null);
              setError(null);
            }}
          />
        </label>

        <div className="table-wrap">
          <table className="data-table material-input-table">
            <thead>
              <tr>
                <th scope="col">{t("materials.check.material")}</th>
                <th scope="col" className="num">
                  {t("materials.check.standard")}
                </th>
                <th scope="col">{t("materials.check.actual")}</th>
                <th scope="col">{t("materials.check.unitCost")}</th>
              </tr>
            </thead>
            <tbody>
              {draft.map((material) => (
                <tr key={material.material_id}>
                  <td>
                    <span className="row-label">{material.material_name}</span>
                    <span className="row-note">
                      {material.material_id} · {material.unit}
                    </span>
                  </td>
                  <td className="num">
                    {formatNumber(material.standard_qty_per_pc, 2)}
                  </td>
                  <td>
                    <input
                      className="table-input"
                      type="number"
                      min={0}
                      max={100_000}
                      step={0.01}
                      value={material.actual_qty_per_pc}
                      aria-label={`${t("materials.check.actual")}: ${material.material_name}`}
                      onChange={(event) =>
                        updateMaterial(
                          material.material_id,
                          "actual_qty_per_pc",
                          Number(event.currentTarget.value),
                        )
                      }
                    />
                  </td>
                  <td>
                    <input
                      className="table-input"
                      type="number"
                      min={1}
                      max={1_000_000_000}
                      step={1}
                      value={material.unit_cost_vnd}
                      aria-label={`${t("materials.check.unitCost")}: ${material.material_name}`}
                      onChange={(event) =>
                        updateMaterial(
                          material.material_id,
                          "unit_cost_vnd",
                          Number(event.currentTarget.value),
                        )
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {error ? (
          <p className="form-error" role="alert">
            {apiErrorMessage(error, language, t) || t("materials.check.error")}
          </p>
        ) : null}

        <div className="material-check-actions">
          <button className="primary-button" type="submit" disabled={calculating}>
            {calculating
              ? t("materials.check.calculating")
              : t("materials.check.calculate")}
          </button>
        </div>
      </form>

      {result ? (
        <MaterialCheckResult result={result} />
      ) : (
        <div className="empty-state material-check-empty">
          {t("materials.check.empty")}
        </div>
      )}
    </section>
  );
}

function MaterialCheckResult({ result }: { result: MaterialAnalysisResult }) {
  const { t } = useLanguage();
  const isAbove = result.variance_vnd > 0;

  return (
    <div className="material-check-result" aria-live="polite">
      <div className="material-summary-grid">
        <article className="material-summary-card">
          <span>{t("materials.result.standard")}</span>
          <strong>{vnd(result.standard_cost_vnd)}</strong>
        </article>
        <article className="material-summary-card">
          <span>{t("materials.result.actual")}</span>
          <strong>{vnd(result.actual_cost_vnd)}</strong>
        </article>
        <article
          className={`material-summary-card ${isAbove ? "is-before" : "is-reduction"}`}
        >
          <span>{t("materials.result.variance")}</span>
          <strong>{vnd(result.variance_vnd)}</strong>
          <small>
            {t("materials.result.variancePct", {
              value: formatSigned(result.variance_pct, 2, "%"),
            })}
          </small>
        </article>
        <article className="material-summary-card">
          <span>
            {t("materials.result.excessCount", {
              count: result.excess_materials,
              total: result.material_count,
            })}
          </span>
          <strong>{formatPct(result.variance_pct, 2)}</strong>
        </article>
      </div>

      <div className="table-wrap">
        <table className="data-table material-result-table">
          <thead>
            <tr>
              <th scope="col">{t("materials.table.material")}</th>
              <th scope="col" className="num">
                {t("materials.table.standard")}
              </th>
              <th scope="col" className="num">
                {t("materials.check.actual")}
              </th>
              <th scope="col" className="num">
                {t("materials.result.variance")}
              </th>
              <th scope="col">{t("materials.table.variance")}</th>
            </tr>
          </thead>
          <tbody>
            {result.lines.map((line) => (
              <tr key={line.material_id}>
                <td>
                  <span className="row-label">{line.material_name}</span>
                  <span className="row-note">
                    {line.material_id} · {line.unit}
                  </span>
                </td>
                <td className="num">{formatNumber(line.standard_qty_per_pc, 2)}</td>
                <td className="num">{formatNumber(line.actual_qty_per_pc, 2)}</td>
                <td className="num">{vnd(line.variance_vnd)}</td>
                <td>
                  <span
                    className={`material-status ${line.is_excess ? "is-above" : "is-within"}`}
                  >
                    {line.is_excess
                      ? t("materials.result.above")
                      : t("materials.result.within")}
                  </span>
                  <span className="row-note">
                    {formatSigned(line.variance_pct, 2, "%")}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="panel-footnote">{t("materials.result.footnote")}</p>
    </div>
  );
}

function VariancePct({ line }: { line: MaterialVarianceLine }) {
  return (
    <span className={line.is_excess ? "delta delta-warn" : "delta delta-good"}>
      {formatSigned(line.variance_pct, 2, "%")}
    </span>
  );
}

function vnd(value: number): string {
  return `${formatNumber(value, 0)} VND`;
}
