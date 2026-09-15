export type AccountantIncrementStatus = "awaiting" | "implemented";

export type AccountantSalaryIncrement = {
  id: string;
  ref: string;
  name: string;
  role: string;
  initials: string;
  avatarColor: string;
  percent: string;
  fromSalary: string;
  toSalary: string;
  approvedBy: string;
  approvedDate: string;
  appliedDate?: string;
  status: AccountantIncrementStatus;
};

export const accountantSalaryIncrements: AccountantSalaryIncrement[] = [
  {
    id: "1",
    ref: "SI-0088",
    name: "Nina Patel",
    role: "Software Engineers",
    initials: "NP",
    avatarColor: "#fde68a",
    percent: "+12.5%",
    fromSalary: "₦ 620,000",
    toSalary: "₦ 697,500",
    approvedBy: "David Okoye",
    approvedDate: "Aug 10, 2026",
    status: "awaiting",
  },
  {
    id: "2",
    ref: "SI-0087",
    name: "Omar Reyes",
    role: "Software Engineers",
    initials: "OR",
    avatarColor: "#bfdbfe",
    percent: "+8.0%",
    fromSalary: "₦ 710,000",
    toSalary: "₦ 766,800",
    approvedBy: "David Okoye",
    approvedDate: "Aug 9, 2026",
    status: "awaiting",
  },
  {
    id: "3",
    ref: "SI-0082",
    name: "Ravi Kapoor",
    role: "Finance",
    initials: "RK",
    avatarColor: "#fed7aa",
    percent: "+8.6%",
    fromSalary: "₦ 700,000",
    toSalary: "₦ 760,000",
    approvedBy: "Christy Ishaku",
    approvedDate: "Jul 14, 2026",
    appliedDate: "Jul 16, 2026",
    status: "implemented",
  },
];

export function formatIncrementAppliedDate(date = new Date()) {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
