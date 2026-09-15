import { apiRequest, buildQuery } from "./client";
import type { GpsCheckInBody } from "./attendance";
import type { Id } from "./types";

const BASE = "/intern";
const MGMT = "/nysc-interns";

function downloadBlob(
  content: unknown,
  filename: string,
  mime = "text/csv;charset=utf-8;",
) {
  const text =
    typeof content === "string"
      ? content
      : JSON.stringify(content, null, 2);
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export async function internSettled<T>(promise: Promise<T>): Promise<T | null> {
  try {
    return await promise;
  } catch {
    return null;
  }
}

export const internApi = {
  scope: () => apiRequest<unknown>(`${BASE}/scope`),

  dashboard: (params?: Record<string, unknown>) =>
    apiRequest<unknown>(`${BASE}/dashboard${buildQuery(params)}`),

  placementRecord: {
    get: () => apiRequest<unknown>(`${BASE}/placement-record`),
    patch: (body: Record<string, unknown>) =>
      apiRequest<unknown>(`${BASE}/placement-record`, {
        method: "PATCH",
        body,
      }),
  },

  settings: {
    get: () => apiRequest<unknown>(`${BASE}/settings`),
    patch: (body: Record<string, unknown>) =>
      apiRequest<unknown>(`${BASE}/settings`, { method: "PATCH", body }),
  },

  tasks: {
    list: (params?: Record<string, unknown>) =>
      apiRequest<unknown>(`${BASE}/tasks${buildQuery(params)}`),
    get: (id: Id) => apiRequest<unknown>(`${BASE}/tasks/${id}`),
    updateProgress: (id: Id, body: Record<string, unknown>) =>
      apiRequest<unknown>(`${BASE}/tasks/${id}/progress`, {
        method: "PATCH",
        body,
      }),
  },

  targets: {
    list: (params?: Record<string, unknown>) =>
      apiRequest<unknown>(`${BASE}/targets${buildQuery(params)}`),
    get: (id: Id) => apiRequest<unknown>(`${BASE}/targets/${id}`),
    updateProgress: (id: Id, body: Record<string, unknown>) =>
      apiRequest<unknown>(`${BASE}/targets/${id}/progress`, {
        method: "PATCH",
        body,
      }),
  },

  progress: () => apiRequest<unknown>(`${BASE}/progress`),

  schedule: (params?: Record<string, unknown>) =>
    apiRequest<unknown>(`${BASE}/schedule${buildQuery(params)}`),

  meetings: {
    list: (params?: Record<string, unknown>) =>
      apiRequest<unknown>(`${BASE}/meetings${buildQuery(params)}`),
    get: (id: Id) => apiRequest<unknown>(`${BASE}/meetings/${id}`),
  },

  attendance: {
    locations: () => apiRequest<unknown>(`${BASE}/attendance/locations`),
    status: () => apiRequest<unknown>(`${BASE}/attendance/status`),
    checkIn: (body: GpsCheckInBody, idempotencyKey?: string) =>
      apiRequest<unknown>(`${BASE}/attendance/check-in`, {
        method: "POST",
        body,
        headers: idempotencyKey
          ? { "Idempotency-Key": idempotencyKey }
          : undefined,
      }),
    history: (params?: Record<string, unknown>) =>
      apiRequest<unknown>(`${BASE}/attendance/history${buildQuery(params)}`),
    list: (params?: Record<string, unknown>) =>
      apiRequest<unknown>(`${BASE}/attendance${buildQuery(params)}`),
    record: (body: Record<string, unknown>) =>
      apiRequest<unknown>(`${BASE}/attendance`, { method: "POST", body }),
  },

  documents: () => apiRequest<unknown>(`${BASE}/documents`),

  reviews: () => apiRequest<unknown>(`${BASE}/reviews`),

  news: {
    all: (params?: Record<string, unknown>) =>
      apiRequest<unknown>(`${BASE}/news${buildQuery(params)}`),
    company: (params?: Record<string, unknown>) =>
      apiRequest<unknown>(`${BASE}/company-news${buildQuery(params)}`),
    department: (params?: Record<string, unknown>) =>
      apiRequest<unknown>(`${BASE}/department-news${buildQuery(params)}`),
  },

  notifications: {
    list: (params?: Record<string, unknown>) =>
      apiRequest<unknown>(`${BASE}/notifications${buildQuery(params)}`),
    markRead: (id: Id) =>
      apiRequest<unknown>(`${BASE}/notifications/${id}/read`, {
        method: "PATCH",
      }),
  },
};

/** Extra management routes on `/nysc-interns` (list/create/get stay on nyscInternsApi). */
export const nyscInternsManageApi = {
  dashboard: () => apiRequest<unknown>(`${MGMT}/dashboard`),
  reportsSummary: () =>
    apiRequest<unknown>(`${MGMT}/reports/summary`),
  export: async (params?: Record<string, unknown>) => {
    const payload = await apiRequest<unknown>(
      `${MGMT}/export${buildQuery(params)}`,
    );
    downloadBlob(payload, "nysc-interns.csv");
    return payload;
  },
  downloadDocument: (id: Id) =>
    apiRequest<unknown>(`${MGMT}/documents/${id}/download`),
  patchAttendance: (id: Id, body: Record<string, unknown>) =>
    apiRequest<unknown>(`${MGMT}/attendance/${id}`, {
      method: "PATCH",
      body,
    }),
};
