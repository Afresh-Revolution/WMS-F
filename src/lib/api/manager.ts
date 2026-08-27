import { managerRequest, unwrapData, unwrapList } from "./client";
import type { ListResult, ManagerListParams } from "./types";

export const managerApi = {
  getScope(query?: ManagerListParams) {
    return managerRequest<unknown>("/scope", { query }).then(unwrapData);
  },

  getDashboard(query?: ManagerListParams) {
    return managerRequest<unknown>("/dashboard", { query }).then(unwrapData);
  },

  getDashboardStats(query?: ManagerListParams) {
    return managerRequest<unknown>("/dashboard/stats", { query }).then(unwrapData);
  },

  listEmployees(query?: ManagerListParams) {
    return managerRequest<unknown>("/employees", { query }).then(unwrapList);
  },

  getEmployee(id: string) {
    return managerRequest<unknown>(`/employees/${id}`).then(unwrapData);
  },

  listDepartments(query?: ManagerListParams) {
    return managerRequest<unknown>("/departments", { query }).then(unwrapList);
  },

  getDepartment(id: string) {
    return managerRequest<unknown>(`/departments/${id}`).then(unwrapData);
  },

  listLeave(query?: ManagerListParams) {
    return managerRequest<unknown>("/leave", { query }).then(unwrapList);
  },

  createLeave(body: unknown) {
    return managerRequest<unknown>("/leave", { method: "POST", body }).then(unwrapData);
  },

  approveLeave(id: string, body?: unknown) {
    return managerRequest<unknown>(`/leave/${id}/approve`, {
      method: "PATCH",
      body,
    }).then(unwrapData);
  },

  rejectLeave(id: string, body?: unknown) {
    return managerRequest<unknown>(`/leave/${id}/reject`, {
      method: "PATCH",
      body,
    }).then(unwrapData);
  },

  listPromotions(query?: ManagerListParams) {
    return managerRequest<unknown>("/promotions", { query }).then(unwrapList);
  },

  createPromotion(body: unknown) {
    return managerRequest<unknown>("/promotions", { method: "POST", body }).then(unwrapData);
  },

  listSalaryRecommendations(query?: ManagerListParams) {
    return managerRequest<unknown>("/salary-recommendations", { query }).then(unwrapList);
  },

  createSalaryRecommendation(body: unknown) {
    return managerRequest<unknown>("/salary-recommendations", {
      method: "POST",
      body,
    }).then(unwrapData);
  },

  listMeetings(query?: ManagerListParams) {
    return managerRequest<unknown>("/meetings", { query }).then(unwrapList);
  },

  createMeeting(body: unknown) {
    return managerRequest<unknown>("/meetings", { method: "POST", body }).then(unwrapData);
  },

  updateMeeting(id: string, body: unknown) {
    return managerRequest<unknown>(`/meetings/${id}`, { method: "PATCH", body }).then(unwrapData);
  },

  listTasks(query?: ManagerListParams) {
    return managerRequest<unknown>("/tasks", { query }).then(unwrapList);
  },

  createTask(body: unknown) {
    return managerRequest<unknown>("/tasks", { method: "POST", body }).then(unwrapData);
  },

  updateTask(id: string, body: unknown) {
    return managerRequest<unknown>(`/tasks/${id}`, { method: "PATCH", body }).then(unwrapData);
  },

  listTargets(query?: ManagerListParams) {
    return managerRequest<unknown>("/targets", { query }).then(unwrapList);
  },

  createTarget(body: unknown) {
    return managerRequest<unknown>("/targets", { method: "POST", body }).then(unwrapData);
  },

  updateTarget(id: string, body: unknown) {
    return managerRequest<unknown>(`/targets/${id}`, { method: "PATCH", body }).then(unwrapData);
  },

  listFinance(query?: ManagerListParams) {
    return managerRequest<unknown>("/finance", { query }).then(unwrapData);
  },

  listExpenses(query?: ManagerListParams) {
    return managerRequest<unknown>("/expenses", { query }).then(unwrapList);
  },

  createExpense(body: unknown) {
    return managerRequest<unknown>("/expenses", { method: "POST", body }).then(unwrapData);
  },

  approveExpense(id: string, body?: unknown) {
    return managerRequest<unknown>(`/expenses/${id}/approve`, {
      method: "PATCH",
      body,
    }).then(unwrapData);
  },

  rejectExpense(id: string, body?: unknown) {
    return managerRequest<unknown>(`/expenses/${id}/reject`, {
      method: "PATCH",
      body,
    }).then(unwrapData);
  },

  listProcurementRequests(query?: ManagerListParams) {
    return managerRequest<unknown>("/procurement-requests", { query }).then(unwrapList);
  },

  createProcurementRequest(body: unknown) {
    return managerRequest<unknown>("/procurement-requests", {
      method: "POST",
      body,
    }).then(unwrapData);
  },

  approveProcurementRequest(id: string, body?: unknown) {
    return managerRequest<unknown>(`/procurement-requests/${id}/approve`, {
      method: "PATCH",
      body,
    }).then(unwrapData);
  },

  rejectProcurementRequest(id: string, body?: unknown) {
    return managerRequest<unknown>(`/procurement-requests/${id}/reject`, {
      method: "PATCH",
      body,
    }).then(unwrapData);
  },

  listEvents(query?: ManagerListParams) {
    return managerRequest<unknown>("/events", { query }).then(unwrapList);
  },

  createEvent(body: unknown) {
    return managerRequest<unknown>("/events", { method: "POST", body }).then(unwrapData);
  },

  updateEvent(id: string, body: unknown) {
    return managerRequest<unknown>(`/events/${id}`, { method: "PATCH", body }).then(unwrapData);
  },

  listDiscipline(query?: ManagerListParams) {
    return managerRequest<unknown>("/discipline", { query }).then(unwrapList);
  },

  createDiscipline(body: unknown) {
    return managerRequest<unknown>("/discipline", { method: "POST", body }).then(unwrapData);
  },

  updateDiscipline(id: string, body: unknown) {
    return managerRequest<unknown>(`/discipline/${id}`, { method: "PATCH", body }).then(unwrapData);
  },

  closeDiscipline(id: string, body?: unknown) {
    return managerRequest<unknown>(`/discipline/${id}/close`, {
      method: "PATCH",
      body,
    }).then(unwrapData);
  },

  listApprovals(query?: ManagerListParams) {
    return managerRequest<unknown>("/approvals", { query }).then(unwrapList);
  },

  getReports(query?: ManagerListParams) {
    return managerRequest<unknown>("/reports", { query }).then(unwrapData);
  },

  listNotifications(query?: ManagerListParams) {
    return managerRequest<unknown>("/notifications", { query }).then(unwrapList);
  },

  markNotificationRead(id: string) {
    return managerRequest<unknown>(`/notifications/${id}/read`, {
      method: "PATCH",
    }).then(unwrapData);
  },

  listAuditLogs(query?: ManagerListParams) {
    return managerRequest<unknown>("/audit-logs", { query }).then(unwrapList);
  },
};

export type ManagerApi = typeof managerApi;
export type { ListResult, ManagerListParams };
