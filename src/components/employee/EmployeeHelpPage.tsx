"use client";

import { PageDateLabel } from "@/components/layout/PageDateLabel";
import { NotificationsLink, ProfileLink } from "@/components/layout/PageLinks";
import { useCurrentUser } from "@/components/layout/CurrentUserProvider";
import styles from "./EmployeeUtilityPages.module.css";

const helpItems = [
  {
    id: "leave",
    title: "Requesting leave",
    body: "Open My Leave, choose a leave type, and submit dates. Pending requests stay visible until HR approves or declines them.",
  },
  {
    id: "expenses",
    title: "Submitting expenses",
    body: "Use My Expenses to add a claim and attach a receipt. Approved claims then appear under My Reimbursements until they are paid.",
  },
  {
    id: "tasks",
    title: "Updating tasks",
    body: "My Tasks lists work assigned to you. Move items through in progress, in review, and completed as you finish them.",
  },
  {
    id: "profile",
    title: "What you can change",
    body: "My Profile and Account Settings cover contact details and notification preferences. Role, department, and salary stay with HR.",
  },
];

export function EmployeeHelpPage() {
  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <PageDateLabel className={styles.dateLabel} />
        <div className={styles.topActions}>
          <NotificationsLink className={styles.iconButton} />
          <ProfileLink className={styles.avatarChip}>
            {user?.initials || "—"}
          </ProfileLink>
        </div>
      </div>

      <p className={styles.eyebrow}>Help center</p>
      <h1 className={styles.title}>Staff guides</h1>
      <p className={styles.subtitle}>
        Short answers for leave, expenses, tasks, and your profile.
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
