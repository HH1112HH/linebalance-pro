import { useState } from "react";
import type { Snapshot } from "../types";
import { optimizationStatusLabel, useLanguage } from "../i18n";
import { cx } from "../utils";

interface Props {
  snapshots: Snapshot[];
  activeId: string | null;
  onSave: (name: string) => string | null;
  onLoad: (snapshot: Snapshot) => void;
  onDelete: (id: string) => void;
}

export default function SnapshotsPanel({
  snapshots,
  activeId,
  onSave,
  onLoad,
  onDelete,
}: Props) {
  const { t } = useLanguage();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  function save() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError(t("snapshots.error.name"));
      return;
    }
    const message = onSave(trimmed);
    if (message) {
      setError(message);
      return;
    }
    setError(null);
    setName("");
  }

  return (
    <section className="panel snapshots-panel" aria-labelledby="snapshots-title">
      <div className="panel-head">
        <div>
          <span className="eyebrow">{t("snapshots.eyebrow")}</span>
          <h2 id="snapshots-title">{t("snapshots.title")}</h2>
        </div>
        <span className="panel-chip chip-muted">{t("snapshots.chip")}</span>
      </div>

      <p className="panel-intro">{t("snapshots.intro")}</p>

      <div className="snapshot-form">
        <input
          value={name}
          maxLength={80}
          placeholder={t("snapshots.placeholder")}
          aria-label={t("snapshots.nameAria")}
          onChange={(event) => setName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") save();
          }}
        />
        <button type="button" className="secondary-button" onClick={save}>
          {t("snapshots.save")}
        </button>
      </div>
      {error ? <p className="form-error">{error}</p> : null}

      {snapshots.length === 0 ? (
        <p className="muted-text">{t("snapshots.empty")}</p>
      ) : (
        <ul className="snapshot-list">
          {snapshots.map((snapshot) => (
            <li
              key={snapshot.id}
              className={cx(activeId === snapshot.id && "is-active")}
            >
              <div className="snapshot-main">
                <strong>{snapshot.name}</strong>
                <span>
                  {t("snapshots.meta", {
                    savedAt: snapshot.savedAt,
                    status: optimizationStatusLabel(snapshot.result.status, t),
                    workers: snapshot.result.kpis?.workers_used ?? "—",
                  })}
                </span>
              </div>
              <div className="snapshot-actions">
                <button
                  type="button"
                  className="text-button"
                  onClick={() => onLoad(snapshot)}
                  aria-label={t("snapshots.loadAria", { name: snapshot.name })}
                >
                  {t("snapshots.load")}
                </button>
                <button
                  type="button"
                  className="text-button danger"
                  onClick={() => onDelete(snapshot.id)}
                  aria-label={t("snapshots.deleteAria", { name: snapshot.name })}
                >
                  {t("snapshots.delete")}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
