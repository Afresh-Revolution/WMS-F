"use client";

import { PageDateLabel } from "@/components/layout/PageDateLabel";
import Link from "next/link";
import { Bell, Search } from "lucide-react";
import { useInternAccount } from "@/hooks/useInternAccount";
import styles from "./NyscUtilityPages.module.css";

const helpItems = [
  {
    id: "tasks",
    title: "Updating assigned work",
    body: "Open My Tasks, choose a task, then save progress between 0 and 100. Completing 100% marks the task completed if you do not pick another status.",
  },
  {
    id: "attendance",
    title: "GPS check-in vs placement attendance",
    body: "Location check-in uses your assigned sites. Daily placement attendance is a separate record of present, late, remote, or excused status.",
  },
  {
    id: "profile",
    title: "What you can change",
    body: "Account Settings can update name, phone, address, and emergency contact. Type, department, dates, and supervisor stay with HR.",
  },
  {
    id: "progress",
    title: "Reviews and targets",
    body: "My Progress shows placement elapsed time, assigned targets, and supervisor reviews. Only active or overdue targets accept progress updates.",
  },
];

export function NyscHelpPage() {
  const { account } = useInternAccount("chidi");

  return (
    <div className={styles.page}>
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

      <p className={styles.eyebrow}>Help center</p>
      <h1 className={styles.title}>Placement guides</h1>
      <p className={styles.subtitle}>
        Short answers for NYSC members and interns using this workspace.
      </p>

      <div className={styles.list}>
        {helpItems.map((item) => (
          <article key={item.id} className={styles.card}>
            <h2 className={styles.cardTitle}>{item.title}</h2>
            <p className={styles.cardBody}>{item.body}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
