export type AppPortal =
  | "superadmin"
  | "accountant"
  | "nysc"
  | "secretary"
  | "manager"
  | "employee";

function normalizeRole(role: string): string {
  return role.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

const PORTAL_ALIASES: Record<string, AppPortal> = {
  superadmin: "superadmin",
  superadministrator: "superadmin",
  systemadmin: "superadmin",
  admin: "superadmin",
  hrmanager: "superadmin",
  humanresources: "superadmin",
  hr: "superadmin",
  secretary: "secretary",
  accountant: "accountant",
  finance: "accountant",
  accounts: "accountant",
  accountofficer: "accountant",
  nysc: "nysc",
  intern: "nysc",
  nyscintern: "nysc",
  corpsmember: "nysc",
  corper: "nysc",
  employee: "employee",
  staff: "employee",
  manager: "manager",
  hod: "manager",
  headofdepartment: "manager",
  linemanager: "manager",
};

export function portalForRole(role: string): AppPortal {
  const key = normalizeRole(role);
  if (PORTAL_ALIASES[key]) return PORTAL_ALIASES[key];
  if (key.includes("superadmin") || key.includes("admin")) return "superadmin";
  if (key.includes("account") || key.includes("finance")) return "accountant";
  if (key.includes("nysc") || key.includes("intern") || key.includes("corps")) {
    return "nysc";
  }
  if (key.includes("secretar")) return "secretary";
  if (key.includes("hod") || key.includes("manager")) return "manager";
  if (key.includes("hr")) return "superadmin";
  return "employee";
}

const PORTAL_RANK: Record<AppPortal, number> = {
  superadmin: 0,
  accountant: 1,
  nysc: 2,
  secretary: 3,
  manager: 4,
  employee: 5,
};

/** Prefer a section-specific role when the payload lists several (e.g. user + accountant). */
export function preferredRoleLabel(roles: string[]): string {
  const cleaned = roles.map((role) => role.trim()).filter(Boolean);
  if (cleaned.length === 0) return "";
  return cleaned.reduce((best, role) => {
    const bestRank = PORTAL_RANK[portalForRole(best)];
    const nextRank = PORTAL_RANK[portalForRole(role)];
    return nextRank < bestRank ? role : best;
  });
}

export const CHANGE_PASSWORD_PATH = "/change-password";

export function homePathForRole(role: string): string {
  switch (portalForRole(role)) {
    case "accountant":
      return "/accountant";
    case "nysc":
      return "/nysc";
    case "secretary":
      return "/secretary";
    case "manager":
      return "/manager";
    case "employee":
      return "/employee";
    default:
      return "/dashboard";
  }
}

export function portalForPath(pathname: string): AppPortal | null {
  if (pathname === "/sign-out" || pathname.startsWith("/sign-out/")) {
    return null;
  }
  if (
    pathname === CHANGE_PASSWORD_PATH ||
    pathname.startsWith(`${CHANGE_PASSWORD_PATH}/`)
  ) {
    return null;
  }
  if (pathname === "/accountant" || pathname.startsWith("/accountant/")) {
    return "accountant";
  }
  if (pathname === "/nysc" || pathname.startsWith("/nysc/")) {
    return "nysc";
  }
  if (pathname === "/secretary" || pathname.startsWith("/secretary/")) {
    return "secretary";
  }
  if (pathname === "/employee" || pathname.startsWith("/employee/")) {
    return "employee";
  }
  if (pathname === "/manager" || pathname.startsWith("/manager/")) {
    return "manager";
  }
  return "superadmin";
}

export function canAddUsers(role: string): boolean {
  const key = role.toLowerCase().replace(/[\s-]+/g, "_");
  if (key === "hod" || key.includes("head_of_department")) return false;
  return (
    key.includes("super_admin") ||
    key === "superadmin" ||
    key === "admin" ||
    key === "manager" ||
    key === "hr" ||
    key.includes("human_resource")
  );
}

export function pathAllowedForRole(pathname: string, role: string): boolean {
  const pathPortal = portalForPath(pathname);
  if (!pathPortal) return true;
  const userPortal = portalForRole(role);
  if (userPortal === "superadmin") return true;
  return pathPortal === userPortal;
}
