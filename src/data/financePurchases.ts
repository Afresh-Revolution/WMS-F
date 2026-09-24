export type PurchaseFilter = "All" | "Pending" | "Approved" | "Delivered" | "Rejected";

export type PurchaseStatus =
  | "Under Procurement Review"
  | "Awaiting Admin Approval"
  | "Approved"
  | "Delivered"
  | "Rejected";

export type PurchaseRequest = {
  id: string;
  ref: string;
  item: string;
  detail: string;
  requester: string;
  requesterInitials: string;
  requesterColor: string;
  amount: string;
  submitted: string;
  status: PurchaseStatus;
};

export const purchaseStats = [
  { id: "total", label: "Total this month", value: "5" },
  { id: "pending", label: "Pending review", value: "2" },
  { id: "value", label: "Total value", value: "₦ 1.28M" },
  { id: "approved", label: "Approved", value: "2" },
] as const;

export const purchaseFilters: PurchaseFilter[] = [
  "All",
  "Pending",
  "Approved",
  "Delivered",
  "Rejected",
];

export const purchaseRequests: PurchaseRequest[] = [
  {
    id: "1",
    ref: "PRQ-0041",
    item: "SaaS licences (annual) — Atlassian suite",
    detail: "Software Engineering • Qty: 50",
    requester: "Omar Reyes",
    requesterInitials: "OR",
    requesterColor: "#ddd6fe",
    amount: "₦ 340,000",
    submitted: "Jul 26",
    status: "Under Procurement Review",
  },
  {
    id: "2",
    ref: "PRQ-0040",
    item: "HRIS module upgrade",
    detail: "HR • Qty: 1",
    requester: "Maya Chen",
    requesterInitials: "MC",
    requesterColor: "#fed7aa",
    amount: "₦ 180,000",
    submitted: "Jul 24",
    status: "Awaiting Admin Approval",
  },
  {
    id: "3",
    ref: "PRQ-0039",
    item: "Adobe Creative Cloud plan renewal",
    detail: "Media / Photography • Qty: 8",
    requester: "Nina Patel",
    requesterInitials: "NP",
    requesterColor: "#fecdd3",
    amount: "₦ 96,000",
    submitted: "Jul 22",
    status: "Approved",
  },
  {
    id: "4",
    ref: "PRQ-0038",
    item: "Network switch replacement",
    detail: "Hardware • Qty: 2",
    requester: "James Obi",
    requesterInitials: "JO",
    requesterColor: "#e7e5e4",
    amount: "₦ 520,000",
    submitted: "Jul 18",
    status: "Delivered",
  },
  {
    id: "5",
    ref: "PRQ-0037",
    item: "Noise-canceling headsets",
    detail: "Hardware • Qty: 12",
    requester: "Lena Fisher",
    requesterInitials: "LF",
    requesterColor: "#fed7aa",
    amount: "₦ 144,000",
    submitted: "Jul 15",
    status: "Rejected",
  },
];

export function matchesPurchaseFilter(
  status: PurchaseStatus,
  filter: PurchaseFilter,
): boolean {
  if (filter === "All") return true;
  if (filter === "Pending") {
    return (
      status === "Under Procurement Review" || status === "Awaiting Admin Approval"
    );
  }
  if (filter === "Approved") return status === "Approved";
  if (filter === "Delivered") return status === "Delivered";
  return status === "Rejected";
}
