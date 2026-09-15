import { apiRequest, buildQuery, ApiError } from "./client";
import type { ApiListResponse, Id } from "./types";

const NS = "/super-admin";

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  auth?: boolean;
};

/**
 * Super Admin namespace first (`/api/v1/super-admin/...`),
 * then the matching primary `/api/v1/...` route if the alias is not mounted.
 */
export async function saRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  try {
    return await apiRequest<T>(`${NS}${normalized}`, options);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      return await apiRequest<T>(normalized, options);
    }
    throw err;
  }
}

function resource(base: string) {
  return {
    list: (params?: Record<string, unknown>) =>
      saRequest<ApiListResponse<Record<string, unknown>>>(
        `${base}${buildQuery(params)}`,
      ),
    create: (body?: Record<string, unknown>) =>
      saRequest<Record<string, unknown>>(base, { method: "POST", body }),
    get: (id: Id) => saRequest<Record<string, unknown>>(`${base}/${id}`),
    patch: (id: Id, body: Record<string, unknown>) =>
      saRequest<Record<string, unknown>>(`${base}/${id}`, {
        method: "PATCH",
        body,
      }),
    put: (id: Id, body: Record<string, unknown>) =>
      saRequest<Record<string, unknown>>(`${base}/${id}`, {
        method: "PUT",
        body,
      }),
    delete: (id: Id) =>
      saRequest<void>(`${base}/${id}`, { method: "DELETE" }),
    action: (id: Id, action: string, body?: Record<string, unknown>) =>
      saRequest<Record<string, unknown>>(`${base}/${id}/${action}`, {
        method: "POST",
        body,
      }),
    getAction: (
      id: Id,
      action: string,
      params?: Record<string, unknown>,
    ) =>
      saRequest<Record<string, unknown>>(
        `${base}/${id}/${action}${buildQuery(params)}`,
      ),
    collectionAction: (
      action: string,
      body?: Record<string, unknown>,
      params?: Record<string, unknown>,
    ) =>
      saRequest<Record<string, unknown>>(
        `${base}/${action}${buildQuery(params)}`,
        { method: "POST", body },
      ),
  };
}

function userActions(base = "/users") {
  const api = resource(base);
  return {
    ...api,
    statistics: () => saRequest<Record<string, unknown>>(`${base}/statistics`),
    lock: (id: Id) =>
      saRequest<void>(`${base}/${id}/lock`, { method: "POST" }),
    unlock: (id: Id) =>
      saRequest<void>(`${base}/${id}/unlock`, { method: "POST" }),
    deactivate: (id: Id) =>
      saRequest<void>(`${base}/${id}/deactivate`, { method: "POST" }),
    reactivate: (id: Id) =>
      saRequest<void>(`${base}/${id}/reactivate`, { method: "POST" }),
    activate: (id: Id) =>
      saRequest<void>(`${base}/${id}/activate`, { method: "POST" }),
    suspend: (id: Id) =>
      saRequest<void>(`${base}/${id}/suspend`, { method: "POST" }),
    resetPassword: (id: Id, body?: Record<string, unknown>) =>
      saRequest<void>(`${base}/${id}/reset-password`, {
        method: "POST",
        body,
      }),
    forcePasswordChange: (id: Id) =>
      saRequest<void>(`${base}/${id}/force-password-change`, {
        method: "POST",
      }),
    revokeSessions: (id: Id) =>
      saRequest<void>(`${base}/${id}/revoke-sessions`, { method: "POST" }),
    sessions: (id: Id, params?: Record<string, unknown>) =>
      saRequest<ApiListResponse<Record<string, unknown>>>(
        `${base}/${id}/sessions${buildQuery(params)}`,
      ),
    revokeSession: (id: Id, sessionId: Id) =>
      saRequest<void>(`${base}/${id}/sessions/${sessionId}`, {
        method: "DELETE",
      }),
    loginHistory: (id: Id, params?: Record<string, unknown>) =>
      saRequest<ApiListResponse<Record<string, unknown>>>(
        `${base}/${id}/login-history${buildQuery(params)}`,
      ),
    activity: (id: Id, params?: Record<string, unknown>) =>
      saRequest<ApiListResponse<Record<string, unknown>>>(
        `${base}/${id}/activity${buildQuery(params)}`,
      ),
  };
}

export const superAdminApi = {
  dashboard: {
    overview: () => saRequest<Record<string, unknown>>("/dashboard"),
    stats: () => saRequest<Record<string, unknown>>("/dashboard/stats"),
    platformOverview: () =>
      saRequest<Record<string, unknown>>("/dashboard/overview"),
    platformSummary: () =>
      saRequest<Record<string, unknown>>("/dashboard/super-admin"),
  },

  navigation: () => saRequest<Record<string, unknown>>("/navigation"),

  modules: {
    list: () => saRequest<ApiListResponse<Record<string, unknown>>>("/modules"),
    get: (key: string) =>
      saRequest<Record<string, unknown>>(`/modules/${key}`),
  },

  settings: {
    get: () => saRequest<Record<string, unknown>>("/settings"),
    update: (body: Record<string, unknown>) =>
      saRequest<Record<string, unknown>>("/settings", {
        method: "PATCH",
        body,
      }),
    configure: (body?: Record<string, unknown>) =>
      saRequest<Record<string, unknown>>("/settings/configure", {
        method: "POST",
        body,
      }),
  },

  status: () => saRequest<Record<string, unknown>>("/status"),
  health: () => saRequest<Record<string, unknown>>("/health"),

  search: (q: string) =>
    saRequest<Record<string, unknown>>(`/search${buildQuery({ q })}`),
  globalSearch: (q: string) =>
    saRequest<Record<string, unknown>>(`/global-search${buildQuery({ q })}`),

  profile: {
    get: () => saRequest<Record<string, unknown>>("/profile"),
    update: (body: Record<string, unknown>) =>
      saRequest<Record<string, unknown>>("/profile", { method: "PUT", body }),
    changePassword: (body: Record<string, unknown>) =>
      saRequest<void>("/profile/password", { method: "PUT", body }),
    uploadAvatar: (file: File) => {
      const form = new FormData();
      form.append("avatar", file);
      return saRequest<Record<string, unknown>>("/profile/avatar", {
        method: "POST",
        body: form,
      });
    },
    sessions: () =>
      saRequest<ApiListResponse<Record<string, unknown>>>("/profile/sessions"),
    revokeSession: (id: Id) =>
      saRequest<void>(`/profile/sessions/${id}`, { method: "DELETE" }),
    revokeAllSessions: () =>
      saRequest<void>("/profile/sessions", { method: "DELETE" }),
    loginHistory: (params?: Record<string, unknown>) =>
      saRequest<ApiListResponse<Record<string, unknown>>>(
        `/profile/login-history${buildQuery(params)}`,
      ),
    enableMfa: () =>
      saRequest<Record<string, unknown>>("/profile/mfa/enable", {
        method: "POST",
      }),
    disableMfa: (body?: Record<string, unknown>) =>
      saRequest<void>("/profile/mfa/disable", { method: "POST", body }),
    verifyMfa: (body: Record<string, unknown>) =>
      saRequest<void>("/profile/mfa/verify", { method: "POST", body }),
    backupCodes: () =>
      saRequest<Record<string, unknown>>("/profile/mfa/backup-codes", {
        method: "POST",
      }),
  },

  users: userActions("/users"),
  systemUsers: userActions("/system-management/users"),

  roles: {
    ...resource("/roles"),
    catalog: () => saRequest<Record<string, unknown>>("/roles/catalog"),
    permissions: {
      get: (id: Id) =>
        saRequest<Record<string, unknown>>(`/roles/${id}/permissions`),
      update: (id: Id, body: Record<string, unknown>) =>
        saRequest<void>(`/roles/${id}/permissions`, { method: "PUT", body }),
    },
  },

  permissions: {
    list: (params?: Record<string, unknown>) =>
      saRequest<ApiListResponse<Record<string, unknown>>>(
        `/permissions${buildQuery(params)}`,
      ),
    catalog: () => saRequest<Record<string, unknown>>("/permissions/catalog"),
  },

  departments: {
    ...resource("/departments"),
    overview: (id: Id) =>
      saRequest<Record<string, unknown>>(`/departments/${id}/overview`),
    activate: (id: Id) =>
      saRequest<void>(`/departments/${id}/activate`, { method: "POST" }),
    deactivate: (id: Id) =>
      saRequest<void>(`/departments/${id}/deactivate`, { method: "POST" }),
    setHod: (id: Id, body: Record<string, unknown>) =>
      saRequest<void>(`/departments/${id}/hod`, { method: "POST", body }),
    removeHod: (id: Id) =>
      saRequest<void>(`/departments/${id}/hod`, { method: "DELETE" }),
    setAssistantHod: (id: Id, body: Record<string, unknown>) =>
      saRequest<void>(`/departments/${id}/assistant-hod`, {
        method: "POST",
        body,
      }),
    hodOptions: () =>
      saRequest<ApiListResponse<Record<string, unknown>>>(
        "/departments/hod-options",
      ),
    employees: (id: Id, params?: Record<string, unknown>) =>
      saRequest<ApiListResponse<Record<string, unknown>>>(
        `/departments/${id}/employees${buildQuery(params)}`,
      ),
    interns: (id: Id, params?: Record<string, unknown>) =>
      saRequest<ApiListResponse<Record<string, unknown>>>(
        `/departments/${id}/interns${buildQuery(params)}`,
      ),
    nysc: (id: Id, params?: Record<string, unknown>) =>
      saRequest<ApiListResponse<Record<string, unknown>>>(
        `/departments/${id}/nysc${buildQuery(params)}`,
      ),
    tasks: (id: Id, params?: Record<string, unknown>) =>
      saRequest<ApiListResponse<Record<string, unknown>>>(
        `/departments/${id}/tasks${buildQuery(params)}`,
      ),
    targets: (id: Id, params?: Record<string, unknown>) =>
      saRequest<ApiListResponse<Record<string, unknown>>>(
        `/departments/${id}/targets${buildQuery(params)}`,
      ),
    leave: (id: Id, params?: Record<string, unknown>) =>
      saRequest<ApiListResponse<Record<string, unknown>>>(
        `/departments/${id}/leave${buildQuery(params)}`,
      ),
    payroll: (id: Id, params?: Record<string, unknown>) =>
      saRequest<ApiListResponse<Record<string, unknown>>>(
        `/departments/${id}/payroll${buildQuery(params)}`,
      ),
    expenses: (id: Id, params?: Record<string, unknown>) =>
      saRequest<ApiListResponse<Record<string, unknown>>>(
        `/departments/${id}/expenses${buildQuery(params)}`,
      ),
    purchases: (id: Id, params?: Record<string, unknown>) =>
      saRequest<ApiListResponse<Record<string, unknown>>>(
        `/departments/${id}/purchases${buildQuery(params)}`,
      ),
    meetings: (id: Id, params?: Record<string, unknown>) =>
      saRequest<ApiListResponse<Record<string, unknown>>>(
        `/departments/${id}/meetings${buildQuery(params)}`,
      ),
    events: (id: Id, params?: Record<string, unknown>) =>
      saRequest<ApiListResponse<Record<string, unknown>>>(
        `/departments/${id}/events${buildQuery(params)}`,
      ),
    reports: (id: Id, params?: Record<string, unknown>) =>
      saRequest<ApiListResponse<Record<string, unknown>>>(
        `/departments/${id}/reports${buildQuery(params)}`,
      ),
    activity: (id: Id, params?: Record<string, unknown>) =>
      saRequest<ApiListResponse<Record<string, unknown>>>(
        `/departments/${id}/activity${buildQuery(params)}`,
      ),
  },

  hr: {
    dashboard: () => saRequest<Record<string, unknown>>("/hr/dashboard"),
    stats: () => saRequest<Record<string, unknown>>("/hr/dashboard/stats"),
    leave: {
      list: (params?: Record<string, unknown>) =>
        saRequest<ApiListResponse<Record<string, unknown>>>(
          `/hr/leave${buildQuery(params)}`,
        ),
      create: (body: Record<string, unknown>) =>
        saRequest<Record<string, unknown>>("/hr/leave", {
          method: "POST",
          body,
        }),
      approve: (id: Id) =>
        saRequest<void>(`/hr/leave/${id}/approve`, { method: "PATCH" }),
      reject: (id: Id, body?: Record<string, unknown>) =>
        saRequest<void>(`/hr/leave/${id}/reject`, { method: "PATCH", body }),
    },
    promotions: {
      list: (params?: Record<string, unknown>) =>
        saRequest<ApiListResponse<Record<string, unknown>>>(
          `/hr/promotions${buildQuery(params)}`,
        ),
      create: (body: Record<string, unknown>) =>
        saRequest<Record<string, unknown>>("/hr/promotions", {
          method: "POST",
          body,
        }),
      approve: (id: Id) =>
        saRequest<void>(`/hr/promotions/${id}/approve`, { method: "PATCH" }),
      reject: (id: Id, body?: Record<string, unknown>) =>
        saRequest<void>(`/hr/promotions/${id}/reject`, {
          method: "PATCH",
          body,
        }),
    },
    salaryAdjustments: {
      list: (params?: Record<string, unknown>) =>
        saRequest<ApiListResponse<Record<string, unknown>>>(
          `/hr/salary-adjustments${buildQuery(params)}`,
        ),
      create: (body: Record<string, unknown>) =>
        saRequest<Record<string, unknown>>("/hr/salary-adjustments", {
          method: "POST",
          body,
        }),
      approve: (id: Id) =>
        saRequest<void>(`/hr/salary-adjustments/${id}/approve`, {
          method: "PATCH",
        }),
    },
    attendance: {
      list: (params?: Record<string, unknown>) =>
        saRequest<ApiListResponse<Record<string, unknown>>>(
          `/hr/attendance${buildQuery(params)}`,
        ),
      correct: (id: Id, body: Record<string, unknown>) =>
        saRequest<void>(`/hr/attendance/${id}/correct`, {
          method: "PATCH",
          body,
        }),
    },
    reports: (params?: Record<string, unknown>) =>
      saRequest<Record<string, unknown>>(`/hr/reports${buildQuery(params)}`),
    auditLogs: (params?: Record<string, unknown>) =>
      saRequest<ApiListResponse<Record<string, unknown>>>(
        `/hr/audit-logs${buildQuery(params)}`,
      ),
    approvalQueue: (params?: Record<string, unknown>) =>
      saRequest<ApiListResponse<Record<string, unknown>>>(
        `/hr/approval-queue${buildQuery(params)}`,
      ),
  },

  reports: {
    overview: () => saRequest<Record<string, unknown>>("/reports/overview"),
    headcount: (params?: Record<string, unknown>) =>
      saRequest<Record<string, unknown>>(
        `/reports/headcount${buildQuery(params)}`,
      ),
    headcountGrowth: (params?: Record<string, unknown>) =>
      saRequest<Record<string, unknown>>(
        `/reports/headcount-growth${buildQuery(params)}`,
      ),
    attendance: (params?: Record<string, unknown>) =>
      saRequest<Record<string, unknown>>(
        `/reports/attendance${buildQuery(params)}`,
      ),
    attrition: (params?: Record<string, unknown>) =>
      saRequest<Record<string, unknown>>(
        `/reports/attrition${buildQuery(params)}`,
      ),
    departments: (params?: Record<string, unknown>) =>
      saRequest<Record<string, unknown>>(
        `/reports/departments${buildQuery(params)}`,
      ),
    leave: (params?: Record<string, unknown>) =>
      saRequest<Record<string, unknown>>(`/reports/leave${buildQuery(params)}`),
    payroll: (params?: Record<string, unknown>) =>
      saRequest<Record<string, unknown>>(
        `/reports/payroll${buildQuery(params)}`,
      ),
    tasks: (params?: Record<string, unknown>) =>
      saRequest<Record<string, unknown>>(`/reports/tasks${buildQuery(params)}`),
    targets: (params?: Record<string, unknown>) =>
      saRequest<Record<string, unknown>>(
        `/reports/targets${buildQuery(params)}`,
      ),
    promotions: (params?: Record<string, unknown>) =>
      saRequest<Record<string, unknown>>(
        `/reports/promotions${buildQuery(params)}`,
      ),
    salaryIncrements: (params?: Record<string, unknown>) =>
      saRequest<Record<string, unknown>>(
        `/reports/salary-increments${buildQuery(params)}`,
      ),
    expenses: (params?: Record<string, unknown>) =>
      saRequest<Record<string, unknown>>(
        `/reports/expenses${buildQuery(params)}`,
      ),
    purchases: (params?: Record<string, unknown>) =>
      saRequest<Record<string, unknown>>(
        `/reports/purchases${buildQuery(params)}`,
      ),
    bills: (params?: Record<string, unknown>) =>
      saRequest<Record<string, unknown>>(`/reports/bills${buildQuery(params)}`),
    vendors: (params?: Record<string, unknown>) =>
      saRequest<Record<string, unknown>>(
        `/reports/vendors${buildQuery(params)}`,
      ),
    nyscInterns: (params?: Record<string, unknown>) =>
      saRequest<Record<string, unknown>>(
        `/reports/nysc-interns${buildQuery(params)}`,
      ),
    discipline: (params?: Record<string, unknown>) =>
      saRequest<Record<string, unknown>>(
        `/reports/discipline${buildQuery(params)}`,
      ),
    meetings: (params?: Record<string, unknown>) =>
      saRequest<Record<string, unknown>>(
        `/reports/meetings${buildQuery(params)}`,
      ),
    events: (params?: Record<string, unknown>) =>
      saRequest<Record<string, unknown>>(
        `/reports/events${buildQuery(params)}`,
      ),
    announcements: (params?: Record<string, unknown>) =>
      saRequest<Record<string, unknown>>(
        `/reports/announcements${buildQuery(params)}`,
      ),
    dataQuality: (params?: Record<string, unknown>) =>
      saRequest<Record<string, unknown>>(
        `/reports/data-quality${buildQuery(params)}`,
      ),
    custom: (body: Record<string, unknown>) =>
      saRequest<Record<string, unknown>>("/reports/custom", {
        method: "POST",
        body,
      }),
    exportHistory: (params?: Record<string, unknown>) =>
      saRequest<ApiListResponse<Record<string, unknown>>>(
        `/reports/export-history${buildQuery(params)}`,
      ),
    exportPath: (params?: Record<string, unknown>) =>
      `/super-admin/reports/export${buildQuery(params)}`,
    saved: resource("/reports/saved"),
  },

  auditLogs: {
    stats: () => saRequest<Record<string, unknown>>("/audit-logs/stats"),
    exportPath: (params?: Record<string, unknown>) =>
      `/super-admin/audit-logs/export${buildQuery(params)}`,
    list: (params?: Record<string, unknown>) =>
      saRequest<ApiListResponse<Record<string, unknown>>>(
        `/audit-logs${buildQuery(params)}`,
      ),
    get: (id: Id) => saRequest<Record<string, unknown>>(`/audit-logs/${id}`),
    operational: (params?: Record<string, unknown>) =>
      saRequest<ApiListResponse<Record<string, unknown>>>(
        `/audit/operational${buildQuery(params)}`,
      ),
  },

  technicalAuditLogs: {
    list: (params?: Record<string, unknown>) =>
      saRequest<ApiListResponse<Record<string, unknown>>>(
        `/technical-audit-logs${buildQuery(params)}`,
      ),
    search: (params?: Record<string, unknown>) =>
      saRequest<ApiListResponse<Record<string, unknown>>>(
        `/technical-audit-logs/search${buildQuery(params)}`,
      ),
    exportPath: (params?: Record<string, unknown>) =>
      `/super-admin/technical-audit-logs/export${buildQuery(params)}`,
    get: (id: Id) =>
      saRequest<Record<string, unknown>>(`/technical-audit-logs/${id}`),
  },

  security: {
    get: () => saRequest<Record<string, unknown>>("/security"),
    dashboard: () => saRequest<Record<string, unknown>>("/security/dashboard"),
    passwordPolicy: (body: Record<string, unknown>) =>
      saRequest<Record<string, unknown>>("/security/password-policy", {
        method: "PATCH",
        body,
      }),
    mfa: (body: Record<string, unknown>) =>
      saRequest<Record<string, unknown>>("/security/mfa", {
        method: "PATCH",
        body,
      }),
    loginPolicy: (body: Record<string, unknown>) =>
      saRequest<Record<string, unknown>>("/security/login-policy", {
        method: "PATCH",
        body,
      }),
    sessionPolicy: (body: Record<string, unknown>) =>
      saRequest<Record<string, unknown>>("/security/session-policy", {
        method: "PATCH",
        body,
      }),
    maintenance: (body: Record<string, unknown>) =>
      saRequest<Record<string, unknown>>("/security/maintenance", {
        method: "PATCH",
        body,
      }),
    sessions: (params?: Record<string, unknown>) =>
      saRequest<ApiListResponse<Record<string, unknown>>>(
        `/security/sessions${buildQuery(params)}`,
      ),
    revokeSession: (sessionId: Id) =>
      saRequest<void>(`/security/sessions/${sessionId}`, { method: "DELETE" }),
    unlockUser: (userId: Id) =>
      saRequest<void>(`/security/users/${userId}/unlock`, { method: "POST" }),
    revokeUserSessions: (userId: Id) =>
      saRequest<void>(`/security/users/${userId}/revoke-sessions`, {
        method: "POST",
      }),
    loginAttempts: (params?: Record<string, unknown>) =>
      saRequest<ApiListResponse<Record<string, unknown>>>(
        `/security/login-attempts${buildQuery(params)}`,
      ),
    events: (params?: Record<string, unknown>) =>
      saRequest<ApiListResponse<Record<string, unknown>>>(
        `/security/events${buildQuery(params)}`,
      ),
    trustedDevices: (params?: Record<string, unknown>) =>
      saRequest<ApiListResponse<Record<string, unknown>>>(
        `/security/trusted-devices${buildQuery(params)}`,
      ),
    deleteTrustedDevice: (id: Id) =>
      saRequest<void>(`/security/trusted-devices/${id}`, { method: "DELETE" }),
    setUserMfa: (userId: Id, body: Record<string, unknown>) =>
      saRequest<void>(`/security/users/${userId}/mfa`, {
        method: "POST",
        body,
      }),
  },

  emailConfig: {
    get: () => saRequest<Record<string, unknown>>("/email-config"),
    update: (body: Record<string, unknown>) =>
      saRequest<Record<string, unknown>>("/email-config", {
        method: "PUT",
        body,
      }),
    patch: (body: Record<string, unknown>) =>
      saRequest<Record<string, unknown>>("/email-config", {
        method: "PATCH",
        body,
      }),
    test: (body?: Record<string, unknown>) =>
      saRequest<Record<string, unknown>>("/email-config/test", {
        method: "POST",
        body,
      }),
    check: (body?: Record<string, unknown>) =>
      saRequest<Record<string, unknown>>("/email-config/check", {
        method: "POST",
        body,
      }),
    updateStatus: (body: Record<string, unknown>) =>
      saRequest<Record<string, unknown>>("/email-config/status", {
        method: "PATCH",
        body,
      }),
    templates: resource("/email-config/templates"),
    logs: (params?: Record<string, unknown>) =>
      saRequest<ApiListResponse<Record<string, unknown>>>(
        `/email-config/logs${buildQuery(params)}`,
      ),
    queue: (params?: Record<string, unknown>) =>
      saRequest<Record<string, unknown>>(
        `/email-config/queue${buildQuery(params)}`,
      ),
    processQueue: () =>
      saRequest<Record<string, unknown>>("/email-config/queue/process", {
        method: "POST",
      }),
  },

  notificationConfig: {
    get: () => saRequest<Record<string, unknown>>("/notification-config"),
    patchChannels: (body: Record<string, unknown>) =>
      saRequest<Record<string, unknown>>("/notification-config/channels", {
        method: "PATCH",
        body,
      }),
    patchDeliveryPreferences: (body: Record<string, unknown>) =>
      saRequest<Record<string, unknown>>(
        "/notification-config/delivery-preferences",
        { method: "PATCH", body },
      ),
    rules: {
      list: () =>
        saRequest<ApiListResponse<Record<string, unknown>>>(
          "/notification-config/rules",
        ),
      update: (type: string, body: Record<string, unknown>) =>
        saRequest<Record<string, unknown>>(
          `/notification-config/rules/${type}`,
          { method: "PUT", body },
        ),
    },
    logs: (params?: Record<string, unknown>) =>
      saRequest<ApiListResponse<Record<string, unknown>>>(
        `/notification-config/logs${buildQuery(params)}`,
      ),
    queue: (params?: Record<string, unknown>) =>
      saRequest<Record<string, unknown>>(
        `/notification-config/queue${buildQuery(params)}`,
      ),
    processQueue: () =>
      saRequest<Record<string, unknown>>(
        "/notification-config/queue/process",
        { method: "POST" },
      ),
  },

  notifications: {
    list: (params?: Record<string, unknown>) =>
      saRequest<ApiListResponse<Record<string, unknown>>>(
        `/notifications${buildQuery(params)}`,
      ),
    preferences: {
      get: () =>
        saRequest<Record<string, unknown>>("/notifications/preferences"),
      update: (body: Record<string, unknown>) =>
        saRequest<Record<string, unknown>>("/notifications/preferences", {
          method: "PATCH",
          body,
        }),
    },
    markAllRead: () =>
      saRequest<void>("/notifications/read-all", { method: "PATCH" }),
    markRead: (id: Id) =>
      saRequest<void>(`/notifications/${id}/read`, { method: "PATCH" }),
    delete: (id: Id) =>
      saRequest<void>(`/notifications/${id}`, { method: "DELETE" }),
  },

  systemManagement: {
    overview: () =>
      saRequest<Record<string, unknown>>("/system-management/overview"),
    health: () =>
      saRequest<Record<string, unknown>>("/system-management/health"),
    status: () =>
      saRequest<Record<string, unknown>>("/system-management/status"),
    settings: {
      list: () =>
        saRequest<Record<string, unknown>>("/system-management/settings"),
      update: (body: Record<string, unknown>) =>
        saRequest<Record<string, unknown>>("/system-management/settings", {
          method: "PATCH",
          body,
        }),
    },
    maintenance: {
      enable: (body?: Record<string, unknown>) =>
        saRequest<void>("/system-management/maintenance/enable", {
          method: "POST",
          body,
        }),
      disable: () =>
        saRequest<void>("/system-management/maintenance/disable", {
          method: "POST",
        }),
    },
    documentTemplates: resource("/system-management/document-templates"),
    integrations: {
      ...resource("/system-management/integrations"),
      test: (id: Id) =>
        saRequest<Record<string, unknown>>(
          `/system-management/integrations/${id}/test`,
          { method: "POST" },
        ),
    },
  },

  integrations: resource("/integrations"),

  systemHealth: {
    summary: () => saRequest<Record<string, unknown>>("/system-health"),
    services: () =>
      saRequest<ApiListResponse<Record<string, unknown>>>(
        "/system-health/services",
      ),
    infrastructure: () =>
      saRequest<Record<string, unknown>>("/system-health/infrastructure"),
    metrics: () => saRequest<Record<string, unknown>>("/system-health/metrics"),
  },

  backups: {
    ...resource("/backups"),
    settings: {
      get: () => saRequest<Record<string, unknown>>("/backups/settings"),
      update: (body: Record<string, unknown>) =>
        saRequest<Record<string, unknown>>("/backups/settings", {
          method: "PUT",
          body,
        }),
    },
    health: () => saRequest<Record<string, unknown>>("/backups/health"),
    status: (id: Id) =>
      saRequest<Record<string, unknown>>(`/backups/${id}/status`),
    restore: (id: Id, body?: Record<string, unknown>) =>
      saRequest<Record<string, unknown>>(`/backups/${id}/restore`, {
        method: "POST",
        body,
      }),
  },

  employees: resource("/employees"),
  employers: resource("/employers"),
  branches: resource("/employers/branches"),
  interns: resource("/interns"),
  nysc: resource("/nysc"),
  nyscInterns: resource("/nysc-interns"),
  leave: resource("/leave"),
  leaveTypes: resource("/leave/types"),
  promotions: resource("/promotions"),
  salaryIncrements: resource("/salary-increments"),
  meetings: resource("/meetings"),
  meetingTypes: resource("/meeting-types"),
  meetingRooms: resource("/meeting-rooms"),
  tasks: resource("/tasks"),
  targets: resource("/targets"),
  payroll: resource("/payroll"),
  salaries: resource("/salaries"),
  purchaseRequests: resource("/purchase-requests"),
  purchaseOrders: resource("/purchase-orders"),
  receipts: resource("/receipts"),
  bills: resource("/bills"),
  expenses: resource("/expenses"),
  expensePolicies: resource("/expense-policies"),
  events: resource("/events"),
  discipline: resource("/discipline"),
  announcements: resource("/announcements"),
  purchases: resource("/purchases"),
  vendors: resource("/vendors"),
  documents: resource("/documents"),
  operationalAudit: resource("/operational-audit"),
  help: resource("/help"),
  lookups: {
    hods: () =>
      saRequest<ApiListResponse<Record<string, unknown>>>("/lookups/hods"),
    employees: () =>
      saRequest<ApiListResponse<Record<string, unknown>>>("/lookups/employees"),
  },
};
