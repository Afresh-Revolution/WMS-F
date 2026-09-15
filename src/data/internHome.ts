export type InternAccountId = "nysc" | "intern";

export type InternTaskStatus =
  | "In Progress"
  | "Overdue"
  | "Not Started"
  | "In Review";

export type InternTask = {
  id: string;
  title: string;
  meta: string;
  status: InternTaskStatus;
};

export type InternMeeting = {
  id: string;
  title: string;
  details: string;
};

export type InternMilestone = {
  id: string;
  label: string;
  done: boolean;
};

export type InternAnnouncement = {
  id: string;
  title: string;
  meta: string;
};

export type InternNotification = {
  id: string;
  message: string;
  unread: boolean;
};

export type InternStat = {
  id: string;
  value: string;
  label: string;
  hint: string;
};

export type InternProgressMeter = {
  id: string;
  label: string;
  value: number;
};

export type InternAccount = {
  id: InternAccountId;
  name: string;
  firstName: string;
  initials: string;
  sidebarRole: string;
  switcherLabel: string;
  typeLabel: string;
  track: string;
  roleLine: string;
  location: string;
  institution: string;
  course: string;
  startDate: string;
  endDate: string;
  daysToExit: number;
  elapsedPercent: number;
  stats: InternStat[];
  tasks: InternTask[];
  meetings: InternMeeting[];
  progress: InternProgressMeter[];
  milestones: InternMilestone[];
  announcements: InternAnnouncement[];
  notifications: InternNotification[];
};

export const internAccounts: InternAccount[] = [
  {
    id: "nysc",
    name: "Chidi Eze",
    firstName: "Chidi",
    initials: "CE",
    sidebarRole: "NYSC / Intern",
    switcherLabel: "Chidi Eze (NYSC)",
    typeLabel: "NYSC MEMBER",
    track: "MEDIA / PHOTOGRAPHY",
    roleLine: "NYSC Corps Member · Covenant University",
    location: "Mass Communication",
    institution: "Covenant University",
    course: "Mass Communication",
    startDate: "3 Nov 2025",
    endDate: "30 Oct 2026",
    daysToExit: 81,
    elapsedPercent: 78,
    stats: [
      { id: "profile", value: "100%", label: "profile completion", hint: "Complete" },
      { id: "exit", value: "81", label: "days to exit", hint: "78% elapsed" },
      { id: "tasks", value: "4", label: "assigned tasks", hint: "Currently open" },
      { id: "overdue", value: "1", label: "overdue tasks", hint: "Needs attention" },
    ],
    tasks: [
      {
        id: "1",
        title: "Edit product launch photo set",
        meta: "Ngozi Umeh · Due 12 Aug",
        status: "In Progress",
      },
      {
        id: "2",
        title: "Submit weekly activity log",
        meta: "Ngozi Umeh · Due 10 Aug",
        status: "Overdue",
      },
      {
        id: "3",
        title: "Draft social captions — August",
        meta: "Ngozi Umeh · Due 18 Aug",
        status: "Not Started",
      },
      {
        id: "4",
        title: "Shoot team headshots",
        meta: "Ngozi Umeh · Due 22 Aug",
        status: "In Review",
      },
    ],
    meetings: [
      {
        id: "1",
        title: "Media team weekly sync",
        details: "11 Aug · 10:00 AM · Studio A",
      },
      {
        id: "2",
        title: "Supervisor 1:1 check-in",
        details: "13 Aug · 2:00 PM · Meeting Room 2",
      },
      {
        id: "3",
        title: "All-hands company meeting",
        details: "14 Aug · 10:00 AM · Main Hall / Google Meet",
      },
    ],
    progress: [
      { id: "elapsed", label: "Placement elapsed", value: 78 },
      { id: "tasks", label: "Tasks completed", value: 20 },
      { id: "profile", label: "Profile completion", value: 100 },
    ],
    milestones: [
      { id: "1", label: "Complete onboarding profile", done: true },
      { id: "2", label: "Submit first weekly log", done: true },
      { id: "3", label: "Lead a full photo shoot", done: false },
    ],
    announcements: [
      {
        id: "1",
        title: "All-hands company meeting — 14 Aug",
        meta: "Media / Photography · 8 Aug",
      },
      {
        id: "2",
        title: "Studio booking window for August",
        meta: "Media / Photography · 6 Aug",
      },
      {
        id: "3",
        title: "Weekly activity log reminder",
        meta: "HR · 5 Aug",
      },
    ],
    notifications: [
      {
        id: "1",
        message: "New task assigned: photo edit batch",
        unread: true,
      },
      {
        id: "2",
        message: "Weekly check-in scheduled for 13 Aug",
        unread: false,
      },
    ],
  },
  {
    id: "intern",
    name: "Amara Okoye",
    firstName: "Amara",
    initials: "AO",
    sidebarRole: "Intern",
    switcherLabel: "Amara Okoye (Intern)",
    typeLabel: "INTERN",
    track: "MEDIA / PHOTOGRAPHY",
    roleLine: "Intern · University of Lagos",
    location: "Mass Communication",
    institution: "University of Lagos",
    course: "Mass Communication",
    startDate: "12 Jan 2026",
    endDate: "11 Jul 2026",
    daysToExit: 54,
    elapsedPercent: 62,
    stats: [
      { id: "profile", value: "85%", label: "profile completion", hint: "In progress" },
      { id: "exit", value: "54", label: "days to exit", hint: "62% elapsed" },
      { id: "tasks", value: "3", label: "assigned tasks", hint: "Currently open" },
      { id: "overdue", value: "0", label: "overdue tasks", hint: "On track" },
    ],
    tasks: [
      {
        id: "1",
        title: "Caption batch for summer campaign",
        meta: "Ngozi Umeh · Due 19 Aug",
        status: "In Progress",
      },
      {
        id: "2",
        title: "Intern weekly reflection",
        meta: "Ngozi Umeh · Due 15 Aug",
        status: "Not Started",
      },
      {
        id: "3",
        title: "Assist with studio lighting setup",
        meta: "Ngozi Umeh · Due 21 Aug",
        status: "In Review",
      },
    ],
    meetings: [
      {
        id: "1",
        title: "Intern cohort standup",
        details: "12 Aug · 9:30 AM · Studio B",
      },
      {
        id: "2",
        title: "Supervisor 1:1 check-in",
        details: "13 Aug · 2:00 PM · Meeting Room 2",
      },
      {
        id: "3",
        title: "All-hands company meeting",
        details: "14 Aug · 10:00 AM · Main Hall / Google Meet",
      },
    ],
    progress: [
      { id: "elapsed", label: "Placement elapsed", value: 62 },
      { id: "tasks", label: "Tasks completed", value: 40 },
      { id: "profile", label: "Profile completion", value: 85 },
    ],
    milestones: [
      { id: "1", label: "Complete onboarding profile", done: true },
      { id: "2", label: "Attend intern orientation", done: true },
      { id: "3", label: "Publish first caption set", done: false },
    ],
    announcements: [
      {
        id: "1",
        title: "All-hands company meeting — 14 Aug",
        meta: "Media / Photography · 8 Aug",
      },
      {
        id: "2",
        title: "Intern showcase briefing",
        meta: "HR · 7 Aug",
      },
      {
        id: "3",
        title: "Weekly activity log reminder",
        meta: "HR · 5 Aug",
      },
    ],
    notifications: [
      {
        id: "1",
        message: "Caption review requested by Ngozi",
        unread: true,
      },
      {
        id: "2",
        message: "Intern standup moved to Studio B",
        unread: false,
      },
    ],
  },
];

export const internAnnouncementBadge = 1;
export const internNotificationBadge = 3;
