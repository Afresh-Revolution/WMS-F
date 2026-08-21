export type EventFilter = "All" | "Upcoming" | "Sponsorship" | "Completed";

export type EventTagTone =
  | "internal"
  | "external"
  | "company"
  | "upcoming"
  | "completed"
  | "sponsorship"
  | "draft";

export type EventAction = "sent" | "send-now" | "none";

export type EventItem = {
  id: string;
  title: string;
  tags: { label: string; tone: EventTagTone }[];
  date: string;
  audience: string;
  description: string;
  category: Exclude<EventFilter, "All">;
  action: EventAction;
};

export type StatTone = "confirmed" | "draft" | "meta";

export type EventStat = {
  id: string;
  label: string;
  value: string;
  badge: string;
  badgeTone: StatTone;
};

export const statsByFilter: Record<EventFilter, EventStat[]> = {
  All: [
    {
      id: "upcoming",
      label: "Upcoming Events",
      value: "2",
      badge: "Confirmed",
      badgeTone: "confirmed",
    },
    {
      id: "draft",
      label: "Draft Events",
      value: "1",
      badge: "Not sent",
      badgeTone: "draft",
    },
    {
      id: "notified",
      label: "Total Notified Staff",
      value: "1248",
      badge: "This month",
      badgeTone: "meta",
    },
  ],
  Upcoming: [
    {
      id: "upcoming",
      label: "Upcoming Events",
      value: "2",
      badge: "Confirmed",
      badgeTone: "confirmed",
    },
    {
      id: "draft",
      label: "Draft Events",
      value: "0",
      badge: "Not sent",
      badgeTone: "draft",
    },
    {
      id: "notified",
      label: "Total Notified Staff",
      value: "1248",
      badge: "This month",
      badgeTone: "meta",
    },
  ],
  Sponsorship: [
    {
      id: "total",
      label: "Total Sponsorships",
      value: "1",
      badge: "Confirmed",
      badgeTone: "confirmed",
    },
    {
      id: "draft",
      label: "Draft Sponsors",
      value: "1",
      badge: "Not sent",
      badgeTone: "draft",
    },
    {
      id: "staff",
      label: "Total Sponsored Staff",
      value: "1248",
      badge: "This month",
      badgeTone: "meta",
    },
  ],
  Completed: [
    {
      id: "completed",
      label: "Completed Events",
      value: "1",
      badge: "Archived",
      badgeTone: "confirmed",
    },
    {
      id: "draft",
      label: "Draft Events",
      value: "0",
      badge: "Not sent",
      badgeTone: "draft",
    },
    {
      id: "notified",
      label: "Total Notified Staff",
      value: "1248",
      badge: "This month",
      badgeTone: "meta",
    },
  ],
};

export const events: EventItem[] = [
  {
    id: "1",
    title: "Q3 Fashion Collection Launch",
    tags: [
      { label: "Internal", tone: "internal" },
      { label: "Upcoming", tone: "upcoming" },
    ],
    date: "Aug 5, 2026",
    audience: "Fashion, Media/Photography",
    description:
      "Walkthrough of the Q3 collection for department leads. Share fitting notes, shoot priorities, and launch-day staffing with your teams.",
    category: "Upcoming",
    action: "sent",
  },
  {
    id: "2",
    title: "Afresh Annual Staff Retreat",
    tags: [
      { label: "Company-wide", tone: "company" },
      { label: "Upcoming", tone: "upcoming" },
    ],
    date: "Sept 12–15, 2026",
    audience: "All departments",
    description:
      "Four-day company retreat covering strategy, team bonding, and department showcases. Travel and lodging details cascade through HODs first.",
    category: "Upcoming",
    action: "none",
  },
  {
    id: "3",
    title: "Lagos Tech Innovation Expo Sponsorship",
    tags: [
      { label: "Sponsorship", tone: "sponsorship" },
      { label: "Draft", tone: "draft" },
    ],
    date: "Aug 22, 2026",
    audience: "Software Engineers, Hardware",
    description:
      "Afresh is sponsoring the Lagos Tech Innovation Expo. HODs to nominate team representatives and confirm attendance by Aug 10.",
    category: "Sponsorship",
    action: "send-now",
  },
  {
    id: "4",
    title: "Mid-Year Performance Review Week",
    tags: [
      { label: "Internal", tone: "internal" },
      { label: "Completed", tone: "completed" },
    ],
    date: "Jul 14–20, 2026",
    audience: "All departments",
    description:
      "Structured mid-year reviews across all departments. Calibration sessions and promotion shortlists were completed and filed.",
    category: "Completed",
    action: "sent",
  },
];
