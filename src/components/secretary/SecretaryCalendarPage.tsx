"use client";

import { PageDateLabel } from "@/components/layout/PageDateLabel";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  Bell,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  ListTodo,
  Search,
} from "lucide-react";
import { NotificationsLink, ProfileLink } from "@/components/layout/PageLinks";
import { useAsyncData } from "@/hooks/useAsyncData";
import { secretaryApi } from "@/lib/api";
import { listFrom, str } from "@/lib/api/mappers";
import {
  calendarLegend,
  calendarViews,
  todayKey,
  type CalendarEvent,
  type CalendarEventKind,
  type CalendarView,
} from "@/data/secretary";
import styles from "./SecretaryCalendarPage.module.css";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTH_VISIBLE = 3;

const kindClass: Record<CalendarEventKind, string> = {
  meeting: styles.dotMeeting,
  reminder: styles.dotReminder,
  task: styles.dotTask,
};

const kindIcon: Record<CalendarEventKind, LucideIcon> = {
  meeting: CalendarDays,
  reminder: Clock3,
  task: ListTodo,
};

const kindTag: Record<CalendarEventKind, string> = {
  meeting: styles.tagMeeting,
  reminder: styles.tagReminder,
  task: styles.tagTask,
};

function parseDay(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
}

function toKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function startOfWeek(date: Date): Date {
  const next = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const offset = (next.getDay() + 6) % 7;
  next.setDate(next.getDate() - offset);
  return next;
}

function monthGrid(year: number, month: number): Date[] {
  const start = startOfWeek(new Date(year, month, 1));
  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    return day;
  });
}

function weekDays(anchor: Date): Date[] {
  const start = startOfWeek(anchor);
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    return day;
  });
}

function monthLabel(year: number, month: number): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, month, 1));
}

function weekLabel(start: Date): string {
  const stamp = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(start);
  return `Week of ${stamp}`;
}

function weekdayLabel(date: Date): string {
  return new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(date);
}

function timeMinutes(time?: string): number {
  if (!time) return 24 * 60;
  const match = time.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return 0;
  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const meridian = match[3].toUpperCase();
  if (meridian === "PM" && hours !== 12) hours += 12;
  if (meridian === "AM" && hours === 12) hours = 0;
  return hours * 60 + minutes;
}

function relativeWhen(dateKey: string, today = todayKey()): string {
  const event = parseDay(dateKey);
  const current = parseDay(today);
  const diff = Math.round(
    (event.getTime() - current.getTime()) / (24 * 60 * 60 * 1000),
  );
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  if (diff > 1) return `In ${diff} days`;
  return `${Math.abs(diff)} days ago`;
}

function agendaMeta(event: CalendarEvent): string {
  return [relativeWhen(event.date), event.time, event.audience]
    .filter(Boolean)
    .join(" · ");
}

function mapKind(value: unknown): CalendarEventKind {
  const raw = str(value).toLowerCase();
  if (raw.includes("remind")) return "reminder";
  if (raw.includes("task") || raw.includes("deadline")) return "task";
  return "meeting";
}

function normalizeDate(value: unknown): string {
  const raw = str(value);
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) return toKey(parsed);
  return raw;
}

function normalizeTime(value: unknown): string | undefined {
  const raw = str(value);
  if (!raw) return undefined;
  if (/^\d{1,2}:\d{2}/.test(raw)) return raw;
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function mapEvent(record: Record<string, unknown>, index: number): CalendarEvent {
  const start = record.start ?? record.date ?? record.day;
  return {
    id: str(record.sourceId ?? record.id, String(index)),
    title: str(record.title ?? record.name),
    date: normalizeDate(start),
    kind: mapKind(
      record.sourceType ?? record.type ?? record.kind ?? record.category,
    ),
    time: normalizeTime(record.time ?? start),
    audience: str(record.audience ?? record.for ?? record.stakeholder) || undefined,
    bar: Boolean(record.bar ?? record.filled),
  };
}

function EventRow({ event }: { event: CalendarEvent }) {
  if (event.bar) {
    return (
      <p className={`${styles.eventBar} ${styles.eventBarMeeting}`}>{event.title}</p>
    );
  }
  return (
    <p className={styles.eventRow}>
      <span className={`${styles.dot} ${kindClass[event.kind]}`} aria-hidden />
      <span className={styles.eventTitle}>{event.title}</span>
    </p>
  );
}

function WeekEventCard({ event }: { event: CalendarEvent }) {
  return (
    <article className={styles.weekEvent}>
      {event.time ? <p className={styles.weekTime}>{event.time}</p> : null}
      <p className={styles.weekEventBody}>
        <span className={`${styles.dot} ${kindClass[event.kind]}`} aria-hidden />
        <span>{event.title}</span>
      </p>
    </article>
  );
}

export function SecretaryCalendarPage({
  view = "month",
}: {
  view?: CalendarView;
}) {
  const searchRef = useRef<HTMLInputElement>(null);
  const today = parseDay(todayKey());
  const [cursor, setCursor] = useState(today);

  const { data, loading, error } = useAsyncData(
    () => secretaryApi.listCalendar(),
    [],
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

  const events = useMemo((): CalendarEvent[] => {
    const records = Array.isArray(data)
      ? data
      : listFrom((data ?? undefined) as never);
    return records.map((record, index) => mapEvent(record, index));
  }, [data]);

  const eventsByDate = useMemo(() => {
    const grouped = new Map<string, CalendarEvent[]>();
    for (const event of events) {
      const list = grouped.get(event.date) ?? [];
      list.push(event);
      grouped.set(event.date, list);
    }
    for (const list of grouped.values()) {
      list.sort((a, b) => timeMinutes(a.time) - timeMinutes(b.time));
    }
    return grouped;
  }, [events]);

  const days =
    view === "week"
      ? weekDays(cursor)
      : monthGrid(cursor.getFullYear(), cursor.getMonth());

  const heading =
    view === "week"
      ? weekLabel(days[0] ?? cursor)
      : monthLabel(cursor.getFullYear(), cursor.getMonth());

  const agendaItems = useMemo(() => {
    return events
      .filter((event) => event.date >= todayKey())
      .sort((a, b) => {
        const dateDiff = a.date.localeCompare(b.date);
        if (dateDiff !== 0) return dateDiff;
        return timeMinutes(a.time) - timeMinutes(b.time);
      });
  }, [events]);

  function shift(direction: -1 | 1) {
    setCursor((current) => {
      const next = new Date(current);
      if (view === "week") next.setDate(current.getDate() + direction * 7);
      else next.setMonth(current.getMonth() + direction);
      return next;
    });
  }

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <PageDateLabel className={styles.dateLabel} />
        {loading ? <p className={styles.dateLabel}>Loading calendar…</p> : null}
        {error ? (
          <p className={styles.dateLabel} role="alert">
            {error}
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

      <div className={styles.header}>
        <div>
          <p className={styles.breadcrumb}>Secretary — Management calendar</p>
          <h1 className={styles.title}>Calendar</h1>
          <p className={styles.subtitle}>
            Management meetings, reminders and task deadlines in one shared
            view.
          </p>
          <ul className={styles.legend}>
            {calendarLegend.map((item) => (
              <li key={item.kind}>
                <span className={`${styles.dot} ${kindClass[item.kind]}`} />
                {item.label}
              </li>
            ))}
          </ul>
        </div>
        <div className={styles.viewToggle} role="tablist" aria-label="Calendar view">
          {calendarViews.map((item) => {
            const active = item.id === view;
            return (
              <Link
                key={item.id}
                href={item.href}
                role="tab"
                aria-selected={active}
                className={`${styles.viewChip} ${
                  active ? styles.viewChipActive : ""
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>

      <section className={view === "week" ? styles.weekSection : styles.board}>
        {view === "agenda" ? null : (
          <div className={styles.boardHead}>
            <h2 className={styles.monthTitle}>{heading}</h2>
            <div className={styles.nav}>
              <button
                type="button"
                className={styles.navButton}
                aria-label="Previous"
                onClick={() => shift(-1)}
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                className={styles.todayButton}
                onClick={() => setCursor(today)}
              >
                {view === "week" ? "This week" : "Today"}
              </button>
              <button
                type="button"
                className={styles.navButton}
                aria-label="Next"
                onClick={() => shift(1)}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {view === "agenda" ? (
          <div className={styles.agendaList}>
            {agendaItems.length === 0 ? (
              <p className={styles.empty}>No upcoming agenda items.</p>
            ) : (
              agendaItems.map((event) => {
                const Icon = kindIcon[event.kind];
                return (
                  <article key={event.id} className={styles.agendaRow}>
                    <span className={styles.agendaIcon} aria-hidden>
                      <Icon size={16} />
                    </span>
                    <div className={styles.agendaBody}>
                      <h2 className={styles.agendaTitle}>{event.title}</h2>
                      <p className={styles.agendaMeta}>{agendaMeta(event)}</p>
                    </div>
                    <span className={kindTag[event.kind]}>{event.kind}</span>
                  </article>
                );
              })
            )}
          </div>
        ) : view === "week" ? (
          <div className={styles.weekGrid}>
            {days.map((day) => {
              const key = toKey(day);
              const isToday = key === todayKey();
              const dayEvents = eventsByDate.get(key) ?? [];

              return (
                <article
                  key={key}
                  className={`${styles.weekCol} ${
                    isToday ? styles.weekColToday : ""
                  }`}
                >
                  <header className={styles.weekColHead}>
                    <span className={styles.weekColDay}>
                      {weekdayLabel(day)}
                    </span>
                    <span
                      className={`${styles.weekColDate} ${
                        isToday ? styles.dateToday : ""
                      }`}
                    >
                      {day.getDate()}
                    </span>
                  </header>
                  <div className={styles.weekEvents}>
                    {dayEvents.length === 0 ? (
                      <p className={styles.weekEmpty}>--</p>
                    ) : (
                      dayEvents.map((event) => (
                        <WeekEventCard key={event.id} event={event} />
                      ))
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <>
            <div className={styles.weekdays}>
              {WEEKDAYS.map((day) => (
                <p key={day} className={styles.weekday}>
                  {day}
                </p>
              ))}
            </div>
            <div className={styles.grid}>
              {days.map((day) => {
                const key = toKey(day);
                const inMonth = day.getMonth() === cursor.getMonth();
                const isToday = key === todayKey();
                const dayEvents = eventsByDate.get(key) ?? [];
                const visible = dayEvents.slice(0, MONTH_VISIBLE);
                const overflow = dayEvents.length - visible.length;

                return (
                  <article
                    key={key}
                    className={`${styles.cell} ${
                      isToday ? styles.cellToday : ""
                    } ${!inMonth ? styles.cellMuted : ""}`}
                  >
                    <p
                      className={`${styles.dateNum} ${
                        isToday ? styles.dateToday : ""
                      }`}
                    >
                      {day.getDate()}
                    </p>
                    <div className={styles.events}>
                      {visible.map((event) => (
                        <EventRow key={event.id} event={event} />
                      ))}
                      {overflow > 0 ? (
                        <p className={styles.more}>+{overflow} more</p>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
