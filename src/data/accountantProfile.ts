export type AccountantProfileTab = "Overview" | "Leave" | "Expenses";

export type AccountantLeaveBalance = {
  id: string;
  label: string;
  remaining: number;
  total: number;
};

export const accountantProfileTabs: AccountantProfileTab[] = [
  "Overview",
  "Leave",
  "Expenses",
];

export const accountantProfile = {
  initials: "TL",
  name: "Timothy Lamvong Timjul",
  jobTitle: "Staff Operations Manager",
  department: "HR",
  status: "Active" as const,
  employeeId: "AFR-2024-0142",
  annualLeaveDays: 13,
  personal: {
    companyEmail: "timothy@afresh.com",
    personalEmail: "timothy.timjul@gmail.com",
    phone: "+234 801 234 5678",
    location: "Lagos, Nigeria",
  },
  employment: {
    role: "Staff Operations Manager",
    department: "HR",
    startDate: "January 15, 2024",
    type: "Full-time",
    reportsTo: "Admin",
  },
};

export const accountantLeaveBalances: AccountantLeaveBalance[] = [
  { id: "annual", label: "Annual Leave", remaining: 13, total: 25 },
  { id: "sick", label: "Sick Leave", remaining: 7, total: 10 },
  { id: "personal", label: "Personal Leave", remaining: 3, total: 5 },
];

export const accountantProfileLeaveHistory = [
  {
    id: "1",
    type: "Annual Leave",
    dates: "Jul 14 – Jul 18, 2026",
    days: "5 days",
    status: "Approved",
  },
  {
    id: "2",
    type: "Sick Leave",
    dates: "Jun 3, 2026",
    days: "1 day",
    status: "Approved",
  },
  {
    id: "3",
    type: "Personal Leave",
    dates: "May 20, 2026",
    days: "1 day",
    status: "Approved",
  },
];

export const accountantProfileExpenses = [
  {
    id: "1",
    ref: "EX-0448",
    category: "Travel",
    note: "Client site visit",
    amount: "₦ 28,500",
    status: "Reimbursed",
    date: "Jul 22, 2026",
  },
  {
    id: "2",
    ref: "EX-0439",
    category: "Meals",
    note: "Team lunch",
    amount: "₦ 18,200",
    status: "Verified",
    date: "Jul 10, 2026",
  },
];
