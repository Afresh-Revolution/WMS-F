"use client";

import { useMemo, useState } from "react";
import { Bell, Check, FileText, Search } from "lucide-react";
import { NotificationsLink, ProfileLink } from "@/components/layout/PageLinks";
import { useAsyncData } from "@/hooks/useAsyncData";
import { usePageActions } from "@/hooks/usePageActions";
import { secretaryApi } from "@/lib/api";
import { str } from "@/lib/api/mappers";
import {
  notifications as fallbackNotifications,
  type Notification,
  type NotificationFilter,
  type NotificationType,
} from "@/data/notifications";
import styles from "@/components/notifications/NotificationsPage.module.css";

const filters: NotificationFilter[] = ["All", "Unread", "Workflow", "System"];

function mapType(value: unknown): NotificationType {
  const type = str(value).toLowerCase();
  return type.includes("system") ? "System" : "Workflow";
}

function mapNotification(
  record: Record<string, unknown>,
  index: number,
): Notification {
  return {
    id: str(record.id ?? record._id, String(index)),
    type: mapType(record.type ?? record.category),
    referenceId:
      str(record.referenceId ?? record.reference_id ?? record.code) || undefined,
    message: str(
      record.message ?? record.body ?? record.title,
      "Notification update",
    ),
    timeAgo:
      str(record.timeAgo ?? record.relativeTime ?? record.createdAt) || undefined,
    unread: !Boolean(record.read ?? record.isRead ?? record.readAt),
  };
}

export function SecretaryNotificationsPage() {
  const { runAction } = usePageActions();
  const [filter, setFilter] = useState<NotificationFilter>("All");
  const [readIds, setReadIds] = useState<Record<string, boolean>>({});
  const { data, loading, error, refetch } = useAsyncData(
    () => secretaryApi.listNotifications(),
    [],
  );

  const items = useMemo(() => {
    const mapped =
      data && data.length > 0
        ? data.map((record, index) => mapNotification(record, index))
        : fallbackNotifications;
    return mapped.map((item) =>
      readIds[item.id] ? { ...item, unread: false } : item,
    );
  }, [data, readIds]);

  const visible = useMemo(
    () =>
      items.filter((item) => {
        if (filter === "All") return true;
        if (filter === "Unread") return item.unread;
        return item.type === filter;
      }),
    [filter, items],
  );

  const unread = items.filter((item) => item.unread);

  async function markAllRead() {
    await runAction("Mark all as read", async () => {
      await Promise.all(
        unread.map((item) => secretaryApi.markNotificationRead(item.id)),
      );
      setReadIds((current) => ({
        ...current,
        ...Object.fromEntries(unread.map((item) => [item.id, true])),
      }));
      refetch();
    });
  }

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <p className={styles.dateLabel}>Monday, August 3</p>
        <div className={styles.topActions}>
          <label className={styles.topSearch}>
            <Search size={15} className={styles.topSearchIcon} />
            <input
              placeholder="Search"
              className={styles.topSearchInput}
              readOnly
              aria-label="Search"
            />
            <kbd className={styles.searchShortcut}>⌘K</kbd>
          </label>
          <NotificationsLink className={styles.iconButton}>
            <Bell size={16} />
          </NotificationsLink>
          <ProfileLink className={styles.avatarChip}>GB</ProfileLink>
        </div>
      </div>

      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Secretary · Notifications</p>
          <h1 className={styles.title}>Notifications</h1>
          <p className={styles.subtitle}>
            Email requests, meeting updates, reminders and task activity.
          </p>
          {loading ? <p className={styles.subtitle}>Loading notifications…</p> : null}
          {error ? (
            <p className={styles.subtitle}>Showing cached notifications — {error}</p>
          ) : null}
        </div>
        <button
          type="button"
          className={styles.markReadButton}
          onClick={() => void markAllRead()}
          disabled={unread.length === 0}
        >
          <Check size={15} strokeWidth={2} />
          Mark all as read
        </button>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.summaryCard}>
          <div className={styles.summaryIcon}>
            <Bell size={16} strokeWidth={2} />
          </div>
          <div className={styles.summaryText}>
            <p className={styles.summaryUnread}>{unread.length} unread</p>
            <p className={styles.summaryTotal}>{visible.length} total in this view</p>
          </div>
        </div>
        <div className={styles.filters}>
          {filters.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setFilter(item)}
              className={`${styles.filterChip} ${
                filter === item ? styles.filterChipActive : ""
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.listWrap}>
        {visible.map((item) => (
          <article
            key={item.id}
            className={`${styles.item} ${item.unread ? styles.itemUnread : ""}`}
          >
            <div
              className={`${styles.itemIcon} ${
                item.type === "Workflow"
                  ? styles.itemIconWorkflow
                  : styles.itemIconSystem
              }`}
            >
              {item.type === "Workflow" ? (
                <FileText size={18} />
              ) : (
                <Bell size={18} />
              )}
            </div>
            <div className={styles.itemBody}>
              <div className={styles.itemMeta}>
                {item.referenceId ? (
                  <span className={styles.referenceId}>{item.referenceId}</span>
                ) : null}
                <span
                  className={`${styles.tag} ${
                    item.type === "Workflow"
                      ? styles.tagWorkflow
                      : styles.tagSystem
                  }`}
                >
                  {item.type}
                </span>
                {item.unread ? (
                  <span className={styles.unreadDot} aria-label="Unread" />
                ) : null}
              </div>
              <p className={styles.message}>{item.message}</p>
              {item.timeAgo ? <p className={styles.timeAgo}>{item.timeAgo}</p> : null}
            </div>
          </article>
        ))}
        {visible.length === 0 ? (
          <div className={styles.empty}>No notifications in this view.</div>
        ) : null}
      </div>
    </div>
  );
}
