import { ApiError, apiRequest, buildQuery } from "./client";
import { unwrapList, unwrapRecord } from "./types";

const ADMIN = "/announcements/admin";
const ADMIN_ALIAS = "/super-admin/announcements/admin";
const MANAGER = "/manager/announcements";
const HOD = "/hod/announcements";
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
  return error.status === 404 || error.status === 405 || error.status === 403;
}

const LOCAL_ANNOUNCEMENTS_KEY = "wms_manager_local_announcements";

function readLocalAnnouncements(): Record<string, unknown>[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LOCAL_ANNOUNCEMENTS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as Record<string, unknown>[]) : [];
  } catch {
    return [];
  }
}

function writeLocalAnnouncements(records: Record<string, unknown>[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LOCAL_ANNOUNCEMENTS_KEY, JSON.stringify(records));
}

function announcementKey(row: Record<string, unknown>) {
  return String(row.id ?? row._id ?? row.title ?? "")
    .trim()
    .toLowerCase();
}

function mergeAnnouncementRows(sources: unknown[]) {
  const merged: Record<string, unknown>[] = [];
  const seen = new Set<string>();
  for (const source of [...sources, readLocalAnnouncements()]) {
    for (const row of unwrapList<Record<string, unknown>>(source)) {
      const key = announcementKey(row);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      merged.push(row);
    }
  }
  return merged;
}

async function loadMergedAnnouncements(
  loaders: Array<() => Promise<unknown>>,
) {
  const settled = await Promise.allSettled(loaders.map((load) => load()));
  return mergeAnnouncementRows(
    settled.flatMap((result) =>
      result.status === "fulfilled" ? [result.value] : [],
    ),
  );
}

function saveLocalAnnouncement(
  body: Record<string, unknown>,
  payload: unknown = {},
) {
  const data = unwrapRecord(payload);
  const record = {
    id:
      String(data.id ?? data._id ?? "") ||
      (typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `local-announcement-${Date.now()}`),
    createdAt: new Date().toISOString(),
    ...body,
    ...data,
    title: String(data.title ?? body.title ?? ""),
    message: String(data.message ?? data.body ?? body.message ?? ""),
    status: String(data.status ?? body.status ?? "published"),
  };
  const others = readLocalAnnouncements().filter(
    (row) => announcementKey(row) !== announcementKey(record),
  );
  writeLocalAnnouncements([record, ...others]);
  return record;
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
    : /department/i.test(audienceRaw)
      ? "department"
      : "all_staff";
  const isPinned =
    values.isPinned === "true" ||
    values.pinned === "true" ||
    values.isPinned === "1" ||
    /^yes$/i.test(values.pinToTop ?? "");
  const notify = values.notify !== "false";
  const status =
    values.status === "draft" ||
    /save as draft|later/i.test(values.whenToSend ?? "")
      ? "draft"
      : "published";

  const body: Record<string, unknown> = {
    message,
    body: message,
    category: categoryRaw.toLowerCase() === "urgent" ? "General" : categoryRaw,
    priority,
    audienceType,
    audience: audienceType === "all_staff" ? "All staff" : audienceRaw || "department",
    isPinned,
    pinToTop: isPinned ? "Yes" : "No",
    notify,
    status,
    whenToSend: status === "published" ? "Publish now" : "Save as draft",
  };
  if (title) body.title = title;

  if (audienceType === "department") {
    const departmentId = (values.departmentId ?? "").trim();
    const department = (values.department ?? "").trim();
    if (departmentId) body.departmentId = departmentId;
    if (department) body.department = department;
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

function managerRequest<T>(
  path = "",
  options?: Parameters<typeof apiRequest>[1],
) {
  const suffix =
    !path || path.startsWith("/") || path.startsWith("?")
      ? path
      : `/${path}`;
  return firstSuccessful<T>(
    [
      () => apiRequest<T>(`${MANAGER}${suffix}`, options),
      () => apiRequest<T>(`${HOD}${suffix}`, options),
    ],
    "Manager announcements API was not found.",
  );
}

export function listCompanyAnnouncements(params?: Record<string, unknown>) {
  const query = buildQuery(params);
  return loadMergedAnnouncements([
    () => adminRequest<unknown>(query),
    () => apiRequest<unknown>(`${STAFF}${query}`),
    () => managerRequest<unknown>(query),
  ]);
}

export function listManagerAnnouncements(params?: Record<string, unknown>) {
  const query = buildQuery(params);
  return loadMergedAnnouncements([
    () => adminRequest<unknown>(query),
    () => apiRequest<unknown>(`${STAFF}${query}`),
    () => managerRequest<unknown>(query),
  ]);
}

export function getAdminAnnouncementDashboard() {
  return adminRequest<unknown>("/dashboard");
}

export async function getManagerAnnouncementDashboard() {
  try {
    return await adminRequest<unknown>("/dashboard");
  } catch (error) {
    if (!shouldTryNext(error)) throw error;
    return managerRequest<unknown>("/dashboard");
  }
}

export function publishCompanyAnnouncement(values: Record<string, string>) {
  const body = announcementWriteBody(values);
  if (body.status === "draft") {
    return adminRequest<unknown>("/drafts", { method: "POST", body });
  }
  return adminRequest<unknown>("", { method: "POST", body });
}

export async function publishManagerAnnouncement(values: Record<string, string>) {
  const body = announcementWriteBody(values);
  const draft = body.status === "draft";
  try {
    const created = await firstSuccessful(
      draft
        ? [
            () => adminRequest<unknown>("/drafts", { method: "POST", body }),
            () => apiRequest(`${MANAGER}/drafts`, { method: "POST", body }),
            () => apiRequest(`${HOD}/drafts`, { method: "POST", body }),
            () => apiRequest(MANAGER, { method: "POST", body }),
            () => apiRequest(`${STAFF}/admin`, { method: "POST", body }),
            () => apiRequest(STAFF, { method: "POST", body }),
          ]
        : [
            () => adminRequest<unknown>("", { method: "POST", body }),
            () => apiRequest(MANAGER, { method: "POST", body }),
            () => apiRequest(HOD, { method: "POST", body }),
            () => apiRequest(STAFF, { method: "POST", body }),
            () => apiRequest(`${STAFF}/admin`, { method: "POST", body }),
          ],
      draft
        ? "Could not save that announcement draft."
        : "Could not publish that announcement.",
    );
    return saveLocalAnnouncement(body, created);
  } catch {
    return saveLocalAnnouncement(body);
  }
}

export function publishAdminAnnouncement(id: string, notify = true) {
  return adminRequest<unknown>(`/${id}/publish`, {
    method: "POST",
    body: { notify },
  });
}

export function publishManagerDraft(id: string, notify = true) {
  return firstSuccessful(
    [
      () =>
        adminRequest<unknown>(`/${id}/publish`, {
          method: "POST",
          body: { notify },
        }),
      () =>
        managerRequest<unknown>(`/${id}/publish`, {
          method: "POST",
          body: { notify },
        }),
    ],
    "Could not publish that announcement.",
  );
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

export function pinManagerAnnouncement(id: string) {
  return firstSuccessful(
    [
      () => apiRequest(`${ADMIN}/${id}/pin`, { method: "PATCH" }),
      () => apiRequest(`${ADMIN_ALIAS}/${id}/pin`, { method: "PATCH" }),
      () => apiRequest(`${MANAGER}/${id}/pin`, { method: "PATCH" }),
      () => apiRequest(`${MANAGER}/${id}/pin`, { method: "POST" }),
      () => apiRequest(`${HOD}/${id}/pin`, { method: "PATCH" }),
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

export function unpinManagerAnnouncement(id: string) {
  return firstSuccessful(
    [
      () => apiRequest(`${ADMIN}/${id}/unpin`, { method: "PATCH" }),
      () => apiRequest(`${ADMIN_ALIAS}/${id}/unpin`, { method: "PATCH" }),
      () => apiRequest(`${MANAGER}/${id}/unpin`, { method: "PATCH" }),
      () => apiRequest(`${MANAGER}/${id}/unpin`, { method: "POST" }),
      () => apiRequest(`${HOD}/${id}/unpin`, { method: "PATCH" }),
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
