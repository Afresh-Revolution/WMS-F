export type EventFilter = "All" | "Upcoming" | "Sponsorship" | "Completed";

export type EventTagTone =
  | "internal"
  | "external"
  | "company"
  | "upcoming"
  | "completed"
  | "sponsorship";

export type EventItem = {
  id: string;
  title: string;
  tags: { label: string; tone: EventTagTone }[];
  date: string;
  audience: string;
  description: string;
  category: Exclude<EventFilter, "All">;
  sentToHods: boolean;
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
  Sponsorship: [
    {
      id: "total",
      label: "Total Sponsorships",
      value: "2",
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
    audience: "Fashion, Media photography",
    description:
      "Walkthrough of the Q3 collection for department leads. Share fitting notes, shoot priorities, and launch-day staffing with your teams.",
    category: "Upcoming",
    sentToHods: true,
  },
  {
    id: "2",
    title: "Afresh Annual Staff Retreat",
    tags: [
      { label: "Company wide", tone: "company" },
      { label: "Upcoming", tone: "upcoming" },
    ],
    date: "Sept 12–15, 2026",
    audience: "All departments",
    description:
      "Four-day company retreat covering strategy, team bonding, and department showcases. Travel and lodging details cascade through HODs first.",
    category: "Upcoming",
    sentToHods: true,
  },
  {
    id: "s1",
    title: "Q3 Fashion Collection Launch",
    tags: [
      { label: "Internal", tone: "internal" },
      { label: "Upcoming", tone: "upcoming" },
    ],
    date: "Aug 5, 2026",
    audience: "Fashion, Media photography",
    description:
      "Launch event for Q3 fashion collection. All Fashion and Media HODs required.",
    category: "Sponsorship",
    sentToHods: true,
  },
  {
    id: "s2",
    title: "Afresh Annual Staff Retreat",
    tags: [
      { label: "Company-wide", tone: "company" },
      { label: "Upcoming", tone: "upcoming" },
    ],
    date: "Dec 17–18, 2026",
    audience: "All departments",
    description:
      "Two-day annual retreat. Venue: Transcorp Hilton, Abuja.",
    category: "Sponsorship",
    sentToHods: true,
  },
  {
    id: "3",
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
    sentToHods: true,
  },
];
