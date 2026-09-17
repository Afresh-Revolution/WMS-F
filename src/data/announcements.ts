export type AnnouncementFilter = "All" | "Drafts" | "Pinned" | "Unread";
export type AnnouncementCategory = "All" | "HR" | "Finance" | "General" | "Urgent";

export type AnnouncementTagTone = "finance" | "urgent" | "hr" | "general" | "pinned";

export type Announcement = {
  id: string;
  initials: string;
  title: string;
  source: string;
  date: string;
  body: string;
  tags: { label: string; tone: AnnouncementTagTone }[];
  pinned: boolean;
  unread: boolean;
  category: Exclude<AnnouncementCategory, "All">;
  status?: string;
  priority?: string;
  code?: string;
};

export const announcementStats = [
  { id: "unread", label: "Unread", value: "2", badge: "New" },
  { id: "pinned", label: "Pinned", value: "2", badge: "Active" },
  { id: "month", label: "Total This Month", value: "5", badge: "Jul 2026" },
  { id: "recipients", label: "Recipients", value: "1,248", badge: "All staff" },
];

export const announcements: Announcement[] = [
  {
    id: "1",
    initials: "FD",
    title: "July payroll processing update",
    source: "Finance Dept",
    date: "Today",
    body: "The July 2026 payroll run will be processed on Tuesday 28th. All outstanding timesheets must be approved by 5 PM today. Please contact the Finance team for any queries.",
    tags: [
      { label: "Finance", tone: "finance" },
      { label: "Pinned", tone: "pinned" },
    ],
    pinned: true,
    unread: true,
    category: "Finance",
  },
  {
    id: "2",
    initials: "HR",
    title: "Updated leave policy — effective August 1",
    source: "HR Team",
    date: "Jul 26",
    body: "The revised leave policy takes effect August 1. Department leads should brief their teams and update outstanding leave requests before the cutoff.",
    tags: [
      { label: "HR", tone: "hr" },
      { label: "Pinned", tone: "pinned" },
    ],
    pinned: true,
    unread: false,
    category: "HR",
  },
  {
    id: "3",
    initials: "MC",
    title: "All-hands meeting — August 5",
    source: "Maya Chen",
    date: "Jul 25",
    body: "Company all-hands will be held on August 5. HODs should confirm attendance and share department talking points by Friday.",
    tags: [{ label: "General", tone: "general" }],
    pinned: false,
    unread: false,
    category: "General",
  },
  {
    id: "4",
    initials: "IT",
    title: "Network maintenance — Saturday night",
    source: "IT Operations",
    date: "Jul 24",
    body: "Core network maintenance is scheduled for Saturday night. Expect brief downtime between 11 PM and 2 AM. Critical systems will remain on backup.",
    tags: [{ label: "Urgent", tone: "urgent" }],
    pinned: false,
    unread: true,
    category: "Urgent",
  },
  {
    id: "5",
    initials: "HR",
    title: "New employee assistance programme",
    source: "HR Team",
    date: "Jul 22",
    body: "A new employee assistance programme is now available. Details have been shared with HODs and will be posted on the staff portal.",
    tags: [{ label: "HR", tone: "hr" }],
    pinned: false,
    unread: false,
    category: "HR",
  },
];
