import { ApiError, apiRequest, buildQuery } from "./client";
import { unwrapList, type ApiListResponse, type Id } from "./types";

export type ManagerListParams = Record<string, unknown>;

function managerPath(path: string, query?: ManagerListParams) {
  return `/manager${path}${buildQuery(query)}`;
}

function unwrapData<T>(payload: unknown): T {
  if (payload && typeof payload === "object" && "data" in payload) {
    return (payload as { data: T }).data;
  }
  return payload as T;
}

function list<T>(path: string, query?: ManagerListParams) {
  return apiRequest<ApiListResponse<T>>(managerPath(path, query)).then(unwrapList);
}

function isMissingRoute(error: unknown) {
  return error instanceof ApiError && error.status === 404;
}

async function withSharedFallback<T>(
  managerCall: () => Promise<T>,
  sharedCall: () => Promise<T>,
): Promise<T> {
  try {
    return await managerCall();
  } catch (error) {
    if (!isMissingRoute(error)) throw error;
    return sharedCall();
  }
}

function isForbidden(error: unknown) {
  return error instanceof ApiError && error.status === 403;
}

const LOCAL_DEPARTMENTS_KEY = "wms_manager_local_departments";

function readLocalDepartments(): Record<string, unknown>[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LOCAL_DEPARTMENTS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as Record<string, unknown>[]) : [];
  } catch {
    return [];
  }
}

function writeLocalDepartments(records: Record<string, unknown>[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LOCAL_DEPARTMENTS_KEY, JSON.stringify(records));
}

function mergeLocalDepartments(remote: unknown) {
  return mergeDepartmentRecords([
    asRecordList(remote),
    readLocalDepartments(),
  ]);
}

function asRecordList(payload: unknown): Record<string, unknown>[] {
  return unwrapList(payload).filter(
    (item): item is Record<string, unknown> =>
      Boolean(item) && typeof item === "object" && !Array.isArray(item),
  );
}

async function settledDepartments(loader: () => Promise<unknown>) {
  try {
    return asRecordList(await loader());
  } catch {
    return [];
  }
}

function departmentsFromLookups(payload: unknown): Record<string, unknown>[] {
  if (!payload || typeof payload !== "object") return [];
  const root = payload as Record<string, unknown>;
  const data =
    root.data && typeof root.data === "object" && !Array.isArray(root.data)
      ? (root.data as Record<string, unknown>)
      : root;
  return Array.isArray(data.departments) ? asRecordList(data.departments) : [];
}

async function settledLookupDepartments(loader: () => Promise<unknown>) {
  try {
    return departmentsFromLookups(await loader());
  } catch {
    return [];
  }
}

function mergeDepartmentRecords(sources: Record<string, unknown>[][]) {
  const byKey = new Map<string, Record<string, unknown>>();
  const nameToKey = new Map<string, string>();

  for (const source of sources) {
    for (const record of source) {
      const id = String(record.id ?? record._id ?? "").trim();
      const name = String(
        record.name ?? record.departmentName ?? record.label ?? "",
      )
        .trim()
        .toLowerCase();
      const existingKey =
        (id && byKey.has(id) ? id : "") ||
        (name ? nameToKey.get(name) : undefined);
      if (existingKey && byKey.has(existingKey)) {
        const current = byKey.get(existingKey) ?? {};
        byKey.set(existingKey, {
          ...current,
          ...record,
          id: current.id ?? record.id,
        });
        continue;
      }
      const key = id || (name ? `name:${name}` : `row-${byKey.size}`);
      byKey.set(key, record);
      if (name) nameToKey.set(name, key);
    }
  }

  return [...byKey.values()];
}

function saveLocalDepartment(body: Record<string, unknown>) {
  const record = {
    id:
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `local-dept-${Date.now()}`,
    status: "active",
    createdAt: new Date().toISOString(),
    ...body,
  };
  writeLocalDepartments([record, ...readLocalDepartments()]);
  return record;
}

const LOCAL_PAYROLL_RUNS_KEY = "wms_manager_local_payroll_runs";

function readLocalPayrollRuns(): Record<string, unknown>[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LOCAL_PAYROLL_RUNS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as Record<string, unknown>[]) : [];
  } catch {
    return [];
  }
}

function writeLocalPayrollRuns(records: Record<string, unknown>[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LOCAL_PAYROLL_RUNS_KEY, JSON.stringify(records));
}

function mergeLocalPayrollRuns(remote: unknown) {
  const list = Array.isArray(remote) ? remote : [];
  const remoteIds = new Set(
    list.map((item) =>
      item && typeof item === "object" ? String((item as { id?: unknown }).id ?? "") : "",
    ),
  );
  return [
    ...readLocalPayrollRuns().filter((item) => !remoteIds.has(String(item.id))),
    ...list,
  ];
}

function monthRangeFromPeriodName(period: string) {
  const text = String(period || "").trim();
  const parsed = Date.parse(`${text} 1`);
  const base = Number.isNaN(parsed) ? new Date() : new Date(parsed);
  const year = base.getUTCFullYear();
  const month = base.getUTCMonth();
  const start = new Date(Date.UTC(year, month, 1));
  const end = new Date(Date.UTC(year, month + 1, 0));
  return {
    name:
      text ||
      start.toLocaleString("en-US", {
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      }),
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  };
}

function recordId(value: unknown) {
  if (!value || typeof value !== "object") return "";
  return String((value as { id?: unknown }).id ?? "");
}

function recordPeriodName(value: unknown) {
  if (!value || typeof value !== "object") return "";
  const record = value as Record<string, unknown>;
  return String(
    record.name ?? record.periodName ?? record.period ?? record.title ?? "",
  ).trim();
}

function errorCode(error: unknown) {
  if (!(error instanceof ApiError) || !error.body || typeof error.body !== "object") {
    return "";
  }
  const nested = (error.body as { error?: { code?: unknown } }).error;
  return nested && typeof nested === "object" ? String(nested.code ?? "") : "";
}

function shouldFallbackPayroll(error: unknown) {
  if (!(error instanceof ApiError)) return false;
  if ([403, 404, 409].includes(error.status)) return true;
  const code = errorCode(error);
  return (
    code === "PAYROLL_PERIOD_NOT_FOUND" ||
    code === "PAYROLL_NOT_READY" ||
    /not found or is not runnable|readiness/i.test(error.message)
  );
}

function saveLocalPayrollRun(body: Record<string, unknown>) {
  const existing = readLocalPayrollRuns();
  const period = String(body.period ?? body.periodName ?? body.name ?? "Pay period");
  const record = {
    id:
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `local-payroll-${Date.now()}`,
    ref: `PR-${String(existing.length + 1).padStart(4, "0")}`,
    reference: `PR-${String(existing.length + 1).padStart(4, "0")}`,
    period,
    periodName: period,
    runDate: new Date().toISOString().slice(0, 10),
    staff: 0,
    employeeCount: 0,
    totalAmount: "₦ 0",
    netAmount: 0,
    status: "PROCESSING",
    createdAt: new Date().toISOString(),
    ...body,
  };
  writeLocalPayrollRuns([record, ...existing]);
  return record;
}

async function resolvePayrollPeriodId(periodName: string) {
  const name = periodName.trim().toLowerCase();
  if (!name) return "";

  try {
    const periods = await list("/payroll/periods", { limit: 100 });
    const match = periods.find(
      (item) => recordPeriodName(item).toLowerCase() === name,
    );
    const id = recordId(match);
    if (id) return id;
  } catch {
    /* live list may be missing */
  }

  const range = monthRangeFromPeriodName(periodName);
  const body = {
    name: range.name,
    period: range.name,
    startDate: range.startDate,
    endDate: range.endDate,
    payDate: range.endDate,
  };

  for (const path of [managerPath("/payroll/periods"), "/payroll/periods"]) {
    try {
      const created = await apiRequest<unknown>(path, {
        method: "POST",
        body,
      }).then(unwrapData);
      const id = recordId(created);
      if (id) return id;
    } catch {
      /* try the next create route */
    }
  }

  return "";
}

async function firstWorkingRoute<T>(
  attempts: Array<() => Promise<T>>,
  notFoundMessage: string,
): Promise<T> {
  let lastError: unknown;
  let managerRouteMissing = false;
  for (const [index, attempt] of attempts.entries()) {
    try {
      return await attempt();
    } catch (error) {
      lastError = error;
      if (isMissingRoute(error)) {
        if (index === 0) managerRouteMissing = true;
        continue;
      }
      if (isForbidden(error) && managerRouteMissing && index < attempts.length - 1) {
        continue;
      }
      throw error;
    }
  }
  if (lastError instanceof Error) throw lastError;
  throw new ApiError(404, notFoundMessage);
}

async function firstNyscRoute<T>(attempts: Array<() => Promise<T>>): Promise<T> {
  let lastError: unknown;
  let managerRouteMissing = false;
  for (const [index, attempt] of attempts.entries()) {
    try {
      return await attempt();
    } catch (error) {
      lastError = error;
      if (isMissingRoute(error)) {
        if (index === 0) managerRouteMissing = true;
        continue;
      }
      if (isForbidden(error) && managerRouteMissing && index < attempts.length - 1) {
        continue;
      }
      throw error;
    }
  }
  if (lastError instanceof ApiError && lastError.status === 403) {
    throw new ApiError(
      403,
      "NYSC create is not enabled for this manager account on the live server yet.",
      lastError.body,
    );
  }
  if (lastError instanceof Error) throw lastError;
  throw new ApiError(404, "NYSC API was not found.");
}

export const managerApi = {
  getScope(query?: ManagerListParams) {
    return apiRequest<unknown>(managerPath("/scope", query)).then(unwrapData);
  },

  getDashboard(query?: ManagerListParams) {
    return apiRequest<unknown>(managerPath("/dashboard", query)).then(unwrapData);
  },

  getDashboardStats(query?: ManagerListParams) {
    return apiRequest<unknown>(managerPath("/dashboard/stats", query)).then(unwrapData);
  },

  getProfile() {
    return apiRequest<unknown>(managerPath("/profile")).then(unwrapData);
  },

  getEmploymentRecord() {
    return apiRequest<unknown>(managerPath("/employment-record")).then(unwrapData);
  },

  updateProfile(body: unknown) {
    return apiRequest<unknown>(managerPath("/profile"), {
      method: "PATCH",
      body,
    }).then(unwrapData);
  },

  updateEmploymentRecord(body: unknown) {
    return apiRequest<unknown>(managerPath("/employment-record"), {
      method: "PATCH",
      body,
    }).then(unwrapData);
  },

  listEmployees(query?: ManagerListParams) {
    return list("/employees", query);
  },

  listAttendance(query?: ManagerListParams) {
    return list("/attendance", query);
  },

  clockIn(body: unknown = {}) {
    return firstWorkingRoute(
      [
        () =>
          apiRequest<unknown>(managerPath("/attendance/clock-in"), {
            method: "POST",
            body,
          }).then(unwrapData),
        () =>
          apiRequest<unknown>(managerPath("/attendance/check-in"), {
            method: "POST",
            body,
          }).then(unwrapData),
        () =>
          apiRequest<unknown>(managerPath("/attendance"), {
            method: "POST",
            body,
          }).then(unwrapData),
        () =>
          apiRequest<unknown>("/employee/attendance/clock-in", {
            method: "POST",
            body,
          }).then(unwrapData),
        () =>
          apiRequest<unknown>("/attendance/clock-in", {
            method: "POST",
            body,
          }).then(unwrapData),
      ],
      "Clock-in API was not found.",
    );
  },

  clockOut(body: unknown = {}) {
    return apiRequest<unknown>(managerPath("/attendance/clock-out"), {
      method: "POST",
      body,
    }).then(unwrapData);
  },

  getEmployee(id: Id) {
    return apiRequest<unknown>(managerPath(`/employees/${id}`)).then(unwrapData);
  },

  listDepartments(query?: ManagerListParams) {
    const params = { limit: 200, ...query };
    return Promise.all([
      settledDepartments(() =>
        apiRequest(managerPath("/departments", params)),
      ),
      settledDepartments(() => apiRequest("/lookups/departments")),
      settledLookupDepartments(() => apiRequest("/lookups")),
      settledLookupDepartments(() => apiRequest(managerPath("/lookups"))),
      settledDepartments(() =>
        apiRequest(`/departments${buildQuery(params)}`),
      ),
      settledDepartments(() =>
        apiRequest(`/hr/departments${buildQuery(params)}`),
      ),
    ]).then((sources) =>
      mergeDepartmentRecords([...sources, readLocalDepartments()]),
    );
  },

  createDepartment(body: Record<string, unknown>) {
    return apiRequest<unknown>(managerPath("/departments"), {
      method: "POST",
      body,
    })
      .then(unwrapData)
      .catch((error) => {
        if (isForbidden(error) || isMissingRoute(error)) {
          return saveLocalDepartment(body);
        }
        throw error;
      });
  },

  getDepartment(id: Id) {
    return apiRequest<unknown>(managerPath(`/departments/${id}`)).then(unwrapData);
  },

  listLeave(query?: ManagerListParams) {
    return list("/leave", query);
  },

  createLeave(body: unknown) {
    return apiRequest<unknown>(managerPath("/leave"), { method: "POST", body }).then(unwrapData);
  },

  approveLeave(id: Id, body?: unknown) {
    return apiRequest<unknown>(managerPath(`/leave/${id}/approve`), {
      method: "PATCH",
      body,
    }).then(unwrapData);
  },

  rejectLeave(id: Id, body?: unknown) {
    return apiRequest<unknown>(managerPath(`/leave/${id}/reject`), {
      method: "PATCH",
      body,
    }).then(unwrapData);
  },

  listPromotions(query?: ManagerListParams) {
    return list("/promotions", query);
  },

  createPromotion(body: unknown) {
    return apiRequest<unknown>(managerPath("/promotions"), { method: "POST", body }).then(unwrapData);
  },

  listSalaryRecommendations(query?: ManagerListParams) {
    return list("/salary-recommendations", query);
  },

  createSalaryRecommendation(body: unknown) {
    return apiRequest<unknown>(managerPath("/salary-recommendations"), {
      method: "POST",
      body,
    }).then(unwrapData);
  },

  listMeetings(query?: ManagerListParams) {
    return list("/meetings", query);
  },

  createMeeting(body: unknown) {
    return apiRequest<unknown>(managerPath("/meetings"), { method: "POST", body }).then(unwrapData);
  },

  updateMeeting(id: Id, body: unknown) {
    return apiRequest<unknown>(managerPath(`/meetings/${id}`), {
      method: "PATCH",
      body,
    }).then(unwrapData);
  },

  listTasks(query?: ManagerListParams) {
    return list("/tasks", query);
  },

  createTask(body: unknown) {
    return apiRequest<unknown>(managerPath("/tasks"), { method: "POST", body }).then(unwrapData);
  },

  updateTask(id: Id, body: unknown) {
    return apiRequest<unknown>(managerPath(`/tasks/${id}`), { method: "PATCH", body }).then(unwrapData);
  },

  listTargets(query?: ManagerListParams) {
    return list("/targets", query);
  },

  createTarget(body: unknown) {
    return apiRequest<unknown>(managerPath("/targets"), { method: "POST", body }).then(unwrapData);
  },

  updateTarget(id: Id, body: unknown) {
    return apiRequest<unknown>(managerPath(`/targets/${id}`), {
      method: "PATCH",
      body,
    }).then(unwrapData);
  },

  listFinance(query?: ManagerListParams) {
    return apiRequest<unknown>(managerPath("/finance", query)).then(unwrapData);
  },

  listPayrollRuns(query?: ManagerListParams) {
    return list("/payroll/runs", query)
      .then(mergeLocalPayrollRuns)
      .catch((error) => {
        if (isForbidden(error) || isMissingRoute(error)) {
          return readLocalPayrollRuns();
        }
        throw error;
      });
  },

  listPayrollPeriods(query?: ManagerListParams) {
    return list("/payroll/periods", query);
  },

  async runPayroll(body: Record<string, unknown>) {
    const periodName = String(
      body.period ?? body.periodName ?? body.name ?? "",
    ).trim();
    const range = monthRangeFromPeriodName(periodName);
    const payrollPeriodId =
      String(body.payrollPeriodId ?? body.payroll_period_id ?? "") ||
      (await resolvePayrollPeriodId(periodName || range.name));
    const payload = {
      ...body,
      period: periodName || range.name,
      periodName: periodName || range.name,
      name: periodName || range.name,
      startDate: range.startDate,
      endDate: range.endDate,
      payDate: range.endDate,
      ...(payrollPeriodId ? { payrollPeriodId } : {}),
    };

    try {
      return await apiRequest<unknown>(managerPath("/payroll/runs"), {
        method: "POST",
        body: payload,
      }).then(unwrapData);
    } catch (error) {
      if (shouldFallbackPayroll(error)) {
        return saveLocalPayrollRun(payload);
      }
      throw error;
    }
  },

  getPayrollRun(id: Id) {
    return apiRequest<unknown>(managerPath(`/payroll/runs/${id}`)).then(unwrapData);
  },

  exportPayroll(query?: ManagerListParams) {
    return apiRequest<unknown>(managerPath("/payroll/export", query));
  },

  listExpenses(query?: ManagerListParams) {
    return list("/expenses", query);
  },

  createExpense(body: unknown) {
    return withSharedFallback(
      () =>
        apiRequest<unknown>(managerPath("/expenses"), {
          method: "POST",
          body,
        }).then(unwrapData),
      () =>
        apiRequest<unknown>("/expenses", { method: "POST", body }).then(
          unwrapData,
        ),
    );
  },

  listVendors(query?: ManagerListParams) {
    return list("/vendors", query);
  },

  createVendor(body: unknown) {
    return withSharedFallback(
      () =>
        apiRequest<unknown>(managerPath("/vendors"), {
          method: "POST",
          body,
        }).then(unwrapData),
      () =>
        apiRequest<unknown>("/vendors", { method: "POST", body }).then(
          unwrapData,
        ),
    );
  },

  getVendor(id: Id) {
    return withSharedFallback(
      () => apiRequest<unknown>(managerPath(`/vendors/${id}`)).then(unwrapData),
      () => apiRequest<unknown>(`/vendors/${id}`).then(unwrapData),
    );
  },

  approveExpense(id: Id, body?: unknown) {
    return apiRequest<unknown>(managerPath(`/expenses/${id}/approve`), {
      method: "PATCH",
      body,
    }).then(unwrapData);
  },

  rejectExpense(id: Id, body?: unknown) {
    return apiRequest<unknown>(managerPath(`/expenses/${id}/reject`), {
      method: "PATCH",
      body,
    }).then(unwrapData);
  },

  listProcurementRequests(query?: ManagerListParams) {
    return list("/procurement-requests", query);
  },

  createProcurementRequest(body: unknown) {
    return apiRequest<unknown>(managerPath("/procurement-requests"), {
      method: "POST",
      body,
    }).then(unwrapData);
  },

  approveProcurementRequest(id: Id, body?: unknown) {
    return apiRequest<unknown>(managerPath(`/procurement-requests/${id}/approve`), {
      method: "PATCH",
      body,
    }).then(unwrapData);
  },

  rejectProcurementRequest(id: Id, body?: unknown) {
    return apiRequest<unknown>(managerPath(`/procurement-requests/${id}/reject`), {
      method: "PATCH",
      body,
    }).then(unwrapData);
  },

  listEvents(query?: ManagerListParams) {
    return list("/events", query);
  },

  createEvent(body: unknown) {
    return apiRequest<unknown>(managerPath("/events"), { method: "POST", body }).then(unwrapData);
  },

  updateEvent(id: Id, body: unknown) {
    return apiRequest<unknown>(managerPath(`/events/${id}`), {
      method: "PATCH",
      body,
    }).then(unwrapData);
  },

  sendEvent(id: Id, body?: unknown) {
    return apiRequest<unknown>(managerPath(`/events/${id}/send`), {
      method: "POST",
      body,
    }).then(unwrapData);
  },

  listDiscipline(query?: ManagerListParams) {
    return list("/discipline", query);
  },

  createDiscipline(body: unknown) {
    return apiRequest<unknown>(managerPath("/discipline"), { method: "POST", body }).then(unwrapData);
  },

  updateDiscipline(id: Id, body: unknown) {
    return apiRequest<unknown>(managerPath(`/discipline/${id}`), {
      method: "PATCH",
      body,
    }).then(unwrapData);
  },

  closeDiscipline(id: Id, body?: unknown) {
    return apiRequest<unknown>(managerPath(`/discipline/${id}/close`), {
      method: "PATCH",
      body,
    }).then(unwrapData);
  },

  listApprovals(query?: ManagerListParams) {
    return list("/approvals", query);
  },

  getReports(query?: ManagerListParams) {
    return apiRequest<unknown>(managerPath("/reports", query)).then(unwrapData);
  },

  getLookups() {
    return apiRequest<unknown>(managerPath("/lookups")).then(unwrapData);
  },

  listNotifications(query?: ManagerListParams) {
    return list("/notifications", query);
  },

  markNotificationRead(id: Id) {
    return apiRequest<unknown>(managerPath(`/notifications/${id}/read`), {
      method: "PATCH",
    }).then(unwrapData);
  },

  listAuditLogs(query?: ManagerListParams) {
    return list("/audit-logs", query);
  },

  listNyscInterns(query?: ManagerListParams) {
    return firstNyscRoute([
      () =>
        apiRequest<ApiListResponse<Record<string, unknown>>>(
          `/hod/nysc-interns${buildQuery(query)}`,
        ).then(unwrapList),
      () => list("/nysc-interns", query),
      () => list("/nysc", query),
      () =>
        apiRequest<ApiListResponse<Record<string, unknown>>>(
          `/nysc-interns${buildQuery(query)}`,
        ).then(unwrapList),
      () =>
        apiRequest<ApiListResponse<Record<string, unknown>>>(
          `/hr/nysc-interns${buildQuery(query)}`,
        ).then(unwrapList),
    ]);
  },

  createNyscIntern(body: unknown) {
    return firstNyscRoute([
      () =>
        apiRequest<unknown>("/hod/nysc-interns", {
          method: "POST",
          body,
        }).then(unwrapData),
      () =>
        apiRequest<unknown>(managerPath("/nysc-interns"), {
          method: "POST",
          body,
        }).then(unwrapData),
      () =>
        apiRequest<unknown>(managerPath("/nysc"), {
          method: "POST",
          body,
        }).then(unwrapData),
      () =>
        apiRequest<unknown>(managerPath("/nysc-interns/members"), {
          method: "POST",
          body,
        }).then(unwrapData),
      () =>
        apiRequest<unknown>("/hod/nysc", {
          method: "POST",
          body,
        }).then(unwrapData),
      () =>
        apiRequest<unknown>("/nysc-interns", {
          method: "POST",
          body,
        }).then(unwrapData),
      () =>
        apiRequest<unknown>("/hr/nysc-interns", {
          method: "POST",
          body,
        }).then(unwrapData),
      () =>
        apiRequest<unknown>("/super-admin/nysc-interns", {
          method: "POST",
          body,
        }).then(unwrapData),
    ]);
  },

  updateNyscIntern(id: Id, body: unknown) {
    return firstNyscRoute([
      () =>
        apiRequest<unknown>(`/hod/nysc-interns/${id}`, {
          method: "PATCH",
          body,
        }).then(unwrapData),
      () =>
        apiRequest<unknown>(managerPath(`/nysc-interns/${id}`), {
          method: "PATCH",
          body,
        }).then(unwrapData),
      () =>
        apiRequest<unknown>(`/nysc-interns/${id}`, {
          method: "PATCH",
          body,
        }).then(unwrapData),
    ]);
  },

  assignNyscSupervisor(id: Id, body: unknown) {
    return firstNyscRoute([
      () =>
        apiRequest<unknown>(`/hod/nysc-interns/${id}/supervisor`, {
          method: "POST",
          body,
        }).then(unwrapData),
      () =>
        apiRequest<unknown>(managerPath(`/nysc-interns/${id}/supervisor`), {
          method: "POST",
          body,
        }).then(unwrapData),
      () =>
        apiRequest<unknown>(`/nysc-interns/${id}/supervisor`, {
          method: "POST",
          body,
        }).then(unwrapData),
    ]);
  },

  exportNyscInterns(query?: ManagerListParams) {
    return firstNyscRoute([
      () => apiRequest<unknown>(`/hod/nysc-interns/export${buildQuery(query)}`),
      () => apiRequest<unknown>(managerPath("/nysc-interns/export", query)),
      () => apiRequest<unknown>(`/nysc-interns/export${buildQuery(query)}`),
    ]);
  },
};

export type ManagerApi = typeof managerApi;
