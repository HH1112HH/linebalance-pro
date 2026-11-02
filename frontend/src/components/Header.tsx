import type { HealthResponse } from "../types";
import { cx } from "../utils";

interface Props {
  health: HealthResponse | null;
  healthError: boolean;
}

export default function Header({ health, healthError }: Props) {
  const connected = Boolean(health?.solver_available) && !healthError;

  return (
    <header className="site-header">
      <div className="header-inner">
        <a className="brand" href="#top" aria-label="LineBalance Pro home">
          <span className="brand-mark">LB</span>
          <span className="brand-copy">
            <strong>LineBalance Pro</strong>
            <span>Garment line engineering · Shift demo</span>
          </span>
        </a>

        <nav className="header-nav" aria-label="Sections">
          <a href="#dashboard">Dashboard</a>
          <a href="#takt">Takt</a>
          <a href="#forms">Inputs</a>
          <a href="#run">Method</a>
        </nav>

        <div className="header-status">
          <span className="data-badge">SYNTHETIC DATA ONLY</span>
          <span className={cx("api-badge", connected ? "api-ok" : "api-off")}>
            <i />
            {connected
              ? `API · ${health?.solver_backend?.toUpperCase() ?? "READY"}`
              : healthError
                ? "Static demo"
                : "API check…"}
          </span>
        </div>
      </div>
    </header>
  );
}
