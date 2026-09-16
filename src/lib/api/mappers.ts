import { unwrapList, unwrapRecord, type ApiListResponse } from "./types";

import type { Department } from "@/data/departments";

export { unwrapRecord };

export function str(value: unknown, fallback = ""): string {
  if (value === null || value === undefined) return fallback;
  return String(value);
}

export function nestedStr(
  value: unknown,
  keys: string[] = ["name", "title", "label", "email"],
  fallback = "",
): string {
  if (value === null || value === undefined) return fallback;
  if (typeof value !== "object") return str(value, fallback);
  const record = value as Record<string, unknown>;
  for (const key of keys) {
    if (record[key] !== null && record[key] !== undefined) {
      return str(record[key], fallback);
    }
  }
  return fallback;
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
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

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
  return unwrapList<T>(response);
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
  const nested = asRecord(record.data) ?? record;
  const name = str(nested.name ?? nested.fullName);
  const id = str(nested.id ?? nested._id ?? record.id ?? record._id);
  const statusRaw = str(nested.status).toLowerCase();
  return {
    id,
    name,
    initials: str(nested.initials, initials(name)),
    title: str(nested.title ?? nested.jobTitle ?? nested.position),
    department: nestedStr(nested.department, ["name", "title", "label"], str(nested.departmentName)),
    location: str(nested.location ?? nested.office),
    email: str(nested.email),
    status: statusRaw.includes("leave") ? "On leave" : "Active",
    avatarColor: str(nested.avatarColor ?? record.avatarColor, avatarColor(id || name)),
  };
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

export function readTemporaryPassword(payload: unknown): string {
  const keyPattern = /temp|plain|generated|initial|login|temporary/i;

  const walk = (value: unknown, depth: number): string => {
    if (depth > 8 || value == null) return "";
    if (Array.isArray(value)) {
      for (const item of value) {
        const found = walk(item, depth + 1);
        if (found) return found;
      }
      return "";
    }
    if (typeof value !== "object") return "";
    const record = value as Record<string, unknown>;
    for (const [key, nested] of Object.entries(record)) {
      if (
        typeof nested === "string" &&
        nested.trim() &&
        /password/i.test(key) &&
        keyPattern.test(key)
      ) {
        return nested.trim();
      }
    }
    for (const nested of Object.values(record)) {
      const found = walk(nested, depth + 1);
      if (found) return found;
    }
    return "";
  };

  return walk(payload, 0);
}

export type HodOption = {
  id: string;
  userId: string;
  fullName: string;
  name: string;
  email: string;
};

function hodOptionFrom(record: Record<string, unknown>): HodOption | null {
  const nested = asRecord(record.user) ?? asRecord(record.employee) ?? record;
  const id = str(record.id ?? record.hodId ?? nested.id ?? nested.userId);
  const userId = str(record.userId ?? nested.userId ?? id);
  const fullName = str(
    record.fullName ?? nested.fullName ?? record.name ?? nested.name,
  );
  const name = str(record.name ?? nested.name ?? fullName);
  const email = str(record.email ?? nested.email);
  if (!id && !userId) return null;
  if (!fullName && !name && !email) return null;
  return {
    id: id || userId,
    userId: userId || id,
    fullName: fullName || name || email,
    name: name || fullName || email,
    email,
  };
}

export function parseHodOptions(payload: unknown): HodOption[] {
  const root = asRecord(payload);
  const data = asRecord(root?.data) ?? root;
  const meta = asRecord(root?.meta) ?? asRecord(data?.meta);
  const named = [
    ...listFrom(meta?.hods as never),
    ...listFrom(data?.hods as never),
    ...listFrom(data?.employees as never),
    ...listFrom(data?.options as never),
  ];
  const pool = named.length
    ? named
    : [...listFrom(payload as never), ...listFrom(data as never)];
  const seen = new Set<string>();
  const options: HodOption[] = [];
  for (const record of pool) {
    const option = hodOptionFrom(record);
    if (!option || seen.has(option.id)) continue;
    seen.add(option.id);
    options.push(option);
  }
  return options;
}


export function mapDepartmentRecord(
  record: Record<string, unknown>,
  index: number,
): Department {
  const hod = asRecord(record.hod) ?? asRecord(record.head);
  const managerName = str(
    hod?.fullName ??
      hod?.name ??
      record.hodName ??
      record.head ??
      record.managerName,
    "—",
  );
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

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export function mapPlacement(record: Record<string, unknown>) {
  const profile = asObject(record.profile);
  const placement = asObject(record.placement);
  const department = asObject(record.department ?? profile.department);
  const supervisor = asObject(record.supervisor ?? profile.supervisor);
  const progressObj = asObject(placement.progress ?? record.progress);

  const name = str(profile.fullName ?? record.name ?? record.fullName);
  const typeRaw = str(profile.type ?? record.type ?? record.placementType).toUpperCase();
  const statusRaw = str(
    placement.placementStatus ?? record.placementStatus ?? record.status,
  ).toUpperCase();
  let status: "Active" | "Exiting soon" | "Exited" = "Active";
  if (statusRaw.includes("ENDING") || statusRaw.includes("SOON")) {
    status = "Exiting soon";
  } else if (
    statusRaw.includes("COMPLETE") ||
    statusRaw.includes("EXIT") ||
    statusRaw.includes("TERMINAT") ||
    statusRaw.includes("CANCEL")
  ) {
    status = "Exited";
  }

  const institution = str(
    profile.institution ?? record.institution ?? record.school,
  );
  const course = str(profile.courseOfStudy ?? record.courseOfStudy);
  const school = course ? `${institution} · ${course}` : institution;
  const endRaw = str(
    placement.expectedEndDate ??
      record.expectedEndDate ??
      record.endDate ??
      record.completionDate,
  );
  const parsedEnd = endRaw ? new Date(endRaw) : null;
  const endDate =
    parsedEnd && !Number.isNaN(parsedEnd.getTime())
      ? parsedEnd.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : endRaw;

  const supervisorName = str(
    supervisor.fullName ??
      supervisor.name ??
      (typeof record.supervisor === "string" ? record.supervisor : "") ??
      record.supervisorName,
  );

  return {
    id: str(profile.id ?? record.id ?? record._id),
    initials: str(record.initials ?? profile.initials, initials(name)),
    name,
    type: (typeRaw.includes("NYSC") ? "NYSC" : "Intern") as "NYSC" | "Intern",
    school,
    department: str(
      department.name ??
        (typeof record.department === "string" ? record.department : "") ??
        record.departmentName,
    ),
    supervisor: supervisorName,
    endDate,
    progress: num(
      progressObj.progressPercentage ??
        progressObj.completionProgress ??
        record.progress ??
        record.completionPercent,
    ),
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
}
