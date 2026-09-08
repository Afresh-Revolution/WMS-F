export type ProfileLeaveBalance = {
  id: string;
  label: string;
  remaining: number;
  total: number;
};

export type ProfileLeaveHistoryItem = {
  id: string;
  type: string;
  dates: string;
  duration: string;
  status: "Approved" | "Pending";
};

export type ProfileExpenseClaim = {
  id: string;
  title: string;
  date: string;
  amount: number;
  status: "Approved" | "Pending";
};

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
    reportsTo: "Admin",
  },
};

export const profileLeaveBalances: ProfileLeaveBalance[] = [
  { id: "annual", label: "Annual Leave", remaining: 13, total: 25 },
  { id: "sick", label: "Sick Leave", remaining: 7, total: 10 },
  { id: "personal", label: "Personal Leave", remaining: 3, total: 5 },
];

export const profileLeaveHistory: ProfileLeaveHistoryItem[] = [
  {
    id: "leave-1",
    type: "Annual leave",
    dates: "Aug 18 – Aug 22, 2025",
    duration: "5 days",
    status: "Approved",
  },
  {
    id: "leave-2",
    type: "Sick leave",
    dates: "Mar 4, 2025",
    duration: "1 day",
    status: "Approved",
  },
  {
    id: "leave-3",
    type: "Personal",
    dates: "Jun 10, 2025",
    duration: "1 day",
    status: "Approved",
  },
  {
    id: "leave-4",
    type: "Annual leave",
    dates: "Sep 10, 2026",
    duration: "1 day",
    status: "Pending",
  },
];

export const profileExpenseClaims: ProfileExpenseClaim[] = [
  {
    id: "expense-1",
    title: "Client dinner — BlueOak Hotel",
    date: "Jul 25",
    amount: 48500,
    status: "Pending",
  },
  {
    id: "expense-2",
    title: "Conference registration",
    date: "Jul 20",
    amount: 125000,
    status: "Approved",
  },
  {
    id: "expense-3",
    title: "Transport — airport to office",
    date: "Jul 24",
    amount: 12200,
    status: "Approved",
  },
];
