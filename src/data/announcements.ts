export type AnnouncementFilter = "All" | "Unread" | "Pinned";
export type AnnouncementCategory = "All" | "Finance" | "General" | "Urgent" | "HR";

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
};

export const announcementStats = [
  { id: "emails", label: "Emails", value: "2", badge: "New" },
  { id: "viewed", label: "Viewed", value: "2", badge: "Archive" },
  { id: "month", label: "Total This Month", value: "5", badge: "All time" },
  { id: "recipients", label: "Recipients", value: "1,248", badge: "In total" },
];

export const announcements: Announcement[] = [
  {
    id: "1",
    initials: "JC",
    title: "July payroll processing update",
    source: "Finance Dept",
    date: "Today",
    body: "The July 2023 payroll run will be processed on Tuesday 25th. All outstanding timesheets must be approved by 5 PM today. Please contact the Finance team for any queries.",
    tags: [
      { label: "Finance", tone: "finance" },
      { label: "Urgent", tone: "urgent" },
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
    date: "Jul 30",
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
    date: "Jul 28",
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
    date: "Jul 26",
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
