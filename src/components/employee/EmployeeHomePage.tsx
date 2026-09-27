"use client";

import { PageDateLabel } from "@/components/layout/PageDateLabel";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  Bell,
  CalendarDays,
  CheckSquare2,
  ChevronRight,
  Clock,
  Mail,
  Megaphone,
  Receipt,
  Search,
} from "lucide-react";
import { NotificationsLink, ProfileLink } from "@/components/layout/PageLinks";
import { useCurrentUser } from "@/components/layout/CurrentUserProvider";
import { SimpleModal } from "@/components/ui/SimpleModal";
import { useAsyncData } from "@/hooks/useAsyncData";
import { usePageActions } from "@/hooks/usePageActions";
import {
  asRecord,
  employeeApi,
  listLeaveBalances,
  listStaffAnnouncements,
  publishStaffAnnouncement,
} from "@/lib/api";
import { listFrom, mapAnnouncement, nestedStr, num, str } from "@/lib/api/mappers";
import { employeeStatCards } from "@/data/employeeHome";
import styles from "./EmployeeHomePage.module.css";

const createAnnouncementFields = [
  {
    name: "title",
    label: "Title",
    required: true,
    fullWidth: true,
    placeholder: "Announcement title",
  },
  {
    name: "category",
    label: "Category",
    type: "select" as const,
    required: true,
    fullWidth: true,
    defaultValue: "General",
    options: [
      { label: "General", value: "General" },
      { label: "HR", value: "HR" },
      { label: "Finance", value: "Finance" },
      { label: "Urgent", value: "Urgent" },
    ],
  },
  {
    name: "audienceType",
    label: "Audience",
    type: "select" as const,
    required: true,
    fullWidth: true,
    defaultValue: "all_staff",
    options: [{ label: "All staff", value: "all_staff" }],
  },
  {
    name: "message",
    label: "Message",
    type: "textarea" as const,
    required: true,
    fullWidth: true,
    rows: 4,
    placeholder: "Write your announcement...",
  },
  {
    name: "isPinned",
    label: "Pin this announcement",
    type: "checkbox" as const,
    defaultValue: "false",
  },
];

function firstNameFrom(name: string) {
  return name.split(/\s+/).filter(Boolean)[0] || name;
}

function recordKey(record: Record<string, unknown>, index: number) {
  const id = str(record.id ?? record.reference ?? record.uuid).trim();
  const label = str(
    record.title ?? record.description ?? record.name,
  ).trim();
  if (id && id !== label) return `${id}-${index}`;
  return `row-${index}`;
}

function formatShortDate(value: unknown): string {
  const raw = str(value);
  if (!raw) return "";
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return raw;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function dueBadge(due: unknown, status: unknown): "Due soon" | "Overdue" | "" {
  const rawStatus = str(status).toLowerCase();
  const date = new Date(str(due));
  const valid = !Number.isNaN(date.getTime());
  const diff = valid
    ? Math.round(
        (date.setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)) /
          86_400_000,
      )
    : null;
  if (rawStatus.includes("overdue") || (diff !== null && diff < 0)) {
    return "Overdue";
  }
  if (diff !== null && diff <= 7) return "Due soon";
  return "";
}

function formatMeetingWhen(value: unknown, time?: unknown) {
  const raw = str(value);
  const parsed = new Date(raw);
  const clock =
    str(time) ||
    (!Number.isNaN(parsed.getTime())
      ? parsed.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
        })
      : "");
  if (Number.isNaN(parsed.getTime())) {
    return [raw, clock].filter(Boolean).join(" · ");
  }
  const day = parsed.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  return [day, clock].filter(Boolean).join(" · ");
}

function meetingLocation(record: Record<string, unknown>) {
  const location = str(record.location ?? record.room ?? record.place);
  const platform = str(
    record.platform ?? record.provider ?? record.virtualProvider,
  );
  const virtual =
    Boolean(record.virtual) ||
    Boolean(record.meetingLink ?? record.virtualLink) ||
    /virtual|meet|zoom|teams/i.test(`${location} ${platform}`);
  if (virtual) {
    if (/virtual/i.test(location) && location.includes("(")) return location;
    return platform ? `Virtual (${platform})` : location || "Virtual";
  }
  return location;
}

function sortLeaveBalances(
  items: { label: string; value: number; total: number }[],
) {
  const order = ["annual", "sick", "personal"];
  return [...items]
    .sort((a, b) => {
      const ai = order.findIndex((key) => a.label.toLowerCase().includes(key));
      const bi = order.findIndex((key) => b.label.toLowerCase().includes(key));
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    })
    .slice(0, 3);
}

export function EmployeeHomePage() {
  const { user } = useCurrentUser();
  const { runAction } = usePageActions();
  const [createOpen, setCreateOpen] = useState(false);
  const { data, loading, error, refetch } = useAsyncData(
    () =>
      Promise.all([
        employeeApi.dashboard({ previewLimit: 5 }).catch(() => ({})),
        employeeApi.tasks
          .list()
          .catch(() => employeeApi.tasks.assigned().catch(() => [])),
        listLeaveBalances().catch(() => []),
        employeeApi.meetings
          .list()
          .catch(() => employeeApi.meetings.schedule().catch(() => [])),
        employeeApi.announcements
          .list()
          .catch(() => listStaffAnnouncements().catch(() => [])),
      ]),
    [],
  );

  const dashboard = asRecord(data?.[0]) ?? {};
  const profile = asRecord(dashboard.profile ?? dashboard.overview);
  const metrics = asRecord(dashboard.metrics ?? dashboard.stats);
  const leave = asRecord(dashboard.leave);

  const displayName =
    str(profile.fullName ?? profile.name, user?.name || "") || "there";
  const email = str(profile.email ?? profile.companyEmail, user?.email || "");
  const role = [
    str(profile.jobTitle ?? profile.position ?? profile.role),
    nestedStr(profile.department, ["name", "title"]),
  ]
    .filter(Boolean)
    .join(" · ");

  const stats = useMemo(() => {
    const values = [
      num(metrics.leaveDaysRemaining ?? leave.daysRemaining ?? leave.annualLeaveDays),
      num(metrics.assignedTasks ?? metrics.openTasks),
      num(metrics.upcomingMeetings),
      num(metrics.pendingExpenseClaims ?? metrics.expenseClaims),
    ];
    return employeeStatCards.map((card, index) => ({
      ...card,
      value: String(values[index] ?? 0),
    }));
  }, [leave, metrics]);

  const tasks = useMemo(() => {
    const fromDashboard = listFrom(
      (dashboard.myWork ?? dashboard.tasks) as never,
    );
    const fromList = listFrom((data?.[1] ?? undefined) as never);
    const merged = fromDashboard.length > 0 ? fromDashboard : fromList;
    return merged.slice(0, 3).map((record, index) => {
      const due = record.due ?? record.dueDate ?? record.due_date;
      const badge = dueBadge(due, record.status);
      return {
        id: recordKey(record, index),
        title: str(record.title ?? record.name),
        meta: [
          str(
            record.category ??
              record.project ??
              record.group ??
              nestedStr(record.assignedBy ?? record.createdBy, [
                "name",
                "fullName",
              ]),
          ),
          due ? `Due ${formatShortDate(due)}` : "",
        ]
          .filter(Boolean)
          .join(" · "),
        badge,
      };
    });
  }, [dashboard, data]);

  const leaveBalances = useMemo(() => {
    const fromDashboard = listFrom(
      (leave.balances ?? dashboard.leaveBalances) as never,
    );
    const fromApi = listFrom((data?.[2] ?? undefined) as never);
    const records = fromDashboard.length > 0 ? fromDashboard : fromApi;
    return sortLeaveBalances(
      records.map((record) => ({
        label: str(
          record.label ?? record.leaveTypeName ?? record.leave_type_name,
        ),
        value: num(
          record.remainingDays ?? record.remaining_days ?? record.value,
        ),
        total: num(
          record.totalDays ??
            record.total_days ??
            record.allocatedDays ??
            record.allocated_days ??
            record.total,
          1,
        ),
      })),
    );
  }, [dashboard.leaveBalances, data, leave.balances]);

  const meetings = useMemo(() => {
    const fromDashboard = listFrom(
      (dashboard.upcomingMeetings ?? dashboard.meetings) as never,
    );
    const fromList = listFrom((data?.[3] ?? undefined) as never);
    const records = fromDashboard.length > 0 ? fromDashboard : fromList;
    return records.slice(0, 2).map((record, index) => ({
      id: recordKey(record, index),
      title: str(record.title ?? record.name),
      when: formatMeetingWhen(
        record.startAt ?? record.start_at ?? record.date ?? record.scheduledAt,
        record.time,
      ),
      location: meetingLocation(record),
    }));
  }, [dashboard, data]);

  const announcements = useMemo(() => {
    const fromDashboard = listFrom(
      (dashboard.announcements ?? dashboard.alerts) as never,
    );
    const fromList = listFrom((data?.[4] ?? undefined) as never);
    const records = fromDashboard.length > 0 ? fromDashboard : fromList;
    return records.slice(0, 2).map((record) => {
      const item = mapAnnouncement(record);
      return {
        id: item.id,
        title: item.title,
        source: item.source,
        date: item.date,
      };
    });
  }, [dashboard, data]);

  async function handleCreateAnnouncement(values: Record<string, string>) {
    await runAction("Publish announcement", async () => {
      await publishStaffAnnouncement({
        title: values.title.trim(),
        message: values.message.trim(),
        category: values.category,
        audienceType: values.audienceType || "all_staff",
        isPinned: values.isPinned,
        status: "published",
        author: user?.name ?? "",
        initials: user?.initials ?? "",
      });
      refetch();
    });
  }

  return (
    <div className={styles.page}>
      <header className={styles.topBar}>
        <PageDateLabel />
        {loading ? <p className={styles.eyebrow}>Loading workspace…</p> : null}
        {error ? (
          <p className={styles.eyebrow} role="alert">
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

      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <p className={styles.eyebrow}>Employee · Personal workspace</p>
          <h1>Good morning, {firstNameFrom(displayName)}.</h1>
          <p>{role || "Employee"}</p>
          <p>{email}</p>
          <Link href="/employee/leave?apply=1" className={styles.heroButton}>
            Apply for leave <ChevronRight size={14} />
          </Link>
        </div>
      </section>

      <section className={styles.stats} aria-label="Employee summary">
        {stats.map((stat) => (
          <article key={stat.label} className={styles.statCard}>
            <h2>{stat.label}</h2>
            <div className={styles.statRow}>
              <strong>{stat.value}</strong>
              <p>{stat.hint}</p>
            </div>
          </article>
        ))}
      </section>

      <div className={styles.board}>
        <div className={styles.boardCol}>
          <section className={styles.card}>
            <div className={`${styles.sectionHeader} ${styles.sectionHeaderLined}`}>
              <h2>
                <CheckSquare2 size={16} />
                My tasks
              </h2>
              <Link href="/employee/tasks">View all</Link>
            </div>
            <div className={styles.taskList}>
              {tasks.length === 0 ? (
                <p className={styles.empty}>No tasks assigned.</p>
              ) : (
                tasks.map((task) => (
                  <Link
                    key={task.id}
                    href="/employee/tasks"
                    className={styles.taskRow}
                  >
                    <span className={styles.taskCheck} aria-hidden />
                    <div className={styles.taskBody}>
                      <h3>{task.title}</h3>
                      {task.meta ? <p>{task.meta}</p> : null}
                    </div>
                    {task.badge ? (
                      <span
                        className={`${styles.taskBadge} ${
                          task.badge === "Overdue"
                            ? styles.taskBadgeOverdue
                            : styles.taskBadgeSoon
                        }`}
                      >
                        {task.badge}
                      </span>
                    ) : null}
                    <ChevronRight size={16} className={styles.taskChevron} />
                  </Link>
                ))
              )}
            </div>
          </section>

          <section className={`${styles.card} ${styles.meetingsCard}`}>
            <div className={`${styles.sectionHeader} ${styles.sectionHeaderLined}`}>
              <h2>
                <CalendarDays size={16} />
                Upcoming meetings
              </h2>
              <Link href="/employee/meetings">View all</Link>
            </div>
            <div className={styles.meetingList}>
              {meetings.length === 0 ? (
                <p className={styles.empty}>No upcoming meetings.</p>
              ) : (
                meetings.map((meeting) => (
                  <article key={meeting.id} className={styles.meetingRow}>
                    <h3>{meeting.title}</h3>
                    {meeting.when ? (
                      <p className={styles.meetingWhen}>
                        <Clock size={13} />
                        {meeting.when}
                      </p>
                    ) : null}
                    {meeting.location ? (
                      <p className={styles.meetingPlace}>{meeting.location}</p>
                    ) : null}
                  </article>
                ))
              )}
            </div>
          </section>
        </div>

        <div className={styles.boardCol}>
          <section className={styles.card}>
            <div className={styles.leaveHead}>
              <h2>Leave balance</h2>
              <p>{new Date().getFullYear()} entitlements</p>
            </div>
            <div className={styles.balanceList}>
              {leaveBalances.length === 0 ? (
                <p className={styles.empty}>No leave balances yet.</p>
              ) : (
                leaveBalances.map((balance) => (
                  <div key={balance.label} className={styles.balance}>
                    <div>
                      <span>{balance.label}</span>
                      <strong>{balance.value} left</strong>
                    </div>
                    <div className={styles.meter}>
                      <span
                        style={{
                          width: `${Math.min(
                            100,
                            (balance.value / Math.max(balance.total, 1)) * 100,
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
            <Link href="/employee/leave?apply=1" className={styles.applyLeave}>
              Apply for leave
            </Link>
          </section>

          <section className={styles.card}>
            <div className={`${styles.sectionHeader} ${styles.sectionHeaderLined}`}>
              <h2>
                <Bell size={16} />
                Announcements
              </h2>
              <button
                type="button"
                onClick={() => setCreateOpen(true)}
              >
                New announcement
              </button>
            </div>
            <div className={styles.announcementList}>
              {announcements.length === 0 ? (
                <p className={styles.empty}>No announcements.</p>
              ) : (
                announcements.map((item) => (
                  <article key={item.id} className={styles.announcementRow}>
                    <h3>{item.title}</h3>
                    <p>
                      {[item.source, item.date].filter(Boolean).join(" · ")}
                    </p>
                  </article>
                ))
              )}
            </div>
            <Link href="/employee/announcements" className={styles.cardLink}>
              All announcements →
            </Link>
          </section>

          <section className={styles.card}>
            <div className={styles.leaveHead}>
              <h2>Quick actions</h2>
            </div>
            <div className={styles.quickActions}>
              <Link href="/employee/leave?apply=1" className={styles.quickAction}>
                <span>
                  <CalendarDays size={16} />
                  Apply for leave
                </span>
                <ArrowRight size={16} />
              </Link>
              <Link href="/employee/expenses" className={styles.quickAction}>
                <span>
                  <Receipt size={16} />
                  Submit expense claim
                </span>
                <ArrowRight size={16} />
              </Link>
              <Link href="/employee/profile" className={styles.quickAction}>
                <span>
                  <Mail size={16} />
                  View my profile
                </span>
                <ArrowRight size={16} />
              </Link>
            </div>
          </section>
        </div>
      </div>

      <SimpleModal
        open={createOpen}
        title="New announcement"
        fields={createAnnouncementFields}
        submitLabel="Publish"
        submitIcon={<Megaphone size={15} strokeWidth={2.25} />}
        showClose
        appearance="soft"
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreateAnnouncement}
      />
    </div>
  );
}
