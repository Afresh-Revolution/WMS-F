import { CURRENT_USER_KEY, getSessionToken } from "@/lib/api/client";
import { preferredRoleLabel } from "@/lib/auth/portals";

export type CurrentUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  initials: string;
  employeeId?: string;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function readString(record: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return "";
}

function nameFromEmail(email: string): string {
  const local = email.split("@")[0] ?? "";
  return local
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

export function initialsFromIdentity(name: string, email = ""): string {
  const source =
    name.trim() && !name.includes("@")
      ? name
      : (email.split("@")[0] ?? "").replace(/[._-]+/g, " ");
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
}

export function formatRoleLabel(role: string, fallback = ""): string {
  if (!role.trim()) return fallback;
  return role
    .replace(/[_-]+/g, " ")
    .trim()
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const padded = payload.replace(/-/g, "+").replace(/_/g, "/");
    const pad =
      padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
    return JSON.parse(atob(padded + pad)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function readEmployeeId(record: Record<string, unknown>): string {
  const employee =
    asRecord(record.employee) ??
    asRecord(record.profile) ??
    asRecord(record.staff);
  return (
    readString(record, [
      "employeeId",
      "employee_id",
      "staffId",
      "staff_id",
    ]) ||
    (employee
      ? readString(employee, ["id", "employeeId", "employee_id", "_id"])
      : "")
  );
}

function collectRoleStrings(record: Record<string, unknown>): string[] {
  const roles: string[] = [];

  const push = (value: unknown) => {
    if (typeof value === "string" && value.trim()) {
      roles.push(value.trim());
      return;
    }
    const nested = asRecord(value);
    if (nested) {
      const named = readString(nested, [
        "name",
        "title",
        "label",
        "slug",
        "code",
        "key",
      ]);
      if (named) roles.push(named);
      return;
    }
    if (Array.isArray(value)) {
      for (const item of value) push(item);
    }
  };

  push(record.role);
  push(record.roles);
  push(record.userRole);
  push(record.user_role);
  push(record.roleName);
  push(record.role_name);
  push(record.accountType);
  push(record.account_type);
  push(record.userType);
  push(record.user_type);
  push(record.profileType);
  push(record.portal);
  return roles;
}

export function parseAuthUser(payload: unknown): CurrentUser | null {
  const root = asRecord(payload);
  if (!root) return null;

  const data = asRecord(root.data) ?? root;
  const nestedUser = asRecord(data.user) ?? asRecord(root.user) ?? asRecord(data.profile);
  const user =
    nestedUser ??
    (data.email || data.name || data.id || data.sub || data.firstName
      ? data
      : null);
  if (!user) return null;

  const email = readString(user, ["email", "workEmail", "companyEmail"]);
  const firstName = readString(user, ["firstName", "first_name", "givenName"]);
  const lastName = readString(user, ["lastName", "last_name", "familyName"]);
  const combined = [firstName, lastName].filter(Boolean).join(" ");
  const name =
    readString(user, ["name", "fullName", "full_name", "displayName", "username"]) ||
    combined ||
    (email ? nameFromEmail(email) : "");
  const role = preferredRoleLabel([
    ...collectRoleStrings(user),
    ...collectRoleStrings(data),
    ...collectRoleStrings(root),
  ]);
  const id = readString(user, ["id", "userId", "sub"]) || email;
  const initials =
    readString(user, ["initials"]) || initialsFromIdentity(name, email);
  const employeeId =
    readEmployeeId(user) || readEmployeeId(data) || readEmployeeId(root);

  if (!name && !email && !initials) return null;

  return {
    id,
    email,
    name,
    role: formatRoleLabel(role),
    initials,
    ...(employeeId ? { employeeId } : {}),
  };
}

export function cacheCurrentUser(user: CurrentUser | null) {
  if (typeof window === "undefined") return;
  if (!user) {
    localStorage.removeItem(CURRENT_USER_KEY);
    return;
  }
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
}

export function readCachedCurrentUser(): CurrentUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CurrentUser;
    if (!parsed || typeof parsed !== "object") return null;
    if (!parsed.initials && !parsed.name && !parsed.email) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function readUserFromSessionToken(): CurrentUser | null {
  const token = getSessionToken();
  if (!token) return null;
  return parseAuthUser(decodeJwtPayload(token));
}

export function readCachedOrJwtUser(): CurrentUser | null {
  return readCachedCurrentUser() ?? readUserFromSessionToken();
}

export function cacheCurrentUserFromPayload(payload: unknown) {
  const parsed = parseAuthUser(payload);
  if (parsed) cacheCurrentUser(parsed);
}
