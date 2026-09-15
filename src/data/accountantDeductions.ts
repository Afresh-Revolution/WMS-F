export type AccountantDeductionType =
  | "PAYE Tax"
  | "Pension"
  | "Loan Repayment"
  | "NHF"
  | "Other";

export type AccountantDeduction = {
  id: string;
  employeeId: string;
  name: string;
  initials: string;
  avatarColor: string;
  type: AccountantDeductionType;
  department: string;
  note: string;
  date: string;
  amount: number;
  amountLabel: string;
};

export type AccountantDeductionEmployee = {
  id: string;
  name: string;
  department: string;
  initials: string;
  avatarColor: string;
};

export const accountantDeductionEmployees: AccountantDeductionEmployee[] = [
  {
    id: "tunde",
    name: "Tunde Balogun",
    department: "Software Engineers",
    initials: "TB",
    avatarColor: "#fed7aa",
  },
  {
    id: "nina",
    name: "Nina Patel",
    department: "Software Engineers",
    initials: "NP",
    avatarColor: "#fde68a",
  },
  {
    id: "omar",
    name: "Omar Reyes",
    department: "Software Engineers",
    initials: "OR",
    avatarColor: "#bfdbfe",
  },
  {
    id: "daniel",
    name: "Daniel Okafor",
    department: "People Ops",
    initials: "DO",
    avatarColor: "#bbf7d0",
  },
  {
    id: "lena",
    name: "Lena Fisher",
    department: "Hardware",
    initials: "LF",
    avatarColor: "#fecdd3",
  },
  {
    id: "maya",
    name: "Maya Chen",
    department: "HR",
    initials: "MC",
    avatarColor: "#a7f3d0",
  },
  {
    id: "jordan",
    name: "Jordan Lee",
    department: "Product",
    initials: "JL",
    avatarColor: "#ddd6fe",
  },
  {
    id: "sam",
    name: "Sam Okoro",
    department: "Operations",
    initials: "SO",
    avatarColor: "#fdba74",
  },
];

export const accountantDeductionTypes: AccountantDeductionType[] = [
  "PAYE Tax",
  "Pension",
  "Loan Repayment",
  "NHF",
  "Other",
];

export const accountantDeductionsPeriod = "August 2026";

export const accountantDeductions: AccountantDeduction[] = [
  {
    id: "1",
    employeeId: "tunde",
    name: "Tunde Balogun",
    initials: "TB",
    avatarColor: "#fed7aa",
    type: "PAYE Tax",
    department: "Software Engineers",
    note: "Monthly PAYE remittance",
    date: "Aug 9, 2026",
    amount: 74400,
    amountLabel: "₦ 74,400",
  },
  {
    id: "2",
    employeeId: "tunde",
    name: "Tunde Balogun",
    initials: "TB",
    avatarColor: "#fed7aa",
    type: "Pension",
    department: "Software Engineers",
    note: "Employee pension contribution",
    date: "Aug 9, 2026",
    amount: 49600,
    amountLabel: "₦ 49,600",
  },
  {
    id: "3",
    employeeId: "omar",
    name: "Omar Reyes",
    initials: "OR",
    avatarColor: "#bfdbfe",
    type: "Loan Repayment",
    department: "Software Engineers",
    note: "Staff loan installment",
    date: "Aug 8, 2026",
    amount: 40000,
    amountLabel: "₦ 40,000",
  },
];

export function formatNaira(amount: number) {
  return `₦ ${amount.toLocaleString("en-NG")}`;
}
