"use client";

import { useState } from "react";
import { MapPin } from "lucide-react";
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

export function GpsCheckInCard({
  portal,
}: {
  portal: CheckInPortal;
}) {
  const { runAction } = usePageActions();
  const [busy, setBusy] = useState(false);
  const { data, loading, error, refetch } = useAsyncData(
    () => loadStatus(portal),
    [portal],
  );

  if (data == null && !loading) return null;

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

  return (
    <section className={styles.card}>
      <AccountantStatusLine
        loading={loading}
        error={error}
        resource="GPS check-in"
      />
      <div className={styles.header}>
        <span className={styles.icon} aria-hidden>
          <MapPin size={16} />
        </span>
        <div>
          <h2 className={styles.title}>GPS check-in</h2>
          <p className={styles.copy}>
            {checkInWindow?.alreadyCheckedIn
              ? "You have already checked in for this schedule today."
              : `Assigned location: ${checkInWindow?.locationName ?? "loading…"}. The server decides if you are inside the site.`}
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
