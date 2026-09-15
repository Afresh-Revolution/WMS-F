import { apiRequest, buildQuery } from "./client";
import type { GpsCheckInBody } from "./attendance";
import type { Id } from "./types";

const BASE = "/accountant";

function downloadBlob(content: unknown, filename: string, mime = "text/csv;charset=utf-8;") {
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

export async function accountantSettled<T>(promise: Promise<T>): Promise<T | null> {
  try {
    return await promise;
  } catch {
    return null;
  }
}

export const accountantApi = {
  scope: () => apiRequest<unknown>(`${BASE}/scope`),

  dashboard: () => apiRequest<unknown>(`${BASE}/dashboard`),

  dashboardStats: () => apiRequest<unknown>(`${BASE}/dashboard/stats`),

  profile: {
    get: () => apiRequest<unknown>(`${BASE}/profile`),
    patch: (body: Record<string, unknown>) =>
      apiRequest<unknown>(`${BASE}/profile`, { method: "PATCH", body }),
    put: (body: Record<string, unknown>) =>
      apiRequest<unknown>(`${BASE}/profile`, { method: "PUT", body }),
  },

  employmentRecord: {
    get: () => apiRequest<unknown>(`${BASE}/employment-record`),
    documents: () =>
      apiRequest<unknown>(`${BASE}/employment-record/documents`),
    patch: (body: Record<string, unknown>) =>
      apiRequest<unknown>(`${BASE}/employment-record`, {
        method: "PATCH",
        body,
      }),
    put: (body: Record<string, unknown>) =>
      apiRequest<unknown>(`${BASE}/employment-record`, {
        method: "PUT",
        body,
      }),
  },

  settings: {
    get: () => apiRequest<unknown>(`${BASE}/settings`),
    patch: (body: Record<string, unknown>) =>
      apiRequest<unknown>(`${BASE}/settings`, { method: "PATCH", body }),
  },

  helpCenter: () => apiRequest<unknown>(`${BASE}/help-center`),

  payroll: {
    list: (params?: Record<string, unknown>) =>
      apiRequest<unknown>(`${BASE}/payroll${buildQuery(params)}`),
    dashboard: () => apiRequest<unknown>(`${BASE}/payroll/dashboard`),
    periods: (params?: Record<string, unknown>) =>
      apiRequest<unknown>(`${BASE}/payroll/periods${buildQuery(params)}`),
    runs: {
      list: (params?: Record<string, unknown>) =>
        apiRequest<unknown>(`${BASE}/payroll/runs${buildQuery(params)}`),
      get: (id: Id) => apiRequest<unknown>(`${BASE}/payroll/runs/${id}`),
      items: (id: Id, params?: Record<string, unknown>) =>
        apiRequest<unknown>(
          `${BASE}/payroll/runs/${id}/items${buildQuery(params)}`,
        ),
    },
    payments: (params?: Record<string, unknown>) =>
      apiRequest<unknown>(`${BASE}/payroll/payments${buildQuery(params)}`),
    payslips: (params?: Record<string, unknown>) =>
      apiRequest<unknown>(`${BASE}/payroll/payslips${buildQuery(params)}`),
    deductions: {
      list: (params?: Record<string, unknown>) =>
        apiRequest<unknown>(
          `${BASE}/payroll/deductions${buildQuery(params)}`,
        ),
      create: (body: Record<string, unknown>) =>
        apiRequest<unknown>(`${BASE}/payroll/deductions`, {
          method: "POST",
          body,
        }),
      patch: (id: Id, body: Record<string, unknown>) =>
        apiRequest<unknown>(`${BASE}/payroll/deductions/${id}`, {
          method: "PATCH",
          body,
        }),
    },
  },

  salaryImplementations: {
    list: (params?: Record<string, unknown>) =>
      apiRequest<unknown>(
        `${BASE}/salary-implementations${buildQuery(params)}`,
      ),
    create: (body: Record<string, unknown>) =>
      apiRequest<unknown>(`${BASE}/salary-implementations`, {
        method: "POST",
        body,
      }),
    implement: (id: Id) =>
      apiRequest<unknown>(`${BASE}/salary-implementations/${id}/implement`, {
        method: "PATCH",
      }),
  },

  purchaseRequests: {
    list: (params?: Record<string, unknown>) =>
      apiRequest<unknown>(`${BASE}/purchase-requests${buildQuery(params)}`),
  },

  purchaseOrders: {
    list: (params?: Record<string, unknown>) =>
      apiRequest<unknown>(`${BASE}/purchase-orders${buildQuery(params)}`),
    recordPayment: (id: Id, body?: Record<string, unknown>) =>
      apiRequest<unknown>(`${BASE}/purchase-orders/${id}/payments`, {
        method: "POST",
        body,
      }),
  },

  bills: {
    list: (params?: Record<string, unknown>) =>
      apiRequest<unknown>(`${BASE}/bills${buildQuery(params)}`),
    create: (body: Record<string, unknown>) =>
      apiRequest<unknown>(`${BASE}/bills`, { method: "POST", body }),
    get: (id: Id) => apiRequest<unknown>(`${BASE}/bills/${id}`),
    patch: (id: Id, body: Record<string, unknown>) =>
      apiRequest<unknown>(`${BASE}/bills/${id}`, { method: "PATCH", body }),
    recordPayment: (id: Id, body?: Record<string, unknown>) =>
      apiRequest<unknown>(`${BASE}/bills/${id}/payments`, {
        method: "POST",
        body,
      }),
  },

  invoices: {
    list: (params?: Record<string, unknown>) =>
      apiRequest<unknown>(`${BASE}/invoices${buildQuery(params)}`),
    create: (body: Record<string, unknown>) =>
      apiRequest<unknown>(`${BASE}/invoices`, { method: "POST", body }),
    patch: (id: Id, body: Record<string, unknown>) =>
      apiRequest<unknown>(`${BASE}/invoices/${id}`, {
        method: "PATCH",
        body,
      }),
  },

  expenses: {
    list: (params?: Record<string, unknown>) =>
      apiRequest<unknown>(`${BASE}/expenses${buildQuery(params)}`),
    reimburse: (id: Id, body?: Record<string, unknown>) =>
      apiRequest<unknown>(`${BASE}/expenses/${id}/reimburse`, {
        method: "POST",
        body,
      }),
  },

  vendors: {
    list: (params?: Record<string, unknown>) =>
      apiRequest<unknown>(`${BASE}/vendors${buildQuery(params)}`),
    get: (id: Id) => apiRequest<unknown>(`${BASE}/vendors/${id}`),
  },

  payments: {
    list: (params?: Record<string, unknown>) =>
      apiRequest<unknown>(`${BASE}/payments${buildQuery(params)}`),
    create: (body: Record<string, unknown>) =>
      apiRequest<unknown>(`${BASE}/payments`, { method: "POST", body }),
    reconcile: (id: Id, body?: Record<string, unknown>) =>
      apiRequest<unknown>(`${BASE}/payments/${id}/reconcile`, {
        method: "PATCH",
        body,
      }),
    export: async (params?: Record<string, unknown>) => {
      const payload = await apiRequest<unknown>(
        `${BASE}/payments/export${buildQuery(params)}`,
      );
      downloadBlob(payload, "accountant-payments.csv");
      return payload;
    },
  },

  reports: {
    get: (params?: Record<string, unknown>) =>
      apiRequest<unknown>(`${BASE}/reports${buildQuery(params)}`),
    summary: (params?: Record<string, unknown>) =>
      apiRequest<unknown>(`${BASE}/reports/summary${buildQuery(params)}`),
    export: async (params?: Record<string, unknown>) => {
      const payload = await apiRequest<unknown>(
        `${BASE}/reports/export${buildQuery(params)}`,
      );
      downloadBlob(payload, "accountant-finance-report.csv");
      return payload;
    },
  },

  notifications: {
    list: (params?: Record<string, unknown>) =>
      apiRequest<unknown>(`${BASE}/notifications${buildQuery(params)}`),
    markRead: (id: Id) =>
      apiRequest<unknown>(`${BASE}/notifications/${id}/read`, {
        method: "PATCH",
      }),
  },

  attendance: {
    locations: () => apiRequest<unknown>(`${BASE}/attendance/locations`),
    status: () => apiRequest<unknown>(`${BASE}/attendance/status`),
    checkIn: (body: GpsCheckInBody, idempotencyKey?: string) =>
      apiRequest<unknown>(`${BASE}/attendance/check-in`, {
        method: "POST",
        body,
        headers: idempotencyKey
          ? { "Idempotency-Key": idempotencyKey }
          : undefined,
      }),
    history: (params?: Record<string, unknown>) =>
      apiRequest<unknown>(`${BASE}/attendance/history${buildQuery(params)}`),
  },

  auditLogs: {
    list: (params?: Record<string, unknown>) =>
      apiRequest<unknown>(`${BASE}/audit-logs${buildQuery(params)}`),
  },
};
