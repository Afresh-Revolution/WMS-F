<<<<<<< HEAD
export type ProfileTab = "Overview" | "Leave" | "Expenses";

export type LeaveHistoryStatus = "Approved" | "Pending";

export type LeaveHistoryItem = {
  id: string;
  type: string;
  dateRange: string;
  days: number;
  status: LeaveHistoryStatus;
};

export type LeaveBalanceItem = {
=======
export type ProfileLeaveBalance = {
>>>>>>> 37eb1224d5b2fc1ab1c618b51d1c98ba658180c9
  id: string;
  label: string;
  remaining: number;
  total: number;
};

<<<<<<< HEAD
export type ProfileDetail = {
  label: string;
  value: string;
  badge?: string;
};

export const profileTabs: ProfileTab[] = ["Overview", "Leave", "Expenses"];

export const profileTabRoutes: Record<ProfileTab, string> = {
  Overview: "/profile",
  Leave: "/profile/leave",
  Expenses: "/profile/expenses",
};

export const profile = {
  initials: "MC",
  name: "Maya Chen",
  role: "Staff Operations Manager",
  department: "HR",
  employeeId: "AFR-2024-0142",
  status: "Active" as const,
  annualLeaveDays: 13,
};

export const personalDetails: ProfileDetail[] = [
  { label: "Work email", value: "maya@afresh.com", badge: "Company" },
  { label: "Personal email", value: "maya.chen@gmail.com" },
  { label: "Phone", value: "+44 7700 900123" },
  { label: "Location", value: "London, UK" },
];

export const employmentDetails: ProfileDetail[] = [
  { label: "Role", value: "Staff Operations Manager" },
  { label: "Department", value: "HR" },
  { label: "Start date", value: "January 15, 2024" },
  { label: "Employment type", value: "Full-time" },
  { label: "Reports to", value: "Admin" },
];

export const leaveBalances: LeaveBalanceItem[] = [
=======
export const profileRecord = {
  initials: "MC",
  name: "Maya Chen",
  jobTitle: "Staff Operations Manager",
  department: "HR",
  status: "Active" as const,
  employeeId: "AFR-2024-0142",
  annualLeaveDays: 13,
  personal: {
    companyEmail: "maya@afresh.com",
    personalEmail: "maya.chen@gmail.com",
    phone: "+44 7700 900123",
    location: "London, UK",
  },
  employment: {
    role: "Staff Operations Manager",
    department: "HR",
    startDate: "January 15, 2024",
    type: "Full-time",
    reportsTo: "",
  },
};

export const profileLeaveBalances: ProfileLeaveBalance[] = [
>>>>>>> 37eb1224d5b2fc1ab1c618b51d1c98ba658180c9
  { id: "annual", label: "Annual Leave", remaining: 13, total: 25 },
  { id: "sick", label: "Sick Leave", remaining: 7, total: 10 },
  { id: "personal", label: "Personal Leave", remaining: 3, total: 5 },
];
<<<<<<< HEAD

export const leaveHistory: LeaveHistoryItem[] = [
  {
    id: "1",
    type: "Annual leave",
    dateRange: "Aug 18 - Aug 22, 2025",
    days: 5,
    status: "Approved",
  },
  {
    id: "2",
    type: "Sick leave",
    dateRange: "Jul 10 - Jul 11, 2025",
    days: 2,
    status: "Approved",
  },
  {
    id: "3",
    type: "Personal",
    dateRange: "Jun 3 - Jun 4, 2025",
    days: 2,
    status: "Approved",
  },
  {
    id: "4",
    type: "Annual leave",
    dateRange: "Sep 2 - Sep 6, 2025",
    days: 5,
    status: "Pending",
  },
];
=======
>>>>>>> 37eb1224d5b2fc1ab1c618b51d1c98ba658180c9
