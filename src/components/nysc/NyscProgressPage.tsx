"use client";

import { PageDateLabel } from "@/components/layout/PageDateLabel";
import { useState } from "react";
import Link from "next/link";
import {
  Bell,
  CalendarDays,
  Check,
  MessageSquare,
  Search,
  TrendingUp,
  UserRound,
} from "lucide-react";
import { AccountantStatusLine } from "@/components/accountant/AccountantStatusLine";
import {
  nyscAccountList,
  type NyscAccountId,
  type NyscProgressNoteKind,
} from "@/data/nyscOverview";
import { useInternAccount } from "@/hooks/useInternAccount";
import { internApi, internSettled } from "@/lib/api";
import { mapInternProgressOverlay } from "@/lib/api/internMappers";
import { useAsyncData } from "@/hooks/useAsyncData";
import styles from "./NyscProgressPage.module.css";

const noteKindClass: Record<NyscProgressNoteKind, string> = {
  Praise: styles.notePraise,
  Action: styles.noteAction,
  Note: styles.noteNote,
};

export function NyscProgressPage() {
  const [accountId, setAccountId] = useState<NyscAccountId>("chidi");
  const { account, loading, error } = useInternAccount(accountId);
  const { data: progressPayload } = useAsyncData(
    () => internSettled(internApi.progress()),
    [],
  );
  const overlay = mapInternProgressOverlay(progressPayload, account);
  const completedTasks = account.tasks.filter(
    (task) => task.status === "Completed",
  ).length;
  const totalTasks = account.tasks.length;
  const tasksPercent =
    totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
  const reached = overlay.milestones.filter((item) => item.done).length;
  const totalMilestones = overlay.milestones.length;

  return (
    <div className={styles.page}>
      <AccountantStatusLine loading={loading} error={error} resource="progress" />
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

      <header className={styles.header}>
        <p className={styles.eyebrow}>My progress</p>
        <h1 className={styles.title}>Placement progress</h1>
        <p className={styles.subtitle}>
          Your milestones, task completion and the progress notes your supervisor
          has shared with you.
        </p>
      </header>

      <div className={styles.accounts} role="tablist" aria-label="Example accounts">
        <p className={styles.accountsLabel}>Example account</p>
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
                className={`${styles.accountType} ${
                  active
                    ? styles.accountTypeOnActive
                    : item.type === "NYSC"
                      ? styles.accountTypeNysc
                      : styles.accountTypeIntern
                }`}
              >
                {item.type}
              </span>
            </button>
          );
        })}
      </div>

      <div className={styles.stats}>
        <article className={styles.statCard}>
          <p className={styles.statValue}>{overlay.progress.placementElapsed}%</p>
          <p className={styles.statLabel}>placement elapsed</p>
          <p className={styles.statMeta}>{account.daysToExit} days to exit</p>
        </article>
        <article className={styles.statCard}>
          <p className={styles.statValue}>{tasksPercent}%</p>
          <p className={styles.statLabel}>tasks completed</p>
          <p className={styles.statMeta}>
            {completedTasks} of {totalTasks}
          </p>
        </article>
        <article className={styles.statCard}>
          <p className={styles.statValue}>
            {reached}/{totalMilestones}
          </p>
          <p className={styles.statLabel}>milestones reached</p>
          <p className={styles.statMeta}>Placement goals</p>
        </article>
        <article className={styles.statCard}>
          <p className={styles.statDate}>
            <CalendarDays size={18} />
            {account.endDate}
          </p>
          <p className={styles.statLabel}>expected exit</p>
          <p className={styles.statMeta}>Started {account.startDate}</p>
        </article>
      </div>

      <div className={styles.grid}>
        <section className={styles.panel}>
          <h2 className={styles.panelTitle}>
            <TrendingUp size={18} />
            Milestones
          </h2>
          <ul className={styles.milestoneList}>
            {overlay.milestones.map((item) => (
              <li key={item.id} className={styles.milestone}>
                <span
                  className={
                    item.done ? styles.milestoneDone : styles.milestoneOpen
                  }
                  aria-hidden
                >
                  {item.done ? <Check size={11} strokeWidth={3} /> : null}
                </span>
                <div className={styles.milestoneBody}>
                  <p
                    className={`${styles.milestoneLabel} ${
                      item.done ? styles.milestoneLabelDone : ""
                    }`}
                  >
                    {item.label}
                  </p>
                  <p className={styles.milestoneTarget}>Target {item.target}</p>
                </div>
                {item.done ? (
                  <span className={styles.doneChip}>Done</span>
                ) : null}
              </li>
            ))}
          </ul>
        </section>

        <section className={styles.panel}>
          <h2 className={styles.panelTitle}>
            <MessageSquare size={18} />
            Progress notes
          </h2>
          <p className={styles.panelHint}>
            Notes shared with you by your supervisor are shown.
          </p>
          <ul className={styles.noteList}>
            {overlay.progressNotes.map((note) => (
              <li key={note.id} className={styles.note}>
                <div className={styles.noteHead}>
                  <p className={styles.noteAuthor}>{note.author}</p>
                  <span className={`${styles.noteKind} ${noteKindClass[note.kind]}`}>
                    {note.kind}
                  </span>
                </div>
                <p className={styles.noteBody}>{note.body}</p>
                <p className={styles.noteDate}>{note.date}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className={styles.prototypeWrap}>
        <span className={styles.prototypeChip}>
          <UserRound size={13} />
          Prototype: NYSC / Intern
        </span>
      </div>
    </div>
  );
}
