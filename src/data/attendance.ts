export type AttendanceStatus =
  | "Not Clocked In"
  | "Present"
  | "Late"
  | "Absent"
  | "On Leave"
  | "Missing Clock-Out"
  | "Early Departure";

export type AttendanceFilter = "All statuses" | AttendanceStatus;

export type AttendanceSection =
  | "company"
  | "exceptions"
  | "corrections"
  | "reports"
  | "settings"
  | "audit-logs";

export type AttendanceExceptionStatus =
  | "Late"
  | "Absent"
  | "Missing Clock-Out"
  | "Early Departure";

export type AttendanceExceptionFilter = "All" | AttendanceExceptionStatus;

export type AttendanceException = {
  id: string;
  name: string;
  department: string;
  dateLabel: string;
  weekday: string;
  clockIn: string;
  clockOut: string;
  detail: string;
  status: AttendanceExceptionStatus;
};

export type AttendanceCorrectionStatus =
  | "Under HR Review"
  | "Awaiting Admin Approval"
  | "Implemented"
  | "Rejected";

export type AttendanceCorrectionFilter = "All" | AttendanceCorrectionStatus;

export type AttendanceCorrection = {
  id: string;
  reference: string;
  name: string;
  issue: string;
  status: AttendanceCorrectionStatus;
  dateLabel: string;
  change: string;
  department: string;
  note: string;
};

export type AttendanceStatTone = "default" | "present" | "warning" | "danger" | "muted";

export type AttendanceStat = {
  id: string;
  label: string;
  value: number;
  tone: AttendanceStatTone;
};

export type DepartmentAttendance = {
  id: string;
  name: string;
  expected: number;
  present: number;
  late: number;
  absent: number;
  onLeave: number;
};

export type AttendanceEmployee = {
  id: string;
  initials: string;
  name: string;
  role: string;
  department: string;
  clockIn: string;
  clockOut: string;
  duration: string;
  status: AttendanceStatus;
  avatarColor: string;
};

export const attendanceFilters: AttendanceFilter[] = [
  "All statuses",
  "Not Clocked In",
  "Present",
  "Late",
  "Absent",
  "On Leave",
  "Missing Clock-Out",
  "Early Departure",
];

export const attendanceStats: AttendanceStat[] = [
  { id: "expected", label: "Expected today", value: 20, tone: "default" },
  { id: "present", label: "Present", value: 0, tone: "present" },
  { id: "notClocked", label: "Not yet clocked in", value: 20, tone: "warning" },
  { id: "late", label: "Late", value: 0, tone: "warning" },
  { id: "absent", label: "Absent", value: 0, tone: "danger" },
  { id: "onLeave", label: "On leave", value: 0, tone: "muted" },
  { id: "missing", label: "Missing clock-out", value: 0, tone: "danger" },
  { id: "early", label: "Early departures", value: 0, tone: "warning" },
];

export const departmentAttendance: DepartmentAttendance[] = [
  { id: "it", name: "IT & Operations", expected: 1, present: 0, late: 0, absent: 0, onLeave: 0 },
  { id: "mgmt", name: "Management", expected: 1, present: 0, late: 0, absent: 0, onLeave: 0 },
  { id: "hr-dept", name: "Human Resources", expected: 1, present: 0, late: 0, absent: 0, onLeave: 0 },
  { id: "fin", name: "Finance", expected: 1, present: 0, late: 0, absent: 0, onLeave: 0 },
  { id: "admin", name: "Administration", expected: 1, present: 0, late: 0, absent: 0, onLeave: 0 },
  { id: "swe", name: "Software Engineers", expected: 5, present: 0, late: 0, absent: 0, onLeave: 0 },
  { id: "hw", name: "Hardware", expected: 2, present: 0, late: 0, absent: 0, onLeave: 0 },
  { id: "model", name: "Model", expected: 2, present: 0, late: 0, absent: 0, onLeave: 0 },
  { id: "media", name: "Media / Photography", expected: 3, present: 0, late: 0, absent: 0, onLeave: 0 },
  { id: "fashion", name: "Fashion", expected: 2, present: 0, late: 0, absent: 0, onLeave: 0 },
  { id: "hr", name: "HR", expected: 1, present: 0, late: 0, absent: 0, onLeave: 0 },
];

const unsetClock = {
  clockIn: "—",
  clockOut: "—",
  duration: "—",
  status: "Not Clocked In" as const,
};

export const attendanceEmployees: AttendanceEmployee[] = [
  {
    id: "1",
    initials: "MC",
    name: "Maya Chen",
    role: "System Administrator",
    department: "IT & Operations",
    avatarColor: "#fecdd3",
    ...unsetClock,
  },
  {
    id: "2",
    initials: "DO",
    name: "David Okoye",
    role: "Company Administrator",
    department: "Management",
    avatarColor: "#fde68a",
    ...unsetClock,
  },
  {
    id: "3",
    initials: "AN",
    name: "Amara Nwosu",
    role: "HR Manager",
    department: "Human Resources",
    avatarColor: "#fed7aa",
    ...unsetClock,
  },
  {
    id: "4",
    initials: "RK",
    name: "Ravi Kapoor",
    role: "Senior Accountant",
    department: "Finance",
    avatarColor: "#bfdbfe",
    ...unsetClock,
  },
  {
    id: "5",
    initials: "GB",
    name: "Grace Bello",
    role: "Executive Secretary",
    department: "Administration",
    avatarColor: "#fed7aa",
    ...unsetClock,
  },
  {
    id: "6",
    initials: "NP",
    name: "Nina Patel",
    role: "Head, Software Engineers",
    department: "Software Engineers",
    avatarColor: "#fde68a",
    ...unsetClock,
  },
  {
    id: "7",
    initials: "TB",
    name: "Tunde Balogun",
    role: "Front End Developer",
    department: "Software Engineers",
    avatarColor: "#fed7aa",
    ...unsetClock,
  },
  {
    id: "8",
    initials: "OR",
    name: "Omar Reyes",
    role: "Back End Developer",
    department: "Software Engineers",
    avatarColor: "#fed7aa",
    ...unsetClock,
  },
  {
    id: "9",
    initials: "GL",
    name: "Grace Lin",
    role: "Designer",
    department: "Software Engineers",
    avatarColor: "#fed7aa",
    ...unsetClock,
  },
  {
    id: "10",
    initials: "IS",
    name: "Ibrahim Sadiq",
    role: "Cybersecurity Analyst",
    department: "Software Engineers",
    avatarColor: "#fed7aa",
    ...unsetClock,
  },
  {
    id: "11",
    initials: "KA",
    name: "Kunle Adeyemi",
    role: "Head, Hardware",
    department: "Hardware",
    avatarColor: "#fed7aa",
    ...unsetClock,
  },
  {
    id: "12",
    initials: "SC",
    name: "Sarah Cole",
    role: "Hardware Engineer",
    department: "Hardware",
    avatarColor: "#fed7aa",
    ...unsetClock,
  },
  {
    id: "13",
    initials: "ZY",
    name: "Zainab Yusuf",
    role: "Head, Model",
    department: "Model",
    avatarColor: "#fed7aa",
    ...unsetClock,
  },
  {
    id: "14",
    initials: "AB",
    name: "Aisha Bello",
    role: "Model",
    department: "Model",
    avatarColor: "#fed7aa",
    ...unsetClock,
  },
  {
    id: "15",
    initials: "TJ",
    name: "Tobi Johnson",
    role: "Head, Media / Photography",
    department: "Media / Photography",
    avatarColor: "#fed7aa",
    ...unsetClock,
  },
  {
    id: "16",
    initials: "CE",
    name: "Chidi Eze",
    role: "NYSC Corps Member",
    department: "Media / Photography",
    avatarColor: "#fed7aa",
    ...unsetClock,
  },
  {
    id: "17",
    initials: "BU",
    name: "Blessing Uche",
    role: "Photography Intern",
    department: "Media / Photography",
    avatarColor: "#fed7aa",
    ...unsetClock,
  },
  {
    id: "18",
    initials: "FS",
    name: "Fatima Sani",
    role: "Head, Fashion",
    department: "Fashion",
    avatarColor: "#fed7aa",
    ...unsetClock,
  },
  {
    id: "19",
    initials: "AO",
    name: "Ada Obi",
    role: "Fashion Designer",
    department: "Fashion",
    avatarColor: "#fed7aa",
    ...unsetClock,
  },
  {
    id: "20",
    initials: "PM",
    name: "Peter Musa",
    role: "HR Officer",
    department: "HR",
    avatarColor: "#fed7aa",
    ...unsetClock,
  },
];

export const attendanceExceptionFilters: AttendanceExceptionFilter[] = [
  "All",
  "Late",
  "Absent",
  "Missing Clock-Out",
  "Early Departure",
];

export const attendanceExceptions: AttendanceException[] = [
  {
    id: "ex-1",
    name: "David Okoye",
    department: "Management",
    dateLabel: "10 Sept 2026",
    weekday: "Thursday",
    clockIn: "8:43 AM",
    clockOut: "5:12 PM",
    detail: "Late by 28 minutes",
    status: "Late",
  },
  {
    id: "ex-2",
    name: "Ravi Kapoor",
    department: "Finance",
    dateLabel: "10 Sept 2026",
    weekday: "Thursday",
    clockIn: "8:53 AM",
    clockOut: "—",
    detail: "Late by 38 minutes",
    status: "Missing Clock-Out",
  },
  {
    id: "ex-3",
    name: "Tunde Balogun",
    department: "Software Engineers",
    dateLabel: "10 Sept 2026",
    weekday: "Thursday",
    clockIn: "7:58 AM",
    clockOut: "—",
    detail: "—",
    status: "Missing Clock-Out",
  },
  {
    id: "ex-4",
    name: "Omar Reyes",
    department: "Software Engineers",
    dateLabel: "10 Sept 2026",
    weekday: "Thursday",
    clockIn: "7:53 AM",
    clockOut: "4:05 PM",
    detail: "Left early by 55 minutes",
    status: "Early Departure",
  },
  {
    id: "ex-5",
    name: "Ibrahim Sadiq",
    department: "Software Engineers",
    dateLabel: "10 Sept 2026",
    weekday: "Thursday",
    clockIn: "8:40 AM",
    clockOut: "—",
    detail: "Late by 25 minutes",
    status: "Missing Clock-Out",
  },
  {
    id: "ex-6",
    name: "Zainab Yusuf",
    department: "Model",
    dateLabel: "10 Sept 2026",
    weekday: "Thursday",
    clockIn: "7:45 AM",
    clockOut: "4:32 PM",
    detail: "Left early by 28 minutes",
    status: "Early Departure",
  },
  {
    id: "ex-7",
    name: "Blessing Uche",
    department: "Media / Photography",
    dateLabel: "10 Sept 2026",
    weekday: "Thursday",
    clockIn: "—",
    clockOut: "—",
    detail: "—",
    status: "Absent",
  },
  {
    id: "ex-8",
    name: "Fatima Sani",
    department: "Fashion",
    dateLabel: "10 Sept 2026",
    weekday: "Thursday",
    clockIn: "8:25 AM",
    clockOut: "5:32 PM",
    detail: "Late by 10 minutes",
    status: "Late",
  },
  {
    id: "ex-9",
    name: "Peter Musa",
    department: "HR",
    dateLabel: "10 Sept 2026",
    weekday: "Thursday",
    clockIn: "7:47 AM",
    clockOut: "4:23 PM",
    detail: "Left early by 37 minutes",
    status: "Early Departure",
  },
  {
    id: "ex-10",
    name: "Maya Chen",
    department: "IT & Operations",
    dateLabel: "9 Sept 2026",
    weekday: "Wednesday",
    clockIn: "8:48 AM",
    clockOut: "5:04 PM",
    detail: "Late by 33 minutes",
    status: "Late",
  },
  {
    id: "ex-11",
    name: "Amara Nwosu",
    department: "Human Resources",
    dateLabel: "9 Sept 2026",
    weekday: "Wednesday",
    clockIn: "8:51 AM",
    clockOut: "5:15 PM",
    detail: "Late by 36 minutes",
    status: "Late",
  },
  {
    id: "ex-12",
    name: "Tunde Balogun",
    department: "Software Engineers",
    dateLabel: "9 Sept 2026",
    weekday: "Wednesday",
    clockIn: "8:28 AM",
    clockOut: "5:37 PM",
    detail: "Late by 13 minutes",
    status: "Late",
  },
  {
    id: "ex-13",
    name: "Kunle Adeyemi",
    department: "Hardware",
    dateLabel: "9 Sept 2026",
    weekday: "Wednesday",
    clockIn: "7:59 AM",
    clockOut: "—",
    detail: "—",
    status: "Missing Clock-Out",
  },
  {
    id: "ex-14",
    name: "Aisha Bello",
    department: "Model",
    dateLabel: "9 Sept 2026",
    weekday: "Wednesday",
    clockIn: "8:37 AM",
    clockOut: "5:34 PM",
    detail: "Late by 22 minutes",
    status: "Late",
  },
  {
    id: "ex-15",
    name: "Tobi Johnson",
    department: "Media / Photography",
    dateLabel: "9 Sept 2026",
    weekday: "Wednesday",
    clockIn: "7:55 AM",
    clockOut: "4:30 PM",
    detail: "Left early by 30 minutes",
    status: "Early Departure",
  },
];

export const attendanceCorrectionFilters: AttendanceCorrectionFilter[] = [
  "All",
  "Under HR Review",
  "Awaiting Admin Approval",
  "Implemented",
  "Rejected",
];

export const attendanceCorrections: AttendanceCorrection[] = [
  {
    id: "ac-2041",
    reference: "AC-2041",
    name: "Omar Reyes",
    issue: "Missing Clock-Out",
    status: "Under HR Review",
    dateLabel: "4 Sept 2026",
    change: "Clock-out → 5:20 PM",
    department: "Software Engineers",
    note: "Left the office but the terminal was already logged out — forgot to clock out.",
  },
  {
    id: "ac-2038",
    reference: "AC-2038",
    name: "Sarah Cole",
    issue: "Wrong Clock-In",
    status: "Awaiting Admin Approval",
    dateLabel: "2 Sept 2026",
    change: "Clock-in → 7:55 AM",
    department: "Hardware",
    note: "Clocked in on a colleague's device 20 minutes after actually arriving.",
  },
  {
    id: "ac-2033",
    reference: "AC-2033",
    name: "Ada Obi",
    issue: "Missing Clock-Out",
    status: "Implemented",
    dateLabel: "28 Aug 2026",
    change: "Clock-out → 5:05 PM",
    department: "Fashion",
    note: "System outage prevented clock-out at end of day.",
  },
];

export const attendanceReportTypes = [
  "Daily attendance",
  "Late arrivals",
  "Absences",
  "Missing clock-outs",
  "Early departures",
] as const;

export type AttendanceReportType = (typeof attendanceReportTypes)[number];

export const attendanceReportDepartments = [
  "All",
  ...Array.from(new Set(attendanceEmployees.map((person) => person.department))),
];

export const attendanceReportRoles = [
  "All",
  ...Array.from(new Set(attendanceEmployees.map((person) => person.role))),
];

export const attendanceWeekDays = [
  "Sun",
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
] as const;

export type AttendanceWeekDay = (typeof attendanceWeekDays)[number];

export const defaultAttendancePolicy = {
  clockIn: "08:00",
  clockOut: "17:00",
  expectedHours: 8,
  workingDays: ["Mon", "Tue", "Wed", "Thu", "Fri"] as AttendanceWeekDay[],
  graceMinutes: 15,
  earlyDepartureMinutes: 0,
  weekendRule: "Saturday & Sunday are non-working days.",
  holidayRule: "Configured public holidays are excluded from absence detection.",
  missingClockOut:
    "Flag as Missing Clock-Out; do not auto-generate a clock-out time.",
};

export type AttendanceAuditLog = {
  id: string;
  whenDate: string;
  whenTime: string;
  actor: string;
  action: string;
  target: string;
  previous: string;
  next: string;
  reason: string;
};

export const attendanceAuditLogs: AttendanceAuditLog[] = [
  {
    id: "log-1",
    whenDate: "29 Aug,",
    whenTime: "15:31",
    actor: "System",
    action: "Attendance corrected",
    target: "Ada Obi · Aug 28",
    previous: "Clock-out: —",
    next: "Clock-out: 5:05 PM",
    reason: "System outage confirmed with IT (AC-2033).",
  },
  {
    id: "log-2",
    whenDate: "29 Aug,",
    whenTime: "15:30",
    actor: "David Okoye",
    action: "Correction approved",
    target: "AC-2033",
    previous: "—",
    next: "—",
    reason: "Approved.",
  },
  {
    id: "log-3",
    whenDate: "1 Aug,",
    whenTime: "9:00",
    actor: "Maya Chen",
    action: "Attendance settings updated",
    target: "Grace period",
    previous: "10 minutes",
    next: "15 minutes",
    reason: "",
  },
];
