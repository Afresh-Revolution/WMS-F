export const accountantReportSummary = [
  {
    id: "payroll",
    label: "Current Net Payroll",
    value: "₦ 6,976,000",
    icon: "payroll" as const,
  },
  {
    id: "paid",
    label: "Total Paid To Date",
    value: "₦ 32.2M",
    icon: "paid" as const,
  },
  {
    id: "bills",
    label: "Outstanding Bills",
    value: "₦ 13,204,100",
    icon: "bills" as const,
  },
  {
    id: "expenses",
    label: "Monthly Expenses",
    value: "₦ 213,200",
    icon: "expenses" as const,
  },
];

export const accountantPayrollTrend = [
  { month: "Jun", value: 6890000 },
  { month: "Jul", value: 6890000 },
  { month: "Aug", value: 6976000 },
];

export const accountantSpendMix = [
  { label: "Bill", value: 5792132, color: "#c2410c" },
  { label: "Purchase", value: 1610000, color: "#fdba74" },
  { label: "Payroll", value: 24772312, color: "#ed5a28" },
];

export const accountantExpensesByCategory = [
  { label: "Travel", value: 65000 },
  { label: "Software", value: 50000 },
  { label: "Office Supplies", value: 25000 },
  { label: "Client Entertainment", value: 45000 },
  { label: "Training", value: 90000 },
];
