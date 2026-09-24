import { ApiError, apiRequest, buildQuery } from "./client";
import type { GpsCheckInBody } from "./attendance";
import type { Id } from "./types";

/** Documented self-service bases. New work uses `/intern`; the rest are aliases. */
const INTERN_BASES = ["/intern", "/nysc", "/nysc-intern"] as const;

type InternRequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  auth?: boolean;
  headers?: HeadersInit;
};

function isMissingRoute(error: unknown) {
  return error instanceof ApiError && error.status === 404;
}

function isMissingOrMethod(error: unknown) {
  return (
    error instanceof ApiError &&
    (error.status === 404 || error.status === 405)
  );
}

async function internTry<T>(
  suffixes: string[],
  options?: InternRequestOptions,
): Promise<T> {
  let lastError: unknown;
  for (const suffix of suffixes) {
    const path = suffix.startsWith("/") ? suffix : `/${suffix}`;
    for (const base of INTERN_BASES) {
      try {
        return await apiRequest<T>(`${base}${path}`, options);
      } catch (error) {
        lastError = error;
        if (isMissingRoute(error)) continue;
        throw error;
      }
    }
  }
  if (lastError instanceof Error) throw lastError;
  throw new ApiError(404, "Intern API was not found.");
}

function internGet<T>(suffixes: string[], params?: Record<string, unknown>) {
  const query = buildQuery(params);
  return internTry<T>(suffixes.map((suffix) => `${suffix}${query}`));
}

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

const placementRecord = {
  get: () => internGet<unknown>(["/placement-record", "/profile"]),
  patch: (body: Record<string, unknown>) =>
    internTry<unknown>(["/placement-record", "/profile"], {
      method: "PATCH",
      body,
    }),
};

export const internApi = {
  scope: () => internGet<unknown>(["/scope"]),

  dashboard: (params?: Record<string, unknown>) =>
    internGet<unknown>(["/dashboard", "/home"], params),

  home: (params?: Record<string, unknown>) =>
    internGet<unknown>(["/home", "/dashboard"], params),

  placementRecord,

  profile: placementRecord,

  settings: {
    get: () => internGet<unknown>(["/settings"]),
    patch: (body: Record<string, unknown>) =>
      internTry<unknown>(["/settings"], { method: "PATCH", body }),
  },

  tasks: {
    list: (params?: Record<string, unknown>) =>
      internGet<unknown>(["/tasks", "/assigned-to-me"], params),
    get: (id: Id) => internGet<unknown>([`/tasks/${id}`]),
    updateProgress: (id: Id, body: Record<string, unknown>) =>
      internTry<unknown>([`/tasks/${id}/progress`, `/tasks/${id}`], {
        method: "PATCH",
        body,
      }),
  },

  assignedToMe: (params?: Record<string, unknown>) =>
    internGet<unknown>(["/assigned-to-me", "/tasks"], params),

  targets: {
    list: (params?: Record<string, unknown>) =>
      internGet<unknown>(["/targets"], params),
    get: (id: Id) => internGet<unknown>([`/targets/${id}`]),
    updateProgress: async (id: Id, body: Record<string, unknown>) => {
      try {
        return await internTry<unknown>([`/targets/${id}/progress`], {
          method: "PATCH",
          body,
        });
      } catch (error) {
        if (!isMissingOrMethod(error)) throw error;
        return internTry<unknown>([`/targets/${id}/progress`], {
          method: "POST",
          body,
        });
      }
    },
  },

  progress: () => internGet<unknown>(["/progress"]),

  schedule: (params?: Record<string, unknown>) =>
    internGet<unknown>(["/schedule", "/meetings"], params),

  meetings: {
    list: (params?: Record<string, unknown>) =>
      internGet<unknown>(["/meetings", "/schedule"], params),
    get: (id: Id) => internGet<unknown>([`/meetings/${id}`]),
  },

  attendance: {
    locations: () => internGet<unknown>(["/attendance/locations"]),
    status: () => internGet<unknown>(["/attendance/status"]),
    checkIn: (body: GpsCheckInBody, idempotencyKey?: string) =>
      internTry<unknown>(["/attendance/check-in"], {
        method: "POST",
        body,
        headers: idempotencyKey
          ? { "Idempotency-Key": idempotencyKey }
          : undefined,
      }),
    history: (params?: Record<string, unknown>) =>
      internGet<unknown>(["/attendance/history"], params),
    list: (params?: Record<string, unknown>) =>
      internGet<unknown>(["/attendance"], params),
    record: (body: Record<string, unknown>) =>
      internTry<unknown>(["/attendance"], { method: "POST", body }),
  },

  documents: () => internGet<unknown>(["/documents"]),

  reviews: () => internGet<unknown>(["/reviews"]),

  news: {
    all: (params?: Record<string, unknown>) =>
      internGet<unknown>(["/news"], params),
    company: (params?: Record<string, unknown>) =>
      internGet<unknown>(["/company-news"], params),
    department: (params?: Record<string, unknown>) =>
      internGet<unknown>(["/department-news"], params),
  },

  notifications: {
    list: (params?: Record<string, unknown>) =>
      internGet<unknown>(["/notifications"], params),
    markRead: (id: Id) =>
      internTry<unknown>([`/notifications/${id}/read`], { method: "PATCH" }),
  },
};

export type NyscInternsRequest = <T>(
  path: string,
  options?: InternRequestOptions,
) => Promise<T>;

function nyscInternsPath(path: string) {
  if (!path) return "";
  if (path.startsWith("?") || path.startsWith("/")) return path;
  return `/${path}`;
}

async function requestOnBases<T>(
  bases: string[],
  path: string,
  options?: InternRequestOptions,
): Promise<T> {
  const suffix = nyscInternsPath(path);
  let lastError: unknown;
  for (const [index, base] of bases.entries()) {
    try {
      return await apiRequest<T>(`${base}${suffix}`, options);
    } catch (error) {
      lastError = error;
      if (isMissingRoute(error) && index < bases.length - 1) continue;
      throw error;
    }
  }
  if (lastError instanceof Error) throw lastError;
  throw new ApiError(404, "NYSC intern API was not found.");
}

export function createNyscInternsManageApi(request: NyscInternsRequest) {
  const get = <T>(path: string, params?: Record<string, unknown>) =>
    request<T>(`${path}${buildQuery(params)}`);

  return {
    dashboard: () => get<unknown>("/dashboard"),
    reportsSummary: () => get<unknown>("/reports/summary"),
    export: async (params?: Record<string, unknown>) => {
      const payload = await get<unknown>("/export", params);
      downloadBlob(payload, "nysc-interns.csv");
      return payload;
    },
    list: (params?: Record<string, unknown>) =>
      request<unknown>(buildQuery(params)),
    create: (body: Record<string, unknown>) =>
      request<unknown>("", { method: "POST", body }),
    get: (id: Id) => get<unknown>(`/${id}`),
    patch: (id: Id, body: Record<string, unknown>) =>
      request<unknown>(`/${id}`, { method: "PATCH", body }),
    delete: (id: Id) => request<void>(`/${id}`, { method: "DELETE" }),
    assignSupervisor: (id: Id, employeeId: string) =>
      request<unknown>(`/${id}/supervisor`, {
        method: "POST",
        body: { employeeId },
      }),
    changeDepartment: (id: Id, departmentId: string) =>
      request<unknown>(`/${id}/department`, {
        method: "POST",
        body: { departmentId },
      }),
    extend: (id: Id, body: Record<string, unknown>) =>
      request<unknown>(`/${id}/extend`, { method: "POST", body }),
    complete: (id: Id, body?: Record<string, unknown>) =>
      request<unknown>(`/${id}/complete`, { method: "POST", body }),
    terminate: (id: Id, body?: Record<string, unknown>) =>
      request<unknown>(`/${id}/terminate`, { method: "POST", body }),
    exit: (id: Id, body: Record<string, unknown>) =>
      request<unknown>(`/${id}/exit`, { method: "POST", body }),
    attendance: {
      list: (id: Id, params?: Record<string, unknown>) =>
        get<unknown>(`/${id}/attendance`, params),
      record: (id: Id, body: Record<string, unknown>) =>
        request<unknown>(`/${id}/attendance`, { method: "POST", body }),
      patch: (attendanceId: Id, body: Record<string, unknown>) =>
        request<unknown>(`/attendance/${attendanceId}`, {
          method: "PATCH",
          body,
        }),
    },
    patchAttendance: (id: Id, body: Record<string, unknown>) =>
      request<unknown>(`/attendance/${id}`, { method: "PATCH", body }),
    documents: {
      list: (id: Id, params?: Record<string, unknown>) =>
        get<unknown>(`/${id}/documents`, params),
      add: (id: Id, body: Record<string, unknown>) =>
        request<unknown>(`/${id}/documents`, { method: "POST", body }),
      download: (documentId: Id) =>
        get<unknown>(`/documents/${documentId}/download`),
    },
    downloadDocument: (id: Id) => get<unknown>(`/documents/${id}/download`),
    reviews: {
      list: (id: Id, params?: Record<string, unknown>) =>
        get<unknown>(`/${id}/reviews`, params),
      add: (id: Id, body: Record<string, unknown>) =>
        request<unknown>(`/${id}/reviews`, { method: "POST", body }),
    },
    tasks: (id: Id, params?: Record<string, unknown>) =>
      get<unknown>(`/${id}/tasks`, params),
    targets: (id: Id, params?: Record<string, unknown>) =>
      get<unknown>(`/${id}/targets`, params),
    history: (id: Id, params?: Record<string, unknown>) =>
      get<unknown>(`/${id}/history`, params),
    convertToEmployee: (id: Id, body: Record<string, unknown>) =>
      request<unknown>(`/${id}/convert-to-employee`, { method: "POST", body }),
  };
}

/** General admin screens: `/api/v1/nysc-interns`, then HR copy on 404. */
export const nyscInternsManageApi = createNyscInternsManageApi((path, options) =>
  requestOnBases(["/nysc-interns", "/hr/nysc-interns"], path, options),
);

/** HR screens: `/api/v1/hr/nysc-interns`. */
export const hrNyscInternsApi = createNyscInternsManageApi((path, options) =>
  requestOnBases(["/hr/nysc-interns"], path, options),
);
