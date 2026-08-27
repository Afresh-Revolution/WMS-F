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
}
