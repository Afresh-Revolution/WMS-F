"use client";

import { useMemo } from "react";
import { NotificationsLink, ProfileLink } from "@/components/layout/PageLinks";
import { employeeProfile } from "@/data/employeeHome";
import { useAsyncData } from "@/hooks/useAsyncData";
import { documentsApi } from "@/lib/api";
import { listFrom, str } from "@/lib/api/mappers";
import styles from "./EmployeeUtilityPages.module.css";

const fallbackRecords = [
  {
    id: "employment",
    title: "Employment record",
    meta: `${employeeProfile.employeeId} · ${employeeProfile.employmentType}`,
  },
  {
    id: "department",
    title: "Department assignment",
    meta: `${employeeProfile.department} · reports to ${employeeProfile.reportsTo}`,
  },
  {
    id: "start",
    title: "Start date",
    meta: employeeProfile.startDate,
  },
  {
    id: "contact",
    title: "Company email",
    meta: employeeProfile.companyEmail,
  },
];

export function EmployeeRecordsPage() {
  const { data, loading, error } = useAsyncData(
    () => documentsApi.list(),
    [],
  );

  const records = useMemo(() => {
    const mapped = listFrom(data ?? undefined).map((record, index) => ({
      id: str(record.id ?? record._id, String(index)),
      title: str(record.title ?? record.name ?? record.type, "Record"),
      meta: str(
        record.category ?? record.status ?? record.updatedAt ?? record.date,
      ),
    }));
    return mapped.length > 0 ? mapped : fallbackRecords;
  }, [data]);

  return (
    <div className={styles.page}>
      {loading ? <p className={styles.hint}>Loading records…</p> : null}
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

      <p className={styles.eyebrow}>My records</p>
      <h1 className={styles.title}>Your HR file</h1>
      <p className={styles.subtitle}>
        Employment details and documents attached to your staff profile.
      </p>

      <div className={styles.list}>
        {records.map((item) => (
          <article key={item.id} className={styles.card}>
            <h2 className={styles.cardTitle}>{item.title}</h2>
            {item.meta ? <p className={styles.cardMeta}>{item.meta}</p> : null}
          </article>
        ))}
      </div>
    </div>
  );
}
