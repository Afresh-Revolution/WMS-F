import { ApiError, apiRequest, buildQuery } from "./client";
import { unwrapList } from "./types";
import { readCachedWorkspace } from "@/lib/workspace";

function asObject(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function str(value: unknown, fallback = ""): string {
  if (value === null || value === undefined) return fallback;
  return String(value);
}

function employeeKey(row: Record<string, unknown>): string {
  const nested = asObject(row.data) ?? row;
  const user = asObject(nested.user);
  const profile = asObject(nested.profile) ?? asObject(nested.employee);
  const email = str(
    nested.email ??
      user?.email ??
      profile?.email ??
      nested.workEmail ??
      nested.companyEmail,
  )
    .trim()
    .toLowerCase();
  const id = str(
    nested.id ??
      nested._id ??
      row.id ??
      nested.userId ??
      nested.employeeId ??
      nested.employee_id ??
      nested.staffId ??
      nested.staff_id ??
      user?.id ??
      profile?.id,
  );
  return email || id;
}

function rowsFrom(payload: unknown): Record<string, unknown>[] {
  const rows: Record<string, unknown>[] = [];
  const seen = new Set<string>();
  for (const row of unwrapList<Record<string, unknown>>(payload)) {
    const key = employeeKey(row);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    rows.push(row);
  }
  return rows;
}

function employeesFromPayload(payload: unknown): Record<string, unknown>[] {
  const root = asObject(payload);
  const data = asObject(root?.data) ?? root;
  const collected: Record<string, unknown>[] = [];
  const seen = new Set<string>();
  let sawNamedList = false;
  for (const list of [
    data?.employees,
    data?.users,
    data?.hods,
    data?.staff,
    data?.people,
    data?.items,
  ]) {
    if (!Array.isArray(list)) continue;
    sawNamedList = true;
    if (list.length === 0) continue;
    for (const row of rowsFrom(list)) {
      const key = employeeKey(row);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      collected.push(row);
    }
  }
  if (collected.length || sawNamedList) return collected;
  return rowsFrom(payload);
}

function isMissingRoute(error: unknown) {
  if (!(error instanceof ApiError)) return true;
  return error.status === 404 || error.status === 405 || error.status === 403;
}

function isRateLimited(error: unknown) {
  return error instanceof ApiError && error.status === 429;
}

function readListMeta(payload: unknown) {
  const root = asObject(payload) ?? {};
  const data = asObject(root.data) ?? root;
  const meta =
    asObject(root.meta) ??
    asObject(data.meta) ??
    asObject(root.pagination) ??
    asObject(data.pagination) ??
    {};
  const total = Number(
    meta.total ?? meta.totalItems ?? meta.count ?? root.total ?? data.total,
  );
  const page = Number(meta.page ?? meta.currentPage ?? root.page ?? 1);
  const limit = Number(
    meta.limit ?? meta.perPage ?? meta.pageSize ?? root.limit ?? 0,
  );
  const inferredPages =
    Number.isFinite(total) && total > 0 && limit > 0
      ? Math.ceil(total / limit)
      : 0;
  const totalPages = Number(meta.totalPages ?? meta.pages ?? inferredPages);
  return {
    total: Number.isFinite(total) && total > 0 ? total : 0,
    page: Number.isFinite(page) && page > 0 ? page : 1,
    limit: Number.isFinite(limit) && limit > 0 ? limit : 0,
    totalPages: Number.isFinite(totalPages) && totalPages > 0 ? totalPages : 0,
  };
}

const PAGE_SIZE = 100;

function workspaceRole() {
  return readCachedWorkspace()?.roleKey ?? "";
}

function isAccountantWorkspace() {
  return /accountant/i.test(workspaceRole());
}

function isManagerWorkspace() {
  return /manager|hod/i.test(workspaceRole());
}

function staffSourcePaths() {
  const orgWide = ["/lookups/employees", "/users", "/lookups"];
  if (isAccountantWorkspace()) {
    return ["/accountant/employees", ...orgWide, "/manager/employees"];
  }
  if (isManagerWorkspace()) {
    return ["/manager/employees", ...orgWide];
  }
  return [
    ...orgWide,
    "/hr/employees",
    "/employees",
    "/super-admin/employees",
    "/manager/employees",
  ];
}

function isPagedEmployeePath(path: string) {
  return /\/employees$/.test(path) || /\/users$/.test(path);
}

async function requestPayload(path: string) {
  try {
    return await apiRequest(path);
  } catch (error) {
    if (!isRateLimited(error)) throw error;
    await new Promise((resolve) => setTimeout(resolve, 900));
    return apiRequest(path);
  }
}

async function listPagedEmployeeRows(path: string) {
  if (!isPagedEmployeePath(path)) {
    return employeesFromPayload(await requestPayload(path));
  }

  const collected: Record<string, unknown>[] = [];
  const seen = new Set<string>();
  for (let page = 1; page <= 20; page += 1) {
    const payload = await requestPayload(
      `${path}${buildQuery({ page, limit: PAGE_SIZE, perPage: PAGE_SIZE })}`,
    );
    const rows = employeesFromPayload(payload);
    for (const row of rows) {
      const key = employeeKey(row);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      collected.push(row);
    }
    const meta = readListMeta(payload);
    if (rows.length === 0) break;
    if (meta.total > 0 && collected.length >= meta.total) break;
    if (meta.totalPages > 0 && page >= meta.totalPages) break;
    if (meta.limit > 0 && rows.length < meta.limit) break;
    if (rows.length < PAGE_SIZE) break;
  }
  return collected;
}

const CREATE_PATHS = [
  "/manager/employees",
  "/employees",
  "/hr/employees",
  "/super-admin/employees",
];

const LOCAL_EMPLOYEES_KEY = "wms_manager_local_employees";

function readLocalEmployees(): Record<string, unknown>[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LOCAL_EMPLOYEES_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as Record<string, unknown>[]) : [];
  } catch {
    return [];
  }
}

function writeLocalEmployees(records: Record<string, unknown>[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LOCAL_EMPLOYEES_KEY, JSON.stringify(records));
}

function flattenEmployeePayload(payload: unknown): Record<string, unknown> {
  const root = asObject(payload) ?? {};
  const data = asObject(root.data) ?? root;
  const user = asObject(data.user);
  const meta = asObject(root.meta);
  return {
    ...data,
    email: str(data.email ?? user?.email ?? data.loginEmail ?? meta?.loginEmail),
    fullName: str(data.fullName ?? data.name ?? user?.fullName ?? user?.name),
    name: str(data.name ?? data.fullName ?? user?.name),
    temporaryPassword: str(
      data.temporaryPassword ??
        meta?.temporaryPassword ??
        data.generatedPassword ??
        meta?.generatedPassword,
    ),
  };
}

export function mergeLocalEmployees(remote: Record<string, unknown>[]) {
  const merged: Record<string, unknown>[] = [];
  const seen = new Set<string>();
  for (const row of [...readLocalEmployees(), ...remote]) {
    const key = employeeKey(row);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    merged.push(row);
  }
  return merged;
}

function saveLocalEmployee(
  values: Record<string, string>,
  payload: unknown = {},
) {
  const body = buildEmployeeWriteBody(values);
  const fromApi = flattenEmployeePayload(payload);
  const record = {
    id:
      str(fromApi.id ?? fromApi._id) ||
      (typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `local-employee-${Date.now()}`),
    status: "active",
    createdAt: new Date().toISOString(),
    ...body,
    ...fromApi,
    fullName: str(fromApi.fullName || body.fullName),
    name: str(fromApi.name || fromApi.fullName || body.fullName),
    email: str(fromApi.email || body.email),
    department: str(fromApi.department || body.department),
    departmentId: str(fromApi.departmentId || body.departmentId),
    jobTitle: str(fromApi.jobTitle || body.jobTitle),
    temporaryPassword:
      str(fromApi.temporaryPassword) || `Temp${Date.now().toString(36)}A1!`,
  };
  const others = readLocalEmployees().filter((row) => employeeKey(row) !== employeeKey(record));
  writeLocalEmployees([record, ...others]);
  return record;
}

export async function listStaffEmployees(): Promise<Record<string, unknown>[]> {
  const merged: Record<string, unknown>[] = [];
  const seen = new Set<string>();
  let lastRateLimit: unknown;

  for (const path of [...new Set(staffSourcePaths())]) {
    try {
      const rows = await listPagedEmployeeRows(path);
      for (const row of rows) {
        const key = employeeKey(row);
        if (!key || seen.has(key)) continue;
        seen.add(key);
        merged.push(row);
      }
    } catch (error) {
      if (isRateLimited(error)) {
        lastRateLimit = error;
        continue;
      }
      if (isMissingRoute(error)) continue;
    }
  }

  if (merged.length === 0 && lastRateLimit instanceof ApiError) {
    throw lastRateLimit;
  }

  return mergeLocalEmployees(merged);
}

export async function getStaffEmployee(
  id: string,
): Promise<Record<string, unknown>> {
  const trimmed = id.trim();
  if (!trimmed) throw new ApiError(400, "Employee id is required.");

  let lastError: unknown;
  const paths = [
    `/employees/${trimmed}`,
    `/super-admin/employees/${trimmed}`,
    `/hr/employees/${trimmed}`,
  ];

  for (const path of paths) {
    try {
      return await apiRequest<Record<string, unknown>>(path);
    } catch (error) {
      lastError = error;
      if (isMissingRoute(error)) continue;
      throw error;
    }
  }

  if (lastError instanceof ApiError) throw lastError;
  throw new ApiError(404, "Employee not found.");
}

export async function findStaffEmployeeByEmail(email: string) {
  const needle = email.trim().toLowerCase();
  if (!needle) return null;
  const query = buildQuery({ email: needle, q: needle, search: needle, limit: 50 });
  const paths = [`/employees${query}`, `/super-admin/employees${query}`];
  for (const path of paths) {
    try {
      const match = rowsFrom(await apiRequest(path)).find((row) => {
        return employeeKey(row) === needle;
      });
      if (match) return match;
    } catch (error) {
      if (isMissingRoute(error)) continue;
      throw error;
    }
  }
  return null;
}

export function buildEmployeeWriteBody(values: Record<string, string>) {
  const fullName = str(values.fullName).trim();
  const email = str(values.email).trim();
  const jobTitle = str(values.jobTitle).trim();
  const department = str(values.department).trim();
  const departmentIdRaw = str(values.departmentId).trim();
  const departmentLooksLikeId =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      department,
    );
  const departmentId = departmentIdRaw || (departmentLooksLikeId ? department : "");
  const role = str(values.role).trim() || "employee";
  const phone = str(values.phone).trim();
  const location = str(values.location).trim();
  const employmentType = str(values.employmentType).trim() || "Full-time";
  const locationType =
    str(values.locationType).trim().toLowerCase() || "onsite";
  const typedLocation =
    locationType === "remote" ? location || "Remote" : location;
  const staffType =
    role === "nysc" || role === "intern" ? role : "employee";

  const body: Record<string, unknown> = {
    fullName,
    name: fullName,
    jobTitle,
    title: jobTitle,
    position: jobTitle,
    role,
    staffType,
    employmentType,
    status: "active",
    locationType,
    location_type: locationType,
  };
  if (email) body.email = email;
  if (departmentId) {
    body.departmentId = departmentId;
    body.department_id = departmentId;
  }
  if (department) body.department = department;
  if (phone) body.phone = phone;
  if (typedLocation) {
    body.location = typedLocation;
    body.workLocation = typedLocation;
    body.work_location = typedLocation;
  }
  return body;
}

function isExistingEmailError(error: unknown) {
  if (!(error instanceof ApiError)) return false;
  if (error.status !== 409 && error.status !== 400) return false;
  return /already exists|duplicate/i.test(error.message);
}

export async function createStaffEmployee(values: Record<string, string>) {
  const body = buildEmployeeWriteBody(values);
  const email = str(body.email);
  let lastError: unknown;

  for (const path of CREATE_PATHS) {
    try {
      const created = await apiRequest<Record<string, unknown>>(path, {
        method: "POST",
        body,
      });
      return saveLocalEmployee(values, created);
    } catch (error) {
      lastError = error;
      if (
        error instanceof ApiError &&
        (error.status === 404 ||
          error.status === 405 ||
          error.status === 403)
      ) {
        continue;
      }
      if (isExistingEmailError(error) && email) {
        const existing = await findStaffEmployeeByEmail(email);
        if (existing) return saveLocalEmployee(values, existing);
      }
    }
  }

  if (isExistingEmailError(lastError) && email) {
    const existing = await findStaffEmployeeByEmail(email);
    if (existing) return saveLocalEmployee(values, existing);
    throw new ApiError(
      409,
      "A login account with that email already exists, but it is not in the staff directory. Use a different email, or restore that employee record on the server.",
      lastError instanceof ApiError ? lastError.body : undefined,
    );
  }

  return saveLocalEmployee(values);
}
