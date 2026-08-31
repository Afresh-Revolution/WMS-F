export type TechnicalAuditSeverity = "Info" | "Warning" | "Critical";

export type TechnicalAuditFilter = "All" | TechnicalAuditSeverity;

export type TechnicalAuditChange = {
  from: string;
  to: string;
  note?: string;
};

export type TechnicalAuditEvent = {
  id: string;
  title: string;
  area: string;
  severity: TechnicalAuditSeverity;
  summary: string;
  change?: TechnicalAuditChange;
  actor: string;
  occurredAt: string;
};

export const technicalAuditFilters: TechnicalAuditFilter[] = [
  "All",
  "Info",
  "Warning",
  "Critical",
];

export const technicalAuditEvents: TechnicalAuditEvent[] = [
  {
    id: "1",
    title: "Role changed",
    area: "Security",
    severity: "Warning",
    summary: "Ravi Kapoor:",
    change: { from: "Accountant", to: "HR", note: "(reverted)" },
    actor: "Maya Chen",
    occurredAt: "Aug 3, 9:31 AM",
  },
  {
    id: "2",
    title: "Failed login",
    area: "Security",
    severity: "Critical",
    summary: "unknown@afresh.co · IP 102.89.45.21",
    actor: "System",
    occurredAt: "Aug 3, 10:42 AM",
  },
  {
    id: "3",
    title: "Manual backup",
    area: "Backups",
    severity: "Info",
    summary: "Full database snapshot created",
    actor: "Maya Chen",
    occurredAt: "Aug 3, 2:00 AM",
  },
  {
    id: "4",
    title: "Setting updated",
    area: "Email",
    severity: "Info",
    summary: "SMTP host changed",
    change: { from: "smtp.mailgun.org", to: "smtp.postmark.io" },
    actor: "Maya Chen",
    occurredAt: "Aug 2, 3:10 PM",
  },
  {
    id: "5",
    title: "Service degraded",
    area: "System Health",
    severity: "Warning",
    summary: "File Storage latency above threshold",
    actor: "System",
    occurredAt: "Aug 2, 6:20 AM",
  },
];
