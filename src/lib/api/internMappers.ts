import { initials, num, str } from "@/lib/api/mappers";
import type {
  NyscAccount,
  NyscAnnouncement,
  NyscMeeting,
  NyscMilestone,
  NyscNotification,
  NyscProgressNote,
  NyscProgressNoteKind,
  NyscTask,
  NyscTaskPriority,
  NyscTaskStatus,
} from "@/data/nyscOverview";

export function asInternRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export function unwrapInternData<T = unknown>(payload: unknown): T {
  if (payload == null) return {} as T;
  const root = asInternRecord(payload);
  if ("data" in root) return (root.data ?? {}) as T;
  return payload as T;
}

const LIST_KEYS = [
  "items",
  "records",
  "results",
  "rows",
  "tasks",
  "assignedToMe",
  "meetings",
  "schedule",
  "news",
  "notifications",
  "documents",
  "reviews",
  "targets",
  "attendance",
  "history",
  "milestones",
  "departments",
] as const;

export function unwrapInternList(payload: unknown): Record<string, unknown>[] {
  if (Array.isArray(payload)) return payload as Record<string, unknown>[];
  const data = unwrapInternData(payload);
  if (Array.isArray(data)) return data as Record<string, unknown>[];
  const rec = asInternRecord(data);
  for (const key of LIST_KEYS) {
    if (Array.isArray(rec[key])) return rec[key] as Record<string, unknown>[];
  }
  const nested = asInternRecord(rec.data);
  for (const key of LIST_KEYS) {
    if (Array.isArray(nested[key])) return nested[key] as Record<string, unknown>[];
  }
  return [];
}

export function mappedOrFallback<T>(
  payload: unknown,
  mapped: T[],
  fallback: T[],
): T[] {
  return payload == null ? fallback : mapped;
}

function nestedName(record: Record<string, unknown>, key: string): string {
  const nested = record[key];
  if (typeof nested === "string") return nested;
  const rec = asInternRecord(nested);
  return str(rec.fullName ?? rec.name ?? rec.title ?? rec.email);
}

export function formatInternDate(value: unknown, fallback = ""): string {
  const text = str(value);
  if (!text) return fallback;
  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return text || fallback;
  return parsed.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDue(value: unknown, fallback = ""): string {
  const formatted = formatInternDate(value);
  if (!formatted) return fallback;
  if (/^due\b/i.test(formatted)) return formatted;
  return `Due ${formatted}`;
}

function relativeFrom(value: unknown, fallback = "Upcoming"): string {
  const parsed = new Date(str(value));
  if (Number.isNaN(parsed.getTime())) return str(value, fallback) || fallback;
  const days = Math.round((parsed.getTime() - Date.now()) / 86_400_000);
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days === -1) return "Yesterday";
  if (days > 1 && days < 8) return `In ${days} days`;
  if (days < 0 && days > -8) return `${Math.abs(days)}d ago`;
  return parsed.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function durationLabel(
  start: unknown,
  end: unknown,
  minutes: unknown,
  fallback: string,
): string {
  const mins = num(minutes);
  if (mins > 0) return `${mins} mins`;
  const startDate = new Date(str(start));
  const endDate = new Date(str(end));
  if (
    !Number.isNaN(startDate.getTime()) &&
    !Number.isNaN(endDate.getTime()) &&
    endDate > startDate
  ) {
    const diff = Math.round((endDate.getTime() - startDate.getTime()) / 60_000);
    if (diff > 0) return `${diff} mins`;
  }
  return fallback;
}

function firstNameFrom(fullName: string, fallback: string): string {
  return fullName.split(/\s+/).filter(Boolean)[0] || fallback;
}

export function mapInternProfileType(
  value: unknown,
  fallback: "NYSC" | "Intern" = "Intern",
): "NYSC" | "Intern" {
  const raw = str(value).toUpperCase();
  if (raw === "NYSC") return "NYSC";
  if (raw === "INTERN") return "Intern";
  return fallback;
}

function placementStatusLabel(value: unknown, fallback: string): string {
  const raw = str(value).toUpperCase();
  if (raw === "ENDING_SOON") return "Exiting soon";
  if (raw === "ACTIVE") return "Active placement";
  if (raw === "PENDING") return "Pending placement";
  if (raw === "COMPLETED") return "Completed";
  if (raw === "EXITED") return "Exited";
  if (raw === "TERMINATED") return "Terminated";
  if (raw === "CANCELLED") return "Cancelled";
  return fallback;
}

function mapTaskStatus(value: unknown, progress: number): NyscTaskStatus {
  const raw = str(value).toUpperCase().replace(/[\s-]/g, "_");
  if (raw.includes("OVERDUE")) return "Overdue";
  if (raw.includes("COMPLETE")) return "Completed";
  if (raw.includes("REVIEW")) return "In Review";
  if (
    raw.includes("NOT_START") ||
    raw === "TODO" ||
    raw === "PENDING" ||
    raw === "NOT_STARTED"
  ) {
    return "Not Started";
  }
  if (raw.includes("PROGRESS")) return "In Progress";
  if (progress >= 100) return "Completed";
  if (progress > 0) return "In Progress";
  return "Not Started";
}

export function toInternTaskStatus(status: NyscTaskStatus): string {
  return status.toUpperCase().replace(/ /g, "_");
}

function mapPriority(value: unknown): NyscTaskPriority {
  const raw = str(value).toLowerCase();
  if (raw.includes("high") || raw.includes("urgent")) return "High";
  if (raw.includes("low")) return "Low";
  return "Medium";
}

export function mapInternTask(record: Record<string, unknown>): NyscTask {
  const progress = Math.min(
    100,
    Math.max(0, num(record.progress ?? record.percent ?? record.completion)),
  );
  return {
    id: str(record.id ?? record._id),
    title: str(record.title ?? record.name),
    assignee:
      nestedName(record, "assignedBy") ||
      nestedName(record, "supervisor") ||
      str(record.assignee ?? record.assignedByName, "Supervisor"),
    due: formatDue(record.dueDate ?? record.due ?? record.deadline),
    dueMeta: str(record.dueMeta ?? record.dueLabel),
    status: mapTaskStatus(record.status, progress),
    priority: mapPriority(record.priority),
    description: str(record.description ?? record.note ?? record.summary),
    progress,
  };
}

export function mapInternMeeting(record: Record<string, unknown>): NyscMeeting {
  const start =
    record.startTime ??
    record.startsAt ??
    record.start ??
    record.scheduledAt ??
    record.date;
  const end = record.endTime ?? record.endsAt ?? record.end;
  return {
    id: str(record.id ?? record._id),
    title: str(record.title ?? record.name ?? record.subject),
    when: formatInternDate(start, str(record.when)),
    duration: durationLabel(start, end, record.durationMinutes ?? record.duration, str(record.duration, "1 hr")),
    location: str(record.location ?? record.room ?? record.venue, "TBC"),
    organiser:
      nestedName(record, "organiser") ||
      nestedName(record, "organizer") ||
      nestedName(record, "host") ||
      str(record.organiser ?? record.organizer, "Supervisor"),
    relative: str(record.relative, relativeFrom(start)),
  };
}

export function mapInternAnnouncement(
  record: Record<string, unknown>,
  index = 0,
): NyscAnnouncement {
  const sourceRaw = str(record.source ?? record.type ?? record.audience).toLowerCase();
  const source = sourceRaw.includes("department")
    ? "Department"
    : sourceRaw.includes("company")
      ? "Company"
      : str(record.source, "Company") || "Company";
  return {
    id: str(record.id ?? record._id, `news-${index}`),
    title: str(record.title ?? record.headline),
    source,
    date: formatInternDate(record.publishedAt ?? record.date ?? record.createdAt),
    body: str(record.body ?? record.content ?? record.summary),
    author:
      nestedName(record, "author") ||
      str(record.author ?? record.createdBy, "People Team"),
    featured: index === 0 || Boolean(record.featured),
  };
}

export function mapInternNotification(
  record: Record<string, unknown>,
): NyscNotification {
  const read = Boolean(record.read ?? record.isRead);
  const unread =
    record.unread != null ? Boolean(record.unread) : !read;
  return {
    id: str(record.id ?? record._id),
    text: str(record.text ?? record.message ?? record.title),
    featured: unread,
    unread,
  };
}

export function mapInternMilestone(
  record: Record<string, unknown>,
  index: number,
): NyscMilestone {
  const status = str(record.status).toUpperCase();
  const value = num(record.currentValue ?? record.value ?? record.progress);
  const targetVal = num(record.targetValue ?? record.target);
  const done =
    status.includes("COMPLETE") ||
    Boolean(record.done) ||
    (targetVal > 0 && value >= targetVal);
  return {
    id: str(record.id ?? record._id, `m-${index}`),
    label: str(record.title ?? record.name ?? record.label),
    done,
    target: formatInternDate(
      record.dueDate ?? record.targetDate ?? record.endDate,
      str(record.target, "Ongoing"),
    ),
  };
}

function reviewKind(record: Record<string, unknown>): NyscProgressNoteKind {
  const rec = str(record.recommendation ?? record.kind).toUpperCase();
  if (
    rec.includes("EMPLOY") ||
    rec.includes("CONTINUE") ||
    rec.includes("PRAISE") ||
    num(record.overallScore) >= 80
  ) {
    return "Praise";
  }
  if (
    rec.includes("DO_NOT") ||
    rec.includes("ACTION") ||
    rec.includes("TERMINAT")
  ) {
    return "Action";
  }
  return "Note";
}

export function mapInternReviewNote(
  record: Record<string, unknown>,
  index: number,
): NyscProgressNote {
  const comments = str(record.comments ?? record.body ?? record.note);
  const strengths = str(record.strengths);
  return {
    id: str(record.id ?? record._id, `r-${index}`),
    author:
      nestedName(record, "reviewer") ||
      nestedName(record, "supervisor") ||
      str(record.author, "Supervisor"),
    kind: reviewKind(record),
    body: comments || strengths || str(record.weaknesses),
    date: formatInternDate(
      record.createdAt ?? record.reviewDate ?? record.date,
    ),
  };
}

export type InternSettings = {
  emailNotifications: boolean;
  theme: string;
  profileName: string;
};

export function mapInternSettings(
  payload: unknown,
  fallback: InternSettings,
): InternSettings {
  const data = asInternRecord(unwrapInternData(payload));
  if (Object.keys(data).length === 0) return fallback;
  const preferences = asInternRecord(data.preferences ?? data);
  const profile = asInternRecord(data.profile);
  return {
    emailNotifications: Boolean(
      preferences.emailNotifications ??
        preferences.emailAlerts ??
        fallback.emailNotifications,
    ),
    theme: str(preferences.theme, fallback.theme) || fallback.theme,
    profileName: str(
      profile.fullName ?? profile.name,
      fallback.profileName,
    ),
  };
}

export function mapInternProgressOverlay(
  payload: unknown,
  fallback: NyscAccount,
): Pick<NyscAccount, "milestones" | "progressNotes" | "progress"> {
  if (payload == null) {
    return {
      milestones: fallback.milestones,
      progressNotes: fallback.progressNotes,
      progress: fallback.progress,
    };
  }
  const data = asInternRecord(unwrapInternData(payload));
  const placement = asInternRecord(data.placement);
  const progress = asInternRecord(placement.progress ?? data.progress ?? placement);
  const elapsed = Math.round(
    num(
      progress.progressPercentage ?? progress.completionProgress,
      fallback.progress.placementElapsed,
    ),
  );
  return {
    milestones: unwrapInternList(data.targets ?? data.milestones).map(
      mapInternMilestone,
    ),
    progressNotes: unwrapInternList(data.reviews).map(mapInternReviewNote),
    progress: {
      placementElapsed: elapsed,
      tasksCompleted: fallback.progress.tasksCompleted,
      profileCompletion: fallback.progress.profileCompletion,
    },
  };
}

export function mapInternAccount(
  dashboardPayload: unknown,
  placementPayload: unknown,
  fallback: NyscAccount,
): NyscAccount {
  if (dashboardPayload == null && placementPayload == null) return fallback;

  const dashboard = asInternRecord(unwrapInternData(dashboardPayload));
  const placementRoot = asInternRecord(unwrapInternData(placementPayload));
  const scope = asInternRecord(dashboard.scope);
  const dashProfile = asInternRecord(dashboard.profile);
  const dashPlacement = asInternRecord(dashboard.placement);
  const metrics = asInternRecord(dashboard.metrics);
  const recProfile = asInternRecord(
    placementRoot.profile ?? placementRoot.overview,
  );
  const recPlacement = asInternRecord(placementRoot.placement);
  const contact = asInternRecord(placementRoot.contact);
  const education = asInternRecord(placementRoot.education);
  const emergency = asInternRecord(contact.emergencyContact);
  const profile = { ...dashProfile, ...recProfile };
  const placement = { ...dashPlacement, ...recPlacement };
  const placementProgress = asInternRecord(
    placement.progress ?? dashboard.progress,
  );
  const dashProgress = asInternRecord(dashboard.progress);

  const fullName = str(profile.fullName ?? profile.name, fallback.name);
  const type = mapInternProfileType(scope.type ?? profile.type, fallback.type);
  const departmentName =
    nestedName(profile, "department") ||
    nestedName(placement, "department") ||
    fallback.profile.department;
  const supervisorName =
    nestedName(profile, "supervisor") ||
    nestedName(placement, "supervisor") ||
    fallback.profile.supervisor;
  const startDate = formatInternDate(placement.startDate, fallback.startDate);
  const endDate = formatInternDate(
    placement.expectedEndDate ?? placement.endDate,
    fallback.endDate,
  );
  const daysToExit = num(
    placementProgress.daysRemaining ?? metrics.daysRemaining,
    fallback.daysToExit,
  );
  const elapsed = Math.round(
    num(
      placementProgress.progressPercentage ??
        placementProgress.completionProgress ??
        metrics.placementProgress,
      fallback.progress.placementElapsed,
    ),
  );
  const assignedTasks = num(metrics.assignedTasks, fallback.tasks.length);
  const completedTasks = num(metrics.completedTasks);
  const tasksCompletedPct =
    assignedTasks > 0
      ? Math.round((completedTasks / assignedTasks) * 100)
      : fallback.progress.tasksCompleted;
  const course = str(
    education.courseOfStudy ?? profile.courseOfStudy,
    fallback.course,
  );
  const institution = str(
    education.institution ?? profile.institution,
    fallback.institution,
  );
  const roleTitle = str(
    placement.role ?? profile.role,
    type === "NYSC" ? "NYSC Member" : "Intern",
  );

  const liveDash = dashboardPayload != null;
  const livePlacement = placementPayload != null;

  const tasks = mappedOrFallback(
    liveDash || livePlacement ? dashboardPayload ?? placementPayload : null,
    unwrapInternList(dashboard.assignedToMe ?? placementRoot.tasks).map(
      mapInternTask,
    ),
    fallback.tasks,
  );
  const meetings = mappedOrFallback(
    liveDash || livePlacement ? dashboardPayload ?? placementPayload : null,
    unwrapInternList(dashboard.schedule ?? placementRoot.meetings).map(
      mapInternMeeting,
    ),
    fallback.meetings,
  );
  const announcements = mappedOrFallback(
    liveDash ? dashboardPayload : null,
    unwrapInternList(dashboard.news ?? placementRoot.news).map(
      mapInternAnnouncement,
    ),
    fallback.announcements,
  );
  const notifications = mappedOrFallback(
    liveDash ? dashboardPayload : null,
    unwrapInternList(dashboard.notifications).map(mapInternNotification),
    fallback.notifications,
  );
  const milestones = mappedOrFallback(
    liveDash || livePlacement ? dashboardPayload ?? placementPayload : null,
    unwrapInternList(dashProgress.targets ?? placementRoot.targets).map(
      mapInternMilestone,
    ),
    fallback.milestones,
  );
  const progressNotes = mappedOrFallback(
    liveDash || livePlacement ? dashboardPayload ?? placementPayload : null,
    unwrapInternList(dashProgress.reviews ?? placementRoot.reviews).map(
      mapInternReviewNote,
    ),
    fallback.progressNotes,
  );

  const unreadNotifications = num(
    metrics.unreadNotifications,
    notifications.filter((item) => item.unread ?? item.featured).length,
  );

  return {
    ...fallback,
    firstName: firstNameFrom(fullName, fallback.firstName),
    name: fullName,
    initials: str(profile.initials, initials(fullName) || fallback.initials),
    type,
    sidebarRole: type === "NYSC" ? "NYSC Member" : "Intern",
    eyebrow: `${type === "NYSC" ? "NYSC Member" : "Intern"}  ·  ${departmentName}`,
    titleLine: `${roleTitle} · ${institution}`,
    course,
    institution,
    startDate,
    endDate,
    daysToExit,
    dateRange: `${startDate} → ${endDate}`,
    profile: {
      ...fallback.profile,
      roleTitle,
      status: placementStatusLabel(
        placement.placementStatus ?? profile.status,
        fallback.profile.status,
      ),
      department: departmentName,
      supervisor: supervisorName,
      companyEmail: str(
        contact.email ?? profile.email,
        fallback.profile.companyEmail,
      ),
      personalEmail: str(
        contact.personalEmail ?? profile.personalEmail,
        fallback.profile.personalEmail,
      ),
      phone: str(contact.phone ?? profile.phone, fallback.profile.phone),
      emergencyName: str(
        emergency.name ?? profile.emergencyContactName,
        fallback.profile.emergencyName,
      ),
      emergencyPhone: str(
        emergency.phone ?? profile.emergencyContactPhone,
        fallback.profile.emergencyPhone,
      ),
      address: str(contact.address ?? profile.address, fallback.profile.address),
    },
    stats: fallback.stats.map((stat) => {
      if (stat.id === "exit") {
        return { ...stat, value: String(daysToExit), meta: `${elapsed}% elapsed` };
      }
      if (stat.id === "tasks") {
        const overdue = num(metrics.overdueTasks);
        return {
          ...stat,
          value: String(assignedTasks),
          meta: overdue > 0 ? `${overdue} overdue` : "Currently open",
        };
      }
      if (stat.id === "role") {
        return { ...stat, meta: type === "NYSC" ? "NYSC Member" : "Intern" };
      }
      return stat;
    }),
    tasks,
    meetings,
    progress: {
      placementElapsed: elapsed,
      tasksCompleted: tasksCompletedPct,
      profileCompletion: fallback.progress.profileCompletion,
    },
    milestones,
    progressNotes,
    announcements,
    notifications,
    unreadNotifications,
  };
}
