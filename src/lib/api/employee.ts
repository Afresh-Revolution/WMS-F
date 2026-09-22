import { apiRequest, buildQuery } from "./client";
import type { Id } from "./types";

export type EmployeeListParams = Record<string, unknown>;
export type EmployeeRecord = Record<string, unknown>;
export type EmployeeMutationBody = Record<string, unknown>;

function employeePath(path: string, query?: EmployeeListParams) {
  return `/employee${path}${buildQuery(query)}`;
}

function unwrapData<T>(payload: unknown): T {
  if (payload && typeof payload === "object" && "data" in payload) {
    return (payload as { data: T }).data;
  }
  return payload as T;
}

function unwrapCollection(
  payload: unknown,
  keys: string[],
): EmployeeRecord[] {
  const value = unwrapData<unknown>(payload);
  if (Array.isArray(value)) return value as EmployeeRecord[];
  if (!value || typeof value !== "object") return [];
  const record = value as EmployeeRecord;
  for (const key of keys) {
    const collection = record[key];
    if (Array.isArray(collection)) return collection as EmployeeRecord[];
  }
  return [];
}

function get(path: string, query?: EmployeeListParams) {
  return apiRequest<unknown>(employeePath(path, query)).then(unwrapData);
}

function list(
  path: string,
  keys: string[],
  query?: EmployeeListParams,
) {
  return apiRequest<unknown>(employeePath(path, query)).then((payload) =>
    unwrapCollection(payload, keys),
  );
}

function mutate(
  path: string,
  method: "POST" | "PUT" | "PATCH" | "DELETE",
  body?: EmployeeMutationBody,
) {
  return apiRequest<unknown>(employeePath(path), { method, body }).then(
    unwrapData,
  );
}

export const employeeApi = {
  getScope() {
    return get("/scope");
  },

  getDashboard(query?: EmployeeListParams) {
    return get("/dashboard", query);
  },

  getEmploymentRecord() {
    return get("/employment-record");
  },

  getProfile() {
    return get("/profile");
  },

  updateProfile(body: EmployeeMutationBody) {
    return mutate("/profile", "PATCH", body);
  },

  getSettings() {
    return get("/settings");
  },

  updateSettings(body: EmployeeMutationBody) {
    return mutate("/settings", "PATCH", body);
  },

  listTasks(query?: EmployeeListParams) {
    return list("/tasks", ["tasks", "items", "records"], query);
  },

  getTask(id: Id) {
    return get(`/tasks/${id}`);
  },

  updateTask(id: Id, body: EmployeeMutationBody) {
    return mutate(`/tasks/${id}`, "PATCH", body);
  },

  updateTaskProgress(id: Id, body: EmployeeMutationBody) {
    return mutate(`/tasks/${id}/progress`, "PATCH", body);
  },

  listMeetings(query?: EmployeeListParams) {
    return list("/meetings", ["meetings", "items", "records"], query);
  },

  getMeeting(id: Id) {
    return get(`/meetings/${id}`);
  },

  listExpenses(query?: EmployeeListParams) {
    return list("/expenses", ["expenses", "claims", "items", "records"], query);
  },

  createExpense(body: EmployeeMutationBody) {
    return mutate("/expenses", "POST", body);
  },

  getExpense(id: Id) {
    return get(`/expenses/${id}`);
  },

  updateExpense(id: Id, body: EmployeeMutationBody) {
    return mutate(`/expenses/${id}`, "PATCH", body);
  },

  submitExpense(id: Id, body: EmployeeMutationBody = {}) {
    return mutate(`/expenses/${id}/submit`, "POST", body);
  },

  cancelExpense(id: Id, body: EmployeeMutationBody = {}) {
    return mutate(`/expenses/${id}/cancel`, "POST", body);
  },

  listLeave(query?: EmployeeListParams) {
    return list("/leave", ["requests", "items", "records"], query);
  },

  listLeaveBalances(query?: EmployeeListParams) {
    return list("/leave/balances", ["balances", "items", "records"], query);
  },

  listNotifications(query?: EmployeeListParams) {
    return list(
      "/notifications",
      ["notifications", "items", "records"],
      query,
    );
  },

  markNotificationRead(id: Id) {
    return mutate(`/notifications/${id}/read`, "PATCH");
  },

  listRecords() {
    return get("/records");
  },

  listPerformance(query?: EmployeeListParams) {
    return list(
      "/performance",
      ["reviews", "items", "records"],
      query,
    );
  },
};
