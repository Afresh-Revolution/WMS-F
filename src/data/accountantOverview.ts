export type AccountantStatTone =
  | "neutral"
  | "info"
  | "success"
  | "warning"
  | "danger"
  | "muted";

export type AccountantStat = {
  id: string;
  label: string;
  value: string;
  meta: string;
  tone?: AccountantStatTone;
};

export type AccountantBill = {
  id: string;
  name: string;
  category: string;
  dueDate: string;
  amount: string;
  timing: string;
  overdue?: boolean;
};

export type AccountantPurchaseReview = {
  id: string;
  title: string;
  department: string;
  requestor: string;
  amount: string;
  action: "Review" | "Pay";
};

export type AccountantPayment = {
  id: string;
  name: string;
  type: "Bill" | "Purchase";
  date: string;
  amount: string;
};

export const accountantStats: AccountantStat[] = [
  {
    id: "period",
    label: "Current Payroll Period",
    value: "August 2026",
    meta: "In Preparation",
    tone: "info",
  },
  {
    id: "prep",
    label: "Payroll Preparation",
    value: "100%",
    meta: "12/12 recorded",
    tone: "success",
  },
  {
    id: "salary",
    label: "Total Monthly Salary",
    value: "₦ 6.9M",
    meta: "Base",
    tone: "muted",
  },
  {
    id: "bonuses",
    label: "Total Monthly Bonuses",
    value: "₦ 250K",
    meta: "This run",
    tone: "muted",
  },
  {
    id: "increments",
    label: "Increments Awaiting Implementation",
    value: "2",
    meta: "Approved",
    tone: "success",
  },
  {
    id: "approval",
    label: "Payroll Awaiting Admin Approval",
    value: "1",
    meta: "Submitted",
    tone: "info",
  },
  {
    id: "purchases-review",
    label: "Purchases Under Review",
    value: "2",
    meta: "Review",
    tone: "warning",
  },
  {
    id: "purchases-pay",
    label: "Purchases Awaiting Payment",
    value: "1",
    meta: "Approved",
    tone: "success",
  },
  {
    id: "unpaid-bills",
    label: "Unpaid Bills",
    value: "6",
    meta: "₦ 13.2M",
    tone: "muted",
  },
  {
    id: "bills-soon",
    label: "Bills Due Soon",
    value: "3",
    meta: "in 5 days",
    tone: "warning",
  },
  {
    id: "overdue",
    label: "Overdue Bills",
    value: "2",
    meta: "Urgent",
    tone: "danger",
  },
  {
    id: "expenses",
    label: "Monthly Expense Total",
    value: "₦ 213K",
    meta: "This month",
    tone: "muted",
  },
  {
    id: "expense-reviews",
    label: "Pending Expense Reviews",
    value: "3",
    meta: "Awaiting",
    tone: "warning",
  },
  {
    id: "reimbursements",
    label: "Pending Reimbursements",
    value: "3",
    meta: "₦ 158K",
    tone: "muted",
  },
  {
    id: "receipts",
    label: "Missing Receipts",
    value: "2",
    meta: "Follow up",
    tone: "warning",
  },
  {
    id: "invoices",
    label: "Missing Invoices",
    value: "2",
    meta: "Follow up",
    tone: "warning",
  },
];

export const accountantBills: AccountantBill[] = [
  {
    id: "1",
    name: "ARM Pensions",
    category: "Statutory",
    dueDate: "Due Aug 13",
    amount: "₦ 840,000",
    timing: "in 2d",
  },
  {
    id: "2",
    name: "FIRS Tax Remittance",
    category: "Statutory",
    dueDate: "Due Aug 14",
    amount: "₦ 1,250,000",
    timing: "in 3d",
  },
  {
    id: "3",
    name: "Prestige Health HMO",
    category: "Benefits",
    dueDate: "Due Aug 9",
    amount: "₦ 620,000",
    timing: "4d overdue",
    overdue: true,
  },
  {
    id: "4",
    name: "NHF Remittance",
    category: "Statutory",
    dueDate: "Due Aug 15",
    amount: "₦ 95,000",
    timing: "in 4d",
  },
  {
    id: "5",
    name: "Lagos Water Board",
    category: "Utilities",
    dueDate: "Due Aug 16",
    amount: "₦ 48,500",
    timing: "in 5d",
  },
];

export const accountantPurchaseReviews: AccountantPurchaseReview[] = [
  {
    id: "1",
    title: "Design & prototyping licenses (6 seats)",
    department: "Product",
    requestor: "Nina Patel",
    amount: "₦ 186,000",
    action: "Review",
  },
  {
    id: "2",
    title: "HRIS module upgrade",
    department: "People Ops",
    requestor: "Jordan Lee",
    amount: "₦ 420,000",
    action: "Review",
  },
  {
    id: "3",
    title: "Soldering stations (x4)",
    department: "Operations",
    requestor: "Sam Okoro",
    amount: "₦ 312,000",
    action: "Pay",
  },
];

export const accountantPayrollSummary = {
  period: "August 2026 payroll",
  status: "In Preparation",
  staff: 12,
  lines: [
    { label: "Gross payable", value: "₦ 7,140,000" },
    { label: "Total bonuses", value: "₦ 250,000" },
    { label: "Total deductions", value: "₦ 414,000" },
    { label: "Net payable", value: "₦ 6,976,000", emphasize: true },
  ],
};

export const accountantRecentPayments: AccountantPayment[] = [
  {
    id: "1",
    name: "Office Supplies Co.",
    type: "Bill",
    date: "Aug 8",
    amount: "₦ 84,200",
  },
  {
    id: "2",
    name: "IT Infrastructure Ltd",
    type: "Purchase",
    date: "Aug 7",
    amount: "₦ 1,450,000",
  },
  {
    id: "3",
    name: "Lagos Water Board",
    type: "Bill",
    date: "Aug 6",
    amount: "₦ 48,500",
  },
  {
    id: "4",
    name: "Prestige Equipment",
    type: "Purchase",
    date: "Aug 5",
    amount: "₦ 312,000",
  },
];
