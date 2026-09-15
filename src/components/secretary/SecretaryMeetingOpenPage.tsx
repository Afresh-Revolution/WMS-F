"use client";

import { useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, Bell, CalendarDays, MapPin, Search, Users, Video } from "lucide-react";
import { NotificationsLink, ProfileLink } from "@/components/layout/PageLinks";
import { useAsyncData } from "@/hooks/useAsyncData";
import { secretaryApi } from "@/lib/api";
import {
  avatarColor,
  initials,
  listFrom,
  nestedStr,
  str,
} from "@/lib/api/mappers";
import {
  managedMeetings as fallbackMeetings,
  type ManagedMeeting,
  type MeetingAudience,
  type MeetingPerson,
} from "@/data/secretary";
import styles from "./SecretaryMeetingOpenPage.module.css";

function parseDay(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
}

function durationLabel(duration: string): string {
  const mins = duration.replace(/m(in)?s?$/i, "").trim() || duration;
  return `${mins} min`;
}

function whenLine(meeting: ManagedMeeting): string {
  const stamp = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parseDay(meeting.date));
  return `${stamp} · ${meeting.time} - ${durationLabel(meeting.duration)}`;
}

function mapAudience(value: unknown, fallback: MeetingAudience): MeetingAudience {
  const raw = str(value).toLowerCase();
  if (raw.includes("hod")) return "For HOD";
  if (raw.includes("admin")) return "For Admin";
  return fallback;
}

function mapPeople(value: unknown, fallback: MeetingPerson[]): MeetingPerson[] {
  const records = listFrom((value ?? undefined) as never);
  if (records.length === 0) return fallback;
  return records.map((record, index) => {
    const name = str(
      record.name,
      nestedStr(record.user ?? record.attendee, ["name", "fullName"], fallback[index]?.name ?? "Guest"),
    );
    return {
      id: str(record.id, fallback[index]?.id ?? String(index)),
      name,
      initials: str(record.initials, fallback[index]?.initials ?? initials(name)),
      avatarColor: str(
        record.avatarColor,
        fallback[index]?.avatarColor ?? avatarColor(name),
      ),
    };
  });
}

function mapMeeting(
  record: Record<string, unknown>,
  fallback: ManagedMeeting,
): ManagedMeeting {
  const location = str(record.location ?? record.place, fallback.location);
  const people = mapPeople(
    record.people ?? record.attendeesList ?? record.attendees,
    fallback.people ?? [],
  );
  const agendaRecords = listFrom((record.agenda as never) ?? undefined);
  const agenda =
    agendaRecords.length > 0
      ? agendaRecords.map((item) => str(item.title ?? item.name ?? item))
      : Array.isArray(record.agenda)
        ? (record.agenda as unknown[]).map((item) => String(item))
        : fallback.agenda ?? [];

  return {
    ...fallback,
    title: str(record.title ?? record.name, fallback.title),
    date: str(
      record.start ?? record.startAt ?? record.date ?? record.day,
      fallback.date,
    ).slice(0, 10),
    when: str(record.when, fallback.when),
    time: str(record.time, fallback.time),
    duration: str(record.duration, fallback.duration),
    location,
    virtual:
      Boolean(record.virtual) ||
      location.toLowerCase().includes("virtual") ||
      fallback.virtual,
    attendees: people.length || fallback.attendees,
    audience: mapAudience(record.audience ?? record.for, fallback.audience),
    organiser: nestedStr(
      record.organiser ?? record.organizer ?? record.createdBy,
      ["name", "fullName"],
      fallback.organiser ?? "",
    ),
    virtualLink: str(
      record.virtualLink ?? record.meetingLink ?? record.link,
      fallback.virtualLink ?? "",
    ),
    reminder: str(record.reminder, fallback.reminder ?? "15 min before"),
    people,
    agenda,
  };
}

export function SecretaryMeetingOpenPage({ id }: { id: string }) {
  const searchRef = useRef<HTMLInputElement>(null);
  const fallback = fallbackMeetings.find((item) => item.id === id) ?? null;

  const { data, loading, error } = useAsyncData(
    () => secretaryApi.getMeeting(id),
    [id],
  );

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const meeting = useMemo((): ManagedMeeting | null => {
    const record =
      data && typeof data === "object" ? (data as Record<string, unknown>) : null;
    if (!record) return fallback;
    const template = fallback ?? fallbackMeetings[0];
    if (!template) return null;
    return mapMeeting(record, { ...template, id });
  }, [data, fallback]);

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <p className={styles.dateLabel}>Monday, August 3</p>
        {loading ? <p className={styles.dateLabel}>Loading meeting…</p> : null}
        {error ? (
          <p className={styles.dateLabel} role="alert">
            Using cached meeting — {error}
          </p>
        ) : null}
        <div className={styles.topActions}>
          <label className={styles.search}>
            <Search size={15} className={styles.searchIcon} />
            <input
              ref={searchRef}
              type="search"
              placeholder="Search"
              className={styles.searchInput}
            />
            <kbd className={styles.shortcut}>⌘ K</kbd>
          </label>
          <NotificationsLink className={styles.iconButton}>
            <span className={styles.notifDot} aria-hidden />
            <Bell size={16} />
          </NotificationsLink>
          <ProfileLink className={styles.avatarChip}>GB</ProfileLink>
        </div>
      </div>

      <Link href="/secretary/meetings" className={styles.backLink}>
        <ArrowLeft size={16} />
        Back to meetings
      </Link>

      {!meeting ? (
        <p className={styles.empty}>This meeting could not be found.</p>
      ) : (
        <>
          <div className={styles.overview}>
            <div className={styles.tags}>
              <span className={styles.audience}>{meeting.audience}</span>
              <span className={styles.whenTag}>{meeting.when}</span>
            </div>
            <h1 className={styles.title}>{meeting.title}</h1>
            <p className={styles.organiser}>
              Organised by {meeting.organiser ?? "Admin"}
            </p>

            <div className={styles.facts}>
              <article className={styles.fact}>
                <p className={styles.factLabel}>
                  <CalendarDays size={13} />
                  When
                </p>
                <p className={styles.factValue}>{whenLine(meeting)}</p>
              </article>
              <article className={styles.fact}>
                <p className={styles.factLabel}>
                  <MapPin size={13} />
                  Location
                </p>
                <p className={styles.factValue}>
                  {meeting.location &&
                  meeting.location.toLowerCase() !== "virtual"
                    ? meeting.location
                    : "—"}
                </p>
              </article>
              <article className={styles.fact}>
                <p className={styles.factLabel}>
                  <Video size={13} />
                  Virtual link
                </p>
                <p className={styles.factValue}>
                  {meeting.virtualLink ? (
                    <a
                      href={meeting.virtualLink}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Join call
                    </a>
                  ) : (
                    "—"
                  )}
                </p>
              </article>
              <article className={styles.fact}>
                <p className={styles.factLabel}>
                  <Bell size={13} />
                  Reminder
                </p>
                <p className={styles.factValue}>
                  {meeting.reminder ?? "15 min before"}
                </p>
              </article>
            </div>
          </div>

          <div className={styles.layout}>
            <section className={styles.card}>
              <h2 className={styles.agendaTitle}>Agenda</h2>
              {(meeting.agenda ?? []).length === 0 ? (
                <p className={styles.empty}>No agenda items yet.</p>
              ) : (
                <ol className={styles.agenda}>
                  {(meeting.agenda ?? []).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ol>
              )}
            </section>

            <section className={styles.card}>
              <h2 className={styles.cardTitle}>
                <Users size={16} />
                Attendees
              </h2>
              <ul className={styles.people}>
                {(meeting.people ?? []).map((person) => (
                  <li key={person.id} className={styles.person}>
                    <span
                      className={styles.avatar}
                      style={{ background: person.avatarColor }}
                    >
                      {person.initials}
                    </span>
                    {person.name}
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
