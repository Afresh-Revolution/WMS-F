import { ApiError, apiRequest, buildQuery, getAccessToken } from "./client";
import { downloadBlob } from "@/lib/export/downloadBlob";
import type { GpsCheckInBody } from "./attendance";
import type { Id } from "./types";

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  auth?: boolean;
  root?: boolean;
};

export async function accRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  try {
    return await apiRequest<T>(`/accountant${normalized}`, options);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      return await apiRequest<T>(`/api/accountant${normalized}`, {
        ...options,
        root: true,
      });
    }
    throw err;
  }
}

export async function accountantSettled<T>(promise: Promise<T>): Promise<T | null> {
  try {
    return await promise;
  } catch {
    return null;
  }
}

async function accExport(path: string, filename: string) {
  const token = getAccessToken();
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const candidates = [
    `/api/v1/accountant${normalized}`,
    `/api/accountant${normalized}`,
  ];
  let response: Response | null = null;
  for (const url of candidates) {
    response = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (response.ok || response.status !== 404) break;
  }
  if (!response?.ok) {
    throw new Error(response?.statusText || "Export failed");
  }
  downloadBlob(await response.blob(), filename);
}

export const accountantApi = {
  scope: () => accRequest<unknown>("/scope"),

  dashboard: () => accRequest<unknown>("/dashboard"),

  dashboardStats: () => accRequest<unknown>("/dashboard/stats"),

  profile: {
    get: () => accRequest<unknown>("/profile"),
    patch: (body: Record<string, unknown>) =>
      accRequest<unknown>("/profile", { method: "PATCH", body }),
    put: (body: Record<string, unknown>) =>
      accRequest<unknown>("/profile", { method: "PUT", body }),
  },

  employmentRecord: {
    get: () => accRequest<unknown>("/employment-record"),
    documents: () => accRequest<unknown>("/employment-record/documents"),
    patch: (body: Record<string, unknown>) =>
      accRequest<unknown>("/employment-record", { method: "PATCH", body }),
    put: (body: Record<string, unknown>) =>
      accRequest<unknown>("/employment-record", { method: "PUT", body }),
  },

  settings: {
    get: () => accRequest<unknown>("/settings"),
    patch: (body: Record<string, unknown>) =>
      accRequest<unknown>("/settings", { method: "PATCH", body }),
  },

  helpCenter: () => accRequest<unknown>("/help-center"),

  payroll: {
    list: (params?: Record<string, unknown>) =>
      accRequest<unknown>(`/payroll${buildQuery(params)}`),
    dashboard: () => accRequest<unknown>("/payroll/dashboard"),
    periods: (params?: Record<string, unknown>) =>
      accRequest<unknown>(`/payroll/periods${buildQuery(params)}`),
    createPeriod: (body: Record<string, unknown>) =>
      accRequest<unknown>("/payroll/periods", { method: "POST", body }),
    runs: {
      list: (params?: Record<string, unknown>) =>
        accRequest<unknown>(`/payroll/runs${buildQuery(params)}`),
      get: (id: Id) => accRequest<unknown>(`/payroll/runs/${id}`),
      items: (id: Id, params?: Record<string, unknown>) =>
        accRequest<unknown>(`/payroll/runs/${id}/items${buildQuery(params)}`),
      patch: (id: Id, body: Record<string, unknown>) =>
        accRequest<unknown>(`/payroll/runs/${id}`, { method: "PATCH", body }),
    },
    payments: (params?: Record<string, unknown>) =>
      accRequest<unknown>(`/payroll/payments${buildQuery(params)}`),
    payslips: (params?: Record<string, unknown>) =>
      accRequest<unknown>(`/payroll/payslips${buildQuery(params)}`),
    deductions: {
      list: (params?: Record<string, unknown>) =>
        accRequest<unknown>(`/payroll/deductions${buildQuery(params)}`),
      create: (body: Record<string, unknown>) =>
        accRequest<unknown>("/payroll/deductions", { method: "POST", body }),
      patch: (id: Id, body: Record<string, unknown>) =>
        accRequest<unknown>(`/payroll/deductions/${id}`, {
          method: "PATCH",
          body,
        }),
    },
  },

  salaryImplementations: {
    list: (params?: Record<string, unknown>) =>
      accRequest<unknown>(`/salary-implementations${buildQuery(params)}`),
    create: (body: Record<string, unknown>) =>
      accRequest<unknown>("/salary-implementations", { method: "POST", body }),
    implement: (id: Id) =>
      accRequest<unknown>(`/salary-implementations/${id}/implement`, {
        method: "PATCH",
      }),
  },

  purchaseRequests: {
    list: (params?: Record<string, unknown>) =>
      accRequest<unknown>(`/purchase-requests${buildQuery(params)}`),
  },

  purchaseOrders: {
    list: (params?: Record<string, unknown>) =>
      accRequest<unknown>(`/purchase-orders${buildQuery(params)}`),
    recordPayment: (id: Id, body?: Record<string, unknown>) =>
      accRequest<unknown>(`/purchase-orders/${id}/payments`, {
        method: "POST",
        body,
      }),
  },

  bills: {
    list: (params?: Record<string, unknown>) =>
      accRequest<unknown>(`/bills${buildQuery(params)}`),
    create: (body: Record<string, unknown>) =>
      accRequest<unknown>("/bills", { method: "POST", body }),
    get: (id: Id) => accRequest<unknown>(`/bills/${id}`),
    patch: (id: Id, body: Record<string, unknown>) =>
      accRequest<unknown>(`/bills/${id}`, { method: "PATCH", body }),
    recordPayment: (id: Id, body?: Record<string, unknown>) =>
      accRequest<unknown>(`/bills/${id}/payments`, { method: "POST", body }),
  },

  invoices: {
    list: (params?: Record<string, unknown>) =>
      accRequest<unknown>(`/invoices${buildQuery(params)}`),
    create: (body: Record<string, unknown>) =>
      accRequest<unknown>("/invoices", { method: "POST", body }),
    patch: (id: Id, body: Record<string, unknown>) =>
      accRequest<unknown>(`/invoices/${id}`, { method: "PATCH", body }),
  },

  expenses: {
    list: (params?: Record<string, unknown>) =>
      accRequest<unknown>(`/expenses${buildQuery(params)}`),
    reimburse: (id: Id, body?: Record<string, unknown>) =>
      accRequest<unknown>(`/expenses/${id}/reimburse`, {
        method: "POST",
        body,
      }),
  },

  vendors: {
    list: (params?: Record<string, unknown>) =>
      accRequest<unknown>(`/vendors${buildQuery(params)}`),
    get: (id: Id) => accRequest<unknown>(`/vendors/${id}`),
  },

  payments: {
    list: (params?: Record<string, unknown>) =>
      accRequest<unknown>(`/payments${buildQuery(params)}`),
    create: (body: Record<string, unknown>) =>
      accRequest<unknown>("/payments", { method: "POST", body }),
    reconcile: (id: Id, body?: Record<string, unknown>) =>
      accRequest<unknown>(`/payments/${id}/reconcile`, {
        method: "PATCH",
        body,
      }),
    export: (params?: Record<string, unknown>) =>
      accExport(`/payments/export${buildQuery(params)}`, "accountant-payments.csv"),
  },

  reports: {
    get: (params?: Record<string, unknown>) =>
      accRequest<unknown>(`/reports${buildQuery(params)}`),
    summary: (params?: Record<string, unknown>) =>
      accRequest<unknown>(`/reports/summary${buildQuery(params)}`),
    export: (params?: Record<string, unknown>) =>
      accExport(`/reports/export${buildQuery(params)}`, "accountant-finance-report.csv"),
  },

  notifications: {
    list: (params?: Record<string, unknown>) =>
      accRequest<unknown>(`/notifications${buildQuery(params)}`),
    markRead: (id: Id) =>
      accRequest<unknown>(`/notifications/${id}/read`, { method: "PATCH" }),
  },

  attendance: {
    locations: () => accRequest<unknown>("/attendance/locations"),
    status: () => accRequest<unknown>("/attendance/status"),
    checkIn: (body: GpsCheckInBody, idempotencyKey?: string) =>
      accRequest<unknown>("/attendance/check-in", {
        method: "POST",
        body,
        headers: idempotencyKey
          ? { "Idempotency-Key": idempotencyKey }
          : undefined,
      }),
    history: (params?: Record<string, unknown>) =>
      accRequest<unknown>(`/attendance/history${buildQuery(params)}`),
  },

  auditLogs: {
    list: (params?: Record<string, unknown>) =>
      accRequest<unknown>(`/audit-logs${buildQuery(params)}`),
  },
};
