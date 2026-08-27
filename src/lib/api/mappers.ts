import type { AuditEvent, AuditModule } from "@/data/audit";
import type { ActivityItem, DepartmentMetric, LeaveRequest as DashboardLeaveRequest, LeaveStatus, OverviewItem } from "@/data/dashboard";
import type { Department } from "@/data/departments";
import type { DisciplineCase, DisciplineTagTone } from "@/data/discipline";
import type { Employee, EmployeeStatus } from "@/data/employees";
import type { EventFilter, EventItem, EventTagTone } from "@/data/events";
import type { ExpenseCategory, ExpenseClaim, ExpenseStatus } from "@/data/financeExpenses";
import type { PurchaseRequest, PurchaseStatus } from "@/data/financePurchases";
import type { LeaveRequest, LeaveRequestStatus } from "@/data/leave";
import type { Meeting, MeetingFilter, MeetingTag } from "@/data/meetings";
import type { Notification, NotificationType } from "@/data/notifications";
import type { Promotion, PromotionStatus } from "@/data/promotions";
import type { SalaryIncrement, IncrementStatus } from "@/data/salaryIncrements";
import type { PerformanceReview, ReviewStatus } from "@/data/targets";
import type { Task, TaskPriority, TaskStatus } from "@/data/tasks";
import { asRecord, pick, pickNumber, pickString, unwrapList } from "./client";
import type { JsonRecord } from "./types";

const AVATAR_COLORS = ["#fde68a", "#bfdbfe", "#fecdd3", "#ddd6fe", "#bbf7d0", "#fed7aa"];

export function avatarColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

export function initialsFromName(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function nestedRecord(record: JsonRecord, ...keys: string[]): JsonRecord {
  const value = pick(record, ...keys);
  return asRecord(value);
}

export function personName(record: JsonRecord): string {
  const person = nestedRecord(record, "employee", "user", "staff", "person", "assignee", "requester");
  const first = pickString(person, "firstName", "first_name");
  const last = pickString(person, "last_name", "lastName");
  const combined = [first, last].filter(Boolean).join(" ");

  return (
    pickString(
      record,
      "name",
      "employeeName",
      "employee_name",
      "fullName",
      "full_name",
      "assigneeName",
      "assignee_name",
      "requesterName",
      "requester_name",
    ) ||
    combined ||
    pickString(person, "name", "fullName", "full_name", "email") ||
    "Unknown"
  );
}

export function recordId(record: JsonRecord): string {
  return pickString(record, "id", "_id", "uuid", "ref", "reference", "referenceId", "reference_id");
}

function formatDate(value: string): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatShortDate(value: string): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatMoney(value: string | number | undefined): string {
  if (value === undefined || value === "") return "";
  if (typeof value === "string" && /[₦$£€]/.test(value)) return value;
  const amount = typeof value === "number" ? value : Number(String(value).replace(/,/g, ""));
  if (!Number.isFinite(amount)) return String(value);
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatPercent(value: string | number | undefined): string {
  if (value === undefined || value === "") return "";
  const numeric = typeof value === "number" ? value : Number(String(value).replace(/%/g, ""));
  if (!Number.isFinite(numeric)) return String(value);
  const normalized = Math.abs(numeric) <= 1 && numeric !== 0 ? numeric * 100 : numeric;
  const sign = normalized > 0 ? "+" : "";
  return `${sign}${normalized.toFixed(1)}%`;
}

function titleCaseStatus(value: string): string {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function includesAny(value: string, ...needles: string[]): boolean {
  return needles.some((needle) => value.includes(needle));
}

function mapLeaveStatus(value: string): LeaveRequestStatus {
  const normalized = value.toLowerCase();
  if (includesAny(normalized, "approv")) return "Approved";
  if (includesAny(normalized, "reject", "declin", "denied")) return "Declined";
  return "Pending";
}

function mapDashboardLeaveStatus(value: string): LeaveStatus {
  const mapped = mapLeaveStatus(value);
  return mapped === "Declined" ? "Rejected" : mapped;
}

export function mapDashboardLeave(item: unknown): DashboardLeaveRequest {
  const record = asRecord(item);
  const name = personName(record);
  const start = pickString(record, "startDate", "start_date", "from", "dateFrom", "date_from");
  const end = pickString(record, "endDate", "end_date", "to", "dateTo", "date_to");
  const days = pickNumber(record, "days", "durationDays", "duration_days", "numberOfDays");
  const duration =
    pickString(record, "duration") ||
    (days ? `${days} day${days === 1 ? "" : "s"}` : [formatShortDate(start), formatShortDate(end)].filter(Boolean).join(" - "));

  return {
    id: recordId(record) || name,
    name,
    initials: pickString(record, "initials") || initialsFromName(name),
    avatarColor: pickString(record, "avatarColor", "avatar_color") || avatarColor(name),
    type: pickString(record, "type", "leaveType", "leave_type", "category") || "Leave",
    duration,
    status: mapDashboardLeaveStatus(pickString(record, "status")),
  };
}

export function mapLeaveRequest(item: unknown): LeaveRequest {
  const record = asRecord(item);
  const name = personName(record);
  const start = pickString(record, "startDate", "start_date", "from", "dateFrom");
  const end = pickString(record, "endDate", "end_date", "to", "dateTo");
  const days = pickNumber(record, "days", "durationDays", "duration_days", "numberOfDays") ?? 0;

  return {
    id: recordId(record) || name,
    initials: pickString(record, "initials") || initialsFromName(name),
    name,
    avatarColor: pickString(record, "avatarColor", "avatar_color") || avatarColor(name),
    type: pickString(record, "type", "leaveType", "leave_type", "category") || "Leave",
    dateRange:
      pickString(record, "dateRange", "date_range") ||
      [formatShortDate(start), formatShortDate(end)].filter(Boolean).join(" - "),
    days,
    status: mapLeaveStatus(pickString(record, "status")),
  };
}

export function mapEmployee(item: unknown): Employee {
  const record = asRecord(item);
  const name = personName(record);
  const statusValue = pickString(record, "status", "employmentStatus", "employment_status").toLowerCase();

  const status: EmployeeStatus = includesAny(statusValue, "leave") ? "On leave" : "Active";

  return {
    id: recordId(record) || name,
    initials: pickString(record, "initials") || initialsFromName(name),
    name,
    title:
      pickString(record, "title", "jobTitle", "job_title", "role", "position", "designation") ||
      "Team member",
    location: pickString(record, "location", "city", "office", "workLocation", "work_location") || "—",
    department:
      pickString(record, "department", "departmentName", "department_name") ||
      pickString(nestedRecord(record, "department"), "name") ||
      "Unassigned",
    email: pickString(record, "email", "workEmail", "work_email") || "",
    status,
    avatarColor: pickString(record, "avatarColor", "avatar_color") || avatarColor(name),
  };
}

function departmentIcon(name: string): Department["icon"] {
  const normalized = name.toLowerCase();
  if (includesAny(normalized, "fashion")) return "fashion";
  if (includesAny(normalized, "media", "photo")) return "media";
  if (includesAny(normalized, "hardware")) return "hardware";
  if (includesAny(normalized, "hr", "human")) return "hr";
  if (includesAny(normalized, "model")) return "model";
  return "software";
}

export function mapDepartment(item: unknown): Department {
  const record = asRecord(item);
  const manager = nestedRecord(record, "manager", "hod", "head", "lead");
  const managerName =
    personName(manager) !== "Unknown"
      ? personName(manager)
      : pickString(record, "managerName", "manager_name", "hodName", "hod_name") || "Unassigned";
  const name = pickString(record, "name", "title", "departmentName", "department_name") || "Department";
  const statusValue = pickString(record, "status").toLowerCase();

  return {
    id: recordId(record) || name,
    name,
    managerInitials: pickString(record, "managerInitials") || initialsFromName(managerName),
    managerName,
    managerAvatarColor: avatarColor(managerName),
    activeCount:
      pickNumber(record, "activeCount", "active_count", "headcount", "employeeCount", "employee_count", "staffCount") ?? 0,
    targetPercent: pickNumber(record, "targetPercent", "target_percent", "target", "attainment") ?? 0,
    status: includesAny(statusValue, "inactive", "archived") ? "Inactive" : "Active",
    hasHod: Boolean(
      pick(record, "hasHod", "has_hod", "hodId", "hod_id", "managerId", "manager_id") || managerName !== "Unassigned",
    ),
    icon: departmentIcon(name),
  };
}

function mapPromotionStatus(value: string): PromotionStatus {
  const normalized = value.toLowerCase();
  if (includesAny(normalized, "approv")) return "Approved";
  if (includesAny(normalized, "reject", "declin")) return "Rejected";
  if (includesAny(normalized, "draft")) return "Draft";
  return "Under admin review";
}

export function mapPromotion(item: unknown): Promotion {
  const record = asRecord(item);
  const name = personName(record);

  return {
    id: recordId(record) || name,
    initials: pickString(record, "initials") || initialsFromName(name),
    name,
    avatarColor: avatarColor(name),
    currentRole: pickString(record, "currentRole", "current_role", "fromRole", "from_role", "currentTitle") || "—",
    proposedRole: pickString(record, "proposedRole", "proposed_role", "toRole", "to_role", "newRole", "new_role") || "—",
    department: pickString(record, "department", "departmentName", "department_name") || undefined,
    submittedDate: formatShortDate(
      pickString(record, "submittedDate", "submitted_date", "createdAt", "created_at"),
    ),
    effectiveDate: formatDate(
      pickString(record, "effectiveDate", "effective_date", "startDate", "start_date"),
    ),
    status: mapPromotionStatus(pickString(record, "status")),
  };
}

function mapIncrementStatus(value: string): IncrementStatus {
  const normalized = value.toLowerCase();
  if (includesAny(normalized, "approv")) return "Approved";
  if (includesAny(normalized, "draft")) return "Draft";
  return "Under admin review";
}

export function mapSalaryIncrement(item: unknown): SalaryIncrement {
  const record = asRecord(item);
  const name = personName(record);
  const percent = formatPercent(
    pick(record, "incrementPercent", "increment_percent", "percentage", "percent") as string | number | undefined,
  );

  return {
    id: recordId(record) || name,
    initials: initialsFromName(name),
    name,
    avatarColor: avatarColor(name),
    department: pickString(record, "department", "departmentName", "department_name") || "—",
    currentSalary: formatMoney(pick(record, "currentSalary", "current_salary", "currentAmount") as string | number | undefined),
    proposedSalary: formatMoney(pick(record, "proposedSalary", "proposed_salary", "newSalary", "new_salary") as string | number | undefined),
    incrementPercent: percent,
    incrementAmount: percent,
    effectiveDate: formatDate(pickString(record, "effectiveDate", "effective_date")),
    submittedDate: formatShortDate(pickString(record, "submittedDate", "submitted_date", "createdAt", "created_at")),
    status: mapIncrementStatus(pickString(record, "status")),
  };
}

function mapMeetingTags(record: JsonRecord): MeetingTag[] {
  const tags: MeetingTag[] = [];
  const rawTags = pick(record, "tags");
  const status = pickString(record, "status", "state", "category", "visibility").toLowerCase();
  const companyWide = Boolean(pick(record, "companyWide", "company_wide", "isCompanyWide"));

  if (Array.isArray(rawTags)) {
    for (const tag of rawTags) {
      const label = titleCaseStatus(String(tag));
      if (label === "Upcoming" || label === "Completed" || label === "Company-wide") {
        tags.push(label);
      }
    }
  }

  if (includesAny(status, "complete", "done", "past")) tags.push("Completed");
  else tags.push("Upcoming");
  if (companyWide || includesAny(status, "company")) tags.push("Company-wide");

  return Array.from(new Set(tags));
}

export function mapMeeting(item: unknown): Meeting {
  const record = asRecord(item);
  const start = pickString(record, "startAt", "start_at", "startTime", "start_time", "scheduledAt", "date", "startsAt");
  const parsed = start ? new Date(start) : null;
  const tags = mapMeetingTags(record);
  const category: MeetingFilter = tags.includes("Company-wide")
    ? "Company-wide"
    : tags.includes("Completed")
      ? "Completed"
      : "Upcoming";

  return {
    id: recordId(record) || pickString(record, "title", "name") || "meeting",
    day: parsed && !Number.isNaN(parsed.getTime()) ? parsed.getDate() : Number(pickString(record, "day")) || 1,
    title: pickString(record, "title", "name", "subject") || "Meeting",
    tags,
    time:
      pickString(record, "time") ||
      (parsed && !Number.isNaN(parsed.getTime())
        ? parsed.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
        : ""),
    duration: pickString(record, "duration") || "",
    location: pickString(record, "location", "venue", "room") || "TBD",
    attendees: pickNumber(record, "attendees", "attendeeCount", "attendee_count") ?? 0,
    category,
  };
}

function mapTaskPriority(value: string): TaskPriority {
  const normalized = value.toLowerCase();
  if (includesAny(normalized, "high", "urgent", "critical")) return "High";
  if (includesAny(normalized, "low")) return "Low";
  return "Medium";
}

function mapTaskStatus(value: string): TaskStatus {
  const normalized = value.toLowerCase();
  if (includesAny(normalized, "complete", "done")) return "Completed";
  if (includesAny(normalized, "overdue", "late")) return "Overdue";
  if (includesAny(normalized, "progress", "active", "doing")) return "In Progress";
  return "Not Started";
}

export function mapTask(item: unknown): Task {
  const record = asRecord(item);
  const assignee = personName(record);

  return {
    id: recordId(record) || pickString(record, "title") || "task",
    title: pickString(record, "title", "name") || "Untitled task",
    description: pickString(record, "description", "details", "summary") || "",
    priority: mapTaskPriority(pickString(record, "priority")),
    status: mapTaskStatus(pickString(record, "status", "state")),
    assignee,
    assigneeInitials: initialsFromName(assignee),
    assigneeColor: avatarColor(assignee),
    dueDate: formatShortDate(pickString(record, "dueDate", "due_date", "deadline")),
    department: pickString(record, "department", "departmentName", "department_name") || "—",
  };
}

function mapReviewStatus(value: string): ReviewStatus {
  const normalized = value.toLowerCase();
  if (includesAny(normalized, "complete", "done")) return "Completed";
  if (includesAny(normalized, "overdue", "late")) return "Overdue";
  return "In review";
}

export function mapPerformanceReview(item: unknown): PerformanceReview {
  const record = asRecord(item);
  const name = personName(record);

  return {
    id: recordId(record) || name,
    name,
    role: pickString(record, "role", "title", "jobTitle", "job_title") || "—",
    initials: initialsFromName(name),
    avatarColor: avatarColor(name),
    reviewedBy: pickString(record, "reviewedBy", "reviewed_by", "reviewer", "managerName") || "—",
    rating: pickNumber(record, "rating", "score", "averageScore", "average_score") ?? 0,
    status: mapReviewStatus(pickString(record, "status")),
  };
}

function mapExpenseStatus(value: string): ExpenseStatus {
  const normalized = value.toLowerCase();
  if (includesAny(normalized, "approv")) return "Approved";
  if (includesAny(normalized, "reject", "declin")) return "Rejected";
  return "Pending";
}

function mapExpenseCategory(value: string): ExpenseCategory {
  const normalized = value.toLowerCase();
  if (includesAny(normalized, "meal", "food", "dining")) return "Meals";
  if (includesAny(normalized, "uber", "taxi", "transport")) return "Transport";
  if (includesAny(normalized, "travel", "flight", "hotel")) return "Travel";
  if (includesAny(normalized, "equip", "laptop", "hardware")) return "Equipment";
  return "Supplies";
}

export function mapExpense(item: unknown): ExpenseClaim {
  const record = asRecord(item);
  const category = mapExpenseCategory(pickString(record, "category", "type"));

  return {
    id: recordId(record),
    ref: pickString(record, "ref", "reference", "code") || recordId(record),
    description: pickString(record, "description", "title", "merchant", "notes") || "Expense",
    category,
    date: formatShortDate(pickString(record, "date", "spentAt", "spent_at", "createdAt", "created_at")),
    amount: formatMoney(pick(record, "amount", "total", "value") as string | number | undefined),
    status: mapExpenseStatus(pickString(record, "status")),
  };
}

function mapPurchaseStatus(value: string): PurchaseStatus {
  const normalized = value.toLowerCase();
  if (includesAny(normalized, "deliver")) return "Delivered";
  if (includesAny(normalized, "reject", "declin")) return "Rejected";
  if (includesAny(normalized, "approv")) return "Approved";
  if (includesAny(normalized, "admin")) return "Awaiting Admin Approval";
  return "Under Procurement Review";
}

export function mapProcurementRequest(item: unknown): PurchaseRequest {
  const record = asRecord(item);
  const requester = personName(record);
  const qty = pickNumber(record, "quantity", "qty");
  const department = pickString(record, "department", "departmentName", "department_name");

  return {
    id: recordId(record),
    ref: pickString(record, "ref", "reference", "code") || recordId(record),
    item: pickString(record, "item", "title", "name", "description") || "Procurement request",
    detail: [department, qty ? `Qty: ${qty}` : ""].filter(Boolean).join(" • ") || "—",
    requester,
    requesterInitials: initialsFromName(requester),
    requesterColor: avatarColor(requester),
    amount: formatMoney(pick(record, "amount", "total", "estimatedAmount", "estimated_amount") as string | number | undefined),
    submitted: formatShortDate(pickString(record, "submitted", "submittedAt", "submitted_at", "createdAt", "created_at")),
    status: mapPurchaseStatus(pickString(record, "status")),
  };
}

function mapEventCategory(record: JsonRecord): Exclude<EventFilter, "All"> {
  const value = `${pickString(record, "category", "type", "status", "kind")} ${JSON.stringify(pick(record, "tags") ?? "")}`.toLowerCase();
  if (includesAny(value, "sponsor")) return "Sponsorship";
  if (includesAny(value, "complete", "past", "archived")) return "Completed";
  return "Upcoming";
}

export function mapEvent(item: unknown): EventItem {
  const record = asRecord(item);
  const category = mapEventCategory(record);
  const tags: EventItem["tags"] = [];
  const rawTags = pick(record, "tags");

  if (Array.isArray(rawTags)) {
    for (const tag of rawTags) {
      const label = titleCaseStatus(String(typeof tag === "object" ? pickString(asRecord(tag), "label", "name") : tag));
      const tone = label.toLowerCase().replace(/\s+/g, "") as EventTagTone;
      tags.push({
        label,
        tone: ["internal", "external", "company", "upcoming", "completed", "sponsorship", "draft"].includes(tone)
          ? (tone as EventTagTone)
          : category === "Sponsorship"
            ? "sponsorship"
            : category === "Completed"
              ? "completed"
              : "upcoming",
      });
    }
  }

  if (tags.length === 0) {
    tags.push({
      label: category,
      tone: category === "Sponsorship" ? "sponsorship" : category === "Completed" ? "completed" : "upcoming",
    });
  }

  return {
    id: recordId(record),
    title: pickString(record, "title", "name") || "Event",
    tags,
    date: formatDate(pickString(record, "date", "startDate", "start_date", "startsAt", "starts_at")),
    audience: pickString(record, "audience", "departments", "department") || "All departments",
    description: pickString(record, "description", "summary", "details") || "",
    category,
    action: includesAny(pickString(record, "action", "status").toLowerCase(), "draft") ? "send-now" : "none",
  };
}

export function mapDisciplineCase(item: unknown): DisciplineCase {
  const record = asRecord(item);
  const name = personName(record);
  const statusValue = pickString(record, "status", "state").toLowerCase();
  const status: DisciplineCase["status"] = includesAny(statusValue, "close", "resolved", "archived")
    ? "Closed"
    : "Active";
  const actionType = pickString(record, "actionType", "action_type", "type", "severity") || "Warning";
  const tags: DisciplineCase["tags"] = [
    {
      label: actionType,
      tone: includesAny(actionType.toLowerCase(), "strike") ? "strike" : "warning",
    },
    {
      label: status,
      tone: (status === "Closed" ? "closed" : "active") as DisciplineTagTone,
    },
  ];

  return {
    id: recordId(record),
    ref: pickString(record, "ref", "reference", "code") || recordId(record),
    initials: initialsFromName(name),
    name,
    role:
      pickString(record, "role", "department", "departmentName", "department_name") ||
      pickString(nestedRecord(record, "employee"), "department", "role") ||
      "—",
    date: formatDate(pickString(record, "date", "incidentDate", "incident_date", "createdAt", "created_at")),
    issuedBy: pickString(record, "issuedBy", "issued_by", "createdBy", "created_by", "managerName") || "Manager",
    description: pickString(record, "description", "details", "reason", "notes") || "",
    status,
    tags,
  };
}

function mapNotificationType(value: string, message: string): NotificationType {
  const haystack = `${value} ${message}`.toLowerCase();
  if (includesAny(haystack, "system", "payroll", "policy", "alert")) return "System";
  return "Workflow";
}

export function mapNotification(item: unknown): Notification {
  const record = asRecord(item);
  const message = pickString(record, "message", "body", "title", "content") || "Notification";
  const read = Boolean(pick(record, "read", "isRead", "is_read")) || pickString(record, "status").toLowerCase() === "read";

  return {
    id: recordId(record),
    type: mapNotificationType(pickString(record, "type", "category", "kind"), message),
    referenceId: pickString(record, "referenceId", "reference_id", "ref", "reference") || undefined,
    message,
    timeAgo: pickString(record, "timeAgo", "time_ago", "relativeTime") || formatShortDate(pickString(record, "createdAt", "created_at", "sentAt", "sent_at")),
    unread: !read,
  };
}

const AUDIT_MODULES: AuditModule[] = [
  "Leave",
  "Discipline",
  "Promotions",
  "Payroll",
  "System",
  "Auth",
  "Email",
  "Purchases",
];

function mapAuditModule(value: string): AuditModule {
  const normalized = titleCaseStatus(value);
  return AUDIT_MODULES.find((module) => module.toLowerCase() === normalized.toLowerCase()) ?? "System";
}

export function mapAuditEvent(item: unknown): AuditEvent {
  const record = asRecord(item);
  const created = pickString(record, "createdAt", "created_at", "timestamp", "time");
  const parsed = created ? new Date(created) : null;
  const outcomeValue = pickString(record, "outcome", "status", "result").toLowerCase();

  return {
    id: recordId(record),
    time:
      parsed && !Number.isNaN(parsed.getTime())
        ? parsed.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
        : pickString(record, "time") || "",
    date:
      parsed && !Number.isNaN(parsed.getTime())
        ? parsed.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
        : pickString(record, "date") || "",
    user: pickString(record, "user", "actor", "actorName", "actor_name", "performedBy") || "System",
    action: pickString(record, "action", "event", "title") || "Activity recorded",
    target: pickString(record, "target", "resource", "entity", "description") || "—",
    module: mapAuditModule(pickString(record, "module", "resourceType", "resource_type", "entityType")),
    ip: pickString(record, "ip", "ipAddress", "ip_address") || "—",
    outcome: includesAny(outcomeValue, "fail", "error", "denied") ? "Failed" : "Success",
    security: Boolean(pick(record, "security", "isSecurity", "is_security")) || includesAny(`${pickString(record, "module")} ${pickString(record, "action")}`.toLowerCase(), "auth", "login", "role", "permission"),
  };
}

function mapMetricList(value: unknown, maxFallback = 100): DepartmentMetric[] {
  return unwrapList(value).items.map((item) => {
    const record = asRecord(item);
    const metricValue = pickNumber(record, "value", "count", "headcount", "score", "percent") ?? 0;
    return {
      name: pickString(record, "name", "label", "department", "title") || "—",
      value: metricValue,
      max: pickNumber(record, "max", "target", "capacity") ?? Math.max(metricValue, maxFallback),
    };
  });
}

export type MappedDashboard = {
  stats: { label: string; value: string }[];
  leaveRequests: DashboardLeaveRequest[];
  overviewItems: OverviewItem[];
  employeesByDepartment: DepartmentMetric[];
  departmentPerformance: DepartmentMetric[];
  recentActivity: ActivityItem[];
};

export function mapDashboard(payload: unknown, fallback: MappedDashboard): MappedDashboard {
  const record = asRecord(payload);
  const statsSource =
    pick(record, "stats", "metrics", "kpis", "counts") ?? payload;
  const mappedStats = unwrapList(statsSource).items.map((item) => {
    const stat = asRecord(item);
    return {
      label: pickString(stat, "label", "name", "title", "key") || "Metric",
      value: pickString(stat, "value", "count", "total") || "0",
    };
  });

  const leaveSource =
    pick(record, "approvals", "pendingApprovals", "leaveRequests", "leave", "pendingLeave") ?? [];
  const activitySource = pick(record, "recentActivity", "activity", "activities") ?? [];
  const overviewSource = pick(record, "overview", "upcoming", "navigation", "events") ?? [];
  const deptSource = pick(record, "departmentSummaries", "departments", "employeesByDepartment") ?? [];
  const performanceSource = pick(record, "departmentPerformance", "performance") ?? [];

  return {
    stats: mappedStats.length ? mappedStats : fallback.stats,
    leaveRequests: unwrapList(leaveSource).items.length
      ? unwrapList(leaveSource).items.map(mapDashboardLeave)
      : fallback.leaveRequests,
    overviewItems: unwrapList(overviewSource).items.length
      ? unwrapList(overviewSource).items.map((item) => {
          const entry = asRecord(item);
          return {
            id: recordId(entry),
            date: formatShortDate(pickString(entry, "date", "startDate", "start_at")),
            title: pickString(entry, "title", "name", "label") || "Upcoming",
          };
        })
      : fallback.overviewItems,
    employeesByDepartment: mapMetricList(deptSource, 42).length
      ? mapMetricList(deptSource, 42)
      : fallback.employeesByDepartment,
    departmentPerformance: mapMetricList(performanceSource, 100).length
      ? mapMetricList(performanceSource, 100)
      : fallback.departmentPerformance,
    recentActivity: unwrapList(activitySource).items.length
      ? unwrapList(activitySource).items.map((item) => {
          const entry = asRecord(item);
          return {
            id: recordId(entry),
            title: pickString(entry, "title", "action", "name") || "Activity",
            description: pickString(entry, "description", "details", "message") || "",
            time: pickString(entry, "time", "timeAgo", "createdAt", "created_at") || "",
          };
        })
      : fallback.recentActivity,
  };
}

export type MappedReports = {
  kpis: { id: string; label: string; value: string; badge: string; tone: "up" | "down" | "meta" | "good" }[];
};

export function mapReportKpis(
  payload: unknown,
  fallback: MappedReports["kpis"],
): MappedReports["kpis"] {
  const record = asRecord(payload);
  const headcount = asRecord(pick(record, "headcount", "headCount") ?? {});
  const leave = asRecord(pick(record, "leave") ?? {});
  const finance = asRecord(pick(record, "finance") ?? {});
  const stats = unwrapList(pick(record, "kpis", "stats", "metrics", "summary") ?? payload).items;

  if (stats.length) {
    return stats.slice(0, 4).map((item, index) => {
      const entry = asRecord(item);
      const fallbackItem = fallback[index] ?? fallback[0];
      return {
        id: recordId(entry) || fallbackItem.id,
        label: pickString(entry, "label", "name", "title") || fallbackItem.label,
        value: pickString(entry, "value", "count", "total") || fallbackItem.value,
        badge: pickString(entry, "badge", "delta", "change") || fallbackItem.badge,
        tone: fallbackItem.tone,
      };
    });
  }

  const overlays: Array<[string, JsonRecord]> = [
    ["headcount", headcount],
    ["leave", leave],
    ["finance", finance],
  ];

  return fallback.map((kpi) => {
    const match = overlays.find(([key]) => kpi.id.includes(key) || kpi.label.toLowerCase().includes(key));
    if (!match) return kpi;
    const value = pickString(match[1], "value", "total", "count", "rate") || kpi.value;
    return { ...kpi, value };
  });
}
