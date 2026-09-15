export type AccountantPurchaseStatus =
  | "Under Review"
  | "Recommended"
  | "Awaiting Payment"
  | "Paid";

export type AccountantPurchaseFilter = AccountantPurchaseStatus | "All";

export type AccountantPurchase = {
  id: string;
  ref: string;
  title: string;
  department: string;
  requester: string;
  date: string;
  amount: string;
  status: AccountantPurchaseStatus;
  recommendation?: string;
};

export const accountantPurchaseFilters: AccountantPurchaseFilter[] = [
  "Under Review",
  "Recommended",
  "Awaiting Payment",
  "Paid",
  "All",
];

export const accountantPurchases: AccountantPurchase[] = [
  {
    id: "1",
    ref: "PR-0193",
    title: "Design & prototyping licenses (6 seats)",
    department: "Software Engineers",
    requester: "Nina Patel",
    date: "Aug 9, 2026",
    amount: "₦ 340,000",
    status: "Under Review",
  },
  {
    id: "2",
    ref: "PR-0192",
    title: "HRIS module upgrade",
    department: "People Ops",
    requester: "Jordan Lee",
    date: "Aug 8, 2026",
    amount: "₦ 420,000",
    status: "Under Review",
  },
  {
    id: "3",
    ref: "PR-0190",
    title: "Soldering stations (x4)",
    department: "Operations",
    requester: "Sam Okoro",
    date: "Aug 5, 2026",
    amount: "₦ 312,000",
    status: "Recommended",
    recommendation: "Vendor quote verified. Recommend approval.",
  },
  {
    id: "4",
    ref: "PR-0188",
    title: "Office network switches",
    department: "IT",
    requester: "Omar Reyes",
    date: "Aug 2, 2026",
    amount: "₦ 185,000",
    status: "Awaiting Payment",
    recommendation: "Within Q3 budget. Recommend approval.",
  },
  {
    id: "5",
    ref: "PR-0184",
    title: "Standing desks (batch of 8)",
    department: "Facilities",
    requester: "Maya Chen",
    date: "Jul 28, 2026",
    amount: "₦ 960,000",
    status: "Paid",
    recommendation: "Approved and paid.",
  },
];
