export type EmployeeDepartment =
  | "Software Engineer"
  | "Media/Photography"
  | "Hardware"
  | "Fashion"
  | "Model"
  | "HR"
  | (string & {});

export type EmployeeStatus = "Active" | "On leave";

export type Employee = {
  id: string;
  initials: string;
  name: string;
  title: string;
  location: string;
  department: string;
  email: string;
  status: EmployeeStatus;
  avatarColor: string;
};

export type DepartmentFilter = "All" | string;

export const departmentFilters: DepartmentFilter[] = [
  "All",
  "Software Engineer",
  "Media/Photography",
  "Hardware",
  "Fashion",
  "Model",
  "HR",
];

export const employees: Employee[] = [
  {
    id: "1",
    initials: "NP",
    name: "Nina Patel",
    title: "Senior Art Director",
    location: "London",
    department: "Media/Photography",
    email: "nina.p@afresh.com",
    status: "Active",
    avatarColor: "#fde68a",
  },
  {
    id: "2",
    initials: "OR",
    name: "Omar Reyes",
    title: "Staff Software Engineer",
    location: "Berlin",
    department: "Software Engineer",
    email: "omar.r@afresh.com",
    status: "Active",
    avatarColor: "#bfdbfe",
  },
  {
    id: "3",
    initials: "LF",
    name: "Lena Fisher",
    title: "Hardware Lead",
    location: "Remote",
    department: "Hardware",
    email: "lena.f@afresh.com",
    status: "Active",
    avatarColor: "#fecdd3",
  },
  {
    id: "4",
    initials: "TG",
    name: "Theo Grant",
    title: "Fashion Executive",
    location: "Lagos",
    department: "Fashion",
    email: "theo.g@afresh.com",
    status: "On leave",
    avatarColor: "#ddd6fe",
  },
  {
    id: "5",
    initials: "MC",
    name: "Maya Chen",
    title: "Staff Operations",
    location: "London",
    department: "HR",
    email: "maya.c@afresh.com",
    status: "Active",
    avatarColor: "#bbf7d0",
  },
  {
    id: "6",
    initials: "RK",
    name: "Ravi Kapoor",
    title: "Model Coordinator",
    location: "Jaipur",
    department: "Model",
    email: "ravi.k@afresh.com",
    status: "Active",
    avatarColor: "#fed7aa",
  },
];
