"use client";

import { PageDateLabel } from "@/components/layout/PageDateLabel";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Bell,
  CheckCheck,
  FileText,
  Search,
} from "lucide-react";
import { AccountantStatusLine } from "@/components/accountant/AccountantStatusLine";
import { useAsyncData } from "@/hooks/useAsyncData";
import { usePageActions } from "@/hooks/usePageActions";
import { accountantApi } from "@/lib/api";
import {
  mapAccountantNotification,
  unwrapAccountantList,
} from "@/lib/api/accountantMappers";
import {
  accountantNotificationFilters,
  matchesNotificationFilter,
  type AccountantNotification,
  type AccountantNotificationFilter,
  type AccountantNotificationKind,
} from "@/data/accountantNotifications";
import styles from "./AccountantNotificationsPage.module.css";

const kindClass: Record<AccountantNotificationKind, string> = {
  Workflow: styles.kindWorkflow,
  System: styles.kindSystem,
};

export function AccountantNotificationsPage() {
  const [filter, setFilter] = useState<AccountantNotificationFilter>("All");
  const { runAction } = usePageActions();
  const { data, loading, error, refetch } = useAsyncData(
    () => accountantApi.notifications.list(),
    [],
  );

  const notifications = useMemo(
    () => unwrapAccountantList(data).map(mapAccountantNotification),
    [data],
  );

  const filtered = useMemo(
    () =>
      notifications.filter((item) => matchesNotificationFilter(item, filter)),
    [filter, notifications],
  );

  const unreadCount = useMemo(
    () => notifications.filter((item) => item.unread).length,
    [notifications],
  );

  async function handleMarkAllRead() {
    await runAction(
      "Mark all as read",
      async () => {
        const unread = notifications.filter((item) => item.unread);
        await Promise.all(
          unread.map((item) => accountantApi.notifications.markRead(item.id)),
        );
        refetch();
      },
      "All notifications marked as read",
    );
  }

  async function handleMarkRead(item: AccountantNotification) {
    if (!item.unread) return;
    await runAction(
      "Mark as read",
      async () => {
        await accountantApi.notifications.markRead(item.id);
        refetch();
      },
      "Notification marked as read",
    );
  }

  return (
    <div className={styles.page}>
      <AccountantStatusLine
        loading={loading}
        error={error}
        resource="notifications"
      />
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
            href="/accountant/notifications"
            className={styles.iconButton}
            aria-label="Notifications"
          >
            <span className={styles.notifDot} aria-hidden />
            <Bell size={16} />
          </Link>
          <Link
            href="/accountant/profile"
            className={styles.avatarChip}
            aria-label="Profile"
          >
            RK
          </Link>
        </div>
      </div>

      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Communication · Notifications</p>
          <h1 className={styles.title}>Notifications</h1>
          <p className={styles.subtitle}>
            Approval activity, workflow updates and company-wide alerts in one
            place.
          </p>
        </div>
        <button
          type="button"
          className={styles.markAllButton}
          onClick={() => void handleMarkAllRead()}
          disabled={unreadCount === 0}
        >
          <CheckCheck size={16} />
          Mark all as read
        </button>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon} aria-hidden>
            <Bell size={16} />
          </span>
          <div>
            <p className={styles.summaryTitle}>
              {unreadCount} unread
            </p>
            <p className={styles.summaryMeta}>
              {filtered.length} total in this view
            </p>
          </div>
        </div>

        <div className={styles.tabs} role="tablist" aria-label="Notification filters">
          {accountantNotificationFilters.map((item) => (
            <button
              key={item}
              type="button"
              role="tab"
              aria-selected={filter === item}
              className={`${styles.tab} ${filter === item ? styles.tabActive : ""}`}
              onClick={() => setFilter(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.list}>
        {filtered.length === 0 ? (
          <p className={styles.empty}>No notifications in this filter.</p>
        ) : (
          filtered.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`${styles.card} ${item.unread ? styles.cardUnread : ""}`}
              onClick={() => void handleMarkRead(item)}
            >
              <span className={styles.cardIcon} aria-hidden>
                {item.kind === "Workflow" ? (
                  <FileText size={16} />
                ) : (
                  <Bell size={16} />
                )}
              </span>
              <span className={styles.cardBody}>
                <span className={styles.cardTop}>
                  <span className={`${styles.kind} ${kindClass[item.kind]}`}>
                    {item.kind}
                  </span>
                  {item.unread ? (
                    <span className={styles.unreadDot} aria-label="Unread" />
                  ) : null}
                </span>
                <span className={styles.message}>{item.message}</span>
                <span className={styles.time}>{item.time}</span>
              </span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
