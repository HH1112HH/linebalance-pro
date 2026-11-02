from __future__ import annotations

import logging
import os
import threading
import time
from io import BytesIO

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse

from .actuals import analyze_actuals
from .excel import build_workbook
from .models import (
    ActualsAnalysis,
    ExportPayload,
    OptimizeRequest,
    OptimizeResponse,
    TimeStudyRecord,
    TimeStudyResult,
)
from .optimizer import SOLVER_BACKEND, check_solver, solve_line_balancing
from .sample_data import SAMPLE_FEASIBLE_REQUEST, SAMPLE_REQUEST
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
SCENARIO_PERSISTENCE = os.getenv("SCENARIO_PERSISTENCE", "localStorage")

app = FastAPI(
    title="LineBalance Pro API",
    description=(
        "Garment line balancing and bottleneck analytics API. "
        "Synthetic/demo data only; not a production MES. "
        "Scenario persistence is intentionally disabled on the public demo; "
        "the frontend stores personal scenarios in localStorage."
    ),
    version=APP_VERSION,
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
    allow_origin_regex=r"https://.*\.netlify\.app",
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "X-Demo-Key"],
)

_rate_lock = threading.Lock()
_rate_buckets: dict[str, list[float]] = {}
_solve_semaphore = threading.Semaphore(MAX_CONCURRENT_SOLVES)


def _client_key(request: Request) -> str:
    if request.client and request.client.host:
        return request.client.host
    return "unknown"


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
            return JSONResponse(status_code=400, content={"detail": "Invalid Content-Length."})

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

    try:
        response = await call_next(request)
    except Exception:
        logger.exception("Unhandled API error for %s %s", request.method, request.url.path)
        raise

    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "no-referrer"
    response.headers["Cache-Control"] = "no-store"
    return response


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
    return {
        "status": "ok",
        "version": APP_VERSION,
        "solver": solver_info or "unavailable",
        "solver_backend": SOLVER_BACKEND,
        "solver_available": solver_available,
        "data_policy": DATA_POLICY,
        "scenario_persistence": SCENARIO_PERSISTENCE,
        "limits": {
            "max_body_bytes": MAX_BODY_BYTES,
            "rate_limit_max": RATE_LIMIT_MAX,
            "rate_limit_window_sec": RATE_LIMIT_WINDOW_SEC,
            "max_concurrent_solves": MAX_CONCURRENT_SOLVES,
            "max_operations": 200,
            "max_workers": 100,
            "max_machines": 200,
            "max_solver_time_sec": 60,
        },
    }


@app.get("/health", include_in_schema=False)
def health_alias() -> dict[str, object]:
    """Compatibility alias for uptime monitors that probe /health."""
    return health()


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
    filename = f"linebalance_{payload.request.style_code or 'plan'}.xlsx".replace(" ", "_")
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


@app.post("/api/time-study/calculate", response_model=TimeStudyResult)
def time_study(record: TimeStudyRecord) -> TimeStudyResult:
    normal, standard = calculate_time_study(
        record.observed_time_sec,
        record.performance_rating,
        record.allowance_pct,
    )
    variance = None
    if record.approved_sam_sec:
        variance = round(pct(standard - record.approved_sam_sec, record.approved_sam_sec), 2)
    notes = [
        "Aggregate calculation for human/walking work only.",
        "Normal time = observed time x performance rating.",
        "Standard time = normal time x (1 + allowance).",
        "Do not apply the performance rating to machine automatic time; use element-level time study for mixed operations.",
        "Approve the standard time before using it as SAM in the optimizer.",
    ]
    if record.status != "APPROVED":
        notes.append("This record is not approved yet; do not treat it as an official SAM.")
    return TimeStudyResult(
        operation_id=record.operation_id,
        normal_time_sec=normal,
        standard_time_sec=standard,
        approved_sam_sec=record.approved_sam_sec,
        variance_pct=variance,
        notes=notes,
    )
