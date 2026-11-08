import { useEffect, useRef, useState } from "react";
import {
  ApiError,
  createServerScenario,
  deleteServerScenario,
  getServerScenario,
  listServerScenarios,
} from "../api";
import { apiErrorMessage, optimizationStatusLabel, useLanguage } from "../i18n";
import type {
  AuthSession,
  SampleRequest,
  ServerScenarioDetail,
  ServerScenarioSummary,
} from "../types";
import { cx, formatDateTime, formatNumber } from "../utils";

interface Props {
  session: AuthSession | null;
  request: SampleRequest;
  onOpenLogin: () => void;
  onLoad: (detail: ServerScenarioDetail) => void;
  onNotice: (message: string) => void;
  onSessionExpired: () => void;
}

export default function ServerSnapshotsPanel({
  session,
  request,
  onOpenLogin,
  onLoad,
  onNotice,
  onSessionExpired,
}: Props) {
  const { t, language, locale } = useLanguage();
  const [items, setItems] = useState<ServerScenarioSummary[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);
  const sessionExpiredRef = useRef(onSessionExpired);

  useEffect(() => {
    sessionExpiredRef.current = onSessionExpired;
  }, [onSessionExpired]);

  useEffect(() => {
    if (!session?.authenticated) return;
    let cancelled = false;
    listServerScenarios()
      .then((page) => {
        if (cancelled) return;
        setItems(page.items);
        setNextCursor(page.next_cursor);
        setError(null);
      })
      .catch((caught: unknown) => {
        if (cancelled) return;
        if (caught instanceof ApiError && caught.status === 401) {
          sessionExpiredRef.current();
          return;
        }
        setError(caught instanceof Error ? caught.message : String(caught));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [session?.authenticated, session?.username, refreshToken]);

  const canWrite = session?.authenticated === true && session.role === "admin";
  const errorText = error ? apiErrorMessage(error, language, t) : null;

  async function save() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError(t("serverScenarios.errorName"));
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const idempotencyKey =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : undefined;
      const detail = await createServerScenario(trimmed, request, idempotencyKey);
      setName("");
      onNotice(t("notice.serverSaved", { name: trimmed }));
      onLoad(detail);
      setRefreshToken((value) => value + 1);
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 401) {
        onSessionExpired();
      } else {
        setError(caught instanceof Error ? caught.message : String(caught));
      }
    } finally {
      setSaving(false);
    }
  }

  async function loadItem(item: ServerScenarioSummary) {
    setBusyId(item.id);
    setError(null);
    try {
      const detail = await getServerScenario(item.id);
      onLoad(detail);
      onNotice(t("notice.serverLoaded", { name: item.name }));
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 401) {
        onSessionExpired();
      } else {
        setError(caught instanceof Error ? caught.message : String(caught));
      }
    } finally {
      setBusyId(null);
    }
  }

  async function removeItem(item: ServerScenarioSummary) {
    if (!window.confirm(t("serverScenarios.confirmDelete", { name: item.name }))) {
      return;
    }
    setBusyId(item.id);
    setError(null);
    try {
      await deleteServerScenario(item.id);
      setItems((previous) => previous.filter((row) => row.id !== item.id));
      onNotice(t("notice.serverDeleted", { name: item.name }));
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 401) {
        onSessionExpired();
      } else {
        setError(caught instanceof Error ? caught.message : String(caught));
      }
    } finally {
      setBusyId(null);
    }
  }

  async function loadMore() {
    if (!nextCursor || loading) return;
    setLoading(true);
    setError(null);
    try {
      const page = await listServerScenarios(nextCursor);
      setItems((previous) => [...previous, ...page.items]);
      setNextCursor(page.next_cursor);
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 401) {
        onSessionExpired();
      } else {
        setError(caught instanceof Error ? caught.message : String(caught));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <section
      className="panel server-scenarios-panel"
      aria-labelledby="server-scenarios-title"
    >
      <div className="panel-head">
        <div>
          <span className="eyebrow">{t("serverScenarios.eyebrow")}</span>
          <h2 id="server-scenarios-title">{t("serverScenarios.title")}</h2>
        </div>
        <span className="panel-chip chip-muted">{t("serverScenarios.chip")}</span>
      </div>

      <p className="panel-intro">{t("serverScenarios.intro")}</p>

      {!session?.authenticated ? (
        <div className="server-auth-prompt">
          <p>{t("serverScenarios.loginPrompt")}</p>
          <button type="button" className="secondary-button" onClick={onOpenLogin}>
            {t("topbar.login")}
          </button>
        </div>
      ) : (
        <>
          <div className="server-role-banner">
            <span className="server-role-name">
              {t("topbar.signedIn", {
                user: session.username ?? "—",
                role: session.role === "admin" ? t("topbar.admin") : t("topbar.viewer"),
              })}
            </span>
            {session.role === "viewer" ? (
              <span>{t("serverScenarios.readOnly")}</span>
            ) : null}
          </div>

          {canWrite ? (
            <div className="snapshot-form server-save-form">
              <input
                value={name}
                maxLength={120}
                placeholder={t("serverScenarios.placeholder")}
                aria-label={t("serverScenarios.nameAria")}
                disabled={saving}
                onChange={(event) => setName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") void save();
                }}
              />
              <button
                type="button"
                className="secondary-button"
                onClick={() => void save()}
                disabled={saving || !name.trim()}
              >
                {saving ? t("serverScenarios.saving") : t("serverScenarios.save")}
              </button>
            </div>
          ) : null}

          {errorText ? (
            <p className="form-error" role="alert">
              {errorText}
            </p>
          ) : null}

          {loading && items.length === 0 ? (
            <p className="muted-text">{t("serverScenarios.loading")}</p>
          ) : items.length === 0 && !errorText ? (
            <p className="muted-text">{t("serverScenarios.empty")}</p>
          ) : items.length > 0 ? (
            <ul className="snapshot-list server-scenario-list">
              {items.map((item) => (
                <li key={item.id} className={cx(busyId === item.id && "is-active")}>
                  <div className="snapshot-main">
                    <strong>{item.name}</strong>
                    <span>
                      {t("serverScenarios.meta", {
                        savedAt: formatDateTime(item.created_at, locale),
                        status: optimizationStatusLabel(item.status, t),
                        workers: formatNumber(item.workers_used, 0),
                        stations: formatNumber(item.stations_used, 0),
                      })}
                    </span>
                  </div>
                  <div className="snapshot-actions">
                    <button
                      type="button"
                      className="text-button"
                      onClick={() => void loadItem(item)}
                      disabled={busyId === item.id}
                      aria-label={t("serverScenarios.loadAria", { name: item.name })}
                    >
                      {t("serverScenarios.load")}
                    </button>
                    {canWrite ? (
                      <button
                        type="button"
                        className="text-button danger"
                        onClick={() => void removeItem(item)}
                        disabled={busyId === item.id}
                        aria-label={t("serverScenarios.deleteAria", {
                          name: item.name,
                        })}
                      >
                        {t("serverScenarios.delete")}
                      </button>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          ) : null}

          {nextCursor ? (
            <button
              type="button"
              className="text-button server-load-more"
              onClick={() => void loadMore()}
              disabled={loading}
            >
              {t("serverScenarios.loadMore")}
            </button>
          ) : null}
        </>
      )}
    </section>
  );
}
