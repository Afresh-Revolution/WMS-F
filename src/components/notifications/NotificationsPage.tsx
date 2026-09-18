"use client";

import { PageDateLabel } from "@/components/layout/PageDateLabel";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Bell, Check, FileText, Search } from "lucide-react";
import {
  type Notification,
  type NotificationFilter,
  type NotificationType,
} from "@/data/notifications";
import { useAsyncData } from "@/hooks/useAsyncData";
import { usePageActions } from "@/hooks/usePageActions";
import { superAdminApi } from "@/lib/api";
import { bool, listFrom, str } from "@/lib/api/mappers";
import styles from "./NotificationsPage.module.css";

const filters: NotificationFilter[] = ["All", "Unread", "Workflow", "System"];

const filterRoutes: Record<NotificationFilter, string> = {
  All: "/notifications",
  Unread: "/notifications/unread",
  Workflow: "/notifications/workflow",
  System: "/notifications/system",
};

const tagClass: Record<NotificationType, string> = {
  Workflow: styles.tagWorkflow,
  System: styles.tagSystem,
};

type NotificationsPageProps = {
  initialFilter?: NotificationFilter;
};

export function NotificationsPage({
  initialFilter = "All",
}: NotificationsPageProps) {
  const router = useRouter();
  const { runAction } = usePageActions();
  const { data, loading, error, refetch } = useAsyncData(
    () => superAdminApi.notifications.list(),
    [],
  );

  const items = useMemo((): Notification[] => {
    return listFrom(data ?? undefined).map((record, index) => {
      const typeRaw = str(record.type ?? record.category, "System").toLowerCase();
      const type: NotificationType = typeRaw.includes("work")
        ? "Workflow"
        : "System";
      return {
        id: str(record.id ?? index),
        type,
        referenceId: str(record.referenceId ?? record.reference ?? record.code) || undefined,
        message: str(record.message ?? record.body ?? record.title),
        timeAgo: str(record.timeAgo ?? record.createdAt) || undefined,
        unread: bool(record.unread ?? record.isUnread ?? !record.readAt),
      };
    });
  }, [data]);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (initialFilter === "All") return true;
      if (initialFilter === "Unread") return item.unread;
      return item.type === initialFilter;
    });
  }, [initialFilter, items]);

  const unreadCount = items.filter((item) => item.unread).length;

  function handleFilterChange(filter: NotificationFilter) {
    router.push(filterRoutes[filter]);
  }

  function markAllRead() {
    void runAction("Mark all as read", async () => {
      await superAdminApi.notifications.markAllRead();
      refetch();
    });
  }

  function markOneRead(id: string) {
    void runAction("Mark notification read", async () => {
      await superAdminApi.notifications.markRead(id);
      refetch();
    });
  }

  return (
      <div className={styles.page}>
        <div className={styles.topBar}>
          <PageDateLabel className={styles.dateLabel} />
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
            <button type="button" aria-label="Notifications" className={styles.iconButton}>
              <Bell size={16} />
            </button>
            <button type="button" aria-label="Profile" className={styles.avatarChip}>
              DO
            </button>
          </div>
        </div>

        <div className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Communication · Notifications</p>
            <h1 className={styles.title}>Notifications</h1>
            <p className={styles.subtitle}>
              Approval activity, workflow updates and company-wide alerts in
              one place.
            </p>
          </div>
          <button
            type="button"
            className={styles.markReadButton}
            onClick={markAllRead}
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
              <p className={styles.summaryUnread}>{unreadCount} unread</p>
              <p className={styles.summaryTotal}>
                {filtered.length} total in this view
              </p>
            </div>
          </div>

          <div className={styles.filters}>
            {filters.map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => handleFilterChange(filter)}
                className={`${styles.filterChip} ${
                  initialFilter === filter ? styles.filterChipActive : ""
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.listWrap}>
          {filtered.map((item) => (
            <article
              key={item.id}
              className={`${styles.item} ${item.unread ? styles.itemUnread : ""}`}
              onClick={() => item.unread && markOneRead(item.id)}
            >
              <div
                className={`${styles.itemIcon} ${
                  item.type === "Workflow"
                    ? styles.itemIconWorkflow
                    : styles.itemIconSystem
                }`}
              >
                {item.type === "Workflow" ? (
                  <FileText size={18} strokeWidth={2} />
                ) : (
                  <Bell size={18} strokeWidth={2} />
                )}
              </div>
              <div className={styles.itemBody}>
                <div className={styles.itemMeta}>
                  {item.referenceId && (
                    <span className={styles.referenceId}>{item.referenceId}</span>
                  )}
                  <span className={`${styles.tag} ${tagClass[item.type]}`}>
                    {item.type}
                  </span>
                  {item.unread && (
                    <span className={styles.unreadDot} aria-label="Unread" />
                  )}
                </div>
                <p className={styles.message}>{item.message}</p>
                {item.timeAgo && <p className={styles.timeAgo}>{item.timeAgo}</p>}
              </div>
            </article>
          ))}

          {loading ? (
            <div className={styles.empty}>Loading notifications…</div>
          ) : null}
          {error ? (
            <div className={styles.empty} role="alert">
              {error}
            </div>
          ) : null}
          {filtered.length === 0 && !loading ? (
            <div className={styles.empty}>No notifications in this view.</div>
          ) : null}
        </div>
      </div>
  );
}
