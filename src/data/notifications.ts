export type NotificationFilter = "All" | "Unread" | "Workflow" | "System";

export type NotificationType = "Workflow" | "System";

export type Notification = {
  id: string;
  type: NotificationType;
  referenceId?: string;
  message: string;
  timeAgo?: string;
  unread: boolean;
};

export const notifications: Notification[] = [
  {
    id: "1",
    type: "Workflow",
    referenceId: "LR-2041",
    message: "LR-2041 was endorsed by HOD and is awaiting HR review.",
    timeAgo: "1d ago",
    unread: true,
  },
  {
    id: "2",
    type: "Workflow",
    referenceId: "EX-0457",
    message: "EX-0457 was returned for correction — action needed.",
    timeAgo: "2d ago",
    unread: true,
  },
  {
    id: "3",
    type: "Workflow",
    referenceId: "PM-0031",
    message: "PM-0031 was approved and routed to Accounts.",
    timeAgo: "1d ago",
    unread: false,
  },
  {
    id: "4",
    type: "System",
    message: "July payroll is ready for your final approval.",
    unread: true,
  },
  {
    id: "5",
    type: "System",
    message: "3 leave requests are awaiting sign-off.",
    unread: true,
  },
  {
    id: "6",
    type: "System",
    message: "Updated leave policy effective August 1.",
    unread: false,
  },
];

export const notificationUnreadCount = notifications.filter((n) => n.unread).length;
