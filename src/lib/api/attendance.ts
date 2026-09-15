import { apiRequest, buildQuery } from "./client";
import type { Id } from "./types";

const BASE = "/attendance";

export async function attendanceSettled<T>(
  promise: Promise<T>,
): Promise<T | null> {
  try {
    return await promise;
  } catch {
    return null;
  }
}

export type GpsCheckInBody = {
  latitude: number;
  longitude: number;
  accuracyMeters: number;
  locationTimestamp: string;
  clientTimezone?: string;
  scheduleId?: string;
  locationId?: string;
  idempotencyKey?: string;
  device?: {
    browser?: string;
    platform?: string;
  };
};

export const attendanceApi = {
  me: {
    locations: () => apiRequest<unknown>(`${BASE}/me/locations`),
    status: () => apiRequest<unknown>(`${BASE}/me/status`),
    history: (params?: Record<string, unknown>) =>
      apiRequest<unknown>(`${BASE}/me/history${buildQuery(params)}`),
  },

  checkIn: (body: GpsCheckInBody, idempotencyKey?: string) =>
    apiRequest<unknown>(`${BASE}/check-in`, {
      method: "POST",
      body,
      headers: idempotencyKey
        ? { "Idempotency-Key": idempotencyKey }
        : undefined,
    }),

  locations: {
    list: (params?: Record<string, unknown>) =>
      apiRequest<unknown>(`${BASE}/locations${buildQuery(params)}`),
    create: (body: Record<string, unknown>) =>
      apiRequest<unknown>(`${BASE}/locations`, { method: "POST", body }),
    get: (id: Id) => apiRequest<unknown>(`${BASE}/locations/${id}`),
    patch: (id: Id, body: Record<string, unknown>) =>
      apiRequest<unknown>(`${BASE}/locations/${id}`, {
        method: "PATCH",
        body,
      }),
    enable: (id: Id) =>
      apiRequest<unknown>(`${BASE}/locations/${id}/enable`, {
        method: "POST",
      }),
    disable: (id: Id) =>
      apiRequest<unknown>(`${BASE}/locations/${id}/disable`, {
        method: "POST",
      }),
  },

  schedules: {
    list: (params?: Record<string, unknown>) =>
      apiRequest<unknown>(`${BASE}/schedules${buildQuery(params)}`),
    create: (body: Record<string, unknown>) =>
      apiRequest<unknown>(`${BASE}/schedules`, { method: "POST", body }),
    get: (id: Id) => apiRequest<unknown>(`${BASE}/schedules/${id}`),
    patch: (id: Id, body: Record<string, unknown>) =>
      apiRequest<unknown>(`${BASE}/schedules/${id}`, {
        method: "PATCH",
        body,
      }),
    enable: (id: Id) =>
      apiRequest<unknown>(`${BASE}/schedules/${id}/enable`, {
        method: "POST",
      }),
    disable: (id: Id) =>
      apiRequest<unknown>(`${BASE}/schedules/${id}/disable`, {
        method: "POST",
      }),
  },

  records: {
    list: (params?: Record<string, unknown>) =>
      apiRequest<unknown>(`${BASE}/records${buildQuery(params)}`),
    get: (id: Id) => apiRequest<unknown>(`${BASE}/records/${id}`),
  },

  reports: {
    summary: (params?: Record<string, unknown>) =>
      apiRequest<unknown>(`${BASE}/reports/summary${buildQuery(params)}`),
  },

  manager: {
    list: (params?: Record<string, unknown>) =>
      apiRequest<unknown>(`/manager/attendance${buildQuery(params)}`),
    get: (id: Id) => apiRequest<unknown>(`/manager/attendance/${id}`),
    correct: (id: Id, body: Record<string, unknown>) =>
      apiRequest<unknown>(`/manager/attendance/${id}/correct`, {
        method: "PATCH",
        body,
      }),
  },
};
