"use client";

import { PageDateLabel } from "@/components/layout/PageDateLabel";
import Link from "next/link";
import { useMemo } from "react";
import {
  Bell,
  CalendarDays,
  CheckSquare2,
  ChevronRight,
  Megaphone,
  ReceiptText,
  Search,
  WalletCards,
} from "lucide-react";
import { NotificationsLink, ProfileLink } from "@/components/layout/PageLinks";
import { useCurrentUser } from "@/components/layout/CurrentUserProvider";
import { useAsyncData } from "@/hooks/useAsyncData";
import { asRecord, employeeApi, listStaffAnnouncements } from "@/lib/api";
import {
  listFrom,
  mapAnnouncement,
  nestedStr,
  num,
  str,
} from "@/lib/api/mappers";
import { employeeStatCards } from "@/data/employeeHome";
import styles from "./EmployeeHomePage.module.css";

function statusClass(status: string) {
  if (status === "Overdue" || status === "Returned") return styles.statusDanger;
  if (status === "Approved" || status === "Paid" || status === "Reimbursed") {
    return styles.statusSuccess;
  }
  if (status === "Pending" || status === "Submitted") return styles.statusPending;
  return styles.statusNeutral;
}

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

function mapTaskStatus(value: unknown): string {
  const raw = str(value).toLowerCase();
  if (raw.includes("overdue")) return "Overdue";
  if (raw.includes("review")) return "In Review";
  if (raw.includes("progress") || raw.includes("active")) return "In Progress";
  if (raw.includes("complete") || raw.includes("done")) return "Completed";
  if (raw.includes("not") || raw.includes("todo") || raw.includes("pending")) {
    return "Not Started";
  }
  return str(value, "Not Started");
}

function SectionTitle({
  icon: Icon,
  children,
  href,
}: {
  icon: typeof CheckSquare2;
  children: React.ReactNode;
  href: string;
}) {
  return (
    <div className={styles.sectionHeader}>
      <h2>
        <Icon size={15} />
        {children}
      </h2>
      <Link href={href}>View all</Link>
    </div>
  );
}

export function EmployeeHomePage() {
  const { user } = useCurrentUser();
  const { data, loading, error } = useAsyncData(
    () =>
      Promise.all([
        employeeApi.dashboard({ previewLimit: 5 }),
        listStaffAnnouncements().catch(() => []),
      ]),
    [],
  );

  const dashboard = asRecord(data?.[0]) ?? {};
  const profile = asRecord(dashboard.profile ?? dashboard.overview);
  const metrics = asRecord(dashboard.metrics ?? dashboard.stats);
  const leave = asRecord(dashboard.leave);
  const expenses = asRecord(dashboard.expenses);

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
      num(metrics.leaveDaysRemaining),
      num(metrics.assignedTasks),
      num(metrics.overdueTasks),
      num(metrics.upcomingMeetings),
      num(metrics.pendingExpenseClaims ?? metrics.expenseClaims),
      num(metrics.reimbursementsWaiting),
    ];
    return employeeStatCards.map((card, index) => ({
      ...card,
      value: String(values[index] ?? 0),
    }));
  }, [metrics]);

  const tasks = listFrom((dashboard.myWork ?? dashboard.tasks) as never).map(
    (record, index) => ({
      id: recordKey(record, index),
      title: str(record.title ?? record.name),
      meta: [
        nestedStr(record.assignedBy ?? record.createdBy, ["name", "fullName"]),
        str(record.due ?? record.dueDate ?? record.due_date)
          ? `Due ${formatShortDate(record.due ?? record.dueDate ?? record.due_date)}`
          : "",
      ]
        .filter(Boolean)
        .join(" · "),
      status: mapTaskStatus(record.status),
    }),
  );

  const meetings = listFrom(
    (dashboard.upcomingMeetings ?? dashboard.meetings) as never,
  ).map((record, index) => ({
    id: recordKey(record, index),
    title: str(record.title ?? record.name),
    meta: [
      formatShortDate(
        record.startAt ?? record.start_at ?? record.date ?? record.scheduledAt,
      ),
      str(record.time) ||
        (record.startAt || record.start_at
          ? new Date(str(record.startAt ?? record.start_at)).toLocaleTimeString(
              "en-US",
              { hour: "numeric", minute: "2-digit" },
            )
          : ""),
      str(record.location ?? record.room),
    ]
      .filter(Boolean)
      .join(" · "),
  }));

  const expenseItems = listFrom(
    (expenses.recentClaims ?? dashboard.expenses) as never,
  )
    .filter((record) => {
      const status = str(record.status).toLowerCase();
      return !status.includes("cancel") && !status.includes("reject");
    })
    .map((record, index) => ({
      id: recordKey(record, index),
      title: str(record.title ?? record.description ?? record.reference),
      status: str(record.status, "Submitted"),
    }));

  const reimbursementItems = listFrom(
    (expenses.recentClaims ?? dashboard.expenses) as never,
  )
    .filter((record) => {
      const status = str(
        record.reimbursementStatus ?? record.reimbursement_status,
      ).toLowerCase();
      return Boolean(status) && status !== "not_required";
    })
    .map((record, index) => ({
      id: recordKey(record, index),
      title: str(record.title ?? record.description ?? record.reference),
      status: str(
        record.reimbursementStatus ?? record.reimbursement_status,
        "Pending",
      ),
    }));

  const leaveRequests = listFrom(
    (leave.recentRequests ?? dashboard.leaveRequests) as never,
  );
  const latestLeave = leaveRequests[0];
  const leaveBalances = listFrom(
    (leave.balances ?? dashboard.leaveBalances) as never,
  ).map((record) => ({
    label: str(record.label ?? record.leaveTypeName ?? record.leave_type_name),
    value: num(record.remainingDays ?? record.remaining_days ?? record.value),
    total: num(record.totalDays ?? record.total_days ?? record.total, 1),
  }));

  const announcements = listFrom(data?.[1] as never)
    .map((record) => mapAnnouncement(record))
    .slice(0, 5);

  const notifications = listFrom(
    (dashboard.notifications ?? dashboard.alerts) as never,
  ).map((record, index) => ({
    id: recordKey(record, index),
    message: str(record.message ?? record.body ?? record.title),
  }));

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
          <Link href="/employee/leave" className={styles.heroButton}>
            Apply for leave <ChevronRight size={14} />
          </Link>
        </div>
      </section>

      <section className={styles.stats} aria-label="Employee summary">
        {stats.map((stat) => (
          <article key={stat.label} className={styles.statCard}>
            <strong>{stat.value}</strong>
            <h2>{stat.label}</h2>
            <p>{stat.hint}</p>
          </article>
        ))}
      </section>

      <div className={styles.dashboardGrid}>
        <div className={styles.mainColumn}>
          <section className={styles.card}>
            <SectionTitle icon={CheckSquare2} href="/employee/tasks">
              My tasks
            </SectionTitle>
            <div className={styles.rows}>
              {tasks.length === 0 ? (
                <p className={styles.empty}>No tasks assigned.</p>
              ) : (
                tasks.map((task, index) => (
                  <article key={`${task.id}-${index}`} className={styles.row}>
                    <div>
                      <h3>{task.title}</h3>
                      <p>{task.meta}</p>
                    </div>
                    <span className={`${styles.status} ${statusClass(task.status)}`}>
                      {task.status}
                    </span>
                  </article>
                ))
              )}
            </div>
          </section>

          <section className={styles.card}>
            <SectionTitle icon={CalendarDays} href="/employee/meetings">
              Upcoming meetings
            </SectionTitle>
            <div className={styles.rows}>
              {meetings.length === 0 ? (
                <p className={styles.empty}>No upcoming meetings.</p>
              ) : (
                meetings.map((meeting, index) => (
                  <article key={`${meeting.id}-${index}`} className={styles.row}>
                    <div>
                      <h3>{meeting.title}</h3>
                      <p>{meeting.meta}</p>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>

          <div className={styles.splitCards}>
            <section className={styles.card}>
              <SectionTitle icon={ReceiptText} href="/employee/expenses">
                Expense status
              </SectionTitle>
              <div className={styles.rows}>
                {expenseItems.length === 0 ? (
                  <p className={styles.empty}>No expense claims.</p>
                ) : (
                  expenseItems.map((item, index) => (
                    <article
                      key={`expense-${item.id}-${index}`}
                      className={styles.compactRow}
                    >
                      <span>{item.title}</span>
                      <span className={`${styles.status} ${statusClass(item.status)}`}>
                        {item.status}
                      </span>
                    </article>
                  ))
                )}
              </div>
            </section>

            <section className={styles.card}>
              <SectionTitle icon={WalletCards} href="/employee/reimbursements">
                Reimbursement status
              </SectionTitle>
              <div className={styles.rows}>
                {reimbursementItems.length === 0 ? (
                  <p className={styles.empty}>No reimbursements.</p>
                ) : (
                  reimbursementItems.map((item, index) => (
                    <article
                      key={`reimbursement-${item.id}-${index}`}
                      className={styles.compactRow}
                    >
                      <span>{item.title}</span>
                      <span className={`${styles.status} ${statusClass(item.status)}`}>
                        {item.status}
                      </span>
                    </article>
                  ))
                )}
              </div>
            </section>
          </div>
        </div>

        <aside className={styles.sideColumn}>
          <section className={styles.card}>
            <SectionTitle icon={CalendarDays} href="/employee/leave">
              Recent leave request
            </SectionTitle>
            {latestLeave ? (
              <div className={styles.leaveRequest}>
                <div className={styles.leaveRequestHeader}>
                  <div>
                    <h3>
                      {str(
                        latestLeave.leaveTypeName ??
                          latestLeave.leave_type_name ??
                          latestLeave.type,
                        "Leave",
                      )}
                    </h3>
                    <p>
                      {[
                        formatShortDate(
                          latestLeave.startDate ?? latestLeave.start_date,
                        ),
                        formatShortDate(
                          latestLeave.endDate ?? latestLeave.end_date,
                        ),
                      ]
                        .filter(Boolean)
                        .join(" – ")}
                    </p>
                  </div>
                  <span className={`${styles.status} ${styles.statusPending}`}>
                    {str(latestLeave.status, "Pending")}
                  </span>
                </div>
                <Link href="/employee/leave">Track status →</Link>
              </div>
            ) : (
              <p className={styles.empty}>No leave requests yet.</p>
            )}
          </section>

          <section className={styles.card}>
            <SectionTitle icon={CalendarDays} href="/employee/leave">
              Leave balance
            </SectionTitle>
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
          </section>

          <section className={styles.card}>
            <SectionTitle icon={Megaphone} href="/employee/announcements">
              Announcements
            </SectionTitle>
            <div className={styles.rows}>
              {announcements.length === 0 ? (
                <p className={styles.empty}>No announcements.</p>
              ) : (
                announcements.map((item) => (
                  <article key={item.id} className={styles.row}>
                    <div>
                      <h3>{item.title}</h3>
                      <p>
                        {item.source} · {item.date}
                      </p>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>

          <section className={styles.card}>
            <SectionTitle icon={Bell} href="/employee/notifications">
              Notifications
            </SectionTitle>
            <div className={styles.rows}>
              {notifications.length === 0 ? (
                <p className={styles.empty}>No notifications.</p>
              ) : (
                notifications.map((item, index) => (
                  <article
                    key={`notification-${item.id}-${index}`}
                    className={styles.notification}
                  >
                    <span aria-hidden />
                    <p>{item.message}</p>
                  </article>
                ))
              )}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
