"use client";

import { useMemo } from "react";
import { NotificationsLink, ProfileLink } from "@/components/layout/PageLinks";
import { employeeHome, employeeProfile } from "@/data/employeeHome";
import { useAsyncData } from "@/hooks/useAsyncData";
import { usePageActions } from "@/hooks/usePageActions";
import { notificationsApi } from "@/lib/api";
import { listFrom, str } from "@/lib/api/mappers";
import styles from "./EmployeeUtilityPages.module.css";

export function EmployeeNotificationsPage() {
  const { runAction } = usePageActions();
  const { data, loading, error, refetch } = useAsyncData(
    () => notificationsApi.list(),
    [],
  );

  const notifications = useMemo(() => {
    const mapped = listFrom(data ?? undefined).map((record, index) => ({
      id: str(record.id ?? record._id, String(index)),
      text: str(
        record.message ?? record.body ?? record.title,
        "Notification update",
      ),
      unread: !Boolean(record.read ?? record.isRead ?? record.readAt),
    }));
    if (mapped.length > 0) return mapped;
    return employeeHome.notifications.map((item, index) => ({
      id: `local-${index}`,
      text: item.message,
      unread: true,
    }));
  }, [data]);

  const unread = notifications.filter((item) => item.unread);

  async function handleMarkRead(id: string, currentlyUnread: boolean) {
    if (!currentlyUnread) return;
    await runAction(
      "Mark as read",
      async () => {
        await notificationsApi.markRead(id);
        refetch();
      },
      "Notification marked as read",
    );
  }

  async function handleMarkAllRead() {
    await runAction(
      "Mark all as read",
      async () => {
        await notificationsApi.markAllRead();
        refetch();
      },
      "All notifications marked as read",
    );
  }

  return (
    <div className={styles.page}>
      {loading ? <p className={styles.hint}>Loading notifications…</p> : null}
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

      <div className={styles.headerRow}>
        <div>
          <p className={styles.eyebrow}>Notifications</p>
          <h1 className={styles.title}>Your alerts</h1>
        </div>
        <button
          type="button"
          className={styles.markAllButton}
          onClick={() => void handleMarkAllRead()}
          disabled={unread.length === 0}
        >
          Mark all as read
        </button>
      </div>
      <p className={styles.subtitle}>
        Leave, task, meeting, and expense updates for your workspace.
      </p>

      <div className={styles.list}>
        {notifications.length === 0 ? (
          <p className={styles.empty}>No notifications yet.</p>
        ) : (
          notifications.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`${styles.noticeCard} ${
                item.unread ? styles.noticeCardUnread : ""
              }`}
              onClick={() => void handleMarkRead(item.id, item.unread)}
            >
              <span className={styles.noticeTop}>
                <span className={styles.cardTitle}>{item.text}</span>
                {item.unread ? (
                  <span className={styles.unreadDot} aria-label="Unread" />
                ) : null}
              </span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
