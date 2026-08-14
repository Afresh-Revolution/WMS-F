export type AuditFilter = "All events" | "Security" | "Failed";

export type AuditCategory =
  | "Leave"
  | "Discipline"
  | "Promotions"
  | "Payroll"
  | "System"
  | "Auth"
  | "Email"
  | "Purchase";

export type AuditEvent = {
  id: string;
  time: string;
  date: string;
  user: string;
  showAvatar?: boolean;
  action: string;
  target: string;
  editable?: boolean;
  category: AuditCategory;
  ip: string;
  status: "Success" | "Failed";
  security: boolean;
};

export const auditEvents: AuditEvent[] = [
  {
    id: "1",
    time: "08:42 AM",
    date: "Aug 5, 2024",
    user: "Admin",
    action: "Approved leave request",
    target: "Theo Grant — Annual leave Aug 4–11",
    category: "Leave",
    ip: "1.4.1.0.1",
    status: "Success",
    security: false,
  },
  {
    id: "2",
    time: "09:15 AM",
    date: "Aug 5, 2024",
    user: "HR — Maya Chen",
    action: "Created disciplinary record",
    target: "Theo Grant — Warning 30/08/24",
    category: "Discipline",
    ip: "1.4.1.0.1",
    status: "Success",
    security: false,
  },
  {
    id: "3",
    time: "10:30 AM",
    date: "Aug 5, 2024",
    user: "HR — Maya Chen",
    action: "Submitted promotion recommendation",
    target: "Nina Patel — Designer to Senior Designer",
    category: "Promotions",
    ip: "1.4.1.0.1",
    status: "Success",
    security: false,
  },
  {
    id: "4",
    time: "01:45 PM",
    date: "Jul 20, 2024",
    user: "Admin — First Person",
    action: "Submitted payroll for approval",
    target: "July 2024 — ₦1,200,450.00",
    category: "Payroll",
    ip: "1.4.1.0.1",
    status: "Success",
    security: false,
  },
  {
    id: "5",
    time: "12:45 PM",
    date: "Jul 21, 2024",
    user: "Super Admin",
    showAvatar: true,
    action: "Changed user role",
    target: "Ben Kaplor — Accountant",
    editable: true,
    category: "System",
    ip: "192.162.2.1",
    status: "Success",
    security: true,
  },
  {
    id: "6",
    time: "08:45 AM",
    date: "Jul 21, 2024",
    user: "Unknown",
    action: "Failed login attempt",
    target: "unknown@afresh.co",
    category: "Auth",
    ip: "156.24.182.20",
    status: "Failed",
    security: true,
  },
  {
    id: "7",
    time: "03:50 PM",
    date: "Jul 20, 2024",
    user: "Secretary — Cora Chi",
    action: "Created company email",
    target: "c.chi@afr-esh.com",
    category: "Email",
    ip: "1.4.1.0.1",
    status: "Success",
    security: false,
  },
  {
    id: "8",
    time: "04:10 PM",
    date: "Jul 20, 2024",
    user: "Admin",
    action: "Rejected purchase request",
    target: "Supplies — IT hardware — PRQ-3007",
    category: "Purchase",
    ip: "1.4.1.0.1",
    status: "Success",
    security: false,
  },
];
