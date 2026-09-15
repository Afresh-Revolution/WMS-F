export type AccountantExpenseStatus =
  | "Pending Review"
  | "Verified"
  | "Reimbursed"
  | "Returned";

export type AccountantExpenseFilter =
  | AccountantExpenseStatus
  | "Missing receipt"
  | "All";

export type AccountantExpenseCategory =
  | "Travel"
  | "Meals"
  | "Supplies"
  | "Equipment"
  | "Software"
  | "Client Entertainment"
  | "Other";

export type AccountantExpenseEmployee = {
  id: string;
  name: string;
  department: string;
  initials: string;
  avatarColor: string;
};

export type AccountantExpense = {
  id: string;
  ref: string;
  employeeId: string;
  name: string;
  initials: string;
  avatarColor: string;
  department: string;
  category: AccountantExpenseCategory;
  note: string;
  date: string;
  amount: number;
  amountLabel: string;
  status: AccountantExpenseStatus;
  hasReceipt: boolean;
};

export const accountantExpenseEmployees: AccountantExpenseEmployee[] = [
  {
    id: "tunde",
    name: "Tunde Balogun",
    department: "Software Engineers",
    initials: "TB",
    avatarColor: "#fed7aa",
  },
  {
    id: "omar",
    name: "Omar Reyes",
    department: "Software Engineers",
    initials: "OR",
    avatarColor: "#bfdbfe",
  },
  {
    id: "nina",
    name: "Nina Patel",
    department: "Product Design",
    initials: "NP",
    avatarColor: "#fde68a",
  },
  {
    id: "grace",
    name: "Grace Bello",
    department: "People Ops",
    initials: "GB",
    avatarColor: "#bbf7d0",
  },
  {
    id: "daniel",
    name: "Daniel Okafor",
    department: "Media / Photography",
    initials: "DO",
    avatarColor: "#ddd6fe",
  },
  {
    id: "jordan",
    name: "Jordan Lee",
    department: "Product",
    initials: "JL",
    avatarColor: "#c7d2fe",
  },
  {
    id: "sam",
    name: "Sam Okoro",
    department: "Operations",
    initials: "SO",
    avatarColor: "#fdba74",
  },
];

export const accountantExpenseCategories: AccountantExpenseCategory[] = [
  "Travel",
  "Meals",
  "Supplies",
  "Equipment",
  "Software",
  "Client Entertainment",
  "Other",
];

export const accountantExpenseFilters: AccountantExpenseFilter[] = [
  "Pending Review",
  "Verified",
  "Reimbursed",
  "Returned",
  "Missing receipt",
  "All",
];

export const accountantExpenses: AccountantExpense[] = [
  {
    id: "1",
    ref: "EX-0461",
    employeeId: "omar",
    name: "Omar Reyes",
    initials: "OR",
    avatarColor: "#bfdbfe",
    department: "Software Engineers",
    category: "Travel",
    note: "Client visit — taxi & meals",
    date: "Aug 9, 2026",
    amount: 48200,
    amountLabel: "₦ 48,200",
    status: "Pending Review",
    hasReceipt: false,
  },
  {
    id: "2",
    ref: "EX-0460",
    employeeId: "nina",
    name: "Nina Patel",
    initials: "NP",
    avatarColor: "#fde68a",
    department: "Product Design",
    category: "Supplies",
    note: "Prototype materials for workshop",
    date: "Aug 8, 2026",
    amount: 32000,
    amountLabel: "₦ 32,000",
    status: "Pending Review",
    hasReceipt: true,
  },
  {
    id: "3",
    ref: "EX-0459",
    employeeId: "grace",
    name: "Grace Bello",
    initials: "GB",
    avatarColor: "#bbf7d0",
    department: "People Ops",
    category: "Meals",
    note: "Candidate lunch interview",
    date: "Aug 7, 2026",
    amount: 15600,
    amountLabel: "₦ 15,600",
    status: "Pending Review",
    hasReceipt: true,
  },
  {
    id: "4",
    ref: "EX-0458",
    employeeId: "daniel",
    name: "Daniel Okafor",
    initials: "DO",
    avatarColor: "#ddd6fe",
    department: "Media / Photography",
    category: "Client Entertainment",
    note: "Client shoot hospitality",
    date: "Aug 2, 2026",
    amount: 27400,
    amountLabel: "₦ 27,400",
    status: "Verified",
    hasReceipt: true,
  },
  {
    id: "5",
    ref: "EX-0450",
    employeeId: "sam",
    name: "Sam Okoro",
    initials: "SO",
    avatarColor: "#fdba74",
    department: "Operations",
    category: "Equipment",
    note: "Workshop gloves & safety gear",
    date: "Jul 28, 2026",
    amount: 90000,
    amountLabel: "₦ 90,000",
    status: "Reimbursed",
    hasReceipt: true,
  },
];

export function formatExpenseNaira(amount: number) {
  return `₦ ${amount.toLocaleString("en-NG")}`;
}

export function matchesExpenseFilter(
  expense: AccountantExpense,
  filter: AccountantExpenseFilter,
) {
  if (filter === "All") return true;
  if (filter === "Missing receipt") return !expense.hasReceipt;
  return expense.status === filter;
}
