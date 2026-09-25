export type PromotionFilter =
  | "All"
  | "Under admin review"
  | "Approved"
  | "Draft"
  | "Rejected";

export type PromotionStatus =
  | "Under admin review"
  | "Draft"
  | "Approved"
  | "Rejected";

export type Promotion = {
  id: string;
  initials: string;
  name: string;
  avatarColor: string;
  currentRole: string;
  proposedRole: string;
  department?: string;
  submittedDate: string;
  effectiveDate: string;
  reason?: string;
  submittedBy?: string;
  submittedByRole?: string;
  status: PromotionStatus;
};

export const promotionStats = [
  { id: "total", label: "Total", value: "4" },
  { id: "review", label: "Under review", value: "1" },
  { id: "approved", label: "Approved", value: "1" },
  { id: "draft", label: "Draft", value: "1" },
] as const;

export const promotionFilters: PromotionFilter[] = [
  "All",
  "Under admin review",
  "Approved",
  "Draft",
  "Rejected",
];

export const promotions: Promotion[] = [
  {
    id: "1",
    initials: "NP",
    name: "Nina Patel",
    avatarColor: "#fde68a",
    currentRole: "Art Director",
    proposedRole: "Senior Art Director",
    department: "Media Photography",
    submittedDate: "Jul 24",
    effectiveDate: "Aug 1, 2026",
    status: "Under admin review",
  },
  {
    id: "2",
    initials: "LF",
    name: "Lana Fisher",
    avatarColor: "#fecdd3",
    currentRole: "Hardware Specialist",
    proposedRole: "Hardware Lead",
    submittedDate: "Jul 30",
    effectiveDate: "Aug 30, 2024",
    status: "Draft",
  },
  {
    id: "3",
    initials: "RK",
    name: "Ravi Kapoor",
    avatarColor: "#fed7aa",
    currentRole: "Senior Model Coordinator",
    proposedRole: "Senior Model Coordinator (Home)",
    submittedDate: "Jun 30",
    effectiveDate: "Sep 1, 2024",
    status: "Approved",
  },
  {
    id: "4",
    initials: "TG",
    name: "Theo Grant",
    avatarColor: "#ddd6fe",
    currentRole: "Fashion Executive",
    proposedRole: "Fashion Manager",
    submittedDate: "Jul 12",
    effectiveDate: "Jul 1, 2024",
    status: "Rejected",
  },
];
