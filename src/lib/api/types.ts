export type PaginatedResponse<T> = {
  data: T[];
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
  };
};

export type ApiListResponse<T> = T[] | PaginatedResponse<T> | unknown;

export type Id = string | number;

export function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

const LIST_KEYS = [
  "items",
  "records",
  "results",
  "rows",
  "users",
  "employees",
  "people",
  "staff",
  "directory",
  "members",
  "departments",
  "roles",
  "permissions",
  "leave",
  "leaveRequests",
  "leaveTypes",
  "leave_types",
  "types",
  "catalog",
  "options",
  "balances",
  "requests",
  "promotions",
  "increments",
  "salaryIncrements",
  "salaryAdjustments",
  "meetings",
  "tasks",
  "targets",
  "reviews",
  "payroll",
  "payRuns",
  "runs",
  "periods",
  "bills",
  "invoices",
  "expenses",
  "claims",
  "purchases",
  "purchaseRequests",
  "purchaseOrders",
  "vendors",
  "events",
  "cases",
  "discipline",
  "announcements",
  "logs",
  "auditLogs",
  "sessions",
  "templates",
  "backups",
  "snapshots",
  "services",
  "notifications",
  "interns",
  "nysc",
  "nyscInterns",
  "placements",
  "members",
  "hods",
  "options",
  "articles",
  "topics",
  "integrations",
  "reports",
  "history",
  "activity",
  "attempts",
  "devices",
  "modules",
] as const;

export function unwrapData(payload: unknown): unknown {
  if (!payload || typeof payload !== "object") return payload;
  if (Array.isArray(payload)) return payload;
  const root = payload as Record<string, unknown>;
  if (root.data !== undefined) return root.data;
  if (root.payload !== undefined) return root.payload;
  if (root.result !== undefined) return root.result;
  return payload;
}

export function unwrapRecord(payload: unknown): Record<string, unknown> {
  const data = unwrapData(payload);
  if (data && typeof data === "object" && !Array.isArray(data)) {
    return data as Record<string, unknown>;
  }
  return asRecord(payload);
}

function listFromObject(value: Record<string, unknown>): unknown[] | null {
  let empty: unknown[] | null = null;
  for (const key of LIST_KEYS) {
    if (!Array.isArray(value[key])) continue;
    if (value[key].length > 0) return value[key] as unknown[];
    empty ??= value[key] as unknown[];
  }
  if (Array.isArray(value.data) && value.data.length > 0) return value.data;
  if (Array.isArray(value.data)) return value.data;
  return empty;
}

export function unwrapList<T>(response: ApiListResponse<T> | null | undefined): T[] {
  if (!response) return [];
  if (Array.isArray(response)) return response as T[];

  const first = unwrapData(response);
  if (Array.isArray(first)) return first as T[];

  const firstRecord = asRecord(first);
  const fromFirst = listFromObject(firstRecord);
  if (fromFirst) return fromFirst as T[];

  const nested = unwrapData(first);
  if (Array.isArray(nested)) return nested as T[];
  const fromNested = listFromObject(asRecord(nested));
  if (fromNested) return fromNested as T[];

  const rootList = listFromObject(asRecord(response));
  return (rootList ?? []) as T[];
}
