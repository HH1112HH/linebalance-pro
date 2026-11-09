import type { Context } from "https://edge.netlify.com";

const COOKIE_NAME = "lb_edge_session";
const SESSION_TTL_SEC = 8 * 60 * 60;
const LOGIN_FAILURE_DELAY_MS = 250;
const DEFAULT_ADMIN_USERS = "admin";
const DEFAULT_VIEWER_USERS = "test1,test2,test3,test4";

type Role = "admin" | "viewer";

interface SessionPayload {
  sub: string;
  role: Role;
  exp: number;
  ph: string;
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function env(name: string): string {
  return Netlify.env.get(name)?.trim() ?? "";
}

function parseUsers(name: string, fallback: string): string[] {
  return (env(name) || fallback)
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

function adminUsers(): string[] {
  return parseUsers("LB_AUTH_ADMIN_USERS", DEFAULT_ADMIN_USERS);
}

function viewerUsers(): string[] {
  return parseUsers("LB_AUTH_VIEWER_USERS", DEFAULT_VIEWER_USERS);
}

function passwordFor(role: Role): string {
  return role === "admin"
    ? env("LB_AUTH_ADMIN_PASSWORD")
    : env("LB_AUTH_VIEWER_PASSWORD");
}

function loginConfigured(): boolean {
  return (
    Boolean(env("LB_AUTH_SESSION_SECRET")) &&
    Boolean(env("LB_AUTH_ADMIN_PASSWORD") || env("LB_AUTH_VIEWER_PASSWORD"))
  );
}

function timingSafeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
}

function base64UrlEncode(value: Uint8Array): string {
  let binary = "";
  for (const byte of value) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(value: string): Uint8Array {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

async function digest(value: string): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-256", encoder.encode(value));
  return Array.from(new Uint8Array(hash))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function sign(value: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
  return base64UrlEncode(new Uint8Array(signature));
}

async function verifySignature(
  value: string,
  signature: string,
  secret: string,
): Promise<boolean> {
  try {
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"],
    );
    return await crypto.subtle.verify(
      "HMAC",
      key,
      base64UrlDecode(signature),
      encoder.encode(value),
    );
  } catch {
    return false;
  }
}

function cookieValue(request: Request): string | null {
  const header = request.headers.get("cookie") ?? "";
  for (const part of header.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name === COOKIE_NAME) return rest.join("=");
  }
  return null;
}

function isSessionPayload(value: unknown): value is SessionPayload {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.sub === "string" &&
    (record.role === "admin" || record.role === "viewer") &&
    typeof record.exp === "number" &&
    typeof record.ph === "string"
  );
}

async function readSession(request: Request): Promise<SessionPayload | null> {
  const secret = env("LB_AUTH_SESSION_SECRET");
  const token = cookieValue(request);
  if (!secret || !token) return null;

  const [payloadPart, signaturePart, extra] = token.split(".");
  if (!payloadPart || !signaturePart || extra !== undefined) return null;
  if (!(await verifySignature(payloadPart, signaturePart, secret))) return null;

  let payload: unknown;
  try {
    payload = JSON.parse(decoder.decode(base64UrlDecode(payloadPart)));
  } catch {
    return null;
  }
  if (!isSessionPayload(payload)) return null;
  if (payload.exp <= Math.floor(Date.now() / 1000)) return null;

  const users = payload.role === "admin" ? adminUsers() : viewerUsers();
  if (!users.includes(payload.sub)) return null;

  const password = passwordFor(payload.role);
  if (!password) return null;
  const fingerprint = (await digest(password)).slice(0, 16);
  return timingSafeEqual(payload.ph, fingerprint) ? payload : null;
}

function sessionResponse(session: SessionPayload | null): Record<string, unknown> {
  return {
    authenticated: Boolean(session),
    login_enabled: loginConfigured(),
    username: session?.sub ?? null,
    role: session?.role ?? null,
    expires_at: session ? new Date(session.exp * 1000).toISOString() : null,
  };
}

function jsonResponse(
  body: unknown,
  status = 200,
  headers: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...headers,
    },
  });
}

function cookieHeader(request: Request, token: string): string {
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_TTL_SEC}${secure}`;
}

async function handleLogin(request: Request): Promise<Response> {
  if (!loginConfigured()) {
    return jsonResponse({ detail: "Demo login is not configured." }, 503);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ detail: "Invalid login payload." }, 400);
  }
  if (!body || typeof body !== "object") {
    return jsonResponse({ detail: "Invalid login payload." }, 400);
  }
  const payload = body as Record<string, unknown>;
  const username =
    typeof payload.username === "string" ? payload.username.trim().toLowerCase() : "";
  const password = typeof payload.password === "string" ? payload.password : "";
  if (!username || !password) {
    return jsonResponse({ detail: "Username and password are required." }, 400);
  }

  const role: Role | null = adminUsers().includes(username)
    ? "admin"
    : viewerUsers().includes(username)
      ? "viewer"
      : null;
  if (!role) {
    await new Promise((resolve) => setTimeout(resolve, LOGIN_FAILURE_DELAY_MS));
    return jsonResponse({ detail: "Invalid username or password." }, 401);
  }

  const expectedPassword = passwordFor(role);
  if (!expectedPassword) {
    return jsonResponse({ detail: "Demo login is not configured." }, 503);
  }
  const matches = timingSafeEqual(
    await digest(password),
    await digest(expectedPassword),
  );
  if (!matches) {
    await new Promise((resolve) => setTimeout(resolve, LOGIN_FAILURE_DELAY_MS));
    return jsonResponse({ detail: "Invalid username or password." }, 401);
  }

  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_SEC;
  const session: SessionPayload = {
    sub: username,
    role,
    exp,
    ph: (await digest(expectedPassword)).slice(0, 16),
  };
  const payloadPart = base64UrlEncode(encoder.encode(JSON.stringify(session)));
  const signaturePart = await sign(payloadPart, env("LB_AUTH_SESSION_SECRET"));
  const token = `${payloadPart}.${signaturePart}`;

  return jsonResponse(sessionResponse(session), 200, {
    "set-cookie": cookieHeader(request, token),
  });
}

function handleLogout(request: Request): Response {
  return new Response(null, {
    status: 204,
    headers: {
      "set-cookie": cookieHeader(request, ""),
      "cache-control": "no-store",
    },
  });
}

function isViewerWrite(request: Request, path: string): boolean {
  return (
    (request.method === "DELETE" && path.startsWith("/api/scenarios/")) ||
    (request.method === "POST" && path === "/api/scenarios")
  );
}

function isScenarioPath(path: string): boolean {
  return path === "/api/scenarios" || path.startsWith("/api/scenarios/");
}

function withScenarioToken(request: Request): Request {
  const token = env("LB_SCENARIO_API_TOKEN");
  if (!token) return request;
  const headers = new Headers(request.headers);
  headers.set("authorization", `Bearer ${token}`);
  return new Request(request, { headers });
}

export default async (request: Request, context: Context): Promise<Response> => {
  const url = new URL(request.url);
  const path = url.pathname;

  if (path === "/api/auth/session" && request.method === "GET") {
    return jsonResponse(sessionResponse(await readSession(request)));
  }
  if (path === "/api/auth/login" && request.method === "POST") {
    return handleLogin(request);
  }
  if (path === "/api/auth/logout" && request.method === "POST") {
    return handleLogout(request);
  }

  if (path === "/api/health" || path === "/health") {
    return context.next();
  }

  if (path.startsWith("/api/")) {
    const session = await readSession(request);
    if (!session) {
      return jsonResponse({ detail: "Authentication required." }, 401);
    }
    if (session.role !== "admin" && isViewerWrite(request, path)) {
      return jsonResponse({ detail: "Admin access is required for this action." }, 403);
    }
    return context.next(
      isScenarioPath(path) ? withScenarioToken(request) : request,
    );
  }

  if (path === "/login" || path.startsWith("/assets/") || path.includes(".")) {
    return context.next();
  }

  if (!(await readSession(request))) {
    return Response.redirect(new URL("/login", url).toString(), 302);
  }
  return context.next();
};
