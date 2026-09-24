"use client";

import { PageDateLabel } from "@/components/layout/PageDateLabel";
import { useMemo } from "react";
import {
  CalendarClock,
  Clock3,
  MapPin,
  Search,
  UserRound,
} from "lucide-react";
import { NotificationsLink, ProfileLink } from "@/components/layout/PageLinks";
import { useCurrentUser } from "@/components/layout/CurrentUserProvider";
import { useAsyncData } from "@/hooks/useAsyncData";
import { employeeApi } from "@/lib/api";
import { listFrom, nestedStr, num, str } from "@/lib/api/mappers";
import type { EmployeeMeeting } from "@/data/employeeHome";
import styles from "./EmployeeMeetingsPage.module.css";

function formatWhen(value: unknown): string {
  const raw = str(value);
  if (!raw) return "";
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return raw;
  return date.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

function relativeDue(value: unknown): string {
  const date = new Date(str(value));
  if (Number.isNaN(date.getTime())) return "";
  const diff = Math.round(
    (date.setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)) /
      (24 * 60 * 60 * 1000),
  );
  if (diff === 0) return "today";
  if (diff === 1) return "in 1d";
  if (diff > 1) return `in ${diff}d`;
  if (diff === -1) return "yesterday";
  return `${Math.abs(diff)}d ago`;
}

function mapMeeting(
  record: Record<string, unknown>,
  index: number,
): EmployeeMeeting {
  const start = record.startAt ?? record.start_at ?? record.date ?? record.scheduledAt;
  const end = record.endAt ?? record.end_at;
  const minutes =
    start && end
      ? Math.max(
          0,
          Math.round(
            (new Date(str(end)).getTime() - new Date(str(start)).getTime()) /
              60000,
          ),
        )
      : num(record.durationMinutes ?? record.duration);
  return {
    id: str(record.id, String(index + 1)),
    title: str(record.title ?? record.name),
    date: formatWhen(start),
    duration: minutes ? `${minutes} min` : "",
    location: str(record.location ?? record.room, "TBD"),
    organiser: nestedStr(
      record.organizer ?? record.organiser ?? record.organizerName,
      ["name", "fullName"],
      str(record.organizerName ?? record.organizer_name),
    ),
    due: relativeDue(start),
  };
}

export function EmployeeMeetingsPage() {
  const { user } = useCurrentUser();
  const { data, loading, error } = useAsyncData(
    () => employeeApi.meetings.list({ limit: 50 }),
    [],
  );

  const meetings = useMemo(() => {
    const records = listFrom((data ?? undefined) as never);
    return records.map((record, index) => mapMeeting(record, index));
  }, [data]);

  return (
    <div className={styles.page}>
      <header className={styles.topBar}>
        <PageDateLabel />
        {loading ? <p className={styles.empty}>Loading meetings…</p> : null}
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

      <div className={styles.heading}>
        <p>My meetings</p>
        <h1>Your schedule</h1>
        <span>Meetings you&apos;ve been invited to.</span>
      </div>

      <section className={styles.meetingGrid} aria-label="Upcoming meetings">
        {meetings.length === 0 ? (
          <p className={styles.empty}>No meetings scheduled.</p>
        ) : (
          meetings.map((meeting) => (
            <article key={meeting.id} className={styles.meetingCard}>
              <div className={styles.cardHeading}>
                <h2>{meeting.title}</h2>
                {meeting.due ? <span>{meeting.due}</span> : null}
              </div>
              <ul>
                {meeting.date ? (
                  <li>
                    <CalendarClock size={13} />
                    {meeting.date}
                  </li>
                ) : null}
                {meeting.duration ? (
                  <li>
                    <Clock3 size={13} />
                    {meeting.duration}
                  </li>
                ) : null}
                <li>
                  <MapPin size={13} />
                  {meeting.location}
                </li>
                {meeting.organiser ? (
                  <li>
                    <UserRound size={13} />
                    Organised by {meeting.organiser}
                  </li>
                ) : null}
              </ul>
            </article>
          ))
        )}
      </section>
    </div>
  );
}
