"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  BarChart3,
  Bell,
  Building2,
  ClipboardList,
  Clock,
  Download,
  Printer,
  Save,
  ScrollText,
  Search,
  Settings,
  SlidersHorizontal,
  TriangleAlert,
} from "lucide-react";
import { NotificationsLink, ProfileLink } from "@/components/layout/PageLinks";
import { AccountantStatusLine } from "@/components/accountant/AccountantStatusLine";
import { usePageActions } from "@/hooks/usePageActions";
import { useAttendanceMonitor } from "@/hooks/useAttendanceMonitor";
import { attendanceApi } from "@/lib/api";
import {
  addMinutesToTime,
  graceFromSchedule,
  numbersFromWorkingDays,
  workingDaysFromNumbers,
} from "@/lib/api/attendanceMappers";
import {
  attendanceCorrectionFilters,
  attendanceCorrections,
  attendanceExceptionFilters,
  attendanceFilters,
  attendanceReportTypes,
  attendanceWeekDays,
  defaultAttendancePolicy,
  type AttendanceCorrectionFilter,
  type AttendanceCorrectionStatus,
  type AttendanceExceptionFilter,
  type AttendanceExceptionStatus,
  type AttendanceFilter,
  type AttendanceReportType,
  type AttendanceSection,
  type AttendanceStatTone,
  type AttendanceStatus,
  type AttendanceWeekDay,
} from "@/data/attendance";
import styles from "./AttendancePage.module.css";

const tabs: {
  id: AttendanceSection;
  href: string;
  label: string;
  icon: typeof Building2;
}[] = [
  { id: "company", href: "/attendance", label: "Company Attendance", icon: Building2 },
  { id: "exceptions", href: "/attendance/exceptions", label: "Exceptions", icon: AlertTriangle },
  { id: "corrections", href: "/attendance/corrections", label: "Corrections", icon: ClipboardList },
  { id: "reports", href: "/attendance/reports", label: "Reports", icon: BarChart3 },
  { id: "settings", href: "/attendance/settings", label: "Settings", icon: Settings },
  { id: "audit-logs", href: "/attendance/audit-logs", label: "Audit Logs", icon: ScrollText },
];

const sectionCopy: Record<
  AttendanceSection,
  { title: string; subtitle: string }
> = {
  company: {
    title: "Company attendance",
    subtitle:
      "Company-wide attendance for {date}. Every active employee, HOD, HR, Accountant, Secretary and Admin is included.",
  },
  exceptions: {
    title: "Attendance exceptions",
    subtitle:
      "Late arrivals, absences, early departures and missing clock-outs that may need attention.",
  },
  corrections: {
    title: "Attendance corrections",
    subtitle:
      "Approve or reject correction requests. Approved corrections preserve the original values in the audit history.",
  },
  reports: {
    title: "Attendance reports",
    subtitle:
      "Generate, view, print and export attendance reports across the company.",
  },
  settings: {
    title: "Attendance settings",
    subtitle:
      "Configure the company attendance policy. These are prototype defaults — every value is configurable and each change is audited.",
  },
  "audit-logs": {
    title: "Attendance audit logs",
    subtitle:
      "Every administrative change to attendance — corrections, approvals and settings changes — with the previous and new values preserved.",
  },
};

const toneClass: Record<AttendanceStatTone, string> = {
  default: "",
  present: styles.tonePresent,
  warning: styles.toneWarning,
  danger: styles.toneDanger,
  muted: styles.toneMuted,
};

const correctionStatusClass: Record<AttendanceCorrectionStatus, string> = {
  "Under HR Review": `${styles.statusPill} ${styles.correctionHr}`,
  "Awaiting Admin Approval": `${styles.statusPill} ${styles.correctionAdmin}`,
  Implemented: `${styles.statusPill} ${styles.correctionImplemented}`,
  Rejected: `${styles.statusPill} ${styles.statusAbsent}`,
};

const statusClass: Record<AttendanceStatus, string> = {
  "Not Clocked In": styles.statusPill,
  Present: `${styles.statusPill} ${styles.statusPresent}`,
  Late: `${styles.statusPill} ${styles.statusLate}`,
  Absent: `${styles.statusPill} ${styles.statusAbsent}`,
  "On Leave": `${styles.statusPill} ${styles.statusLeave}`,
  "Missing Clock-Out": `${styles.statusPill} ${styles.statusMissing}`,
  "Early Departure": `${styles.statusPill} ${styles.statusEarly}`,
};

function formatLongDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatTopDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function ClockValue({ value }: { value: string }) {
  if (!value || value === "—") {
    return <span className={styles.muted}>—</span>;
  }

  const [time, period] = value.split(" ");
  return (
    <div className={styles.stackCell}>
      <span>{time}</span>
      {period ? <span className={styles.stackMuted}>{period}</span> : null}
    </div>
  );
}

const reportStatusByType: Record<
  Exclude<AttendanceReportType, "Daily attendance">,
  AttendanceExceptionStatus
> = {
  "Late arrivals": "Late",
  Absences: "Absent",
  "Missing clock-outs": "Missing Clock-Out",
  "Early departures": "Early Departure",
};

function formatGeneratedDate(date: Date) {
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sept",
    "Oct",
    "Nov",
    "Dec",
  ];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

function parseClockMinutes(value: string) {
  const match = value.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return null;
  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const period = match[3].toUpperCase();
  if (period === "PM" && hours !== 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;
  return hours * 60 + minutes;
}

function formatDuration(clockIn: string, clockOut: string) {
  const start = parseClockMinutes(clockIn);
  const end = parseClockMinutes(clockOut);
  if (start == null || end == null || end < start) return "—";
  const mins = end - start;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

export function AttendancePage({
  section = "company",
}: {
  section?: AttendanceSection;
}) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<AttendanceFilter>("All statuses");
  const [exceptionFilter, setExceptionFilter] =
    useState<AttendanceExceptionFilter>("All");
  const [correctionFilter, setCorrectionFilter] =
    useState<AttendanceCorrectionFilter>("All");
  const [reportType, setReportType] =
    useState<AttendanceReportType>("Daily attendance");
  const [reportDepartment, setReportDepartment] = useState("All");
  const [reportRole, setReportRole] = useState("All");
  const [clockIn, setClockIn] = useState(defaultAttendancePolicy.clockIn);
  const [clockOut, setClockOut] = useState(defaultAttendancePolicy.clockOut);
  const [expectedHours, setExpectedHours] = useState(
    defaultAttendancePolicy.expectedHours,
  );
  const [workingDays, setWorkingDays] = useState<AttendanceWeekDay[]>(
    defaultAttendancePolicy.workingDays,
  );
  const [graceMinutes, setGraceMinutes] = useState(
    defaultAttendancePolicy.graceMinutes,
  );
  const [earlyDepartureMinutes, setEarlyDepartureMinutes] = useState(
    defaultAttendancePolicy.earlyDepartureMinutes,
  );
  const { exportRows, runAction } = usePageActions();
  const monitor = useAttendanceMonitor();
  const today = useMemo(() => new Date(), []);
  const copy = sectionCopy[section];
  const subtitle = copy.subtitle.replace("{date}", formatLongDate(today));

  useEffect(() => {
    if (!monitor.schedule) return;
    setClockIn(monitor.schedule.openingTime);
    setClockOut(monitor.schedule.closingTime);
    setWorkingDays(workingDaysFromNumbers(monitor.schedule.daysOfWeek));
    setGraceMinutes(graceFromSchedule(monitor.schedule));
  }, [monitor.schedule]);

  const rows = useMemo(() => {
    return monitor.roster.filter((person) => {
      const matchesStatus =
        statusFilter === "All statuses" || person.status === statusFilter;
      const haystack =
        `${person.name} ${person.role} ${person.department}`.toLowerCase();
      return matchesStatus && haystack.includes(query.trim().toLowerCase());
    });
  }, [monitor.roster, query, statusFilter]);

  const exceptionRows = useMemo(() => {
    if (exceptionFilter === "All") return monitor.exceptions;
    return monitor.exceptions.filter((row) => row.status === exceptionFilter);
  }, [exceptionFilter, monitor.exceptions]);

  const correctionRows = useMemo(() => {
    if (correctionFilter === "All") return attendanceCorrections;
    return attendanceCorrections.filter((row) => row.status === correctionFilter);
  }, [correctionFilter]);

  const reportDepartments = useMemo(() => {
    const names = monitor.roster.map((person) => person.department).filter(Boolean);
    return ["All", ...Array.from(new Set(names))];
  }, [monitor.roster]);

  const reportRoles = useMemo(() => {
    const names = monitor.roster.map((person) => person.role).filter(Boolean);
    return ["All", ...Array.from(new Set(names))];
  }, [monitor.roster]);

  const reportRows = useMemo(() => {
    const matchesScope = (department: string, role: string) =>
      (reportDepartment === "All" || department === reportDepartment) &&
      (reportRole === "All" || role === reportRole);

    if (monitor.live) {
      return monitor.reportRows.filter((row) => {
        if (!matchesScope(row.department, row.role)) return false;
        if (reportType === "Daily attendance") return row.status !== "Not Clocked In";
        if (reportType === "Late arrivals") return row.status === "Late";
        if (reportType === "Absences") return row.status === "Absent";
        if (reportType === "Missing clock-outs") return row.status === "Missing Clock-Out";
        if (reportType === "Early departures") return row.status === "Early Departure";
        return true;
      });
    }

    const roleByName = new Map(
      monitor.roster.map((person) => [person.name, person.role]),
    );
    const generatedDate = formatGeneratedDate(today);

    if (reportType === "Daily attendance") {
      return monitor.roster
        .filter(
          (person) =>
            person.status !== "Not Clocked In" &&
            matchesScope(person.department, person.role),
        )
        .map((person) => ({
          id: person.id,
          date: generatedDate,
          employee: person.name,
          department: person.department,
          role: person.role,
          clockIn: person.clockIn,
          clockOut: person.clockOut,
          duration: person.duration,
          detail: "—",
          status: person.status,
        }));
    }

    const status = reportStatusByType[reportType];
    return monitor.exceptions
      .filter((row) => row.status === status)
      .map((row) => {
        const role = roleByName.get(row.name) ?? "";
        return {
          id: row.id,
          date: row.dateLabel,
          employee: row.name,
          department: row.department,
          role,
          clockIn: row.clockIn,
          clockOut: row.clockOut,
          duration: formatDuration(row.clockIn, row.clockOut),
          detail: row.detail,
          status: row.status,
        };
      })
      .filter((row) => matchesScope(row.department, row.role));
  }, [
    monitor.exceptions,
    monitor.live,
    monitor.reportRows,
    monitor.roster,
    reportDepartment,
    reportRole,
    reportType,
    today,
  ]);

  async function savePolicy() {
    await runAction(
      "Save attendance policy",
      async () => {
        const body = {
          openingTime: clockIn,
          closingTime: clockOut,
          lateAfterTime: addMinutesToTime(clockIn, graceMinutes),
          daysOfWeek: numbersFromWorkingDays(workingDays),
          timezone: "Africa/Lagos",
          active: true,
        };
        if (monitor.schedule?.id) {
          await attendanceApi.schedules.patch(monitor.schedule.id, body);
        } else {
          await attendanceApi.schedules.create({
            name: "Company schedule",
            locationIds: monitor.locations.map((location) => location.id),
            ...body,
          });
        }
        monitor.refetch();
      },
      "Attendance policy saved",
    );
  }

  return (
    <div className={styles.page}>
      <AccountantStatusLine
        loading={monitor.loading}
        error={monitor.error}
        resource="attendance"
      />
      <div className={styles.topBar}>
        <p className={styles.dateLabel}>{formatTopDate(today)}</p>
        <div className={styles.topActions}>
          <label className={styles.search}>
            <Search size={15} className={styles.searchIcon} />
            <input
              type="search"
              placeholder="Search"
              className={styles.searchInput}
              aria-label="Search"
            />
            <kbd className={styles.searchKbd}>⌘ K</kbd>
          </label>
          <NotificationsLink className={styles.iconButton}>
            <span className={styles.notifDot} aria-hidden />
            <Bell size={16} />
          </NotificationsLink>
          <ProfileLink className={styles.avatarChip}>MC</ProfileLink>
        </div>
      </div>

      <nav className={styles.tabs} aria-label="Attendance sections">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = tab.id === section;
          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={`${styles.tab} ${active ? styles.tabActive : ""}`}
              aria-current={active ? "page" : undefined}
            >
              <Icon size={15} strokeWidth={active ? 2.25 : 1.75} />
              {tab.label}
            </Link>
          );
        })}
      </nav>

      <header className={styles.header}>
        <div className={styles.headerCopy}>
          <p className={styles.eyebrow}>
            {section === "settings" || section === "audit-logs"
              ? "Super Admin"
              : "Attendance"}
          </p>
          <h1 className={styles.title}>{copy.title}</h1>
          <p className={styles.subtitle}>{subtitle}</p>
        </div>
        {section === "reports" ? (
          <div className={styles.headerActions}>
            <button
              type="button"
              className={styles.printButton}
              onClick={() => window.print()}
            >
              <Printer size={16} strokeWidth={2.25} />
              Print
            </button>
            <button
              type="button"
              className={styles.exportButton}
              onClick={() =>
                exportRows(
                  reportRows.map((row) => ({
                    Date: row.date,
                    Employee: row.employee,
                    Department: row.department,
                    In: row.clockIn,
                    Out: row.clockOut,
                    Duration: row.duration,
                    Detail: row.detail,
                    Status: row.status,
                  })),
                  `attendance-${reportType.toLowerCase().replace(/\s+/g, "-")}`,
                )
              }
            >
              <Download size={16} strokeWidth={2.25} />
              Export CSV
            </button>
          </div>
        ) : section === "settings" ? (
          <div className={styles.headerActions}>
            <button
              type="button"
              className={styles.exportButton}
              onClick={() => void savePolicy()}
            >
              <Save size={16} strokeWidth={2.25} />
              Save changes
            </button>
          </div>
        ) : null}
      </header>

      {section === "company" ? (
        <>
          <div className={styles.stats}>
            {monitor.stats.map((stat) => (
              <article key={stat.id} className={styles.statCard}>
                <p className={styles.statLabel}>{stat.label}</p>
                <p className={`${styles.statValue} ${toneClass[stat.tone]}`}>
                  {stat.value}
                </p>
              </article>
            ))}
          </div>

          <section className={styles.panel}>
            <span className={styles.prototypeChip}>
              <TriangleAlert size={13} />
              Prototype: Super Admin
            </span>
            <div className={styles.panelHead}>
              <span className={styles.panelIcon} aria-hidden>
                <Clock size={14} />
              </span>
              <h2 className={styles.panelTitle}>Department breakdown · Today</h2>
            </div>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Department</th>
                    <th className={styles.numeric}>Expected</th>
                    <th className={styles.numeric}>Present</th>
                    <th className={styles.numeric}>Late</th>
                    <th className={styles.numeric}>Absent</th>
                    <th className={styles.numeric}>On leave</th>
                  </tr>
                </thead>
                <tbody>
                  {monitor.departments.map((dept) => (
                    <tr key={dept.id}>
                      <td>{dept.name}</td>
                      <td className={styles.numeric}>{dept.expected}</td>
                      <td className={`${styles.numeric} ${styles.countPresent}`}>
                        {dept.present}
                      </td>
                      <td className={`${styles.numeric} ${styles.countLate}`}>
                        {dept.late}
                      </td>
                      <td className={`${styles.numeric} ${styles.countAbsent}`}>
                        {dept.absent}
                      </td>
                      <td className={`${styles.numeric} ${styles.countLeave}`}>
                        {dept.onLeave}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <div className={styles.toolbar}>
            <label className={styles.listSearch}>
              <Search size={15} />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search employee or department..."
                aria-label="Search employee or department"
              />
            </label>
            <select
              className={styles.filterSelect}
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as AttendanceFilter)
              }
              aria-label="Filter by status"
            >
              {attendanceFilters.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <section className={styles.panel}>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Role</th>
                    <th>Department</th>
                    <th>Clock in</th>
                    <th>Clock out</th>
                    <th>Duration</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((person) => (
                    <tr key={person.id}>
                      <td>
                        <div className={styles.employeeCell}>
                          <span
                            className={styles.avatar}
                            style={{ background: person.avatarColor }}
                          >
                            {person.initials}
                          </span>
                          <p className={styles.employeeName}>{person.name}</p>
                        </div>
                      </td>
                      <td className={styles.roleCell}>{person.role}</td>
                      <td>{person.department}</td>
                      <td className={styles.muted}>{person.clockIn}</td>
                      <td className={styles.muted}>{person.clockOut}</td>
                      <td className={styles.muted}>{person.duration}</td>
                      <td>
                        <span className={statusClass[person.status]}>
                          {person.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : section === "exceptions" ? (
        <>
          <div className={styles.exceptionFilters} role="tablist" aria-label="Filter exceptions">
            {attendanceExceptionFilters.map((filter) => {
              const active = exceptionFilter === filter;
              return (
                <button
                  key={filter}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  className={`${styles.exceptionChip} ${
                    active ? styles.exceptionChipActive : ""
                  }`}
                  onClick={() => setExceptionFilter(filter)}
                >
                  {filter}
                </button>
              );
            })}
          </div>

          <section className={styles.panel}>
            <span className={styles.prototypeChip}>
              <TriangleAlert size={13} />
              Prototype: Super Admin
            </span>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Department</th>
                    <th>Date</th>
                    <th>In</th>
                    <th>Out</th>
                    <th>Detail</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {exceptionRows.map((row) => (
                    <tr key={row.id}>
                      <td>
                        <p className={styles.exceptionName}>{row.name}</p>
                      </td>
                      <td className={styles.exceptionDept}>{row.department}</td>
                      <td>
                        <div className={styles.stackCell}>
                          <span>{row.dateLabel}</span>
                          <span className={styles.stackMuted}>{row.weekday}</span>
                        </div>
                      </td>
                      <td>
                        <ClockValue value={row.clockIn} />
                      </td>
                      <td>
                        <ClockValue value={row.clockOut} />
                      </td>
                      <td className={styles.detailCell}>{row.detail}</td>
                      <td>
                        <span
                          className={`${statusClass[row.status]} ${
                            row.status === "Missing Clock-Out"
                              ? styles.statusWrap
                              : ""
                          }`}
                        >
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : section === "corrections" ? (
        <>
          <div className={styles.exceptionFilters} role="tablist" aria-label="Filter corrections">
            {attendanceCorrectionFilters.map((filter) => {
              const active = correctionFilter === filter;
              return (
                <button
                  key={filter}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  className={`${styles.exceptionChip} ${
                    active ? styles.exceptionChipActive : ""
                  }`}
                  onClick={() => setCorrectionFilter(filter)}
                >
                  {filter}
                </button>
              );
            })}
          </div>

          <div className={styles.correctionListWrap}>
            <span className={styles.prototypeChip}>
              <TriangleAlert size={13} />
              Prototype: Super Admin
            </span>
            {correctionRows.length === 0 ? (
              <div className={styles.emptyPanel}>
                <p className={styles.emptyTitle}>No correction requests</p>
                <p className={styles.emptyCopy}>
                  There are no requests in this status.
                </p>
              </div>
            ) : (
              <div className={styles.correctionList}>
                {correctionRows.map((item) => (
                  <article key={item.id} className={styles.correctionCard}>
                    <div className={styles.correctionMain}>
                      <div className={styles.correctionTitleRow}>
                        <p className={styles.correctionTitle}>
                          <span className={styles.correctionId}>
                            {item.reference}
                          </span>
                          <span className={styles.correctionDot}>·</span>
                          <span className={styles.correctionName}>{item.name}</span>
                          <span className={styles.correctionDot}>·</span>
                          <span className={styles.correctionIssue}>{item.issue}</span>
                        </p>
                        <span className={correctionStatusClass[item.status]}>
                          {item.status}
                        </span>
                      </div>
                      <p className={styles.correctionMeta}>
                        {item.dateLabel}
                        <span className={styles.correctionDot}>·</span>
                        {item.change}
                        <span className={styles.correctionDot}>·</span>
                        {item.department}
                      </p>
                      <p className={styles.correctionNote}>“{item.note}”</p>
                    </div>
                    <button type="button" className={styles.reviewButton}>
                      Review
                    </button>
                  </article>
                ))}
              </div>
            )}
          </div>
        </>
      ) : section === "reports" ? (
        <>
          <div className={styles.reportFilters}>
            <label className={styles.reportField}>
              <span className={styles.reportFieldLabel}>Report type</span>
              <select
                className={styles.reportSelect}
                value={reportType}
                onChange={(event) =>
                  setReportType(event.target.value as AttendanceReportType)
                }
              >
                {attendanceReportTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.reportField}>
              <span className={styles.reportFieldLabel}>Department</span>
              <select
                className={styles.reportSelect}
                value={reportDepartment}
                onChange={(event) => setReportDepartment(event.target.value)}
              >
                {reportDepartments.map((department) => (
                  <option key={department} value={department}>
                    {department}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.reportField}>
              <span className={styles.reportFieldLabel}>Role</span>
              <select
                className={styles.reportSelect}
                value={reportRole}
                onChange={(event) => setReportRole(event.target.value)}
              >
                {reportRoles.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <section className={styles.panel}>
            <span className={styles.prototypeChip}>
              <TriangleAlert size={13} />
              Prototype: Super Admin
            </span>
            <div className={styles.panelHead}>
              <span className={styles.panelIcon} aria-hidden>
                <BarChart3 size={14} />
              </span>
              <h2 className={styles.panelTitle}>{reportType}</h2>
            </div>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Employee</th>
                    <th>Dept</th>
                    <th>In</th>
                    <th>Out</th>
                    <th>Duration</th>
                    <th>Detail</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {reportRows.length === 0 ? (
                    <tr>
                      <td colSpan={8} className={styles.reportEmpty}>
                        No records match this report.
                      </td>
                    </tr>
                  ) : (
                    reportRows.map((row) => (
                      <tr key={row.id}>
                        <td>{row.date}</td>
                        <td>
                          <p className={styles.employeeName}>{row.employee}</p>
                        </td>
                        <td>{row.department}</td>
                        <td>
                          <ClockValue value={row.clockIn} />
                        </td>
                        <td>
                          <ClockValue value={row.clockOut} />
                        </td>
                        <td className={styles.muted}>{row.duration}</td>
                        <td className={styles.detailCell}>{row.detail}</td>
                        <td>
                          <span
                            className={`${statusClass[row.status]} ${
                              row.status === "Missing Clock-Out"
                                ? styles.statusWrap
                                : ""
                            }`}
                          >
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <p className={styles.reportFooter}>
              {reportRows.length} record(s) · Generated {formatGeneratedDate(today)}
            </p>
          </section>
        </>
      ) : section === "settings" ? (
        <>
          <div className={styles.settingsGrid}>
            <section className={styles.panel}>
              <div className={styles.panelHead}>
                <span className={styles.panelIcon} aria-hidden>
                  <SlidersHorizontal size={14} />
                </span>
                <h2 className={styles.panelTitle}>Work schedule</h2>
              </div>
              <div className={styles.settingsFields}>
                <label className={styles.settingsField}>
                  <span className={styles.settingsLabel}>Expected clock-in</span>
                  <input
                    type="time"
                    className={styles.settingsInput}
                    value={clockIn}
                    onChange={(event) => setClockIn(event.target.value)}
                  />
                </label>
                <label className={styles.settingsField}>
                  <span className={styles.settingsLabel}>Expected clock-out</span>
                  <input
                    type="time"
                    className={styles.settingsInput}
                    value={clockOut}
                    onChange={(event) => setClockOut(event.target.value)}
                  />
                </label>
                <label className={`${styles.settingsField} ${styles.settingsFieldFull}`}>
                  <span className={styles.settingsLabel}>Expected working hours</span>
                  <input
                    type="number"
                    min={1}
                    max={24}
                    className={styles.settingsInput}
                    value={expectedHours}
                    onChange={(event) =>
                      setExpectedHours(Number(event.target.value) || 0)
                    }
                  />
                </label>
                <div className={`${styles.settingsField} ${styles.settingsFieldFull}`}>
                  <span className={styles.settingsLabel}>Working days</span>
                  <div className={styles.dayRow}>
                    {attendanceWeekDays.map((day) => {
                      const active = workingDays.includes(day);
                      return (
                        <button
                          key={day}
                          type="button"
                          className={`${styles.dayChip} ${
                            active ? styles.dayChipActive : ""
                          }`}
                          aria-pressed={active}
                          onClick={() =>
                            setWorkingDays((current) =>
                              current.includes(day)
                                ? current.filter((item) => item !== day)
                                : [...current, day],
                            )
                          }
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </section>

            <section className={styles.panel}>
              <span className={styles.prototypeChip}>
                <TriangleAlert size={13} />
                Prototype: Super Admin
              </span>
              <div className={styles.panelHead}>
                <span className={styles.panelIcon} aria-hidden>
                  <SlidersHorizontal size={14} />
                </span>
                <h2 className={styles.panelTitle}>Thresholds &amp; rules</h2>
              </div>
              <div className={styles.settingsFields}>
                <label className={styles.settingsField}>
                  <span className={styles.settingsLabel}>Grace period (min)</span>
                  <input
                    type="number"
                    min={0}
                    className={styles.settingsInput}
                    value={graceMinutes}
                    onChange={(event) =>
                      setGraceMinutes(Number(event.target.value) || 0)
                    }
                  />
                </label>
                <label className={styles.settingsField}>
                  <span className={styles.settingsLabel}>
                    Early-departure threshold (min)
                  </span>
                  <input
                    type="number"
                    min={0}
                    className={styles.settingsInput}
                    value={earlyDepartureMinutes}
                    onChange={(event) =>
                      setEarlyDepartureMinutes(Number(event.target.value) || 0)
                    }
                  />
                </label>
                <div className={`${styles.settingsField} ${styles.settingsFieldFull}`}>
                  <span className={styles.settingsLabel}>Weekend rule</span>
                  <p className={styles.settingsNote}>
                    {defaultAttendancePolicy.weekendRule}
                  </p>
                </div>
                <div className={`${styles.settingsField} ${styles.settingsFieldFull}`}>
                  <span className={styles.settingsLabel}>Holiday rule</span>
                  <p className={styles.settingsNote}>
                    {defaultAttendancePolicy.holidayRule}
                  </p>
                </div>
                <div className={`${styles.settingsField} ${styles.settingsFieldFull}`}>
                  <span className={styles.settingsLabel}>
                    Missing clock-out handling
                  </span>
                  <p className={styles.settingsNote}>
                    {defaultAttendancePolicy.missingClockOut}
                  </p>
                </div>
              </div>
            </section>
          </div>

          <section className={styles.panel}>
            <div className={styles.panelHead}>
              <h2 className={styles.panelTitle}>Check-in locations</h2>
            </div>
            {monitor.locations.length === 0 ? (
              <p className={styles.emptyCopy}>
                No GPS locations yet. Create an active location with coordinates,
                then a schedule that points at it, before staff can check in.
              </p>
            ) : (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Address</th>
                      <th>Radius</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monitor.locations.map((location) => (
                      <tr key={location.id}>
                        <td>{location.name}</td>
                        <td className={styles.muted}>{location.address || "—"}</td>
                        <td>{location.radiusMeters} m</td>
                        <td>{location.active ? "Active" : "Disabled"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <p className={styles.policyBanner}>
            Current effective policy: clock in by{" "}
            <strong>{clockIn || defaultAttendancePolicy.clockIn}</strong>, clock out
            at <strong>{clockOut || defaultAttendancePolicy.clockOut}</strong>, grace
            period <strong>{graceMinutes} min</strong>,{" "}
            <strong>{expectedHours}h</strong> expected. A clock-in after the grace
            period is marked <strong>Late</strong>; a clock-out before the expected
            time (minus threshold) is an <strong>Early Departure</strong>.
          </p>
        </>
      ) : section === "audit-logs" ? (
        <section className={styles.panel}>
          <span className={styles.prototypeChip}>
            <TriangleAlert size={13} />
            Prototype: Super Admin
          </span>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>When</th>
                  <th>Actor</th>
                  <th>Action</th>
                  <th>Target</th>
                  <th>Previous</th>
                  <th>New</th>
                  <th>Reason</th>
                </tr>
              </thead>
              <tbody>
                {monitor.auditLogs.map((row) => {
                  const changed = row.next !== row.previous && row.next !== "—";
                  return (
                    <tr key={row.id}>
                      <td>
                        <div className={styles.stackCell}>
                          <span>{row.whenDate}</span>
                          <span className={styles.stackMuted}>{row.whenTime}</span>
                        </div>
                      </td>
                      <td>
                        <p className={styles.auditActor}>{row.actor}</p>
                      </td>
                      <td className={styles.auditAction}>{row.action}</td>
                      <td>{row.target}</td>
                      <td className={styles.muted}>{row.previous}</td>
                      <td className={changed ? styles.auditNew : styles.muted}>
                        {row.next}
                      </td>
                      <td className={styles.auditReason}>{row.reason}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        <div className={styles.emptyPanel}>
          <p className={styles.emptyTitle}>{copy.title}</p>
          <p className={styles.emptyCopy}>
            This tab is in place. The rest of the attendance spec will be wired
            here next.
          </p>
        </div>
      )}
    </div>
  );
}
