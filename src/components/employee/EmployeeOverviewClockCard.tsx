"use client";

import { useMemo, useState } from "react";
import { Clock, LogIn, LogOut } from "lucide-react";
import { ConfirmClockInModal } from "@/components/manager/ConfirmClockInModal";
import { useCurrentUser } from "@/components/layout/CurrentUserProvider";
import { useAsyncData } from "@/hooks/useAsyncData";
import { usePageActions } from "@/hooks/usePageActions";
import {
  attendanceApi,
  attendanceSettled,
  employeeApi,
} from "@/lib/api";
import {
  formatExpectedClock,
  formatLagosClock,
  mapCheckInWindow,
} from "@/lib/api/attendanceMappers";
import { defaultAttendancePolicy } from "@/data/attendance";
import styles from "./EmployeeOverviewClockCard.module.css";

type ClockCardProps = {
  name?: string;
  department?: string;
};

function formatTodayLabel(date = new Date()) {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "Africa/Lagos",
  });
}

function parseClockTime(value?: string) {
  const text = value?.trim();
  if (!text) return null;
  const iso = new Date(text);
  if (!Number.isNaN(iso.getTime())) return iso;
  const match = text.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (!match) return null;
  const next = new Date();
  next.setHours(Number(match[1]), Number(match[2]), Number(match[3] ?? 0), 0);
  return next;
}

function formatClockInTime(value?: string) {
  const text = value?.trim();
  if (!text) return "";
  if (/am|pm/i.test(text) && !text.includes("T")) return text.replace(/^0/, "");
  const parsed = parseClockTime(text);
  if (!parsed) return formatLagosClock(text);
  if (/T|\d{4}-/.test(text)) return formatLagosClock(text);
  return parsed.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

async function loadEmployeeAttendanceStatus() {
  const employeeStatus = await attendanceSettled(
    employeeApi.attendance.status(),
  );
  if (employeeStatus) return employeeStatus;
  return attendanceSettled(attendanceApi.me.status());
}

export function EmployeeOverviewClockCard({
  name,
  department,
}: ClockCardProps) {
  const { user } = useCurrentUser();
  const { runAction } = usePageActions();
  const [busy, setBusy] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [recordedClockIn, setRecordedClockIn] = useState("");
  const today = useMemo(() => new Date(), []);

  const { data, loading, refetch } = useAsyncData(
    () => loadEmployeeAttendanceStatus(),
    [],
  );

  const checkInWindow = data ? mapCheckInWindow(data) : null;
  const checkInAt = checkInWindow?.checkInAt;
  const checkOutAt = checkInWindow?.checkOutAt;
  const clockedIn = Boolean(
    (checkInWindow?.alreadyCheckedIn || checkInAt) && !checkOutAt,
  );
  const clockInLabel = formatClockInTime(checkInAt) || recordedClockIn;
  const expected = formatExpectedClock(
    checkInWindow?.openingTime ?? defaultAttendancePolicy.clockIn,
  );
  const displayName = name?.trim() || user?.name || "Employee";
  const displayDepartment = department?.trim() || "Employee";

  const title = clockedIn
    ? clockInLabel || "Clocked In"
    : checkOutAt
      ? "Clocked Out"
      : "Not Clocked In";
  const badge = clockedIn
    ? "Clocked In"
    : checkOutAt
      ? "Clocked Out"
      : "Not Clocked In";
  const detail = clockInLabel
    ? `Clocked in at ${clockInLabel}`
    : `Expected: ${expected}`;

  async function handleClockIn() {
    if (busy) throw new Error("Clock-in already in progress");
    setBusy(true);
    try {
      await runAction(
        "Clock in",
        async () => {
          const payload = await employeeApi.attendance.clockIn({});
          const fromApi = formatClockInTime(mapCheckInWindow(payload).checkInAt);
          setRecordedClockIn(fromApi || formatLagosClock(new Date().toISOString()));
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

  return (
    <>
      <section className={styles.card} aria-label="Attendance">
        <div className={styles.head}>
          <p className={styles.eyebrow}>
            <Clock size={14} strokeWidth={2} />
            Attendance
          </p>
          <span className={`${styles.badge} ${clockedIn ? styles.badgeIn : ""}`}>
            {badge}
          </span>
        </div>

        <p className={styles.today}>Today · {formatTodayLabel(today)}</p>
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.expected}>{detail}</p>

        {clockedIn ? (
          <button
            type="button"
            className={styles.button}
            disabled={busy || loading}
            onClick={() => void handleClockOut()}
          >
            <LogOut size={16} strokeWidth={2.25} />
            {busy ? "Clocking out…" : "Clock Out"}
          </button>
        ) : (
          <button
            type="button"
            className={styles.button}
            disabled={busy || loading}
            onClick={() => setConfirmOpen(true)}
          >
            <LogIn size={16} strokeWidth={2.25} />
            {busy ? "Clocking in…" : "Clock In"}
          </button>
        )}
      </section>

      <ConfirmClockInModal
        open={confirmOpen}
        name={displayName}
        department={displayDepartment}
        dateLabel={formatTodayLabel(today)}
        busy={busy}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleClockIn}
      />
    </>
  );
}
