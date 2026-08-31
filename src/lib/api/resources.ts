import { apiRequest, buildQuery } from "./client";
import type { ApiListResponse, Id } from "./types";

/** Operational dashboard modules using the shared resource router pattern */
export type ResourceModule =
  | "employers"
  | "employers/branches"
  | "employees"
  | "interns"
  | "nysc"
  | "leave/types"
  | "salary-increments"
  | "promotions"
  | "tasks"
  | "vendors"
  | "settings"
  | "documents"
  | "operational-audit"
  | "help"
  | "leave"
  | "meetings"
  | "meeting-types"
  | "meeting-rooms"
  | "targets"
  | "payroll"
  | "salaries"
  | "purchase-requests"
  | "purchase-orders"
  | "receipts"
  | "bills"
  | "expenses"
  | "expense-policies"
  | "events"
  | "discipline"
  | "nysc-interns"
  | "announcements"
  | "purchases"
  | "departments";

export function createResourceApi(module: ResourceModule) {
  const base = `/${module}`;

  return {
    list: (params?: Record<string, unknown>) =>
      apiRequest<ApiListResponse<Record<string, unknown>>>(
        `${base}${buildQuery(params)}`,
      ),

    create: (body: Record<string, unknown>) =>
      apiRequest<Record<string, unknown>>(base, { method: "POST", body }),

    get: (id: Id) =>
      apiRequest<Record<string, unknown>>(`${base}/${id}`),

    patch: (id: Id, body: Record<string, unknown>) =>
      apiRequest<Record<string, unknown>>(`${base}/${id}`, {
        method: "PATCH",
        body,
      }),

    delete: (id: Id) =>
      apiRequest<void>(`${base}/${id}`, { method: "DELETE" }),

    action: (id: Id, action: string, body?: Record<string, unknown>) =>
      apiRequest<Record<string, unknown>>(`${base}/${id}/${action}`, {
        method: "POST",
        body,
      }),

    getAction: (id: Id, action: string, params?: Record<string, unknown>) =>
      apiRequest<Record<string, unknown>>(
        `${base}/${id}/${action}${buildQuery(params)}`,
      ),

    collectionAction: (
      action: string,
      body?: Record<string, unknown>,
      params?: Record<string, unknown>,
    ) =>
      apiRequest<Record<string, unknown>>(
        `${base}/${action}${buildQuery(params)}`,
        { method: "POST", body },
      ),
  };
}

/** Pre-built resource APIs for primary operational modules */
export const employersApi = createResourceApi("employers");
export const branchesApi = createResourceApi("employers/branches");
export const employeesApi = createResourceApi("employees");
export const internsApi = createResourceApi("interns");
export const nyscApi = createResourceApi("nysc");
export const leaveTypesApi = createResourceApi("leave/types");
export const salaryIncrementsApi = createResourceApi("salary-increments");
export const promotionsApi = createResourceApi("promotions");
export const tasksApi = createResourceApi("tasks");
export const vendorsApi = createResourceApi("vendors");
export const settingsApi = createResourceApi("settings");
export const documentsApi = createResourceApi("documents");
export const operationalAuditApi = createResourceApi("operational-audit");
export const helpApi = createResourceApi("help");
export const leaveApi = createResourceApi("leave");
export const meetingsApi = createResourceApi("meetings");
export const meetingTypesApi = createResourceApi("meeting-types");
export const meetingRoomsApi = createResourceApi("meeting-rooms");
export const targetsApi = createResourceApi("targets");
export const payrollApi = createResourceApi("payroll");
export const salariesApi = createResourceApi("salaries");
export const purchaseRequestsApi = createResourceApi("purchase-requests");
export const purchaseOrdersApi = createResourceApi("purchase-orders");
export const receiptsApi = createResourceApi("receipts");
export const billsApi = createResourceApi("bills");
export const expensesApi = createResourceApi("expenses");
export const expensePoliciesApi = createResourceApi("expense-policies");
export const eventsApi = createResourceApi("events");
export const disciplineApi = createResourceApi("discipline");
export const nyscInternsApi = createResourceApi("nysc-interns");
export const announcementsApi = createResourceApi("announcements");
export const purchasesApi = createResourceApi("purchases");
