import { apiRequest, buildQuery } from "./client";
import type { ApiListResponse, Id } from "./types";

function systemHealthPath(suffix = "") {
  return `/system-health${suffix}`;
}

export const systemHealthApi = {
  /** Primary v1 routes */
  summary: () => apiRequest<Record<string, unknown>>(systemHealthPath()),

  services: () =>
    apiRequest<ApiListResponse<Record<string, unknown>>>(
      systemHealthPath("/services"),
    ),

  infrastructure: () =>
    apiRequest<Record<string, unknown>>(systemHealthPath("/infrastructure")),

  metrics: () =>
    apiRequest<Record<string, unknown>>(systemHealthPath("/metrics")),

  /** Admin alias at /api/admin/system-health */
  admin: {
    summary: () =>
      apiRequest<Record<string, unknown>>("/api/admin/system-health", {
        root: true,
      }),

    services: () =>
      apiRequest<ApiListResponse<Record<string, unknown>>>(
        "/api/admin/system-health/services",
        { root: true },
      ),

    infrastructure: () =>
      apiRequest<Record<string, unknown>>(
        "/api/admin/system-health/infrastructure",
        { root: true },
      ),

    metrics: () =>
      apiRequest<Record<string, unknown>>(
        "/api/admin/system-health/metrics",
        { root: true },
      ),
  },
};

export const backupsApi = {
  list: (params?: Record<string, unknown>) =>
    apiRequest<ApiListResponse<Record<string, unknown>>>(
      `/backups${buildQuery(params)}`,
    ),

  create: (body?: Record<string, unknown>) =>
    apiRequest<Record<string, unknown>>("/backups", { method: "POST", body }),

  settings: {
    get: () => apiRequest<Record<string, unknown>>("/backups/settings"),
    update: (body: Record<string, unknown>) =>
      apiRequest<Record<string, unknown>>("/backups/settings", {
        method: "PUT",
        body,
      }),
  },

  health: () => apiRequest<Record<string, unknown>>("/backups/health"),

  get: (id: Id) => apiRequest<Record<string, unknown>>(`/backups/${id}`),

  status: (id: Id) =>
    apiRequest<Record<string, unknown>>(`/backups/${id}/status`),

  restore: (id: Id, body?: Record<string, unknown>) =>
    apiRequest<Record<string, unknown>>(`/backups/${id}/restore`, {
      method: "POST",
      body,
    }),

  delete: (id: Id) =>
    apiRequest<void>(`/backups/${id}`, { method: "DELETE" }),

  admin: {
    list: (params?: Record<string, unknown>) =>
      apiRequest<ApiListResponse<Record<string, unknown>>>(
        `/api/admin/backups${buildQuery(params)}`,
        { root: true },
      ),
    create: (body?: Record<string, unknown>) =>
      apiRequest<Record<string, unknown>>("/api/admin/backups", {
        method: "POST",
        body,
        root: true,
      }),
    settings: {
      get: () =>
        apiRequest<Record<string, unknown>>("/api/admin/backups/settings", {
          root: true,
        }),
      update: (body: Record<string, unknown>) =>
        apiRequest<Record<string, unknown>>("/api/admin/backups/settings", {
          method: "PUT",
          body,
          root: true,
        }),
    },
    health: () =>
      apiRequest<Record<string, unknown>>("/api/admin/backups/health", {
        root: true,
      }),
    get: (id: Id) =>
      apiRequest<Record<string, unknown>>(`/api/admin/backups/${id}`, {
        root: true,
      }),
    status: (id: Id) =>
      apiRequest<Record<string, unknown>>(
        `/api/admin/backups/${id}/status`,
        { root: true },
      ),
    restore: (id: Id, body?: Record<string, unknown>) =>
      apiRequest<Record<string, unknown>>(
        `/api/admin/backups/${id}/restore`,
        { method: "POST", body, root: true },
      ),
    delete: (id: Id) =>
      apiRequest<void>(`/api/admin/backups/${id}`, {
        method: "DELETE",
        root: true,
      }),
  },
};

export const technicalAuditLogsApi = {
  list: (params?: Record<string, unknown>) =>
    apiRequest<ApiListResponse<Record<string, unknown>>>(
      `/technical-audit-logs${buildQuery(params)}`,
    ),

  search: (params?: Record<string, unknown>) =>
    apiRequest<ApiListResponse<Record<string, unknown>>>(
      `/technical-audit-logs/search${buildQuery(params)}`,
    ),

  export: (params?: Record<string, unknown>) =>
    apiRequest<Blob>(
      `/technical-audit-logs/export${buildQuery(params)}`,
    ),

  get: (id: Id) =>
    apiRequest<Record<string, unknown>>(`/technical-audit-logs/${id}`),

  admin: {
    list: (params?: Record<string, unknown>) =>
      apiRequest<ApiListResponse<Record<string, unknown>>>(
        `/api/admin/technical-audit-logs${buildQuery(params)}`,
        { root: true },
      ),
    search: (params?: Record<string, unknown>) =>
      apiRequest<ApiListResponse<Record<string, unknown>>>(
        `/api/admin/technical-audit-logs/search${buildQuery(params)}`,
        { root: true },
      ),
    export: (params?: Record<string, unknown>) =>
      apiRequest<Blob>(
        `/api/admin/technical-audit-logs/export${buildQuery(params)}`,
        { root: true },
      ),
    get: (id: Id) =>
      apiRequest<Record<string, unknown>>(
        `/api/admin/technical-audit-logs/${id}`,
        { root: true },
      ),
  },
};
