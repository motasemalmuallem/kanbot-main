import type { ApiErrorBody, User } from "@shared/types/api";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ?? "http://localhost:4000/api";
const TOKEN_KEY = "kanbot-auth";

export class ApiError extends Error {
  status: number;
  code?: string;
  details?: { path: string; message: string }[];

  constructor(status: number, body: ApiErrorBody | null) {
    super(body?.error.message ?? "Something went wrong");
    this.name = "ApiError";
    this.status = status;
    this.code = body?.error.code;
    this.details = body?.error.details;
  }
}

type StoredSession = { token?: string | null; user?: User | null };

function readSession(storage: Storage): StoredSession | null {
  try {
    const stored = storage.getItem(TOKEN_KEY);
    return stored ? (JSON.parse(stored) as StoredSession) : null;
  } catch {
    return null;
  }
}

function getStoredSession(): StoredSession | null {
  const persistentSession = readSession(localStorage);
  if (persistentSession?.token) return persistentSession;

  const tabSession = readSession(sessionStorage);
  return tabSession?.token ? tabSession : null;
}

export function getStoredToken(): string | null {
  return getStoredSession()?.token ?? null;
}

export function getStoredUser(): User | null {
  return getStoredSession()?.user ?? null;
}

export function saveStoredSession(
  token: string,
  user: User,
  rememberMe = false,
): void {
  const currentStorage = rememberMe ? localStorage : sessionStorage;
  const otherStorage = rememberMe ? sessionStorage : localStorage;
  currentStorage.setItem(TOKEN_KEY, JSON.stringify({ token, user }));
  otherStorage.removeItem(TOKEN_KEY);
}

export function updateStoredSession(token: string, user: User): void {
  const persistentToken = readSession(localStorage)?.token;
  saveStoredSession(token, user, persistentToken === token);
}

export function clearStoredSession(): void {
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  window.dispatchEvent(new Event("kanbot-auth-change"));
}

let queryCacheClear: (() => void) | undefined;
export function registerQueryCacheClear(clear: () => void): void {
  queryCacheClear = clear;
}
export function clearQueryCache(): void {
  queryCacheClear?.();
}

let handlingUnauthorized = false;
function handleUnauthorized(): void {
  if (handlingUnauthorized) return;
  handlingUnauthorized = true;
  window.setTimeout(() => {
    handlingUnauthorized = false;
  }, 2000);
  clearStoredSession();
  clearQueryCache();
  const redirect = `${window.location.pathname}${window.location.search}`;
  sessionStorage.setItem("kanbot-session-expired", "1");
  if (window.location.pathname !== "/login") {
    window.location.assign(`/login?redirect=${encodeURIComponent(redirect)}`);
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body && !headers.has("Content-Type"))
    headers.set("Content-Type", "application/json");
  const token = getStoredToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  } catch {
    throw new ApiError(0, {
      error: { code: "INTERNAL_ERROR", message: "Can't reach the server" },
    });
  }

  if (!response.ok) {
    let body: ApiErrorBody | null = null;
    try {
      body = (await response.json()) as ApiErrorBody;
    } catch {
      /* non-JSON error response */
    }
    if (response.status === 401 && !path.includes("/auth/login"))
      handleUnauthorized();
    throw new ApiError(response.status, body);
  }
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong";
}
