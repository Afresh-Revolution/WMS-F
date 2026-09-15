"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Bell, Search } from "lucide-react";
import { AccountantStatusLine } from "@/components/accountant/AccountantStatusLine";
import { useAsyncData } from "@/hooks/useAsyncData";
import { useInternAccount } from "@/hooks/useInternAccount";
import { usePageActions } from "@/hooks/usePageActions";
import { internApi } from "@/lib/api";
import {
  mapInternNotification,
  mappedOrFallback,
  unwrapInternList,
} from "@/lib/api/internMappers";
import styles from "./NyscUtilityPages.module.css";

export function NyscNotificationsPage() {
  const { account } = useInternAccount("chidi");
  const { runAction } = usePageActions();
  const { data, loading, error, refetch } = useAsyncData(
    () => internApi.notifications.list(),
    [],
  );

  const notifications = useMemo(
    () =>
      mappedOrFallback(
        data,
        unwrapInternList(data).map(mapInternNotification),
        account.notifications,
      ),
    [account.notifications, data],
  );
  const unread = notifications.filter((item) => item.unread ?? item.featured);

  async function handleMarkRead(id: string, currentlyUnread: boolean) {
    if (!currentlyUnread) return;
    await runAction(
      "Mark as read",
      async () => {
        await internApi.notifications.markRead(id);
        refetch();
      },
      "Notification marked as read",
    );
  }

  async function handleMarkAllRead() {
    await runAction(
      "Mark all as read",
      async () => {
        await Promise.all(
          unread.map((item) => internApi.notifications.markRead(item.id)),
        );
        refetch();
      },
      "All notifications marked as read",
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
        <p className={styles.dateLabel}>Monday, August 17</p>
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
            {unread.length > 0 ? (
              <span className={styles.notifDot} aria-hidden />
            ) : null}
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
        Task assignments, meeting reminders, and placement alerts for your
        workspace.
      </p>

      <div className={styles.list}>
        {notifications.length === 0 ? (
          <p className={styles.empty}>No notifications yet.</p>
        ) : (
          notifications.map((item) => {
            const isUnread = Boolean(item.unread ?? item.featured);
            return (
              <button
                key={item.id}
                type="button"
                className={`${styles.noticeCard} ${
                  isUnread ? styles.noticeCardUnread : ""
                }`}
                onClick={() => void handleMarkRead(item.id, isUnread)}
              >
                <span className={styles.noticeTop}>
                  <span className={styles.cardTitle}>{item.text}</span>
                  {isUnread ? (
                    <span className={styles.unreadDot} aria-label="Unread" />
                  ) : null}
                </span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
