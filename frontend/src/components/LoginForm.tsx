import { useId, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useLanguage } from "../i18n";
import type { AuthRole } from "../types";
import { cx } from "../utils";

const DEMO_ACCOUNTS = ["admin", "test1", "test2", "test3", "test4"] as const;

interface Props {
  busy: boolean;
  error: string | null;
  loginEnabled: boolean;
  autoFocus?: boolean;
  onSubmit: (username: string, password: string) => void;
}

function roleForUsername(username: string): AuthRole | null {
  const normalized = username.trim().toLowerCase();
  if (!normalized) return null;
  if (normalized === "admin") return "admin";
  if (DEMO_ACCOUNTS.includes(normalized as (typeof DEMO_ACCOUNTS)[number])) {
    return "viewer";
  }
  return null;
}

export default function LoginForm({
  busy,
  error,
  loginEnabled,
  autoFocus = false,
  onSubmit,
}: Props) {
  const { t } = useLanguage();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const passwordRef = useRef<HTMLInputElement>(null);
  const fieldId = useId();
  const usernameId = `${fieldId}-username`;
  const passwordId = `${fieldId}-password`;
  const errorId = `${fieldId}-error`;
  const role = roleForUsername(username);

  function chooseAccount(account: string) {
    setUsername(account);
    setShowPassword(false);
    passwordRef.current?.focus();
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = username.trim();
    if (!trimmed || !password || !loginEnabled || busy) return;
    onSubmit(trimmed, password);
  }

  return (
    <form className="auth-form" onSubmit={submit} noValidate>
      {!loginEnabled ? (
        <p className="auth-disabled" role="status">
          {t("auth.disabled")}
        </p>
      ) : null}

      <div className="auth-accounts">
        <span className="auth-accounts-label">{t("auth.accountGroup")}</span>
        <div
          className="auth-account-row"
          role="group"
          aria-label={t("auth.accountGroup")}
        >
          {DEMO_ACCOUNTS.map((account) => (
            <button
              key={account}
              type="button"
              className={cx(
                "auth-account",
                username.trim().toLowerCase() === account && "is-active",
              )}
              aria-pressed={username.trim().toLowerCase() === account}
              disabled={busy || !loginEnabled}
              onClick={() => chooseAccount(account)}
            >
              <span>{account}</span>
              <small>
                {account === "admin" ? t("topbar.admin") : t("topbar.viewer")}
              </small>
            </button>
          ))}
        </div>
      </div>

      <div className="auth-field">
        <label htmlFor={usernameId}>
          {t("auth.username")}
          {role ? (
            <em className={cx("auth-role-badge", `is-${role}`)}>
              {role === "admin" ? t("topbar.admin") : t("topbar.viewer")}
            </em>
          ) : null}
        </label>
        <input
          id={usernameId}
          value={username}
          maxLength={32}
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          autoFocus={autoFocus}
          disabled={busy || !loginEnabled}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          onChange={(event) => setUsername(event.target.value)}
        />
      </div>

      <div className="auth-field">
        <label htmlFor={passwordId}>{t("auth.password")}</label>
        <span className="auth-password-row">
          <input
            ref={passwordRef}
            id={passwordId}
            type={showPassword ? "text" : "password"}
            value={password}
            maxLength={200}
            autoComplete="current-password"
            disabled={busy || !loginEnabled}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? errorId : undefined}
            onChange={(event) => setPassword(event.target.value)}
          />
          <button
            type="button"
            className="auth-password-toggle"
            aria-label={showPassword ? t("auth.hidePassword") : t("auth.showPassword")}
            aria-pressed={showPassword}
            disabled={busy || !loginEnabled}
            onClick={() => setShowPassword((visible) => !visible)}
          >
            {showPassword ? t("auth.hide") : t("auth.show")}
          </button>
        </span>
      </div>

      {error ? (
        <p className="form-error auth-error" id={errorId} role="alert">
          {error}
        </p>
      ) : null}

      <p className="auth-hint">{t("auth.demoAccounts")}</p>

      <button
        type="submit"
        className="auth-submit"
        disabled={busy || !loginEnabled || !username.trim() || !password}
      >
        {busy ? t("auth.submitting") : t("auth.submit")}
        <span aria-hidden="true">→</span>
      </button>
    </form>
  );
}
