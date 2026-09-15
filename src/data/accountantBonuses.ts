export type AccountantBonusType =
  | "Performance"
  | "Overtime"
  | "Referral"
  | "Spot"
  | "Retention";

export type AccountantBonus = {
  id: string;
  employeeId: string;
  name: string;
  initials: string;
  avatarColor: string;
  type: AccountantBonusType;
  department: string;
  note: string;
  date: string;
  amount: number;
  amountLabel: string;
};

export type AccountantBonusEmployee = {
  id: string;
  name: string;
  department: string;
  initials: string;
  avatarColor: string;
};

export const accountantBonusEmployees: AccountantBonusEmployee[] = [
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

export const accountantBonusTypes: AccountantBonusType[] = [
  "Performance",
  "Overtime",
  "Referral",
  "Spot",
  "Retention",
];

export const accountantBonusesPeriod = "August 2026";

export const accountantBonuses: AccountantBonus[] = [
  {
    id: "1",
    employeeId: "nina",
    name: "Nina Patel",
    initials: "NP",
    avatarColor: "#fde68a",
    type: "Performance",
    department: "Software Engineers",
    note: "Design system delivery",
    date: "Aug 9, 2026",
    amount: 140000,
    amountLabel: "₦ 140,000",
  },
  {
    id: "2",
    employeeId: "omar",
    name: "Omar Reyes",
    initials: "OR",
    avatarColor: "#bfdbfe",
    type: "Overtime",
    department: "Software Engineers",
    note: "Release weekend coverage",
    date: "Aug 8, 2026",
    amount: 60000,
    amountLabel: "₦ 60,000",
  },
  {
    id: "3",
    employeeId: "daniel",
    name: "Daniel Okafor",
    initials: "DO",
    avatarColor: "#bbf7d0",
    type: "Referral",
    department: "People Ops",
    note: "Successful engineering hire",
    date: "Aug 6, 2026",
    amount: 50000,
    amountLabel: "₦ 50,000",
  },
];

export function formatNaira(amount: number) {
  return `₦ ${amount.toLocaleString("en-NG")}`;
}
