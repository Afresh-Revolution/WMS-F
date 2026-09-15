export type AccountantBillStatus =
  | "Scheduled"
  | "Unpaid"
  | "Overdue"
  | "Paid";

export type AccountantBillFilter =
  | "All"
  | "Unpaid"
  | "Overdue"
  | "Due soon"
  | "Scheduled"
  | "Paid"
  | "Missing invoice";

export type AccountantBillItem = {
  id: string;
  ref: string;
  vendor: string;
  category: string;
  dueDate: string;
  invoice?: string;
  amount: string;
  amountValue: number;
  status: AccountantBillStatus;
  timing: string;
  paidDate?: string;
  missingInvoice?: boolean;
  overdue?: boolean;
  dueSoon?: boolean;
};

export const accountantBillFilters: AccountantBillFilter[] = [
  "All",
  "Unpaid",
  "Overdue",
  "Due soon",
  "Scheduled",
  "Paid",
  "Missing invoice",
];

export const accountantBillCategories = [
  "Statutory",
  "Benefits",
  "Utilities",
  "Supplies",
  "Services",
  "Other",
] as const;

export const accountantBillItems: AccountantBillItem[] = [
  {
    id: "1",
    ref: "BL-3301",
    vendor: "ARM Pensions",
    category: "Statutory",
    dueDate: "Due Aug 13, 2026",
    invoice: "INV-ARM-0725",
    amount: "₦ 5,566,132",
    amountValue: 5566132,
    status: "Scheduled",
    timing: "in 2d",
    dueSoon: true,
  },
  {
    id: "2",
    ref: "BL-3302",
    vendor: "FIRS Tax Remittance",
    category: "Statutory",
    dueDate: "Due Aug 14, 2026",
    invoice: "INV-FIRS-0814",
    amount: "₦ 4,281,640",
    amountValue: 4281640,
    status: "Unpaid",
    timing: "in 3d",
    dueSoon: true,
  },
  {
    id: "3",
    ref: "BL-3298",
    vendor: "Prestige Health HMO",
    category: "Benefits",
    dueDate: "Due Aug 9, 2026",
    invoice: "INV-PH-0809",
    amount: "₦ 2,140,000",
    amountValue: 2140000,
    status: "Overdue",
    timing: "4d overdue",
    overdue: true,
  },
  {
    id: "4",
    ref: "BL-3304",
    vendor: "NHF Remittance",
    category: "Statutory",
    dueDate: "Due Aug 19, 2026",
    amount: "₦ 856,328",
    amountValue: 856328,
    status: "Unpaid",
    timing: "in 8d",
    missingInvoice: true,
  },
  {
    id: "5",
    ref: "BL-3305",
    vendor: "Lagos Water Board",
    category: "Utilities",
    dueDate: "Due Aug 16, 2026",
    amount: "₦ 42,000",
    amountValue: 42000,
    status: "Unpaid",
    timing: "in 5d",
    dueSoon: true,
    missingInvoice: true,
  },
  {
    id: "6",
    ref: "BL-3299",
    vendor: "IKEDC (Electricity)",
    category: "Utilities",
    dueDate: "Due Aug 10, 2026",
    invoice: "INV-IKEDC-0810",
    amount: "₦ 318,000",
    amountValue: 318000,
    status: "Overdue",
    timing: "1d overdue",
    overdue: true,
  },
  {
    id: "7",
    ref: "BL-3288",
    vendor: "Office Supplies Co.",
    category: "Supplies",
    dueDate: "Due Aug 5, 2026",
    invoice: "INV-OSC-0805",
    amount: "₦ 184,000",
    amountValue: 184000,
    status: "Paid",
    timing: "Paid Aug 5, 2026",
    paidDate: "Paid Aug 5, 2026",
  },
];

export function matchesAccountantBillFilter(
  bill: AccountantBillItem,
  filter: AccountantBillFilter,
) {
  switch (filter) {
    case "All":
      return true;
    case "Unpaid":
      return bill.status === "Unpaid" || bill.status === "Scheduled";
    case "Overdue":
      return bill.status === "Overdue" || Boolean(bill.overdue);
    case "Due soon":
      return Boolean(bill.dueSoon) && bill.status !== "Paid";
    case "Scheduled":
      return bill.status === "Scheduled";
    case "Paid":
      return bill.status === "Paid";
    case "Missing invoice":
      return Boolean(bill.missingInvoice);
    default:
      return true;
  }
}

export function formatBillNaira(amount: number) {
  return `₦ ${amount.toLocaleString("en-NG")}`;
}
