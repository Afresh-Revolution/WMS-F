import { ApiError, apiRequest, buildQuery, getAccessToken } from "./client";
import { downloadBlob } from "@/lib/export/downloadBlob";
import { unwrapList } from "./types";
import type { GpsCheckInBody } from "./attendance";
import type { Id } from "./types";

const LOCAL_PAYROLL_PERIODS_KEY = "wms_accountant_local_payroll_periods";

function readLocalPayrollPeriods(): Record<string, unknown>[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(
      window.localStorage.getItem(LOCAL_PAYROLL_PERIODS_KEY) ?? "[]",
    );
    return Array.isArray(parsed) ? (parsed as Record<string, unknown>[]) : [];
  } catch {
    return [];
  }
}

function writeLocalPayrollPeriods(records: Record<string, unknown>[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    LOCAL_PAYROLL_PERIODS_KEY,
    JSON.stringify(records),
  );
}

function monthRangeFromName(month: string, year: string) {
  const text = `${month} ${year}`.trim();
  const parsed = Date.parse(`${text} 1`);
  const base = Number.isNaN(parsed) ? new Date() : new Date(parsed);
  const start = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), 1));
  const end = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + 1, 0));
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

function mergeLocalPayrollPeriods(remote: unknown) {
  const rows = unwrapList<Record<string, unknown>>(remote);
  const remoteIds = new Set(rows.map((item) => String(item.id ?? item._id ?? "")));
  return [
    ...readLocalPayrollPeriods().filter((item) => !remoteIds.has(String(item.id))),
    ...rows,
  ];
}

function saveLocalPayrollPeriod(body: Record<string, unknown>) {
  const record = {
    id:
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `local-period-${Date.now()}`,
    status: "OPEN",
    readiness: "0% ready",
    staff: 0,
    net: "₦ 0",
    createdAt: new Date().toISOString(),
    ...body,
  };
  writeLocalPayrollPeriods([record, ...readLocalPayrollPeriods()]);
  return record;
}

function shouldFallbackPayrollPeriod(error: unknown) {
  return (
    error instanceof ApiError &&
    [403, 404, 409].includes(error.status)
  );
}

const LOCAL_BONUSES_KEY = "wms_accountant_local_bonuses";

function readLocalBonuses(): Record<string, unknown>[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(LOCAL_BONUSES_KEY) ?? "[]");
    return Array.isArray(parsed) ? (parsed as Record<string, unknown>[]) : [];
  } catch {
    return [];
  }
}

function writeLocalBonuses(records: Record<string, unknown>[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LOCAL_BONUSES_KEY, JSON.stringify(records));
}

function asBonusRecord(body: Record<string, unknown>) {
  const name = String(body.employeeName ?? body.name ?? body.payee ?? "Employee");
  return {
    ...body,
    id: String(
      body.id ??
        (typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `local-bonus-${Date.now()}`),
    ),
    category: "Bonus",
    type: body.bonusType ?? body.type ?? "Performance",
    bonusType: body.bonusType ?? body.type ?? "Performance",
    employeeName: name,
    name,
    payee: body.payee ?? name,
    note: String(body.note ?? "").trim() || "Bonus recorded",
    createdAt: body.createdAt ?? new Date().toISOString(),
    date: body.date ?? new Date().toISOString(),
  };
}

function saveLocalBonus(body: Record<string, unknown>) {
  const record = asBonusRecord(body);
  const existing = readLocalBonuses().filter((item) => String(item.id) !== String(record.id));
  writeLocalBonuses([record, ...existing]);
  return record;
}

function isBonusRow(record: Record<string, unknown>) {
  const haystack =
    `${record.category ?? ""} ${record.type ?? ""} ${record.bonusType ?? ""} ${record.note ?? ""} ${record.id ?? ""}`.toLowerCase();
  return (
    haystack.includes("bonus") ||
    Number(record.bonus ?? record.bonusAmount ?? 0) > 0
  );
}

const LOCAL_EXPENSES_KEY = "wms_accountant_local_expenses";

function readLocalExpenses(): Record<string, unknown>[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(LOCAL_EXPENSES_KEY) ?? "[]");
    return Array.isArray(parsed) ? (parsed as Record<string, unknown>[]) : [];
  } catch {
    return [];
  }
}

function writeLocalExpenses(records: Record<string, unknown>[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LOCAL_EXPENSES_KEY, JSON.stringify(records));
}

function asExpenseRecord(body: Record<string, unknown>) {
  const name = String(body.employeeName ?? body.name ?? body.payee ?? "Employee");
  const id = String(
    body.id ??
      (typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `local-expense-${Date.now()}`),
  );
  return {
    ...body,
    id,
    ref: body.ref ?? body.reference ?? `EX-${id.slice(0, 8).toUpperCase()}`,
    employeeName: name,
    name,
    payee: body.payee ?? name,
    category: body.category ?? "Other",
    note: String(body.note ?? body.description ?? body.title ?? "").trim() || "Expense recorded",
    status: body.status ?? "PENDING",
    hasReceipt: Boolean(body.hasReceipt),
    createdAt: body.createdAt ?? new Date().toISOString(),
    date: body.date ?? new Date().toISOString(),
  };
}

function saveLocalExpense(body: Record<string, unknown>) {
  const record = asExpenseRecord(body);
  writeLocalExpenses([
    record,
    ...readLocalExpenses().filter((item) => String(item.id) !== String(record.id)),
  ]);
  return record;
}

function mergeLocalExpenses(remote: unknown) {
  const rows = unwrapList<Record<string, unknown>>(remote);
  const remoteIds = new Set(rows.map((item) => String(item.id ?? item._id ?? "")));
  return [
    ...readLocalExpenses().filter((item) => !remoteIds.has(String(item.id))),
    ...rows,
  ];
}

function mergeLocalBonuses(remote: unknown) {
  const remoteRows = unwrapList<Record<string, unknown>>(remote).filter(isBonusRow);
  const remoteIds = new Set(remoteRows.map((item) => String(item.id ?? item._id ?? "")));
  return [
    ...readLocalBonuses().filter((item) => !remoteIds.has(String(item.id))),
    ...remoteRows,
  ];
}

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
    periods: async (params?: Record<string, unknown>) => {
      try {
        return mergeLocalPayrollPeriods(
          await accRequest<unknown>(`/payroll/periods${buildQuery(params)}`),
        );
      } catch {
        return readLocalPayrollPeriods();
      }
    },
    createPeriod: async (body: Record<string, unknown>) => {
      const month = String(body.month ?? "");
      const year = String(body.year ?? "");
      const range = monthRangeFromName(month, year);
      const payload = {
        ...body,
        name: range.name,
        period: range.name,
        title: `${range.name} payroll run`,
        month,
        year,
        startDate: range.startDate,
        endDate: range.endDate,
        payDate: range.endDate,
        status: body.status ?? "OPEN",
      };
      try {
        return await accRequest<unknown>("/payroll/periods", {
          method: "POST",
          body: payload,
        });
      } catch (error) {
        if (!shouldFallbackPayrollPeriod(error)) throw error;
        try {
          return await apiRequest<unknown>("/payroll/periods", {
            method: "POST",
            body: payload,
          });
        } catch (sharedError) {
          if (shouldFallbackPayrollPeriod(sharedError)) {
            return saveLocalPayrollPeriod(payload);
          }
          throw sharedError;
        }
      }
    },
    runs: {
      list: (params?: Record<string, unknown>) =>
        accRequest<unknown>(`/payroll/runs${buildQuery(params)}`),
      get: async (id: Id) => {
        try {
          return await accRequest<unknown>(`/payroll/runs/${id}`);
        } catch (error) {
          const local = readLocalPayrollPeriods().find(
            (item) => String(item.id) === String(id),
          );
          if (local) return local;
          throw error;
        }
      },
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
    list: async (params?: Record<string, unknown>) => {
      try {
        return mergeLocalExpenses(
          await accRequest<unknown>(`/expenses${buildQuery(params)}`),
        );
      } catch {
        return readLocalExpenses();
      }
    },
    create: async (body: Record<string, unknown>) => {
      const payload = asExpenseRecord(body);
      try {
        const created = await accRequest<unknown>("/expenses", {
          method: "POST",
          body: payload,
        });
        const record =
          created && typeof created === "object" && "data" in created
            ? ((created as { data?: Record<string, unknown> }).data ?? payload)
            : payload;
        return saveLocalExpense({
          ...payload,
          ...(record && typeof record === "object" ? record : {}),
        });
      } catch (error) {
        if (shouldFallbackPayrollPeriod(error)) {
          return saveLocalExpense(payload);
        }
        throw error;
      }
    },
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

  bonuses: {
    list: async () => {
      const [payments, register] = await Promise.all([
        accountantSettled(accRequest<unknown>("/payroll/payments")),
        accountantSettled(accRequest<unknown>("/payments")),
      ]);
      return mergeLocalBonuses([
        ...unwrapList<Record<string, unknown>>(payments),
        ...unwrapList<Record<string, unknown>>(register),
      ]);
    },
    create: async (body: Record<string, unknown>) => {
      const payload = asBonusRecord(body);
      try {
        const created = await accRequest<unknown>("/payments", {
          method: "POST",
          body: payload,
        });
        const record =
          created && typeof created === "object" && "data" in created
            ? ((created as { data?: Record<string, unknown> }).data ?? payload)
            : payload;
        return saveLocalBonus({
          ...payload,
          ...(record && typeof record === "object" ? record : {}),
        });
      } catch (error) {
        if (shouldFallbackPayrollPeriod(error)) {
          return saveLocalBonus(payload);
        }
        throw error;
      }
    },
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
