import { WORKSPACE_KEY } from "@/lib/api/client";

export type Workspace = {
  roleKey: string;
  homePath: string;
  dashboardPath: string;
};

/** Role landing routes that exist in this app. */
const APP_HOME_PATHS = new Set(["/dashboard", "/employee", "/secretary"]);

const DEFAULT_HOME_PATH = "/dashboard";

/** Landing route per backend roleKey, used when homePath has no route here yet. */
const ROLE_HOME_PATHS: Record<string, string> = {
  super_admin: "/dashboard",
  superadmin: "/dashboard",
  admin: "/dashboard",
  hr: "/dashboard",
  hod: "/dashboard",
  manager: "/dashboard",
  accountant: "/dashboard",
  secretary: "/secretary",
  employee: "/employee",
  nysc: "/employee",
  nysc_intern: "/employee",
  intern: "/employee",
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

function normalizeRoleKey(role: string): string {
  return role.trim().toLowerCase().replace(/[\s-]+/g, "_");
}

export function parseWorkspace(payload: unknown): Workspace | null {
  const root = asRecord(payload);
  if (!root) return null;

  const data = asRecord(root.data) ?? root;
  const workspace = asRecord(data.workspace) ?? asRecord(root.workspace) ?? {};
  const user = asRecord(data.user) ?? asRecord(root.user) ?? data;

  const roleKey = normalizeRoleKey(
    readString(user, ["roleKey", "role_key"]) ||
      readString(workspace, ["roleKey", "role_key"]),
  );
  const homePath = readString(workspace, ["homePath", "home_path"]);
  const dashboardPath = readString(workspace, [
    "dashboardPath",
    "dashboard_path",
  ]);

  if (!roleKey && !homePath && !dashboardPath) return null;

  return { roleKey, homePath, dashboardPath };
}

/**
 * Landing route for a signed-in user. Prefers the backend's homePath, falling
 * back to roleKey while some workspaces (e.g. /super-admin) have no route here.
 */
export function resolveHomePath(workspace: Workspace | null): string {
  if (!workspace) return DEFAULT_HOME_PATH;
  if (APP_HOME_PATHS.has(workspace.homePath)) return workspace.homePath;
  return ROLE_HOME_PATHS[workspace.roleKey] ?? DEFAULT_HOME_PATH;
}

export function cacheWorkspace(workspace: Workspace | null) {
  if (typeof window === "undefined") return;
  if (!workspace) {
    localStorage.removeItem(WORKSPACE_KEY);
    return;
  }
  localStorage.setItem(WORKSPACE_KEY, JSON.stringify(workspace));
}

export function readCachedWorkspace(): Workspace | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(WORKSPACE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Workspace;
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function cacheWorkspaceFromPayload(payload: unknown) {
  const parsed = parseWorkspace(payload);
  if (parsed) cacheWorkspace(parsed);
}
