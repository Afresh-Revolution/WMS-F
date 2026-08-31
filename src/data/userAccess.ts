export type AccessStatus = "Active" | "Inactive" | "Locked";

export type AccessRole =
  | "Super Admin"
  | "Admin"
  | "HR Manager"
  | "Finance"
  | "Manager"
  | "Employee";

export type AccessFilter = "All" | AccessStatus;

export type AccessUser = {
  id: string;
  name: string;
  initials: string;
  email: string;
  role: AccessRole;
  department: string;
  status: AccessStatus;
  lastActive: string;
  avatarColor: string;
};

export const accessFilters: AccessFilter[] = [
  "All",
  "Active",
  "Inactive",
  "Locked",
];

export const accessStats = [
  {
    id: "total",
    label: "Total users",
    value: "10",
    detail: "All roles",
    detailTone: "muted" as const,
  },
  {
    id: "active",
    label: "Active",
    value: "8",
    detail: "Signed in",
    detailTone: "orange" as const,
  },
  {
    id: "locked",
    label: "Locked",
    value: "1",
    detail: "Blocked",
    detailTone: "red" as const,
  },
  {
    id: "admins",
    label: "Admins",
    value: "2",
    detail: "1 super",
    detailTone: "amber" as const,
  },
] as const;

export const accessUsers: AccessUser[] = [
  {
    id: "1",
    name: "Maya Chen",
    initials: "MC",
    email: "maya.chen@afresh.co",
    role: "Super Admin",
    department: "IT & Operations",
    status: "Active",
    lastActive: "Active 2h ago",
    avatarColor: "#fde68a",
  },
  {
    id: "2",
    name: "David Okoye",
    initials: "DO",
    email: "david.okoye@afresh.co",
    role: "Admin",
    department: "People Ops",
    status: "Active",
    lastActive: "Active 35m ago",
    avatarColor: "#bfdbfe",
  },
  {
    id: "3",
    name: "Amara Nwosu",
    initials: "AN",
    email: "amara.nwosu@afresh.co",
    role: "HR Manager",
    department: "People Ops",
    status: "Active",
    lastActive: "Active 1h ago",
    avatarColor: "#fecdd3",
  },
  {
    id: "4",
    name: "Ravi Kapoor",
    initials: "RK",
    email: "ravi.kapoor@afresh.co",
    role: "Finance",
    department: "Finance",
    status: "Active",
    lastActive: "Active 4h ago",
    avatarColor: "#bbf7d0",
  },
  {
    id: "5",
    name: "Grace Bello",
    initials: "GB",
    email: "grace.bello@afresh.co",
    role: "Manager",
    department: "Operations",
    status: "Active",
    lastActive: "Active yesterday",
    avatarColor: "#ddd6fe",
  },
  {
    id: "6",
    name: "Nina Patel",
    initials: "NP",
    email: "nina.patel@afresh.co",
    role: "Employee",
    department: "Media",
    status: "Active",
    lastActive: "Active 3h ago",
    avatarColor: "#fed7aa",
  },
  {
    id: "7",
    name: "Tunde Balogun",
    initials: "TB",
    email: "tunde.balogun@afresh.co",
    role: "Manager",
    department: "Sales",
    status: "Active",
    lastActive: "Active 6h ago",
    avatarColor: "#a5f3fc",
  },
  {
    id: "8",
    name: "Omar Reyes",
    initials: "OR",
    email: "omar.reyes@afresh.co",
    role: "Employee",
    department: "Engineering",
    status: "Inactive",
    lastActive: "Inactive 12d ago",
    avatarColor: "#e7e5e4",
  },
  {
    id: "9",
    name: "Lena Fisher",
    initials: "LF",
    email: "lena.fisher@afresh.co",
    role: "Employee",
    department: "Hardware",
    status: "Locked",
    lastActive: "Locked 2d ago",
    avatarColor: "#fecaca",
  },
  {
    id: "10",
    name: "Chidi Eze",
    initials: "CE",
    email: "chidi.eze@afresh.co",
    role: "Employee",
    department: "Product",
    status: "Active",
    lastActive: "Active 55m ago",
    avatarColor: "#fbcfe8",
  },
];
