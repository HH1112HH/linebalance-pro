from __future__ import annotations

import logging
import os
import re
import threading
from dataclasses import dataclass
from typing import Any

from psycopg_pool import ConnectionPool

from .scenario_store import PostgresScenarioRepository, ScenarioRepository

logger = logging.getLogger("linebalance.persistence")

WORKSPACE_ID_RE = re.compile(r"^[a-z0-9][a-z0-9_-]{0,63}$")
DEFAULT_MAX_BODY_BYTES = 2_000_000
MAX_SCENARIO_PAYLOAD_BYTES = 1_500_000
DEFAULT_MAX_PAYLOAD_BYTES = MAX_SCENARIO_PAYLOAD_BYTES
DEFAULT_MAX_PER_WORKSPACE = 200
DEFAULT_SAVE_RATE_LIMIT_MAX = 5
DEFAULT_SAVE_RATE_LIMIT_WINDOW_SEC = 60
DEFAULT_DB_POOL_MIN = 1
DEFAULT_DB_POOL_MAX = 5
DEFAULT_DB_TIMEOUT_SEC = 5
MIN_TOKEN_BYTES = 32


class ScenarioUnavailableError(Exception):
    """Persistence is disabled, misconfigured, or the database is unavailable."""


@dataclass(frozen=True, slots=True)
class ScenarioSettings:
    mode: str
    database_url: str | None
    api_token: str | None
    api_token_previous: str | None
    workspace_id: str
    actor_label: str
    max_per_workspace: int
    max_payload_bytes: int
    save_rate_limit_max: int
    save_rate_limit_window_sec: int
    db_pool_min: int
    db_pool_max: int
    db_timeout_sec: int
    config_error: str | None = None

    @property
    def enabled(self) -> bool:
        return self.mode == "postgres"

    @property
    def configured(self) -> bool:
        return self.enabled and self.config_error is None

    @property
    def reason(self) -> str | None:
        if not self.enabled:
            return "disabled"
        return self.config_error

    @property
    def token_candidates(self) -> tuple[str, ...]:
        values = [value for value in (self.api_token, self.api_token_previous) if value]
        return tuple(values)

    @classmethod
    def from_env(
        cls, *, max_body_bytes: int = DEFAULT_MAX_BODY_BYTES
    ) -> ScenarioSettings:
        mode = os.getenv("SCENARIO_PERSISTENCE", "localStorage").strip()
        database_url = os.getenv("DATABASE_URL") or None
        api_token = os.getenv("SCENARIO_API_TOKEN") or None
        previous = os.getenv("SCENARIO_API_TOKEN_PREVIOUS") or None
        workspace_id = os.getenv("SCENARIO_WORKSPACE_ID", "demo").strip()
        actor_label = os.getenv("SCENARIO_ACTOR_LABEL", "admin").strip() or "admin"

        max_per_workspace = _env_int(
            "SCENARIO_MAX_PER_WORKSPACE", DEFAULT_MAX_PER_WORKSPACE, minimum=1
        )
        max_payload_bytes = _env_int(
            "SCENARIO_MAX_PAYLOAD_BYTES",
            DEFAULT_MAX_PAYLOAD_BYTES,
            minimum=1,
        )
        max_payload_bytes = min(
            max_payload_bytes, max_body_bytes, MAX_SCENARIO_PAYLOAD_BYTES
        )

        errors: list[str] = []
        if mode not in {"localStorage", "postgres"}:
            errors.append("SCENARIO_PERSISTENCE must be localStorage or postgres.")
        if mode == "postgres":
            if not database_url:
                errors.append("DATABASE_URL is required when persistence is postgres.")
            if not api_token or len(api_token.encode("utf-8")) < MIN_TOKEN_BYTES:
                errors.append(
                    f"SCENARIO_API_TOKEN must be at least {MIN_TOKEN_BYTES} bytes."
                )
            if not WORKSPACE_ID_RE.fullmatch(workspace_id):
                errors.append("SCENARIO_WORKSPACE_ID is invalid.")
            if max_payload_bytes < 1:
                errors.append("SCENARIO_MAX_PAYLOAD_BYTES must be positive.")

        pool_min = _env_int("SCENARIO_DB_POOL_MIN", DEFAULT_DB_POOL_MIN, minimum=0)
        pool_max = _env_int("SCENARIO_DB_POOL_MAX", DEFAULT_DB_POOL_MAX, minimum=1)
        if pool_min > pool_max:
            errors.append("SCENARIO_DB_POOL_MIN must not exceed SCENARIO_DB_POOL_MAX.")

        return cls(
            mode=mode,
            database_url=database_url,
            api_token=api_token,
            api_token_previous=previous,
            workspace_id=workspace_id,
            actor_label=actor_label[:80],
            max_per_workspace=max_per_workspace,
            max_payload_bytes=max_payload_bytes,
            save_rate_limit_max=_env_int(
                "SCENARIO_SAVE_RATE_LIMIT_MAX",
                DEFAULT_SAVE_RATE_LIMIT_MAX,
                minimum=1,
            ),
            save_rate_limit_window_sec=_env_int(
                "SCENARIO_SAVE_RATE_LIMIT_WINDOW_SEC",
                DEFAULT_SAVE_RATE_LIMIT_WINDOW_SEC,
                minimum=1,
            ),
            db_pool_min=pool_min,
            db_pool_max=pool_max,
            db_timeout_sec=max(
                1,
                _env_int("SCENARIO_DB_TIMEOUT_SEC", DEFAULT_DB_TIMEOUT_SEC, minimum=1),
            ),
            config_error="; ".join(errors) or None,
        )


def _env_int(name: str, default: int, *, minimum: int) -> int:
    raw = os.getenv(name)
    if raw is None or not raw.strip():
        return default
    try:
        value = int(raw)
    except ValueError:
        return default
    return max(minimum, value)


def build_scenario_settings(
    *, max_body_bytes: int = DEFAULT_MAX_BODY_BYTES
) -> ScenarioSettings:
    return ScenarioSettings.from_env(max_body_bytes=max_body_bytes)


class ScenarioPersistence:
    """Lazy connection pool and health snapshot; never connects at import time."""

    def __init__(self, settings: ScenarioSettings) -> None:
        self.settings = settings
        self._lock = threading.Lock()
        self._pool: ConnectionPool[Any] | None = None
        self._repository: PostgresScenarioRepository | None = None

    def repository(self) -> ScenarioRepository:
        if not self.settings.configured:
            raise ScenarioUnavailableError(
                self.settings.config_error or "Scenario persistence is disabled."
            )
        with self._lock:
            if self._repository is not None:
                return self._repository
            pool = self._build_pool()
            self._pool = pool
            self._repository = PostgresScenarioRepository(pool)
            return self._repository

    def _build_pool(self) -> ConnectionPool[Any]:
        assert self.settings.database_url is not None
        try:
            pool = ConnectionPool(
                self.settings.database_url,
                min_size=self.settings.db_pool_min,
                max_size=self.settings.db_pool_max,
                timeout=self.settings.db_timeout_sec,
            )
            pool.wait(timeout=self.settings.db_timeout_sec)
            return pool
        except Exception as exc:
            logger.warning(
                "Scenario persistence database unavailable: %s", type(exc).__name__
            )
            raise ScenarioUnavailableError(
                "Scenario persistence database is unavailable."
            ) from exc

    def health(self) -> dict[str, object]:
        if not self.settings.enabled:
            return {
                "mode": self.settings.mode,
                "ready": True,
                "schema_version": None,
                "reason": "disabled",
            }
        if not self.settings.configured:
            return {
                "mode": self.settings.mode,
                "ready": False,
                "schema_version": None,
                "reason": "misconfigured",
            }
        try:
            self.repository()
            assert self._pool is not None
            with self._pool.connection() as conn:
                conn.execute("SELECT 1")
                row = conn.execute(
                    "SELECT version FROM schema_migrations "
                    "ORDER BY version DESC LIMIT 1"
                ).fetchone()
            schema_version = _version_number(row[0]) if row else 0
            return {
                "mode": self.settings.mode,
                "ready": schema_version >= 1,
                "schema_version": schema_version or None,
                "reason": None if schema_version >= 1 else "schema_missing",
            }
        except Exception as exc:
            logger.warning(
                "Scenario persistence health check failed: %s", type(exc).__name__
            )
            return {
                "mode": self.settings.mode,
                "ready": False,
                "schema_version": None,
                "reason": "unavailable",
            }

    def close(self) -> None:
        with self._lock:
            if self._pool is not None:
                self._pool.close()
            self._pool = None
            self._repository = None


def _version_number(value: object) -> int:
    match = re.match(r"^(\d+)", str(value))
    return int(match.group(1)) if match else 0


__all__ = [
    "ScenarioPersistence",
    "ScenarioSettings",
    "ScenarioUnavailableError",
    "build_scenario_settings",
]
