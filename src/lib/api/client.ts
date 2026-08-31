const API_ROOT_URL = (
  process.env.NEXT_PUBLIC_API_ROOT_URL ?? "https://wms-b.onrender.com"
).replace(/\/$/, "");
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api/v1";

const ACCESS_TOKEN_KEY = "wms_access_token";
const REFRESH_TOKEN_KEY = "wms_refresh_token";

function envAccessToken(): string | null {
  const token = process.env.NEXT_PUBLIC_JWT_TOKEN?.trim();
  if (!token) return null;
  // Only use env token if it looks like a JWT (three base64 segments)
  if (!/^eyJ[\w-]*\.[\w-]*\.[\w-]*$/i.test(token)) {
    return null;
  }
  return token;
}

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

/** Token from a real sign-in (localStorage only). Used for login redirects. */
export function getSessionToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

/**
 * Token for API Authorization headers.
 * Prefers a signed-in session; falls back to NEXT_PUBLIC_JWT_TOKEN if set.
 * Env JWT must not be used for "are you logged in?" checks.
 */
export function getAccessToken(): string | null {
  return getSessionToken() ?? envAccessToken();
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
    return `${API_ROOT_URL}${normalized}`;
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
    throw new ApiError(
      0,
      `Cannot reach the API at ${API_ROOT_URL}. Check that the backend is running.`,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");
  const payload = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    if (response.status === 401 && getSessionToken()) {
      clearTokens();
      if (typeof window !== "undefined" && window.location.pathname !== "/") {
        window.location.assign("/");
      }
    }
    const message = extractErrorMessage(payload, response.statusText);
    throw new ApiError(response.status, message, payload);
  }

  return payload as T;
}

const GENERIC_ERROR_MESSAGES = new Set([
  "operation failed",
  "request failed",
  "error",
  "bad request",
]);

function isUsefulErrorMessage(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  return !GENERIC_ERROR_MESSAGES.has(trimmed.toLowerCase());
}

/** Parse API error payloads (superadmin + /api/v1/auth formats). */
export function extractErrorMessage(payload: unknown, fallback: string): string {
  if (typeof payload === "string" && payload.trim()) {
    if (payload.toLowerCase().includes("internal server error")) {
      return "The API returned an internal server error. Check that the backend is running and configured correctly.";
    }
    return payload;
  }

  if (typeof payload === "object" && payload !== null) {
    const record = payload as Record<string, unknown>;
    const nestedError = record.error;

    if (typeof nestedError === "object" && nestedError !== null) {
      const errObj = nestedError as Record<string, unknown>;
      const code = typeof errObj.code === "string" ? errObj.code : "";
      const details = errObj.details;

      if (code === "RATE_LIMIT_EXCEEDED") {
        const retryAfter =
          typeof details === "object" &&
          details !== null &&
          typeof (details as Record<string, unknown>).retryAfterSeconds ===
            "number"
            ? Math.ceil(
                (details as Record<string, unknown>).retryAfterSeconds as number,
              )
            : null;
        return retryAfter
          ? `Too many sign-in attempts. Please wait ${retryAfter} seconds and try again.`
          : "Too many sign-in attempts. Please wait a few minutes and try again.";
      }

      if (code === "CORS_ORIGIN_NOT_ALLOWED") {
        return "Unable to reach the sign-in service from this address. Use http://localhost:3000 or the deployed app URL.";
      }

      if (code === "FORBIDDEN" || code === "ACCESS_DENIED") {
        if (typeof details === "object" && details !== null) {
          const detailMessage = (details as Record<string, unknown>).message;
          if (isUsefulErrorMessage(detailMessage)) {
            return detailMessage;
          }
        }
        return "Access denied. This account may not have Super Admin permissions.";
      }

      if (typeof details === "object" && details !== null) {
        const detailMessage = (details as Record<string, unknown>).message;
        if (isUsefulErrorMessage(detailMessage)) {
          return detailMessage;
        }
      }
      if (isUsefulErrorMessage(errObj.message)) {
        return errObj.message;
      }
    }

    if (isUsefulErrorMessage(nestedError)) {
      return nestedError;
    }

    const candidates = [record.detail, record.title, record.message];
    for (const candidate of candidates) {
      if (isUsefulErrorMessage(candidate)) {
        return candidate;
      }
    }
  }

  if (fallback.toLowerCase().includes("internal server error")) {
    return "The API returned an internal server error. Check backend logs for details.";
  }

  if (responseLooksLikeAuthFailure(payload)) {
    return "Invalid email or password.";
  }

  if (fallback.toLowerCase() === "forbidden") {
    return "Access denied. Check your Super Admin credentials and try again.";
  }

  return fallback || "Request failed";
}

function responseLooksLikeAuthFailure(payload: unknown): boolean {
  if (typeof payload !== "object" || payload === null) return false;
  const record = payload as Record<string, unknown>;
  const nestedError = record.error;
  if (typeof nestedError !== "object" || nestedError === null) return false;
  const code = (nestedError as Record<string, unknown>).code;
  return code === "INVALID_CREDENTIALS";
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
