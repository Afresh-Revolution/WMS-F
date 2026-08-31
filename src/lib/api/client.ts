<<<<<<< HEAD
import { getAccessToken } from "./auth";
import { ApiError, type JsonRecord, type ListResult, type ManagerListParams, type PaginationMeta } from "./types";

const MANAGER_PATH = "/api/v1/manager";

/**
 * Live Manager API is opt-in so localhost can run on mock data.
 * Enable it with `NEXT_PUBLIC_API_URL` and/or `API_ORIGIN` (proxied as `NEXT_PUBLIC_API_PROXY`).
 */
export function isLiveApiEnabled(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_API_URL?.trim() || process.env.NEXT_PUBLIC_API_PROXY?.trim(),
  );
}

/**
 * Resolve the Manager API base.
 * - Unset: same-origin `/api/v1/manager` (optionally proxied via `API_ORIGIN`)
 * - Origin only (`http://localhost:4000`): append `/api/v1/manager`
 * - Already a manager/v1 path: use as-is
 */
export function getManagerBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/$/, "") ?? "";
  if (!raw) return MANAGER_PATH;
  if (raw.endsWith("/manager")) return raw;
  if (raw.endsWith("/api/v1")) return `${raw}/manager`;
  if (raw.endsWith("/api")) return `${raw}/v1/manager`;
  return `${raw}${MANAGER_PATH}`;
}

function joinPath(base: string, path: string): string {
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${base}${suffix}`;
}

function toQueryString(query?: ManagerListParams): string {
  if (!query) return "";

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") continue;
    params.set(key, String(value));
  }

  const serialized = params.toString();
  return serialized ? `?${serialized}` : "";
}

export function asRecord(value: unknown): JsonRecord {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as JsonRecord;
  }
  return {};
}

export function pick(record: JsonRecord, ...keys: string[]): unknown {
  for (const key of keys) {
    const value = record[key];
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return undefined;
}

export function pickString(record: JsonRecord, ...keys: string[]): string {
  const value = pick(record, ...keys);
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (value && typeof value === "object") {
    const nested = asRecord(value);
    return pickString(
      nested,
      "name",
      "fullName",
      "full_name",
      "title",
      "label",
      "email",
      "message",
    );
  }
  return "";
}

export function pickNumber(record: JsonRecord, ...keys: string[]): number | undefined {
  const value = pick(record, ...keys);
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value.replace(/,/g, ""));
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

export function unwrapData<T>(payload: unknown): T {
  if (Array.isArray(payload)) return payload as T;

  const record = asRecord(payload);
  if ("data" in record) return record.data as T;
  if ("result" in record) return record.result as T;
  if ("payload" in record) return record.payload as T;
  return payload as T;
}

function readMeta(value: unknown): PaginationMeta {
  const record = asRecord(value);
  return {
    page: pickNumber(record, "page", "currentPage", "current_page"),
    limit: pickNumber(record, "limit", "perPage", "per_page", "pageSize", "page_size"),
    total: pickNumber(record, "total", "count", "totalCount", "total_count"),
    totalPages: pickNumber(record, "totalPages", "total_pages", "pageCount", "page_count"),
  };
}

export function unwrapList<T>(payload: unknown): ListResult<T> {
  if (Array.isArray(payload)) {
    return { items: payload as T[], meta: {}, raw: payload };
  }

  const record = asRecord(payload);
  const candidates = [
    record.data,
    record.items,
    record.results,
    record.records,
    record.rows,
    record.notifications,
    record.employees,
    record.departments,
    record.leave,
    record.leaveRequests,
    record.promotions,
    record.meetings,
    record.tasks,
    record.targets,
    record.expenses,
    record.events,
    record.discipline,
    record.approvals,
    record.auditLogs,
    record.audit_logs,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return {
        items: candidate as T[],
        meta: readMeta(record.meta ?? record.pagination ?? record),
        raw: payload,
      };
    }

    const nested = asRecord(candidate);
    const nestedList =
      nested.items ?? nested.results ?? nested.records ?? nested.data ?? nested.rows;
    if (Array.isArray(nestedList)) {
      return {
        items: nestedList as T[],
        meta: readMeta(nested.meta ?? nested.pagination ?? record.meta ?? record),
        raw: payload,
      };
    }
  }

  return { items: [], meta: readMeta(record.meta ?? record), raw: payload };
}

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  query?: ManagerListParams;
  body?: unknown;
};

export async function managerRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const url = `${joinPath(getManagerBaseUrl(), path)}${toQueryString(options.query)}`;
  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  const token = getAccessToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const init: RequestInit = {
    method: options.method ?? "GET",
    headers,
    credentials: "include",
  };

  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
    init.body = JSON.stringify(options.body);
  }

  const response = await fetch(url, init);
  const text = await response.text();
  let parsed: unknown = null;
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = text;
    }
  }

  if (!response.ok) {
    const message =
      pickString(asRecord(parsed), "message", "error", "detail") ||
      response.statusText ||
      "Request failed";
    throw new ApiError(message, response.status, parsed);
  }

  return parsed as T;
=======
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
>>>>>>> 37eb1224d5b2fc1ab1c618b51d1c98ba658180c9
}
