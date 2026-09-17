"use client";

import { PageDateLabel } from "@/components/layout/PageDateLabel";
import { useState } from "react";
import Link from "next/link";
import {
  Bell,
  CalendarDays,
  Check,
  Clock,
  ListChecks,
  MapPin,
  Megaphone,
  Search,
  TrendingUp,
  UserRound,
} from "lucide-react";
import { GpsCheckInCard } from "@/components/attendance/GpsCheckInCard";
import { AccountantStatusLine } from "@/components/accountant/AccountantStatusLine";
import {
  nyscAccountList,
  type NyscAccountId,
  type NyscTaskStatus,
} from "@/data/nyscOverview";
import { useInternAccount } from "@/hooks/useInternAccount";
import styles from "./NyscOverviewPage.module.css";

const statusClass: Record<NyscTaskStatus, string> = {
  "In Progress": styles.statusProgress,
  Overdue: styles.statusOverdue,
  "Not Started": styles.statusNotStarted,
  "In Review": styles.statusReview,
  Completed: styles.statusCompleted,
};

export function NyscOverviewPage() {
  const [accountId, setAccountId] = useState<NyscAccountId>("chidi");
  const { account, loading, error } = useInternAccount(accountId);

  return (
    <div className={styles.page}>
      <AccountantStatusLine loading={loading} error={error} resource="dashboard" />
      <div className={styles.topBar}>
        <PageDateLabel className={styles.dateLabel} />
        <div className={styles.topActions}>
          <label className={styles.search}>
            <Search size={15} className={styles.searchIcon} />
            <input
              type="search"
              placeholder="Search"
              className={styles.searchInput}
              aria-label="Search"
            />
            <kbd className={styles.searchKbd}>⌘ K</kbd>
          </label>
          <Link
            href="/nysc/notifications"
            className={styles.iconButton}
            aria-label="Notifications"
          >
            <span className={styles.notifDot} aria-hidden />
            <Bell size={16} />
          </Link>
          <Link
            href="/nysc/profile"
            className={styles.avatarChip}
            aria-label="Profile"
          >
            {account.initials}
          </Link>
        </div>
      </div>

      <div className={styles.accounts}>
        <p className={styles.accountsLabel}>Example account</p>
        <div className={styles.accountChips} role="tablist" aria-label="Example accounts">
          {nyscAccountList.map((item) => {
            const active = item.id === accountId;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={active}
                className={`${styles.accountChip} ${
                  active ? styles.accountChipActive : ""
                }`}
                onClick={() => setAccountId(item.id)}
              >
                <UserRound size={15} />
                <span className={styles.accountName}>{item.name}</span>
                <span
                  className={
                    item.type === "NYSC"
                      ? styles.accountTypeNysc
                      : styles.accountTypeIntern
                  }
                >
                  {item.type}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <p className={styles.heroEyebrow}>{account.eyebrow}</p>
          <h1 className={styles.heroTitle}>Welcome, {account.firstName}.</h1>
          <p className={styles.heroSubtitle}>{account.titleLine}</p>
          <p className={styles.heroCourse}>
            <MapPin size={14} />
            {account.course}
          </p>
          <Link href="/nysc/progress" className={styles.heroButton}>
            View my progress →
          </Link>
        </div>
        <div className={styles.heroCountdown}>
          <p className={styles.countdownLabel}>Countdown to exit</p>
          <p className={styles.countdownValue}>{account.daysToExit} days</p>
          <p className={styles.countdownRange}>{account.dateRange}</p>
        </div>
        <div className={styles.heroDecoration} aria-hidden>
          <div className={styles.heroDecorationInner} />
        </div>
      </section>

      <GpsCheckInCard portal="intern" />

      <div className={styles.statsGrid}>
        {account.stats.map((stat) => (
          <article key={stat.id} className={styles.statCard}>
            <p className={styles.statValue}>{stat.value}</p>
            <p className={styles.statLabel}>{stat.label}</p>
            {stat.chip ? (
              <span className={styles.statChip}>
                <UserRound size={12} />
                {stat.meta}
              </span>
            ) : (
              <p className={styles.statMeta}>{stat.meta}</p>
            )}
          </article>
        ))}
      </div>

      <div className={styles.columns}>
        <div className={styles.leftColumn}>
          <section className={styles.card}>
            <div className={styles.infoGrid}>
              <div>
                <p className={styles.infoLabel}>Institution</p>
                <p className={styles.infoValue}>{account.institution}</p>
              </div>
              <div>
                <p className={styles.infoLabel}>Course of study</p>
                <p className={styles.infoValue}>{account.course}</p>
              </div>
              <div>
                <p className={styles.infoLabel}>Start date</p>
                <p className={styles.infoValue}>
                  <CalendarDays size={14} />
                  {account.startDate}
                </p>
              </div>
              <div>
                <p className={styles.infoLabel}>Expected end date</p>
                <p className={styles.infoValue}>
                  <CalendarDays size={14} />
                  {account.endDate}
                </p>
              </div>
            </div>
          </section>

          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>
                <ListChecks size={18} />
                My tasks
              </h2>
              <Link href="/nysc/tasks" className={styles.cardLink}>
                View all
              </Link>
            </div>
            <ul className={styles.list}>
              {account.tasks
                .filter((task) => task.status !== "Completed")
                .map((task) => (
                <li key={task.id} className={styles.taskRow}>
                  <div className={styles.listMain}>
                    <p className={styles.listTitle}>{task.title}</p>
                    <p className={styles.listSub}>
                      {task.assignee} · {task.due}
                    </p>
                  </div>
                  <span className={`${styles.status} ${statusClass[task.status]}`}>
                    {task.status}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>
                <CalendarDays size={18} />
                Upcoming meetings
              </h2>
              <Link href="/nysc/meetings" className={styles.cardLink}>
                View all
              </Link>
            </div>
            <ul className={styles.list}>
              {account.meetings.map((meeting) => (
                <li key={meeting.id} className={styles.meetingRow}>
                  <span className={styles.meetingIcon} aria-hidden>
                    <CalendarDays size={16} />
                  </span>
                  <div className={styles.listMain}>
                    <p className={styles.listTitle}>{meeting.title}</p>
                    <p className={styles.meetingMeta}>
                      <span>
                        <Clock size={12} />
                        {meeting.when}
                      </span>
                      <span>
                        <MapPin size={12} />
                        {meeting.location}
                      </span>
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className={styles.rightColumn}>
          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>
                <TrendingUp size={18} />
                Progress summary
              </h2>
            </div>
            <ul className={styles.progressList}>
              <li>
                <div className={styles.progressTop}>
                  <span>Placement elapsed</span>
                  <strong>{account.progress.placementElapsed}%</strong>
                </div>
                <div className={styles.progressTrack}>
                  <div
                    className={styles.progressFill}
                    style={{ width: `${account.progress.placementElapsed}%` }}
                  />
                </div>
              </li>
              <li>
                <div className={styles.progressTop}>
                  <span>Tasks completed</span>
                  <strong>{account.progress.tasksCompleted}%</strong>
                </div>
                <div className={styles.progressTrack}>
                  <div
                    className={styles.progressFill}
                    style={{ width: `${account.progress.tasksCompleted}%` }}
                  />
                </div>
              </li>
              <li>
                <div className={styles.progressTop}>
                  <span>Profile completion</span>
                  <strong>{account.progress.profileCompletion}%</strong>
                </div>
                <div className={styles.progressTrack}>
                  <div
                    className={styles.progressFill}
                    style={{ width: `${account.progress.profileCompletion}%` }}
                  />
                </div>
              </li>
            </ul>
            <ul className={styles.milestoneList}>
              {account.milestones.map((item) => (
                <li key={item.id} className={styles.milestone}>
                  <span
                    className={
                      item.done ? styles.milestoneDone : styles.milestoneOpen
                    }
                    aria-hidden
                  >
                    {item.done ? <Check size={11} strokeWidth={3} /> : null}
                  </span>
                  {item.label}
                </li>
              ))}
            </ul>
            <Link href="/nysc/progress" className={styles.progressButton}>
              View full progress
            </Link>
          </section>

          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>
                <Megaphone size={18} />
                Announcements
              </h2>
            </div>
            <ul className={styles.feedList}>
              {account.announcements.map((item) => (
                <li
                  key={item.id}
                  className={`${styles.feedItem} ${
                    item.featured ? styles.feedItemFeatured : ""
                  }`}
                >
                  <p className={styles.listTitle}>{item.title}</p>
                  <p className={styles.listSub}>
                    {item.source} · {item.date}
                  </p>
                </li>
              ))}
            </ul>
            <Link href="/nysc/announcements" className={styles.footerLink}>
              All announcements →
            </Link>
          </section>

          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>
                <Bell size={18} />
                Notifications
              </h2>
              <span className={styles.newBadge}>
                {account.unreadNotifications} new
              </span>
            </div>
            <ul className={styles.feedList}>
              {account.notifications.map((item) => (
                <li
                  key={item.id}
                  className={`${styles.feedItem} ${
                    item.featured ? styles.feedItemFeatured : ""
                  }`}
                >
                  <p className={styles.listTitle}>{item.text}</p>
                </li>
              ))}
            </ul>
            <Link href="/nysc/notifications" className={styles.footerLink}>
              View all →
            </Link>
          </section>
        </div>
      </div>
    </div>
  );
}
