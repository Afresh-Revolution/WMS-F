"use client";

import { PageDateLabel } from "@/components/layout/PageDateLabel";
import {
  CalendarClock,
  Clock3,
  MapPin,
  Search,
  UserRound,
} from "lucide-react";
import { NotificationsLink, ProfileLink } from "@/components/layout/PageLinks";
import { employeeProfile } from "@/data/employeeHome";
import { useAsyncData } from "@/hooks/useAsyncData";
import { employeeApi } from "@/lib/api";
import { listFrom, str } from "@/lib/api/mappers";
import styles from "./EmployeeMeetingsPage.module.css";

const meetings = [
  {
    title: "Sprint planning",
    date: "11 Aug · 10:00",
    duration: "60 min",
    location: "Meeting Room A",
    organiser: "Nina Patel",
    due: "in 1d",
  },
  {
    title: "Onboarding design review",
    date: "12 Aug · 14:00",
    duration: "45 min",
    location: "Zoom",
    organiser: "Grace Lin",
    due: "in 2d",
  },
  {
    title: "1:1 with Nina",
    date: "13 Aug · 16:00",
    duration: "30 min",
    location: "Meeting Room C",
    organiser: "Nina Patel",
    due: "in 3d",
  },
  {
    title: "Mid-year all-hands",
    date: "15 Aug · 11:00",
    duration: "60 min",
    location: "Event Hall",
    organiser: "David Okoye",
    due: "in 5d",
  },
] as const;

export function EmployeeMeetingsPage() {
  const { data } = useAsyncData(
    () => employeeApi.meetings.list({ limit: 50 }).catch(() => []),
    [],
  );
  const liveMeetings = listFrom(data ?? undefined).map((row) => ({
    title: str(row.title ?? row.name, "Meeting"),
    date: str(row.startAt ?? row.start_at ?? row.scheduledAt ?? row.date, "—"),
    duration: str(row.duration ?? row.durationMinutes, "—"),
    location: str(row.location ?? row.room ?? row.venue, "—"),
    organiser: str(row.organiser ?? row.organizer ?? row.createdByName, "—"),
    due: str(row.status, ""),
  }));
  const rows = liveMeetings.length ? liveMeetings : meetings;

  return (
    <div className={styles.page}>
      <header className={styles.topBar}>
        <PageDateLabel />
        <div className={styles.topActions}>
          <label className={styles.search}>
            <Search size={14} />
            <input aria-label="Search" placeholder="Search" readOnly />
            <kbd>⌘ K</kbd>
          </label>
          <NotificationsLink className={styles.iconButton} />
          <ProfileLink className={styles.profileButton}>
            {employeeProfile.initials}
          </ProfileLink>
        </div>
      </header>

      <div className={styles.heading}>
        <p>My meetings</p>
        <h1>Your schedule</h1>
        <span>Meetings you&apos;ve been invited to.</span>
      </div>

      <section className={styles.meetingGrid} aria-label="Upcoming meetings">
        {rows.map((meeting) => (
          <article key={meeting.title} className={styles.meetingCard}>
            <div className={styles.cardHeading}>
              <h2>{meeting.title}</h2>
              <span>{meeting.due}</span>
            </div>
            <ul>
              <li>
                <CalendarClock size={13} />
                {meeting.date}
              </li>
              <li>
                <Clock3 size={13} />
                {meeting.duration}
              </li>
              <li>
                <MapPin size={13} />
                {meeting.location}
              </li>
              <li>
                <UserRound size={13} />
                Organised by {meeting.organiser}
              </li>
            </ul>
          </article>
        ))}
      </section>
    </div>
  );
}
