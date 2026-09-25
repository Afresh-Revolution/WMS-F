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
  { id: "expected", label: "Expected", value: 0, tone: "warning" },
  { id: "onLeave", label: "On leave", value: 0, tone: "muted" },
  { id: "present", label: "Present", value: 0, tone: "present" },
  { id: "late", label: "Late", value: 0, tone: "warning" },
  { id: "absent", label: "Absent", value: 0, tone: "danger" },
  { id: "notClocked", label: "Not clocked in", value: 0, tone: "warning" },
  { id: "missing", label: "Missing clock-out", value: 0, tone: "danger" },
  { id: "early", label: "Early departures", value: 0, tone: "warning" },
];

export const attendanceExceptionFilters: AttendanceExceptionFilter[] = [
  "All",
  "Late",
  "Absent",
  "Missing Clock-Out",
  "Early Departure",
];

export const attendanceCorrectionFilters: AttendanceCorrectionFilter[] = [
  "All",
  "Under HR Review",
  "Awaiting Admin Approval",
  "Implemented",
  "Rejected",
];

export const attendanceReportTypes = [
  "Daily attendance",
  "Late arrivals",
  "Absences",
  "Missing clock-outs",
  "Early departures",
] as const;

export type AttendanceReportType = (typeof attendanceReportTypes)[number];

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

export type PersonalAttendanceDay = {
  id: string;
  workDate: string;
  dateLabel: string;
  weekday: string;
  clockIn: string;
  clockOut: string;
  duration: string;
  status: AttendanceStatus;
  lateLabel: string;
};

export type PersonalAttendanceStat = {
  id: string;
  label: string;
  value: number;
  hint: string;
};
