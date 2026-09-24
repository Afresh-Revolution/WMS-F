import { ApiError, apiRequest, buildQuery } from "./client";
import { nyscInternsManageApi } from "./intern";
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
    return list("/departments", query);
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
    return list("/payroll/runs", query);
  },

  listPayrollPeriods(query?: ManagerListParams) {
    return list("/payroll/periods", query);
  },

  runPayroll(body: unknown) {
    return apiRequest<unknown>(managerPath("/payroll/runs"), {
      method: "POST",
      body,
    }).then(unwrapData);
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
    return nyscInternsManageApi.list(query).then((payload) =>
      unwrapList<Record<string, unknown>>(payload),
    );
  },

  getNyscIntern(id: Id) {
    return nyscInternsManageApi.get(id).then(unwrapData);
  },

  createNyscIntern(body: unknown) {
    return nyscInternsManageApi
      .create((body ?? {}) as Record<string, unknown>)
      .then(unwrapData);
  },

  updateNyscIntern(id: Id, body: unknown) {
    return nyscInternsManageApi
      .patch(id, (body ?? {}) as Record<string, unknown>)
      .then(unwrapData);
  },

  assignNyscSupervisor(id: Id, body: unknown) {
    const record =
      body && typeof body === "object"
        ? (body as Record<string, unknown>)
        : {};
    const employeeId = String(
      record.employeeId ??
        record.supervisorEmployeeId ??
        record.supervisorId ??
        "",
    );
    return nyscInternsManageApi
      .assignSupervisor(id, employeeId)
      .then(unwrapData);
  },

  exportNyscInterns(query?: ManagerListParams) {
    return nyscInternsManageApi.export(query);
  },
};

export type ManagerApi = typeof managerApi;
