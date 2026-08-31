const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api/v1";

const ACCESS_TOKEN_KEY = "wms_access_token";
const REFRESH_TOKEN_KEY = "wms_refresh_token";

export class ApiError extends Error {
  status: number;
  body?: unknown;

  constructor(status: number, message: string, body?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setTokens(accessToken: string, refreshToken?: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }
}

export function clearTokens() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  auth?: boolean;
  /** Use root API path without /api/v1 prefix (e.g. /health, /api/superadmin) */
  root?: boolean;
};

function resolveUrl(path: string, root?: boolean) {
  if (path.startsWith("http")) return path;
  if (root) {
    const normalized = path.startsWith("/") ? path : `/${path}`;
    // Browser: same-origin path so Next.js rewrites proxy to the backend
    if (typeof window !== "undefined") {
      return normalized;
    }
    const rootBase =
      process.env.NEXT_PUBLIC_API_ROOT_URL ?? "http://localhost:3001";
    return `${rootBase}${normalized}`;
  }
  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { body, auth = true, root, headers, ...rest } = options;

  const requestHeaders: Record<string, string> = {
    ...(headers as Record<string, string>),
  };

  if (body !== undefined && !(body instanceof FormData)) {
    requestHeaders["Content-Type"] = "application/json";
  }

  if (auth) {
    const token = getAccessToken();
    if (token) {
      requestHeaders.Authorization = `Bearer ${token}`;
    }
  }

  let response: Response;
  try {
    response = await fetch(resolveUrl(path, root), {
      ...rest,
      headers: requestHeaders,
      body:
        body instanceof FormData
          ? body
          : body !== undefined
            ? JSON.stringify(body)
            : undefined,
    });
  } catch {
    const apiRoot = process.env.NEXT_PUBLIC_API_ROOT_URL ?? "http://localhost:3001";
    throw new ApiError(
      0,
      `Cannot reach the API at ${apiRoot}. Start the backend server, then try again.`,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");
  const payload = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const message = extractErrorMessage(payload, response.statusText);
    throw new ApiError(response.status, message, payload);
  }

  return payload as T;
}

function extractErrorMessage(payload: unknown, fallback: string): string {
  if (typeof payload === "string" && payload.trim()) {
    if (payload.toLowerCase().includes("internal server error")) {
      return "The API returned an internal server error. Check that the backend is running and configured correctly.";
    }
    return payload;
  }

  if (typeof payload === "object" && payload !== null) {
    const record = payload as Record<string, unknown>;
    const candidates = [record.message, record.error, record.detail, record.title];
    for (const candidate of candidates) {
      if (typeof candidate === "string" && candidate.trim()) {
        return candidate;
      }
    }
  }

  if (fallback.toLowerCase().includes("internal server error")) {
    return "The API returned an internal server error. Check backend logs for details.";
  }

  return fallback || "Request failed";
}

export function buildQuery(params?: Record<string, unknown>) {
  if (!params) return "";
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `?${query}` : "";
}
