"use client";

import { PageDateLabel } from "@/components/layout/PageDateLabel";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { NotificationsLink, ProfileLink } from "@/components/layout/PageLinks";
import { useCurrentUser } from "@/components/layout/CurrentUserProvider";
import { useAsyncData } from "@/hooks/useAsyncData";
import { usePageActions } from "@/hooks/usePageActions";
import { employeeApi, notificationsApi } from "@/lib/api";
import { bool, listFrom, str } from "@/lib/api/mappers";
import styles from "./EmployeeNotificationsPage.module.css";

type EmployeeNotification = {
  id: string;
  message: string;
  time: string;
  unread: boolean;
};

function mapNotification(
  record: Record<string, unknown>,
  index: number,
): EmployeeNotification {
  return {
    id: str(record.id ?? index),
    message: str(record.message ?? record.body ?? record.title),
    time: str(record.timeAgo ?? record.createdAt ?? record.time),
    unread: bool(record.unread ?? record.isUnread ?? !record.readAt, true),
  };
}

export function EmployeeNotificationsPage() {
  const { user } = useCurrentUser();
  const { runAction } = usePageActions();
  const [localRead, setLocalRead] = useState<Set<string>>(new Set());
  const { data } = useAsyncData(async () => {
    try {
      return await employeeApi.notifications.list();
    } catch {
      try {
        return await notificationsApi.list();
      } catch {
        return null;
      }
    }
  }, []);

  const notifications = useMemo(() => {
    const live = listFrom(data ?? undefined).map(mapNotification);
    return live.map((item) =>
      localRead.has(item.id) ? { ...item, unread: false } : item,
    );
  }, [data, localRead]);

  const unread = notifications.filter((item) => item.unread);

  function markLocal(ids: string[]) {
    setLocalRead((current) => {
      const next = new Set(current);
      for (const id of ids) next.add(id);
      return next;
    });
  }

  async function handleMarkRead(item: EmployeeNotification) {
    if (!item.unread) return;
    try {
      await runAction(
        "Mark as read",
        async () => {
          if (!item.id.startsWith("local-")) {
            await notificationsApi.markRead(item.id);
          }
          markLocal([item.id]);
        },
        "Notification marked as read",
      );
    } catch {
      /* runAction already showed the API error */
    }
  }

  async function handleMarkAllRead() {
    if (unread.length === 0) return;
    try {
      await runAction(
        "Mark all as read",
        async () => {
          const remote = unread.filter((item) => !item.id.startsWith("local-"));
          if (remote.length > 0) {
            await Promise.all(
              remote.map((item) => employeeApi.notifications.markRead(item.id)),
            );
          }
          markLocal(unread.map((item) => item.id));
        },
        "All notifications marked as read",
      );
    } catch {
      /* runAction already showed the API error */
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.topBar}>
        <PageDateLabel />
        <div className={styles.topActions}>
          <label className={styles.search}>
            <Search size={14} />
            <input aria-label="Search" placeholder="Search" readOnly />
            <kbd>⌘ K</kbd>
          </label>
          <NotificationsLink className={styles.iconButton} />
          <ProfileLink className={styles.profileButton}>
            {user?.initials || "—"}
          </ProfileLink>
        </div>
      </header>

      <div className={styles.heading}>
        <div>
          <p>Notifications</p>
          <h1>Your alerts</h1>
          <span>
            Leave, tasks, meetings and company updates for your workspace.
          </span>
        </div>
        <button
          type="button"
          className={styles.markAll}
          onClick={() => void handleMarkAllRead()}
          disabled={unread.length === 0}
        >
          Mark all as read
        </button>
      </div>

      <section className={styles.list} aria-label="Notifications">
        {notifications.length === 0 ? (
          <p className={styles.empty}>No notifications yet.</p>
        ) : (
          notifications.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`${styles.card} ${item.unread ? styles.cardUnread : ""}`}
              onClick={() => void handleMarkRead(item)}
            >
              <span className={styles.cardTop}>
                <span className={styles.message}>{item.message}</span>
                {item.unread ? (
                  <span className={styles.unreadDot} aria-label="Unread" />
                ) : null}
              </span>
              {item.time ? <span className={styles.time}>{item.time}</span> : null}
            </button>
          ))
        )}
      </section>
    </div>
  );
}
