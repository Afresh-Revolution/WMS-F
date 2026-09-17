export type DepartmentFilter = "All departments" | "Active" | "No HOD";

export type Department = {
  id: string;
  name: string;
  managerInitials: string;
  managerName: string;
  managerAvatarColor: string;
  activeCount: number;
  targetPercent: number;
  status: "Active" | "Inactive";
  hasHod: boolean;
  icon: "software" | "fashion" | "media" | "hardware" | "hr" | "model";
};

export const departmentStats = [
  { id: "departments", label: "Departments", value: "6" },
  { id: "headcount", label: "Total Headcount", value: "1,248" },
  { id: "unassignedHod", label: "HOD Not assigned", value: "0" },
] as const;

export const departmentFilters: DepartmentFilter[] = [
  "All departments",
  "Active",
  "No HOD",
];

export const departments: Department[] = [
  {
    id: "1",
    name: "Software Engineers",
    managerInitials: "GR",
    managerName: "Grace Rogers",
    managerAvatarColor: "#bfdbfe",
    activeCount: 310,
    targetPercent: 81,
    status: "Active",
    hasHod: true,
    icon: "software",
  },
  {
    id: "2",
    name: "Fashion",
    managerInitials: "TG",
    managerName: "Thea Grant",
    managerAvatarColor: "#ddd6fe",
    activeCount: 105,
    targetPercent: 72,
    status: "Active",
    hasHod: true,
    icon: "fashion",
  },
  {
    id: "3",
    name: "Media/Photography",
    managerInitials: "NP",
    managerName: "Nina Patel",
    managerAvatarColor: "#fde68a",
    activeCount: 83,
    targetPercent: 85,
    status: "Active",
    hasHod: true,
    icon: "media",
  },
  {
    id: "4",
    name: "Hardware",
    managerInitials: "JF",
    managerName: "Jane Fisher",
    managerAvatarColor: "#fecdd3",
    activeCount: 103,
    targetPercent: 80,
    status: "Active",
    hasHod: true,
    icon: "hardware",
  },
  {
    id: "5",
    name: "HR",
    managerInitials: "MC",
    managerName: "Maya Chen",
    managerAvatarColor: "#bbf7d0",
    activeCount: 28,
    targetPercent: 85,
    status: "Active",
    hasHod: true,
    icon: "hr",
  },
  {
    id: "6",
    name: "Model",
    managerInitials: "RK",
    managerName: "Ravi Kapoor",
    managerAvatarColor: "#fed7aa",
    activeCount: 44,
    targetPercent: 80,
    status: "Active",
    hasHod: true,
    icon: "model",
  },
];
