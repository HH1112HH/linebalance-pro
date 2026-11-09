import { useEffect, useRef } from "react";
import { useLanguage } from "../i18n";
import LoginForm from "./LoginForm";

interface Props {
  busy: boolean;
  error: string | null;
  loginEnabled: boolean;
  onClose: () => void;
  onOpenPage: () => void;
  onSubmit: (username: string, password: string) => void;
}

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

export default function AuthDialog({
  busy,
  error,
  loginEnabled,
  onClose,
  onOpenPage,
  onSubmit,
}: Props) {
  const { t } = useLanguage();
  const dialogRef = useRef<HTMLElement>(null);
  const onCloseRef = useRef(onClose);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    returnFocusRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    return () => returnFocusRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) {
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable =
        dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      if (!focusable || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [busy]);

  return (
    <div
      className="auth-dialog-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onClose();
      }}
    >
      <section
        ref={dialogRef}
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

        <LoginForm
          busy={busy}
          error={error}
          loginEnabled={loginEnabled}
          autoFocus
          onSubmit={onSubmit}
        />

        <div className="auth-dialog-foot">
          <button
            type="button"
            className="auth-page-link"
            onClick={onOpenPage}
            disabled={busy}
          >
            {t("auth.openPage")}
          </button>
          <button
            type="button"
            className="secondary-button is-compact"
            onClick={onClose}
            disabled={busy}
          >
            {t("auth.cancel")}
          </button>
        </div>
      </section>
    </div>
  );
}
