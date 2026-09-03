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
    time: "11:30am",
    audience: "For HOD",
    location: "Room 2",
  },
  {
    id: "2",
    title: "Weekly leadership sync",
    time: "3:00pm",
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

export const overdueTasks: ManagementTask[] = [
  {
    id: "1",
    title: "Circulate meeting minutes",
    audience: "For Admin",
    overdue: "2 days ago",
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
