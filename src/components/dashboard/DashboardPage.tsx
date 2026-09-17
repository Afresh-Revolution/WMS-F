"use client";

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
} from "lucide-react";
import { NotificationsLink, ProfileLink } from "@/components/layout/PageLinks";
import { usePageActions } from "@/hooks/usePageActions";
import {
  companyResources,
  type LeaveRequest,
  type LeaveStatus,
} from "@/data/dashboard";
import { useAsyncData } from "@/hooks/useAsyncData";
import {
  approveLeaveRequest,
  rejectLeaveRequest,
  superAdminApi,
  unwrapRecord,
} from "@/lib/api";
import { avatarColor, initials, listFrom, num, str } from "@/lib/api/mappers";
import styles from "./DashboardPage.module.css";

const statusClass: Record<LeaveStatus, string> = {
  Approved: styles.statusApproved,
  Pending: styles.statusPending,
  Rejected: styles.statusRejected,
};

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

  const { data, loading, error, refetch } = useAsyncData(async () => {
    try {
      return await superAdminApi.dashboard.overview();
    } catch {
      return await superAdminApi.dashboard.platformOverview();
    }
  }, []);

  function approveLeave(id: string, name: string) {
    void runAction(`Approve ${name}'s leave`, async () => {
      await approveLeaveRequest(id, "Get well soon. Approved.");
      setLeaveMenuId(null);
      refetch();
    }).catch(() => undefined);
  }

  function rejectLeave(id: string, name: string) {
    void runAction(`Decline ${name}'s leave`, async () => {
      await rejectLeaveRequest(
        id,
        "Team coverage is not available that week.",
      );
      setLeaveMenuId(null);
      refetch();
    }).catch(() => undefined);
  }

  const overview = useMemo(() => unwrapRecord(data), [data]);
  const metrics = useMemo(
    () => unwrapRecord(overview.metrics ?? overview.summary ?? overview.counts),
    [overview],
  );

  const dashboardStats = useMemo(() => {
    const cards = listFrom(
      (overview.stats ?? overview.cards ?? overview.kpis ?? metrics.cards) as never,
    );
    if (cards.length > 0) {
      return cards.map((card) => ({
        label: str(card.label ?? card.title),
        value: str(card.value ?? card.count),
      }));
    }
    return [
      {
        label: "Total Employees",
        value: str(
          overview.totalEmployees ??
            overview.employees ??
            metrics.totalEmployees ??
            metrics.employees,
          "—",
        ),
      },
      {
        label: "Total Departments",
        value: str(
          overview.totalDepartments ??
            overview.departments ??
            metrics.totalDepartments ??
            metrics.departments,
          "—",
        ),
      },
      {
        label: "Total Monthly Payroll",
        value: str(
          overview.monthlyPayroll ?? overview.payroll ?? metrics.monthlyPayroll,
          "—",
        ),
      },
      {
        label: "Pending Approvals",
        value: str(
          overview.pendingApprovals ?? overview.pending ?? metrics.pendingApprovals,
          "—",
        ),
      },
    ];
  }, [metrics, overview]);

  const leaveRequests = useMemo((): LeaveRequest[] => {
    return listFrom(
      (overview.leaveRequests ?? overview.leave ?? overview.pendingLeave) as never,
    ).map((record) => {
      const name = str(record.name ?? record.employeeName);
      const statusRaw = str(record.status, "Pending");
      const status: LeaveStatus = statusRaw.toLowerCase().includes("approv")
        ? "Approved"
        : statusRaw.toLowerCase().includes("reject")
          ? "Rejected"
          : "Pending";
      return {
        id: str(record.id ?? record._id),
        name,
        initials: str(record.initials, initials(name)),
        avatarColor: str(record.avatarColor, avatarColor(name)),
        type: str(record.type ?? record.leaveType),
        duration: str(record.duration ?? record.days),
        status,
      };
    });
  }, [overview]);

  const overviewItems = useMemo(() => {
    return listFrom(
      (overview.upcoming ?? overview.overview ?? overview.events) as never,
    ).map((record, index) => ({
      id: str(record.id, String(index)),
      date: str(record.date ?? record.startsAt),
      title: str(record.title ?? record.name),
    }));
  }, [overview]);

  const employeesByDepartment = useMemo(() => {
    const records = listFrom(
      (overview.employeesByDepartment ?? overview.departments) as never,
    );
    const max = Math.max(...records.map((r) => num(r.value ?? r.count)), 1);
    return records.map((record) => ({
      name: str(record.name ?? record.department),
      value: num(record.value ?? record.count ?? record.employees),
      max,
    }));
  }, [overview]);

  const departmentPerformance = useMemo(() => {
    return listFrom(
      (overview.departmentPerformance ?? overview.performance) as never,
    ).map((record) => ({
      name: str(record.name ?? record.department),
      value: num(record.value ?? record.score),
      max: num(record.max, 100),
    }));
  }, [overview]);

  const recentActivity = useMemo(() => {
    return listFrom(
      (overview.recentActivity ?? overview.activity) as never,
    ).map((record, index) => ({
      id: str(record.id, String(index)),
      title: str(record.title ?? record.action),
      description: str(record.description ?? record.summary),
      time: str(record.time ?? record.createdAt),
    }));
  }, [overview]);

  const roleChanges = useMemo(() => {
    return listFrom(
      (overview.roleChanges ?? overview.permissionChanges) as never,
    ).map((record, index) => ({
      id: str(record.id, String(index)),
      title: str(record.title ?? record.summary ?? record.action),
      time: str(record.time ?? record.createdAt),
    }));
  }, [overview]);

  return (
      <div className={styles.page}>
        <div className={styles.topBar}>
          <p className={styles.dateLabel}>Thursday, July 20</p>
          {loading ? <p className={styles.dateLabel}>Loading dashboard…</p> : null}
          {error ? (
            <p className={styles.dateLabel} role="alert">
              {error}
            </p>
          ) : null}
          <div className={styles.topActions}>
            <label className={styles.search}>
              <Search size={15} className={styles.searchIcon} />
              <input
                type="search"
                placeholder="Search"
                className={styles.searchInput}
              />
            </label>
            <NotificationsLink className={styles.iconButton} />
            <ProfileLink className={styles.avatarChip}>DS</ProfileLink>
          </div>
        </div>

        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>Your workforce is in motion.</h1>
            <p className={styles.heroSubtitle}>
              Track attendance, manage approvals, and keep every department aligned
              from one shared workspace.
            </p>
            <Link href="/employees" className={styles.heroButton}>
              Get started
            </Link>
          </div>
          <div className={styles.heroDecoration}>
            <div className={styles.heroDecorationInner} />
          </div>
        </section>

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
            </div>
          </section>

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
            <div className={styles.emptyPanel}>
              {roleChanges.length === 0
                ? "No recent changes."
                : roleChanges.map((change) => (
                    <div key={change.id} className={styles.roleChange}>
                      <h3>{change.title}</h3>
                      <span>{change.time}</span>
                    </div>
                  ))}
            </div>
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
            {roleChanges.length === 0 ? (
              <div className={styles.emptyPanel}>No role changes yet.</div>
            ) : (
              roleChanges.map((change) => (
                <div key={change.id} className={styles.roleChange}>
                  <h3>{change.title}</h3>
                  <span>{change.time}</span>
                </div>
              ))
            )}
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
                  </div>
                  <span className={styles.activityTime}>{activity.time}</span>
                </article>
              ))}
            </div>
          </section>
        </div>
      </div>
  );
}
