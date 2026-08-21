export type MeetingFilter = "Upcoming" | "Completed" | "Company-wide" | "All";

export type MeetingTag = "Upcoming" | "Company-wide" | "Completed";

export type Meeting = {
  id: string;
  day: number;
  title: string;
  tags: MeetingTag[];
  time: string;
  duration: string;
  location: string;
  attendees: number;
  category: MeetingFilter;
};

export const meetingStats = [
  { id: "today", label: "Today's meeting", value: "3" },
  { id: "week", label: "This week", value: "5" },
  { id: "company", label: "Company-wide", value: "1" },
] as const;

export const meetingFilters: MeetingFilter[] = [
  "Upcoming",
  "Completed",
  "Company-wide",
  "All",
];

export const meetings: Meeting[] = [
  {
    id: "1",
    day: 28,
    title: "Executive briefing",
    tags: ["Upcoming"],
    time: "10:00 AM",
    duration: "1h 30m",
    location: "Boardroom 4",
    attendees: 3,
    category: "Upcoming",
  },
  {
    id: "2",
    day: 28,
    title: "Design team weekly sync",
    tags: ["Upcoming"],
    time: "11:30 AM",
    duration: "30m",
    location: "Meeting Room 3",
    attendees: 3,
    category: "Upcoming",
  },
  {
    id: "3",
    day: 29,
    title: "HR leave review",
    tags: ["Upcoming"],
    time: "2:30 PM",
    duration: "45m",
    location: "Virtual (Google Meet)",
    attendees: 2,
    category: "Upcoming",
  },
  {
    id: "4",
    day: 5,
    title: "All-hands company meeting",
    tags: ["Upcoming", "Company-wide"],
    time: "10:00 AM",
    duration: "1h",
    location: "Virtual (Google Meet)",
    attendees: 0,
    category: "Company-wide",
  },
];
