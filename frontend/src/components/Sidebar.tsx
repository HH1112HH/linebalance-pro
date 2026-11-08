import { dataPolicyLabel, useLanguage } from "../i18n";
import { SECTIONS } from "../sections";
import type { HealthResponse, SectionKey } from "../types";
import { cx, formatSolverBackend } from "../utils";

interface Props {
  active: SectionKey;
  health: HealthResponse | null;
  healthError: boolean;
  onSelect: (section: SectionKey) => void;
}

export default function Sidebar({ active, health, healthError, onSelect }: Props) {
  const { t } = useLanguage();
  const connected = Boolean(health?.solver_available) && !healthError;
  const statusLabel = connected
    ? t("sidebar.apiOnline", {
        solver: formatSolverBackend(health?.solver_backend) || t("topbar.ready"),
      })
    : healthError
      ? t("sidebar.staticDemo")
      : t("sidebar.checkingApi");

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="sidebar-mark" aria-hidden="true">
          LB
        </span>
        <span className="sidebar-brand-copy">
          <strong>LineBalance</strong>
          <span>{t("sidebar.controlRoom")}</span>
        </span>
      </div>

      <nav className="sidebar-nav" aria-label={t("sidebar.navAria")}>
        {SECTIONS.map((item) => (
          <button
            key={item.key}
            type="button"
            className={cx("nav-item", active === item.key && "is-active")}
            aria-current={active === item.key ? "page" : undefined}
            onClick={() => onSelect(item.key)}
          >
            <span className="nav-icon" aria-hidden="true">
              <NavIcon name={item.key} />
            </span>
            <span className="nav-label">
              <strong className="nav-label-full">{t(item.labelKey)}</strong>
              <strong className="nav-label-short">{t(item.shortKey)}</strong>
              <small>{t(item.hintKey)}</small>
            </span>
            <span className="nav-rail" aria-hidden="true" />
          </button>
        ))}
      </nav>

      <div className="sidebar-foot">
        <span className="sidebar-badge">{t("sidebar.synthetic")}</span>
        <div className="sidebar-status">
          <span
            className={cx(
              "status-light",
              connected ? "is-ok" : healthError ? "is-off" : "is-wait",
            )}
            aria-hidden="true"
          />
          <span>
            <strong>{statusLabel}</strong>
            <small>
              {health
                ? `v${health.version} · ${dataPolicyLabel(health.data_policy, t)}`
                : t("sidebar.healthCheck")}
            </small>
          </span>
        </div>
        <span className="sidebar-version">{t("sidebar.stack")}</span>
      </div>
    </aside>
  );
}

function NavIcon({ name }: { name: SectionKey }) {
  const common = {
    width: 18,
    height: 18,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (name) {
    case "overview":
      return (
        <svg {...common}>
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
        </svg>
      );
    case "balance":
      return (
        <svg {...common}>
          <path d="M4 20V10" />
          <path d="M10 20V4" />
          <path d="M16 20v-7" />
          <path d="M22 20H2" />
        </svg>
      );
    case "capacity":
      return (
        <svg {...common}>
          <circle cx="9" cy="8" r="3" />
          <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
          <path d="M16 5.5a3 3 0 0 1 0 5.8" />
          <path d="M18 14.5c2 .8 3 2.6 3 5.5" />
        </svg>
      );
    case "actuals":
      return (
        <svg {...common}>
          <path d="M5 4h14v17H5z" />
          <path d="M9 4V2h6v2" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      );
    case "time-study":
      return (
        <svg {...common}>
          <circle cx="12" cy="13" r="8" />
          <path d="M12 9v4l2.5 2" />
          <path d="M9 2h6" />
          <path d="M12 2v3" />
        </svg>
      );
    case "style-setup":
      return (
        <svg {...common}>
          <rect x="5" y="3" width="14" height="18" rx="2" />
          <path d="m8 9 1.5 1.5L12 8" />
          <path d="M14 9h2" />
          <path d="m8 15 1.5 1.5L12 14" />
          <path d="M14 15h2" />
        </svg>
      );
    case "materials":
      return (
        <svg {...common}>
          <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" />
          <path d="m4 7.5 8 4.5 8-4.5" />
          <path d="M12 12v9" />
        </svg>
      );
    case "solver":
      return (
        <svg {...common}>
          <ellipse cx="12" cy="5" rx="7" ry="3" />
          <path d="M5 5v6c0 1.7 3.1 3 7 3s7-1.3 7-3V5" />
          <path d="M5 11v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6" />
        </svg>
      );
  }
}
