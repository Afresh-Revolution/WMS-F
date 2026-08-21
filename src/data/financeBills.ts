export type BillFilter = "All" | "Overdue" | "Due soon" | "Paid";

export type BillStatus =
  | "Awaiting Admin Approval"
  | "Scheduled for Payment"
  | "Overdue"
  | "Pending review"
  | "Paid";

export type Bill = {
  id: string;
  ref: string;
  vendor: string;
  category: string;
  amount: string;
  dueDate: string;
  status: BillStatus;
};

export const billStats = [
  {
    id: "overdue",
    label: "Overdue bills",
    value: "2",
    badge: "Urgent",
    badgeTone: "urgent" as const,
  },
  {
    id: "due-soon",
    label: "Due within 7 days",
    value: "3",
    badge: "This week",
    badgeTone: "neutral" as const,
  },
  {
    id: "outstanding",
    label: "Total outstanding",
    value: "₦ 12.8M",
    badge: "Payable",
    badgeTone: "success" as const,
  },
  {
    id: "paid",
    label: "Paid this month",
    value: "1",
    badge: "Jul 2025",
    badgeTone: "neutral" as const,
  },
] as const;

export const billFilters: BillFilter[] = ["All", "Overdue", "Due soon", "Paid"];

export const bills: Bill[] = [
  {
    id: "1",
    ref: "INV-2025-012",
    vendor: "AWS Cloud Services",
    category: "IT Infrastructure",
    amount: "₦ 820,000",
    dueDate: "Jul 31",
    status: "Awaiting Admin Approval",
  },
  {
    id: "2",
    ref: "INV-2025-011",
    vendor: "ABM Pensions",
    category: "Pension Remittance",
    amount: "₦ 8,198,122",
    dueDate: "Jul 30",
    status: "Scheduled for Payment",
  },
  {
    id: "3",
    ref: "INV-2025-010",
    vendor: "Prestige Health HMO",
    category: "Health Insurance",
    amount: "₦ 2,140,000",
    dueDate: "Jul 25",
    status: "Overdue",
  },
  {
    id: "4",
    ref: "INV-2025-009",
    vendor: "FIRS Tax Remittance",
    category: "Statutory Tax",
    amount: "₦ 4,281,640",
    dueDate: "Jul 28",
    status: "Pending review",
  },
  {
    id: "5",
    ref: "INV-2025-008",
    vendor: "Office Supplies Co.",
    category: "Office Supplies",
    amount: "₦ 174,200",
    dueDate: "Jul 20",
    status: "Overdue",
  },
  {
    id: "6",
    ref: "INV-2025-007",
    vendor: "Lagos Water Board",
    category: "Utilities",
    amount: "₦ 48,500",
    dueDate: "Jul 15",
    status: "Paid",
  },
];

export function matchesBillFilter(status: BillStatus, filter: BillFilter): boolean {
  if (filter === "All") return true;
  if (filter === "Overdue") return status === "Overdue";
  if (filter === "Paid") return status === "Paid";
  return (
    status === "Awaiting Admin Approval" ||
    status === "Scheduled for Payment" ||
    status === "Pending review"
  );
}
