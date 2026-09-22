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
    nested.id ?? nested._id ?? row.id ?? nested.userId ?? user?.id ?? profile?.id,
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

function isMissingRoute(error: unknown) {
  if (!(error instanceof ApiError)) return true;
  return error.status === 404 || error.status === 405 || error.status === 403;
}

const LIST_QUERY = buildQuery({ page: 1, limit: 100 });

/** Live staff directory. Stop on the first mounted employees route. */
const LIST_PATHS = [
  `/employees${LIST_QUERY}`,
  "/employees",
  `/super-admin/employees${LIST_QUERY}`,
  "/super-admin/employees",
];

const MANAGER_LIST_PATHS = [
  `/manager/employees${LIST_QUERY}`,
  "/manager/employees",
];

function isManagerWorkspace() {
  const role = readCachedWorkspace()?.roleKey ?? "";
  return /hod|manager/i.test(role);
}

function staffListPaths() {
  return isManagerWorkspace()
    ? [...MANAGER_LIST_PATHS, ...LIST_PATHS]
    : [...LIST_PATHS, ...MANAGER_LIST_PATHS];
}

const CREATE_PATHS = ["/employees", "/hr/employees", "/super-admin/employees"];

export async function listStaffEmployees(): Promise<Record<string, unknown>[]> {
  let lastError: unknown;

  for (const path of staffListPaths()) {
    try {
      return rowsFrom(await apiRequest(path));
    } catch (error) {
      lastError = error;
      if (isMissingRoute(error)) continue;
      throw error;
    }
  }

  if (lastError instanceof ApiError) throw lastError;
  return [];
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
      return await apiRequest<Record<string, unknown>>(path, {
        method: "POST",
        body,
      });
    } catch (error) {
      lastError = error;
      if (error instanceof ApiError && (error.status === 404 || error.status === 405)) {
        continue;
      }
      break;
    }
  }

  if (isExistingEmailError(lastError) && email) {
    const existing = await findStaffEmployeeByEmail(email);
    if (existing) return existing;
    throw new ApiError(
      409,
      "A login account with that email already exists, but it is not in the staff directory. Use a different email, or restore that employee record on the server.",
      lastError instanceof ApiError ? lastError.body : undefined,
    );
  }

  if (lastError instanceof ApiError) throw lastError;
  throw new ApiError(404, "Could not create the employee.");
}
