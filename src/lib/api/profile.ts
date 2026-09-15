import { apiRequest, buildQuery } from "./client";
import type { ApiListResponse, Id } from "./types";

export type ProfileRecord = Record<string, unknown>;

export const profileApi = {
  get: () => apiRequest<ProfileRecord>("/profile"),

  update: (body: Record<string, unknown>) =>
    apiRequest<ProfileRecord>("/profile", { method: "PUT", body }),

  patch: (body: Record<string, unknown>) =>
    apiRequest<ProfileRecord>("/profile", { method: "PATCH", body }),

  changePassword: (body: {
    currentPassword: string;
    newPassword: string;
  }) => apiRequest<void>("/profile/password", { method: "PUT", body }),

  uploadAvatar: (file: File) => {
    const form = new FormData();
    form.append("avatar", file);
    return apiRequest<ProfileRecord>("/profile/avatar", {
      method: "POST",
      body: form,
    });
  },

  sessions: () =>
    apiRequest<Record<string, unknown>[]>("/profile/sessions"),

  revokeSession: (id: Id) =>
    apiRequest<void>(`/profile/sessions/${id}`, { method: "DELETE" }),

  revokeAllSessions: () =>
    apiRequest<void>("/profile/sessions", { method: "DELETE" }),

  loginHistory: (params?: Record<string, unknown>) =>
    apiRequest<ApiListResponse<Record<string, unknown>>>(
      `/profile/login-history${buildQuery(params)}`,
    ),

  enableMfa: () =>
    apiRequest<Record<string, unknown>>("/profile/mfa/enable", {
      method: "POST",
    }),

  disableMfa: (body?: Record<string, unknown>) =>
    apiRequest<void>("/profile/mfa/disable", { method: "POST", body }),

  verifyMfa: (body: Record<string, unknown>) =>
    apiRequest<void>("/profile/mfa/verify", { method: "POST", body }),

  backupCodes: () =>
    apiRequest<Record<string, unknown>>("/profile/mfa/backup-codes", {
      method: "POST",
    }),
};
