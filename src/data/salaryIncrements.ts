export type IncrementFilter =
  | "All"
  | "Under admin review"
  | "Approved"
  | "Draft";

export type IncrementStatus = "Under admin review" | "Draft" | "Approved";

export type SalaryIncrement = {
  id: string;
  initials: string;
  name: string;
  avatarColor: string;
  department: string;
  currentSalary: string;
  proposedSalary: string;
  incrementPercent: string;
  effectiveDate: string;
  submittedDate: string;
  incrementAmount?: string;
  status: IncrementStatus;
};

export const incrementStats = [
  { id: "total", label: "Total", value: "3", highlight: false },
  { id: "review", label: "Under review", value: "1", highlight: true },
  { id: "approved", label: "Approved", value: "1", highlight: false },
  { id: "avg", label: "Avg. increment", value: "12.5%", highlight: false },
] as const;

export const incrementFilters: IncrementFilter[] = [
  "All",
  "Under admin review",
  "Approved",
  "Draft",
];

export const salaryIncrements: SalaryIncrement[] = [
  {
    id: "1",
    initials: "NP",
    name: "Nina Patel",
    avatarColor: "#fde68a",
    department: "Media Production",
    currentSalary: "$150,000",
    proposedSalary: "$165,000",
    incrementPercent: "+10.0%",
    incrementAmount: "+10.0%",
    effectiveDate: "Aug 1, 2024",
    submittedDate: "Jul 24",
    status: "Under admin review",
  },
  {
    id: "2",
    initials: "OR",
    name: "Omar Reyes",
    avatarColor: "#bfdbfe",
    department: "Software Engineer",
    currentSalary: "$120,000",
    proposedSalary: "$132,000",
    incrementPercent: "+10%",
    incrementAmount: "+10%",
    effectiveDate: "Aug 30, 2024",
    submittedDate: "Jul 30",
    status: "Draft",
  },
  {
    id: "3",
    initials: "LF",
    name: "Lena Fisher",
    avatarColor: "#fecdd3",
    department: "Hardware",
    currentSalary: "$120,000",
    proposedSalary: "$132,000",
    incrementPercent: "+10%",
    incrementAmount: "+10%",
    effectiveDate: "Sep 1, 2024",
    submittedDate: "Jun 30",
    status: "Approved",
  },
];
