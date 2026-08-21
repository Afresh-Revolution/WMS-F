export type AuditFilter = "All events" | "Security" | "Failed";

export type AuditModule =
  | "Leave"
  | "Discipline"
  | "Promotions"
  | "Payroll"
  | "System"
  | "Auth"
  | "Email"
  | "Purchases";

export type AuditEvent = {
  id: string;
  time: string;
  date: string;
  user: string;
  action: string;
  target: string;
  module: AuditModule;
  ip: string;
  outcome: "Success" | "Failed";
  security: boolean;
};

export const auditEvents: AuditEvent[] = [
  {
    id: "1",
    time: "10:42 AM",
    date: "Jul 28, 2026",
    user: "Admin",
    action: "Approved leave request",
    target: "Theo Grant — Annual leave Aug 4–8",
    module: "Leave",
    ip: "10.0.0.3",
    outcome: "Success",
    security: false,
  },
  {
    id: "2",
    time: "09:15 AM",
    date: "Jul 28, 2026",
    user: "HR — Maya Chen",
    action: "Created disciplinary record",
    target: "Theo Grant — Warning",
    module: "Discipline",
    ip: "10.0.0.2",
    outcome: "Success",
    security: false,
  },
  {
    id: "3",
    time: "10:30 AM",
    date: "Jul 27, 2026",
    user: "HR — Maya Chen",
    action: "Submitted promotion recommendation",
    target: "Nina Patel — Designer to Senior Designer",
    module: "Promotions",
    ip: "10.0.0.2",
    outcome: "Success",
    security: false,
  },
  {
    id: "4",
    time: "01:45 PM",
    date: "Jul 26, 2026",
    user: "Admin — Finance",
    action: "Submitted payroll for approval",
    target: "July 2026 — ₦12,450,000.00",
    module: "Payroll",
    ip: "10.0.0.3",
    outcome: "Success",
    security: false,
  },
  {
    id: "5",
    time: "12:45 PM",
    date: "Jul 25, 2026",
    user: "Super Admin",
    action: "Changed user role",
    target: "Ravi Kapoor — Accountant → HR",
    module: "System",
    ip: "10.0.0.1",
    outcome: "Success",
    security: true,
  },
  {
    id: "6",
    time: "08:45 AM",
    date: "Jul 24, 2026",
    user: "Unknown",
    action: "Failed login attempt",
    target: "unknown@afresh.co",
    module: "Auth",
    ip: "156.24.182.20",
    outcome: "Failed",
    security: true,
  },
  {
    id: "7",
    time: "03:50 PM",
    date: "Jul 23, 2026",
    user: "Secretary — Cora Chi",
    action: "Created company email",
    target: "c.chi@afr-esh.com",
    module: "Email",
    ip: "10.0.0.4",
    outcome: "Success",
    security: false,
  },
  {
    id: "8",
    time: "04:10 PM",
    date: "Jul 22, 2026",
    user: "Admin",
    action: "Rejected purchase request",
    target: "Supplies — IT hardware — PRQ-3007",
    module: "Purchases",
    ip: "10.0.0.3",
    outcome: "Success",
    security: false,
  },
];
