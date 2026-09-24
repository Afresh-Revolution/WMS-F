import { ApiError, apiRequest, buildQuery } from "./client";
import { unwrapList, type Id } from "./types";

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

function isMissingAttendanceRoute(error: unknown) {
  if (!(error instanceof ApiError)) return false;
  return error.status === 404 || error.status === 405 || error.status === 403;
}

function attendanceKey(row: Record<string, unknown>) {
  return String(row.id ?? row._id ?? `${row.employeeId ?? ""}-${row.date ?? row.createdAt ?? ""}`)
    .trim()
    .toLowerCase();
}

async function mergeAttendanceLists(loaders: Array<() => Promise<unknown>>) {
  const merged: Record<string, unknown>[] = [];
  const seen = new Set<string>();
  const settled = await Promise.allSettled(loaders.map((load) => load()));
  for (const result of settled) {
    if (result.status !== "fulfilled") continue;
    for (const row of unwrapList<Record<string, unknown>>(result.value)) {
      const key = attendanceKey(row);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      merged.push(row);
    }
  }
  return merged;
}

export function listOrgAttendance(params?: Record<string, unknown>) {
  const query = buildQuery(params);
  return mergeAttendanceLists([
    () => apiRequest<unknown>(`${BASE}/records${query}`),
    () => apiRequest<unknown>(`${BASE}${query}`),
    () => apiRequest<unknown>(`/manager/attendance${query}`),
    () => apiRequest<unknown>(`/hr/attendance${query}`),
    () => apiRequest<unknown>(`/super-admin/attendance${query}`),
  ]);
}

async function firstAttendanceRoute<T>(attempts: Array<() => Promise<T>>): Promise<T> {
  let lastError: unknown;
  for (const attempt of attempts) {
    try {
      return await attempt();
    } catch (error) {
      lastError = error;
      if (isMissingAttendanceRoute(error)) continue;
      throw error;
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new ApiError(404, "Attendance route was not found.");
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

function postCheckIn(
  path: string,
  body: GpsCheckInBody,
  idempotencyKey?: string,
) {
  return apiRequest<unknown>(path, {
    method: "POST",
    body,
    headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : undefined,
  });
}

export const attendanceApi = {
  me: {
    locations: () => apiRequest<unknown>(`${BASE}/me/locations`),
    status: () => apiRequest<unknown>(`${BASE}/me/status`),
    history: (params?: Record<string, unknown>) =>
      apiRequest<unknown>(`${BASE}/me/history${buildQuery(params)}`),
  },

  checkIn: (body: GpsCheckInBody, idempotencyKey?: string) =>
    postCheckIn(`${BASE}/check-in`, body, idempotencyKey),

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
    list: (params?: Record<string, unknown>) => listOrgAttendance(params),
    get: (id: Id) => apiRequest<unknown>(`${BASE}/records/${id}`),
  },

  reports: {
    summary: (params?: Record<string, unknown>) =>
      apiRequest<unknown>(`${BASE}/reports/summary${buildQuery(params)}`),
  },

  manager: {
    list: (params?: Record<string, unknown>) => listOrgAttendance(params),
    get: (id: Id) => apiRequest<unknown>(`/manager/attendance/${id}`),
    correct: (id: Id, body: Record<string, unknown>) =>
      apiRequest<unknown>(`/manager/attendance/${id}/correct`, {
        method: "PATCH",
        body,
      }),
    locations: () =>
      firstAttendanceRoute([
        () => apiRequest<unknown>(`/manager/attendance/locations`),
        () => apiRequest<unknown>(`/hod/attendance/locations`),
      ]),
    status: () =>
      firstAttendanceRoute([
        () => apiRequest<unknown>(`/manager/attendance/status`),
        () => apiRequest<unknown>(`/manager/attendance/me/status`),
        () => apiRequest<unknown>(`/hod/attendance/status`),
        () => apiRequest<unknown>(`/hod/attendance/me/status`),
      ]),
    history: (params?: Record<string, unknown>) =>
      firstAttendanceRoute([
        () =>
          apiRequest<unknown>(
            `/manager/attendance/history${buildQuery(params)}`,
          ),
        () =>
          apiRequest<unknown>(
            `/manager/attendance/me/history${buildQuery(params)}`,
          ),
        () =>
          apiRequest<unknown>(`/hod/attendance/history${buildQuery(params)}`),
      ]),
    checkIn: (body: GpsCheckInBody, idempotencyKey?: string) =>
      firstAttendanceRoute([
        () => postCheckIn(`/manager/attendance/check-in`, body, idempotencyKey),
        () => postCheckIn(`/manager/attendance/clock-in`, body, idempotencyKey),
        () => postCheckIn(`/hod/attendance/check-in`, body, idempotencyKey),
        () => postCheckIn(`/hod/attendance/clock-in`, body, idempotencyKey),
        () => postCheckIn(`/employee/attendance/clock-in`, body, idempotencyKey),
        () => postCheckIn(`/attendance/clock-in`, body, idempotencyKey),
      ]),
  },
};
