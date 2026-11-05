import { useLanguage } from "../i18n";

export default function TimeStudyGuide() {
  const { t } = useLanguage();
  return (
    <section className="panel method-panel" aria-labelledby="method-title">
      <div className="panel-head">
        <div>
          <span className="eyebrow">{t("guide.eyebrow")}</span>
          <h2 id="method-title">{t("guide.title")}</h2>
        </div>
        <span className="panel-chip chip-muted">{t("guide.chip")}</span>
      </div>

      <ol className="method-steps">
        <li>
          <span className="method-num">01</span>
          <div>
            <h3>{t("guide.step1.title")}</h3>
            <p>{t("guide.step1.body")}</p>
            <code>{t("guide.step1.code")}</code>
          </div>
        </li>
        <li>
          <span className="method-num">02</span>
          <div>
            <h3>{t("guide.step2.title")}</h3>
            <p>{t("guide.step2.body")}</p>
            <code>{t("guide.step2.code")}</code>
          </div>
        </li>
        <li>
          <span className="method-num">03</span>
          <div>
            <h3>{t("guide.step3.title")}</h3>
            <p>{t("guide.step3.body")}</p>
            <code>{t("guide.step3.code")}</code>
          </div>
        </li>
        <li>
          <span className="method-num">04</span>
          <div>
            <h3>{t("guide.step4.title")}</h3>
            <p>{t("guide.step4.body")}</p>
            <code>{t("guide.step4.code")}</code>
          </div>
        </li>
      </ol>

      <div className="method-warning">
        <strong>{t("guide.warning.title")}</strong>
        <span>{t("guide.warning.body")}</span>
      </div>
    </section>
  );
}
