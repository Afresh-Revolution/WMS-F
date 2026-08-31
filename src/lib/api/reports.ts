import { apiRequest, buildQuery } from "./client";
import type { ApiListResponse, Id } from "./types";

export const reportsApi = {
  overview: () => apiRequest<Record<string, unknown>>("/reports/overview"),

  headcount: (params?: Record<string, unknown>) =>
    apiRequest<Record<string, unknown>>(
      `/reports/headcount${buildQuery(params)}`,
    ),

  headcountGrowth: (params?: Record<string, unknown>) =>
    apiRequest<Record<string, unknown>>(
      `/reports/headcount-growth${buildQuery(params)}`,
    ),

  attendance: (params?: Record<string, unknown>) =>
    apiRequest<Record<string, unknown>>(
      `/reports/attendance${buildQuery(params)}`,
    ),

  attrition: (params?: Record<string, unknown>) =>
    apiRequest<Record<string, unknown>>(
      `/reports/attrition${buildQuery(params)}`,
    ),

  departments: (params?: Record<string, unknown>) =>
    apiRequest<Record<string, unknown>>(
      `/reports/departments${buildQuery(params)}`,
    ),

  leave: (params?: Record<string, unknown>) =>
    apiRequest<Record<string, unknown>>(
      `/reports/leave${buildQuery(params)}`,
    ),

  payroll: (params?: Record<string, unknown>) =>
    apiRequest<Record<string, unknown>>(
      `/reports/payroll${buildQuery(params)}`,
    ),

  tasks: (params?: Record<string, unknown>) =>
    apiRequest<Record<string, unknown>>(
      `/reports/tasks${buildQuery(params)}`,
    ),

  targets: (params?: Record<string, unknown>) =>
    apiRequest<Record<string, unknown>>(
      `/reports/targets${buildQuery(params)}`,
    ),

  promotions: (params?: Record<string, unknown>) =>
    apiRequest<Record<string, unknown>>(
      `/reports/promotions${buildQuery(params)}`,
    ),

  salaryIncrements: (params?: Record<string, unknown>) =>
    apiRequest<Record<string, unknown>>(
      `/reports/salary-increments${buildQuery(params)}`,
    ),

  expenses: (params?: Record<string, unknown>) =>
    apiRequest<Record<string, unknown>>(
      `/reports/expenses${buildQuery(params)}`,
    ),

  purchases: (params?: Record<string, unknown>) =>
    apiRequest<Record<string, unknown>>(
      `/reports/purchases${buildQuery(params)}`,
    ),

  bills: (params?: Record<string, unknown>) =>
    apiRequest<Record<string, unknown>>(
      `/reports/bills${buildQuery(params)}`,
    ),

  vendors: (params?: Record<string, unknown>) =>
    apiRequest<Record<string, unknown>>(
      `/reports/vendors${buildQuery(params)}`,
    ),

  nyscInterns: (params?: Record<string, unknown>) =>
    apiRequest<Record<string, unknown>>(
      `/reports/nysc-interns${buildQuery(params)}`,
    ),

  discipline: (params?: Record<string, unknown>) =>
    apiRequest<Record<string, unknown>>(
      `/reports/discipline${buildQuery(params)}`,
    ),

  meetings: (params?: Record<string, unknown>) =>
    apiRequest<Record<string, unknown>>(
      `/reports/meetings${buildQuery(params)}`,
    ),

  events: (params?: Record<string, unknown>) =>
    apiRequest<Record<string, unknown>>(
      `/reports/events${buildQuery(params)}`,
    ),

  announcements: (params?: Record<string, unknown>) =>
    apiRequest<Record<string, unknown>>(
      `/reports/announcements${buildQuery(params)}`,
    ),

  dataQuality: (params?: Record<string, unknown>) =>
    apiRequest<Record<string, unknown>>(
      `/reports/data-quality${buildQuery(params)}`,
    ),

  custom: (body: Record<string, unknown>) =>
    apiRequest<Record<string, unknown>>("/reports/custom", {
      method: "POST",
      body,
    }),

  exportHistory: (params?: Record<string, unknown>) =>
    apiRequest<ApiListResponse<Record<string, unknown>>>(
      `/reports/export-history${buildQuery(params)}`,
    ),

  export: (params?: Record<string, unknown>) =>
    apiRequest<Blob>(`/reports/export${buildQuery(params)}`),

  saved: {
    list: (params?: Record<string, unknown>) =>
      apiRequest<ApiListResponse<Record<string, unknown>>>(
        `/reports/saved${buildQuery(params)}`,
      ),
    create: (body: Record<string, unknown>) =>
      apiRequest<Record<string, unknown>>("/reports/saved", {
        method: "POST",
        body,
      }),
    get: (id: Id) =>
      apiRequest<Record<string, unknown>>(`/reports/saved/${id}`),
    update: (id: Id, body: Record<string, unknown>) =>
      apiRequest<Record<string, unknown>>(`/reports/saved/${id}`, {
        method: "PATCH",
        body,
      }),
    delete: (id: Id) =>
      apiRequest<void>(`/reports/saved/${id}`, { method: "DELETE" }),
    run: (id: Id, body?: Record<string, unknown>) =>
      apiRequest<Record<string, unknown>>(`/reports/saved/${id}/run`, {
        method: "POST",
        body,
      }),
  },
};

export const auditLogsApi = {
  stats: () => apiRequest<Record<string, unknown>>("/audit-logs/stats"),

  export: (params?: Record<string, unknown>) =>
    apiRequest<Blob>(`/audit-logs/export${buildQuery(params)}`),

  list: (params?: Record<string, unknown>) =>
    apiRequest<ApiListResponse<Record<string, unknown>>>(
      `/audit-logs${buildQuery(params)}`,
    ),

  get: (id: Id) =>
    apiRequest<Record<string, unknown>>(`/audit-logs/${id}`),

  /** Write methods return 405 AUDIT_LOG_IMMUTABLE on the backend */
  create: (body: Record<string, unknown>) =>
    apiRequest<Record<string, unknown>>("/audit-logs", {
      method: "POST",
      body,
    }),

  update: (id: Id, body: Record<string, unknown>) =>
    apiRequest<Record<string, unknown>>(`/audit-logs/${id}`, {
      method: "PUT",
      body,
    }),

  patch: (id: Id, body: Record<string, unknown>) =>
    apiRequest<Record<string, unknown>>(`/audit-logs/${id}`, {
      method: "PATCH",
      body,
    }),

  delete: (id: Id) =>
    apiRequest<void>(`/audit-logs/${id}`, { method: "DELETE" }),

  /** Alias mount at /api/v1/audit/operational */
  operational: {
    list: (params?: Record<string, unknown>) =>
      apiRequest<ApiListResponse<Record<string, unknown>>>(
        `/audit/operational${buildQuery(params)}`,
      ),
  },
};
