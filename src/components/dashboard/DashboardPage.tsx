"use client";

import {
  Bell,
  BookOpen,
  Gift,
  Headphones,
  MoreVertical,
  Search,
  Shield,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { type LeaveStatus } from "@/data/dashboard";
import { useManagerDashboard } from "@/lib/hooks/useManagerApi";
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

export function DashboardPage() {
  const { data, companyResources } = useManagerDashboard();
  const {
    stats,
    leaveRequests,
    overviewItems,
    employeesByDepartment,
    departmentPerformance,
    recentActivity,
  } = data;

  return (
    <AppShell>
      <div className={styles.page}>
        <div className={styles.topBar}>
          <p className={styles.dateLabel}>Thursday, July 20</p>
          <div className={styles.topActions}>
            <label className={styles.search}>
              <Search size={15} className={styles.searchIcon} />
              <input
                type="search"
                placeholder="Search"
                className={styles.searchInput}
              />
            </label>
            <button type="button" aria-label="Notifications" className={styles.iconButton}>
              <Bell size={16} />
            </button>
            <button type="button" aria-label="Profile" className={styles.avatarChip}>
              DS
            </button>
          </div>
        </div>

        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>Your workforce is in motion.</h1>
            <p className={styles.heroSubtitle}>
              Track attendance, manage approvals, and keep every department aligned
              from one shared workspace.
            </p>
            <button type="button" className={styles.heroButton}>
              Get started
            </button>
          </div>
          <div className={styles.heroAvatar} aria-hidden="true">
            DS
          </div>
          <div className={styles.heroDecoration}>
            <div className={styles.heroDecorationInner} />
          </div>
        </section>

        <div className={styles.statsRow}>
          {stats.map(({ label, value }) => (
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
                      <td>
                        <button
                          type="button"
                          aria-label={`Actions for ${request.name}`}
                          className={styles.actionButton}
                        >
                          <MoreVertical size={16} />
                        </button>
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
                    <a href="#" className={styles.overviewLink}>
                      View details
                    </a>
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

        <div className={styles.bottomRow}>
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Company resources</h2>
            <div className={styles.resourceList}>
              {companyResources.map((resource) => {
                const Icon = resourceIcons[resource.icon];
                return (
                  <a key={resource.id} href="#" className={styles.resourceLink}>
                    <span className={styles.resourceIcon}>
                      <Icon size={16} />
                    </span>
                    {resource.label}
                  </a>
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
    </AppShell>
  );
}
