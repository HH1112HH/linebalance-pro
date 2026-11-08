import type {
  ActualsAnalysis,
  AuthSession,
  HealthResponse,
  MaterialAnalysisRequest,
  MaterialAnalysisResult,
  MaterialImportPreview,
  MaterialPhase,
  MaterialSampleResult,
  OptimizeResult,
  ProcessFlowRequest,
  ProcessFlowResult,
  ReadinessEvaluationRequest,
  SampleRequest,
  ScenarioCreateRequest,
  ScenarioImportPreview,
  ScenarioImportRequest,
  ServerScenarioDetail,
  ServerScenarioList,
  StyleReadinessResult,
  TimeStudyRecord,
  TimeStudyResult,
} from "./types";

const API_BASE = (import.meta.env.VITE_API_BASE ?? "").replace(/\/$/, "");

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function parseError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { detail?: unknown };
    if (typeof body.detail === "string") return body.detail;
    if (body.detail) return JSON.stringify(body.detail);
  } catch {
    // fall through to text
  }
  try {
    const text = await response.text();
    if (text) return text;
  } catch {
    // ignore
  }
  return `HTTP ${response.status}`;
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    ...init,
  });
  if (!response.ok) {
    throw new ApiError(await parseError(response), response.status);
  }
  return (await response.json()) as T;
}

function jsonInit(body: unknown): RequestInit {
  return {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

export function getHealth(): Promise<HealthResponse> {
  return requestJson<HealthResponse>("/api/health");
}

export function getAuthSession(): Promise<AuthSession> {
  return requestJson<AuthSession>("/api/auth/session");
}

export function login(username: string, password: string): Promise<AuthSession> {
  return requestJson<AuthSession>("/api/auth/login", jsonInit({ username, password }));
}

export async function logout(): Promise<void> {
  const response = await fetch(`${API_BASE}/api/auth/logout`, {
    method: "POST",
    credentials: "include",
  });
  if (!response.ok) {
    throw new ApiError(await parseError(response), response.status);
  }
}

export function listServerScenarios(
  cursor?: string | null,
  limit = 50,
): Promise<ServerScenarioList> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (cursor) params.set("cursor", cursor);
  return requestJson<ServerScenarioList>(`/api/scenarios?${params.toString()}`);
}

export function getServerScenario(id: string): Promise<ServerScenarioDetail> {
  return requestJson<ServerScenarioDetail>(`/api/scenarios/${encodeURIComponent(id)}`);
}

export function createServerScenario(
  name: string,
  request: SampleRequest,
  idempotencyKey?: string,
): Promise<ServerScenarioDetail> {
  const payload: ScenarioCreateRequest = { name, request };
  const init = jsonInit(payload);
  if (idempotencyKey) {
    init.headers = {
      ...(init.headers as Record<string, string>),
      "Idempotency-Key": idempotencyKey,
    };
  }
  return requestJson<ServerScenarioDetail>("/api/scenarios", init);
}

export async function deleteServerScenario(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/api/scenarios/${encodeURIComponent(id)}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!response.ok) {
    throw new ApiError(await parseError(response), response.status);
  }
}

export function runOptimizer(payload: SampleRequest): Promise<OptimizeResult> {
  return requestJson<OptimizeResult>("/api/optimize", jsonInit(payload));
}

export function analyzeActuals(payload: SampleRequest): Promise<ActualsAnalysis> {
  return requestJson<ActualsAnalysis>("/api/actuals/analyze", jsonInit(payload));
}

export function calculateTimeStudy(payload: TimeStudyRecord): Promise<TimeStudyResult> {
  return requestJson<TimeStudyResult>("/api/time-study/calculate", jsonInit(payload));
}

export function evaluateReadiness(
  payload: ReadinessEvaluationRequest,
): Promise<StyleReadinessResult> {
  return requestJson<StyleReadinessResult>(
    "/api/readiness/evaluate",
    jsonInit(payload),
  );
}

export function buildProcessFlow(
  payload: ProcessFlowRequest,
): Promise<ProcessFlowResult> {
  return requestJson<ProcessFlowResult>("/api/process-flow/build", jsonInit(payload));
}

export function getMaterialSample(): Promise<MaterialSampleResult> {
  return requestJson<MaterialSampleResult>("/api/materials/sample");
}

export function analyzeMaterials(
  payload: MaterialAnalysisRequest,
): Promise<MaterialAnalysisResult> {
  return requestJson<MaterialAnalysisResult>(
    "/api/materials/analyze",
    jsonInit(payload),
  );
}

export function importMaterialCsv(
  csvText: string,
  phase: MaterialPhase,
): Promise<MaterialImportPreview> {
  return requestJson<MaterialImportPreview>(`/api/materials/import?phase=${phase}`, {
    method: "POST",
    headers: { "Content-Type": "text/csv; charset=utf-8" },
    body: csvText,
  });
}

export function importScenarioCsvs(
  payload: ScenarioImportRequest,
): Promise<ScenarioImportPreview> {
  return requestJson<ScenarioImportPreview>("/api/import/scenario", jsonInit(payload));
}

export function importScenarioWorkbook(
  body: ArrayBuffer,
): Promise<ScenarioImportPreview> {
  return requestJson<ScenarioImportPreview>("/api/import/scenario/excel", {
    method: "POST",
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    },
    body,
  });
}

export async function exportWorkbook(payload: {
  request: SampleRequest;
  result: OptimizeResult;
  language: "en" | "vi";
}): Promise<Blob> {
  const response = await fetch(`${API_BASE}/api/export`, {
    ...jsonInit(payload),
    credentials: "include",
  });
  if (!response.ok) {
    throw new ApiError(await parseError(response), response.status);
  }
  return response.blob();
}

export function apiBase(): string {
  return API_BASE || window.location.origin;
}
