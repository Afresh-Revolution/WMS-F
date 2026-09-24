export type TargetTab = "Reviews" | "KPIs" | "Goals";

export type ReviewStatus = "Completed" | "In review" | "Overdue";

export type PerformanceReview = {
  id: string;
  name: string;
  role: string;
  initials: string;
  avatarColor: string;
  reviewedBy: string;
  rating: number;
  status: ReviewStatus;
};

export const targetTabs: TargetTab[] = ["Reviews", "KPIs", "Goals"];

export const targetStats = [
  { id: "avg-score", label: "Avg review score", value: "4.5", hint: "Q2 2026" },
  { id: "reviews-due", label: "Reviews due", value: "3", hint: "This cycle" },
  { id: "kpi-attainment", label: "KPI attainment", value: "86%", hint: "Overall" },
  { id: "goals-overdue", label: "Goals overdue", value: "2", hint: "Action needed" },
] as const;

export const performanceReviews: PerformanceReview[] = [
  {
    id: "1",
    name: "Nina Patel",
    role: "Senior Art Director",
    initials: "NP",
    avatarColor: "#fecdd3",
    reviewedBy: "Maya Chen",
    rating: 4.5,
    status: "Completed",
  },
  {
    id: "2",
    name: "Omar Reyes",
    role: "Staff Software Engineer",
    initials: "OR",
    avatarColor: "#ddd6fe",
    reviewedBy: "Maya Chen",
    rating: 4.2,
    status: "In review",
  },
  {
    id: "3",
    name: "Lana Fisher",
    role: "Hardware Lead",
    initials: "LF",
    avatarColor: "#fed7aa",
    reviewedBy: "Maya Chen",
    rating: 3.2,
    status: "In review",
  },
  {
    id: "4",
    name: "Theo Grant",
    role: "Fashion Executive",
    initials: "TG",
    avatarColor: "#ddd6fe",
    reviewedBy: "Maya Chen",
    rating: 2.7,
    status: "Overdue",
  },
  {
    id: "5",
    name: "Ravi Kapoor",
    role: "Model Coordinator",
    initials: "RK",
    avatarColor: "#fed7aa",
    reviewedBy: "Maya Chen",
    rating: 4.5,
    status: "In review",
  },
];
