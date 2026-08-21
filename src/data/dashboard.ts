export type LeaveStatus = "Approved" | "Pending" | "Rejected";

export type LeaveRequest = {
  id: string;
  name: string;
  initials: string;
  avatarColor: string;
  type: string;
  duration: string;
  status: LeaveStatus;
};

export type OverviewItem = {
  id: string;
  date: string;
  title: string;
};

export type DepartmentMetric = {
  name: string;
  value: number;
  max: number;
};

export type CompanyResource = {
  id: string;
  label: string;
  icon: "handbook" | "benefits" | "support" | "policy";
};

export type ActivityItem = {
  id: string;
  title: string;
  description: string;
  time: string;
};

export const stats = [
  { label: "Total Employees", value: "120" },
  { label: "Total Departments", value: "4" },
  { label: "Total Monthly Payroll", value: "₦ 42.8M" },
  { label: "Pending Approvals", value: "2" },
] as const;

export const leaveRequests: LeaveRequest[] = [
  {
    id: "1",
    name: "Amara Okafor",
    initials: "AO",
    avatarColor: "#fde68a",
    type: "Casual",
    duration: "2 days",
    status: "Approved",
  },
  {
    id: "2",
    name: "Tunde Adeyemi",
    initials: "TA",
    avatarColor: "#bfdbfe",
    type: "Sick",
    duration: "1 day",
    status: "Approved",
  },
  {
    id: "3",
    name: "Chioma Eze",
    initials: "CE",
    avatarColor: "#fecdd3",
    type: "Annual",
    duration: "5 days",
    status: "Pending",
  },
  {
    id: "4",
    name: "Ibrahim Musa",
    initials: "IM",
    avatarColor: "#bbf7d0",
    type: "Casual",
    duration: "1 day",
    status: "Approved",
  },
  {
    id: "5",
    name: "Fatima Bello",
    initials: "FB",
    avatarColor: "#ddd6fe",
    type: "Annual",
    duration: "3 days",
    status: "Pending",
  },
];

export const overviewItems: OverviewItem[] = [
  { id: "1", date: "12 Aug", title: "Quarterly performance review cycle opens" },
  { id: "2", date: "18 Aug", title: "Payroll processing for August" },
  { id: "3", date: "22 Aug", title: "Department heads strategy meeting" },
  { id: "4", date: "01 Sep", title: "New hire onboarding batch" },
  { id: "5", date: "05 Sep", title: "Benefits enrollment window closes" },
];

export const employeesByDepartment: DepartmentMetric[] = [
  { name: "Software Engineer", value: 42, max: 42 },
  { name: "Product", value: 18, max: 42 },
  { name: "Marketing", value: 14, max: 42 },
  { name: "Sales", value: 22, max: 42 },
  { name: "HR", value: 8, max: 42 },
  { name: "Finance", value: 16, max: 42 },
];

export const departmentPerformance: DepartmentMetric[] = [
  { name: "Software Engineer", value: 88, max: 100 },
  { name: "Product", value: 92, max: 100 },
  { name: "Marketing", value: 76, max: 100 },
  { name: "Sales", value: 84, max: 100 },
  { name: "HR", value: 95, max: 100 },
  { name: "Finance", value: 81, max: 100 },
];

export const companyResources: CompanyResource[] = [
  { id: "1", label: "Company handbook", icon: "handbook" },
  { id: "2", label: "Benefit program", icon: "benefits" },
  { id: "3", label: "IT Support", icon: "support" },
  { id: "4", label: "Leave policy", icon: "policy" },
];

export const recentActivity: ActivityItem[] = [
  {
    id: "1",
    title: "Leave approved",
    description: "Amara Okafor's casual leave request was approved.",
    time: "5 mins ago",
  },
  {
    id: "2",
    title: "New employee added",
    description: "Kemi Adesanya joined the Product department.",
    time: "1 hour ago",
  },
  {
    id: "3",
    title: "Payroll processed",
    description: "July payroll completed for all departments.",
    time: "3 hours ago",
  },
  {
    id: "4",
    title: "Promotion recorded",
    description: "Tunde Adeyemi promoted to Senior Analyst.",
    time: "Yesterday",
  },
  {
    id: "5",
    title: "Meeting scheduled",
    description: "All-hands meeting set for August 22.",
    time: "Yesterday",
  },
];
