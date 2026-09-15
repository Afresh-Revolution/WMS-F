export type NyscAccountId = "chidi" | "amara";

export type NyscTaskStatus =
  | "In Progress"
  | "Overdue"
  | "Not Started"
  | "In Review"
  | "Completed";

export type NyscTaskPriority = "High" | "Medium" | "Low";

export type NyscTaskFilter =
  | "All"
  | "In Progress"
  | "In Review"
  | "Overdue"
  | "Completed";

export type NyscTask = {
  id: string;
  title: string;
  assignee: string;
  due: string;
  dueMeta?: string;
  status: NyscTaskStatus;
  priority: NyscTaskPriority;
  description: string;
  progress: number;
};

export type NyscMeeting = {
  id: string;
  title: string;
  when: string;
  duration: string;
  location: string;
  organiser: string;
  relative: string;
};

export type NyscMilestone = {
  id: string;
  label: string;
  done: boolean;
  target: string;
};

export type NyscProgressNoteKind = "Praise" | "Action" | "Note";

export type NyscProgressNote = {
  id: string;
  author: string;
  kind: NyscProgressNoteKind;
  body: string;
  date: string;
};

export type NyscAnnouncement = {
  id: string;
  title: string;
  source: string;
  date: string;
  body: string;
  author: string;
  featured?: boolean;
};

export type NyscNotification = {
  id: string;
  text: string;
  featured?: boolean;
  unread?: boolean;
};

export type NyscStat = {
  id: string;
  value: string;
  label: string;
  meta: string;
  chip?: boolean;
};

export type NyscProfile = {
  roleTitle: string;
  status: string;
  department: string;
  supervisor: string;
  companyEmail: string;
  personalEmail: string;
  phone: string;
  emergencyName: string;
  emergencyPhone: string;
  address: string;
};

export type NyscAccount = {
  id: NyscAccountId;
  firstName: string;
  name: string;
  initials: string;
  type: "NYSC" | "Intern";
  sidebarRole: string;
  eyebrow: string;
  titleLine: string;
  course: string;
  institution: string;
  startDate: string;
  endDate: string;
  daysToExit: number;
  dateRange: string;
  profile: NyscProfile;
  stats: NyscStat[];
  tasks: NyscTask[];
  meetings: NyscMeeting[];
  progress: {
    placementElapsed: number;
    tasksCompleted: number;
    profileCompletion: number;
  };
  milestones: NyscMilestone[];
  progressNotes: NyscProgressNote[];
  announcements: NyscAnnouncement[];
  notifications: NyscNotification[];
  unreadNotifications: number;
};

export const nyscAccounts: Record<NyscAccountId, NyscAccount> = {
  chidi: {
    id: "chidi",
    firstName: "Chidi",
    name: "Chidi Eze",
    initials: "CE",
    type: "NYSC",
    sidebarRole: "NYSC / Intern",
    eyebrow: "NYSC Member  ·  Media / Photography",
    titleLine: "NYSC Corps Member · Covenant University",
    course: "Mass Communication",
    institution: "Covenant University",
    startDate: "3 Nov 2025",
    endDate: "30 Oct 2026",
    daysToExit: 81,
    dateRange: "3 Nov 2025 → 30 Oct 2026",
    profile: {
      roleTitle: "NYSC Corps Member",
      status: "Active placement",
      department: "Media / Photography",
      supervisor: "Ngozi Umeh (Media Lead)",
      companyEmail: "chidi.eze@afresh.co",
      personalEmail: "chidi.eze@gmail.com",
      phone: "+234 802 118 4477",
      emergencyName: "Ada Eze",
      emergencyPhone: "+234 803 552 9010",
      address: "14 Adeola Odeku St, Victoria Island, Lagos",
    },
    stats: [
      {
        id: "profile",
        value: "100%",
        label: "profile completion",
        meta: "Complete",
      },
      {
        id: "exit",
        value: "81",
        label: "days to exit",
        meta: "78% elapsed",
      },
      {
        id: "tasks",
        value: "4",
        label: "assigned tasks",
        meta: "Currently open",
      },
      {
        id: "role",
        value: "1",
        label: "role",
        meta: "Prototype: NYSC / Intern",
        chip: true,
      },
    ],
    tasks: [
      {
        id: "t1",
        title: "Edit product launch photo set",
        assignee: "Ngozi Umeh",
        due: "Due 12 Aug",
        dueMeta: "2d left",
        status: "In Progress",
        priority: "High",
        description:
          "Retouch and export the 24-image launch gallery for the marketing team.",
        progress: 38,
      },
      {
        id: "t2",
        title: "Submit weekly activity log",
        assignee: "People Team",
        due: "Due 8 Aug",
        dueMeta: "2d overdue",
        status: "Overdue",
        priority: "Medium",
        description: "Log this week's tasks and hours in the placement tracker.",
        progress: 18,
      },
      {
        id: "t3",
        title: "Draft social captions — August",
        assignee: "Ngozi Umeh",
        due: "Due 16 Aug",
        dueMeta: "8d left",
        status: "Not Started",
        priority: "Medium",
        description:
          "Write caption drafts for the month's scheduled posts.",
        progress: 0,
      },
      {
        id: "t5",
        title: "Complete orientation modules",
        assignee: "People Team",
        due: "Due 31 Jul",
        status: "Completed",
        priority: "Low",
        description:
          "Finish the remaining onboarding and safety modules.",
        progress: 100,
      },
      {
        id: "t4",
        title: "Shoot team headshots",
        assignee: "Ngozi Umeh",
        due: "Due 20 Aug",
        dueMeta: "10d left",
        status: "In Review",
        priority: "High",
        description:
          "Coordinate and capture updated headshots for four new joiners.",
        progress: 62,
      },
    ],
    meetings: [
      {
        id: "m1",
        title: "Media team weekly sync",
        when: "11 Aug · 10:00 AM",
        duration: "45 min",
        location: "Studio A",
        organiser: "Ngozi Umeh",
        relative: "in 1d",
      },
      {
        id: "m2",
        title: "Supervisor 1:1 check-in",
        when: "13 Aug · 2:00 PM",
        duration: "30 min",
        location: "Meeting Room 2",
        organiser: "Ngozi Umeh",
        relative: "in 3d",
      },
      {
        id: "m3",
        title: "All-hands company meeting",
        when: "14 Aug · 10:00 AM",
        duration: "60 min",
        location: "Main Hall / Google Meet",
        organiser: "Grace Bello",
        relative: "in 4d",
      },
    ],
    progress: {
      placementElapsed: 78,
      tasksCompleted: 20,
      profileCompletion: 100,
    },
    milestones: [
      {
        id: "ms1",
        label: "Complete onboarding & orientation",
        done: true,
        target: "31 Jul 2026",
      },
      {
        id: "ms2",
        label: "First-month evaluation passed",
        done: true,
        target: "5 Dec 2026",
      },
      {
        id: "ms3",
        label: "Lead a full photo shoot independently",
        done: false,
        target: "15 Sept 2026",
      },
      {
        id: "ms4",
        label: "Mid-placement review",
        done: false,
        target: "15 May 2026",
      },
      {
        id: "ms5",
        label: "Final placement report & clearance",
        done: false,
        target: "25 Oct 2026",
      },
    ],
    progressNotes: [
      {
        id: "pn1",
        author: "Ngozi Umeh",
        kind: "Praise",
        body: "Strong improvement in photo editing turnaround — keep it up. Your colour grading is much more consistent now.",
        date: "6 Aug 2026",
      },
      {
        id: "pn2",
        author: "Ngozi Umeh",
        kind: "Action",
        body: "Please prioritise submitting the weekly activity log on time; it feeds your monthly evaluation.",
        date: "22 Jul 2026",
      },
      {
        id: "pn3",
        author: "People Team",
        kind: "Note",
        body: "Orientation completed. Settling in well with the creative team.",
        date: "8 Jul 2026",
      },
    ],
    announcements: [
      {
        id: "a1",
        title: "All-hands company meeting — 14 Aug",
        source: "Company",
        date: "8 Aug 2026",
        body: "Company-wide town hall at 10:00 AM in the main hall and on Google Meet. Trainees are welcome to attend.",
        author: "Grace Bello, Secretary",
        featured: true,
      },
      {
        id: "a2",
        title: "Monthly placement progress form due 28 Aug",
        source: "HR",
        date: "5 Aug 2026",
        body: "All NYSC members and interns should submit their monthly progress form to their supervisor before month end.",
        author: "People Team",
      },
      {
        id: "a3",
        title: "Design & Media review session",
        source: "Department",
        date: "3 Aug 2026",
        body: "Portfolio review for the creative team on Friday. Bring your latest work in progress.",
        author: "Department Lead",
      },
    ],
    notifications: [
      {
        id: "n1",
        text: "New task assigned: photo edit batch.",
        featured: true,
      },
      {
        id: "n2",
        text: "Weekly check-in scheduled for Thursday.",
      },
    ],
    unreadNotifications: 1,
  },
  amara: {
    id: "amara",
    firstName: "Amara",
    name: "Amara Okoye",
    initials: "AO",
    type: "Intern",
    sidebarRole: "NYSC / Intern",
    eyebrow: "Intern  ·  Product / Design",
    titleLine: "Product Design Intern · University of Lagos",
    course: "Industrial Design",
    institution: "University of Lagos",
    startDate: "2 Jun 2026",
    endDate: "29 Aug 2026",
    daysToExit: 18,
    dateRange: "2 Jun 2026 → 29 Aug 2026",
    profile: {
      roleTitle: "Product Design Intern",
      status: "Active placement",
      department: "Product / Design",
      supervisor: "Tunde Bakare (Design Lead)",
      companyEmail: "amara.okoye@afresh.co",
      personalEmail: "amara.okoye@gmail.com",
      phone: "+234 803 441 2290",
      emergencyName: "Chioma Okoye",
      emergencyPhone: "+234 802 667 1188",
      address: "8 Admiralty Way, Lekki Phase 1, Lagos",
    },
    stats: [
      {
        id: "profile",
        value: "86%",
        label: "profile completion",
        meta: "In progress",
      },
      {
        id: "exit",
        value: "18",
        label: "days to exit",
        meta: "80% elapsed",
      },
      {
        id: "tasks",
        value: "3",
        label: "assigned tasks",
        meta: "Currently open",
      },
      {
        id: "role",
        value: "1",
        label: "role",
        meta: "Prototype: NYSC / Intern",
        chip: true,
      },
    ],
    tasks: [
      {
        id: "t1",
        title: "Update internship case study deck",
        assignee: "Tunde Bakare",
        due: "Due 14 Aug",
        dueMeta: "4d left",
        status: "In Progress",
        priority: "High",
        description:
          "Refresh the intern case study with this week's product screens and learnings.",
        progress: 44,
      },
      {
        id: "t2",
        title: "Log weekly hours",
        assignee: "People Team",
        due: "Due 9 Aug",
        dueMeta: "1d overdue",
        status: "Overdue",
        priority: "Medium",
        description: "Submit this week's hours in the placement tracker.",
        progress: 12,
      },
      {
        id: "t3",
        title: "Prepare end-of-placement handover",
        assignee: "Tunde Bakare",
        due: "Due 22 Aug",
        dueMeta: "12d left",
        status: "Not Started",
        priority: "Medium",
        description:
          "Draft the handover note covering files, Figma links, and open questions.",
        progress: 0,
      },
      {
        id: "t4",
        title: "Complete intern onboarding checklist",
        assignee: "People Team",
        due: "Due 20 Jun",
        status: "Completed",
        priority: "Low",
        description: "Finish tools access, handbook, and first-week orientation.",
        progress: 100,
      },
      {
        id: "t5",
        title: "Design critique follow-ups",
        assignee: "Tunde Bakare",
        due: "Due 18 Aug",
        dueMeta: "8d left",
        status: "In Review",
        priority: "High",
        description: "Apply critique notes to the internship case study deck.",
        progress: 70,
      },
    ],
    meetings: [
      {
        id: "m1",
        title: "Design critique",
        when: "12 Aug · 11:00 AM",
        duration: "45 min",
        location: "Studio B",
        organiser: "Tunde Bakare",
        relative: "in 2d",
      },
      {
        id: "m2",
        title: "Mentor check-in",
        when: "13 Aug · 3:00 PM",
        duration: "30 min",
        location: "Meeting Room 1",
        organiser: "Tunde Bakare",
        relative: "in 3d",
      },
      {
        id: "m3",
        title: "Intern showcase briefing",
        when: "15 Aug · 10:00 AM",
        duration: "60 min",
        location: "Main Hall / Google Meet",
        organiser: "Grace Bello",
        relative: "in 5d",
      },
    ],
    progress: {
      placementElapsed: 80,
      tasksCompleted: 45,
      profileCompletion: 86,
    },
    milestones: [
      {
        id: "ms1",
        label: "Complete intern onboarding checklist",
        done: true,
        target: "20 Jun 2026",
      },
      {
        id: "ms2",
        label: "Mid-placement review submitted",
        done: true,
        target: "15 Jul 2026",
      },
      {
        id: "ms3",
        label: "Case study deck delivered",
        done: false,
        target: "22 Aug 2026",
      },
      {
        id: "ms4",
        label: "Intern showcase presentation",
        done: false,
        target: "26 Aug 2026",
      },
      {
        id: "ms5",
        label: "Exit clearance & handover",
        done: false,
        target: "29 Aug 2026",
      },
    ],
    progressNotes: [
      {
        id: "pn1",
        author: "Tunde Bakare",
        kind: "Praise",
        body: "Strong progress on the case study deck — keep documenting design decisions in the intern log.",
        date: "8 Aug 2026",
      },
      {
        id: "pn2",
        author: "Tunde Bakare",
        kind: "Action",
        body: "Please log weekly hours on time before Friday standup; it feeds your mid-placement review.",
        date: "24 Jul 2026",
      },
      {
        id: "pn3",
        author: "People Team",
        kind: "Note",
        body: "Onboarding completed. Settling in well with the design team.",
        date: "20 Jun 2026",
      },
    ],
    announcements: [
      {
        id: "a1",
        title: "Intern showcase — 26 Aug",
        source: "Company",
        date: "10 Aug 2026",
        body: "Interns present their placement work in the main hall. Supervisors and the People Team will attend.",
        author: "Grace Bello, Secretary",
        featured: true,
      },
      {
        id: "a2",
        title: "Exit clearance form now available",
        source: "HR",
        date: "7 Aug 2026",
        body: "Complete your intern exit clearance with your supervisor before your last day.",
        author: "People Team",
      },
      {
        id: "a3",
        title: "Design critique session",
        source: "Department",
        date: "3 Aug 2026",
        body: "Weekly critique for the product design team. Bring latest screens and open questions.",
        author: "Department Lead",
      },
    ],
    notifications: [
      {
        id: "n1",
        text: "Mentor requested your weekly log.",
        featured: true,
      },
      {
        id: "n2",
        text: "Intern showcase brief was shared.",
      },
    ],
    unreadNotifications: 1,
  },
};

export const nyscAccountList: NyscAccount[] = [
  nyscAccounts.chidi,
  nyscAccounts.amara,
];

export const nyscTaskFilters: NyscTaskFilter[] = [
  "All",
  "In Progress",
  "In Review",
  "Overdue",
  "Completed",
];
