from __future__ import annotations

from collections.abc import Callable
from datetime import UTC, datetime, timedelta

import pytest
from fastapi import Request
from fastapi.testclient import TestClient

from backend.app import main as main_module
from backend.app.auth import (
    AuthSettings,
    authenticate_demo_user,
    build_auth_settings,
    issue_session_token,
    verify_session_token,
)
from backend.app.main import app, get_scenario_service
from backend.app.models import (
    LineConfig,
    Machine,
    Operation,
    OptimizeRequest,
    OptimizeResponse,
    Worker,
)
from backend.app.optimizer import solve_line_balancing
from backend.app.persistence import ScenarioSettings
from backend.app.scenario_service import ScenarioService
from backend.app.scenario_store import InMemoryScenarioRepository

TEST_PASSWORD = "test-password-123"
TEST_SECRET = "s" * 48
ALLOWED_ORIGIN = "http://localhost:5173"


def _small_request(*, target_qty: int = 60) -> OptimizeRequest:
    return OptimizeRequest(
        line_name="Auth API test",
        style_code="TEST-AUTH",
        config=LineConfig(
            shift_minutes=480,
            break_minutes=30,
            target_qty=target_qty,
            planned_efficiency=0.85,
            max_workers=2,
            solver_time_limit_sec=10,
        ),
        operations=[
            Operation(
                id="OP1",
                name="Manual operation",
                sam_sec=20.0,
                skill_code="SEWING",
                skill_required=1,
                sequence=1,
            ),
            Operation(
                id="OP2",
                name="Machine operation",
                sam_sec=30.0,
                predecessors=["OP1"],
                machine_type="SINGLE",
                skill_code="SEWING",
                skill_required=1,
                sequence=2,
            ),
        ],
        workers=[
            Worker(
                id="W1",
                name="Worker 1",
                skills={"OP1": 2, "OP2": 2},
                machine_types=["SINGLE"],
            ),
            Worker(id="W2", name="Worker 2", skills={"OP1": 2}),
        ],
        machines=[Machine(id="M1", machine_type="SINGLE", capacity=1)],
    )


def _payload(*, name: str = "Auth scenario") -> dict:
    return {
        "name": name,
        "request": _small_request().model_dump(mode="json"),
    }


class _StepClock:
    def __init__(self) -> None:
        self._current = datetime(2026, 11, 8, 10, 0, tzinfo=UTC)

    def __call__(self) -> datetime:
        value = self._current
        self._current += timedelta(seconds=1)
        return value


def _auth_settings(**overrides: object) -> AuthSettings:
    values: dict[str, object] = {
        "password": TEST_PASSWORD,
        "session_secret": TEST_SECRET,
        "admin_users": ("admin",),
        "viewer_users": ("test1", "test2", "test3", "test4"),
        "session_ttl_sec": 3600,
        "cookie_secure": "auto",
        "config_error": None,
    }
    values.update(overrides)
    return AuthSettings(**values)


def _scenario_settings(**overrides: object) -> ScenarioSettings:
    values: dict[str, object] = {
        "mode": "postgres",
        "database_url": "postgresql://test@localhost/test",
        "api_token": "test-token-" + "x" * 40,
        "api_token_previous": None,
        "workspace_id": "test-workspace",
        "actor_label": "pytest-bearer",
        "max_per_workspace": 200,
        "max_payload_bytes": 1_500_000,
        "save_rate_limit_max": 100,
        "save_rate_limit_window_sec": 60,
        "db_pool_min": 1,
        "db_pool_max": 2,
        "db_timeout_sec": 5,
        "config_error": None,
    }
    values.update(overrides)
    return ScenarioSettings(**values)


@pytest.fixture(scope="module")
def solved_result() -> OptimizeResponse:
    return solve_line_balancing(_small_request())


@pytest.fixture()
def auth_api(
    monkeypatch: pytest.MonkeyPatch, solved_result: OptimizeResponse
) -> tuple[
    AuthSettings,
    Callable[[Request], ScenarioService],
    InMemoryScenarioRepository,
]:
    auth = _auth_settings()
    scenario_settings = _scenario_settings()
    monkeypatch.setattr(main_module, "auth_settings", auth)
    monkeypatch.setattr(main_module.scenario_persistence, "settings", scenario_settings)
    repository = InMemoryScenarioRepository()

    def _service(request: Request) -> ScenarioService:
        principal = getattr(request.state, "scenario_principal", None)
        return ScenarioService(
            repository,
            workspace_id=scenario_settings.workspace_id,
            actor_label=(
                principal.username if principal else scenario_settings.actor_label
            ),
            max_per_workspace=scenario_settings.max_per_workspace,
            max_payload_bytes=scenario_settings.max_payload_bytes,
            solver=lambda _request: solved_result,
            clock=_StepClock(),
        )

    service = _service
    app.dependency_overrides[get_scenario_service] = _service
    main_module._scenario_write_buckets.clear()
    main_module._login_buckets.clear()
    main_module._rate_buckets.clear()
    yield auth, service, repository
    app.dependency_overrides.clear()
    main_module._scenario_write_buckets.clear()
    main_module._login_buckets.clear()
    main_module._rate_buckets.clear()


def _login(client: TestClient, username: str, password: str = TEST_PASSWORD):
    return client.post(
        "/api/auth/login",
        json={"username": username, "password": password},
    )


def _cookie_headers(origin: str = ALLOWED_ORIGIN) -> dict[str, str]:
    return {"Origin": origin}


def test_login_sets_http_only_lax_cookie_and_reports_role(auth_api) -> None:
    client = TestClient(app)

    response = _login(client, "admin")

    assert response.status_code == 200
    assert response.json()["authenticated"] is True
    assert response.json()["role"] == "admin"
    assert response.json()["login_enabled"] is True
    set_cookie = response.headers["set-cookie"].lower()
    assert "lb_session=" in set_cookie
    assert "httponly" in set_cookie
    assert "samesite=lax" in set_cookie
    assert "path=/" in set_cookie

    session = client.get("/api/auth/session")
    assert session.status_code == 200
    assert session.json()["username"] == "admin"
    assert session.json()["role"] == "admin"


def test_wrong_password_and_unknown_user_return_the_same_401(auth_api) -> None:
    client = TestClient(app)

    wrong_password = _login(client, "admin", "wrong-password")
    unknown_user = _login(client, "nobody", TEST_PASSWORD)

    assert wrong_password.status_code == 401
    assert unknown_user.status_code == 401
    assert wrong_password.json()["detail"] == unknown_user.json()["detail"]
    assert "set-cookie" not in wrong_password.headers
    assert client.get("/api/auth/session").json()["authenticated"] is False


def test_admin_cookie_can_write_and_viewer_cookie_is_read_only(
    auth_api,
) -> None:
    admin = TestClient(app)
    viewer = TestClient(app)
    assert _login(admin, "admin").status_code == 200
    assert _login(viewer, "test1").status_code == 200

    created = admin.post(
        "/api/scenarios",
        json=_payload(),
        headers=_cookie_headers(),
    )
    assert created.status_code == 201
    scenario_id = created.json()["id"]

    listing = viewer.get("/api/scenarios")
    assert listing.status_code == 200
    assert [item["id"] for item in listing.json()["items"]] == [scenario_id]
    assert viewer.get(f"/api/scenarios/{scenario_id}").status_code == 200

    blocked_create = viewer.post(
        "/api/scenarios",
        json=_payload(name="Viewer write"),
        headers=_cookie_headers(),
    )
    blocked_delete = viewer.delete(
        f"/api/scenarios/{scenario_id}",
        headers=_cookie_headers(),
    )

    assert blocked_create.status_code == 403
    assert "read-only" in blocked_create.json()["detail"].lower()
    assert blocked_delete.status_code == 403
    assert admin.get("/api/scenarios").json()["items"][0]["id"] == scenario_id


def test_cookie_write_requires_allowed_origin(auth_api) -> None:
    client = TestClient(app)
    assert _login(client, "admin").status_code == 200

    missing = client.post("/api/scenarios", json=_payload())
    cross_origin = client.post(
        "/api/scenarios",
        json=_payload(),
        headers=_cookie_headers("https://evil.example"),
    )
    accepted = client.post(
        "/api/scenarios",
        json=_payload(),
        headers=_cookie_headers(),
    )

    assert missing.status_code == 403
    assert "origin" in missing.json()["detail"].lower()
    assert cross_origin.status_code == 403
    assert accepted.status_code == 201


def test_tampered_and_expired_cookies_are_rejected(auth_api) -> None:
    auth, _, _ = auth_api
    client = TestClient(app)
    assert _login(client, "admin").status_code == 200
    client.cookies.set("lb_session", "tampered.cookie")

    scenario = client.get("/api/scenarios")
    session = client.get("/api/auth/session")

    assert scenario.status_code == 401
    assert session.status_code == 200
    assert session.json()["authenticated"] is False
    assert "max-age=0" in session.headers["set-cookie"].lower()

    expired_token, _ = issue_session_token(
        auth,
        "admin",
        now=datetime.now(UTC) - timedelta(hours=2),
    )
    expired = TestClient(app)
    expired.cookies.set("lb_session", expired_token)
    assert expired.get("/api/scenarios").status_code == 401


def test_logout_clears_the_session_cookie(auth_api) -> None:
    client = TestClient(app)
    assert _login(client, "admin").status_code == 200

    response = client.post("/api/auth/logout")

    assert response.status_code == 204
    assert "max-age=0" in response.headers["set-cookie"].lower()
    assert client.get("/api/auth/session").json()["authenticated"] is False


def test_login_rate_limit_returns_429(
    auth_api, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(main_module, "LOGIN_RATE_LIMIT_MAX", 2)
    main_module._login_buckets.clear()
    client = TestClient(app)

    first = _login(client, "admin", "wrong-password")
    second = _login(client, "admin", "wrong-password")
    third = _login(client, "admin", "wrong-password")

    assert first.status_code == 401
    assert second.status_code == 401
    assert third.status_code == 429
    assert third.headers["retry-after"] == str(main_module.LOGIN_RATE_LIMIT_WINDOW_SEC)


def test_login_disabled_while_bearer_still_works(
    auth_api, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(
        main_module,
        "auth_settings",
        _auth_settings(password=None, session_secret=None),
    )
    client = TestClient(app)
    token = "test-token-" + "x" * 40

    login = _login(client, "admin")
    session = client.get("/api/auth/session")
    scenario = client.post(
        "/api/scenarios",
        json=_payload(),
        headers={"Authorization": f"Bearer {token}"},
    )

    assert login.status_code == 503
    assert session.json()["login_enabled"] is False
    assert session.json()["authenticated"] is False
    assert scenario.status_code == 201


def test_secure_cookie_name_behind_https_proxy(auth_api) -> None:
    client = TestClient(app)

    response = client.post(
        "/api/auth/login",
        json={"username": "admin", "password": TEST_PASSWORD},
        headers={"X-Forwarded-Proto": "https"},
    )

    assert response.status_code == 200
    set_cookie = response.headers["set-cookie"].lower()
    assert "__host-lb_session=" in set_cookie
    assert "secure" in set_cookie


def test_session_actor_is_used_for_audit(auth_api) -> None:
    _, _, repository = auth_api
    client = TestClient(app)
    assert _login(client, "admin").status_code == 200

    response = client.post(
        "/api/scenarios",
        json=_payload(),
        headers=_cookie_headers(),
    )

    assert response.status_code == 201
    assert repository.audit_events[-1].actor == "admin"


def test_missing_auth_returns_401_even_when_login_is_enabled(auth_api) -> None:
    client = TestClient(app)

    response = client.get("/api/scenarios")

    assert response.status_code == 401
    assert response.headers["www-authenticate"] == "Bearer"


def test_health_does_not_expose_credentials(auth_api) -> None:
    client = TestClient(app)

    response = client.get("/api/health")

    assert response.status_code == 200
    assert response.json()["auth"]["enabled"] is True
    assert TEST_PASSWORD not in response.text
    assert TEST_SECRET not in response.text


def test_session_token_round_trip_and_revocation() -> None:
    auth = _auth_settings()
    now = datetime(2026, 11, 8, 12, 0, tzinfo=UTC)

    token, expires_at = issue_session_token(auth, "admin", now=now)
    principal = verify_session_token(auth, token, now=now)

    assert principal is not None
    assert principal.username == "admin"
    assert principal.role == "admin"
    assert principal.expires_at == expires_at
    assert verify_session_token(auth, token + "x", now=now) is None
    assert (
        verify_session_token(auth, token, now=expires_at + timedelta(seconds=1)) is None
    )

    changed_password = _auth_settings(password="different-password-123")
    assert verify_session_token(changed_password, token, now=now) is None

    removed_user = _auth_settings(admin_users=(), viewer_users=("test1",))
    assert verify_session_token(removed_user, token, now=now) is None


def test_authenticate_demo_user_roles() -> None:
    auth = _auth_settings()

    assert authenticate_demo_user(auth, " Admin ", TEST_PASSWORD) == "admin"
    assert authenticate_demo_user(auth, "test4", TEST_PASSWORD) == "test4"
    assert authenticate_demo_user(auth, "test4", "wrong") is None
    assert authenticate_demo_user(auth, "nobody", TEST_PASSWORD) is None


def test_auth_settings_from_env_validates_configuration(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    for name in (
        "AUTH_DEMO_PASSWORD",
        "AUTH_SESSION_SECRET",
        "AUTH_ADMIN_USERS",
        "AUTH_VIEWER_USERS",
        "AUTH_SESSION_TTL_SEC",
        "AUTH_COOKIE_SECURE",
    ):
        monkeypatch.delenv(name, raising=False)

    disabled = build_auth_settings()
    assert disabled.enabled is False
    assert disabled.config_error is None

    monkeypatch.setenv("AUTH_DEMO_PASSWORD", "short")
    short = build_auth_settings()
    assert short.config_error is not None
    assert "at least 8" in short.config_error

    monkeypatch.setenv("AUTH_DEMO_PASSWORD", TEST_PASSWORD)
    missing_secret = build_auth_settings()
    assert missing_secret.config_error is not None
    assert "AUTH_SESSION_SECRET" in missing_secret.config_error

    monkeypatch.setenv("AUTH_SESSION_SECRET", TEST_SECRET)
    monkeypatch.setenv("AUTH_COOKIE_SECURE", "sometimes")
    bad_cookie = build_auth_settings()
    assert bad_cookie.config_error is not None
    assert "AUTH_COOKIE_SECURE" in bad_cookie.config_error

    monkeypatch.setenv("AUTH_COOKIE_SECURE", "auto")
    monkeypatch.setenv("AUTH_ADMIN_USERS", "admin,shared")
    monkeypatch.setenv("AUTH_VIEWER_USERS", "shared")
    overlap = build_auth_settings()
    assert overlap.config_error is not None
    assert "must not overlap" in overlap.config_error
