from __future__ import annotations

import base64
import binascii
import hashlib
import hmac
import json
import logging
import os
import re
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from typing import Literal, cast

logger = logging.getLogger("linebalance.auth")

Role = Literal["admin", "viewer"]
AuthMethod = Literal["bearer", "session"]
CookieSecureMode = Literal["auto", "always", "never"]

DEFAULT_ADMIN_USERS = ("admin",)
DEFAULT_VIEWER_USERS = ("test1", "test2", "test3", "test4")
DEFAULT_SESSION_TTL_SEC = 8 * 60 * 60
MIN_PASSWORD_LENGTH = 8
MIN_SESSION_SECRET_BYTES = 32
MAX_SESSION_TOKEN_LENGTH = 4096
MAX_SESSION_TTL_SEC = 30 * 24 * 60 * 60
SESSION_COOKIE_NAME = "lb_session"
SECURE_SESSION_COOKIE_NAME = "__Host-lb_session"
USERNAME_PATTERN = re.compile(r"^[a-z0-9][a-z0-9_-]{0,31}$")
COOKIE_SECURE_MODES = frozenset({"auto", "always", "never"})
TOKEN_VERSION = 1


class AuthUnavailableError(Exception):
    """Login is disabled or missing required server-side configuration."""


@dataclass(frozen=True, slots=True)
class Principal:
    """Authenticated caller attached to a request."""

    username: str
    role: Role
    auth_method: AuthMethod
    expires_at: datetime | None = None

    @property
    def can_write(self) -> bool:
        return self.role == "admin"


@dataclass(frozen=True, slots=True)
class AuthSettings:
    """Demo account configuration.

    This is intentionally a small, environment-backed account list for a
    synthetic-data portfolio demo. It is not a replacement for a real identity
    provider and it does not store passwords in PostgreSQL.
    """

    password: str | None
    session_secret: str | None
    admin_users: tuple[str, ...]
    viewer_users: tuple[str, ...]
    session_ttl_sec: int
    cookie_secure: CookieSecureMode
    config_error: str | None = None
    admin_password: str | None = None
    viewer_password: str | None = None

    @property
    def enabled(self) -> bool:
        return bool(self.password or self.admin_password or self.viewer_password)

    @property
    def configured(self) -> bool:
        return self.enabled and self.config_error is None

    @property
    def reason(self) -> str | None:
        if not self.enabled:
            return "disabled"
        return self.config_error

    @property
    def users(self) -> tuple[str, ...]:
        return self.admin_users + self.viewer_users

    def role_for(self, username: str) -> Role | None:
        normalized = username.strip().lower()
        if normalized in self.admin_users:
            return "admin"
        if normalized in self.viewer_users:
            return "viewer"
        return None

    def password_for(self, role: Role) -> str | None:
        """Return the configured password for a role, with shared fallback."""
        if role == "admin":
            return self.admin_password or self.password
        return self.viewer_password or self.password

    def password_fingerprint_for(self, role: Role) -> str:
        password = self.password_for(role)
        if not password:
            return ""
        digest = hashlib.sha256(password.encode("utf-8")).hexdigest()
        return digest[:16]

    @property
    def password_fingerprint(self) -> str:
        if not self.password:
            return ""
        digest = hashlib.sha256(self.password.encode("utf-8")).hexdigest()
        return digest[:16]

    @classmethod
    def from_env(cls) -> AuthSettings:
        password = os.getenv("AUTH_DEMO_PASSWORD") or None
        admin_password = os.getenv("AUTH_ADMIN_PASSWORD") or None
        viewer_password = os.getenv("AUTH_VIEWER_PASSWORD") or None
        session_secret = os.getenv("AUTH_SESSION_SECRET") or None
        admin_users = _parse_users(os.getenv("AUTH_ADMIN_USERS"), DEFAULT_ADMIN_USERS)
        viewer_users = _parse_users(
            os.getenv("AUTH_VIEWER_USERS"), DEFAULT_VIEWER_USERS
        )
        cookie_secure = (
            os.getenv("AUTH_COOKIE_SECURE", "auto").strip().lower() or "auto"
        )

        configured_passwords = {
            "AUTH_DEMO_PASSWORD": password,
            "AUTH_ADMIN_PASSWORD": admin_password,
            "AUTH_VIEWER_PASSWORD": viewer_password,
        }
        errors: list[str] = []
        for name, value in configured_passwords.items():
            if value is not None and len(value) < MIN_PASSWORD_LENGTH:
                errors.append(
                    f"{name} must be at least {MIN_PASSWORD_LENGTH} characters."
                )
        if any(configured_passwords.values()):
            if not session_secret:
                errors.append("AUTH_SESSION_SECRET is required when login is enabled.")
            elif len(session_secret.encode("utf-8")) < MIN_SESSION_SECRET_BYTES:
                errors.append(
                    "AUTH_SESSION_SECRET must be at least "
                    f"{MIN_SESSION_SECRET_BYTES} bytes."
                )
        if admin_password is not None and admin_password == viewer_password:
            errors.append("AUTH_ADMIN_PASSWORD and AUTH_VIEWER_PASSWORD must differ.")
        if cookie_secure not in COOKIE_SECURE_MODES:
            errors.append("AUTH_COOKIE_SECURE must be auto, always or never.")
        if not admin_users:
            errors.append("AUTH_ADMIN_USERS must contain at least one admin user.")
        overlap = set(admin_users) & set(viewer_users)
        if overlap:
            errors.append("AUTH_ADMIN_USERS and AUTH_VIEWER_USERS must not overlap.")
        for username in admin_users + viewer_users:
            if not USERNAME_PATTERN.fullmatch(username):
                errors.append(f"Invalid auth username: {username!r}.")
        for name, value in configured_passwords.items():
            if value is not None and len(value) < 12:
                logger.warning(
                    "%s is a short demo password; change it before any public "
                    "deployment.",
                    name,
                )

        cookie_mode = cast(
            CookieSecureMode,
            cookie_secure if cookie_secure in COOKIE_SECURE_MODES else "auto",
        )
        return cls(
            password=password,
            session_secret=session_secret,
            admin_users=admin_users,
            viewer_users=viewer_users,
            session_ttl_sec=_env_int(
                "AUTH_SESSION_TTL_SEC",
                DEFAULT_SESSION_TTL_SEC,
                minimum=300,
                maximum=MAX_SESSION_TTL_SEC,
            ),
            cookie_secure=cookie_mode,
            config_error="; ".join(errors) or None,
            admin_password=admin_password,
            viewer_password=viewer_password,
        )


def _env_int(name: str, default: int, *, minimum: int, maximum: int) -> int:
    raw = os.getenv(name)
    if raw is None or not raw.strip():
        return default
    try:
        value = int(raw)
    except ValueError:
        return default
    return max(minimum, min(maximum, value))


def _parse_users(raw: str | None, default: tuple[str, ...]) -> tuple[str, ...]:
    if raw is None:
        return default
    values = [item.strip().lower() for item in raw.split(",") if item.strip()]
    return tuple(dict.fromkeys(values))


def build_auth_settings() -> AuthSettings:
    return AuthSettings.from_env()


def session_cookie_name(secure: bool) -> str:
    return SECURE_SESSION_COOKIE_NAME if secure else SESSION_COOKIE_NAME


def session_cookie_names() -> tuple[str, ...]:
    return (SECURE_SESSION_COOKIE_NAME, SESSION_COOKIE_NAME)


def authenticate_demo_user(
    settings: AuthSettings, username: str, password: str
) -> str | None:
    """Return the normalized username when the role-specific password matches."""

    if not settings.configured:
        raise AuthUnavailableError(
            settings.config_error or "Demo login is not configured."
        )

    normalized = username.strip().lower()
    role = settings.role_for(normalized)
    expected_password = settings.password_for(role) if role is not None else None
    expected = (expected_password or "").encode("utf-8")
    provided = password.encode("utf-8")
    password_matches = hmac.compare_digest(provided, expected)
    if role is None or expected_password is None or not password_matches:
        return None
    return normalized


def issue_session_token(
    settings: AuthSettings,
    username: str,
    *,
    now: datetime | None = None,
) -> tuple[str, datetime]:
    if not settings.configured or not settings.session_secret:
        raise AuthUnavailableError(
            settings.config_error or "Demo login is not configured."
        )
    role = settings.role_for(username)
    if role is None:
        raise ValueError("Unknown auth user.")

    issued_at = _as_utc(now or datetime.now(UTC))
    expires_at = issued_at + timedelta(seconds=settings.session_ttl_sec)
    payload = {
        "v": TOKEN_VERSION,
        "sub": username.strip().lower(),
        "role": role,
        "iat": int(issued_at.timestamp()),
        "exp": int(expires_at.timestamp()),
        "pwd": settings.password_fingerprint_for(role),
    }
    payload_b64 = _b64encode(
        json.dumps(payload, separators=(",", ":"), sort_keys=True).encode("utf-8")
    )
    signature = hmac.new(
        settings.session_secret.encode("utf-8"),
        payload_b64.encode("ascii"),
        hashlib.sha256,
    ).digest()
    return f"{payload_b64}.{_b64encode(signature)}", expires_at


def verify_session_token(
    settings: AuthSettings,
    token: str,
    *,
    now: datetime | None = None,
) -> Principal | None:
    if (
        not settings.configured
        or not settings.session_secret
        or not token
        or len(token) > MAX_SESSION_TOKEN_LENGTH
    ):
        return None

    payload_b64, separator, signature_b64 = token.partition(".")
    if not separator or not payload_b64 or not signature_b64:
        return None

    try:
        expected_signature = hmac.new(
            settings.session_secret.encode("utf-8"),
            payload_b64.encode("ascii"),
            hashlib.sha256,
        ).digest()
        provided_signature = _b64decode(signature_b64)
        if not hmac.compare_digest(provided_signature, expected_signature):
            return None
        payload = json.loads(_b64decode(payload_b64).decode("utf-8"))
    except (ValueError, UnicodeDecodeError, binascii.Error, json.JSONDecodeError):
        return None

    if not isinstance(payload, dict):
        return None
    try:
        version = int(payload["v"])
        username = str(payload["sub"]).strip().lower()
        role = str(payload["role"])
        issued_at = int(payload["iat"])
        expires_at = int(payload["exp"])
        password_fingerprint = str(payload["pwd"])
    except (KeyError, TypeError, ValueError):
        return None

    current_time = _as_utc(now or datetime.now(UTC))
    now_ts = int(current_time.timestamp())
    if version != TOKEN_VERSION or expires_at <= now_ts or issued_at > now_ts + 60:
        return None
    current_role = settings.role_for(username)
    if current_role is None or current_role != role:
        return None
    if role not in {"admin", "viewer"}:
        return None
    if password_fingerprint != settings.password_fingerprint_for(current_role):
        return None
    return Principal(
        username=username,
        role=current_role,
        auth_method="session",
        expires_at=datetime.fromtimestamp(expires_at, UTC),
    )


def _as_utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=UTC)
    return value.astimezone(UTC)


def _b64encode(value: bytes) -> str:
    return base64.urlsafe_b64encode(value).decode("ascii").rstrip("=")


def _b64decode(value: str) -> bytes:
    padded = value + "=" * (-len(value) % 4)
    return base64.urlsafe_b64decode(padded.encode("ascii"))


__all__ = [
    "AuthMethod",
    "AuthSettings",
    "AuthUnavailableError",
    "CookieSecureMode",
    "Principal",
    "Role",
    "authenticate_demo_user",
    "build_auth_settings",
    "issue_session_token",
    "session_cookie_name",
    "session_cookie_names",
    "verify_session_token",
]
