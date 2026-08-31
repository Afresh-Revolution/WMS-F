import { apiRequest, buildQuery } from "./client";
import type { ApiListResponse, Id } from "./types";

export const emailConfigApi = {
  get: () => apiRequest<Record<string, unknown>>("/email-config"),

  update: (body: Record<string, unknown>) =>
    apiRequest<Record<string, unknown>>("/email-config", {
      method: "PUT",
      body,
    }),

  patch: (body: Record<string, unknown>) =>
    apiRequest<Record<string, unknown>>("/email-config", {
      method: "PATCH",
      body,
    }),

  test: (body?: Record<string, unknown>) =>
    apiRequest<Record<string, unknown>>("/email-config/test", {
      method: "POST",
      body,
    }),

  check: (body?: Record<string, unknown>) =>
    apiRequest<Record<string, unknown>>("/email-config/check", {
      method: "POST",
      body,
    }),

  updateStatus: (body: Record<string, unknown>) =>
    apiRequest<Record<string, unknown>>("/email-config/status", {
      method: "PATCH",
      body,
    }),

  templates: {
    list: () =>
      apiRequest<ApiListResponse<Record<string, unknown>>>(
        "/email-config/templates",
      ),
    create: (body: Record<string, unknown>) =>
      apiRequest<Record<string, unknown>>("/email-config/templates", {
        method: "POST",
        body,
      }),
    update: (id: Id, body: Record<string, unknown>) =>
      apiRequest<Record<string, unknown>>(`/email-config/templates/${id}`, {
        method: "PUT",
        body,
      }),
  },

  logs: (params?: Record<string, unknown>) =>
    apiRequest<ApiListResponse<Record<string, unknown>>>(
      `/email-config/logs${buildQuery(params)}`,
    ),

  queue: (params?: Record<string, unknown>) =>
    apiRequest<Record<string, unknown>>(
      `/email-config/queue${buildQuery(params)}`,
    ),

  processQueue: () =>
    apiRequest<Record<string, unknown>>("/email-config/queue/process", {
      method: "POST",
    }),
};

export const notificationConfigApi = {
  get: () => apiRequest<Record<string, unknown>>("/notification-config"),

  patchChannels: (body: Record<string, unknown>) =>
    apiRequest<Record<string, unknown>>("/notification-config/channels", {
      method: "PATCH",
      body,
    }),

  patchDeliveryPreferences: (body: Record<string, unknown>) =>
    apiRequest<Record<string, unknown>>(
      "/notification-config/delivery-preferences",
      { method: "PATCH", body },
    ),

  rules: {
    list: () =>
      apiRequest<ApiListResponse<Record<string, unknown>>>(
        "/notification-config/rules",
      ),
    update: (type: string, body: Record<string, unknown>) =>
      apiRequest<Record<string, unknown>>(
        `/notification-config/rules/${type}`,
        { method: "PUT", body },
      ),
  },

  logs: (params?: Record<string, unknown>) =>
    apiRequest<ApiListResponse<Record<string, unknown>>>(
      `/notification-config/logs${buildQuery(params)}`,
    ),

  queue: (params?: Record<string, unknown>) =>
    apiRequest<Record<string, unknown>>(
      `/notification-config/queue${buildQuery(params)}`,
    ),

  processQueue: () =>
    apiRequest<Record<string, unknown>>(
      "/notification-config/queue/process",
      { method: "POST" },
    ),
};

export const notificationsApi = {
  list: (params?: Record<string, unknown>) =>
    apiRequest<ApiListResponse<Record<string, unknown>>>(
      `/notifications${buildQuery(params)}`,
    ),

  preferences: {
    get: () =>
      apiRequest<Record<string, unknown>>("/notifications/preferences"),
    update: (body: Record<string, unknown>) =>
      apiRequest<Record<string, unknown>>("/notifications/preferences", {
        method: "PATCH",
        body,
      }),
  },

  markAllRead: () =>
    apiRequest<void>("/notifications/read-all", { method: "PATCH" }),

  markRead: (id: Id) =>
    apiRequest<void>(`/notifications/${id}/read`, { method: "PATCH" }),

  delete: (id: Id) =>
    apiRequest<void>(`/notifications/${id}`, { method: "DELETE" }),
};
