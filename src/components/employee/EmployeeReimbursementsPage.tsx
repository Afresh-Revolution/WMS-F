"use client";

import { useMemo } from "react";
import { NotificationsLink, ProfileLink } from "@/components/layout/PageLinks";
import { employeeHome, employeeProfile } from "@/data/employeeHome";
import { useAsyncData } from "@/hooks/useAsyncData";
import { expensesApi } from "@/lib/api";
import { listFrom, str } from "@/lib/api/mappers";
import styles from "./EmployeeUtilityPages.module.css";

function isReimbursement(status: string) {
  const value = status.toLowerCase();
  return (
    value.includes("reimburse") ||
    value === "paid" ||
    value === "returned" ||
    value === "return"
  );
}

export function EmployeeReimbursementsPage() {
  const { data, loading, error } = useAsyncData(() => expensesApi.list(), []);

  const items = useMemo(() => {
    const mapped = listFrom(data ?? undefined)
      .map((record, index) => ({
        id: str(record.id ?? record._id, String(index)),
        title: str(record.title ?? record.name ?? record.description, "Expense"),
        status: str(record.status ?? record.state, "Pending"),
      }))
      .filter((item) => isReimbursement(item.status));
    if (mapped.length > 0) return mapped;
    return employeeHome.reimbursements.map((item, index) => ({
      id: `local-${index}`,
      title: item.title,
      status: item.status,
    }));
  }, [data]);

  return (
    <div className={styles.page}>
      {loading ? <p className={styles.hint}>Loading reimbursements…</p> : null}
      {error ? (
        <p className={styles.hint} role="alert">
          {error}
        </p>
      ) : null}
      <div className={styles.topBar}>
        <p className={styles.dateLabel}>Wednesday, August 12</p>
        <div className={styles.topActions}>
          <NotificationsLink className={styles.iconButton} />
          <ProfileLink className={styles.avatarChip}>
            {employeeProfile.initials}
          </ProfileLink>
        </div>
      </div>

      <p className={styles.eyebrow}>My reimbursements</p>
      <h1 className={styles.title}>Payments on your claims</h1>
      <p className={styles.subtitle}>
        Track which approved expenses have been paid, returned, or are still
        processing.
      </p>

      <div className={styles.list}>
        {items.length === 0 ? (
          <p className={styles.empty}>No reimbursements to show.</p>
        ) : (
          items.map((item) => (
            <article key={item.id} className={styles.card}>
              <h2 className={styles.cardTitle}>{item.title}</h2>
              <p className={styles.cardMeta}>{item.status}</p>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
