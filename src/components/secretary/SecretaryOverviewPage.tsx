"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef } from "react";
import {
  Bell,
  CalendarDays,
  CalendarRange,
  Check,
  Clock,
  ListTodo,
  Mail,
  MapPin,
  Search,
  X,
} from "lucide-react";
import { NotificationsLink, ProfileLink } from "@/components/layout/PageLinks";
import { usePageActions } from "@/hooks/usePageActions";
import { useAsyncData } from "@/hooks/useAsyncData";
import { secretaryApi } from "@/lib/api";
import { avatarColor, initials, listFrom, str } from "@/lib/api/mappers";
import {
  failedEmailCreations as fallbackFailed,
  managementCalendar as fallbackCalendar,
  overdueTasks as fallbackTasks,
  pendingEmailRequests as fallbackPending,
  recentlyCreatedEmails as fallbackCreated,
  secretaryStats as fallbackStats,
  todaysMeetings as fallbackToday,
  upcomingMeetings as fallbackUpcoming,
  upcomingReminders as fallbackReminders,
  type CalendarGroup,
  type CreatedEmail,
  type EmailRequest,
  type FailedEmail,
  type ManagementTask,
  type SecretaryMeeting,
  type SecretaryReminder,
  type SecretaryStat,
} from "@/data/secretary";
import styles from "./SecretaryOverviewPage.module.css";

export function SecretaryOverviewPage() {
  const { runAction } = usePageActions();
  const searchRef = useRef<HTMLInputElement>(null);

  const { data, loading, error } = useAsyncData(
    () => secretaryApi.getDashboard(),
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

  const overview = (data ?? {}) as Record<string, unknown>;

  const stats = useMemo((): SecretaryStat[] => {
    const cards = listFrom(
      (overview.stats ?? overview.cards ?? overview.summary) as never,
    );
    if (cards.length === 0) return fallbackStats;
    return cards.map((card, index) => ({
      id: str(card.id, fallbackStats[index]?.id ?? String(index)),
      value: str(card.value ?? card.count, fallbackStats[index]?.value),
      label: str(card.label ?? card.title, fallbackStats[index]?.label),
      tag: str(card.tag ?? card.badge, fallbackStats[index]?.tag),
    }));
  }, [overview]);

  const pendingRequests = useMemo((): EmailRequest[] => {
    const source = overview.pendingEmailRequests ?? overview.emailRequests;
    const records = listFrom(source as never);
    if (source === undefined) return fallbackPending;
    return records.map((record) => {
      const name = str(record.name ?? record.employeeName);
      return {
        id: str(record.id),
        name,
        initials: str(record.initials, initials(name)),
        avatarColor: str(record.avatarColor, avatarColor(name)),
        role: str(record.role ?? record.jobTitle),
        email: str(record.email),
        requestId: str(record.requestId ?? record.code, str(record.id)),
      };
    });
  }, [overview]);

  const failedEmails = useMemo((): FailedEmail[] => {
    const source = overview.failedEmailCreations ?? overview.failedEmails;
    const records = listFrom(source as never);
    if (source === undefined) return fallbackFailed;
    return records.map((record) => {
      const name = str(record.name ?? record.employeeName);
      return {
        id: str(record.id),
        name,
        initials: str(record.initials, initials(name)),
        avatarColor: str(record.avatarColor, avatarColor(name)),
        reason: str(record.reason ?? record.message ?? record.error),
      };
    });
  }, [overview]);

  const todaysMeetings = useMemo((): SecretaryMeeting[] => {
    const source = overview.todaysMeetings ?? overview.meetingsToday;
    const records = listFrom(source as never);
    if (source === undefined) return fallbackToday;
    return records.map((record) => ({
      id: str(record.id),
      title: str(record.title ?? record.name),
      time: str(record.time),
      audience: str(record.audience ?? record.audienceLabel),
      location: str(record.location ?? record.room) || undefined,
    }));
  }, [overview]);

  const upcomingMeetings = useMemo((): SecretaryMeeting[] => {
    const source = overview.upcomingMeetings ?? overview.upcoming;
    const records = listFrom(source as never);
    if (source === undefined) return fallbackUpcoming;
    return records.map((record) => ({
      id: str(record.id),
      title: str(record.title ?? record.name),
      time: str(record.time),
      when: str(record.when ?? record.relativeDate) || undefined,
      audience: str(record.audience ?? record.audienceLabel),
    }));
  }, [overview]);

  const overdueTasks = useMemo((): ManagementTask[] => {
    const source = overview.overdueTasks ?? overview.tasks;
    const records = listFrom(source as never);
    if (source === undefined) return fallbackTasks;
    return records.map((record) => ({
      id: str(record.id),
      title: str(record.title ?? record.name),
      audience: str(record.audience ?? record.audienceLabel),
      overdue: str(record.overdue ?? record.due),
    }));
  }, [overview]);

  const reminders = useMemo((): SecretaryReminder[] => {
    const source = overview.reminders ?? overview.upcomingReminders;
    const records = listFrom(source as never);
    if (source === undefined) return fallbackReminders;
    return records.map((record) => ({
      id: str(record.id),
      title: str(record.title ?? record.name),
      detail: str(record.detail ?? record.description),
      due: Boolean(record.due ?? record.isDue),
    }));
  }, [overview]);

  const calendar = useMemo((): CalendarGroup[] => {
    const source = overview.calendar ?? overview.managementCalendar;
    const records = listFrom(source as never);
    if (source === undefined) return fallbackCalendar;
    return records.map((record, index) => ({
      id: str(record.id, String(index)),
      label: str(record.label ?? record.title),
      items: listFrom((record.items ?? record.events) as never).map(
        (item, itemIndex) => ({
          id: str(item.id, String(itemIndex)),
          date: str(item.date),
          title: str(item.title ?? item.name),
          time: str(item.time),
        }),
      ),
    }));
  }, [overview]);

  const createdEmails = useMemo((): CreatedEmail[] => {
    const source = overview.recentlyCreatedEmails ?? overview.createdEmails;
    const records = listFrom(source as never);
    if (source === undefined) return fallbackCreated;
    return records.map((record) => {
      const name = str(record.name);
      return {
        id: str(record.id),
        name,
        initials: str(record.initials, initials(name)),
        avatarColor: str(record.avatarColor, avatarColor(name)),
        email: str(record.email),
        status: str(record.status, "active") === "pending" ? "pending" : "active",
      };
    });
  }, [overview]);

  function retryFailed() {
    const target = failedEmails[0];
    void runAction("Retry failed email creation", async () => {
      if (!target) return;
      await secretaryApi.retryEmail(target.id);
    });
  }

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <p className={styles.dateLabel}>Monday, August 3</p>
        {loading ? <p className={styles.dateLabel}>Loading overview…</p> : null}
        {error ? (
          <p className={styles.dateLabel} role="alert">
            Using cached overview — {error}
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
          <NotificationsLink className={styles.iconButton} />
          <ProfileLink className={styles.avatarChip}>GB</ProfileLink>
        </div>
      </div>

      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <p className={styles.heroEyebrow}>Secretary / Operations support</p>
          <h1 className={styles.heroTitle}>The calendar is ready.</h1>
          <p className={styles.heroSubtitle}>
            2 email requests waiting, 1 failed, 2 meetings today, 1 task overdue.
          </p>
          <Link href="/secretary/email-requests" className={styles.heroButton}>
            Open email queue →
          </Link>
        </div>
        <div className={styles.heroDecoration} aria-hidden="true">
          <div className={styles.heroDecorationInner} />
        </div>
      </section>

      <div className={styles.statsRow}>
        {stats.map((stat) => (
          <article key={stat.id} className={styles.statCard}>
            <p className={styles.statValue}>{stat.value}</p>
            <p className={styles.statLabel}>{stat.label}</p>
            <span className={styles.statTag}>{stat.tag}</span>
          </article>
        ))}
      </div>

      <div className={styles.widgetGrid}>
        <section className={styles.card}>
          <h2 className={styles.cardTitle}>
            <Mail size={16} />
            Pending email requests
          </h2>
          <div className={styles.list}>
            {pendingRequests.map((request) => (
              <article key={request.id} className={styles.personRow}>
                <span
                  className={styles.avatar}
                  style={{ background: request.avatarColor }}
                >
                  {request.initials}
                </span>
                <div className={styles.personBody}>
                  <p className={styles.personName}>{request.name}</p>
                  <p className={styles.personMeta}>
                    {request.role} — {request.email}
                  </p>
                </div>
                <span className={styles.idChip}>{request.requestId}</span>
              </article>
            ))}
          </div>
          <Link href="/secretary/email-requests" className={styles.cardLink}>
            Open request queue →
          </Link>
        </section>

        <section className={styles.card}>
          <h2 className={styles.cardTitle}>
            <X size={16} />
            Failed email creations
          </h2>
          <div className={styles.list}>
            {failedEmails.map((failed) => (
              <article key={failed.id} className={styles.failedRow}>
                <div className={styles.failedHead}>
                  <span
                    className={styles.avatar}
                    style={{ background: failed.avatarColor }}
                  >
                    {failed.initials}
                  </span>
                  <p className={styles.personName}>{failed.name}</p>
                  <span className={styles.dangerTag}>Failed</span>
                </div>
                <p className={styles.failedReason}>{failed.reason}</p>
              </article>
            ))}
          </div>
          <button type="button" className={styles.cardLink} onClick={retryFailed}>
            Retry failed →
          </button>
        </section>

        <section className={styles.card}>
          <h2 className={styles.cardTitle}>
            <CalendarDays size={16} />
            Today&apos;s meetings
          </h2>
          <div className={styles.list}>
            {todaysMeetings.map((meeting) => (
              <article key={meeting.id} className={styles.meetingRow}>
                <span className={styles.timeBadge}>{meeting.time}</span>
                <div className={styles.meetingBody}>
                  <p className={styles.personName}>{meeting.title}</p>
                  <div className={styles.meetingMeta}>
                    <span className={styles.softTag}>{meeting.audience}</span>
                    {meeting.location ? (
                      <span className={styles.location}>
                        <MapPin size={12} />
                        {meeting.location}
                      </span>
                    ) : null}
                  </div>
                </div>
              </article>
            ))}
          </div>
          <Link href="/secretary/meetings" className={styles.cardLink}>
            View all meetings →
          </Link>
        </section>

        <section className={styles.card}>
          <h2 className={styles.cardTitle}>
            <CalendarRange size={16} />
            Upcoming meetings
          </h2>
          <div className={styles.list}>
            {upcomingMeetings.map((meeting) => (
              <article key={meeting.id} className={styles.upcomingRow}>
                <div className={styles.personBody}>
                  <p className={styles.personName}>{meeting.title}</p>
                  <p className={styles.personMeta}>
                    {meeting.when} — {meeting.time}
                  </p>
                </div>
                <span className={styles.softTag}>{meeting.audience}</span>
              </article>
            ))}
          </div>
          <Link href="/secretary/meetings" className={styles.cardLink}>
            View all meetings →
          </Link>
        </section>

        <section className={styles.card}>
          <h2 className={styles.cardTitle}>
            <ListTodo size={16} />
            Overdue management tasks
          </h2>
          <div className={styles.list}>
            {overdueTasks.map((task) => (
              <article key={task.id} className={styles.taskRow}>
                <div className={styles.personBody}>
                  <p className={styles.personName}>{task.title}</p>
                  <p className={styles.personMeta}>
                    {task.audience} — {task.overdue}
                  </p>
                </div>
                <span className={styles.dangerTag}>Overdue</span>
              </article>
            ))}
          </div>
          <Link href="/secretary/tasks" className={styles.cardLink}>
            Open task board →
          </Link>
        </section>

        <section className={styles.card}>
          <h2 className={styles.cardTitle}>
            <Bell size={16} />
            Upcoming reminders
          </h2>
          <div className={styles.list}>
            {reminders.map((reminder) => (
              <article key={reminder.id} className={styles.reminderRow}>
                <span className={styles.reminderIcon}>
                  <Clock size={14} />
                </span>
                <div className={styles.personBody}>
                  <p className={styles.personName}>{reminder.title}</p>
                  <p className={styles.personMeta}>{reminder.detail}</p>
                </div>
                {reminder.due ? <span className={styles.dueTag}>Due</span> : null}
              </article>
            ))}
          </div>
          <Link href="/secretary/reminders" className={styles.cardLink}>
            Manage reminders →
          </Link>
        </section>
      </div>

      <div className={styles.bottomRow}>
        <section className={styles.card}>
          <div className={styles.cardHead}>
            <h2 className={styles.cardTitle}>
              <CalendarRange size={16} />
              Management calendar
            </h2>
            <Link href="/secretary/calendar" className={styles.inlineLink}>
              Open calendar →
            </Link>
          </div>
          <div className={styles.calendarList}>
            {calendar.map((group) => (
              <div key={group.id} className={styles.calendarGroup}>
                <p className={styles.calendarLabel}>{group.label}</p>
                {group.items.map((item) => (
                  <article key={item.id} className={styles.calendarRow}>
                    <span className={styles.calendarDate}>{item.date}</span>
                    <span className={styles.calendarTitle}>{item.title}</span>
                    <span className={styles.calendarTime}>{item.time}</span>
                  </article>
                ))}
              </div>
            ))}
          </div>
        </section>

        <section className={styles.card}>
          <h2 className={styles.cardTitle}>
            <Mail size={16} />
            Recently created emails
          </h2>
          <div className={styles.list}>
            {createdEmails.map((person) => (
              <article key={person.id} className={styles.createdRow}>
                <span
                  className={styles.avatar}
                  style={{ background: person.avatarColor }}
                >
                  {person.initials}
                </span>
                <div className={styles.personBody}>
                  <p className={styles.personName}>{person.name}</p>
                  <p className={styles.personMeta}>{person.email}</p>
                </div>
                {person.status === "active" ? (
                  <span className={styles.statusOk} aria-label="Active">
                    <Check size={12} />
                  </span>
                ) : (
                  <span className={styles.statusPending} aria-label="Pending" />
                )}
              </article>
            ))}
          </div>
          <Link href="/secretary/email-directory" className={styles.cardLink}>
            Open directory →
          </Link>
        </section>
      </div>
    </div>
  );
}
