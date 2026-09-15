export type AccountantPaymentCategory =
  | "Payroll"
  | "Bill"
  | "Purchase"
  | "Reimbursement"
  | "Expense";

export type AccountantPaymentStatus = "Paid" | "Scheduled";

export type AccountantPaymentFilter =
  | "All"
  | AccountantPaymentCategory
  | "Missing evidence";

export type AccountantPaymentRecord = {
  id: string;
  ref: string;
  payee: string;
  category: AccountantPaymentCategory;
  date: string;
  amount: string;
  amountValue: number;
  status: AccountantPaymentStatus;
  evidence?: string;
};

export const accountantPaymentFilters: AccountantPaymentFilter[] = [
  "All",
  "Payroll",
  "Bill",
  "Purchase",
  "Reimbursement",
  "Expense",
  "Missing evidence",
];

export const accountantPaymentRecords: AccountantPaymentRecord[] = [
  {
    id: "1",
    ref: "PAY-2051",
    payee: "Office Supplies Co.",
    category: "Bill",
    date: "Aug 5, 2026",
    amount: "₦ 184,000",
    amountValue: 184000,
    status: "Paid",
    evidence: "transfer-osc.pdf",
  },
  {
    id: "2",
    ref: "PAY-2047",
    payee: "Lagos Water Board",
    category: "Bill",
    date: "Aug 1, 2026",
    amount: "₦ 42,000",
    amountValue: 42000,
    status: "Paid",
    evidence: "transfer-lwb.pdf",
  },
  {
    id: "3",
    ref: "PAY-2055",
    payee: "ARM Pensions",
    category: "Bill",
    date: "Aug 13, 2026",
    amount: "₦ 5,566,132",
    amountValue: 5566132,
    status: "Scheduled",
  },
  {
    id: "4",
    ref: "PAY-2049",
    payee: "IT Infrastructure Ltd",
    category: "Purchase",
    date: "Aug 3, 2026",
    amount: "₦ 1,200,000",
    amountValue: 1200000,
    status: "Paid",
    evidence: "receipt-itinfra.pdf",
  },
  {
    id: "5",
    ref: "PAY-2044",
    payee: "Prestige Equipment",
    category: "Purchase",
    date: "Aug 8, 2026",
    amount: "₦ 410,000",
    amountValue: 410000,
    status: "Paid",
    evidence: "receipt-prestige.pdf",
  },
  {
    id: "6",
    ref: "PAY-2040",
    payee: "June 2026 Payroll",
    category: "Payroll",
    date: "Jun 28, 2026",
    amount: "₦ 24,772,312",
    amountValue: 24772312,
    status: "Paid",
    evidence: "payroll-june-schedule.pdf",
  },
];

export function formatPaymentNaira(amount: number) {
  return `₦ ${amount.toLocaleString("en-NG")}`;
}

export function matchesPaymentFilter(
  payment: AccountantPaymentRecord,
  filter: AccountantPaymentFilter,
) {
  if (filter === "All") return true;
  if (filter === "Missing evidence") return !payment.evidence;
  return payment.category === filter;
}
