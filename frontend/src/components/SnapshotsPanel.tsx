import { useState } from "react";
import type { Snapshot } from "../types";
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
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  function save() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Give the snapshot a name first.");
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
          <span className="eyebrow">Local persistence</span>
          <h2 id="snapshots-title">Saved snapshots</h2>
        </div>
        <span className="panel-chip chip-muted">localStorage only</span>
      </div>

      <p className="panel-intro">
        Save the current request and result in this browser. There is no server-side
        scenario write API on the public demo.
      </p>

      <div className="snapshot-form">
        <input
          value={name}
          maxLength={80}
          placeholder="e.g. A — after rebalance"
          onChange={(event) => setName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") save();
          }}
        />
        <button type="button" className="secondary-button" onClick={save}>
          Save snapshot
        </button>
      </div>
      {error ? <p className="form-error">{error}</p> : null}

      {snapshots.length === 0 ? (
        <p className="muted-text">No snapshots yet. Save one after a re-run.</p>
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
                  {snapshot.savedAt} · {snapshot.result.status} ·{" "}
                  {snapshot.result.kpis?.workers_used ?? "—"} workers
                </span>
              </div>
              <div className="snapshot-actions">
                <button
                  type="button"
                  className="text-button"
                  onClick={() => onLoad(snapshot)}
                >
                  Load
                </button>
                <button
                  type="button"
                  className="text-button danger"
                  onClick={() => onDelete(snapshot.id)}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
