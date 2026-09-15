export type AccountantNotificationKind = "Workflow" | "System";

export type AccountantNotificationFilter =
  | "All"
  | "Unread"
  | "Workflow"
  | "System";

export type AccountantNotification = {
  id: string;
  kind: AccountantNotificationKind;
  message: string;
  time: string;
  unread: boolean;
};

export const accountantNotificationFilters: AccountantNotificationFilter[] = [
  "All",
  "Unread",
  "Workflow",
  "System",
];

export const accountantNotifications: AccountantNotification[] = [
  {
    id: "1",
    kind: "Workflow",
    message: "LR-2041 was endorsed by HOD and is awaiting HR review.",
    time: "23h ago",
    unread: true,
  },
  {
    id: "2",
    kind: "Workflow",
    message: "EX-0457 was returned for correction — action needed.",
    time: "2d ago",
    unread: true,
  },
  {
    id: "3",
    kind: "Workflow",
    message: "PM-0031 was approved and routed to Accounts.",
    time: "1d ago",
    unread: false,
  },
  {
    id: "4",
    kind: "System",
    message: "ARM Pensions remittance is scheduled for Jul 30.",
    time: "3d ago",
    unread: true,
  },
  {
    id: "5",
    kind: "System",
    message: "4 vendor bills are due this week.",
    time: "3d ago",
    unread: true,
  },
  {
    id: "6",
    kind: "System",
    message: "3 reimbursement claims need verification.",
    time: "4d ago",
    unread: false,
  },
];

export function matchesNotificationFilter(
  item: AccountantNotification,
  filter: AccountantNotificationFilter,
) {
  if (filter === "All") return true;
  if (filter === "Unread") return item.unread;
  return item.kind === filter;
}
