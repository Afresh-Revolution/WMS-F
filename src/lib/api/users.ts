import { apiRequest, buildQuery } from "./client";
import type { ApiListResponse, Id } from "./types";

export const usersApi = {
  statistics: () => apiRequest<Record<string, unknown>>("/users/statistics"),

  list: (params?: Record<string, unknown>) =>
    apiRequest<ApiListResponse<Record<string, unknown>>>(
      `/users${buildQuery(params)}`,
    ),

  create: (body: Record<string, unknown>) =>
    apiRequest<Record<string, unknown>>("/users", { method: "POST", body }),

  get: (id: Id) => apiRequest<Record<string, unknown>>(`/users/${id}`),

  patch: (id: Id, body: Record<string, unknown>) =>
    apiRequest<Record<string, unknown>>(`/users/${id}`, {
      method: "PATCH",
      body,
    }),

  update: (id: Id, body: Record<string, unknown>) =>
    apiRequest<Record<string, unknown>>(`/users/${id}`, {
      method: "PUT",
      body,
    }),

  delete: (id: Id) =>
    apiRequest<void>(`/users/${id}`, { method: "DELETE" }),

  lock: (id: Id) =>
    apiRequest<void>(`/users/${id}/lock`, { method: "POST" }),

  unlock: (id: Id) =>
    apiRequest<void>(`/users/${id}/unlock`, { method: "POST" }),

  deactivate: (id: Id) =>
    apiRequest<void>(`/users/${id}/deactivate`, { method: "POST" }),

  reactivate: (id: Id) =>
    apiRequest<void>(`/users/${id}/reactivate`, { method: "POST" }),

  suspend: (id: Id) =>
    apiRequest<void>(`/users/${id}/suspend`, { method: "POST" }),

  resetPassword: (id: Id, body?: Record<string, unknown>) =>
    apiRequest<void>(`/users/${id}/reset-password`, {
      method: "POST",
      body,
    }),

  forcePasswordChange: (id: Id) =>
    apiRequest<void>(`/users/${id}/force-password-change`, {
      method: "POST",
    }),

  revokeSessions: (id: Id) =>
    apiRequest<void>(`/users/${id}/revoke-sessions`, { method: "POST" }),

  sessions: (id: Id, params?: Record<string, unknown>) =>
    apiRequest<ApiListResponse<Record<string, unknown>>>(
      `/users/${id}/sessions${buildQuery(params)}`,
    ),

  revokeSession: (id: Id, sessionId: Id) =>
    apiRequest<void>(`/users/${id}/sessions/${sessionId}`, {
      method: "DELETE",
    }),

  loginHistory: (id: Id, params?: Record<string, unknown>) =>
    apiRequest<ApiListResponse<Record<string, unknown>>>(
      `/users/${id}/login-history${buildQuery(params)}`,
    ),

  activity: (id: Id, params?: Record<string, unknown>) =>
    apiRequest<ApiListResponse<Record<string, unknown>>>(
      `/users/${id}/activity${buildQuery(params)}`,
    ),
};

export const rolesApi = {
  list: (params?: Record<string, unknown>) =>
    apiRequest<ApiListResponse<Record<string, unknown>>>(
      `/roles${buildQuery(params)}`,
    ),

  catalog: () => apiRequest<Record<string, unknown>>("/roles/catalog"),

  create: (body: Record<string, unknown>) =>
    apiRequest<Record<string, unknown>>("/roles", { method: "POST", body }),

  get: (id: Id) => apiRequest<Record<string, unknown>>(`/roles/${id}`),

  patch: (id: Id, body: Record<string, unknown>) =>
    apiRequest<Record<string, unknown>>(`/roles/${id}`, {
      method: "PATCH",
      body,
    }),

  delete: (id: Id) =>
    apiRequest<void>(`/roles/${id}`, { method: "DELETE" }),

  permissions: {
    get: (id: Id) =>
      apiRequest<Record<string, unknown>>(`/roles/${id}/permissions`),
    update: (id: Id, body: Record<string, unknown>) =>
      apiRequest<void>(`/roles/${id}/permissions`, {
        method: "PUT",
        body,
      }),
  },
};

export const permissionsApi = {
  list: (params?: Record<string, unknown>) =>
    apiRequest<ApiListResponse<Record<string, unknown>>>(
      `/permissions${buildQuery(params)}`,
    ),

  catalog: () => apiRequest<Record<string, unknown>>("/permissions/catalog"),
};
