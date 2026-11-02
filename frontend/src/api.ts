import type {
  ActualsAnalysis,
  HealthResponse,
  OptimizeResult,
  SampleRequest,
  TimeStudyRecord,
  TimeStudyResult,
} from "./types";

const API_BASE = (import.meta.env.VITE_API_BASE ?? "").replace(/\/$/, "");

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
  const response = await fetch(`${API_BASE}${path}`, init);
  if (!response.ok) {
    throw new Error(await parseError(response));
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

export function runOptimizer(payload: SampleRequest): Promise<OptimizeResult> {
  return requestJson<OptimizeResult>("/api/optimize", jsonInit(payload));
}

export function analyzeActuals(payload: SampleRequest): Promise<ActualsAnalysis> {
  return requestJson<ActualsAnalysis>("/api/actuals/analyze", jsonInit(payload));
}

export function calculateTimeStudy(
  payload: TimeStudyRecord,
): Promise<TimeStudyResult> {
  return requestJson<TimeStudyResult>("/api/time-study/calculate", jsonInit(payload));
}

export async function exportWorkbook(
  payload: { request: SampleRequest; result: OptimizeResult },
): Promise<Blob> {
  const response = await fetch(`${API_BASE}/api/export`, jsonInit(payload));
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  return response.blob();
}

export function apiBase(): string {
  return API_BASE || window.location.origin;
}
