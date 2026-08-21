export type FinanceModuleTab =
  | "Payroll"
  | "Purchases"
  | "Bills"
  | "Expenses"
  | "Vendors";

export type PayrollSectionTab = "Pay runs" | "Payslips" | "Deductions" | "Vendors";

export type PayRunStatus = "Processing" | "Completed";

export type PayRun = {
  id: string;
  ref: string;
  period: string;
  runDate: string;
  staff: number;
  totalAmount: string;
  status: PayRunStatus;
};

export const financeModuleTabs: FinanceModuleTab[] = [
  "Payroll",
  "Purchases",
  "Bills",
  "Expenses",
  "Vendors",
];

export const payrollSectionTabs: PayrollSectionTab[] = [
  "Pay runs",
  "Payslips",
  "Deductions",
  "Vendors",
];

export const payrollStats = [
  { id: "attainment", value: "96%", label: "Jul 2025" },
  { id: "cycle-total", value: "₦ 42.8M", label: "this cycle" },
  { id: "active-staff", value: "1,248", label: "Active" },
  { id: "due", value: "4", label: "this week" },
] as const;

export const payRuns: PayRun[] = [
  {
    id: "1",
    ref: "PR-0047",
    period: "July 2025",
    runDate: "Jul 28",
    staff: 1248,
    totalAmount: "₦ 42,838,400",
    status: "Processing",
  },
  {
    id: "2",
    ref: "PR-0046",
    period: "June 2025",
    runDate: "Jun 27",
    staff: 1243,
    totalAmount: "₦ 42,300,700",
    status: "Completed",
  },
  {
    id: "3",
    ref: "PR-0045",
    period: "May 2025",
    runDate: "May 28",
    staff: 1230,
    totalAmount: "₦ 41,875,600",
    status: "Completed",
  },
  {
    id: "4",
    ref: "PR-0044",
    period: "April 2025",
    runDate: "Apr 26",
    staff: 1219,
    totalAmount: "₦ 41,650,600",
    status: "Completed",
  },
];
