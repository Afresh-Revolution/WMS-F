import { apiRequest, buildQuery } from "./client";
import type { ApiListResponse, Id } from "./types";

export const departmentsApi = {
  list: (params?: Record<string, unknown>) =>
    apiRequest<ApiListResponse<Record<string, unknown>>>(
      `/departments${buildQuery(params)}`,
    ),

  create: (body: Record<string, unknown>) =>
    apiRequest<Record<string, unknown>>("/departments", {
      method: "POST",
      body,
    }),

  get: (id: Id) => apiRequest<Record<string, unknown>>(`/departments/${id}`),

  overview: (id: Id) =>
    apiRequest<Record<string, unknown>>(`/departments/${id}/overview`),

  patch: (id: Id, body: Record<string, unknown>) =>
    apiRequest<Record<string, unknown>>(`/departments/${id}`, {
      method: "PATCH",
      body,
    }),

  delete: (id: Id) =>
    apiRequest<void>(`/departments/${id}`, { method: "DELETE" }),

  activate: (id: Id) =>
    apiRequest<void>(`/departments/${id}/activate`, { method: "POST" }),

  deactivate: (id: Id) =>
    apiRequest<void>(`/departments/${id}/deactivate`, { method: "POST" }),

  setHod: (id: Id, body: Record<string, unknown>) =>
    apiRequest<void>(`/departments/${id}/hod`, { method: "POST", body }),

  hodOptions: () =>
    apiRequest<Record<string, unknown>>("/departments/hod-options"),

  removeHod: (id: Id) =>
    apiRequest<void>(`/departments/${id}/hod`, { method: "DELETE" }),

  setAssistantHod: (id: Id, body: Record<string, unknown>) =>
    apiRequest<void>(`/departments/${id}/assistant-hod`, {
      method: "POST",
      body,
    }),

  employees: (id: Id, params?: Record<string, unknown>) =>
    apiRequest<ApiListResponse<Record<string, unknown>>>(
      `/departments/${id}/employees${buildQuery(params)}`,
    ),

  interns: (id: Id, params?: Record<string, unknown>) =>
    apiRequest<ApiListResponse<Record<string, unknown>>>(
      `/departments/${id}/interns${buildQuery(params)}`,
    ),

  nysc: (id: Id, params?: Record<string, unknown>) =>
    apiRequest<ApiListResponse<Record<string, unknown>>>(
      `/departments/${id}/nysc${buildQuery(params)}`,
    ),

  tasks: (id: Id, params?: Record<string, unknown>) =>
    apiRequest<ApiListResponse<Record<string, unknown>>>(
      `/departments/${id}/tasks${buildQuery(params)}`,
    ),

  targets: (id: Id, params?: Record<string, unknown>) =>
    apiRequest<ApiListResponse<Record<string, unknown>>>(
      `/departments/${id}/targets${buildQuery(params)}`,
    ),

  leave: (id: Id, params?: Record<string, unknown>) =>
    apiRequest<ApiListResponse<Record<string, unknown>>>(
      `/departments/${id}/leave${buildQuery(params)}`,
    ),

  payroll: (id: Id, params?: Record<string, unknown>) =>
    apiRequest<ApiListResponse<Record<string, unknown>>>(
      `/departments/${id}/payroll${buildQuery(params)}`,
    ),

  expenses: (id: Id, params?: Record<string, unknown>) =>
    apiRequest<ApiListResponse<Record<string, unknown>>>(
      `/departments/${id}/expenses${buildQuery(params)}`,
    ),

  purchases: (id: Id, params?: Record<string, unknown>) =>
    apiRequest<ApiListResponse<Record<string, unknown>>>(
      `/departments/${id}/purchases${buildQuery(params)}`,
    ),

  meetings: (id: Id, params?: Record<string, unknown>) =>
    apiRequest<ApiListResponse<Record<string, unknown>>>(
      `/departments/${id}/meetings${buildQuery(params)}`,
    ),

  events: (id: Id, params?: Record<string, unknown>) =>
    apiRequest<ApiListResponse<Record<string, unknown>>>(
      `/departments/${id}/events${buildQuery(params)}`,
    ),

  reports: (id: Id, params?: Record<string, unknown>) =>
    apiRequest<ApiListResponse<Record<string, unknown>>>(
      `/departments/${id}/reports${buildQuery(params)}`,
    ),

  activity: (id: Id, params?: Record<string, unknown>) =>
    apiRequest<ApiListResponse<Record<string, unknown>>>(
      `/departments/${id}/activity${buildQuery(params)}`,
    ),
};

export const hrApi = {
  dashboard: () => apiRequest<Record<string, unknown>>("/hr/dashboard"),

  stats: () => apiRequest<Record<string, unknown>>("/hr/dashboard/stats"),

  employees: {
    list: (params?: Record<string, unknown>) =>
      apiRequest<ApiListResponse<Record<string, unknown>>>(
        `/hr/employees${buildQuery(params)}`,
      ),
    create: (body: Record<string, unknown>) =>
      apiRequest<Record<string, unknown>>("/hr/employees", {
        method: "POST",
        body,
      }),
    get: (id: Id) =>
      apiRequest<Record<string, unknown>>(`/hr/employees/${id}`),
    update: (id: Id, body: Record<string, unknown>) =>
      apiRequest<Record<string, unknown>>(`/hr/employees/${id}`, {
        method: "PUT",
        body,
      }),
    patchStatus: (id: Id, body: Record<string, unknown>) =>
      apiRequest<Record<string, unknown>>(`/hr/employees/${id}/status`, {
        method: "PATCH",
        body,
      }),
  },

  departments: {
    list: (params?: Record<string, unknown>) =>
      apiRequest<ApiListResponse<Record<string, unknown>>>(
        `/hr/departments${buildQuery(params)}`,
      ),
    create: (body: Record<string, unknown>) =>
      apiRequest<Record<string, unknown>>("/hr/departments", {
        method: "POST",
        body,
      }),
    update: (id: Id, body: Record<string, unknown>) =>
      apiRequest<Record<string, unknown>>(`/hr/departments/${id}`, {
        method: "PUT",
        body,
      }),
    delete: (id: Id) =>
      apiRequest<void>(`/hr/departments/${id}`, { method: "DELETE" }),
  },

  positions: {
    list: (params?: Record<string, unknown>) =>
      apiRequest<ApiListResponse<Record<string, unknown>>>(
        `/hr/positions${buildQuery(params)}`,
      ),
    create: (body: Record<string, unknown>) =>
      apiRequest<Record<string, unknown>>("/hr/positions", {
        method: "POST",
        body,
      }),
    update: (id: Id, body: Record<string, unknown>) =>
      apiRequest<Record<string, unknown>>(`/hr/positions/${id}`, {
        method: "PUT",
        body,
      }),
  },

  leave: {
    list: (params?: Record<string, unknown>) =>
      apiRequest<ApiListResponse<Record<string, unknown>>>(
        `/hr/leave${buildQuery(params)}`,
      ),
    create: (body: Record<string, unknown>) =>
      apiRequest<Record<string, unknown>>("/hr/leave", {
        method: "POST",
        body,
      }),
    approve: (id: Id) =>
      apiRequest<void>(`/hr/leave/${id}/approve`, { method: "PATCH" }),
    reject: (id: Id, body?: Record<string, unknown>) =>
      apiRequest<void>(`/hr/leave/${id}/reject`, {
        method: "PATCH",
        body,
      }),
  },

  promotions: {
    list: (params?: Record<string, unknown>) =>
      apiRequest<ApiListResponse<Record<string, unknown>>>(
        `/hr/promotions${buildQuery(params)}`,
      ),
    create: (body: Record<string, unknown>) =>
      apiRequest<Record<string, unknown>>("/hr/promotions", {
        method: "POST",
        body,
      }),
    approve: (id: Id) =>
      apiRequest<void>(`/hr/promotions/${id}/approve`, { method: "PATCH" }),
    reject: (id: Id, body?: Record<string, unknown>) =>
      apiRequest<void>(`/hr/promotions/${id}/reject`, {
        method: "PATCH",
        body,
      }),
  },

  salaryAdjustments: {
    list: (params?: Record<string, unknown>) =>
      apiRequest<ApiListResponse<Record<string, unknown>>>(
        `/hr/salary-adjustments${buildQuery(params)}`,
      ),
    create: (body: Record<string, unknown>) =>
      apiRequest<Record<string, unknown>>("/hr/salary-adjustments", {
        method: "POST",
        body,
      }),
    approve: (id: Id) =>
      apiRequest<void>(`/hr/salary-adjustments/${id}/approve`, {
        method: "PATCH",
      }),
  },

  attendance: {
    list: (params?: Record<string, unknown>) =>
      apiRequest<ApiListResponse<Record<string, unknown>>>(
        `/hr/attendance${buildQuery(params)}`,
      ),
    correct: (id: Id, body: Record<string, unknown>) =>
      apiRequest<void>(`/hr/attendance/${id}/correct`, {
        method: "PATCH",
        body,
      }),
  },

  performance: (params?: Record<string, unknown>) =>
    apiRequest<ApiListResponse<Record<string, unknown>>>(
      `/hr/performance${buildQuery(params)}`,
    ),

  discipline: (params?: Record<string, unknown>) =>
    apiRequest<ApiListResponse<Record<string, unknown>>>(
      `/hr/discipline${buildQuery(params)}`,
    ),

  meetings: {
    list: (params?: Record<string, unknown>) =>
      apiRequest<ApiListResponse<Record<string, unknown>>>(
        `/hr/meetings${buildQuery(params)}`,
      ),
    create: (body: Record<string, unknown>) =>
      apiRequest<Record<string, unknown>>("/hr/meetings", {
        method: "POST",
        body,
      }),
  },

  tasks: {
    list: (params?: Record<string, unknown>) =>
      apiRequest<ApiListResponse<Record<string, unknown>>>(
        `/hr/tasks${buildQuery(params)}`,
      ),
    create: (body: Record<string, unknown>) =>
      apiRequest<Record<string, unknown>>("/hr/tasks", {
        method: "POST",
        body,
      }),
  },

  targets: {
    list: (params?: Record<string, unknown>) =>
      apiRequest<ApiListResponse<Record<string, unknown>>>(
        `/hr/targets${buildQuery(params)}`,
      ),
    create: (body: Record<string, unknown>) =>
      apiRequest<Record<string, unknown>>("/hr/targets", {
        method: "POST",
        body,
      }),
  },

  reports: (params?: Record<string, unknown>) =>
    apiRequest<Record<string, unknown>>(`/hr/reports${buildQuery(params)}`),

  auditLogs: (params?: Record<string, unknown>) =>
    apiRequest<ApiListResponse<Record<string, unknown>>>(
      `/hr/audit-logs${buildQuery(params)}`,
    ),

  approvalQueue: (params?: Record<string, unknown>) =>
    apiRequest<ApiListResponse<Record<string, unknown>>>(
      `/hr/approval-queue${buildQuery(params)}`,
    ),
};
