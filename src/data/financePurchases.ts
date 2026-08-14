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
    ref: "PRQ-0042",
    item: "SaaS licenses (annual) – Atlassian suite",
    detail: "Software Engineering • Qty: 50",
    requester: "Oliver Reyes",
    requesterInitials: "OR",
    requesterColor: "#ddd6fe",
    amount: "₦ 380,000",
    submitted: "Jul 25",
    status: "Under Procurement Review",
  },
  {
    id: "2",
    ref: "PRQ-0041",
    item: "Ergonomic chairs (batch)",
    detail: "Operations • Qty: 12",
    requester: "Nina Patel",
    requesterInitials: "NP",
    requesterColor: "#fecdd3",
    amount: "₦ 420,000",
    submitted: "Jul 24",
    status: "Awaiting Admin Approval",
  },
  {
    id: "3",
    ref: "PRQ-0040",
    item: "MacBook Pro units",
    detail: "IT • Qty: 5",
    requester: "Omar Reyes",
    requesterInitials: "OR",
    requesterColor: "#ddd6fe",
    amount: "₦ 4,500,000",
    submitted: "Jul 22",
    status: "Approved",
  },
  {
    id: "4",
    ref: "PRQ-0039",
    item: "Office stationery supplies",
    detail: "Admin • Qty: 1",
    requester: "Lana Fisher",
    requesterInitials: "LF",
    requesterColor: "#fed7aa",
    amount: "₦ 85,000",
    submitted: "Jul 20",
    status: "Delivered",
  },
  {
    id: "5",
    ref: "PRQ-0038",
    item: "Conference room projector",
    detail: "Facilities • Qty: 1",
    requester: "Theo Grant",
    requesterInitials: "TG",
    requesterColor: "#ddd6fe",
    amount: "₦ 320,000",
    submitted: "Jul 18",
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
