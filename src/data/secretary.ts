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

export const PROTOTYPE_TODAY = "2026-08-03";

export const calendarEvents: CalendarEvent[] = [
  {
    id: "1",
    title: "Circulate meeting minutes",
    date: "2026-08-01",
    kind: "task",
  },
  {
    id: "2",
    title: "Engineering department review",
    date: "2026-08-03",
    kind: "meeting",
    time: "11:30 AM",
    audience: "For HOD",
  },
  {
    id: "3",
    title: "Leadership sync starts in 30 min",
    date: "2026-08-03",
    kind: "reminder",
    time: "2:30 PM",
  },
  {
    id: "4",
    title: "Weekly leadership sync",
    date: "2026-08-03",
    kind: "meeting",
    time: "3:00 PM",
    audience: "For Admin",
  },
  {
    id: "5",
    title: "Send board pack to Admin",
    date: "2026-08-03",
    kind: "reminder",
    time: "4:00 PM",
  },
  {
    id: "6",
    title: "Finance close prep tomorrow",
    date: "2026-08-04",
    kind: "reminder",
    time: "9:00 AM",
  },
  {
    id: "7",
    title: "Book boardroom for review",
    date: "2026-08-04",
    kind: "task",
    time: "9:00 AM",
    audience: "HOD",
  },
  {
    id: "8",
    title: "Follow up on Lena's mailbox deactivation",
    date: "2026-08-04",
    kind: "reminder",
    time: "12:00 PM",
  },
  {
    id: "9",
    title: "Finance close prep",
    date: "2026-08-05",
    kind: "meeting",
    time: "10:00 AM",
    audience: "For Admin",
  },
  {
    id: "10",
    title: "Collect agenda items",
    date: "2026-08-05",
    kind: "task",
    time: "10:00 AM",
    audience: "Admin",
  },
  {
    id: "11",
    title: "Media team planning",
    date: "2026-08-07",
    kind: "meeting",
    time: "2:00 PM",
    audience: "For HOD",
    bar: true,
  },
];
export type CreatedEmail = {
  id: string;
  name: string;
  initials: string;
  avatarColor: string;
  email: string;
  status: "active" | "pending";
};

export const secretaryStats: SecretaryStat[] = [
  { id: "pending", value: "2", label: "Pending email requests", tag: "Action" },
  { id: "failed", value: "1", label: "Failed email creations", tag: "Retry" },
  { id: "created", value: "1", label: "Recently created", tag: "7 days" },
  { id: "suspended", value: "1", label: "Suspended emails", tag: "On hold" },
  { id: "deactivation", value: "1", label: "Awaiting deactivation", tag: "Pending" },
];

export const pendingEmailRequests: EmailRequest[] = [
  {
    id: "1",
    name: "Sara Ahmed",
    initials: "SA",
    avatarColor: "#fed7aa",
    role: "Software Engineer",
    email: "sara.ahmed@afresh.co",
    requestId: "EM-1042",
  },
  {
    id: "2",
    name: "Daniel Okafor",
    initials: "DO",
    avatarColor: "#bfdbfe",
    role: "Product Designer",
    email: "daniel.okafor@afresh.co",
    requestId: "EM-1043",
  },
];

export const failedEmailCreations: FailedEmail[] = [
  {
    id: "1",
    name: "Ife Adeyemi",
    initials: "IA",
    avatarColor: "#fecdd3",
    reason: "Mailbox provisioning timed out on the mail server.",
  },
];

export const todaysMeetings: SecretaryMeeting[] = [
  {
    id: "1",
    title: "Engineering department review",
    time: "11:30 AM",
    audience: "For HOD",
    location: "Room 2",
  },
  {
    id: "2",
    title: "Weekly leadership sync",
    time: "3:00 PM",
    audience: "For Admin",
    location: "Boardroom A / Virtual",
  },
];

export const upcomingMeetings: SecretaryMeeting[] = [
  {
    id: "1",
    title: "Finance close prep",
    time: "10:00 AM",
    when: "In 2 days",
    audience: "For Admin",
  },
  {
    id: "2",
    title: "Media team planning",
    time: "2:00 PM",
    when: "In 4 days",
    audience: "For HOD",
  },
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

export const DEFAULT_MEETING_ORGANISER = "David Okoye (Admin)";

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

export const meetingStats: MeetingStat[] = [
  {
    id: "today",
    value: "2",
    label: "Today's meetings",
    tag: "Today",
    tone: "soft",
    filter: "Today",
  },
  {
    id: "upcoming",
    value: "2",
    label: "Upcoming",
    tag: "Scheduled",
    tone: "soft",
    filter: "Upcoming",
  },
  {
    id: "admin",
    value: "2",
    label: "For Admin",
    tag: "Total",
    tone: "soft",
    filter: "For Admin",
  },
  {
    id: "hods",
    value: "2",
    label: "For HODs",
    tag: "Total",
    tone: "soft",
    filter: "For HODs",
  },
];

export const managedMeetings: ManagedMeeting[] = [
  {
    id: "1",
    title: "Engineering department review",
    date: "2026-08-03",
    when: "Today",
    time: "11:30 AM",
    duration: "45m",
    location: "Room 2",
    virtual: false,
    attendees: 3,
    audience: "For HOD",
    organiser: "Nina Patel (HOD)",
    reminder: "15 min before",
    people: [
      {
        id: "np",
        name: "Nina Patel",
        initials: "NP",
        avatarColor: "#ddd6fe",
      },
      {
        id: "tb",
        name: "Tunde Balogun",
        initials: "TB",
        avatarColor: "#bfdbfe",
      },
      {
        id: "or",
        name: "Omar Reyes",
        initials: "OR",
        avatarColor: "#bbf7d0",
      },
    ],
    agenda: ["Sprint retro", "Roadmap"],
  },
  {
    id: "2",
    title: "Weekly leadership sync",
    date: "2026-08-03",
    when: "Today",
    time: "3:00 PM",
    duration: "60m",
    location: "Boardroom A",
    virtual: true,
    attendees: 3,
    audience: "For Admin",
    organiser: "David Okoye (Admin)",
    virtualLink: "https://meet.afresh.co/leadership",
    reminder: "15 min before",
    people: [
      {
        id: "do",
        name: "David Okoye",
        initials: "DO",
        avatarColor: "#fed7aa",
      },
      {
        id: "gb",
        name: "Grace Bello",
        initials: "GB",
        avatarColor: "#a5f3fc",
      },
      {
        id: "rk",
        name: "Ravi Kapoor",
        initials: "RK",
        avatarColor: "#bbf7d0",
      },
    ],
    agenda: ["Leadership updates", "Risks and blockers"],
  },
  {
    id: "3",
    title: "Finance close prep",
    date: "2026-08-05",
    when: "In 2 days",
    time: "10:00 AM",
    duration: "90m",
    location: "",
    virtual: true,
    attendees: 2,
    audience: "For Admin",
    organiser: "David Okoye (Admin)",
    virtualLink: "https://meet.afresh.co/finance-close",
    reminder: "60 min before",
    people: [
      {
        id: "rk",
        name: "Ravi Kapoor",
        initials: "RK",
        avatarColor: "#bbf7d0",
      },
      {
        id: "do",
        name: "David Okoye",
        initials: "DO",
        avatarColor: "#fed7aa",
      },
    ],
    agenda: ["Month-end checklist"],
  },
  {
    id: "4",
    title: "Media team planning",
    date: "2026-08-07",
    when: "In 4 days",
    time: "2:00 PM",
    duration: "60m",
    location: "Studio",
    virtual: false,
    attendees: 2,
    audience: "For HOD",
    organiser: "Lena Fisher (HOD)",
    reminder: "15 min before",
    people: [
      {
        id: "lf",
        name: "Lena Fisher",
        initials: "LF",
        avatarColor: "#fecdd3",
      },
      {
        id: "gb",
        name: "Grace Bello",
        initials: "GB",
        avatarColor: "#a5f3fc",
      },
    ],
    agenda: ["Shoot calendar", "Asset handoff"],
  },
];

export const overdueTasks: ManagementTask[] = [
  {
    id: "1",
    title: "Circulate meeting minutes",
    audience: "For Admin",
    overdue: "2 days ago",
  },
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

export const boardTasks: BoardTask[] = [
  {
    id: "1",
    title: "Circulate meeting minutes",
    description: "Send last week's leadership minutes to attendees.",
    priority: "Medium",
    audience: "For Admin",
    owner: "Grace Bello",
    column: "Open",
    due: "Overdue · 2 days ago",
    overdue: true,
  },
  {
    id: "2",
    title: "Book boardroom for review",
    description: "Reserve Boardroom A for the engineering review.",
    priority: "Medium",
    audience: "For HOD",
    owner: "Grace Bello",
    column: "Open",
    due: "Due Tomorrow",
  },
  {
    id: "3",
    title: "Collect agenda items",
    description: "Gather agenda items from HODs for next sync.",
    priority: "Low",
    audience: "For Admin",
    owner: "Grace Bello",
    column: "Open",
    due: "Due in 2 days",
  },
  {
    id: "4",
    title: "Prepare board pack",
    description: "Compile Q3 board pack for the leadership sync.",
    priority: "High",
    audience: "For Admin",
    owner: "Grace Bello",
    column: "Done",
    due: "Due Yesterday",
  },
  {
    id: "5",
    title: "Confirm catering",
    description: "Confirm catering for the finance close prep.",
    priority: "Low",
    audience: "For Admin",
    owner: "Grace Bello",
    column: "Done",
    due: "Due in 3 days",
  },
];

export const upcomingReminders: SecretaryReminder[] = [
  {
    id: "1",
    title: "Send board pack to Admin",
    detail: "Due this morning",
    due: true,
  },
  {
    id: "2",
    title: "Finance close prep tomorrow",
    detail: "Prep notes before 10:00 AM",
  },
  {
    id: "3",
    title: "Follow up on Lena's mailbox",
    detail: "Waiting on mail server retry",
  },
];

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

export const managedReminders: ManagedReminder[] = [
  {
    id: "1",
    title: "Leadership sync starts in 30 min",
    date: "2026-08-03",
    time: "2:30 PM",
    when: "Today",
    dateLabel: "Aug 3, 2026",
    channel: "Both",
    link: "Weekly leadership sync",
    linkHref: "/secretary/meetings/2",
    due: true,
  },
  {
    id: "2",
    title: "Send board pack to Admin",
    date: "2026-08-03",
    time: "4:00 PM",
    when: "Today",
    dateLabel: "Aug 3, 2026",
    channel: "In-app",
    link: "Prepare board pack",
    linkHref: "/secretary/tasks",
    due: true,
  },
  {
    id: "3",
    title: "Finance close prep tomorrow",
    date: "2026-08-04",
    time: "9:00 AM",
    when: "Tomorrow",
    dateLabel: "Aug 4, 2026",
    channel: "Email",
    link: "Finance close prep",
    linkHref: "/secretary/meetings/3",
  },
  {
    id: "4",
    title: "Follow up on Lena's mailbox deactivation",
    date: "2026-08-04",
    time: "12:00 PM",
    when: "Tomorrow",
    dateLabel: "Aug 4, 2026",
    channel: "In-app",
  },
];

export const managementCalendar: CalendarGroup[] = [
  {
    id: "today",
    label: "Today",
    items: [
      {
        id: "1",
        date: "Aug 3",
        title: "Engineering department review",
        time: "11:30 AM",
      },
      {
        id: "2",
        date: "Aug 3",
        title: "Weekly leadership sync",
        time: "3:00 PM",
      },
    ],
  },
  {
    id: "two-days",
    label: "In 2 days",
    items: [
      {
        id: "3",
        date: "Aug 5",
        title: "Finance close prep",
        time: "10:00 AM",
      },
    ],
  },
  {
    id: "four-days",
    label: "In 4 days",
    items: [
      {
        id: "4",
        date: "Aug 7",
        title: "Media team planning",
        time: "2:00 PM",
      },
    ],
  },
];

export const emailRequestStats: EmailRequestStat[] = [
  {
    id: "pending",
    value: "1",
    label: "Pending requests",
    tag: "Action",
    tone: "action",
    filter: "Pending",
  },
  {
    id: "failed",
    value: "1",
    label: "Failed creations",
    tag: "Retry",
    tone: "action",
    filter: "Failed",
  },
  {
    id: "created",
    value: "2",
    label: "Created",
    tag: "Done",
    tone: "muted",
    filter: "Created",
  },
  {
    id: "total",
    value: "4",
    label: "Total requests",
    tag: "All time",
    tone: "soft",
    filter: "All",
  },
];

export const emailRequestFilters: EmailRequestFilter[] = [
  "Pending",
  "Failed",
  "Created",
  "Cancelled",
  "All",
];

export const emailQueueRequests: EmailQueueRequest[] = [
  {
    id: "1",
    requestId: "EM-1042",
    name: "Sara Ahmed",
    initials: "SA",
    avatarColor: "#fed7aa",
    role: "Product Designer",
    department: "Software Engineers",
    email: "sara.ahmed@afresh.co",
    status: "Created",
    requestedBy: "Amara Nwosu",
    requestedByRole: "HR",
    requestedAt: "Aug 3, 2026 - 8:20 AM",
    hrNote: "New hire — starts this week, needs access for onboarding.",
  },
  {
    id: "2",
    requestId: "EM-1043",
    name: "Daniel Okafor",
    initials: "DK",
    avatarColor: "#bfdbfe",
    role: "Marketing Associate",
    department: "Media / Photography",
    email: "daniel.okafor@afresh.co",
    status: "Pending",
    requestedBy: "Amara Nwosu",
    requestedByRole: "HR",
    requestedAt: "Aug 3, 2026 - 9:04 AM",
    hrNote: "Needs a mailbox before the media planning session this week.",
  },
  {
    id: "3",
    requestId: "EM-1041",
    name: "Ife Adeyemi",
    initials: "IA",
    avatarColor: "#fecdd3",
    role: "Design Intern",
    department: "Software Engineers",
    email: "ife.adeyemi@afresh.co",
    status: "Failed",
    requestedBy: "Tunde Bakare",
    requestedByRole: "HR",
    requestedAt: "Aug 2, 2026 - 4:11 PM",
    hrNote: "Mailbox provisioning timed out on the mail server.",
  },
  {
    id: "4",
    requestId: "EM-1039",
    name: "Yusuf Bello",
    initials: "YB",
    avatarColor: "#bbf7d0",
    role: "IT Support",
    department: "IT & Operations",
    email: "yusuf.bello@afresh.co",
    status: "Created",
    requestedBy: "Amara Nwosu",
    requestedByRole: "HR",
    requestedAt: "Aug 1, 2026 - 11:40 AM",
    hrNote: "Mailbox created and assigned for operations onboarding.",
  },
];

export const recentlyCreatedEmails: CreatedEmail[] = [
  {
    id: "1",
    name: "Yusuf Bello",
    initials: "YB",
    avatarColor: "#bbf7d0",
    email: "yusuf.bello@afresh.co",
    status: "active",
  },
  {
    id: "2",
    name: "Kola Martins",
    initials: "KM",
    avatarColor: "#fde68a",
    email: "kola.martins@afresh.co",
    status: "active",
  },
  {
    id: "3",
    name: "Lena Okoro",
    initials: "LO",
    avatarColor: "#ddd6fe",
    email: "lena.okoro@afresh.co",
    status: "pending",
  },
  {
    id: "4",
    name: "Amara Diallo",
    initials: "AD",
    avatarColor: "#a5f3fc",
    email: "amara.diallo@afresh.co",
    status: "active",
  },
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

export const directoryStats: DirectoryStat[] = [
  {
    id: "active",
    value: "5",
    label: "Active mailboxes",
    tag: "Live",
    tone: "action",
    filter: "Active",
  },
  {
    id: "suspended",
    value: "1",
    label: "Suspended",
    tag: "On hold",
    tone: "soft",
    filter: "Suspended",
  },
  {
    id: "pending",
    value: "1",
    label: "Awaiting deactivation",
    tag: "Pending",
    tone: "muted",
    filter: "Deactivation Pending",
  },
  {
    id: "total",
    value: "8",
    label: "Total mailboxes",
    tag: "Directory",
    tone: "soft",
    filter: "All",
  },
];

export const directoryFilters: MailboxFilter[] = [
  "All",
  "Active",
  "Suspended",
  "Deactivation Pending",
  "Deactivated",
];

export const directoryMailboxes: DirectoryMailbox[] = [
  {
    id: "1",
    name: "Sara Ahmed",
    initials: "SA",
    avatarColor: "#fed7aa",
    email: "sara.ahmed@afresh.co",
    department: "Software Engineers",
    storage: "0.0 GB",
    since: "Aug 3, 2026",
    status: "Deactivated",
  },
  {
    id: "2",
    name: "Tunde Balogun",
    initials: "TB",
    avatarColor: "#bfdbfe",
    email: "tunde.balogun@afresh.co",
    department: "Software Engineers",
    storage: "2.1 GB",
    since: "Jun 9, 2025",
    status: "Active",
  },
  {
    id: "3",
    name: "Nina Patel",
    initials: "NP",
    avatarColor: "#ddd6fe",
    email: "nina.patel@afresh.co",
    department: "Software Engineers",
    storage: "4.8 GB",
    since: "Feb 15, 2024",
    status: "Active",
  },
  {
    id: "4",
    name: "Ravi Kapoor",
    initials: "RK",
    avatarColor: "#bbf7d0",
    email: "ravi.kapoor@afresh.co",
    department: "Finance",
    storage: "3.2 GB",
    since: "Mar 11, 2025",
    status: "Active",
  },
  {
    id: "5",
    name: "Yusuf Bello",
    initials: "YB",
    avatarColor: "#fde68a",
    email: "yusuf.bello@afresh.co",
    department: "IT & Operations",
    storage: "0.1 GB",
    since: "Jul 31, 2026",
    status: "Active",
  },
  {
    id: "6",
    name: "Lena Fisher",
    initials: "LF",
    avatarColor: "#fecdd3",
    email: "lena.fisher@afresh.co",
    department: "Media / Photography",
    storage: "5.5 GB",
    since: "Aug 13, 2024",
    status: "Deactivation Pending",
  },
  {
    id: "7",
    name: "Kola Martins",
    initials: "KM",
    avatarColor: "#fed7aa",
    email: "kola.martins@afresh.co",
    department: "Administration",
    storage: "1.4 GB",
    since: "Nov 16, 2025",
    status: "Suspended",
  },
  {
    id: "8",
    name: "Grace Bello",
    initials: "GB",
    avatarColor: "#a5f3fc",
    email: "grace.bello@afresh.co",
    department: "Administration",
    storage: "2.9 GB",
    since: "Dec 11, 2024",
    status: "Active",
  },
];
