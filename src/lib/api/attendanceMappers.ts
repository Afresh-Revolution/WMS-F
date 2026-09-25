import {
  avatarColor,
  initials,
  listFrom,
  mapEmployee,
  num,
  str,
} from "@/lib/api/mappers";
import type {
  AttendanceAuditLog,
  AttendanceCorrection,
  AttendanceCorrectionStatus,
  AttendanceEmployee,
  AttendanceException,
  AttendanceStat,
  AttendanceStatus,
  AttendanceWeekDay,
  DepartmentAttendance,
  PersonalAttendanceDay,
} from "@/data/attendance";
import { attendanceStats, defaultAttendancePolicy } from "@/data/attendance";

export function asAttendanceRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export function unwrapAttendanceData<T = unknown>(payload: unknown): T {
  if (payload == null) return {} as T;
  const root = asAttendanceRecord(payload);
  if ("data" in root) return (root.data ?? {}) as T;
  return payload as T;
}

const LIST_KEYS = [
  "items",
  "records",
  "results",
  "rows",
  "attendance",
  "history",
  "locations",
  "schedules",
] as const;

export function unwrapAttendanceList(payload: unknown): Record<string, unknown>[] {
  if (payload == null) return [];
  if (Array.isArray(payload)) return payload as Record<string, unknown>[];
  const data = unwrapAttendanceData(payload);
  if (Array.isArray(data)) return data as Record<string, unknown>[];
  const rec = asAttendanceRecord(data);
  for (const key of LIST_KEYS) {
    if (Array.isArray(rec[key])) return rec[key] as Record<string, unknown>[];
  }
  return listFrom(payload as never);
}

export function lagosWorkDate(date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Lagos",
  }).format(date);
}

export function formatLagosClock(value: unknown): string {
  const text = str(value);
  if (!text) return "—";
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Africa/Lagos",
  });
}

export function formatLagosDateLabel(value: unknown): string {
  const text = str(value);
  if (!text) return "";
  const date = text.includes("T") ? new Date(text) : new Date(`${text}T12:00:00Z`);
  if (Number.isNaN(date.getTime())) return text;
  const day = date.toLocaleDateString("en-GB", {
    day: "numeric",
    timeZone: "Africa/Lagos",
  });
  const month = date.toLocaleDateString("en-GB", {
    month: "short",
    timeZone: "Africa/Lagos",
  });
  const year = date.toLocaleDateString("en-GB", {
    year: "numeric",
    timeZone: "Africa/Lagos",
  });
  return `${day} ${month === "Sep" ? "Sept" : month} ${year}`;
}

export function formatLagosWeekday(value: unknown): string {
  const text = str(value);
  if (!text) return "";
  const date = text.includes("T") ? new Date(text) : new Date(`${text}T12:00:00Z`);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    timeZone: "Africa/Lagos",
  });
}

function nestedName(record: Record<string, unknown>, key: string): string {
  const nested = record[key];
  if (typeof nested === "string") return nested;
  const rec = asAttendanceRecord(nested);
  return str(rec.fullName ?? rec.name ?? rec.title ?? rec.email);
}

export function mapGpsStatus(value: unknown): AttendanceStatus {
  const normalized = str(value).toLowerCase().replace(/\s+/g, "_");
  if (normalized.includes("not_clock") || normalized.includes("notclocked")) {
    return "Not Clocked In";
  }
  if (normalized === "late") return "Late";
  if (normalized === "on_leave" || normalized.includes("leave")) return "On Leave";
  if (normalized === "absent") return "Absent";
  if (normalized.includes("missing")) return "Missing Clock-Out";
  if (normalized.includes("early")) return "Early Departure";
  return "Present";
}

function durationBetween(checkInAt: string, checkOutAt: string): string {
  if (!checkInAt || !checkOutAt) return "—";
  const start = new Date(checkInAt).getTime();
  const end = new Date(checkOutAt).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return "—";
  const mins = Math.round((end - start) / 60000);
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

export type MappedAttendanceRecord = {
  id: string;
  employeeId: string;
  employeeName: string;
  role: string;
  department: string;
  workDate: string;
  checkInAt: string;
  checkOutAt: string;
  clockIn: string;
  clockOut: string;
  duration: string;
  status: AttendanceStatus;
  gpsStatus: string;
  locationName: string;
  notes: string;
};

export function mapAttendanceRecord(
  record: Record<string, unknown>,
): MappedAttendanceRecord {
  const employeeName = str(
    record.employeeName ?? nestedName(record, "employee") ?? record.name,
    "Employee",
  );
  const checkInAt = str(record.checkInAt ?? record.checkIn);
  const checkOutAt = str(record.checkOutAt ?? record.checkOut);
  const workDate = str(record.workDate ?? record.date, lagosWorkDate());
  return {
    id: str(record.id ?? record._id),
    employeeId: str(record.employeeId ?? record.employee_id),
    employeeName,
    role: str(
      record.role ??
        record.jobTitle ??
        record.scheduleName ??
        nestedName(record, "role"),
    ),
    department: str(
      record.departmentName ??
        record.department ??
        nestedName(record, "department"),
    ),
    workDate,
    checkInAt,
    checkOutAt,
    clockIn: formatLagosClock(checkInAt),
    clockOut: formatLagosClock(checkOutAt),
    duration: durationBetween(checkInAt, checkOutAt),
    status: mapGpsStatus(record.status),
    gpsStatus: str(record.status).toLowerCase(),
    locationName: str(record.locationName ?? nestedName(record, "location")),
    notes: str(record.notes ?? record.reason ?? record.detail),
  };
}

export function mergeCompanyRoster(
  employeesPayload: unknown,
  recordsPayload: unknown,
): AttendanceEmployee[] {
  const records = unwrapAttendanceList(recordsPayload).map(mapAttendanceRecord);
  const today = lagosWorkDate();
  const todayByEmployee = new Map<string, MappedAttendanceRecord>();
  for (const record of records) {
    if (record.workDate !== today) continue;
    const key = record.employeeId || record.employeeName.toLowerCase();
    todayByEmployee.set(key, record);
  }

  const employeeRows = unwrapAttendanceList(employeesPayload);
  if (employeesPayload != null) {
    return employeeRows.map((row) => {
      const employee = mapEmployee(row);
      const match =
        todayByEmployee.get(employee.id) ??
        todayByEmployee.get(employee.name.toLowerCase());
      if (!match) {
        return {
          id: employee.id || employee.name,
          initials: employee.initials,
          name: employee.name,
          role: employee.title,
          department: employee.department,
          clockIn: "—",
          clockOut: "—",
          duration: "—",
          status: employee.status === "On leave" ? "On Leave" : "Not Clocked In",
          avatarColor: employee.avatarColor,
        };
      }
      return {
        id: match.id || employee.id,
        initials: employee.initials,
        name: employee.name,
        role: employee.title || match.role,
        department: employee.department || match.department,
        clockIn: match.clockIn,
        clockOut: match.clockOut,
        duration: match.duration,
        status: employee.status === "On leave" ? "On Leave" : match.status,
        avatarColor: employee.avatarColor,
      };
    });
  }

  if (recordsPayload != null) {
    return records
      .filter((record) => record.workDate === today)
      .map((record) => ({
        id: record.id,
        initials: initials(record.employeeName),
        name: record.employeeName,
        role: record.role,
        department: record.department,
        clockIn: record.clockIn,
        clockOut: record.clockOut,
        duration: record.duration,
        status: record.status,
        avatarColor: avatarColor(record.id || record.employeeName),
      }));
  }

  return [];
}

export function buildDepartmentBreakdown(
  roster: AttendanceEmployee[],
): DepartmentAttendance[] {
  const groups = new Map<string, DepartmentAttendance>();
  for (const person of roster) {
    const name = person.department || "Unassigned";
    const current = groups.get(name) ?? {
      id: name.toLowerCase().replace(/\s+/g, "-"),
      name,
      expected: 0,
      present: 0,
      late: 0,
      absent: 0,
      onLeave: 0,
    };
    current.expected += 1;
    if (person.status === "Present") current.present += 1;
    if (person.status === "Late") current.late += 1;
    if (person.status === "Absent") current.absent += 1;
    if (person.status === "On Leave") current.onLeave += 1;
    groups.set(name, current);
  }
  return Array.from(groups.values());
}

export function buildAttendanceStats(
  roster: AttendanceEmployee[],
  summaryPayload: unknown,
): AttendanceStat[] {
  const present = roster.filter((person) => person.status === "Present").length;
  const late = roster.filter((person) => person.status === "Late").length;
  const notClocked = roster.filter(
    (person) => person.status === "Not Clocked In",
  ).length;
  const absent = roster.filter((person) => person.status === "Absent").length;
  const onLeave = roster.filter((person) => person.status === "On Leave").length;
  const missing = roster.filter(
    (person) => person.status === "Missing Clock-Out",
  ).length;
  const early = roster.filter(
    (person) => person.status === "Early Departure",
  ).length;
  const summary = asAttendanceRecord(unwrapAttendanceData(summaryPayload));

  return attendanceStats.map((stat) => {
    if (stat.id === "expected") return { ...stat, value: roster.length };
    if (stat.id === "present") {
      return { ...stat, value: num(summary.on_time, present) };
    }
    if (stat.id === "notClocked") return { ...stat, value: notClocked };
    if (stat.id === "late") return { ...stat, value: num(summary.late, late) };
    if (stat.id === "absent") return { ...stat, value: absent };
    if (stat.id === "onLeave") return { ...stat, value: onLeave };
    if (stat.id === "missing") return { ...stat, value: missing };
    if (stat.id === "early") return { ...stat, value: early };
    return stat;
  });
}

const EXCEPTION_STATUSES = new Set<AttendanceStatus>([
  "Late",
  "Absent",
  "Missing Clock-Out",
  "Early Departure",
]);

function exceptionDetail(record: MappedAttendanceRecord): string {
  if (record.notes) return record.notes;
  if (record.status === "Late") return "Late arrival";
  if (record.status === "Absent") return "Did not clock in";
  if (record.status === "Missing Clock-Out") return "No clock-out recorded";
  if (record.status === "Early Departure") return "Left before closing time";
  return "—";
}

export function mapRecordsToExceptions(
  recordsPayload: unknown,
): AttendanceException[] {
  return unwrapAttendanceList(recordsPayload)
    .map(mapAttendanceRecord)
    .filter((record) => EXCEPTION_STATUSES.has(record.status))
    .map((record) => ({
      id: record.id,
      name: record.employeeName,
      department: record.department,
      dateLabel: formatLagosDateLabel(record.workDate || record.checkInAt),
      weekday: formatLagosWeekday(record.workDate || record.checkInAt),
      clockIn: record.clockIn,
      clockOut: record.clockOut,
      detail: exceptionDetail(record),
      status: record.status as AttendanceException["status"],
    }));
}

export function mapCorrectionStatus(
  value: unknown,
): AttendanceCorrectionStatus | null {
  const normalized = str(value).toLowerCase().replace(/[_-]+/g, " ");
  if (!normalized) return null;
  if (normalized.includes("reject")) return "Rejected";
  if (
    normalized.includes("implement") ||
    normalized.includes("applied") ||
    normalized === "approved"
  ) {
    return "Implemented";
  }
  if (normalized.includes("admin") || normalized.includes("await")) {
    return "Awaiting Admin Approval";
  }
  if (
    normalized.includes("hr") ||
    normalized.includes("review") ||
    normalized.includes("pending")
  ) {
    return "Under HR Review";
  }
  return null;
}

export function mapRecordsToCorrections(
  recordsPayload: unknown,
): AttendanceCorrection[] {
  return unwrapAttendanceList(recordsPayload).flatMap((row, index) => {
    const correction = asAttendanceRecord(
      row.correction ?? row.correctionRequest ?? row.request,
    );
    const hasCorrection =
      Object.keys(correction).length > 0 ||
      row.correctionStatus != null ||
      row.correctionId != null ||
      str(row.type).toLowerCase().includes("correct");
    if (!hasCorrection) return [];

    const record = mapAttendanceRecord(row);
    const status =
      mapCorrectionStatus(
        correction.status ??
          row.correctionStatus ??
          row.requestStatus ??
          correction.state,
      ) ?? "Under HR Review";
    const reference = str(
      correction.reference ??
        correction.code ??
        row.correctionId ??
        correction.id,
      record.id ? `AC-${record.id.slice(-4).toUpperCase()}` : `AC-${index + 1}`,
    );
    const change = str(
      correction.change ??
        correction.requestedChange ??
        correction.summary ??
        record.notes,
      "—",
    );

    return [
      {
        id: str(
          correction.id ?? row.correctionId ?? record.id,
          `correction-${index}`,
        ),
        reference,
        name: record.employeeName,
        issue: str(
          correction.issue ?? correction.reason ?? record.status,
          record.status,
        ),
        status,
        dateLabel: formatLagosDateLabel(
          correction.date ?? (record.workDate || record.checkInAt),
        ),
        change,
        department: record.department,
        note: str(
          correction.note ??
            correction.notes ??
            correction.comment ??
            record.notes,
        ),
      },
    ];
  });
}

export type AttendanceReportRow = {
  id: string;
  date: string;
  employee: string;
  department: string;
  role: string;
  clockIn: string;
  clockOut: string;
  duration: string;
  detail: string;
  status: AttendanceStatus;
};

export function mapRecordsToReportRows(
  recordsPayload: unknown,
): AttendanceReportRow[] {
  return unwrapAttendanceList(recordsPayload).map((row) => {
    const record = mapAttendanceRecord(row);
    return {
      id: record.id,
      date: formatLagosDateLabel(record.workDate || record.checkInAt),
      employee: record.employeeName,
      department: record.department,
      role: record.role,
      clockIn: record.clockIn,
      clockOut: record.clockOut,
      duration: record.duration,
      detail: record.notes || "—",
      status: record.status,
    };
  });
}

export function mapAuditToAttendanceLogs(
  payload: unknown,
): AttendanceAuditLog[] {
  return unwrapAttendanceList(payload).map((row, index) => {
    const created = str(row.createdAt ?? row.timestamp ?? row.occurredAt);
    const date = created ? new Date(created) : null;
    const whenDate = date
      ? `${date.getDate()} ${date.toLocaleString("en-GB", { month: "short" })},`
      : "—";
    const whenTime = date
      ? date.toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
          timeZone: "Africa/Lagos",
        })
      : "";
    const previous = str(
      row.previous ?? row.oldValue ?? asAttendanceRecord(row.changes).from,
      "—",
    );
    const next = str(
      row.next ?? row.newValue ?? asAttendanceRecord(row.changes).to,
      "—",
    );
    return {
      id: str(row.id ?? row._id, `audit-${index}`),
      whenDate,
      whenTime,
      actor: str(row.actor ?? row.user ?? row.performedBy, "System"),
      action: str(row.action ?? row.event, "Attendance updated"),
      target: str(row.target ?? row.resource ?? row.entity, "—"),
      previous: previous || "—",
      next: next || "—",
      reason: str(row.reason ?? row.notes ?? row.summary),
    };
  });
}

export function liveAuditLogsOrFallback(payload: unknown): AttendanceAuditLog[] {
  return mapAuditToAttendanceLogs(payload);
}

export type MappedAttendanceSchedule = {
  id: string;
  name: string;
  openingTime: string;
  lateAfterTime: string;
  closingTime: string;
  daysOfWeek: number[];
  locationIds: string[];
  departmentId: string;
  timezone: string;
  active: boolean;
};

export function mapAttendanceSchedule(
  record: Record<string, unknown>,
): MappedAttendanceSchedule {
  const days = Array.isArray(record.daysOfWeek)
    ? record.daysOfWeek.map((day) => num(day))
    : defaultAttendancePolicy.workingDays.map((day) =>
        ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(day),
      );
  return {
    id: str(record.id ?? record._id),
    name: str(record.name, "Office schedule"),
    openingTime: str(record.openingTime, defaultAttendancePolicy.clockIn),
    lateAfterTime: str(record.lateAfterTime, "09:30"),
    closingTime: str(record.closingTime, defaultAttendancePolicy.clockOut),
    daysOfWeek: days,
    locationIds: Array.isArray(record.locationIds)
      ? record.locationIds.map((id) => str(id))
      : [],
    departmentId: str(record.departmentId ?? asAttendanceRecord(record.department).id),
    timezone: str(record.timezone, "Africa/Lagos"),
    active: record.active !== false,
  };
}

export function firstSchedule(
  payload: unknown,
): MappedAttendanceSchedule | null {
  const rows = unwrapAttendanceList(payload).map(mapAttendanceSchedule);
  return rows.find((row) => row.active) ?? rows[0] ?? null;
}

export function workingDaysFromNumbers(days: number[]): AttendanceWeekDay[] {
  const labels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
  return days
    .map((day) => labels[day])
    .filter((day): day is AttendanceWeekDay => Boolean(day));
}

export function numbersFromWorkingDays(days: AttendanceWeekDay[]): number[] {
  const labels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return days
    .map((day) => labels.indexOf(day))
    .filter((index) => index >= 0);
}

export function addMinutesToTime(hhmm: string, minutes: number): string {
  const [hours, mins] = hhmm.split(":").map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(mins)) return hhmm;
  const total = ((hours * 60 + mins + minutes) % (24 * 60) + 24 * 60) % (24 * 60);
  const nextHours = Math.floor(total / 60);
  const nextMins = total % 60;
  return `${String(nextHours).padStart(2, "0")}:${String(nextMins).padStart(2, "0")}`;
}

export function graceFromSchedule(schedule: MappedAttendanceSchedule): number {
  const [openH, openM] = schedule.openingTime.split(":").map(Number);
  const [lateH, lateM] = schedule.lateAfterTime.split(":").map(Number);
  if (![openH, openM, lateH, lateM].every((value) => Number.isFinite(value))) {
    return defaultAttendancePolicy.graceMinutes;
  }
  return Math.max(0, lateH * 60 + lateM - (openH * 60 + openM));
}

export type MappedAttendanceLocation = {
  id: string;
  name: string;
  address: string;
  radiusMeters: number;
  active: boolean;
  latitude?: number;
  longitude?: number;
  departmentId: string;
  timezone: string;
};

export function mapAttendanceLocation(
  record: Record<string, unknown>,
): MappedAttendanceLocation {
  const latitude =
    record.latitude == null ? undefined : num(record.latitude, Number.NaN);
  const longitude =
    record.longitude == null ? undefined : num(record.longitude, Number.NaN);
  return {
    id: str(record.id ?? record._id),
    name: str(record.name, "Location"),
    address: str(record.address ?? record.description),
    radiusMeters: num(record.radiusMeters, 3000),
    active: record.active !== false,
    latitude: Number.isFinite(latitude) ? latitude : undefined,
    longitude: Number.isFinite(longitude) ? longitude : undefined,
    departmentId: str(
      record.departmentId ?? asAttendanceRecord(record.department).id,
    ),
    timezone: str(record.timezone, "Africa/Lagos"),
  };
}

export function mapCheckInWindow(payload: unknown) {
  const data = asAttendanceRecord(unwrapAttendanceData(payload));
  const schedules = Array.isArray(data.schedules)
    ? (data.schedules as Record<string, unknown>[])
    : [];
  const first = asAttendanceRecord(schedules[0]);
  const window = asAttendanceRecord(first.window);
  return {
    canCheckIn: Boolean(data.canCheckIn ?? first.canCheckIn),
    alreadyCheckedIn: Boolean(
      first.alreadyCheckedIn ??
        data.alreadyCheckedIn ??
        data.checkedIn ??
        data.isCheckedIn ??
        data.clockedIn,
    ),
    reason: str(first.reason ?? window.reason, "OPEN"),
    openingTime: str(window.openingTime, defaultAttendancePolicy.clockIn),
    closingTime: str(window.closingTime, defaultAttendancePolicy.clockOut),
    locationName: str(
      asAttendanceRecord(
        Array.isArray(first.locations) ? first.locations[0] : first.locations,
      ).name,
      "Assigned location",
    ),
    serverTime: str(data.serverTime),
    scheduleId: str(asAttendanceRecord(first.schedule).id),
    locationId: str(
      asAttendanceRecord(
        Array.isArray(first.locations) ? first.locations[0] : first.locations,
      ).id,
    ),
    status: mapGpsStatus(data.status ?? first.status ?? data.todayStatus),
    checkInAt: str(
      data.checkInAt ??
        data.clockInAt ??
        data.clockedInAt ??
        data.checkIn ??
        data.clockIn ??
        first.checkInAt ??
        first.clockInAt ??
        first.checkIn ??
        first.clockIn,
    ),
    checkOutAt: str(
      data.checkOutAt ??
        data.clockOutAt ??
        data.clockedOutAt ??
        data.checkOut ??
        data.clockOut ??
        first.checkOutAt ??
        first.clockOut,
    ),
  };
}

export function formatExpectedClock(value: string) {
  const text = str(value).trim();
  if (!text) return "8:00 AM";
  if (/am|pm/i.test(text)) return text.replace(/^0/, "");
  const match = text.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return text;
  const hour = Number(match[1]);
  const minutes = match[2];
  const period = hour >= 12 ? "PM" : "AM";
  const twelve = hour % 12 || 12;
  return `${twelve}:${minutes} ${period}`;
}

export function mapPersonalHistory(payload: unknown): PersonalAttendanceDay[] {
  return unwrapAttendanceList(payload).map((record, index) => {
    const mapped = mapAttendanceRecord(record);
    const lateMinutes = num(
      record.lateMinutes ?? record.lateByMinutes ?? record.minutesLate,
    );
    const lateLabel =
      mapped.status === "Late"
        ? `Late by ${lateMinutes || 1} minute${lateMinutes === 1 ? "" : "s"}`
        : "";
    return {
      id: mapped.id || String(index),
      dateLabel: formatLagosDateLabel(mapped.workDate),
      weekday: formatLagosWeekday(mapped.workDate),
      clockIn: mapped.clockIn,
      clockOut: mapped.clockOut,
      duration: mapped.duration,
      status: mapped.status,
      lateLabel,
    };
  });
}
