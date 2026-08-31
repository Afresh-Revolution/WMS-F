<<<<<<< HEAD
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
=======
import { unwrapList } from "@/lib/api";
import type { ApiListResponse } from "@/lib/api";

import type { Department } from "@/data/departments";

export function str(value: unknown, fallback = ""): string {
  if (value === null || value === undefined) return fallback;
  return String(value);
}

export function num(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function bool(value: unknown, fallback = false): boolean {
  if (typeof value === "boolean") return value;
  if (value === "true" || value === 1) return true;
  if (value === "false" || value === 0) return false;
  return fallback;
}

export function initials(name: string): string {
>>>>>>> 37eb1224d5b2fc1ab1c618b51d1c98ba658180c9
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

<<<<<<< HEAD
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
=======
const avatarColors = [
  "#fde68a",
  "#bfdbfe",
  "#fecdd3",
  "#bbf7d0",
  "#ddd6fe",
  "#fed7aa",
  "#a5f3fc",
];

export function avatarColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

export function listFrom<T extends Record<string, unknown>>(
  response: ApiListResponse<T> | T[] | null | undefined,
): T[] {
  if (!response) return [];
  if (Array.isArray(response)) return response;
  return unwrapList(response) as T[];
}

export function pick<T extends Record<string, unknown>>(
  record: Record<string, unknown>,
  keys: string[],
): T {
  const result: Record<string, unknown> = {};
  for (const key of keys) {
    if (key in record) result[key] = record[key];
  }
  return result as T;
}

export function formatEnabled(value: unknown): string {
  return bool(value) ? "Enabled" : "Disabled";
}

export function formatMinutes(value: unknown): string {
  const minutes = num(value);
  return minutes ? `${minutes} mins` : "—";
}

export function formatAttempts(value: unknown): string {
  const attempts = num(value);
  return attempts ? `${attempts} attempts` : "—";
}

export function formatChars(value: unknown): string {
  const length = num(value);
  return length ? `${length} chars` : "—";
}

export function mapSeverity(
  value: unknown,
): "Info" | "Warning" | "Critical" {
  const normalized = str(value).toLowerCase();
  if (normalized.includes("critical") || normalized.includes("error")) {
    return "Critical";
  }
  if (normalized.includes("warn")) return "Warning";
  return "Info";
}

export function mapServiceStatus(
  value: unknown,
): "Operational" | "Degraded" {
  const normalized = str(value).toLowerCase();
  if (
    normalized.includes("degrad") ||
    normalized.includes("warn") ||
    normalized.includes("down")
  ) {
    return "Degraded";
  }
  return "Operational";
}

export function mapUserStatus(
  value: unknown,
): "Active" | "Inactive" | "Locked" {
  const normalized = str(value).toLowerCase();
  if (normalized.includes("lock")) return "Locked";
  if (
    normalized.includes("inactive") ||
    normalized.includes("suspend") ||
    normalized.includes("deactiv")
  ) {
    return "Inactive";
  }
  return "Active";
}

export function mapAccessRole(value: unknown): string {
  const role = str(value, "Employee");
  return role
    .split(/[_-]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export type MappedAccessUser = {
  id: string;
  name: string;
  initials: string;
  email: string;
  role: string;
  department: string;
  status: "Active" | "Inactive" | "Locked";
  lastActive: string;
  avatarColor: string;
};

export function mapAccessUser(record: Record<string, unknown>): MappedAccessUser {
  const name = str(record.name ?? record.fullName ?? record.email, "Unknown user");
  const id = str(record.id ?? record._id);
  return {
    id,
    name,
    initials: str(record.initials, initials(name)),
    email: str(record.email),
    role: mapAccessRole(record.role ?? record.roleName),
    department: str(record.department ?? record.departmentName, "—"),
    status: mapUserStatus(record.status),
    lastActive: str(record.lastActive ?? record.lastLoginAt ?? record.updatedAt, "—"),
    avatarColor: str(record.avatarColor, avatarColor(id || name)),
  };
}

export type MappedAuditEvent = {
  id: string;
  user: string;
  action: string;
  target: string;
  module: string;
  outcome: string;
  security: boolean;
  timestamp: string;
  time: string;
  date: string;
  ip: string;
};

export function mapAuditEvent(record: Record<string, unknown>): MappedAuditEvent {
  const timestamp = str(record.timestamp ?? record.createdAt ?? record.occurredAt);
  return {
    id: str(record.id ?? record._id),
    user: str(record.user ?? record.actor ?? record.performedBy, "System"),
    action: str(record.action ?? record.event),
    target: str(record.target ?? record.resource ?? record.entity),
    module: str(record.module ?? record.area ?? record.category, "System"),
    outcome: str(record.outcome ?? record.status, "Success"),
    security: bool(record.security ?? record.isSecurity),
    timestamp,
    time: str(record.time, timestamp),
    date: str(record.date, timestamp),
    ip: str(record.ip ?? record.ipAddress, "—"),
  };
}

export type MappedTechnicalAuditEvent = {
  id: string;
  actor: string;
  area: string;
  title: string;
  summary: string;
  severity: "Info" | "Warning" | "Critical";
  timestamp: string;
};

export function mapTechnicalAuditEvent(
  record: Record<string, unknown>,
): MappedTechnicalAuditEvent {
  return {
    id: str(record.id ?? record._id),
    actor: str(record.actor ?? record.user ?? record.performedBy, "System"),
    area: str(record.area ?? record.module ?? record.category, "System"),
    title: str(record.title ?? record.action ?? record.event),
    summary: str(record.summary ?? record.description ?? record.details),
    severity: mapSeverity(record.severity ?? record.level),
    timestamp: str(record.timestamp ?? record.createdAt ?? record.occurredAt),
  };
}

export type MappedDocumentTemplate = {
  id: string;
  name: string;
  status: "Active" | "Inactive";
  updatedAt: string;
};

export function mapDocumentTemplate(
  record: Record<string, unknown>,
): MappedDocumentTemplate {
  const statusRaw = str(record.status).toLowerCase();
  return {
    id: str(record.id ?? record._id),
    name: str(record.name ?? record.title),
    status: statusRaw.includes("inactive") ? "Inactive" : "Active",
    updatedAt: str(record.updatedAt ?? record.updated_at, "—"),
  };
}

export type MappedBackupSnapshot = {
  id: string;
  title: string;
  status: string;
  kind: string;
  size: string;
  takenAt: string;
};

export function mapBackupSnapshot(
  record: Record<string, unknown>,
): MappedBackupSnapshot {
  return {
    id: str(record.id ?? record._id),
    title: str(record.title ?? record.name ?? record.label, "Backup"),
    status: str(record.status, "Complete"),
    kind: str(record.kind ?? record.type, "Manual"),
    size: str(record.size ?? record.fileSize, "—"),
    takenAt: str(record.takenAt ?? record.createdAt ?? record.completedAt, "—"),
  };
}

export type MappedEmployee = {
  id: string;
  name: string;
  initials: string;
  title: string;
  department: string;
  location: string;
  email: string;
  status: "Active" | "On leave";
  avatarColor: string;
};

export function mapEmployee(record: Record<string, unknown>): MappedEmployee {
  const name = str(record.name ?? record.fullName);
  const id = str(record.id ?? record._id);
  const statusRaw = str(record.status).toLowerCase();
  return {
    id,
    name,
    initials: str(record.initials, initials(name)),
    title: str(record.title ?? record.jobTitle ?? record.position),
    department: str(record.department ?? record.departmentName),
    location: str(record.location ?? record.office),
    email: str(record.email),
    status: statusRaw.includes("leave") ? "On leave" : "Active",
    avatarColor: str(record.avatarColor, avatarColor(id || name)),
  };
}


export function mapDepartmentRecord(
  record: Record<string, unknown>,
  index: number,
): Department {
  const managerName = str(record.head ?? record.hod ?? record.managerName, "—");
  const icons = ["software", "fashion", "media", "hardware", "hr", "model"] as const;
  return {
    id: str(record.id ?? record._id ?? index),
    name: str(record.name),
    managerInitials: str(record.managerInitials, initials(managerName)),
    managerName,
    managerAvatarColor: str(
      record.managerAvatarColor,
      avatarColor(managerName),
    ),
    activeCount: num(record.activeCount ?? record.employees ?? record.headcount),
    targetPercent: num(record.targetPercent ?? record.target ?? record.performance),
    status: str(record.status).toLowerCase().includes("inactive")
      ? "Inactive"
      : "Active",
    hasHod: Boolean(record.hasHod ?? record.hod ?? managerName !== "—"),
    icon: icons[index % icons.length],
  };
}

export type MappedDepartment = {
  id: string;
  name: string;
  head: string;
  employees: number;
  status: string;
};

export function mapDepartment(record: Record<string, unknown>): MappedDepartment {
  return {
    id: str(record.id ?? record._id),
    name: str(record.name),
    head: str(record.head ?? record.hod ?? record.headOfDepartment, "—"),
    employees: num(record.employees ?? record.employeeCount ?? record.headcount),
    status: str(record.status, "Active"),
  };
}

export type MappedTask = {
  id: string;
  title: string;
  description: string;
  priority: "High" | "Medium" | "Low";
  status: "In Progress" | "Not Started" | "Overdue" | "Completed";
  assignee: string;
  assigneeInitials: string;
  assigneeColor: string;
  dueDate: string;
  department: string;
};

export function mapTask(record: Record<string, unknown>): MappedTask {
  const assignee = str(record.assignee ?? record.assigneeName, "Unassigned");
  const statusRaw = str(record.status);
  let status: MappedTask["status"] = "Not Started";
  if (statusRaw.toLowerCase().includes("progress")) status = "In Progress";
  else if (statusRaw.toLowerCase().includes("overdue")) status = "Overdue";
  else if (statusRaw.toLowerCase().includes("complete")) status = "Completed";

  const priorityRaw = str(record.priority, "Medium");
  const priority = (
    priorityRaw.toLowerCase().includes("high")
      ? "High"
      : priorityRaw.toLowerCase().includes("low")
        ? "Low"
        : "Medium"
  ) as MappedTask["priority"];

  return {
    id: str(record.id ?? record._id),
    title: str(record.title ?? record.name),
    description: str(record.description ?? record.summary),
    priority,
    status,
    assignee,
    assigneeInitials: str(record.assigneeInitials, initials(assignee)),
    assigneeColor: str(record.assigneeColor, avatarColor(assignee)),
    dueDate: str(record.dueDate ?? record.deadline ?? record.due_at),
    department: str(record.department ?? record.departmentName),
  };
}

function mapLeaveStatus(value: unknown): "Pending" | "Approved" | "Declined" {
  const raw = str(value).toLowerCase();
  if (raw.includes("approve")) return "Approved";
  if (raw.includes("declin") || raw.includes("reject")) return "Declined";
  return "Pending";
}

function mapPromotionStatus(
  value: unknown,
): "Under admin review" | "Draft" | "Approved" | "Rejected" {
  const raw = str(value).toLowerCase();
  if (raw.includes("draft")) return "Draft";
  if (raw.includes("approve")) return "Approved";
  if (raw.includes("reject")) return "Rejected";
  return "Under admin review";
}

function mapIncrementStatus(
  value: unknown,
): "Under admin review" | "Draft" | "Approved" {
  const raw = str(value).toLowerCase();
  if (raw.includes("draft")) return "Draft";
  if (raw.includes("approve")) return "Approved";
  return "Under admin review";
}

export function mapLeaveRequest(record: Record<string, unknown>) {
  const name = str(record.name ?? record.employeeName);
  return {
    id: str(record.id ?? record._id),
    initials: str(record.initials, initials(name)),
    name,
    avatarColor: str(record.avatarColor, avatarColor(name)),
    type: str(record.type ?? record.leaveType),
    dateRange: str(record.dateRange ?? record.period ?? record.startDate),
    days: num(record.days ?? record.duration),
    status: mapLeaveStatus(record.status),
  };
}

export function mapLeaveBalance(record: Record<string, unknown>, index: number) {
  const icons = ["annual", "sick", "parental", "personal"] as const;
  const total = num(record.total ?? record.allocated, 1);
  const used = num(record.used ?? record.taken);
  const remaining = num(record.remaining ?? record.balance, total - used);
  return {
    id: str(record.id ?? record.type ?? index),
    label: str(record.label ?? record.type, "Leave"),
    remaining,
    used,
    total,
    icon: icons[index % icons.length],
  };
}

export function mapMeeting(record: Record<string, unknown>) {
  const statusRaw = str(record.status ?? record.category).toLowerCase();
  const tags: ("Upcoming" | "Company-wide" | "Completed")[] = [];
  if (statusRaw.includes("complete")) tags.push("Completed");
  else tags.push("Upcoming");
  if (bool(record.companyWide ?? record.isCompanyWide)) tags.push("Company-wide");

  const startDate = str(record.startDate ?? record.date ?? record.scheduledAt);
  const dayMatch = startDate.match(/\d{1,2}/);

  return {
    id: str(record.id ?? record._id),
    day: num(record.day ?? dayMatch?.[0], 1),
    title: str(record.title ?? record.name),
    tags,
    time: str(record.time ?? record.startTime),
    duration: str(record.duration),
    location: str(record.location ?? record.room),
    attendees: num(record.attendees ?? record.attendeeCount),
    category: (tags.includes("Completed")
      ? "Completed"
      : tags.includes("Company-wide")
        ? "Company-wide"
        : "Upcoming") as "Upcoming" | "Completed" | "Company-wide" | "All",
  };
}

export function mapPromotion(record: Record<string, unknown>) {
  const name = str(record.name ?? record.employeeName);
  return {
    id: str(record.id ?? record._id),
    initials: str(record.initials, initials(name)),
    name,
    avatarColor: str(record.avatarColor, avatarColor(name)),
    currentRole: str(record.currentRole ?? record.fromRole ?? record.currentTitle),
    proposedRole: str(record.proposedRole ?? record.toRole ?? record.newTitle),
    department: str(record.department ?? record.departmentName) || undefined,
    submittedDate: str(record.submittedDate ?? record.createdAt),
    effectiveDate: str(record.effectiveDate ?? record.effectiveFrom),
    status: mapPromotionStatus(record.status),
  };
}

export function mapSalaryIncrement(record: Record<string, unknown>) {
  const name = str(record.name ?? record.employeeName);
  return {
    id: str(record.id ?? record._id),
    initials: str(record.initials, initials(name)),
    name,
    avatarColor: str(record.avatarColor, avatarColor(name)),
    department: str(record.department ?? record.departmentName),
    currentSalary: str(record.currentSalary ?? record.currentAmount),
    proposedSalary: str(record.proposedSalary ?? record.proposedAmount),
    incrementPercent: str(record.incrementPercent ?? record.percentChange, "+0%"),
    incrementAmount: str(record.incrementAmount ?? record.incrementPercent),
    effectiveDate: str(record.effectiveDate ?? record.effectiveFrom),
    submittedDate: str(record.submittedDate ?? record.createdAt),
    status: mapIncrementStatus(record.status),
  };
}

export function mapPerformanceReview(record: Record<string, unknown>) {
  const name = str(record.name ?? record.employeeName);
  const statusRaw = str(record.status).toLowerCase();
  let status: "Completed" | "In review" | "Overdue" = "In review";
  if (statusRaw.includes("complete")) status = "Completed";
  else if (statusRaw.includes("overdue")) status = "Overdue";

  return {
    id: str(record.id ?? record._id),
    name,
    role: str(record.role ?? record.jobTitle),
    initials: str(record.initials, initials(name)),
    avatarColor: str(record.avatarColor, avatarColor(name)),
    reviewedBy: str(record.reviewedBy ?? record.reviewer),
    rating: num(record.rating ?? record.score, 0),
    status,
  };
}

export function mapAnnouncement(record: Record<string, unknown>) {
  const category = str(record.category, "General") as
    | "HR"
    | "Finance"
    | "General"
    | "Urgent";
  const toneMap: Record<string, "finance" | "urgent" | "hr" | "general" | "pinned"> = {
    finance: "finance",
    urgent: "urgent",
    hr: "hr",
    general: "general",
  };
  const tags = Array.isArray(record.tags)
    ? (record.tags as { label: string; tone?: string }[]).map((tag) => ({
        label: str(tag.label),
        tone: (toneMap[str(tag.tone ?? tag.label).toLowerCase()] ?? "general") as
          | "finance"
          | "urgent"
          | "hr"
          | "general"
          | "pinned",
      }))
    : [{ label: category, tone: toneMap[category.toLowerCase()] ?? "general" }];

  return {
    id: str(record.id ?? record._id),
    initials: str(record.initials, initials(str(record.source ?? record.title))),
    title: str(record.title),
    source: str(record.source ?? record.author),
    date: str(record.date ?? record.publishedAt ?? record.createdAt),
    body: str(record.body ?? record.content ?? record.description),
    tags,
    pinned: bool(record.pinned ?? record.isPinned),
    unread: bool(record.unread ?? record.isUnread ?? !record.readAt),
    category,
  };
}

export function mapEvent(record: Record<string, unknown>) {
  const categoryRaw = str(record.category ?? record.status, "Upcoming");
  const category = (
    categoryRaw.toLowerCase().includes("sponsor")
      ? "Sponsorship"
      : categoryRaw.toLowerCase().includes("complete")
        ? "Completed"
        : "Upcoming"
  ) as "Upcoming" | "Sponsorship" | "Completed";

  return {
    id: str(record.id ?? record._id),
    title: str(record.title ?? record.name),
    tags: [{ label: category, tone: category.toLowerCase() as "upcoming" | "completed" | "sponsorship" }],
    date: str(record.date ?? record.startDate ?? record.scheduledAt),
    audience: str(record.audience ?? record.targetAudience),
    description: str(record.description ?? record.summary),
    category,
    action: (str(record.action).includes("sent") ? "sent" : "none") as "sent" | "send-now" | "none",
  };
}

export function mapDisciplineCase(record: Record<string, unknown>) {
  const name = str(record.name ?? record.employeeName);
  const statusRaw = str(record.status).toLowerCase();
  const status = statusRaw.includes("closed") ? "Closed" : "Active";
  return {
    id: str(record.id ?? record._id),
    ref: str(record.ref ?? record.reference ?? record.caseNumber),
    initials: str(record.initials, initials(name)),
    name,
    role: str(record.role ?? record.department),
    date: str(record.date ?? record.issuedAt ?? record.createdAt),
    issuedBy: str(record.issuedBy ?? record.issuer),
    description: str(record.description ?? record.summary),
    status: status as "Active" | "Closed",
    tags: Array.isArray(record.tags)
      ? (record.tags as { label: string; tone?: string }[]).map((tag) => ({
          label: str(tag.label),
          tone: (str(tag.tone, "active") as "warning" | "unacknowledged" | "active" | "closed" | "acknowledged" | "strike"),
        }))
      : [{ label: status, tone: status === "Closed" ? "closed" : "active" as const }],
  };
}

export function mapPlacement(record: Record<string, unknown>) {
  const name = str(record.name ?? record.fullName);
  const typeRaw = str(record.type ?? record.placementType).toUpperCase();
  const statusRaw = str(record.status).toLowerCase();
  let status: "Active" | "Exiting soon" | "Exited" = "Active";
  if (statusRaw.includes("exit") && !statusRaw.includes("soon")) status = "Exited";
  else if (statusRaw.includes("soon") || statusRaw.includes("exiting")) status = "Exiting soon";

  return {
    id: str(record.id ?? record._id),
    initials: str(record.initials, initials(name)),
    name,
    type: (typeRaw.includes("NYSC") ? "NYSC" : "Intern") as "NYSC" | "Intern",
    school: str(record.school ?? record.institution),
    department: str(record.department ?? record.departmentName),
    supervisor: str(record.supervisor ?? record.supervisorName),
    endDate: str(record.endDate ?? record.completionDate),
    progress: num(record.progress ?? record.completionPercent),
    status,
  };
}

export function mapPayRun(record: Record<string, unknown>) {
  const statusRaw = str(record.status).toLowerCase();
  return {
    id: str(record.id ?? record._id),
    ref: str(record.ref ?? record.reference),
    period: str(record.period ?? record.payPeriod),
    runDate: str(record.runDate ?? record.processedAt),
    staff: num(record.staff ?? record.employeeCount),
    totalAmount: str(record.totalAmount ?? record.amount),
    status: (statusRaw.includes("complete") ? "Completed" : "Processing") as
      | "Processing"
      | "Completed",
  };
}

export function mapBill(record: Record<string, unknown>) {
  const statusRaw = str(record.status);
  let status:
    | "Awaiting Admin Approval"
    | "Scheduled for Payment"
    | "Overdue"
    | "Pending review"
    | "Paid" = "Pending review";
  if (statusRaw.toLowerCase().includes("overdue")) status = "Overdue";
  else if (statusRaw.toLowerCase().includes("paid")) status = "Paid";
  else if (statusRaw.toLowerCase().includes("schedul")) status = "Scheduled for Payment";
  else if (statusRaw.toLowerCase().includes("admin")) status = "Awaiting Admin Approval";

  return {
    id: str(record.id ?? record._id),
    ref: str(record.ref ?? record.reference),
    vendor: str(record.vendor ?? record.vendorName),
    category: str(record.category),
    amount: str(record.amount ?? record.total),
    dueDate: str(record.dueDate ?? record.due_at),
    status,
  };
}

export function mapExpense(record: Record<string, unknown>) {
  const statusRaw = str(record.status).toLowerCase();
  let status: "Pending" | "Approved" | "Rejected" = "Pending";
  if (statusRaw.includes("approve")) status = "Approved";
  else if (statusRaw.includes("reject")) status = "Rejected";

  return {
    id: str(record.id ?? record._id),
    ref: str(record.ref ?? record.reference),
    description: str(record.description ?? record.title),
    category: str(record.category, "Supplies") as
      | "Meals"
      | "Transport"
      | "Travel"
      | "Supplies"
      | "Equipment",
    date: str(record.date ?? record.submittedAt),
    amount: str(record.amount ?? record.total),
    status,
  };
}

export function mapPurchaseRequest(record: Record<string, unknown>) {
  const requester = str(record.requester ?? record.requesterName);
  const statusRaw = str(record.status).toLowerCase();
  let status:
    | "Under Procurement Review"
    | "Awaiting Admin Approval"
    | "Approved"
    | "Delivered"
    | "Rejected" = "Under Procurement Review";
  if (statusRaw.includes("admin")) status = "Awaiting Admin Approval";
  else if (statusRaw.includes("approve")) status = "Approved";
  else if (statusRaw.includes("deliver")) status = "Delivered";
  else if (statusRaw.includes("reject")) status = "Rejected";

  return {
    id: str(record.id ?? record._id),
    ref: str(record.ref ?? record.reference),
    item: str(record.item ?? record.title),
    detail: str(record.detail ?? record.description),
    requester,
    requesterInitials: str(record.requesterInitials, initials(requester)),
    requesterColor: str(record.requesterColor, avatarColor(requester)),
    amount: str(record.amount ?? record.total),
    submitted: str(record.submitted ?? record.submittedAt ?? record.createdAt),
    status,
  };
}

export function mapVendor(record: Record<string, unknown>) {
  return {
    id: str(record.id ?? record._id),
    name: str(record.name ?? record.vendorName),
    category: str(record.category),
    location: str(record.location),
    email: str(record.email),
    ytdSpend: str(record.ytdSpend ?? record.totalSpend),
    openBills: num(record.openBills ?? record.pendingBills),
    active: bool(record.active ?? record.isActive, true),
  };
>>>>>>> 37eb1224d5b2fc1ab1c618b51d1c98ba658180c9
}
