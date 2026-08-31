import { apiRequest, buildQuery } from "./client";
import type { ApiListResponse, Id } from "./types";

export const securityApi = {
  get: () => apiRequest<Record<string, unknown>>("/security"),

  dashboard: () => apiRequest<Record<string, unknown>>("/security/dashboard"),

  passwordPolicy: (body: Record<string, unknown>) =>
    apiRequest<Record<string, unknown>>("/security/password-policy", {
      method: "PATCH",
      body,
    }),

  mfa: (body: Record<string, unknown>) =>
    apiRequest<Record<string, unknown>>("/security/mfa", {
      method: "PATCH",
      body,
    }),

  loginPolicy: (body: Record<string, unknown>) =>
    apiRequest<Record<string, unknown>>("/security/login-policy", {
      method: "PATCH",
      body,
    }),

  sessionPolicy: (body: Record<string, unknown>) =>
    apiRequest<Record<string, unknown>>("/security/session-policy", {
      method: "PATCH",
      body,
    }),

  maintenance: (body: Record<string, unknown>) =>
    apiRequest<Record<string, unknown>>("/security/maintenance", {
      method: "PATCH",
      body,
    }),

  sessions: (params?: Record<string, unknown>) =>
    apiRequest<ApiListResponse<Record<string, unknown>>>(
      `/security/sessions${buildQuery(params)}`,
    ),

  revokeSession: (sessionId: Id) =>
    apiRequest<void>(`/security/sessions/${sessionId}`, { method: "DELETE" }),

  unlockUser: (userId: Id) =>
    apiRequest<void>(`/security/users/${userId}/unlock`, { method: "POST" }),

  revokeUserSessions: (userId: Id) =>
    apiRequest<void>(`/security/users/${userId}/revoke-sessions`, {
      method: "POST",
    }),

  loginAttempts: (params?: Record<string, unknown>) =>
    apiRequest<ApiListResponse<Record<string, unknown>>>(
      `/security/login-attempts${buildQuery(params)}`,
    ),

  events: (params?: Record<string, unknown>) =>
    apiRequest<ApiListResponse<Record<string, unknown>>>(
      `/security/events${buildQuery(params)}`,
    ),

  trustedDevices: (params?: Record<string, unknown>) =>
    apiRequest<ApiListResponse<Record<string, unknown>>>(
      `/security/trusted-devices${buildQuery(params)}`,
    ),

  deleteTrustedDevice: (id: Id) =>
    apiRequest<void>(`/security/trusted-devices/${id}`, { method: "DELETE" }),

  setUserMfa: (userId: Id, body: Record<string, unknown>) =>
    apiRequest<void>(`/security/users/${userId}/mfa`, {
      method: "POST",
      body,
    }),

  admin: {
    get: () =>
      apiRequest<Record<string, unknown>>("/api/admin/security", {
        root: true,
      }),
    dashboard: () =>
      apiRequest<Record<string, unknown>>("/api/admin/security/dashboard", {
        root: true,
      }),
    passwordPolicy: (body: Record<string, unknown>) =>
      apiRequest<Record<string, unknown>>(
        "/api/admin/security/password-policy",
        { method: "PATCH", body, root: true },
      ),
    mfa: (body: Record<string, unknown>) =>
      apiRequest<Record<string, unknown>>("/api/admin/security/mfa", {
        method: "PATCH",
        body,
        root: true,
      }),
    loginPolicy: (body: Record<string, unknown>) =>
      apiRequest<Record<string, unknown>>(
        "/api/admin/security/login-policy",
        { method: "PATCH", body, root: true },
      ),
    sessionPolicy: (body: Record<string, unknown>) =>
      apiRequest<Record<string, unknown>>(
        "/api/admin/security/session-policy",
        { method: "PATCH", body, root: true },
      ),
    maintenance: (body: Record<string, unknown>) =>
      apiRequest<Record<string, unknown>>(
        "/api/admin/security/maintenance",
        { method: "PATCH", body, root: true },
      ),
    sessions: (params?: Record<string, unknown>) =>
      apiRequest<ApiListResponse<Record<string, unknown>>>(
        `/api/admin/security/sessions${buildQuery(params)}`,
        { root: true },
      ),
    revokeSession: (sessionId: Id) =>
      apiRequest<void>(`/api/admin/security/sessions/${sessionId}`, {
        method: "DELETE",
        root: true,
      }),
    unlockUser: (userId: Id) =>
      apiRequest<void>(`/api/admin/security/users/${userId}/unlock`, {
        method: "POST",
        root: true,
      }),
    revokeUserSessions: (userId: Id) =>
      apiRequest<void>(
        `/api/admin/security/users/${userId}/revoke-sessions`,
        { method: "POST", root: true },
      ),
    loginAttempts: (params?: Record<string, unknown>) =>
      apiRequest<ApiListResponse<Record<string, unknown>>>(
        `/api/admin/security/login-attempts${buildQuery(params)}`,
        { root: true },
      ),
    events: (params?: Record<string, unknown>) =>
      apiRequest<ApiListResponse<Record<string, unknown>>>(
        `/api/admin/security/events${buildQuery(params)}`,
        { root: true },
      ),
    trustedDevices: (params?: Record<string, unknown>) =>
      apiRequest<ApiListResponse<Record<string, unknown>>>(
        `/api/admin/security/trusted-devices${buildQuery(params)}`,
        { root: true },
      ),
    deleteTrustedDevice: (id: Id) =>
      apiRequest<void>(`/api/admin/security/trusted-devices/${id}`, {
        method: "DELETE",
        root: true,
      }),
    setUserMfa: (userId: Id, body: Record<string, unknown>) =>
      apiRequest<void>(`/api/admin/security/users/${userId}/mfa`, {
        method: "POST",
        body,
        root: true,
      }),
  },
};
