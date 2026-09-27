"use client";

import { PageDateLabel } from "@/components/layout/PageDateLabel";
import Link from "next/link";
import { useEffect, useMemo, useRef } from "react";
import {
  ArrowRight,
  CalendarDays,
  CalendarRange,
  Check,
  Clock,
  Mail,
  MapPin,
  Search,
} from "lucide-react";
import { NotificationsLink, ProfileLink } from "@/components/layout/PageLinks";
import { usePageActions } from "@/hooks/usePageActions";
import { useAsyncData } from "@/hooks/useAsyncData";
import { secretaryApi } from "@/lib/api";
import { avatarColor, initials, listFrom, num, str } from "@/lib/api/mappers";
import {
  secretaryStatCards,
  todayKey,
  type CreatedEmail,
  type EmailRequest,
  type FailedEmail,
  type SecretaryMeeting,
  type SecretaryStat,
} from "@/data/secretary";
import styles from "./SecretaryOverviewPage.module.css";

function parseDay(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
}

function whenFromDate(date: string): string {
  if (!date) return "";
  const event = parseDay(date);
  if (Number.isNaN(event.getTime())) return date;
  const today = parseDay(todayKey());
  const diff = Math.round(
    (event.getTime() - today.getTime()) / (24 * 60 * 60 * 1000),
  );
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff > 1) return `In ${diff} days`;
  if (diff === -1) return "Yesterday";
  return `${Math.abs(diff)} days ago`;
}

function formatTime(value: unknown): string {
  const raw = str(value);
  if (!raw) return "";
  if (/AM|PM/i.test(raw) && !raw.includes("T")) return raw;
  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime()) && (/T/.test(raw) || raw.includes("-"))) {
    return parsed.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  }
  const [hours, minutes] = raw.split(":").map(Number);
  if (!Number.isFinite(hours)) return raw;
  const meridian = hours >= 12 ? "PM" : "AM";
  const hour = ((hours + 11) % 12) + 1;
  return `${hour}:${String(minutes ?? 0).padStart(2, "0")} ${meridian}`;
}

function dateFromRecord(record: Record<string, unknown>): string {
  return str(
    record.date ?? record.startAt ?? record.start_at ?? record.start ?? record.day,
  ).slice(0, 10);
}

function mapAudience(value: unknown): string {
  const raw = str(value);
  if (!raw) return "";
  if (/hod/i.test(raw)) return "For HOD";
  if (/admin/i.test(raw)) return "For Admin";
  return raw;
}

function mapMeeting(record: Record<string, unknown>): SecretaryMeeting {
  const date = dateFromRecord(record);
  const location = str(record.location ?? record.room ?? record.place);
  const virtual =
    Boolean(record.virtual) ||
    Boolean(record.meetingLink) ||
    location.toLowerCase().includes("virtual") ||
    location.toLowerCase().includes("online");
  return {
    id: str(record.id),
    title: str(record.title ?? record.name),
    time: formatTime(
      record.time ?? record.startAt ?? record.start_at ?? record.start,
    ),
    when: str(record.when ?? record.relativeDate, whenFromDate(date)) || undefined,
    audience: mapAudience(
      record.audience ?? record.audienceLabel ?? record.for,
    ),
    location: [location, virtual && !/virtual/i.test(location) ? "Virtual" : ""]
      .filter(Boolean)
      .join(" · ") || undefined,
  };
}

function mailboxStatus(value: unknown): string {
  const raw = str(value).toLowerCase();
  if (raw.includes("deactiv") && raw.includes("pending")) return "pending";
  if (raw.includes("suspend") || raw.includes("hold")) return "suspended";
  if (raw.includes("deactiv")) return "deactivated";
  return "active";
}

function isWithinDays(value: unknown, days: number) {
  const raw = str(value);
  const parsed = new Date(raw);
  if (!raw || Number.isNaN(parsed.getTime())) return false;
  return Date.now() - parsed.getTime() <= days * 24 * 60 * 60 * 1000;
}

export function SecretaryOverviewPage() {
  const { runAction } = usePageActions();
  const searchRef = useRef<HTMLInputElement>(null);

  const { data, loading, error } = useAsyncData(
    () =>
      Promise.all([
        secretaryApi.getDashboard().catch(() => ({})),
        secretaryApi.listEmailDirectory().catch(() => []),
        secretaryApi.listCalendar().catch(() => []),
        secretaryApi.listMeetings().catch(() => []),
        secretaryApi.listTasks().catch(() => []),
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

  const [dashboard, directory, calendarPayload, meetingsPayload, tasksPayload] =
    data ?? [null, null, null, null, null];
  const overview = (dashboard ?? {}) as Record<string, unknown>;
  const dashboardStats = (overview.stats ?? {}) as Record<string, unknown>;

  const mailboxes = useMemo(
    () =>
      (Array.isArray(directory)
        ? directory
        : listFrom((directory ?? undefined) as never)) as Record<
        string,
        unknown
      >[],
    [directory],
  );

  const allMeetings = useMemo(() => {
    const seen = new Set<string>();
    const collect = (
      records: Record<string, unknown>[],
      fallbackWhen?: string,
    ) => {
      const items: SecretaryMeeting[] = [];
      for (const record of records) {
        const meeting = mapMeeting(record);
        const key = meeting.id || meeting.title;
        if (!key || seen.has(key) || !meeting.title) continue;
        seen.add(key);
        items.push({
          ...meeting,
          when: meeting.when || fallbackWhen,
        });
      }
      return items;
    };

    const fromList = Array.isArray(meetingsPayload)
      ? meetingsPayload
      : listFrom((meetingsPayload ?? undefined) as never);

    return [
      ...collect(
        listFrom((overview.todaysMeetings ?? overview.meetingsToday) as never),
        "Today",
      ),
      ...collect(
        listFrom((overview.upcomingMeetings ?? overview.upcoming) as never),
        "Upcoming",
      ),
      ...collect(fromList),
    ];
  }, [meetingsPayload, overview]);

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

  const todaysMeetings = useMemo(
    () => allMeetings.filter((meeting) => meeting.when === "Today"),
    [allMeetings],
  );

  const upcomingMeetings = useMemo(
    () =>
      allMeetings.filter((meeting) => {
        const when = meeting.when ?? "";
        return (
          when === "Tomorrow" ||
          when === "Upcoming" ||
          when.startsWith("In ")
        );
      }),
    [allMeetings],
  );

  const overdueTasks = useMemo(() => {
    const fromDashboard = listFrom(
      (overview.overdueManagementTasks ??
        overview.overdueTasks ??
        overview.tasks) as never,
    );
    const fromList = Array.isArray(tasksPayload)
      ? tasksPayload
      : listFrom((tasksPayload ?? undefined) as never);
    return [...fromDashboard, ...fromList].filter((record) => {
      const status = str(record.status ?? record.column).toLowerCase();
      const due = str(record.overdue ?? record.due ?? record.dueDate ?? record.due_date);
      return (
        Boolean(record.overdue) ||
        due.toLowerCase().includes("overdue") ||
        status.includes("overdue")
      );
    });
  }, [overview, tasksPayload]);

  const calendar = useMemo(() => {
    const records = Array.isArray(calendarPayload)
      ? calendarPayload
      : listFrom((calendarPayload ?? undefined) as never);
    const items = (records.length > 0 ? records : allMeetings.map((meeting) => ({
      id: meeting.id,
      title: meeting.title,
      time: meeting.time,
      date: meeting.when === "Today" ? todayKey() : undefined,
      when: meeting.when,
    }))).map((record, index) => {
      const raw = record as Record<string, unknown>;
      const date = dateFromRecord(raw);
      return {
        id: str(raw.id, String(index)),
        when: str(raw.when, whenFromDate(date) || "Today"),
        title: str(raw.title ?? raw.name),
        time: formatTime(raw.time ?? raw.startAt ?? raw.start_at),
      };
    });
    return items.filter((item) => item.title).slice(0, 6);
  }, [allMeetings, calendarPayload]);

  const createdEmails = useMemo((): CreatedEmail[] => {
    return mailboxes.slice(0, 6).map((record) => {
      const name = str(record.name ?? record.employeeName);
      const status = mailboxStatus(record.status);
      return {
        id: str(record.id),
        name,
        initials: str(record.initials, initials(name)),
        avatarColor: str(record.avatarColor, avatarColor(name)),
        email: str(record.email ?? record.address ?? record.emailAddress),
        status: status === "active" ? "active" : "pending",
      };
    });
  }, [mailboxes]);

  const stats = useMemo((): SecretaryStat[] => {
    const recent = mailboxes.filter((record) =>
      isWithinDays(
        record.createdAt ??
          record.created_at ??
          record.since ??
          record.activeSince ??
          record.activatedAt,
        7,
      ),
    ).length;
    const values: Record<string, number> = {
      pending: num(
        dashboardStats.pendingEmailRequests,
        pendingRequests.length,
      ),
      failed: num(dashboardStats.failedEmailCreations, failedEmails.length),
      created: num(
        dashboardStats.recentlyCreated ?? dashboardStats.recentlyCreatedEmails,
        recent,
      ),
      suspended: num(
        dashboardStats.suspendedEmails,
        mailboxes.filter((record) => mailboxStatus(record.status) === "suspended")
          .length,
      ),
      deactivation: num(
        dashboardStats.awaitingDeactivation,
        mailboxes.filter((record) => mailboxStatus(record.status) === "pending")
          .length,
      ),
    };
    return secretaryStatCards.map((card) => ({
      ...card,
      value: String(values[card.id] ?? 0),
    }));
  }, [
    dashboardStats,
    failedEmails.length,
    mailboxes,
    pendingRequests.length,
  ]);

  const meetingsTodayCount = num(
    dashboardStats.meetingsToday,
    todaysMeetings.length,
  );

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
            {`${stats.find((item) => item.id === "pending")?.value ?? "0"} email requests waiting, ${stats.find((item) => item.id === "failed")?.value ?? "0"} failed, ${meetingsTodayCount} meetings today, ${overdueTasks.length} task${overdueTasks.length === 1 ? "" : "s"} overdue.`}
          </p>
          <Link href="/secretary/email-requests" className={styles.heroButton}>
            Open email queue <ArrowRight size={14} />
          </Link>
        </div>
      </section>

      <div className={styles.statsRow}>
        {stats.map((stat) => (
          <article key={stat.id} className={styles.statCard}>
            <p className={styles.statLabel}>{stat.label}</p>
            <p className={styles.statValue}>{stat.value}</p>
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
            <Mail size={16} />
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
                    {meeting.audience ? (
                      <span className={styles.softTag}>{meeting.audience}</span>
                    ) : null}
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
        </section>

        <section className={styles.card}>
          <h2 className={styles.cardTitle}>
            <Clock size={16} />
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
                    {[meeting.when, meeting.time].filter(Boolean).join(" · ")}
                  </p>
                </div>
                {meeting.audience ? (
                  <span className={styles.softTag}>{meeting.audience}</span>
                ) : null}
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
            {calendar.map((item) => (
              <article key={item.id} className={styles.calendarRow}>
                <span className={styles.calendarDate}>{item.when}</span>
                <span className={styles.calendarTitle}>{item.title}</span>
                <span className={styles.calendarTime}>{item.time}</span>
              </article>
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
                  <p className={styles.personName}>{person.email}</p>
                  <p className={styles.personMeta}>{person.name}</p>
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
