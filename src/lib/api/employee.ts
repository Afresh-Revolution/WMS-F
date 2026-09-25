import { ApiError, apiRequest, buildQuery } from "./client";
import type { GpsCheckInBody } from "./attendance";
import { unwrapList, unwrapData, type ApiListResponse, type Id } from "./types";

const BASE = "/employee";

function path(suffix: string, query?: Record<string, unknown>) {
  return `${BASE}${suffix}${buildQuery(query)}`;
}

async function firstWorking<T>(
  attempts: Array<() => Promise<T>>,
  fallbackMessage: string,
) {
  let lastError: unknown;
  for (const attempt of attempts) {
    try {
      return await attempt();
    } catch (error) {
      lastError = error;
      if (
        error instanceof ApiError &&
        (error.status === 404 || error.status === 405 || error.status === 403)
      ) {
        continue;
      }
      throw error;
    }
  }
  if (lastError instanceof Error) throw lastError;
  throw new ApiError(404, fallbackMessage);
}

export const employeeApi = {
  scope: () => apiRequest<unknown>(path("/scope")).then(unwrapData),

  dashboard: (query?: Record<string, unknown>) =>
    apiRequest<unknown>(path("/dashboard", query)).then(unwrapData),

  home: (query?: Record<string, unknown>) =>
    apiRequest<unknown>(path("/home", query)).then(unwrapData),

  profile: {
    get: () => apiRequest<unknown>(path("/profile")).then(unwrapData),
    patch: (body: Record<string, unknown>) =>
      apiRequest<unknown>(path("/profile"), { method: "PATCH", body }).then(
        unwrapData,
      ),
  },

  employmentRecord: {
    get: () => apiRequest<unknown>(path("/employment-record")).then(unwrapData),
    patch: (body: Record<string, unknown>) =>
      apiRequest<unknown>(path("/employment-record"), {
        method: "PATCH",
        body,
      }).then(unwrapData),
  },

  settings: {
    get: () => apiRequest<unknown>(path("/settings")).then(unwrapData),
    patch: (body: Record<string, unknown>) =>
      apiRequest<unknown>(path("/settings"), { method: "PATCH", body }).then(
        unwrapData,
      ),
  },

  leave: {
    list: (query?: Record<string, unknown>) =>
      apiRequest<ApiListResponse<Record<string, unknown>>>(
        path("/leave", query),
      ).then(unwrapList),
    types: () =>
      apiRequest<ApiListResponse<Record<string, unknown>>>(
        path("/leave/types"),
      ).then(unwrapList),
    balances: () =>
      apiRequest<ApiListResponse<Record<string, unknown>>>(
        path("/leave/balances"),
      ).then(unwrapList),
    requests: (query?: Record<string, unknown>) =>
      apiRequest<ApiListResponse<Record<string, unknown>>>(
        path("/leave/requests", query),
      ).then(unwrapList),
    create: (body: Record<string, unknown>) =>
      apiRequest<unknown>(path("/leave"), { method: "POST", body }).then(
        unwrapData,
      ),
    get: (id: Id) => apiRequest<unknown>(path(`/leave/${id}`)).then(unwrapData),
    extend: (id: Id, body: Record<string, unknown>) =>
      apiRequest<unknown>(path(`/leave/${id}/extend`), {
        method: "POST",
        body,
      }).then(unwrapData),
  },

  tasks: {
    list: (query?: Record<string, unknown>) =>
      apiRequest<ApiListResponse<Record<string, unknown>>>(
        path("/tasks", query),
      ).then(unwrapList),
    assigned: (query?: Record<string, unknown>) =>
      apiRequest<ApiListResponse<Record<string, unknown>>>(
        path("/assigned-to-me", query),
      ).then(unwrapList),
    get: (id: Id) => apiRequest<unknown>(path(`/tasks/${id}`)).then(unwrapData),
    update: (id: Id, body: Record<string, unknown>) =>
      apiRequest<unknown>(path(`/tasks/${id}`), { method: "PATCH", body }).then(
        unwrapData,
      ),
    updateProgress: (id: Id, body: Record<string, unknown>) =>
      apiRequest<unknown>(path(`/tasks/${id}/progress`), {
        method: "PATCH",
        body,
      }).then(unwrapData),
  },

  targets: {
    list: (query?: Record<string, unknown>) =>
      apiRequest<ApiListResponse<Record<string, unknown>>>(
        path("/targets", query),
      ).then(unwrapList),
    get: (id: Id) =>
      apiRequest<unknown>(path(`/targets/${id}`)).then(unwrapData),
    updateProgress: (id: Id, body: Record<string, unknown>) =>
      apiRequest<unknown>(path(`/targets/${id}/progress`), {
        method: "PATCH",
        body,
      }).then(unwrapData),
  },

  meetings: {
    list: (query?: Record<string, unknown>) =>
      apiRequest<ApiListResponse<Record<string, unknown>>>(
        path("/meetings", query),
      ).then(unwrapList),
    schedule: (query?: Record<string, unknown>) =>
      apiRequest<ApiListResponse<Record<string, unknown>>>(
        path("/schedule", query),
      ).then(unwrapList),
    get: (id: Id) =>
      apiRequest<unknown>(path(`/meetings/${id}`)).then(unwrapData),
  },

  attendance: {
    locations: () =>
      apiRequest<unknown>(path("/attendance/locations")).then(unwrapData),
    status: () =>
      apiRequest<unknown>(path("/attendance/status")).then(unwrapData),
    history: (query?: Record<string, unknown>) =>
      apiRequest<ApiListResponse<Record<string, unknown>>>(
        path("/attendance/history", query),
      ).then(unwrapList),
    checkIn: (body: GpsCheckInBody, idempotencyKey?: string) =>
      apiRequest<unknown>(path("/attendance/check-in"), {
        method: "POST",
        body,
        headers: idempotencyKey
          ? { "Idempotency-Key": idempotencyKey }
          : undefined,
      }).then(unwrapData),
    clockIn: (body: Record<string, unknown> = {}) =>
      firstWorking(
        [
          () =>
            apiRequest<unknown>(path("/attendance/clock-in"), {
              method: "POST",
              body,
            }).then(unwrapData),
          () =>
            apiRequest<unknown>("/attendance/clock-in", {
              method: "POST",
              body,
            }).then(unwrapData),
          () =>
            apiRequest<unknown>(path("/attendance/check-in"), {
              method: "POST",
              body,
            }).then(unwrapData),
        ],
        "Clock-in API was not found.",
      ),
    clockOut: (body: Record<string, unknown> = {}) =>
      firstWorking(
        [
          () =>
            apiRequest<unknown>(path("/attendance/clock-out"), {
              method: "POST",
              body,
            }).then(unwrapData),
          () =>
            apiRequest<unknown>("/attendance/clock-out", {
              method: "POST",
              body,
            }).then(unwrapData),
          () =>
            apiRequest<unknown>(path("/attendance/check-out"), {
              method: "POST",
              body,
            }).then(unwrapData),
        ],
        "Clock-out API was not found.",
      ),
    requestCorrection: (id: Id, body: Record<string, unknown>) =>
      firstWorking(
        [
          () =>
            apiRequest<unknown>(path(`/attendance/${id}/correct`), {
              method: "POST",
              body,
            }).then(unwrapData),
          () =>
            apiRequest<unknown>(path(`/attendance/history/${id}/correct`), {
              method: "POST",
              body,
            }).then(unwrapData),
          () =>
            apiRequest<unknown>(path("/attendance/corrections"), {
              method: "POST",
              body: { ...body, attendanceId: id, recordId: id },
            }).then(unwrapData),
        ],
        "Correction API was not found.",
      ),
  },

  expenses: {
    list: (query?: Record<string, unknown>) =>
      apiRequest<ApiListResponse<Record<string, unknown>>>(
        path("/expenses", query),
      ).then(unwrapList),
    claims: (query?: Record<string, unknown>) =>
      apiRequest<ApiListResponse<Record<string, unknown>>>(
        path("/expense-claims", query),
      ).then(unwrapList),
    create: (body: Record<string, unknown>) =>
      apiRequest<unknown>(path("/expenses"), { method: "POST", body }).then(
        unwrapData,
      ),
    get: (id: Id) =>
      apiRequest<unknown>(path(`/expenses/${id}`)).then(unwrapData),
    update: (id: Id, body: Record<string, unknown>) =>
      apiRequest<unknown>(path(`/expenses/${id}`), {
        method: "PATCH",
        body,
      }).then(unwrapData),
    submit: (id: Id, body?: Record<string, unknown>) =>
      apiRequest<unknown>(path(`/expenses/${id}/submit`), {
        method: "POST",
        body,
      }).then(unwrapData),
    cancel: (id: Id, body?: Record<string, unknown>) =>
      apiRequest<unknown>(path(`/expenses/${id}/cancel`), {
        method: "POST",
        body,
      }).then(unwrapData),
  },

  reimbursements: {
    list: (query?: Record<string, unknown>) =>
      apiRequest<ApiListResponse<Record<string, unknown>>>(
        path("/reimbursements", query),
      ).then(unwrapList),
    create: (body: Record<string, unknown>) =>
      apiRequest<unknown>(path("/reimbursements"), {
        method: "POST",
        body,
      }).then(unwrapData),
  },

  performance: (query?: Record<string, unknown>) =>
    apiRequest<ApiListResponse<Record<string, unknown>>>(
      path("/performance", query),
    ).then(unwrapList),

  records: () => apiRequest<unknown>(path("/records")).then(unwrapData),

  notifications: {
    list: (query?: Record<string, unknown>) =>
      apiRequest<ApiListResponse<Record<string, unknown>>>(
        path("/notifications", query),
      ).then(unwrapList),
    markRead: (id: Id) =>
      apiRequest<unknown>(path(`/notifications/${id}/read`), {
        method: "PATCH",
      }).then(unwrapData),
  },
};

export type EmployeeApi = typeof employeeApi;
