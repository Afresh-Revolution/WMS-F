"use client";

import { useState } from "react";
import { ArrowRight, CalendarDays } from "lucide-react";
import { AccountantStatusLine } from "@/components/accountant/AccountantStatusLine";
import { useAsyncData } from "@/hooks/useAsyncData";
import { usePageActions } from "@/hooks/usePageActions";
import {
  accountantApi,
  accountantSettled,
  attendanceApi,
  attendanceSettled,
  internApi,
  internSettled,
} from "@/lib/api";
import { mapCheckInWindow } from "@/lib/api/attendanceMappers";
import type { GpsCheckInBody } from "@/lib/api/attendance";
import { getClientTimeZone } from "@/lib/pageDate";
import styles from "./GpsCheckInCard.module.css";

type CheckInPortal = "me" | "intern" | "accountant";

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

async function loadStatus(portal: CheckInPortal) {
  if (portal === "intern") return internSettled(internApi.attendance.status());
  if (portal === "accountant") {
    return accountantSettled(accountantApi.attendance.status());
  }
  return attendanceSettled(attendanceApi.me.status());
}

async function submitCheckIn(portal: CheckInPortal, body: GpsCheckInBody) {
  if (portal === "intern") {
    return internApi.attendance.checkIn(body, body.idempotencyKey);
  }
  if (portal === "accountant") {
    return accountantApi.attendance.checkIn(body, body.idempotencyKey);
  }
  return attendanceApi.checkIn(body, body.idempotencyKey);
}

function formatExpectedTime(value: string) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime()) && /T|\d{4}-/.test(value)) {
    return parsed.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  }
  const [hours, minutes] = value.split(":");
  const hour = Number(hours);
  if (!Number.isFinite(hour)) return value;
  const suffix = hour >= 12 ? "PM" : "AM";
  return `${hour % 12 || 12}:${(minutes || "00").slice(0, 2)} ${suffix}`;
}

function formatTodayLabel(date = new Date()) {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: getClientTimeZone(),
  });
}

export function GpsCheckInCard({
  portal,
  variant = "compact",
}: {
  portal: CheckInPortal;
  variant?: "compact" | "desk";
}) {
  const { runAction } = usePageActions();
  const [busy, setBusy] = useState(false);
  const { data, loading, error, refetch } = useAsyncData(
    () => loadStatus(portal),
    [portal],
  );

  if (data == null && !loading && variant !== "desk") return null;

  const checkInWindow = data ? mapCheckInWindow(data) : null;
  const canCheckIn =
    Boolean(checkInWindow?.canCheckIn) && !checkInWindow?.alreadyCheckedIn;

  async function handleCheckIn() {
    if (busy) return;
    setBusy(true);
    try {
      await runAction("Check in", async () => {
        const gps = await readGps();
        const idempotencyKey =
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
        await submitCheckIn(portal, {
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
        });
        refetch();
      }, "Check-in recorded");
    } finally {
      setBusy(false);
    }
  }

  const clockedIn = Boolean(checkInWindow?.alreadyCheckedIn);
  const statusLabel = clockedIn ? "Clocked In" : "Not Clocked In";
  const expected = formatExpectedTime(checkInWindow?.openingTime ?? "");

  if (variant === "desk") {
    return (
      <section className={styles.deskCard}>
        <AccountantStatusLine
          loading={loading}
          error={error}
          resource="attendance"
        />
        <div className={styles.deskHead}>
          <p className={styles.deskEyebrow}>
            <CalendarDays size={14} />
            Attendance
          </p>
          <span
            className={`${styles.deskBadge} ${clockedIn ? styles.deskBadgeOk : ""}`}
          >
            {statusLabel}
          </span>
        </div>
        <p className={styles.deskToday}>Today : {formatTodayLabel()}</p>
        <h2 className={styles.deskTitle}>{statusLabel}</h2>
        <p className={styles.deskExpected}>Expected: {expected}</p>
        <button
          type="button"
          className={styles.deskButton}
          disabled={!canCheckIn || busy || loading || clockedIn}
          onClick={() => void handleCheckIn()}
        >
          <ArrowRight size={16} />
          {busy ? "Clocking in…" : "Clock In"}
        </button>
      </section>
    );
  }

  return (
    <section className={styles.card}>
      <AccountantStatusLine
        loading={loading}
        error={error}
        resource="GPS check-in"
      />
      <div className={styles.header}>
        <span className={styles.icon} aria-hidden>
          <CalendarDays size={16} />
        </span>
        <div>
          <h2 className={styles.title}>GPS check-in</h2>
          <p className={styles.copy}>
            {clockedIn
              ? "You have already checked in for this schedule today."
              : `Your browser only sends GPS. The server measures distance to ${checkInWindow?.locationName || "the assigned office pin"}. Remote/Onsite on your profile is not a geofence.`}
          </p>
        </div>
      </div>
      <button
        type="button"
        className={styles.button}
        disabled={!canCheckIn || busy || loading}
        onClick={() => void handleCheckIn()}
      >
        {busy ? "Checking in…" : "Check in"}
      </button>
    </section>
  );
}
