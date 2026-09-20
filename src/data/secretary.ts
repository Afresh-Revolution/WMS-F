export type SecretaryStat = {
  id: string;
  value: string;
  label: string;
  tag: string;
};

export type EmailRequest = {
  id: string;
  name: string;
  initials: string;
  avatarColor: string;
  role: string;
  email: string;
  requestId: string;
};

export type EmailRequestStatus = "Pending" | "Failed" | "Created" | "Cancelled";

export type EmailRequestFilter = EmailRequestStatus | "All";

export type EmailQueueRequest = {
  id: string;
  requestId: string;
  name: string;
  initials: string;
  avatarColor: string;
  role: string;
  department: string;
  email: string;
  status: EmailRequestStatus;
  requestedBy: string;
  requestedByRole: string;
  requestedAt: string;
  hrNote: string;
};

export function suggestEmails(email: string): string[] {
  const [local = "", domain = "afresh.co"] = email.split("@");
  const [first = local, last = ""] = local.split(".");
  const suggestions = [
    email,
    last ? `${first}.${last[0]}@${domain}` : `${first}@${domain}`,
    last ? `${first[0]}${last}@${domain}` : `${first}1@${domain}`,
    `${local}2@${domain}`,
  ];
  return [...new Set(suggestions.filter(Boolean))];
}

export type EmailRequestStat = {
  id: string;
  value: string;
  label: string;
  tag: string;
  tone: "action" | "muted" | "soft";
  filter: EmailRequestFilter;
};

export type FailedEmail = {
  id: string;
  name: string;
  initials: string;
  avatarColor: string;
  reason: string;
};

export type SecretaryMeeting = {
  id: string;
  title: string;
  time: string;
  when?: string;
  audience: string;
  location?: string;
};

export type ManagementTask = {
  id: string;
  title: string;
  audience: string;
  overdue: string;
};

export type SecretaryReminder = {
  id: string;
  title: string;
  detail: string;
  due?: boolean;
};

export type CalendarGroup = {
  id: string;
  label: string;
  items: { id: string; date: string; title: string; time: string }[];
};

export type CalendarEventKind = "meeting" | "reminder" | "task";

export type CalendarView = "month" | "week" | "agenda";

export type CalendarEvent = {
  id: string;
  title: string;
  date: string;
  kind: CalendarEventKind;
  time?: string;
  audience?: string;
  bar?: boolean;
};

export const calendarLegend: { kind: CalendarEventKind; label: string }[] = [
  { kind: "meeting", label: "Meeting" },
  { kind: "reminder", label: "Reminder" },
  { kind: "task", label: "Task deadline" },
];

export const calendarViews: { id: CalendarView; label: string; href: string }[] =
  [
    { id: "month", label: "Month", href: "/secretary/calendar" },
    { id: "week", label: "Week", href: "/secretary/calendar/week" },
    { id: "agenda", label: "Agenda", href: "/secretary/calendar/agenda" },
  ];

export function todayKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export type CreatedEmail = {
  id: string;
  name: string;
  initials: string;
  avatarColor: string;
  email: string;
  status: "active" | "pending";
};

export const secretaryStatCards: Array<Omit<SecretaryStat, "value">> = [
  { id: "pending", label: "Pending email requests", tag: "Action" },
  { id: "failed", label: "Failed email creations", tag: "Retry" },
  { id: "today", label: "Meetings today", tag: "Today" },
  { id: "review", label: "Awaiting review", tag: "Queue" },
  { id: "upcoming", label: "Open email requests", tag: "In progress" },
];

export type MeetingFilter =
  | "Upcoming"
  | "Today"
  | "For Admin"
  | "For HODs"
  | "All";

export type MeetingAudience = "For Admin" | "For HOD";

export type MeetingPerson = {
  id: string;
  name: string;
  initials: string;
  avatarColor: string;
};

export type ManagedMeeting = {
  id: string;
  title: string;
  date: string;
  when: string;
  time: string;
  duration: string;
  location: string;
  virtual: boolean;
  attendees: number;
  audience: MeetingAudience;
  organiser?: string;
  virtualLink?: string;
  reminder?: string;
  people?: MeetingPerson[];
  agenda?: string[];
};

export const meetingFilters: MeetingFilter[] = [
  "Upcoming",
  "Today",
  "For Admin",
  "For HODs",
  "All",
];

export const meetingFilterHrefs: Record<MeetingFilter, string> = {
  Upcoming: "/secretary/meetings",
  Today: "/secretary/meetings/today",
  "For Admin": "/secretary/meetings/admin",
  "For HODs": "/secretary/meetings/hods",
  All: "/secretary/meetings/all",
};

export function meetingFilterFromPath(pathname: string): MeetingFilter {
  if (pathname === "/secretary/meetings/today") return "Today";
  if (pathname === "/secretary/meetings/admin") return "For Admin";
  if (pathname === "/secretary/meetings/hods") return "For HODs";
  if (pathname === "/secretary/meetings/all") return "All";
  return "Upcoming";
}

export type MeetingStat = {
  id: string;
  value: string;
  label: string;
  tag: string;
  tone: "action" | "muted" | "soft";
  filter: MeetingFilter;
};

export const meetingStatCards: Array<Omit<MeetingStat, "value">> = [
  { id: "today", label: "Today's meetings", tag: "Today", tone: "soft", filter: "Today" },
  { id: "upcoming", label: "Upcoming", tag: "Scheduled", tone: "soft", filter: "Upcoming" },
  { id: "admin", label: "For Admin", tag: "Total", tone: "soft", filter: "For Admin" },
  { id: "hods", label: "For HODs", tag: "Total", tone: "soft", filter: "For HODs" },
];

export type TaskColumn = "Open" | "In Progress" | "Done";
export type TaskPriority = "High" | "Medium" | "Low";
export type TaskAudience = "For Admin" | "For HOD";

export type BoardTask = {
  id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  audience: TaskAudience;
  owner: string;
  column: TaskColumn;
  due: string;
  overdue?: boolean;
};

export const boardColumns: TaskColumn[] = ["Open", "In Progress", "Done"];

export type ReminderChannel = "Both" | "In-app" | "Email";
export type ReminderFilter = "Upcoming" | "Done" | "All";

export type ManagedReminder = {
  id: string;
  title: string;
  date: string;
  time: string;
  when: string;
  dateLabel: string;
  channel: ReminderChannel;
  link?: string;
  linkHref?: string;
  due?: boolean;
  done?: boolean;
};

export const reminderFilters: ReminderFilter[] = ["Upcoming", "Done", "All"];

export const reminderFilterHrefs: Record<ReminderFilter, string> = {
  Upcoming: "/secretary/reminders",
  Done: "/secretary/reminders/done",
  All: "/secretary/reminders/all",
};

export function reminderFilterFromPath(pathname: string): ReminderFilter {
  if (pathname.endsWith("/reminders/done")) return "Done";
  if (pathname.endsWith("/reminders/all")) return "All";
  return "Upcoming";
}

export const emailRequestStatCards: Array<Omit<EmailRequestStat, "value">> = [
  { id: "pending", label: "Pending requests", tag: "Action", tone: "action", filter: "Pending" },
  { id: "failed", label: "Failed creations", tag: "Retry", tone: "action", filter: "Failed" },
  { id: "created", label: "Created", tag: "Done", tone: "muted", filter: "Created" },
  { id: "total", label: "Total requests", tag: "All time", tone: "soft", filter: "All" },
];

export const emailRequestFilters: EmailRequestFilter[] = [
  "Pending",
  "Failed",
  "Created",
  "Cancelled",
  "All",
];

export type MailboxStatus =
  | "Active"
  | "Suspended"
  | "Deactivation Pending"
  | "Deactivated";

export type MailboxFilter = MailboxStatus | "All";

export type DirectoryMailbox = {
  id: string;
  name: string;
  initials: string;
  avatarColor: string;
  email: string;
  department: string;
  storage: string;
  since: string;
  status: MailboxStatus;
};

export type DirectoryStat = {
  id: string;
  value: string;
  label: string;
  tag: string;
  tone: "action" | "muted" | "soft";
  filter: MailboxFilter;
};

export const directoryStatCards: Array<Omit<DirectoryStat, "value">> = [
  { id: "active", label: "Active mailboxes", tag: "Live", tone: "action", filter: "Active" },
  { id: "suspended", label: "Suspended", tag: "On hold", tone: "soft", filter: "Suspended" },
  { id: "pending", label: "Awaiting deactivation", tag: "Pending", tone: "muted", filter: "Deactivation Pending" },
  { id: "total", label: "Total mailboxes", tag: "Directory", tone: "soft", filter: "All" },
];

export const directoryFilters: MailboxFilter[] = [
  "All",
  "Active",
  "Suspended",
  "Deactivation Pending",
  "Deactivated",
];
