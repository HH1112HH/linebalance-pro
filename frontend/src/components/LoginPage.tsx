import { useLanguage } from "../i18n";
import type { AuthSession } from "../types";
import { cx } from "../utils";
import LoginForm from "./LoginForm";

interface Props {
  busy: boolean;
  error: string | null;
  loginEnabled: boolean;
  session: AuthSession | null;
  onLogin: (username: string, password: string) => void;
  onLogout: () => void;
  onBack: () => void;
}

export default function LoginPage({
  busy,
  error,
  loginEnabled,
  session,
  onLogin,
  onLogout,
  onBack,
}: Props) {
  const { language, setLanguage, t } = useLanguage();
  const authenticated = Boolean(session?.authenticated);

  return (
    <div className="login-page">
      <div className="login-page-glow" aria-hidden="true" />
      <div className="login-page-grid" aria-hidden="true" />

      <header className="login-page-bar">
        <button type="button" className="login-brand" onClick={onBack}>
          <span className="login-brand-mark" aria-hidden="true">
            LB
          </span>
          <span className="login-brand-copy">
            <strong>LineBalance</strong>
            <small>IE Control Room</small>
          </span>
        </button>

        <div className="login-page-bar-actions">
          <div
            className="language-switch"
            role="group"
            aria-label={t("topbar.language")}
          >
            <button
              type="button"
              className={cx("language-button", language === "en" && "is-active")}
              aria-pressed={language === "en"}
              aria-label={t("topbar.english")}
              onClick={() => setLanguage("en")}
            >
              EN
            </button>
            <button
              type="button"
              className={cx("language-button", language === "vi" && "is-active")}
              aria-pressed={language === "vi"}
              aria-label={t("topbar.vietnamese")}
              onClick={() => setLanguage("vi")}
            >
              VI
            </button>
          </div>
          <button type="button" className="login-back" onClick={onBack}>
            {t("auth.page.back")}
          </button>
        </div>
      </header>

      <main className="login-page-main">
        <section className="login-story">
          <span className="login-kicker">{t("auth.page.kicker")}</span>
          <h1>
            {t("auth.page.titleLine1")}
            <em>{t("auth.page.titleLine2")}</em>
          </h1>
          <p className="login-story-intro">{t("auth.page.intro")}</p>

          <dl className="login-facts">
            <div>
              <dt>{t("auth.page.factSolver")}</dt>
              <dd>PuLP · HiGHS</dd>
            </div>
            <div>
              <dt>{t("auth.page.factData")}</dt>
              <dd>{t("auth.page.factDataValue")}</dd>
            </div>
            <div>
              <dt>{t("auth.page.factScope")}</dt>
              <dd>{t("auth.page.factScopeValue")}</dd>
            </div>
          </dl>
        </section>

        <section className="login-panel" aria-labelledby="login-page-title">
          <span className="login-panel-rule" aria-hidden="true" />
          {authenticated ? (
            <>
              <span className="login-kicker">{t("auth.page.sessionKicker")}</span>
              <h2 id="login-page-title">{t("auth.page.signedInTitle")}</h2>
              <p className="login-panel-intro">
                {t("auth.page.signedInBody", {
                  user: session?.username ?? "",
                  role:
                    session?.role === "admin" ? t("topbar.admin") : t("topbar.viewer"),
                })}
              </p>
              <div className="login-session-card">
                <span className="login-session-avatar" aria-hidden="true">
                  {(session?.username ?? "?").slice(0, 1).toUpperCase()}
                </span>
                <span>
                  <strong>{session?.username}</strong>
                  <small>
                    {session?.role === "admin" ? t("topbar.admin") : t("topbar.viewer")}
                  </small>
                </span>
              </div>
              <button type="button" className="auth-submit" onClick={onBack}>
                {t("auth.page.continue")}
                <span aria-hidden="true">→</span>
              </button>
              <button
                type="button"
                className="auth-page-link login-signout"
                onClick={onLogout}
                disabled={busy}
              >
                {t("auth.page.signOut")}
              </button>
            </>
          ) : (
            <>
              <span className="login-kicker">{t("auth.page.panelKicker")}</span>
              <h2 id="login-page-title">{t("auth.page.panelTitle")}</h2>
              <p className="login-panel-intro">{t("auth.page.panelIntro")}</p>
              <LoginForm
                busy={busy}
                error={error}
                loginEnabled={loginEnabled}
                autoFocus
                onSubmit={onLogin}
              />
            </>
          )}
        </section>
      </main>

      <footer className="login-page-foot">
        <span>{t("auth.page.footer")}</span>
        <span>© 2026 Hồ Văn Thiên Hoàng</span>
      </footer>
    </div>
  );
}
