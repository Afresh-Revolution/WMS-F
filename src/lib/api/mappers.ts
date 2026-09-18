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
  phone: string;
  status: "Active" | "On leave";
  avatarColor: string;
};

export function mapEmployee(record: Record<string, unknown>): MappedEmployee {
  const nested = asRecord(record.data) ?? record;
  const user = asRecord(nested.user);
  const profile = asRecord(nested.profile) ?? asRecord(nested.employee);
  const avatar = asRecord(nested.avatar);
  const overview = asRecord(nested.overview);
  const email = str(
    nested.email ??
      user?.email ??
      profile?.email ??
      nested.workEmail ??
      nested.companyEmail,
  );
  const name = str(
    nested.fullName ??
      nested.name ??
      overview?.fullName ??
      user?.name ??
      user?.fullName ??
      profile?.fullName,
    email,
  );
  const id = str(
    nested.id ??
      nested._id ??
      nested.employeeId ??
      record.id ??
      record._id ??
      user?.id,
  );
  const statusRaw = str(nested.status ?? user?.status ?? overview?.status).toLowerCase();
  return {
    id,
    name,
    initials: str(
      nested.initials ?? avatar?.initials ?? overview?.initials,
      initials(name),
    ),
    title: str(
      nested.jobPosition ??
        nested.jobTitle ??
        nested.title ??
        nested.position ??
        overview?.position ??
        user?.jobTitle,
    ),
    department: nestedStr(
      nested.department ?? overview?.department,
      ["name", "title", "label"],
      str(nested.departmentName ?? user?.department ?? profile?.department),
    ),
    location: str(nested.location ?? nested.office ?? overview?.location),
    email,
    phone: str(
      nested.phone ??
        nested.phoneNumber ??
        nested.mobile ??
        profile?.phone ??
        user?.phone,
    ),
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
  const nested = asRecord(record.data) ?? record;
  const leaveType = asRecord(nested.leaveType) ?? asRecord(nested.type);
  const employee = asRecord(nested.employee);
  const name = str(
    nested.name ?? nested.employeeName ?? employee?.name ?? employee?.fullName,
  );
  const start = str(nested.startDate ?? nested.from);
  const end = str(nested.endDate ?? nested.to);
  return {
    id: str(nested.id ?? nested._id ?? record.id),
    initials: str(nested.initials, initials(name)),
    name,
    avatarColor: str(nested.avatarColor, avatarColor(name)),
    type: str(
      nested.leaveTypeName ??
        leaveType?.name ??
        nested.type ??
        nested.leaveType,
    ),
    dateRange:
      start && end && end !== start
        ? `${start} – ${end}`
        : str(nested.dateRange ?? nested.period ?? start),
    days: num(
      nested.duration ?? nested.workingDays ?? nested.days ?? nested.totalDays,
    ),
    status: mapLeaveStatus(nested.status),
    reason: str(nested.reason ?? nested.note ?? nested.comment ?? nested.notes),
  };
}

export function mapEmployeeLeaveRequest(record: Record<string, unknown>) {
  const mapped = mapLeaveRequest(record);
  const nested = asRecord(record.data) ?? record;
  const start = str(nested.startDate ?? nested.from ?? nested.start);
  const end = str(nested.endDate ?? nested.to ?? nested.end);
  const dates = start
    ? end && end !== start
      ? `${start} – ${end}`
      : start
    : str(nested.dateRange ?? nested.period ?? nested.dates);
  const statusRaw = str(nested.status).toUpperCase();
  let status: "Pending" | "Approved" | "Rejected" | "Withdrawn" | "Cancelled" =
    "Pending";
  if (statusRaw.includes("APPROVE")) status = "Approved";
  else if (statusRaw.includes("REJECT") || statusRaw.includes("DECLIN")) {
    status = "Rejected";
  } else if (statusRaw.includes("WITHDRAW")) status = "Withdrawn";
  else if (statusRaw.includes("CANCEL")) status = "Cancelled";
  const note = str(
    nested.note ??
      nested.reason ??
      nested.comment ??
      nested.reviewComment ??
      nested.decisionNote,
  );
  return {
    id: str(nested.id ?? nested._id, mapped.id),
    code: str(nested.id ?? nested._id, mapped.id).slice(0, 8),
    type: str(nested.leaveTypeName, mapped.type || "Leave"),
    days: num(nested.duration ?? nested.workingDays, mapped.days),
    status,
    dates,
    reason: note,
    note,
  };
}

export function mapLeaveBalance(record: Record<string, unknown>, index: number) {
  const nested = asRecord(record.data) ?? record;
  const leaveType = asRecord(nested.leaveType) ?? asRecord(nested.type);
  const code = str(
    nested.code ?? nested.leaveTypeCode ?? leaveType?.code ?? nested.label,
  ).toLowerCase();
  const icons = ["annual", "sick", "parental", "personal"] as const;
  const icon = (
    code.includes("sick")
      ? "sick"
      : code.includes("personal")
        ? "personal"
        : code.includes("parent")
          ? "parental"
          : "annual"
  ) as (typeof icons)[number];
  const total = num(
    nested.allocatedDays ?? nested.total ?? nested.allocated,
    1,
  );
  const used = num(nested.usedDays ?? nested.used ?? nested.taken);
  const remaining = num(
    nested.remainingDays ?? nested.remaining ?? nested.balance,
    total - used - num(nested.pendingDays),
  );
  return {
    id: str(nested.id ?? nested._id ?? nested.type ?? index),
    label: str(
      nested.leaveTypeName ?? leaveType?.name ?? nested.label ?? nested.type,
      "Leave",
    ),
    remaining,
    used,
    total,
    icon: icons.includes(icon) ? icon : icons[index % icons.length],
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
  const nested = asRecord(record.data) ?? record;
  const categoryRaw = str(nested.category, "General");
  const priority = str(nested.priority, "normal").toLowerCase();
  const status = str(nested.status, "published").toLowerCase();
  const lowerCategory = categoryRaw.toLowerCase();
  const category = (
    lowerCategory === "urgent" || priority === "urgent"
      ? "Urgent"
      : lowerCategory === "finance"
        ? "Finance"
        : lowerCategory === "hr"
          ? "HR"
          : "General"
  ) as "HR" | "Finance" | "General" | "Urgent";
  const toneMap: Record<string, "finance" | "urgent" | "hr" | "general" | "pinned"> = {
    finance: "finance",
    events: "general",
    security: "urgent",
    urgent: "urgent",
    hr: "hr",
    general: "general",
    important: "urgent",
    draft: "general",
    scheduled: "general",
    published: "general",
    archived: "general",
  };
  const tags: { label: string; tone: "finance" | "urgent" | "hr" | "general" | "pinned" }[] =
    Array.isArray(nested.tags)
      ? (nested.tags as { label: string; tone?: string }[]).map((tag) => ({
          label: str(tag.label),
          tone: (toneMap[str(tag.tone ?? tag.label).toLowerCase()] ?? "general") as
            | "finance"
            | "urgent"
            | "hr"
            | "general"
            | "pinned",
        }))
      : [
          {
            label: categoryRaw,
            tone: toneMap[lowerCategory] ?? "general",
          },
        ];
  if (priority === "urgent" && !tags.some((tag) => tag.tone === "urgent")) {
    tags.push({ label: "Urgent", tone: "urgent" });
  }
  const pinned = bool(nested.isPinned ?? nested.pinned);
  if (pinned && !tags.some((tag) => tag.tone === "pinned")) {
    tags.push({ label: "Pinned", tone: "pinned" });
  }
  if (status && status !== "published" && !tags.some((tag) => tag.label.toLowerCase() === status)) {
    tags.push({
      label: status.charAt(0).toUpperCase() + status.slice(1),
      tone: "general",
    });
  }

  const isRead = nested.isRead;
  const unread =
    typeof isRead === "boolean"
      ? !isRead
      : bool(nested.unread ?? nested.isUnread);

  const publishedAt = str(
    nested.publishedAt ?? nested.date ?? nested.createdAt,
  );
  let date = publishedAt;
  const parsed = publishedAt ? new Date(publishedAt) : null;
  if (parsed && !Number.isNaN(parsed.getTime()) && publishedAt.includes("T")) {
    date = parsed.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  const source =
    str(nested.source) ||
    nestedStr(nested.publishedBy) ||
    str(nested.author) ||
    nestedStr(nested.createdBy) ||
    categoryRaw ||
    "Company";

  return {
    id: str(nested.id ?? nested._id ?? record.id ?? record._id),
    code: str(nested.code),
    initials: str(nested.initials, initials(source || str(nested.title))),
    title: str(nested.title),
    source,
    date,
    body: str(nested.message ?? nested.body ?? nested.content ?? nested.description),
    tags,
    pinned,
    unread,
    category,
    status,
    priority,
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
  const employee = asRecord(record.employee) ?? asRecord(record.staff);
  const name = str(
    record.name ??
      record.employeeName ??
      employee?.fullName ??
      employee?.name,
  );
  const statusRaw = str(record.status).toLowerCase();
  const status = statusRaw.includes("closed") ? "Closed" : "Active";
  const actionLabel = str(
    record.actionType ?? record.type ?? record.action,
    status,
  );
  return {
    id: str(record.id ?? record._id),
    ref: str(record.ref ?? record.reference ?? record.caseNumber),
    initials: str(record.initials, initials(name)),
    name,
    role: str(
      record.role ??
        record.department ??
        nestedStr(employee?.department, ["name", "title", "label"]),
    ),
    date: str(record.date ?? record.issuedAt ?? record.createdAt),
    issuedBy: str(
      record.issuedBy ?? record.issuer ?? nestedStr(record.issuedByUser),
    ),
    description: str(record.description ?? record.reason ?? record.summary),
    status: status as "Active" | "Closed",
    tags: Array.isArray(record.tags)
      ? (record.tags as { label: string; tone?: string }[]).map((tag) => ({
          label: str(tag.label),
          tone: (str(tag.tone, "active") as "warning" | "unacknowledged" | "active" | "closed" | "acknowledged" | "strike"),
        }))
      : [
          {
            label: actionLabel,
            tone:
              actionLabel.toLowerCase().includes("strike")
                ? ("strike" as const)
                : actionLabel.toLowerCase().includes("warn")
                  ? ("warning" as const)
                  : status === "Closed"
                    ? ("closed" as const)
                    : ("active" as const),
          },
        ],
  };
}

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function formatPlacementDate(value: unknown): string {
  const raw = str(value);
  if (!raw) return "";
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return raw;
  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function mapPlacement(record: Record<string, unknown>) {
  const nested = asObject(record.data);
  const root = Object.keys(nested).length > 0 ? { ...record, ...nested } : record;
  const profile = asObject(root.profile);
  const placement = asObject(root.placement);
  const contact = asObject(root.contact ?? profile.contact);
  const education = asObject(root.education ?? profile.education);
  const emergency = asObject(
    contact.emergencyContact ?? profile.emergencyContact ?? root.emergencyContact,
  );
  const department = asObject(root.department ?? profile.department ?? placement.department);
  const supervisor = asObject(root.supervisor ?? profile.supervisor ?? placement.supervisor);
  const progressObj = asObject(placement.progress ?? root.progress);

  const name = str(profile.fullName ?? root.name ?? root.fullName);
  const typeRaw = str(profile.type ?? root.type ?? root.placementType).toUpperCase();
  const statusRaw = str(
    placement.placementStatus ?? root.placementStatus ?? root.status,
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
    education.institution ?? profile.institution ?? root.institution ?? root.school,
  );
  const course = str(
    education.courseOfStudy ?? profile.courseOfStudy ?? root.courseOfStudy,
  );
  const school = course ? `${institution} · ${course}` : institution;

  const supervisorName = str(
    supervisor.fullName ??
      supervisor.name ??
      (typeof root.supervisor === "string" ? root.supervisor : "") ??
      root.supervisorName,
  );

  return {
    id: str(profile.id ?? placement.id ?? root.id ?? root._id),
    initials: str(root.initials ?? profile.initials, initials(name)),
    name,
    type: (typeRaw.includes("NYSC") ? "NYSC" : "Intern") as "NYSC" | "Intern",
    school,
    institution,
    course,
    department: str(
      department.name ??
        (typeof root.department === "string" ? root.department : "") ??
        root.departmentName,
    ),
    supervisor: supervisorName,
    startDate: formatPlacementDate(
      placement.startDate ?? root.startDate ?? profile.startDate,
    ),
    endDate: formatPlacementDate(
      placement.expectedEndDate ??
        root.expectedEndDate ??
        root.endDate ??
        root.completionDate,
    ),
    email: str(contact.email ?? profile.email ?? root.email),
    phone: str(contact.phone ?? profile.phone ?? root.phone),
    address: str(contact.address ?? profile.address ?? root.address),
    emergencyName: str(
      emergency.name ?? emergency.fullName ?? profile.emergencyContactName,
    ),
    emergencyPhone: str(emergency.phone ?? profile.emergencyContactPhone),
    progress: num(
      progressObj.progressPercentage ??
        progressObj.completionProgress ??
        root.progress ??
        root.completionPercent,
    ),
    status,
  };
}

export function mapPayRun(record: Record<string, unknown>) {
  const statusRaw = str(record.status).toLowerCase();
  return {
    id: str(record.id ?? record._id),
    ref: str(record.ref ?? record.reference),
    period: str(record.period ?? record.periodName ?? record.payPeriod),
    runDate: str(record.runDate ?? record.run_date ?? record.processedAt),
    staff: num(record.staff ?? record.employeeCount ?? record.employee_count),
    totalAmount: str(
      record.totalAmount ?? record.netAmount ?? record.net_amount ?? record.amount,
    ),
    status: (statusRaw.includes("complete") ||
    statusRaw.includes("paid") ||
    statusRaw.includes("lock")
      ? "Completed"
      : "Processing") as "Processing" | "Completed",
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
