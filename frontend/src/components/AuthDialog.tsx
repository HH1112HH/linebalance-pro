import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useLanguage } from "../i18n";

interface Props {
  busy: boolean;
  error: string | null;
  loginEnabled: boolean;
  onClose: () => void;
  onSubmit: (username: string, password: string) => void;
}

export default function AuthDialog({
  busy,
  error,
  loginEnabled,
  onClose,
  onSubmit,
}: Props) {
  const { t } = useLanguage();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) onCloseRef.current();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [busy]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = username.trim();
    if (!trimmed || !password) return;
    onSubmit(trimmed, password);
  }

  return (
    <div
      className="auth-dialog-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onClose();
      }}
    >
      <section
        className="auth-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-dialog-title"
      >
        <div className="auth-dialog-head">
          <div>
            <span className="eyebrow">{t("auth.eyebrow")}</span>
            <h2 id="auth-dialog-title">{t("auth.title")}</h2>
          </div>
          <button
            type="button"
            className="alert-close"
            aria-label={t("auth.close")}
            onClick={onClose}
            disabled={busy}
          >
            ×
          </button>
        </div>

        <p className="auth-intro">{t("auth.intro")}</p>

        {!loginEnabled ? (
          <p className="form-error" role="alert">
            {t("auth.disabled")}
          </p>
        ) : null}

        <form className="auth-form" onSubmit={submit}>
          <label className="auth-field">
            <span>{t("auth.username")}</span>
            <input
              value={username}
              maxLength={32}
              autoComplete="username"
              autoFocus
              disabled={busy || !loginEnabled}
              onChange={(event) => setUsername(event.target.value)}
            />
          </label>
          <label className="auth-field">
            <span>{t("auth.password")}</span>
            <input
              type="password"
              value={password}
              maxLength={200}
              autoComplete="current-password"
              disabled={busy || !loginEnabled}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>

          {error ? (
            <p className="form-error" role="alert">
              {error}
            </p>
          ) : null}

          <p className="auth-hint">{t("auth.demoAccounts")}</p>

          <div className="auth-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={onClose}
              disabled={busy}
            >
              {t("auth.cancel")}
            </button>
            <button
              type="submit"
              className="primary-button"
              disabled={busy || !loginEnabled || !username.trim() || !password}
            >
              {busy ? t("auth.submitting") : t("auth.submit")}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
