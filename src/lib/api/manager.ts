import { apiRequest, buildQuery } from "./client";
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

  listEmployees(query?: ManagerListParams) {
    return list("/employees", query);
  },

  listAttendance(query?: ManagerListParams) {
    return list("/attendance", query);
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
    return apiRequest<unknown>(managerPath("/expenses"), { method: "POST", body }).then(unwrapData);
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
    return list("/nysc-interns", query);
  },

  createNyscIntern(body: unknown) {
    return apiRequest<unknown>(managerPath("/nysc-interns"), {
      method: "POST",
      body,
    }).then(unwrapData);
  },

  updateNyscIntern(id: Id, body: unknown) {
    return apiRequest<unknown>(managerPath(`/nysc-interns/${id}`), {
      method: "PATCH",
      body,
    }).then(unwrapData);
  },

  assignNyscSupervisor(id: Id, body: unknown) {
    return apiRequest<unknown>(managerPath(`/nysc-interns/${id}/supervisor`), {
      method: "POST",
      body,
    }).then(unwrapData);
  },

  exportNyscInterns(query?: ManagerListParams) {
    return apiRequest<unknown>(managerPath("/nysc-interns/export", query));
  },
};

export type ManagerApi = typeof managerApi;
