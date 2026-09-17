"use client";

import { NotificationsLink, ProfileLink } from "@/components/layout/PageLinks";
import styles from "@/components/employee/EmployeeUtilityPages.module.css";

const helpItems = [
  {
    id: "directory",
    title: "Company email directory",
    body: "Search provisioned mailboxes, then edit, suspend, or request deactivation from the directory row menu.",
  },
  {
    id: "requests",
    title: "Email requests",
    body: "Open the queue to provision a new address. Check availability before you create the mailbox.",
  },
  {
    id: "meetings",
    title: "Meetings and calendar",
    body: "Today, HODs, and admin lists live under Meetings. Use Calendar for the week and agenda views.",
  },
  {
    id: "reminders",
    title: "Reminders",
    body: "Track open follow-ups from Reminders. Completed items stay under Done so you can confirm they were sent.",
  },
];

export function SecretaryHelpPage() {
  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <p className={styles.dateLabel}>Monday, August 3</p>
        <div className={styles.topActions}>
          <NotificationsLink className={styles.iconButton} />
          <ProfileLink className={styles.avatarChip}>GB</ProfileLink>
        </div>
      </div>

      <p className={styles.eyebrow}>Help center</p>
      <h1 className={styles.title}>Secretary guides</h1>
      <p className={styles.subtitle}>
        Short answers for mailboxes, meetings, calendar, and reminders.
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
