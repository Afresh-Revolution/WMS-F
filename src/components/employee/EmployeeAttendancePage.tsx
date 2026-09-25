"use client";

import { PageDateLabel } from "@/components/layout/PageDateLabel";
import { useMemo, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import {
  AlertTriangle,
  CalendarDays,
  Clock,
  LogIn,
  LogOut,
  Search,
} from "lucide-react";
import { NotificationsLink, ProfileLink } from "@/components/layout/PageLinks";
import { ConfirmClockInModal } from "@/components/manager/ConfirmClockInModal";
import { useCurrentUser } from "@/components/layout/CurrentUserProvider";
import { useAsyncData } from "@/hooks/useAsyncData";
import { usePageActions } from "@/hooks/usePageActions";
import { attendanceSettled, employeeApi } from "@/lib/api";
import {
  formatExpectedClock,
  formatLagosClock,
  formatLagosWeekday,
  lagosWorkDate,
  mapCheckInWindow,
  mapPersonalHistory,
} from "@/lib/api/attendanceMappers";
import { nestedStr, unwrapRecord } from "@/lib/api/mappers";
import {
  defaultAttendancePolicy,
  type AttendanceStatus,
  type PersonalAttendanceDay,
  type PersonalAttendanceStat,
} from "@/data/attendance";
import pageStyles from "@/components/attendance/AttendancePage.module.css";
import styles from "./EmployeeAttendancePage.module.css";

const statusClass: Record<AttendanceStatus, string> = {
  "Not Clocked In": pageStyles.statusPill,
  Present: `${pageStyles.statusPill} ${pageStyles.statusPresent}`,
  Late: `${pageStyles.statusPill} ${pageStyles.statusLate}`,
  Absent: `${pageStyles.statusPill} ${pageStyles.statusAbsent}`,
  "On Leave": `${pageStyles.statusPill} ${pageStyles.statusLeave}`,
  "Missing Clock-Out": `${pageStyles.statusPill} ${pageStyles.statusMissing}`,
  "Early Departure": `${pageStyles.statusPill} ${pageStyles.statusEarly}`,
};

function formatLongDate(date = new Date()) {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "Africa/Lagos",
  });
}

function formatHistoryDate(workDate: string) {
  const date = workDate.includes("T")
    ? new Date(workDate)
    : new Date(`${workDate}T12:00:00`);
  if (Number.isNaN(date.getTime())) return workDate;
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Africa/Lagos",
  });
}

function monthHint(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Lagos",
  })
    .format(date)
    .slice(0, 7);
}

function departmentFrom(payload: unknown, fallback = "Employee") {
  if (payload == null) return fallback;
  const record = unwrapRecord(payload);
  return nestedStr(
    record.department ?? record.departmentName ?? record.employment,
    ["name", "title", "label", "departmentName"],
    fallback,
  );
}

function statsFromDays(days: PersonalAttendanceDay[]): PersonalAttendanceStat[] {
  return [
    {
      id: "present",
      label: "Days present",
      value: days.filter((day) => day.status === "Present").length,
      hint: monthHint(),
    },
    {
      id: "late",
      label: "Days late",
      value: days.filter((day) => day.status === "Late").length,
      hint: "This month",
    },
    {
      id: "absent",
      label: "Days absent",
      value: days.filter((day) => day.status === "Absent").length,
      hint: "This month",
    },
    {
      id: "early",
      label: "Early departures",
      value: days.filter((day) => day.status === "Early Departure").length,
      hint: "This month",
    },
    {
      id: "missing",
      label: "Missing clock-outs",
      value: days.filter((day) => day.status === "Missing Clock-Out").length,
      hint: "This month",
    },
  ];
}

export function EmployeeAttendancePage({
  section = "my",
}: {
  section?: "my" | "history";
}) {
  const { user } = useCurrentUser();
  const { runAction } = usePageActions();
  const [busy, setBusy] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [correctionId, setCorrectionId] = useState<string | null>(null);
  const [correctionNote, setCorrectionNote] = useState("");
  const today = useMemo(() => new Date(), []);

  const { data, loading, error, refetch } = useAsyncData(async () => {
    const [status, history, profile] = await Promise.all([
      attendanceSettled(employeeApi.attendance.status()),
      attendanceSettled(employeeApi.attendance.history({ limit: 40 })),
      attendanceSettled(employeeApi.profile.get()),
    ]);
    return { status, history, profile };
  }, []);

  const checkInWindow = data?.status ? mapCheckInWindow(data.status) : null;
  const history = mapPersonalHistory(data?.history);
  const monthKey = monthHint(today);
  const monthDays = history.filter((day) => day.workDate.startsWith(monthKey));
  const stats = statsFromDays(monthDays);
  const missingDay = history.find((day) => day.status === "Missing Clock-Out");
  const clockedIn = Boolean(
    (checkInWindow?.alreadyCheckedIn || checkInWindow?.checkInAt) &&
      !checkInWindow?.checkOutAt,
  );
  const todayStatus: AttendanceStatus = clockedIn
    ? checkInWindow?.status && checkInWindow.status !== "Not Clocked In"
      ? checkInWindow.status
      : "Present"
    : checkInWindow?.checkOutAt
      ? checkInWindow.status
      : "Not Clocked In";
  const canCheckIn =
    data?.status == null ? !clockedIn : Boolean(checkInWindow?.canCheckIn) && !clockedIn;
  const confirmName = user?.name || "Employee";
  const confirmDepartment =
    departmentFrom(data?.profile, "") || departmentFrom(data?.status, "Employee");

  async function handleClockIn() {
    if (busy) throw new Error("Clock-in already in progress");
    setBusy(true);
    try {
      await runAction(
        "Clock in",
        async () => {
          await employeeApi.attendance.clockIn({});
          refetch();
        },
        "Clock-in recorded",
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleClockOut() {
    if (busy) return;
    setBusy(true);
    try {
      await runAction(
        "Clock out",
        async () => {
          await employeeApi.attendance.clockOut({});
          refetch();
        },
        "Clock-out recorded",
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleCorrection(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!correctionId || busy) return;
    setBusy(true);
    try {
      await runAction(
        "Request correction",
        async () => {
          await employeeApi.attendance.requestCorrection(correctionId, {
            reason: correctionNote.trim(),
            note: correctionNote.trim(),
            issue: "Missing clock-out",
          });
          refetch();
        },
        "Correction requested",
      );
      setCorrectionId(null);
      setCorrectionNote("");
    } catch {
      return;
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={pageStyles.page}>
      <header className={styles.topBar}>
        <PageDateLabel />
        {loading ? <p className={styles.empty}>Loading attendance…</p> : null}
        {error ? (
          <p className={styles.empty} role="alert">
            {error}
          </p>
        ) : null}
        <div className={styles.topActions}>
          <label className={styles.search}>
            <Search size={14} />
            <input aria-label="Search" placeholder="Search" readOnly />
            <kbd>⌘ K</kbd>
          </label>
          <NotificationsLink className={styles.iconButton} />
          <ProfileLink className={styles.profileButton}>
            {user?.initials || "—"}
          </ProfileLink>
        </div>
      </header>

      <nav className={pageStyles.tabs} aria-label="Attendance sections">
        <Link
          href="/employee/attendance"
          className={`${pageStyles.tab} ${section === "my" ? pageStyles.tabActive : ""}`}
          aria-current={section === "my" ? "page" : undefined}
        >
          <Clock size={15} strokeWidth={section === "my" ? 2.25 : 1.75} />
          My Attendance
        </Link>
        <Link
          href="/employee/attendance/history"
          className={`${pageStyles.tab} ${section === "history" ? pageStyles.tabActive : ""}`}
          aria-current={section === "history" ? "page" : undefined}
        >
          <CalendarDays size={15} strokeWidth={section === "history" ? 2.25 : 1.75} />
          Attendance History
        </Link>
      </nav>

      {section === "my" ? (
        <header className={pageStyles.header}>
          <div className={pageStyles.headerCopy}>
            <p className={pageStyles.eyebrow}>Attendance</p>
            <h1 className={pageStyles.title}>My attendance</h1>
            <p className={pageStyles.subtitle}>
              Clock in when you arrive and clock out when you leave. Track your
              status, hours and monthly summary.
            </p>
          </div>
        </header>
      ) : null}

      {section === "my" && missingDay ? (
        <p className={styles.alert} role="status">
          <AlertTriangle size={16} />
          <span>
            Your attendance for {formatHistoryDate(missingDay.workDate)} is
            missing a clock-out. You can request a correction from{" "}
            <Link href="/employee/attendance/history">Attendance History</Link>.
          </span>
        </p>
      ) : null}

      {section === "my" ? (
        <div className={styles.heroGrid}>
          <section className={styles.clockCard} aria-label="Today's attendance">
            <div className={styles.clockHead}>
              <p className={styles.clockEyebrow}>
                <Clock size={14} strokeWidth={2} />
                Attendance
              </p>
              <span className={statusClass[todayStatus]}>{todayStatus}</span>
            </div>
            <p className={styles.clockDate}>Today · {formatLongDate(today)}</p>
            <h2 className={styles.clockTitle}>{todayStatus}</h2>
            <p className={styles.clockExpected}>
              {clockedIn && checkInWindow?.checkInAt
                ? `Clocked in at ${formatLagosClock(checkInWindow.checkInAt)}`
                : checkInWindow?.checkOutAt
                  ? `Clocked out at ${formatLagosClock(checkInWindow.checkOutAt)}`
                  : `Expected: ${formatExpectedClock(checkInWindow?.openingTime ?? defaultAttendancePolicy.clockIn)}`}
            </p>
            {clockedIn ? (
              <button
                type="button"
                className={styles.clockButton}
                disabled={busy || loading}
                onClick={() => void handleClockOut()}
              >
                <LogOut size={16} strokeWidth={2.25} />
                {busy ? "Clocking out…" : "Clock Out"}
              </button>
            ) : (
              <button
                type="button"
                className={styles.clockButton}
                disabled={!canCheckIn || busy || loading}
                onClick={() => setConfirmOpen(true)}
              >
                <LogIn size={16} strokeWidth={2.25} />
                {busy ? "Clocking in…" : "Clock In"}
              </button>
            )}
          </section>

          <div className={styles.statsWrap}>
            <div className={styles.statsGrid}>
              {stats.map((stat) => (
                <article key={stat.id} className={styles.statCard}>
                  <p className={styles.statLabel}>{stat.label}</p>
                  <p
                    className={`${styles.statValue} ${
                      stat.id === "absent" || stat.id === "missing"
                        ? styles.statDanger
                        : ""
                    }`}
                  >
                    {stat.value}
                  </p>
                  <p className={styles.statHint}>{stat.hint}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {section === "history" ? (
        <section className={styles.recentCard}>
          <h2 className={styles.recentTitle}>
            <CalendarDays size={18} strokeWidth={2.25} />
            Recent days
          </h2>
          {history.length === 0 ? (
            <p className={styles.empty}>No attendance records yet this month.</p>
          ) : (
            <ul className={styles.recentList}>
              {history.map((day) => (
                <li key={day.id} className={styles.recentRow}>
                  <div className={styles.recentDate}>
                    <strong>{formatHistoryDate(day.workDate)}</strong>
                    <span>{day.weekday || formatLagosWeekday(day.workDate)}</span>
                  </div>
                  <p className={styles.recentTimes}>
                    <span>
                      {day.clockIn} – {day.clockOut}
                    </span>
                    {day.duration && day.duration !== "—" ? (
                      <span className={styles.recentDuration}>{day.duration}</span>
                    ) : null}
                  </p>
                  <p className={styles.recentLate}>{day.lateLabel}</p>
                  {day.status === "Missing Clock-Out" ? (
                    <button
                      type="button"
                      className={`${statusClass[day.status]} ${styles.statusButton}`}
                      onClick={() => setCorrectionId(day.id)}
                    >
                      {day.status}
                    </button>
                  ) : (
                    <span className={statusClass[day.status]}>{day.status}</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      <ConfirmClockInModal
        open={confirmOpen}
        name={confirmName}
        department={confirmDepartment}
        dateLabel={formatLongDate(today)}
        busy={busy}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleClockIn}
      />

      {correctionId && typeof document !== "undefined"
        ? createPortal(
            <div
              className={styles.modalBackdrop}
              role="presentation"
              onClick={() => setCorrectionId(null)}
            >
              <form
                className={styles.modal}
                role="dialog"
                aria-modal="true"
                aria-labelledby="correction-title"
                onClick={(event) => event.stopPropagation()}
                onSubmit={handleCorrection}
              >
                <h2 id="correction-title">Request correction</h2>
                <p>Tell your HOD what should be corrected on this day.</p>
                <label>
                  <span>Note</span>
                  <textarea
                    value={correctionNote}
                    onChange={(event) => setCorrectionNote(event.target.value)}
                    placeholder="I forgot to clock out after close of work."
                    required
                  />
                </label>
                <div className={styles.modalActions}>
                  <button
                    type="button"
                    className={styles.modalCancel}
                    onClick={() => setCorrectionId(null)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={styles.modalSubmit}
                    disabled={busy}
                  >
                    {busy ? "Sending…" : "Submit request"}
                  </button>
                </div>
              </form>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
