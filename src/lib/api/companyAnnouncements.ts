import { ApiError, apiRequest, buildQuery } from "./client";
import { unwrapRecord } from "./types";

const ADMIN = "/announcements/admin";
const ADMIN_ALIAS = "/super-admin/announcements/admin";
const STAFF = "/announcements";

const AUDIENCE_TYPES = new Set([
  "all_staff",
  "department",
  "multiple_departments",
  "employee",
]);
const PRIORITIES = new Set(["normal", "important", "urgent"]);

function shouldTryNext(error: unknown) {
  if (!(error instanceof ApiError)) return false;
  return error.status === 404 || error.status === 405;
}

async function firstSuccessful<T>(
  attempts: Array<() => Promise<T>>,
  notFoundMessage: string,
): Promise<T> {
  let lastError: unknown;
  for (const attempt of attempts) {
    try {
      return await attempt();
    } catch (error) {
      lastError = error;
      if (shouldTryNext(error)) continue;
      throw error;
    }
  }
  if (lastError instanceof Error) throw lastError;
  throw new ApiError(404, notFoundMessage);
}

function adminRequest<T>(path = "", options?: Parameters<typeof apiRequest>[1]) {
  const suffix =
    !path || path.startsWith("/") || path.startsWith("?")
      ? path
      : `/${path}`;
  return firstSuccessful<T>(
    [
      () => apiRequest<T>(`${ADMIN}${suffix}`, options),
      () => apiRequest<T>(`${ADMIN_ALIAS}${suffix}`, options),
    ],
    "Announcements admin API was not found.",
  );
}

export function announcementWriteBody(values: Record<string, string>) {
  const title = (values.title ?? "").trim();
  const message = (values.message ?? values.body ?? "").trim();
  const categoryRaw = (values.category ?? "").trim() || "General";
  const priorityRaw = (values.priority ?? "").trim().toLowerCase();
  const priority = PRIORITIES.has(priorityRaw)
    ? priorityRaw
    : categoryRaw.toLowerCase() === "urgent"
      ? "urgent"
      : "normal";
  const audienceRaw = (values.audienceType ?? values.audience ?? "").trim();
  const audienceType = AUDIENCE_TYPES.has(audienceRaw)
    ? audienceRaw
    : "all_staff";
  const isPinned =
    values.isPinned === "true" ||
    values.pinned === "true" ||
    values.isPinned === "1";
  const notify = values.notify !== "false";
  const status = values.status === "draft" ? "draft" : "published";

  const body: Record<string, unknown> = {
    title,
    message,
    category: categoryRaw.toLowerCase() === "urgent" ? "General" : categoryRaw,
    priority,
    audienceType,
    isPinned,
    notify,
    status,
  };

  if (audienceType === "department") {
    const departmentId = (values.departmentId ?? "").trim();
    if (departmentId) body.departmentId = departmentId;
  }
  if (audienceType === "multiple_departments") {
    const departmentIds = (values.departmentIds ?? "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    if (departmentIds.length) body.departmentIds = departmentIds;
  }
  if (audienceType === "employee") {
    const employeeId = (values.employeeId ?? "").trim();
    const employeeIds = (values.employeeIds ?? "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    if (employeeId) body.employeeId = employeeId;
    if (employeeIds.length) body.employeeIds = employeeIds;
  }

  const expiresAt = (values.expiresAt ?? "").trim();
  if (expiresAt) {
    body.expiresAt = /^\d{4}-\d{2}-\d{2}$/.test(expiresAt)
      ? new Date(`${expiresAt}T23:59:59.000Z`).toISOString()
      : expiresAt;
  }

  return body;
}

export function listCompanyAnnouncements(params?: Record<string, unknown>) {
  return adminRequest<unknown>(buildQuery(params));
}

export function getAdminAnnouncementDashboard() {
  return adminRequest<unknown>("/dashboard");
}

export function publishCompanyAnnouncement(values: Record<string, string>) {
  const body = announcementWriteBody(values);
  if (body.status === "draft") {
    return adminRequest<unknown>("/drafts", { method: "POST", body });
  }
  return adminRequest<unknown>("", { method: "POST", body });
}

export function publishAdminAnnouncement(id: string, notify = true) {
  return adminRequest<unknown>(`/${id}/publish`, {
    method: "POST",
    body: { notify },
  });
}

export function pinAdminAnnouncement(id: string) {
  return firstSuccessful(
    [
      () => apiRequest(`${ADMIN}/${id}/pin`, { method: "PATCH" }),
      () => apiRequest(`${ADMIN_ALIAS}/${id}/pin`, { method: "PATCH" }),
      () => apiRequest(`${ADMIN}/${id}/pin`, { method: "POST" }),
    ],
    "Could not pin that announcement.",
  );
}

export function unpinAdminAnnouncement(id: string) {
  return firstSuccessful(
    [
      () => apiRequest(`${ADMIN}/${id}/unpin`, { method: "PATCH" }),
      () => apiRequest(`${ADMIN_ALIAS}/${id}/unpin`, { method: "PATCH" }),
      () => apiRequest(`${ADMIN}/${id}/unpin`, { method: "POST" }),
    ],
    "Could not unpin that announcement.",
  );
}

export function listStaffAnnouncements() {
  return apiRequest<unknown>(STAFF);
}

export function getStaffUnreadCount() {
  return apiRequest<unknown>(`${STAFF}/unread-count`);
}

export function getStaffAnnouncement(id: string) {
  return apiRequest<unknown>(`${STAFF}/${id}`);
}

export function markStaffAnnouncementRead(id: string) {
  return apiRequest<unknown>(`${STAFF}/${id}/read`, { method: "PATCH" });
}

export function staffUnreadCountFrom(payload: unknown): number {
  const record = unwrapRecord(payload);
  const value = record.count ?? record.unread ?? record.unreadCount;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}
