"use client";

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
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import {
  internAccounts,
  type InternAccountId,
  type InternTaskStatus,
} from "@/data/internHome";
import styles from "./DashboardPage.module.css";

const statusClass: Record<InternTaskStatus, string> = {
  "In Progress": styles.statusInProgress,
  Overdue: styles.statusOverdue,
  "Not Started": styles.statusNotStarted,
  "In Review": styles.statusInReview,
};

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
          </div>
        </div>

        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <p className={styles.heroEyebrow}>
              {account.typeLabel} · {account.track}
            </p>
            <h1 className={styles.heroTitle}>Welcome, {account.firstName}.</h1>
            <p className={styles.heroSubtitle}>{account.roleLine}</p>
            <p className={styles.heroLocation}>
              <MapPin size={14} strokeWidth={2} />
              {account.location}
            </p>
            <Link href="#progress" className={styles.heroButton}>
              View my progress →
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
    </AppShell>
  );
}
