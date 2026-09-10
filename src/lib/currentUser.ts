import { CURRENT_USER_KEY, getSessionToken } from "@/lib/api/client";

export type CurrentUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  initials: string;
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
  const roleValue = user.role ?? user.roles;
  const roleRecord = asRecord(roleValue);
  const roleFromArray = Array.isArray(roleValue)
    ? readString(asRecord(roleValue[0]) ?? {}, ["name", "title", "label", "slug"]) ||
      (typeof roleValue[0] === "string" ? roleValue[0] : "")
    : "";
  const role =
    typeof roleValue === "string"
      ? roleValue
      : roleRecord
        ? readString(roleRecord, ["name", "title", "label", "slug"])
        : roleFromArray || readString(user, ["roleName", "title", "jobTitle"]);
  const id = readString(user, ["id", "userId", "sub"]) || email;
  const initials =
    readString(user, ["initials"]) || initialsFromIdentity(name, email);

  if (!name && !email && !initials) return null;

  return {
    id,
    email,
    name,
    role: formatRoleLabel(role),
    initials,
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
