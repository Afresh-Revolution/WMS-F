"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, LogIn, Search } from "lucide-react";
import { NotificationsLink, ProfileLink } from "@/components/layout/PageLinks";
import { AccountantStatusLine } from "@/components/accountant/AccountantStatusLine";
import { ConfirmClockInModal } from "@/components/manager/ConfirmClockInModal";
import { useCurrentUser } from "@/components/layout/CurrentUserProvider";
import { useAsyncData } from "@/hooks/useAsyncData";
import { usePageActions } from "@/hooks/usePageActions";
import { attendanceApi, attendanceSettled, profileApi } from "@/lib/api";
import type { GpsCheckInBody } from "@/lib/api/attendance";
import {
  asAttendanceRecord,
  formatExpectedClock,
  formatLagosClock,
  mapCheckInWindow,
  mapPersonalHistory,
  unwrapAttendanceData,
} from "@/lib/api/attendanceMappers";
import { nestedStr, unwrapRecord } from "@/lib/api/mappers";
import {
  defaultAttendancePolicy,
  type AttendanceStatus,
  type PersonalAttendanceDay,
  type PersonalAttendanceStat,
} from "@/data/attendance";
import { AttendanceSectionNav } from "@/components/attendance/AttendancePage";
import pageStyles from "@/components/attendance/AttendancePage.module.css";
import styles from "./ManagerAttendancePage.module.css";

const statusClass: Record<AttendanceStatus, string> = {
  "Not Clocked In": pageStyles.statusPill,
  Present: `${pageStyles.statusPill} ${pageStyles.statusPresent}`,
  Late: `${pageStyles.statusPill} ${pageStyles.statusLate}`,
  Absent: `${pageStyles.statusPill} ${pageStyles.statusAbsent}`,
  "On Leave": `${pageStyles.statusPill} ${pageStyles.statusLeave}`,
  "Missing Clock-Out": `${pageStyles.statusPill} ${pageStyles.statusMissing}`,
  "Early Departure": `${pageStyles.statusPill} ${pageStyles.statusEarly}`,
};

function formatTopDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function formatLongDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function monthHint(date = new Date()) {
  return date.toISOString().slice(0, 7);
}

function departmentFrom(payload: unknown, fallback = "Management") {
  if (payload == null) return fallback;
  const record = unwrapRecord(payload);
  const data = asAttendanceRecord(unwrapAttendanceData(payload));
  const employee = asAttendanceRecord(
    data.employee ?? data.user ?? data.profile ?? record.employee ?? record.user,
  );
  const employment = asAttendanceRecord(
    data.employment ?? employee.employment ?? record.employment,
  );
  return nestedStr(
    data.department ??
      record.department ??
      employee.department ??
      employment.department ??
      data.departmentName ??
      record.departmentName,
    ["name", "title", "label"],
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
    {
      id: "records",
      label: "Records logged",
      value: days.length,
      hint: "This month",
    },
  ];
}

function readGps(): Promise<Pick<
  GpsCheckInBody,
  "latitude" | "longitude" | "accuracyMeters" | "locationTimestamp"
>> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("Location is not available in this browser."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracyMeters: position.coords.accuracy,
          locationTimestamp: new Date(position.timestamp).toISOString(),
        });
      },
      (error) => {
        reject(new Error(error.message || "Could not read your location."));
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  });
}

export function ManagerAttendancePage({
  confirmClockIn = false,
}: {
  confirmClockIn?: boolean;
}) {
  const { user } = useCurrentUser();
  const router = useRouter();
  const { runAction } = usePageActions();
  const [busy, setBusy] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(confirmClockIn);
  const today = useMemo(() => new Date(), []);

  useEffect(() => {
    if (confirmClockIn) {
      setConfirmOpen(true);
      return;
    }
    const params = new URLSearchParams(window.location.search);
    if (params.get("confirm") === "clock-in") {
      setConfirmOpen(true);
    }
  }, [confirmClockIn]);

  function closeConfirm() {
    setConfirmOpen(false);
    if (new URLSearchParams(window.location.search).get("confirm")) {
      router.replace("/manager/attendance");
    }
  }

  const { data, loading, error, refetch } = useAsyncData(async () => {
    const [status, history, profile] = await Promise.all([
      attendanceSettled(attendanceApi.manager.status()),
      attendanceSettled(attendanceApi.manager.history({ limit: 40 })),
      attendanceSettled(profileApi.get()),
    ]);
    return { status, history, profile };
  }, []);

  const checkInWindow = data?.status ? mapCheckInWindow(data.status) : null;
  const history = mapPersonalHistory(data?.history);
  const stats = statsFromDays(history);

  const clockedIn = Boolean(
    checkInWindow?.alreadyCheckedIn || checkInWindow?.checkInAt,
  );
  const todayStatus: AttendanceStatus = !clockedIn
    ? "Not Clocked In"
    : checkInWindow?.status && checkInWindow.status !== "Not Clocked In"
      ? checkInWindow.status
      : "Present";
  const canCheckIn =
    data?.status == null
      ? !clockedIn
      : Boolean(checkInWindow?.canCheckIn) && !clockedIn;
  const confirmName = user?.name || "Manager";
  const confirmDepartment =
    departmentFrom(data?.profile, "") || departmentFrom(data?.status, "");

  async function handleClockIn() {
    if (busy) {
      throw new Error("Clock-in already in progress");
    }
    setBusy(true);
    try {
      await runAction(
        "Clock in",
        async () => {
          const gps = await readGps();
          const idempotencyKey =
            typeof crypto !== "undefined" && "randomUUID" in crypto
              ? crypto.randomUUID()
              : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
          await attendanceApi.manager.checkIn(
            {
              ...gps,
              clientTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
              scheduleId: checkInWindow?.scheduleId || undefined,
              locationId: checkInWindow?.locationId || undefined,
              idempotencyKey,
              device: {
                browser: navigator.userAgent.includes("Edg")
                  ? "Edge"
                  : navigator.userAgent.includes("Chrome")
                    ? "Chromium"
                    : "Browser",
                platform: navigator.platform,
              },
            },
            idempotencyKey,
          );
          refetch();
        },
        "Clock-in recorded",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={pageStyles.page}>
      <AccountantStatusLine
        loading={loading}
        error={error}
        resource="your attendance"
      />
      <div className={pageStyles.topBar}>
        <p className={pageStyles.dateLabel}>{formatTopDate(today)}</p>
        <div className={pageStyles.topActions}>
          <label className={pageStyles.search}>
            <Search size={15} className={pageStyles.searchIcon} />
            <input
              type="search"
              placeholder="Search"
              className={pageStyles.searchInput}
              aria-label="Search"
            />
            <kbd className={pageStyles.searchKbd}>⌘ K</kbd>
          </label>
          <NotificationsLink className={pageStyles.iconButton}>
            <span className={pageStyles.notifDot} aria-hidden />
            <Bell size={16} />
          </NotificationsLink>
          <ProfileLink className={pageStyles.avatarChip}>
            {user?.initials || "M"}
          </ProfileLink>
        </div>
      </div>

      <AttendanceSectionNav variant="manager" active="my" />

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

      <div className={styles.heroGrid}>
        <section className={styles.clockCard}>
          <div className={styles.clockHead}>
            <p className={styles.clockEyebrow}>Attendance</p>
            <span className={statusClass[todayStatus]}>{todayStatus}</span>
          </div>
          <p className={styles.clockDate}>Today · {formatLongDate(today)}</p>
          <h2 className={styles.clockTitle}>{todayStatus}</h2>
          <p className={styles.clockExpected}>
            {clockedIn && checkInWindow?.checkInAt
              ? `Clocked in at ${formatLagosClock(checkInWindow.checkInAt)}`
              : `Expected: ${formatExpectedClock(checkInWindow?.openingTime ?? defaultAttendancePolicy.clockIn)}`}
          </p>
          {clockedIn ? null : (
            <button
              type="button"
              className={styles.clockButton}
              disabled={!canCheckIn || busy || loading}
              onClick={() => setConfirmOpen(true)}
            >
              <LogIn size={16} strokeWidth={2.25} />
              Clock In
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
                    stat.id === "absent" ? styles.statDanger : ""
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

      <section className={styles.recentCard}>
        <h2 className={styles.recentTitle}>Recent days</h2>
        {history.length === 0 ? (
          <p className={styles.empty}>No attendance records yet this month.</p>
        ) : (
          <ul className={styles.recentList}>
            {history.map((day) => (
              <li key={day.id} className={styles.recentRow}>
                <div className={styles.recentDate}>
                  <strong>{day.dateLabel}</strong>
                  <span>{day.weekday}</span>
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
                <span className={statusClass[day.status]}>{day.status}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <ConfirmClockInModal
        open={confirmOpen}
        name={confirmName}
        department={confirmDepartment}
        dateLabel={formatLongDate(today)}
        busy={busy}
        onClose={closeConfirm}
        onConfirm={handleClockIn}
      />
    </div>
  );
}
