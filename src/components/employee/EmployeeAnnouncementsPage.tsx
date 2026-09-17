"use client";

import { useMemo } from "react";
import { NotificationsLink, ProfileLink } from "@/components/layout/PageLinks";
import { employeeHome, employeeProfile } from "@/data/employeeHome";
import { useAsyncData } from "@/hooks/useAsyncData";
import { announcementsApi } from "@/lib/api";
import { listFrom, str } from "@/lib/api/mappers";
import styles from "./EmployeeUtilityPages.module.css";

export function EmployeeAnnouncementsPage() {
  const { data, loading, error } = useAsyncData(
    () => announcementsApi.list(),
    [],
  );

  const announcements = useMemo(() => {
    const mapped = listFrom(data ?? undefined).map((record, index) => ({
      id: str(record.id ?? record._id, String(index)),
      title: str(record.title ?? record.name, "Announcement"),
      meta: str(
        record.department ?? record.source ?? record.createdAt ?? record.date,
      ),
      body: str(record.body ?? record.summary ?? record.description),
    }));
    if (mapped.length > 0) return mapped;
    return employeeHome.announcements.map((item, index) => ({
      id: `local-${index}`,
      title: item.title,
      meta: item.meta,
      body: "",
    }));
  }, [data]);

  return (
    <div className={styles.page}>
      {loading ? <p className={styles.hint}>Loading announcements…</p> : null}
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

      <p className={styles.eyebrow}>Announcements</p>
      <h1 className={styles.title}>Company and team news</h1>
      <p className={styles.subtitle}>
        Updates from HR and your department that apply to your role.
      </p>

      <div className={styles.list}>
        {announcements.length === 0 ? (
          <p className={styles.empty}>No announcements yet.</p>
        ) : (
          announcements.map((item) => (
            <article key={item.id} className={styles.card}>
              <h2 className={styles.cardTitle}>{item.title}</h2>
              {item.body ? <p className={styles.cardBody}>{item.body}</p> : null}
              {item.meta ? <p className={styles.cardMeta}>{item.meta}</p> : null}
            </article>
          ))
        )}
      </div>
    </div>
  );
}
