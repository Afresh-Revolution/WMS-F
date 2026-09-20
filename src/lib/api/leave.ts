import { ApiError, apiRequest, buildQuery } from "./client";
import { unwrapList, unwrapRecord } from "./types";
import { readCachedOrJwtUser } from "@/lib/currentUser";
import { readCachedWorkspace } from "@/lib/workspace";

function str(value: unknown, fallback = ""): string {
  if (value === null || value === undefined) return fallback;
  return String(value);
}

function num(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function asObject(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function accountKind(): "employee" | "staff" | "unknown" {
  const role = `${readCachedWorkspace()?.roleKey ?? ""} ${readCachedOrJwtUser()?.role ?? ""}`
    .toLowerCase()
    .replace(/[\s-]+/g, "_")
    .trim();
  if (!role) return "unknown";
  if (
    role.includes("super_admin") ||
    role.includes("superadmin") ||
    role.includes("admin") ||
    role.includes("hod") ||
    role.includes("manager") ||
    /(^|_)hr(_|$)/.test(role)
  ) {
    return "staff";
  }
  if (
    role.includes("employee") ||
    role.includes("staff") ||
    role.includes("nysc") ||
    role.includes("intern")
  ) {
    return "employee";
  }
  return "unknown";
}

function postLeave(path: string, body: Record<string, unknown>) {
  return apiRequest(path, { method: "POST", body });
}

export type LeaveTypeOption = {
  id: string;
  name: string;
  code: string;
  defaultDays: number;
  paid: boolean;
  requiresDocument: boolean;
  status: string;
};

export type LeaveApplyInput = {
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  note: string;
  durationType?: "FULL_DAY" | "HALF_DAY";
  attachments?: Array<{ name: string; fileUrl: string; type: string }>;
  employeeName?: string;
  departmentId?: string;
  employeeId?: string;
};

export type LeaveBalanceCard = {
  label: string;
  value: number | string;
  hint: string;
};

const EMPLOYEE = "/employee/leave";
const SHARED = "/leave";

const BUSINESS_LEAVE_CODES = new Set([
  "LEAVE_TYPE_NOT_FOUND",
  "LEAVE_TYPE_INACTIVE",
  "LEAVE_REQUEST_NOT_FOUND",
  "INSUFFICIENT_LEAVE_BALANCE",
  "LEAVE_DATES_OVERLAP",
  "LEAVE_ALREADY_ACTIVE",
  "LEAVE_NOT_EXTENDABLE",
  "LEAVE_EXTENSION_NOT_PENDING",
  "INVALID_LEAVE_DURATION",
  "NOTICE_REQUIRED",
  "MAXIMUM_LEAVE_EXCEEDED",
  "LEAVE_NOT_PENDING",
  "LEAVE_NOT_APPROVED",
  "REJECTION_REASON_REQUIRED",
]);

const UNLINKED_PROFILE_MESSAGE =
  "Your employee profile is still being set up. Wait a few seconds and submit again.";

function errorCode(error: ApiError): string {
  const body = asObject(error.body);
  const nested = asObject(body?.error);
  return str(nested?.code ?? body?.code).toUpperCase();
}

function isUnlinkedEmployee(error: unknown) {
  if (!(error instanceof ApiError)) return false;
  const code = errorCode(error);
  if (
    code === "NO_ACTIVE_EMPLOYEE_PROFILE" ||
    code === "EMPLOYEE_PROFILE_REQUIRED" ||
    code === "EMPLOYEE_NOT_FOUND"
  ) {
    return true;
  }
  return /not linked to an employee|employee profile is still being set up/i.test(
    error.message,
  );
}

/** Retry missing routes / wrong-role aliases — never leave-policy 404s. */
function isMissingRoute(error: unknown) {
  if (!(error instanceof ApiError)) return false;
  if (BUSINESS_LEAVE_CODES.has(errorCode(error))) return false;
  if (error.status === 405) return true;
  if (error.status === 403) return true;
  if (error.status !== 404) return false;
  return /not found/i.test(error.message);
}

async function withProvisionRetry<T>(attempt: () => Promise<T>): Promise<T> {
  try {
    return await attempt();
  } catch (error) {
    if (!isUnlinkedEmployee(error)) throw error;
    return attempt();
  }
}

async function firstSuccessful<T>(
  attempts: Array<() => Promise<T>>,
  notFoundMessage: string,
): Promise<T> {
  let lastError: unknown;
  for (const attempt of attempts) {
    try {
      return await withProvisionRetry(attempt);
    } catch (error) {
      lastError = error;
      if (isUnlinkedEmployee(error) || isMissingRoute(error)) continue;
      throw error;
    }
  }
  if (lastError instanceof ApiError) throw lastError;
  throw new ApiError(404, notFoundMessage);
}

export function toLeaveDate(value: string): string {
  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const slash = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (slash) {
    const [, month, day, year] = slash;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }
  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
  return trimmed;
}

/** Weekday estimate only. The server ignores client duration and excludes holidays. */
export function leaveDayCount(startDate: string, endDate: string): number {
  const start = new Date(`${toLeaveDate(startDate)}T12:00:00.000Z`);
  const end = new Date(`${toLeaveDate(endDate)}T12:00:00.000Z`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
    return 0;
  }
  let days = 0;
  const cursor = new Date(start);
  while (cursor.getTime() <= end.getTime()) {
    const weekday = cursor.getUTCDay();
    if (weekday !== 0 && weekday !== 6) days += 1;
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return days;
}

const LEAVE_TYPES_CACHE = "wms_leave_types";

const SEEDED_LEAVE_TYPES: LeaveTypeOption[] = [
  {
    id: "ANNUAL",
    name: "Annual Leave",
    code: "ANNUAL",
    defaultDays: 25,
    paid: true,
    requiresDocument: false,
    status: "active",
  },
  {
    id: "SICK",
    name: "Sick Leave",
    code: "SICK",
    defaultDays: 10,
    paid: true,
    requiresDocument: true,
    status: "active",
  },
  {
    id: "PERSONAL",
    name: "Personal Leave",
    code: "PERSONAL",
    defaultDays: 5,
    paid: true,
    requiresDocument: false,
    status: "active",
  },
  {
    id: "UNPAID",
    name: "Unpaid Leave",
    code: "UNPAID",
    defaultDays: 0,
    paid: false,
    requiresDocument: false,
    status: "active",
  },
];

function readCachedLeaveTypes(): LeaveTypeOption[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(LEAVE_TYPES_CACHE) ?? "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item) => item && typeof item === "object" && item.id && item.name,
    ) as LeaveTypeOption[];
  } catch {
    return [];
  }
}

function writeCachedLeaveTypes(types: LeaveTypeOption[]) {
  if (typeof window === "undefined" || types.length === 0) return;
  localStorage.setItem(LEAVE_TYPES_CACHE, JSON.stringify(types));
}

export function mapLeaveTypeOption(
  record: Record<string, unknown>,
): LeaveTypeOption {
  const nested = asObject(record.data) ?? record;
  const name = str(nested.name ?? nested.label ?? nested.title, "Leave");
  const code = str(nested.code ?? nested.slug ?? nested.key, name)
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_");
  return {
    id: str(
      nested.id ?? nested._id ?? nested.leaveTypeId ?? nested.typeId,
      code,
    ),
    name,
    code,
    defaultDays: num(
      nested.defaultDays ?? nested.allocatedDays ?? nested.days,
    ),
    paid: nested.paid !== false,
    requiresDocument: Boolean(nested.requiresDocument),
    status: str(nested.status, "active").toLowerCase(),
  };
}

function parseLeaveTypes(payload: unknown): LeaveTypeOption[] {
  const seen = new Set<string>();
  return unwrapList<Record<string, unknown>>(payload)
    .map(mapLeaveTypeOption)
    .filter((item) => {
      if (!item.id || item.status === "inactive" || seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
}

export async function listLeaveTypes(): Promise<LeaveTypeOption[]> {
  const seen = new Set<string>();
  const merged: LeaveTypeOption[] = [];

  for (const path of [
    `${EMPLOYEE}/types`,
    `${SHARED}/types`,
    "/hr/leave/types",
    "/super-admin/leave/types",
    "/lookups/leave-types",
  ]) {
    try {
      for (const item of parseLeaveTypes(await apiRequest(path))) {
        if (seen.has(item.id)) continue;
        seen.add(item.id);
        merged.push(item);
      }
      if (merged.length) {
        writeCachedLeaveTypes(merged);
        return merged;
      }
    } catch {
      /* try the next catalog */
    }
  }

  const cached = readCachedLeaveTypes();
  if (cached.length) return cached;
  return SEEDED_LEAVE_TYPES;
}

export async function listMyLeave(status?: string) {
  const query = buildQuery({
    page: 1,
    limit: 25,
    ...(status ? { status } : {}),
  });
  try {
    return await firstSuccessful(
      [
        () => apiRequest(`${EMPLOYEE}${query}`),
        () => apiRequest(`${EMPLOYEE}/requests${query}`),
        () => apiRequest(`${SHARED}/requests${query}`),
      ],
      "Leave requests could not be loaded.",
    );
  } catch (error) {
    if (isUnlinkedEmployee(error) || (error instanceof ApiError && error.status === 403)) {
      return { data: [] };
    }
    throw error;
  }
}

export async function listLeaveBalances() {
  try {
    return await firstSuccessful(
      [
        () => apiRequest(`${EMPLOYEE}/balances`),
        () => apiRequest(`${SHARED}/balances`),
      ],
      "Leave balances could not be loaded.",
    );
  } catch (error) {
    if (isUnlinkedEmployee(error) || (error instanceof ApiError && error.status === 403)) {
      return { data: [] };
    }
    throw error;
  }
}

export function getEmployeeLeave(id: string) {
  return firstSuccessful(
    [
      () => apiRequest(`${EMPLOYEE}/${id}`),
      () => apiRequest(`${SHARED}/requests/${id}`),
      () => apiRequest(`/super-admin/leave/${id}`),
    ],
    "That leave request was not found.",
  );
}

export function listOrganisationLeave(params?: Record<string, unknown>) {
  const query = buildQuery(params);
  const managerAttempt = () => apiRequest(`/manager/leave${query}`);
  const attempts = [
    () => apiRequest(`/hr/leave${query}`),
    () => apiRequest(`${SHARED}/requests${query}`),
    () => apiRequest(`/super-admin/leave/requests${query}`),
  ];
  const role = readCachedWorkspace()?.roleKey ?? "";
  const ordered = /hod|manager/i.test(role)
    ? [managerAttempt, ...attempts]
    : [...attempts, managerAttempt];
  return firstSuccessful(ordered, "Leave requests could not be loaded.");
}

export async function applyForLeave(input: LeaveApplyInput & { reason?: string }) {
  const note = (input.note ?? input.reason ?? "").trim();
  const startDate = toLeaveDate(input.startDate);
  let endDate = toLeaveDate(input.endDate || input.startDate);
  const durationType =
    input.durationType === "HALF_DAY" ? "HALF_DAY" : "FULL_DAY";
  if (durationType === "HALF_DAY") endDate = startDate;

  const types = await listLeaveTypes().catch(() => [] as LeaveTypeOption[]);
  const rawId = input.leaveTypeId.trim();
  const needle = rawId.toLowerCase();
  const selected =
    types.find((item) => item.id === rawId) ??
    types.find((item) => item.code === rawId.toUpperCase()) ??
    types.find((item) => item.name.toLowerCase() === needle);

  const leaveTypeId = selected?.id || rawId;
  if (!leaveTypeId || !startDate || !endDate || !note) {
    throw new ApiError(400, "Choose a leave type, dates, and a note.");
  }

  const body: Record<string, unknown> = {
    leaveTypeId,
    startDate,
    endDate,
    durationType,
    note,
  };
  const employeeName = (input.employeeName ?? "").trim();
  const departmentId = (input.departmentId ?? "").trim();
  const employeeId = (input.employeeId ?? "").trim();
  if (employeeName) {
    body.employeeName = employeeName;
    body.fullName = employeeName;
    body.name = employeeName;
  }
  if (departmentId) body.departmentId = departmentId;
  if (employeeId) body.employeeId = employeeId;
  if (input.attachments?.length) body.attachments = input.attachments;

  const kind = accountKind();
  const selfAttempts = [
    () => postLeave(EMPLOYEE, body),
    () => postLeave(`${SHARED}/requests`, body),
  ];
  const staffAttempts = [
    () => postLeave(`${SHARED}/requests`, body),
    () => postLeave(EMPLOYEE, body),
    () => postLeave("/hr/leave", body),
  ];

  try {
    return await firstSuccessful(
      kind === "staff" ? staffAttempts : selfAttempts,
      "Could not submit the leave request. Sign in as an employee and pick a leave type from the list.",
    );
  } catch (error) {
    if (error instanceof ApiError && isUnlinkedEmployee(error)) {
      throw new ApiError(error.status || 403, UNLINKED_PROFILE_MESSAGE, error.body);
    }
    throw error;
  }
}

export function leaveRequestIdFromError(error: unknown): string {
  if (!(error instanceof ApiError)) return "";
  const body = asObject(error.body);
  const nested = asObject(body?.error);
  const details = asObject(nested?.details ?? body?.details);
  return str(
    details?.leaveRequestId ??
      details?.leave_request_id ??
      details?.requestId ??
      nested?.leaveRequestId,
  );
}

export function isActiveLeaveBlock(error: unknown) {
  if (!(error instanceof ApiError)) return false;
  const code = errorCode(error);
  if (code === "LEAVE_ALREADY_ACTIVE" || code === "LEAVE_DATES_OVERLAP") {
    return true;
  }
  return /already has pending or approved leave|extend that request/i.test(
    error.message,
  );
}

export function extendLeaveRequest(
  id: string,
  body: { endDate: string; note?: string },
) {
  return postLeave(`${SHARED}/requests/${id}/extend`, {
    endDate: toLeaveDate(body.endDate),
    note: (body.note ?? "").trim(),
  });
}

export function approveLeaveExtension(id: string, comment = "Approved") {
  return postLeave(`${SHARED}/requests/${id}/extend/approve`, { comment });
}

export function rejectLeaveExtension(id: string, reason: string) {
  const comment = reason.trim();
  if (!comment) {
    throw new ApiError(400, "A rejection reason is required.");
  }
  return postLeave(`${SHARED}/requests/${id}/extend/reject`, {
    reason: comment,
    comment,
  });
}

export function withdrawLeaveRequest(id: string, reason: string) {
  return apiRequest(`${SHARED}/requests/${id}/withdraw`, {
    method: "POST",
    body: { reason },
  });
}

export function approveLeaveRequest(id: string, comment = "Approved") {
  const body = { comment };
  return firstSuccessful(
    [
      () =>
        apiRequest(`${SHARED}/requests/${id}/approve`, {
          method: "POST",
          body,
        }),
      () =>
        apiRequest(`/hr/leave/${id}/approve`, { method: "PATCH", body }),
      () =>
        apiRequest(`/hod/leave/${id}/approve`, { method: "PATCH", body }),
      () =>
        apiRequest(`/manager/leave/${id}/approve`, { method: "PATCH", body }),
    ],
    "Could not approve that leave request.",
  );
}

export function rejectLeaveRequest(id: string, reason: string) {
  const comment = reason.trim();
  if (!comment) {
    throw new ApiError(400, "A rejection reason is required.");
  }
  const body = { reason: comment, comment };
  return firstSuccessful(
    [
      () =>
        apiRequest(`${SHARED}/requests/${id}/reject`, {
          method: "POST",
          body,
        }),
      () =>
        apiRequest(`/hr/leave/${id}/reject`, { method: "PATCH", body }),
      () =>
        apiRequest(`/hod/leave/${id}/reject`, { method: "PATCH", body }),
      () =>
        apiRequest(`/manager/leave/${id}/reject`, { method: "PATCH", body }),
    ],
    "Could not reject that leave request.",
  );
}

export function remainingDaysForType(
  balancesPayload: unknown,
  type: LeaveTypeOption | undefined,
): number {
  const balances = unwrapList<Record<string, unknown>>(balancesPayload);
  const match = balances.find((row) => {
    const typeId = str(row.leaveTypeId);
    const typeName = str(row.leaveTypeName).toLowerCase();
    if (type?.id && typeId === type.id) return true;
    if (type?.name && typeName === type.name.toLowerCase()) return true;
    if (type?.code && typeName.includes(type.code.toLowerCase())) return true;
    return false;
  });
  return num(match?.remainingDays, type?.defaultDays ?? 0);
}

export function employeeBalanceCards(
  balancesPayload: unknown,
  types: LeaveTypeOption[],
): LeaveBalanceCard[] {
  const balances = unwrapList<Record<string, unknown>>(balancesPayload);
  const byName = (name: string) =>
    balances.find((row) =>
      str(row.leaveTypeName).toLowerCase().includes(name),
    );
  const typeFallback = (code: string) =>
    types.find((row) => row.code === code);

  const card = (
    balance: Record<string, unknown> | undefined,
    type: LeaveTypeOption | undefined,
    fallbackDays: number,
  ) => {
    const allocated = num(
      balance?.allocatedDays,
      type?.defaultDays ?? fallbackDays,
    );
    const used = num(balance?.usedDays);
    const remaining = num(balance?.remainingDays, allocated - used);
    return { remaining, used, allocated };
  };

  const annual = card(byName("annual"), typeFallback("ANNUAL"), 25);
  const sick = card(byName("sick"), typeFallback("SICK"), 10);
  const personal = card(byName("personal"), typeFallback("PERSONAL"), 5);
  const daysRemaining =
    balances.reduce((sum, row) => sum + num(row.remainingDays), 0) ||
    annual.remaining + sick.remaining + personal.remaining;

  return [
    {
      label: "Days remaining",
      value: daysRemaining,
      hint: "Across all types",
    },
    {
      label: "Annual days left",
      value: annual.remaining,
      hint: `${annual.used} of ${annual.allocated} used`,
    },
    {
      label: "Sick days left",
      value: sick.remaining,
      hint: `${sick.used} of ${sick.allocated} used`,
    },
    {
      label: "Personal days left",
      value: personal.remaining,
      hint: `${personal.used} of ${personal.allocated} used`,
    },
  ];
}

export function leaveDecisionLetter(payload: unknown): string {
  const record = unwrapRecord(payload);
  const nested = asObject(record.data) ?? record;
  const type = asObject(nested.leaveType);
  const approvedBy = asObject(nested.approvedBy) ?? asObject(nested.decidedBy);
  const leaveType = str(
    nested.leaveTypeName ?? type?.name ?? nested.type,
    "Leave",
  );
  const start = str(nested.startDate);
  const end = str(nested.endDate);
  const duration = str(nested.duration ?? nested.workingDays, "—");
  const approvedName = str(
    nested.approvedByName ?? approvedBy?.name ?? nested.approver,
    "—",
  );
  const approvedAt = str(nested.approvedAt ?? nested.decidedAt, "—");
  const comments = str(
    nested.comment ?? nested.comments ?? nested.reviewComment ?? nested.note,
    "—",
  );
  return [
    "Leave decision letter",
    "",
    `Type: ${leaveType}`,
    `Dates: ${start}${end ? ` – ${end}` : ""}`,
    `Duration: ${duration} working days`,
    `Approved by: ${approvedName}`,
    `Approved at: ${approvedAt}`,
    `Comments: ${comments}`,
  ].join("\n");
}
