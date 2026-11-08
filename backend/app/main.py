from __future__ import annotations

import logging
import os
import re
import secrets
import threading
import time
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from io import BytesIO
from typing import Annotated, Literal

import psycopg
from fastapi import Depends, FastAPI, Header, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse

from .actuals import analyze_actuals
from .auth import (
    AuthSettings,
    AuthUnavailableError,
    Principal,
    authenticate_demo_user,
    build_auth_settings,
    issue_session_token,
    session_cookie_name,
    session_cookie_names,
    verify_session_token,
)
from .excel import build_workbook
from .material_import import MaterialImportError, parse_material_csv
from .materials import analyze_materials
from .models import (
    ActualsAnalysis,
    AuthSessionResponse,
    ExportPayload,
    LoginRequest,
    MaterialAnalysisRequest,
    MaterialAnalysisResult,
    MaterialImportPreview,
    MaterialSampleResponse,
    OptimizeRequest,
    OptimizeResponse,
    ProcessFlowRequest,
    ProcessFlowResponse,
    ReadinessEvaluationRequest,
    ScenarioCreateRequest,
    ScenarioDetail,
    ScenarioImportPreview,
    ScenarioImportRequest,
    ScenarioListResponse,
    StyleReadiness,
    TimeStudyRecord,
    TimeStudyResult,
)
from .optimizer import SOLVER_BACKEND, check_solver, solve_line_balancing
from .persistence import (
    ScenarioPersistence,
    ScenarioSettings,
    ScenarioUnavailableError,
    build_scenario_settings,
)
from .sample_data import SAMPLE_FEASIBLE_REQUEST, SAMPLE_REQUEST
from .sample_materials import build_sample_material_response
from .scenario_excel import XLSX_MIME, parse_scenario_workbook
from .scenario_import import ScenarioImportError, parse_scenario_bundle
from .scenario_service import ScenarioError, ScenarioService
from .style_setup import build_process_flow, evaluate_readiness
from .utils import calculate_time_study, pct
from .version import APP_VERSION, DATA_POLICY

logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO").upper(),
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)
logger = logging.getLogger("linebalance.api")

MAX_BODY_BYTES = int(os.getenv("MAX_BODY_BYTES", "2000000"))
RATE_LIMIT_WINDOW_SEC = int(os.getenv("RATE_LIMIT_WINDOW_SEC", "60"))
RATE_LIMIT_MAX = int(os.getenv("RATE_LIMIT_MAX", "60"))
MAX_CONCURRENT_SOLVES = int(os.getenv("MAX_CONCURRENT_SOLVES", "2"))
LOGIN_RATE_LIMIT_WINDOW_SEC = int(os.getenv("AUTH_LOGIN_RATE_LIMIT_WINDOW_SEC", "300"))
LOGIN_RATE_LIMIT_MAX = int(os.getenv("AUTH_LOGIN_RATE_LIMIT_MAX", "10"))
NETLIFY_ORIGIN_REGEX = r"https://[A-Za-z0-9-]+\.netlify\.app"
auth_settings = build_auth_settings()
scenario_persistence = ScenarioPersistence(
    build_scenario_settings(max_body_bytes=MAX_BODY_BYTES)
)


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    yield
    scenario_persistence.close()


app = FastAPI(
    title="LineBalance Pro API",
    description=(
        "Garment line balancing and bottleneck analytics API. "
        "Synthetic/demo data only; not a production MES. "
        "Compute endpoints are public. Scenario persistence and saved "
        "scenarios use demo accounts with admin/read-only roles; browser "
        "snapshots still default to localStorage."
    ),
    version=APP_VERSION,
    lifespan=lifespan,
)

allowed_origins = [
    origin.strip()
    for origin in os.getenv(
        "FRONTEND_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173",
    ).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=NETLIFY_ORIGIN_REGEX,
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "X-Demo-Key", "Authorization", "Idempotency-Key"],
)

_rate_lock = threading.Lock()
_rate_buckets: dict[str, list[float]] = {}
_solve_semaphore = threading.Semaphore(MAX_CONCURRENT_SOLVES)


def _client_key(request: Request) -> str:
    if request.client and request.client.host:
        return request.client.host
    return "unknown"


def _apply_security_headers(response: Response) -> Response:
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "no-referrer"
    response.headers["Cache-Control"] = "no-store"
    return response


_scenario_write_lock = threading.Lock()
_scenario_write_buckets: dict[str, list[float]] = {}
_login_lock = threading.Lock()
_login_buckets: dict[str, list[float]] = {}


def _request_origin(request: Request) -> str:
    return f"{request.url.scheme}://{request.url.netloc}"


def _origin_allowed(request: Request, origin: str) -> bool:
    if not origin or origin == "null":
        return False
    return (
        origin in allowed_origins
        or origin == _request_origin(request)
        or re.fullmatch(NETLIFY_ORIGIN_REGEX, origin) is not None
    )


def _check_origin(request: Request, *, require_origin: bool) -> None:
    origin = request.headers.get("origin")
    if not origin:
        if require_origin:
            raise HTTPException(
                status_code=403,
                detail=(
                    "Cookie-authenticated writes require an Origin header. "
                    "Sign in through the web app or use a bearer token for ops."
                ),
            )
        return
    if not _origin_allowed(request, origin):
        raise HTTPException(status_code=403, detail="Cross-origin request rejected.")


def _login_allowed(request: Request) -> bool:
    now = time.monotonic()
    key = _client_key(request)
    with _login_lock:
        bucket = [
            timestamp
            for timestamp in _login_buckets.get(key, [])
            if now - timestamp < LOGIN_RATE_LIMIT_WINDOW_SEC
        ]
        if len(bucket) >= LOGIN_RATE_LIMIT_MAX:
            _login_buckets[key] = bucket
            return False
        bucket.append(now)
        _login_buckets[key] = bucket
    return True


def _is_secure_request(request: Request, settings: AuthSettings) -> bool:
    if settings.cookie_secure == "always":
        return True
    if settings.cookie_secure == "never":
        return False
    forwarded_proto = (
        request.headers.get("x-forwarded-proto", "").split(",")[0].strip().lower()
    )
    return forwarded_proto == "https" or request.url.scheme == "https"


def _bearer_principal(
    request: Request, settings: ScenarioSettings
) -> tuple[bool, Principal | None]:
    authorization = request.headers.get("authorization")
    if authorization is None:
        return False, None
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        return True, None
    valid = any(
        secrets.compare_digest(token, candidate)
        for candidate in settings.token_candidates
    )
    if not valid:
        return True, None
    return True, Principal(
        username=settings.actor_label,
        role="admin",
        auth_method="bearer",
    )


def _session_principal(request: Request, settings: AuthSettings) -> Principal | None:
    for name in session_cookie_names():
        token = request.cookies.get(name)
        if not token:
            continue
        principal = verify_session_token(settings, token)
        if principal is not None:
            return principal
    return None


def _resolve_scenario_principal(
    request: Request, settings: ScenarioSettings
) -> Principal | None:
    has_bearer, bearer_principal = _bearer_principal(request, settings)
    if has_bearer:
        return bearer_principal
    return _session_principal(request, auth_settings)


def _scenario_guard(
    request: Request, settings: ScenarioSettings
) -> JSONResponse | None:
    if request.method == "OPTIONS":
        return None
    if not settings.enabled:
        return JSONResponse(
            status_code=503,
            content={
                "detail": (
                    "Scenario persistence is unavailable. "
                    "Optimizer endpoints remain available."
                )
            },
        )
    if not settings.configured:
        logger.error("Scenario persistence is misconfigured.")
        return JSONResponse(
            status_code=503,
            content={
                "detail": (
                    "Scenario persistence is unavailable. "
                    "Optimizer endpoints remain available."
                )
            },
        )

    principal = _resolve_scenario_principal(request, settings)
    if principal is None:
        return JSONResponse(
            status_code=401,
            content={
                "detail": (
                    "Sign in with a demo account or provide a valid bearer token "
                    "to access saved scenarios."
                )
            },
            headers={"WWW-Authenticate": "Bearer"},
        )

    request.state.scenario_principal = principal

    if request.method in {"POST", "DELETE"}:
        if not principal.can_write:
            return JSONResponse(
                status_code=403,
                content={
                    "detail": (
                        "This demo account is read-only. Scenario create and "
                        "delete require the admin account."
                    )
                },
            )
        if principal.auth_method == "session":
            try:
                _check_origin(request, require_origin=True)
            except HTTPException as exc:
                return JSONResponse(
                    status_code=exc.status_code,
                    content={"detail": exc.detail},
                )

    if request.method == "POST":
        content_length = request.headers.get("content-length")
        if content_length:
            try:
                if int(content_length) > settings.max_payload_bytes:
                    return JSONResponse(
                        status_code=413,
                        content={
                            "detail": (
                                "Scenario payload exceeds the "
                                f"{settings.max_payload_bytes}-byte limit."
                            )
                        },
                    )
            except ValueError:
                pass
    return None


def _scenario_write_allowed(settings: ScenarioSettings, actor: str) -> tuple[bool, int]:
    now = time.monotonic()
    key = f"{settings.workspace_id}:{actor}"
    with _scenario_write_lock:
        bucket = [
            timestamp
            for timestamp in _scenario_write_buckets.get(key, [])
            if now - timestamp < settings.save_rate_limit_window_sec
        ]
        if len(bucket) >= settings.save_rate_limit_max:
            _scenario_write_buckets[key] = bucket
            return False, settings.save_rate_limit_window_sec
        bucket.append(now)
        _scenario_write_buckets[key] = bucket
    return True, settings.save_rate_limit_window_sec


def _clear_session_cookies(response: Response) -> None:
    for name in session_cookie_names():
        response.delete_cookie(
            name,
            path="/",
            secure=name.startswith("__Host-"),
            httponly=True,
            samesite="lax",
        )


def _auth_payload(
    settings: AuthSettings, principal: Principal | None
) -> AuthSessionResponse:
    return AuthSessionResponse(
        authenticated=principal is not None,
        login_enabled=settings.configured,
        username=principal.username if principal else None,
        role=principal.role if principal else None,
        expires_at=(
            principal.expires_at.isoformat()
            if principal and principal.expires_at
            else None
        ),
    )


@app.middleware("http")
async def protect_public_api(request: Request, call_next):
    content_length = request.headers.get("content-length")
    if content_length:
        try:
            if int(content_length) > MAX_BODY_BYTES:
                return JSONResponse(
                    status_code=413,
                    content={
                        "detail": (
                            f"Request body exceeds {MAX_BODY_BYTES} bytes. "
                            "Reduce operations, workers or machines."
                        )
                    },
                )
        except ValueError:
            return JSONResponse(
                status_code=400, content={"detail": "Invalid Content-Length."}
            )

    key = _client_key(request)
    now = time.monotonic()
    with _rate_lock:
        bucket = [
            timestamp
            for timestamp in _rate_buckets.get(key, [])
            if now - timestamp < RATE_LIMIT_WINDOW_SEC
        ]
        if len(bucket) >= RATE_LIMIT_MAX:
            return JSONResponse(
                status_code=429,
                content={
                    "detail": (
                        f"Rate limit exceeded: {RATE_LIMIT_MAX} requests per "
                        f"{RATE_LIMIT_WINDOW_SEC} seconds."
                    )
                },
                headers={"Retry-After": str(RATE_LIMIT_WINDOW_SEC)},
            )
        bucket.append(now)
        _rate_buckets[key] = bucket

    if request.url.path == "/api/scenarios" or request.url.path.startswith(
        "/api/scenarios/"
    ):
        guard = _scenario_guard(request, scenario_persistence.settings)
        if guard is not None:
            return _apply_security_headers(guard)

    try:
        response = await call_next(request)
    except Exception:
        logger.exception(
            "Unhandled API error for %s %s", request.method, request.url.path
        )
        raise

    return _apply_security_headers(response)


@app.get("/")
def root() -> dict[str, str]:
    return {
        "name": "LineBalance Pro API",
        "version": APP_VERSION,
        "docs": "/docs",
        "health": "/api/health",
        "data_policy": DATA_POLICY,
    }


@app.get("/api/health")
def health() -> dict[str, object]:
    solver_available, solver_info = check_solver()
    store_health = scenario_persistence.health()
    return {
        "status": "ok",
        "version": APP_VERSION,
        "solver": solver_info or "unavailable",
        "solver_backend": SOLVER_BACKEND,
        "solver_available": solver_available,
        "data_policy": DATA_POLICY,
        "scenario_persistence": scenario_persistence.settings.mode,
        "scenario_store": store_health,
        "auth": {
            "enabled": auth_settings.configured,
            "mode": "demo-accounts",
            "roles": ["admin", "viewer"],
            "session_ttl_sec": auth_settings.session_ttl_sec,
        },
        "scenario_auth": "bearer-or-session",
        "limits": {
            "max_body_bytes": MAX_BODY_BYTES,
            "rate_limit_max": RATE_LIMIT_MAX,
            "rate_limit_window_sec": RATE_LIMIT_WINDOW_SEC,
            "max_concurrent_solves": MAX_CONCURRENT_SOLVES,
            "max_operations": 200,
            "max_workers": 100,
            "max_machines": 200,
            "max_solver_time_sec": 60,
            "scenario_max_payload_bytes": scenario_persistence.settings.max_payload_bytes,
            "scenario_save_rate_limit_max": (
                scenario_persistence.settings.save_rate_limit_max
            ),
            "auth_login_rate_limit_max": LOGIN_RATE_LIMIT_MAX,
            "auth_login_rate_limit_window_sec": LOGIN_RATE_LIMIT_WINDOW_SEC,
        },
    }


@app.get("/health", include_in_schema=False)
def health_alias() -> dict[str, object]:
    """Compatibility alias for uptime monitors that probe /health."""
    return health()


@app.get("/api/auth/session", response_model=AuthSessionResponse)
def auth_session(request: Request, response: Response) -> AuthSessionResponse:
    """Return the current browser session without requiring a login."""

    principal = _session_principal(request, auth_settings)
    if principal is None and any(
        request.cookies.get(name) for name in session_cookie_names()
    ):
        _clear_session_cookies(response)
    return _auth_payload(auth_settings, principal)


@app.post("/api/auth/login", response_model=AuthSessionResponse)
def auth_login(
    payload: LoginRequest, request: Request, response: Response
) -> AuthSessionResponse:
    if not auth_settings.configured:
        raise HTTPException(
            status_code=503,
            detail=(
                "Demo login is disabled or misconfigured. Set AUTH_DEMO_PASSWORD "
                "and AUTH_SESSION_SECRET on the server."
            ),
        )
    _check_origin(request, require_origin=False)
    if not _login_allowed(request):
        raise HTTPException(
            status_code=429,
            detail=(
                "Too many login attempts. Retry after "
                f"{LOGIN_RATE_LIMIT_WINDOW_SEC} seconds."
            ),
            headers={"Retry-After": str(LOGIN_RATE_LIMIT_WINDOW_SEC)},
        )
    try:
        username = authenticate_demo_user(
            auth_settings, payload.username, payload.password
        )
    except AuthUnavailableError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    if username is None:
        logger.warning("Demo login failed from %s", _client_key(request))
        raise HTTPException(status_code=401, detail="Invalid username or password.")

    token, expires_at = issue_session_token(auth_settings, username)
    secure = _is_secure_request(request, auth_settings)
    response.set_cookie(
        key=session_cookie_name(secure),
        value=token,
        max_age=auth_settings.session_ttl_sec,
        path="/",
        secure=secure,
        httponly=True,
        samesite="lax",
    )
    logger.info("Demo login succeeded for %s", username)
    return _auth_payload(
        auth_settings,
        Principal(
            username=username,
            role=auth_settings.role_for(username) or "viewer",
            auth_method="session",
            expires_at=expires_at,
        ),
    )


@app.post("/api/auth/logout", status_code=204)
def auth_logout(request: Request, response: Response) -> Response:
    _check_origin(request, require_origin=False)
    _clear_session_cookies(response)
    response.status_code = 204
    return response


@app.get("/api/sample", response_model=OptimizeRequest)
def sample() -> OptimizeRequest:
    return SAMPLE_REQUEST


@app.get("/api/sample/feasible", response_model=OptimizeRequest)
def sample_feasible() -> OptimizeRequest:
    return SAMPLE_FEASIBLE_REQUEST


@app.get("/api/samples", response_model=dict[str, OptimizeRequest])
def samples() -> dict[str, OptimizeRequest]:
    return {
        "stretch_420": SAMPLE_REQUEST,
        "feasible_400": SAMPLE_FEASIBLE_REQUEST,
    }


@app.post("/api/optimize", response_model=OptimizeResponse)
def optimize(request: OptimizeRequest) -> OptimizeResponse:
    if not _solve_semaphore.acquire(blocking=False):
        raise HTTPException(
            status_code=429,
            detail=(
                "The solver is busy with other requests. Retry in a few seconds "
                "or reduce the problem size."
            ),
        )
    try:
        return solve_line_balancing(request)
    finally:
        _solve_semaphore.release()


@app.post("/api/export")
def export(payload: ExportPayload) -> StreamingResponse:
    content = build_workbook(payload)
    filename = (
        f"linebalance_{payload.request.style_code or 'plan'}_{payload.language}.xlsx"
    ).replace(" ", "_")
    return StreamingResponse(
        BytesIO(content),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@app.post("/api/actuals/analyze", response_model=ActualsAnalysis)
def actuals_summary(request: OptimizeRequest) -> ActualsAnalysis:
    result = analyze_actuals(request)
    if result is None:
        raise HTTPException(
            status_code=400,
            detail="No actuals or daily_actuals were provided.",
        )
    return result


@app.post("/api/readiness/evaluate", response_model=StyleReadiness)
def readiness_evaluation(request: ReadinessEvaluationRequest) -> StyleReadiness:
    try:
        return evaluate_readiness(request)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@app.post("/api/process-flow/build", response_model=ProcessFlowResponse)
def process_flow(request: ProcessFlowRequest) -> ProcessFlowResponse:
    try:
        return build_process_flow(request)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@app.get("/api/materials/sample", response_model=MaterialSampleResponse)
def material_sample() -> MaterialSampleResponse:
    return build_sample_material_response()


@app.post("/api/materials/analyze", response_model=MaterialAnalysisResult)
def material_analysis(request: MaterialAnalysisRequest) -> MaterialAnalysisResult:
    try:
        return analyze_materials(request)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@app.post("/api/materials/import", response_model=MaterialImportPreview)
async def material_import(
    request: Request,
    phase: Literal["CURRENT", "BEFORE", "AFTER"] = "BEFORE",
) -> MaterialImportPreview:
    content_type = request.headers.get("content-type", "").split(";")[0].strip().lower()
    if content_type not in {"text/csv", "application/csv", "text/plain"}:
        raise HTTPException(
            status_code=415,
            detail="Send the CSV body with Content-Type: text/csv.",
        )
    body = await request.body()
    if len(body) > MAX_BODY_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"CSV exceeds the {MAX_BODY_BYTES} byte body limit.",
        )
    try:
        text = body.decode("utf-8-sig")
    except UnicodeDecodeError as exc:
        raise HTTPException(
            status_code=422, detail="CSV must be UTF-8 encoded."
        ) from exc
    try:
        return parse_material_csv(text, phase)
    except MaterialImportError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@app.post("/api/import/scenario", response_model=ScenarioImportPreview)
def scenario_import(request: ScenarioImportRequest) -> ScenarioImportPreview:
    try:
        return parse_scenario_bundle(request)
    except ScenarioImportError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@app.post("/api/import/scenario/excel", response_model=ScenarioImportPreview)
async def scenario_import_excel(request: Request) -> ScenarioImportPreview:
    content_type = (
        request.headers.get("content-type", "").split(";", 1)[0].strip().lower()
    )
    if content_type != XLSX_MIME:
        raise HTTPException(
            status_code=415,
            detail=f"Send the .xlsx workbook with Content-Type: {XLSX_MIME}.",
        )
    body = await request.body()
    if len(body) > MAX_BODY_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"Workbook exceeds the {MAX_BODY_BYTES:,} byte body limit.",
        )
    try:
        return parse_scenario_workbook(body)
    except ScenarioImportError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@app.post("/api/time-study/calculate", response_model=TimeStudyResult)
def time_study(record: TimeStudyRecord) -> TimeStudyResult:
    normal, standard = calculate_time_study(
        record.observed_time_sec,
        record.performance_rating,
        record.allowance_pct,
    )
    variance = None
    if record.approved_sam_sec:
        variance = round(
            pct(standard - record.approved_sam_sec, record.approved_sam_sec), 2
        )
    notes = [
        "Aggregate calculation for human/walking work only.",
        "Normal time = observed time x performance rating.",
        "Standard time = normal time x (1 + allowance).",
        "Do not apply the performance rating to machine automatic time; use element-level time study for mixed operations.",
        "Approve the standard time before using it as SAM in the optimizer.",
    ]
    if record.status != "APPROVED":
        notes.append(
            "This record is not approved yet; do not treat it as an official SAM."
        )
    return TimeStudyResult(
        operation_id=record.operation_id,
        normal_time_sec=normal,
        standard_time_sec=standard,
        approved_sam_sec=record.approved_sam_sec,
        variance_pct=variance,
        notes=notes,
    )


def get_scenario_persistence() -> ScenarioPersistence:
    return scenario_persistence


def get_scenario_settings(
    persistence: Annotated[ScenarioPersistence, Depends(get_scenario_persistence)],
) -> ScenarioSettings:
    return persistence.settings


def get_scenario_service(
    request: Request,
    persistence: Annotated[ScenarioPersistence, Depends(get_scenario_persistence)],
) -> ScenarioService:
    settings = persistence.settings
    principal = getattr(request.state, "scenario_principal", None)
    actor_label = principal.username if principal else settings.actor_label
    return ScenarioService(
        persistence.repository(),
        workspace_id=settings.workspace_id,
        actor_label=actor_label,
        max_per_workspace=settings.max_per_workspace,
        max_payload_bytes=settings.max_payload_bytes,
    )


@app.exception_handler(ScenarioError)
async def scenario_error_handler(request: Request, exc: ScenarioError) -> JSONResponse:
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})


@app.exception_handler(ScenarioUnavailableError)
async def scenario_unavailable_handler(
    request: Request, exc: ScenarioUnavailableError
) -> JSONResponse:
    logger.warning("Scenario persistence unavailable: %s", exc)
    return JSONResponse(
        status_code=503,
        content={
            "detail": (
                "Scenario persistence is unavailable. "
                "Optimizer endpoints remain available."
            )
        },
    )


@app.exception_handler(psycopg.Error)
async def scenario_database_error_handler(
    request: Request, exc: psycopg.Error
) -> JSONResponse:
    logger.exception("Scenario persistence database error")
    return JSONResponse(
        status_code=503,
        content={"detail": "Scenario persistence database is unavailable."},
    )


def _enforce_scenario_write_limit(request: Request, settings: ScenarioSettings) -> None:
    principal = getattr(request.state, "scenario_principal", None)
    actor = principal.username if principal else settings.actor_label
    allowed, window = _scenario_write_allowed(settings, actor)
    if not allowed:
        raise HTTPException(
            status_code=429,
            detail=f"Too many scenario writes; retry after {window} seconds.",
            headers={"Retry-After": str(window)},
        )


@app.post("/api/scenarios", response_model=ScenarioDetail, status_code=201)
def create_scenario(
    payload: ScenarioCreateRequest,
    request: Request,
    response: Response,
    service: Annotated[ScenarioService, Depends(get_scenario_service)],
    settings: Annotated[ScenarioSettings, Depends(get_scenario_settings)],
    idempotency_key: Annotated[str | None, Header(alias="Idempotency-Key")] = None,
) -> ScenarioDetail:
    _enforce_scenario_write_limit(request, settings)
    outcome = service.create(payload, idempotency_key=idempotency_key)
    detail = service.to_detail(outcome.record)
    if outcome.created:
        response.status_code = 201
        response.headers["Location"] = f"/api/scenarios/{outcome.record.id}"
    else:
        response.status_code = 200
    return detail


@app.get("/api/scenarios", response_model=ScenarioListResponse)
def list_scenarios(
    service: Annotated[ScenarioService, Depends(get_scenario_service)],
    limit: int = 50,
    cursor: str | None = None,
) -> ScenarioListResponse:
    return service.list(limit=limit, cursor=cursor)


@app.get("/api/scenarios/{scenario_id}", response_model=ScenarioDetail)
def get_scenario(
    scenario_id: str,
    service: Annotated[ScenarioService, Depends(get_scenario_service)],
) -> ScenarioDetail:
    return service.get(scenario_id)


@app.delete("/api/scenarios/{scenario_id}", status_code=204)
def delete_scenario(
    scenario_id: str,
    request: Request,
    service: Annotated[ScenarioService, Depends(get_scenario_service)],
    settings: Annotated[ScenarioSettings, Depends(get_scenario_settings)],
) -> Response:
    _enforce_scenario_write_limit(request, settings)
    service.delete(scenario_id)
    return Response(status_code=204)
