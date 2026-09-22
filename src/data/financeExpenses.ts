import type { LucideIcon } from "lucide-react";
import { Car, Monitor, Package, Plane, UtensilsCrossed } from "lucide-react";

export type ExpenseSectionTab = "My expense" | "Team expenses" | "Policies";

export type ExpenseStatus = "Pending" | "Approved" | "Rejected";

export type ExpenseCategory =
  | "Meals"
  | "Transport"
  | "Accommodation"
  | "Fuel"
  | "Office Supplies"
  | "Communication"
  | "Travel"
  | "Client Entertainment"
  | "Training"
  | "Software"
  | "Equipment"
  | "Medical"
  | "Internet"
  | "Other"
  | "Supplies";

export type ExpenseClaim = {
  id: string;
  ref: string;
  description: string;
  category: ExpenseCategory;
  date: string;
  amount: string;
  status: ExpenseStatus;
};

export const expenseSectionTabs: ExpenseSectionTab[] = [
  "My expense",
  "Team expenses",
  "Policies",
];

export const expenseStats = [
  {
    id: "submitted",
    label: "Submitted this month",
    value: "₦ 280K",
    badge: "Jul 2026",
    tone: "default" as const,
  },
  {
    id: "approved",
    label: "Approved",
    value: "₦ 204K",
    badge: "Jul 2026",
    sublabel: "Reimbursable",
    tone: "default" as const,
  },
  {
    id: "pending",
    label: "Pending review",
    value: "3",
    badge: "Jul 2026",
    tone: "alert" as const,
  },
  {
    id: "rejected",
    label: "Rejected",
    value: "1",
    badge: "Jul 2026",
    tone: "alert" as const,
  },
] as const;

export const categoryIcons: Record<string, LucideIcon> = {
  Meals: UtensilsCrossed,
  Transport: Car,
  Accommodation: Package,
  Fuel: Car,
  "Office Supplies": Package,
  Communication: Monitor,
  Travel: Plane,
  "Client Entertainment": UtensilsCrossed,
  Training: Monitor,
  Software: Monitor,
  Equipment: Monitor,
  Medical: Package,
  Internet: Monitor,
  Other: Package,
  Supplies: Package,
};

export const expenseClaims: ExpenseClaim[] = [
  {
    id: "1",
    ref: "EXP-4512",
    description: "Client dinner — Blue Oak Hotel",
    category: "Meals",
    date: "Jul 25",
    amount: "₦ 48,500",
    status: "Pending",
  },
  {
    id: "2",
    ref: "EXP-4511",
    description: "Uber — airport to office",
    category: "Transport",
    date: "Jul 24",
    amount: "₦ 12,200",
    status: "Approved",
  },
  {
    id: "3",
    ref: "EXP-4510",
    description: "Conference registration fee",
    category: "Travel",
    date: "Jul 20",
    amount: "₦ 125,000",
    status: "Approved",
  },
  {
    id: "4",
    ref: "EXP-4509",
    description: "Printer cartridges — office supplies",
    category: "Supplies",
    date: "Jul 18",
    amount: "₦ 18,400",
    status: "Rejected",
  },
  {
    id: "5",
    ref: "EXP-4508",
    description: "External keyboard & mouse",
    category: "Equipment",
    date: "Jul 15",
    amount: "₦ 78,000",
    status: "Approved",
  },
];
