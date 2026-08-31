export type ProfileLeaveBalance = {
  id: string;
  label: string;
  remaining: number;
  total: number;
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
    reportsTo: "",
  },
};

export const profileLeaveBalances: ProfileLeaveBalance[] = [
  { id: "annual", label: "Annual Leave", remaining: 13, total: 25 },
  { id: "sick", label: "Sick Leave", remaining: 7, total: 10 },
  { id: "personal", label: "Personal Leave", remaining: 3, total: 5 },
];
