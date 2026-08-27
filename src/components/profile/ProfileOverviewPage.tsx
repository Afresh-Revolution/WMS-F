"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  Briefcase,
  Building2,
  Calendar,
  Clock,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Search,
  User,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { notificationUnreadCount } from "@/data/notifications";
import {
  employmentDetails,
  leaveBalances,
  leaveHistory,
  personalDetails,
  profile,
  profileTabRoutes,
  profileTabs,
  type LeaveHistoryStatus,
  type ProfileTab,
} from "@/data/profile";
import styles from "./ProfileOverviewPage.module.css";

const personalIcons = [Mail, Mail, Phone, MapPin] as const;
const employmentIcons = [Briefcase, Building2, Calendar, Clock, User] as const;

const historyStatusClass: Record<LeaveHistoryStatus, string> = {
  Approved: styles.historyApproved,
  Pending: styles.historyPending,
};

type ProfilePageProps = {
  initialTab?: ProfileTab;
};

export function ProfilePage({ initialTab = "Overview" }: ProfilePageProps) {
  const router = useRouter();

  function handleTabChange(tab: ProfileTab) {
    router.push(profileTabRoutes[tab]);
  }

  return (
    <AppShell>
      <div className={styles.page}>
        <div className={styles.topBar}>
          <p className={styles.dateLabel}>Monday, August 3</p>
          <div className={styles.topActions}>
            <div className={styles.globalSearch}>
              <Search size={15} className={styles.globalSearchIcon} />
              <span className={styles.globalSearchText}>Search</span>
              <span className={styles.shortcut}>⌘ K</span>
            </div>
            <Link
              href="/notifications/unread"
              aria-label={`Notifications, ${notificationUnreadCount} unread`}
              className={`${styles.iconButton} ${styles.iconButtonBadge}`}
            >
              <Bell size={16} />
            </Link>
            <Link
              href="/profile"
              aria-label="Profile"
              className={styles.avatarChip}
            >
              DO
            </Link>
          </div>
        </div>

        <div className={styles.header}>
          <div>
            <p className={styles.eyebrow}>My profile</p>
            <h1 className={styles.title}>Your employment record</h1>
            <p className={styles.subtitle}>
              View your personal and employment details, leave balance, and
              request history.
            </p>
          </div>
          <button type="button" className={styles.editButton}>
            <Pencil size={15} />
            Edit details
          </button>
        </div>

        <section className={styles.summaryCard}>
          <div className={styles.summaryMain}>
            <span className={styles.profileAvatar}>{profile.initials}</span>
            <div className={styles.summaryMeta}>
              <h2 className={styles.profileName}>{profile.name}</h2>
              <p className={styles.profileRole}>
                {profile.role} · {profile.department}
              </p>
              <div className={styles.badges}>
                <span className={styles.statusActive}>{profile.status}</span>
                <span className={styles.idBadge}>{profile.employeeId}</span>
              </div>
            </div>
          </div>
          <div className={styles.leaveStat}>
            <p className={styles.leaveStatLabel}>Annual leave</p>
            <p className={styles.leaveStatValue}>{profile.annualLeaveDays} days</p>
          </div>
        </section>

        <div className={styles.tabs}>
          {profileTabs.map((tab) => {
            const active = initialTab === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => handleTabChange(tab)}
                className={`${styles.tab} ${active ? styles.tabActive : ""}`}
              >
                {tab}
              </button>
            );
          })}
        </div>

        {initialTab === "Overview" && (
          <>
            <div className={styles.detailsGrid}>
              <section className={styles.card}>
                <h3 className={styles.cardTitle}>Personal details</h3>
                <div className={styles.detailList}>
                  {personalDetails.map((detail, index) => {
                    const Icon = personalIcons[index];
                    return (
                      <article key={detail.label} className={styles.detailItem}>
                        <span className={styles.detailIcon}>
                          <Icon size={15} />
                        </span>
                        <div className={styles.detailBody}>
                          <p className={styles.detailLabel}>{detail.label}</p>
                          <div className={styles.detailValueRow}>
                            <p className={styles.detailValue}>{detail.value}</p>
                            {detail.badge && (
                              <span className={styles.companyBadge}>
                                {detail.badge}
                              </span>
                            )}
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>

              <section className={styles.card}>
                <h3 className={styles.cardTitle}>Employment details</h3>
                <div className={styles.detailList}>
                  {employmentDetails.map((detail, index) => {
                    const Icon = employmentIcons[index];
                    return (
                      <article key={detail.label} className={styles.detailItem}>
                        <span className={styles.detailIcon}>
                          <Icon size={15} />
                        </span>
                        <div className={styles.detailBody}>
                          <p className={styles.detailLabel}>{detail.label}</p>
                          <p className={styles.detailValue}>{detail.value}</p>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            </div>

            <section className={styles.card}>
              <h3 className={styles.cardTitle}>Leave balance</h3>
              <div className={styles.leaveBalanceList}>
                {leaveBalances.map((balance) => {
                  const used = balance.total - balance.remaining;
                  const percentUsed = (used / balance.total) * 100;

                  return (
                    <article key={balance.id} className={styles.leaveBalanceRow}>
                      <p className={styles.leaveBalanceLabel}>{balance.label}</p>
                      <div className={styles.progressTrack}>
                        <div
                          className={styles.progressFill}
                          style={{ width: `${percentUsed}%` }}
                        />
                      </div>
                      <p className={styles.leaveBalanceMeta}>
                        {balance.remaining} of {balance.total} left
                      </p>
                    </article>
                  );
                })}
              </div>
            </section>
          </>
        )}

        {initialTab === "Leave" && (
          <section className={styles.card}>
            <h3 className={styles.sectionHeading}>Leave history</h3>
            <div className={styles.historyList}>
              {leaveHistory.map((item) => (
                <article key={item.id} className={styles.historyRow}>
                  <div className={styles.historyBody}>
                    <p className={styles.historyType}>{item.type}</p>
                    <p className={styles.historyMeta}>
                      {item.dateRange} · {item.days} days
                    </p>
                  </div>
                  <div className={styles.historyActions}>
                    <span className={historyStatusClass[item.status]}>
                      {item.status}
                    </span>
                    {item.status === "Approved" && (
                      <button type="button" className={styles.downloadLink}>
                        Download letter
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </div>
    </AppShell>
  );
}

/** @deprecated Use ProfilePage */
export const ProfileOverviewPage = ProfilePage;
