"use client";

import { useEffect, useMemo, useState } from "react";
import { Clock, LogIn, LogOut } from "lucide-react";
import { ConfirmClockInModal } from "@/components/manager/ConfirmClockInModal";
import { useCurrentUser } from "@/components/layout/CurrentUserProvider";
import { useAsyncData } from "@/hooks/useAsyncData";
import { usePageActions } from "@/hooks/usePageActions";
import { attendanceApi, attendanceSettled, managerApi } from "@/lib/api";
import {
  formatExpectedClock,
  formatLagosClock,
  mapCheckInWindow,
} from "@/lib/api/attendanceMappers";
import { defaultAttendancePolicy } from "@/data/attendance";
import styles from "./ManagerOverviewClockCard.module.css";

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

function formatWorkingDuration(startedAt: Date, now = Date.now()) {
  const ms = Math.max(0, now - startedAt.getTime());
  const hours = Math.floor(ms / 3_600_000);
  const minutes = Math.floor((ms % 3_600_000) / 60_000);
  return `${String(hours).padStart(2, "0")}h ${String(minutes).padStart(2, "0")}m`;
}

export function ManagerOverviewClockCard() {
  const { user } = useCurrentUser();
  const { runAction } = usePageActions();
  const [busy, setBusy] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const today = useMemo(() => new Date(), []);

  const { data, loading, refetch } = useAsyncData(
    () => attendanceSettled(attendanceApi.manager.status()),
    [],
  );

  const checkInWindow = data ? mapCheckInWindow(data) : null;
  const checkInAt = checkInWindow?.checkInAt;
  const checkOutAt = checkInWindow?.checkOutAt;
  const clockedIn = Boolean(
    (checkInWindow?.alreadyCheckedIn || checkInAt) && !checkOutAt,
  );
  const checkInDate = parseClockTime(checkInAt);
  const clockInLabel = formatClockInTime(checkInAt);
  const expected = formatExpectedClock(
    checkInWindow?.openingTime ?? defaultAttendancePolicy.clockIn,
  );

  useEffect(() => {
    if (!clockedIn || !checkInDate) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [checkInDate, clockedIn]);

  async function handleClockIn() {
    if (busy) throw new Error("Clock-in already in progress");
    setBusy(true);
    try {
      await runAction(
        "Clock in",
        async () => {
          await managerApi.clockIn({});
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
          await managerApi.clockOut({});
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
            {clockedIn ? "Clocked In" : checkOutAt ? "Clocked Out" : "Not Clocked In"}
          </span>
        </div>

        <p className={styles.today}>Today · {formatTodayLabel(today)}</p>
        <div className={styles.statusRow}>
          <div>
            <h2 className={styles.title}>
              {clockedIn ? "Clocked In" : checkOutAt ? "Clocked Out" : "Not Clocked In"}
            </h2>
            <p className={styles.since}>
              {clockInLabel
                ? `Since ${clockInLabel}`
                : `Expected: ${expected}`}
            </p>
          </div>
          <div className={styles.working}>
            <p className={styles.workingLabel}>Working</p>
            <p className={styles.workingValue}>
              {clockedIn && checkInDate
                ? formatWorkingDuration(checkInDate, now)
                : "00h 00m"}
            </p>
          </div>
        </div>

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
        name={user?.name || "Manager"}
        department="Management"
        dateLabel={formatTodayLabel(today)}
        busy={busy}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleClockIn}
      />
    </>
  );
}
