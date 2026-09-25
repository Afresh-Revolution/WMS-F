"use client";

import { PageDateLabel } from "@/components/layout/PageDateLabel";
import Link from "next/link";
import { useEffect, useMemo, useRef } from "react";
import {
  ArrowRight,
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
import { avatarColor, initials, listFrom, num, str } from "@/lib/api/mappers";
import {
  secretaryStatCards,
  type CalendarGroup,
  type CreatedEmail,
  type EmailRequest,
  type FailedEmail,
  type ManagementTask,
  type SecretaryMeeting,
  type SecretaryReminder,
  type SecretaryStat,
} from "@/data/secretary";
import { SecretaryOverviewClockCard } from "@/components/secretary/SecretaryOverviewClockCard";
import styles from "./SecretaryOverviewPage.module.css";

export function SecretaryOverviewPage() {
  const { runAction } = usePageActions();
  const searchRef = useRef<HTMLInputElement>(null);

  const { data, loading, error } = useAsyncData(
    () =>
      Promise.all([
        secretaryApi.getDashboard(),
        secretaryApi.listEmailDirectory({ limit: 8 }),
        secretaryApi.listCalendar(),
      ]),
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

  const [dashboard, directory, calendarPayload] = data ?? [null, null, null];
  const overview = (dashboard ?? {}) as Record<string, unknown>;
  const dashboardStats = (overview.stats ?? {}) as Record<string, unknown>;

  const stats = useMemo((): SecretaryStat[] => {
    const values: Record<string, number> = {
      pending: num(dashboardStats.pendingEmailRequests),
      failed: num(dashboardStats.failedEmailCreations),
      today: num(dashboardStats.meetingsToday),
      review: num(dashboardStats.awaitingReview),
      upcoming: num(dashboardStats.upcomingEmailRequests),
    };
    return secretaryStatCards.map((card) => ({
      ...card,
      value: String(values[card.id] ?? 0),
    }));
  }, [dashboardStats]);

  const pendingRequests = useMemo((): EmailRequest[] => {
    return listFrom(
      (overview.pendingEmailRequests ?? overview.emailRequests) as never,
    ).map((record) => {
      const name = str(record.name ?? record.employeeName);
      return {
        id: str(record.id),
        name,
        initials: str(record.initials, initials(name)),
        avatarColor: str(record.avatarColor, avatarColor(name)),
        role: str(record.role ?? record.jobTitle),
        email: str(record.email ?? record.requestedEmail ?? record.requested_email),
        requestId: str(record.requestId ?? record.code, str(record.id)),
      };
    });
  }, [overview]);

  const failedEmails = useMemo((): FailedEmail[] => {
    return listFrom(
      (overview.failedEmailCreations ?? overview.failedEmails) as never,
    ).map((record) => {
      const name = str(record.name ?? record.employeeName);
      return {
        id: str(record.id),
        name,
        initials: str(record.initials, initials(name)),
        avatarColor: str(record.avatarColor, avatarColor(name)),
        reason: str(
          record.reason ??
            record.failureReason ??
            record.failure_reason ??
            record.message ??
            record.error,
        ),
      };
    });
  }, [overview]);

  const todaysMeetings = useMemo((): SecretaryMeeting[] => {
    return listFrom(
      (overview.todaysMeetings ?? overview.meetingsToday) as never,
    ).map((record) => ({
      id: str(record.id),
      title: str(record.title ?? record.name),
      time: str(
        record.time,
        record.startAt ?? record.start_at
          ? new Date(str(record.startAt ?? record.start_at)).toLocaleTimeString(
              "en-US",
              { hour: "numeric", minute: "2-digit" },
            )
          : "",
      ),
      audience: str(record.audience ?? record.audienceLabel ?? record.organizerName),
      location: str(record.location ?? record.room) || undefined,
    }));
  }, [overview]);

  const upcomingMeetings = useMemo((): SecretaryMeeting[] => {
    return listFrom(
      (overview.upcomingMeetings ?? overview.upcoming) as never,
    ).map((record) => ({
      id: str(record.id),
      title: str(record.title ?? record.name),
      time: str(
        record.time,
        record.startAt ?? record.start_at
          ? new Date(str(record.startAt ?? record.start_at)).toLocaleTimeString(
              "en-US",
              { hour: "numeric", minute: "2-digit" },
            )
          : "",
      ),
      when: str(record.when ?? record.relativeDate ?? record.date) || undefined,
      audience: str(record.audience ?? record.audienceLabel ?? record.organizerName),
    }));
  }, [overview]);

  const overdueTasks = useMemo((): ManagementTask[] => {
    return listFrom(
      (overview.overdueManagementTasks ??
        overview.overdueTasks ??
        overview.tasks) as never,
    ).map((record) => ({
      id: str(record.id),
      title: str(record.title ?? record.name),
      audience: str(record.audience ?? record.audienceLabel),
      overdue: str(record.overdue ?? record.due ?? record.dueDate ?? record.due_date),
    }));
  }, [overview]);

  const reminders = useMemo((): SecretaryReminder[] => {
    return listFrom(
      (overview.upcomingReminders ?? overview.reminders) as never,
    ).map((record) => ({
      id: str(record.id),
      title: str(record.title ?? record.name),
      detail: str(record.detail ?? record.description ?? record.relatedItem),
      due: Boolean(record.due ?? record.isDue),
    }));
  }, [overview]);

  const calendar = useMemo((): CalendarGroup[] => {
    const records = Array.isArray(calendarPayload)
      ? calendarPayload
      : listFrom((calendarPayload ?? undefined) as never);
    const groups = new Map<string, CalendarGroup>();
    for (const record of records) {
      const date = str(record.date ?? record.startAt ?? record.start_at).slice(0, 10);
      if (!date) continue;
      const group = groups.get(date) ?? {
        id: date,
        label: date,
        items: [],
      };
      group.items.push({
        id: str(record.id, `${date}-${group.items.length}`),
        date,
        title: str(record.title ?? record.name),
        time: str(record.time),
      });
      groups.set(date, group);
    }
    return [...groups.values()].slice(0, 3);
  }, [calendarPayload]);

  const createdEmails = useMemo((): CreatedEmail[] => {
    const records = Array.isArray(directory)
      ? directory
      : listFrom((directory ?? undefined) as never);
    return records.slice(0, 6).map((record) => {
      const name = str(record.name ?? record.employeeName);
      return {
        id: str(record.id),
        name,
        initials: str(record.initials, initials(name)),
        avatarColor: str(record.avatarColor, avatarColor(name)),
        email: str(record.email ?? record.address ?? record.emailAddress),
        status: str(record.status).toLowerCase().includes("pending")
          ? "pending"
          : "active",
      };
    });
  }, [directory]);

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
        <PageDateLabel className={styles.dateLabel} />
        {loading ? <p className={styles.dateLabel}>Loading overview…</p> : null}
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
          <NotificationsLink className={styles.iconButton} />
          <ProfileLink className={styles.avatarChip}>GB</ProfileLink>
        </div>
      </div>

      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <p className={styles.heroEyebrow}>Secretary · Operations support</p>
          <h1 className={styles.heroTitle}>The calendar is ready.</h1>
          <p className={styles.heroSubtitle}>
            {`${stats.find((item) => item.id === "pending")?.value ?? "0"} email requests waiting, ${stats.find((item) => item.id === "failed")?.value ?? "0"} failed, ${stats.find((item) => item.id === "today")?.value ?? "0"} meetings today, ${overdueTasks.length} task${overdueTasks.length === 1 ? "" : "s"} overdue.`}
          </p>
          <Link href="/secretary/email-requests" className={styles.heroButton}>
            Open email queue <ArrowRight size={14} />
          </Link>
        </div>
      </section>

      <SecretaryOverviewClockCard />

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
            {pendingRequests.length === 0 ? (
              <p className={styles.empty}>No pending email requests.</p>
            ) : null}
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
            {failedEmails.length === 0 ? (
              <p className={styles.empty}>No failed email creations.</p>
            ) : null}
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
            {todaysMeetings.length === 0 ? (
              <p className={styles.empty}>No meetings today.</p>
            ) : null}
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
            {upcomingMeetings.length === 0 ? (
              <p className={styles.empty}>No upcoming meetings.</p>
            ) : null}
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
            {reminders.length === 0 ? (
              <p className={styles.empty}>No upcoming reminders.</p>
            ) : null}
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
            {calendar.length === 0 ? (
              <p className={styles.empty}>No calendar items yet.</p>
            ) : null}
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
            {createdEmails.length === 0 ? (
              <p className={styles.empty}>No company emails yet.</p>
            ) : null}
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
