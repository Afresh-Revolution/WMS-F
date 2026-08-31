"use client";

<<<<<<< HEAD
import { useState } from "react";
import Link from "next/link";
import {
  Bell,
  Calendar,
  Check,
  FlaskConical,
  MapPin,
  Megaphone,
  Search,
=======
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  BookOpen,
  Check,
  Gift,
  Headphones,
  KeyRound,
  MoreVertical,
  Search,
  Shield,
  UserPlus,
  X,
>>>>>>> 37eb1224d5b2fc1ab1c618b51d1c98ba658180c9
} from "lucide-react";
import { NotificationsLink, ProfileLink } from "@/components/layout/PageLinks";
import { usePageActions } from "@/hooks/usePageActions";
import {
<<<<<<< HEAD
  internAccounts,
  type InternAccountId,
  type InternTaskStatus,
} from "@/data/internHome";
=======
  companyResources,
  departmentPerformance as fallbackDeptPerformance,
  employeesByDepartment as fallbackEmployeesByDept,
  leaveRequests as fallbackLeaveRequests,
  overviewItems as fallbackOverviewItems,
  recentActivity as fallbackRecentActivity,
  stats as fallbackStats,
  type LeaveRequest,
  type LeaveStatus,
} from "@/data/dashboard";
import { useAsyncData } from "@/hooks/useAsyncData";
import { dashboardApi, hrApi } from "@/lib/api";
import { avatarColor, initials, listFrom, num, str } from "@/lib/api/mappers";
>>>>>>> 37eb1224d5b2fc1ab1c618b51d1c98ba658180c9
import styles from "./DashboardPage.module.css";

const statusClass: Record<InternTaskStatus, string> = {
  "In Progress": styles.statusInProgress,
  Overdue: styles.statusOverdue,
  "Not Started": styles.statusNotStarted,
  "In Review": styles.statusInReview,
};

<<<<<<< HEAD
export function DashboardPage() {
  const [accountId, setAccountId] = useState<InternAccountId>("nysc");
  const account = internAccounts.find((item) => item.id === accountId) ?? internAccounts[0];
  const unreadCount = account.notifications.filter((item) => item.unread).length;

  return (
    <AppShell
      variant="intern"
      user={{
        name: account.name,
        initials: account.initials,
        role: account.sidebarRole,
      }}
    >
      <div className={styles.page}>
        <div className={styles.topBar}>
          <p className={styles.dateLabel}>Monday, August 17</p>
=======
const resourceIcons = {
  handbook: BookOpen,
  benefits: Gift,
  support: Headphones,
  policy: Shield,
} as const;

const resourceLinks: Record<(typeof companyResources)[number]["icon"], string> = {
  handbook: "/help",
  benefits: "/help",
  support: "/help",
  policy: "/leave",
};

export function DashboardPage() {
  const { runAction } = usePageActions();
  const [leaveMenuId, setLeaveMenuId] = useState<string | null>(null);

  const { data, loading, error, refetch } = useAsyncData(
    () => dashboardApi.overview(),
    [],
  );

  function approveLeave(id: string, name: string) {
    void runAction(`Approve ${name}'s leave`, async () => {
      await hrApi.leave.approve(id);
      setLeaveMenuId(null);
      refetch();
    });
  }

  function rejectLeave(id: string, name: string) {
    void runAction(`Decline ${name}'s leave`, async () => {
      await hrApi.leave.reject(id);
      setLeaveMenuId(null);
      refetch();
    });
  }

  const dashboardStats = useMemo(() => {
    if (!data) return fallbackStats;
    const overview = data as Record<string, unknown>;
    const cards = (overview.stats ?? overview.cards ?? overview.summary) as
      | Record<string, unknown>[]
      | Record<string, unknown>
      | undefined;
    if (Array.isArray(cards) && cards.length > 0) {
      return cards.map((card) => ({
        label: str(card.label ?? card.title),
        value: str(card.value ?? card.count),
      }));
    }
    return [
      {
        label: "Total Employees",
        value: str(overview.totalEmployees ?? overview.employees, fallbackStats[0].value),
      },
      {
        label: "Total Departments",
        value: str(overview.totalDepartments ?? overview.departments, fallbackStats[1].value),
      },
      {
        label: "Total Monthly Payroll",
        value: str(overview.monthlyPayroll ?? overview.payroll, fallbackStats[2].value),
      },
      {
        label: "Pending Approvals",
        value: str(overview.pendingApprovals ?? overview.pending, fallbackStats[3].value),
      },
    ];
  }, [data]);

  const leaveRequests = useMemo((): LeaveRequest[] => {
    const overview = (data ?? {}) as Record<string, unknown>;
    const records = listFrom(
      (overview.leaveRequests ?? overview.leave ?? overview.pendingLeave) as never,
    );
    if (records.length === 0) return fallbackLeaveRequests;
    return records.map((record) => {
      const name = str(record.name ?? record.employeeName);
      return {
        id: str(record.id),
        name,
        initials: str(record.initials, initials(name)),
        avatarColor: str(record.avatarColor, avatarColor(name)),
        type: str(record.type ?? record.leaveType),
        duration: str(record.duration ?? record.days),
        status: str(record.status, "Pending") as LeaveStatus,
      };
    });
  }, [data]);

  const overviewItems = useMemo(() => {
    const overview = (data ?? {}) as Record<string, unknown>;
    const records = listFrom(
      (overview.upcoming ?? overview.overview ?? overview.events) as never,
    );
    if (records.length === 0) return fallbackOverviewItems;
    return records.map((record, index) => ({
      id: str(record.id, String(index)),
      date: str(record.date ?? record.startsAt),
      title: str(record.title ?? record.name),
    }));
  }, [data]);

  const employeesByDepartment = useMemo(() => {
    const overview = (data ?? {}) as Record<string, unknown>;
    const records = listFrom(
      (overview.employeesByDepartment ?? overview.departments) as never,
    );
    if (records.length === 0) return fallbackEmployeesByDept;
    const max = Math.max(...records.map((r) => num(r.value ?? r.count)), 1);
    return records.map((record) => ({
      name: str(record.name ?? record.department),
      value: num(record.value ?? record.count ?? record.employees),
      max,
    }));
  }, [data]);

  const departmentPerformance = useMemo(() => {
    const overview = (data ?? {}) as Record<string, unknown>;
    const records = listFrom(
      (overview.departmentPerformance ?? overview.performance) as never,
    );
    if (records.length === 0) return fallbackDeptPerformance;
    return records.map((record) => ({
      name: str(record.name ?? record.department),
      value: num(record.value ?? record.score),
      max: num(record.max, 100),
    }));
  }, [data]);

  const recentActivity = useMemo(() => {
    const overview = (data ?? {}) as Record<string, unknown>;
    const records = listFrom(
      (overview.recentActivity ?? overview.activity) as never,
    );
    if (records.length === 0) return fallbackRecentActivity;
    return records.map((record, index) => ({
      id: str(record.id, String(index)),
      title: str(record.title ?? record.action),
      description: str(record.description ?? record.summary),
      time: str(record.time ?? record.createdAt),
    }));
  }, [data]);

  return (
      <div className={styles.page}>
        <div className={styles.topBar}>
          <p className={styles.dateLabel}>Thursday, July 20</p>
          {loading ? <p className={styles.dateLabel}>Loading dashboard…</p> : null}
          {error ? (
            <p className={styles.dateLabel} role="alert">
              Using cached dashboard — {error}
            </p>
          ) : null}
>>>>>>> 37eb1224d5b2fc1ab1c618b51d1c98ba658180c9
          <div className={styles.topActions}>
            <label className={styles.search}>
              <Search size={15} className={styles.searchIcon} />
              <input
                type="search"
                placeholder="Search"
                className={styles.searchInput}
                aria-label="Search"
              />
              <kbd className={styles.searchShortcut}>⌘ K</kbd>
            </label>
<<<<<<< HEAD
            <Link
              href="/notifications"
              aria-label="Notifications"
              className={`${styles.iconButton} ${styles.iconButtonBadge}`}
            >
              <Bell size={16} />
            </Link>
            <Link href="/profile" aria-label="Profile" className={styles.avatarChip}>
              {account.initials}
            </Link>
          </div>
        </div>

        <div className={styles.accountSwitcher}>
          <p className={styles.accountLabel}>Example account</p>
          <div className={styles.accountPills}>
            {internAccounts.map((item) => {
              const active = item.id === accountId;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setAccountId(item.id)}
                  className={`${styles.accountPill} ${active ? styles.accountPillActive : ""}`}
                  aria-pressed={active}
                >
                  {item.switcherLabel}
                </button>
              );
            })}
=======
            <NotificationsLink className={styles.iconButton} />
            <ProfileLink className={styles.avatarChip}>DS</ProfileLink>
>>>>>>> 37eb1224d5b2fc1ab1c618b51d1c98ba658180c9
          </div>
        </div>

        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <p className={styles.heroEyebrow}>
              {account.typeLabel} · {account.track}
            </p>
<<<<<<< HEAD
            <h1 className={styles.heroTitle}>Welcome, {account.firstName}.</h1>
            <p className={styles.heroSubtitle}>{account.roleLine}</p>
            <p className={styles.heroLocation}>
              <MapPin size={14} strokeWidth={2} />
              {account.location}
            </p>
            <Link href="#progress" className={styles.heroButton}>
              View my progress →
=======
            <Link href="/employees" className={styles.heroButton}>
              Get started
>>>>>>> 37eb1224d5b2fc1ab1c618b51d1c98ba658180c9
            </Link>
          </div>
          <div className={styles.heroCountdown}>
            <p className={styles.countdownLabel}>Countdown to exit</p>
            <p className={styles.countdownValue}>{account.daysToExit} days</p>
            <p className={styles.countdownRange}>
              {account.startDate} → {account.endDate}
            </p>
          </div>
          <div className={styles.heroDecoration} aria-hidden="true">
            <div className={styles.heroDecorationInner} />
          </div>
        </section>

<<<<<<< HEAD
        <div className={styles.statsWrap}>
          <div className={styles.statsRow}>
            {account.stats.map((stat) => (
              <article key={stat.id} className={styles.statCard}>
                <p className={styles.statValue}>{stat.value}</p>
                <p className={styles.statLabel}>{stat.label}</p>
                <p className={styles.statHint}>{stat.hint}</p>
              </article>
            ))}
          </div>
          <div className={styles.prototypeBadge}>
            <FlaskConical size={13} strokeWidth={2.25} />
            Prototype: NYSC / Intern
          </div>
        </div>

        <section className={styles.placementCard}>
          <div className={styles.placementCol}>
            <div>
              <p className={styles.placementLabel}>Institution</p>
              <p className={styles.placementValue}>{account.institution}</p>
=======
        <div className={styles.statsRow}>
          {dashboardStats.map(({ label, value }) => (
            <article key={label} className={styles.statCard}>
              <p className={styles.statValue}>{value}</p>
              <p className={styles.statLabel}>{label}</p>
            </article>
          ))}
        </div>

        <div className={styles.middleRow}>
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Leave approval section</h2>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Type</th>
                    <th>Duration</th>
                    <th>Status</th>
                    <th aria-label="Actions" />
                  </tr>
                </thead>
                <tbody>
                  {leaveRequests.map((request) => (
                    <tr key={request.id}>
                      <td>
                        <div className={styles.employeeCell}>
                          <span
                            className={styles.rowAvatar}
                            style={{ background: request.avatarColor }}
                          >
                            {request.initials}
                          </span>
                          <span className={styles.employeeName}>{request.name}</span>
                        </div>
                      </td>
                      <td>{request.type}</td>
                      <td>{request.duration}</td>
                      <td>
                        <span className={statusClass[request.status]}>
                          {request.status}
                        </span>
                      </td>
                      <td className={styles.actionCell}>
                        {request.status === "Pending" ? (
                          <div className={styles.actionMenu}>
                            <button
                              type="button"
                              aria-label={`Actions for ${request.name}`}
                              aria-expanded={leaveMenuId === request.id}
                              className={styles.actionButton}
                              onClick={() =>
                                setLeaveMenuId((current) =>
                                  current === request.id ? null : request.id,
                                )
                              }
                            >
                              <MoreVertical size={16} />
                            </button>
                            {leaveMenuId === request.id ? (
                              <div className={styles.actionDropdown}>
                                <button
                                  type="button"
                                  className={styles.actionDropdownItem}
                                  onClick={() =>
                                    approveLeave(request.id, request.name)
                                  }
                                >
                                  <Check size={14} />
                                  Approve
                                </button>
                                <button
                                  type="button"
                                  className={styles.actionDropdownItem}
                                  onClick={() =>
                                    rejectLeave(request.id, request.name)
                                  }
                                >
                                  <X size={14} />
                                  Decline
                                </button>
                              </div>
                            ) : null}
                          </div>
                        ) : (
                          <Link href="/leave" className={styles.actionLink}>
                            View
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
>>>>>>> 37eb1224d5b2fc1ab1c618b51d1c98ba658180c9
            </div>
            <div className={styles.placementDate}>
              <span className={styles.placementIcon}>
                <Calendar size={15} />
              </span>
              <div>
                <p className={styles.placementLabel}>Start date</p>
                <p className={styles.placementValue}>{account.startDate}</p>
              </div>
            </div>
          </div>
          <div className={styles.placementCol}>
            <div>
              <p className={styles.placementLabel}>Course of study</p>
              <p className={styles.placementValue}>{account.course}</p>
            </div>
            <div className={styles.placementDate}>
              <span className={styles.placementIcon}>
                <Calendar size={15} />
              </span>
              <div>
                <p className={styles.placementLabel}>Expected end date</p>
                <p className={styles.placementValue}>{account.endDate}</p>
              </div>
            </div>
          </div>
        </section>

<<<<<<< HEAD
        <div className={styles.contentGrid}>
          <div className={styles.mainColumn}>
            <section className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>My tasks</h2>
                <Link href="/tasks" className={styles.cardLink}>
                  View all
                </Link>
              </div>
              <div className={styles.list}>
                {account.tasks.map((task) => (
                  <article key={task.id} className={styles.listRow}>
                    <div className={styles.listBody}>
                      <p className={styles.listTitle}>{task.title}</p>
                      <p className={styles.listMeta}>{task.meta}</p>
                    </div>
                    <span className={statusClass[task.status]}>{task.status}</span>
                  </article>
                ))}
              </div>
            </section>

            <section className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={`${styles.cardTitle} ${styles.cardTitleSerif}`}>
                  Upcoming meetings
                </h2>
                <Link href="/meetings" className={styles.cardLink}>
                  View all
                </Link>
              </div>
              <div className={styles.list}>
                {account.meetings.map((meeting) => (
                  <article key={meeting.id} className={styles.listRow}>
                    <div className={styles.listBody}>
                      <p className={styles.listTitle}>{meeting.title}</p>
                      <p className={styles.listMeta}>{meeting.details}</p>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </div>

          <div className={styles.sideColumn}>
            <section className={styles.card} id="progress">
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>Progress summary</h2>
              </div>
              <div className={styles.progressList}>
                {account.progress.map((meter) => (
                  <div key={meter.id} className={styles.progressRow}>
                    <div className={styles.progressMeta}>
                      <span>{meter.label}</span>
                      <span>{meter.value}%</span>
                    </div>
                    <div className={styles.progressTrack}>
                      <div
                        className={styles.progressFill}
                        style={{ width: `${meter.value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className={styles.milestoneList}>
                {account.milestones.map((item) => (
                  <div key={item.id} className={styles.milestone}>
                    <span
                      className={`${styles.milestoneMark} ${
                        item.done ? styles.milestoneDone : ""
                      }`}
                    >
                      {item.done ? <Check size={11} strokeWidth={3} /> : null}
                    </span>
                    <span className={item.done ? styles.milestoneLabelDone : undefined}>
                      {item.label}
                    </span>
=======
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Overview 2024</h2>
            <div className={styles.overviewList}>
              {overviewItems.map((item) => (
                <article key={item.id} className={styles.overviewItem}>
                  <span className={styles.overviewDate}>{item.date}</span>
                  <div className={styles.overviewBody}>
                    <p className={styles.overviewTitle}>{item.title}</p>
                    <Link href="/events" className={styles.overviewLink}>
                      View details
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>

        <div className={styles.chartsRow}>
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Employee by department</h2>
            <div className={styles.chartList}>
              {employeesByDepartment.map((dept) => (
                <div key={dept.name} className={styles.chartRow}>
                  <span className={styles.chartLabel}>{dept.name}</span>
                  <div className={styles.chartTrack}>
                    <div
                      className={styles.chartFill}
                      style={{ width: `${(dept.value / dept.max) * 100}%` }}
                    />
                  </div>
                  <span className={styles.chartValue}>{dept.value}</span>
                </div>
              ))}
            </div>
          </section>

          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Department performance</h2>
            <div className={styles.chartList}>
              {departmentPerformance.map((dept) => (
                <div key={dept.name} className={styles.chartRow}>
                  <span className={styles.chartLabel}>{dept.name}</span>
                  <div className={styles.chartTrack}>
                    <div
                      className={styles.chartFill}
                      style={{ width: `${(dept.value / dept.max) * 100}%` }}
                    />
                  </div>
                  <span className={styles.chartValue}>{dept.value}%</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className={styles.accessRow}>
          <section className={styles.card}>
            <div className={styles.panelHead}>
              <h2 className={styles.cardTitleInline}>
                <KeyRound size={16} />
                Permission changes
              </h2>
              <Link href="/user-access" className={styles.panelLink}>
                Manage →
              </Link>
            </div>
            <div className={styles.emptyPanel}>No recent changes.</div>
          </section>

          <section className={styles.card}>
            <div className={styles.panelHead}>
              <h2 className={styles.cardTitleInline}>
                <UserPlus size={16} />
                Role changes
              </h2>
              <Link href="/user-access" className={styles.panelLink}>
                User access →
              </Link>
            </div>
            <div className={styles.roleChange}>
              <h3>Ravi Kapoor: Accountant → HR (reverted)</h3>
              <span>4h ago</span>
            </div>
          </section>
        </div>

        <div className={styles.bottomRow}>
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Company resources</h2>
            <div className={styles.resourceList}>
              {companyResources.map((resource) => {
                const Icon = resourceIcons[resource.icon];
                return (
                  <Link
                    key={resource.id}
                    href={resourceLinks[resource.icon]}
                    className={styles.resourceLink}
                  >
                    <span className={styles.resourceIcon}>
                      <Icon size={16} />
                    </span>
                    {resource.label}
                  </Link>
                );
              })}
            </div>
          </section>

          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Recent activity feed</h2>
            <div className={styles.activityList}>
              {recentActivity.map((activity) => (
                <article key={activity.id} className={styles.activityItem}>
                  <div className={styles.activityBody}>
                    <p className={styles.activityTitle}>{activity.title}</p>
                    <p className={styles.activityDescription}>
                      {activity.description}
                    </p>
>>>>>>> 37eb1224d5b2fc1ab1c618b51d1c98ba658180c9
                  </div>
                ))}
              </div>
              <Link href="#progress" className={styles.footerLink}>
                View full progress
              </Link>
            </section>

            <section className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>
                  <Megaphone size={16} strokeWidth={2} />
                  Announcements
                </h2>
              </div>
              <div className={styles.list}>
                {account.announcements.map((item) => (
                  <article key={item.id} className={styles.compactRow}>
                    <p className={styles.listTitle}>{item.title}</p>
                    <p className={styles.listMeta}>{item.meta}</p>
                  </article>
                ))}
              </div>
              <Link href="/announcements" className={styles.footerLink}>
                All announcements →
              </Link>
            </section>

            <section className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>Notifications</h2>
                <span className={styles.newBadge}>{unreadCount} new</span>
              </div>
              <div className={styles.list}>
                {account.notifications.map((item) => (
                  <article key={item.id} className={styles.notificationRow}>
                    {item.unread ? (
                      <span className={styles.unreadDot} aria-hidden="true" />
                    ) : (
                      <span className={styles.unreadSpacer} aria-hidden="true" />
                    )}
                    <p className={styles.listTitle}>{item.message}</p>
                  </article>
                ))}
              </div>
              <Link href="/notifications" className={styles.footerLink}>
                View all →
              </Link>
            </section>
          </div>
        </div>
      </div>
  );
}
