import { apiRequest, buildQuery } from "./client";
import type { ApiListResponse, Id } from "./types";

const BASE = "/system-management";

export const systemManagementApi = {
  overview: () => apiRequest<Record<string, unknown>>(`${BASE}/overview`),

  health: () => apiRequest<Record<string, unknown>>(`${BASE}/health`),

  status: () => apiRequest<Record<string, unknown>>(`${BASE}/status`),

  settings: {
    list: () => apiRequest<Record<string, unknown>>(`${BASE}/settings`),
    update: (body: Record<string, unknown>) =>
      apiRequest<Record<string, unknown>>(`${BASE}/settings`, {
        method: "PATCH",
        body,
      }),
  },

  maintenance: {
    enable: (body?: Record<string, unknown>) =>
      apiRequest<void>(`${BASE}/maintenance/enable`, { method: "POST", body }),
    disable: () =>
      apiRequest<void>(`${BASE}/maintenance/disable`, { method: "POST" }),
  },

  security: {
    get: () =>
      apiRequest<Record<string, unknown>>(`${BASE}/security/settings`),
    update: (body: Record<string, unknown>) =>
      apiRequest<Record<string, unknown>>(`${BASE}/security/settings`, {
        method: "PATCH",
        body,
      }),
  },

  users: {
    list: (params?: Record<string, unknown>) =>
      apiRequest<ApiListResponse<Record<string, unknown>>>(
        `${BASE}/users${buildQuery(params)}`,
      ),
    create: (body: Record<string, unknown>) =>
      apiRequest<Record<string, unknown>>(`${BASE}/users`, {
        method: "POST",
        body,
      }),
    update: (id: Id, body: Record<string, unknown>) =>
      apiRequest<Record<string, unknown>>(`${BASE}/users/${id}`, {
        method: "PATCH",
        body,
      }),
    activate: (id: Id) =>
      apiRequest<void>(`${BASE}/users/${id}/activate`, { method: "POST" }),
    deactivate: (id: Id) =>
      apiRequest<void>(`${BASE}/users/${id}/deactivate`, { method: "POST" }),
    suspend: (id: Id) =>
      apiRequest<void>(`${BASE}/users/${id}/suspend`, { method: "POST" }),
    lock: (id: Id) =>
      apiRequest<void>(`${BASE}/users/${id}/lock`, { method: "POST" }),
    unlock: (id: Id) =>
      apiRequest<void>(`${BASE}/users/${id}/unlock`, { method: "POST" }),
    resetPassword: (id: Id, body?: Record<string, unknown>) =>
      apiRequest<void>(`${BASE}/users/${id}/reset-password`, {
        method: "POST",
        body,
      }),
    revokeSessions: (id: Id) =>
      apiRequest<void>(`${BASE}/users/${id}/revoke-sessions`, {
        method: "POST",
      }),
    loginHistory: (id: Id, params?: Record<string, unknown>) =>
      apiRequest<ApiListResponse<Record<string, unknown>>>(
        `${BASE}/users/${id}/login-history${buildQuery(params)}`,
      ),
  },

  sessions: {
    list: (params?: Record<string, unknown>) =>
      apiRequest<ApiListResponse<Record<string, unknown>>>(
        `${BASE}/sessions${buildQuery(params)}`,
      ),
    revoke: (id: Id) =>
      apiRequest<void>(`${BASE}/sessions/${id}/revoke`, { method: "POST" }),
  },

  roles: {
    list: (params?: Record<string, unknown>) =>
      apiRequest<ApiListResponse<Record<string, unknown>>>(
        `${BASE}/roles${buildQuery(params)}`,
      ),
    create: (body: Record<string, unknown>) =>
      apiRequest<Record<string, unknown>>(`${BASE}/roles`, {
        method: "POST",
        body,
      }),
    update: (id: Id, body: Record<string, unknown>) =>
      apiRequest<Record<string, unknown>>(`${BASE}/roles/${id}`, {
        method: "PATCH",
        body,
      }),
    delete: (id: Id) =>
      apiRequest<void>(`${BASE}/roles/${id}`, { method: "DELETE" }),
    assignPermissions: (id: Id, body: Record<string, unknown>) =>
      apiRequest<void>(`${BASE}/roles/${id}/permissions`, {
        method: "POST",
        body,
      }),
  },

  permissions: {
    list: (params?: Record<string, unknown>) =>
      apiRequest<ApiListResponse<Record<string, unknown>>>(
        `${BASE}/permissions${buildQuery(params)}`,
      ),
  },

  integrations: {
    list: (params?: Record<string, unknown>) =>
      apiRequest<ApiListResponse<Record<string, unknown>>>(
        `${BASE}/integrations${buildQuery(params)}`,
      ),
    create: (body: Record<string, unknown>) =>
      apiRequest<Record<string, unknown>>(`${BASE}/integrations`, {
        method: "POST",
        body,
      }),
    update: (id: Id, body: Record<string, unknown>) =>
      apiRequest<Record<string, unknown>>(`${BASE}/integrations/${id}`, {
        method: "PATCH",
        body,
      }),
    delete: (id: Id) =>
      apiRequest<void>(`${BASE}/integrations/${id}`, { method: "DELETE" }),
    test: (id: Id) =>
      apiRequest<Record<string, unknown>>(`${BASE}/integrations/${id}/test`, {
        method: "POST",
      }),
  },

  email: {
    get: () =>
      apiRequest<Record<string, unknown>>(`${BASE}/email/configuration`),
    update: (body: Record<string, unknown>) =>
      apiRequest<Record<string, unknown>>(`${BASE}/email/configuration`, {
        method: "PATCH",
        body,
      }),
    test: (body?: Record<string, unknown>) =>
      apiRequest<Record<string, unknown>>(`${BASE}/email/test`, {
        method: "POST",
        body,
      }),
  },

  notifications: {
    get: () =>
      apiRequest<Record<string, unknown>>(
        `${BASE}/notifications/configuration`,
      ),
    update: (body: Record<string, unknown>) =>
      apiRequest<Record<string, unknown>>(
        `${BASE}/notifications/configuration`,
        { method: "PATCH", body },
      ),
  },

  documentTemplates: {
    list: (params?: Record<string, unknown>) =>
      apiRequest<ApiListResponse<Record<string, unknown>>>(
        `${BASE}/document-templates${buildQuery(params)}`,
      ),
    create: (body: Record<string, unknown>) =>
      apiRequest<Record<string, unknown>>(`${BASE}/document-templates`, {
        method: "POST",
        body,
      }),
    update: (id: Id, body: Record<string, unknown>) =>
      apiRequest<Record<string, unknown>>(`${BASE}/document-templates/${id}`, {
        method: "PATCH",
        body,
      }),
    delete: (id: Id) =>
      apiRequest<void>(`${BASE}/document-templates/${id}`, {
        method: "DELETE",
      }),
  },

  backups: {
    list: (params?: Record<string, unknown>) =>
      apiRequest<ApiListResponse<Record<string, unknown>>>(
        `${BASE}/backups${buildQuery(params)}`,
      ),
    queue: (body?: Record<string, unknown>) =>
      apiRequest<Record<string, unknown>>(`${BASE}/backups`, {
        method: "POST",
        body,
      }),
    restore: (id: Id, body?: Record<string, unknown>) =>
      apiRequest<Record<string, unknown>>(`${BASE}/backups/${id}/restore`, {
        method: "POST",
        body,
      }),
  },

  technicalAuditLogs: {
    list: (params?: Record<string, unknown>) =>
      apiRequest<ApiListResponse<Record<string, unknown>>>(
        `${BASE}/technical-audit-logs${buildQuery(params)}`,
      ),
    export: (params?: Record<string, unknown>) =>
      apiRequest<Blob>(
        `${BASE}/technical-audit-logs/export${buildQuery(params)}`,
      ),
    get: (id: Id) =>
      apiRequest<Record<string, unknown>>(
        `${BASE}/technical-audit-logs/${id}`,
      ),
  },
};

/** Alias mount at /api/v1/system */
export const systemApi = systemManagementApi;
