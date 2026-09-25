"use client";

import { useMemo, useState } from "react";
import { Bell, Check, FileText, Receipt } from "lucide-react";
import {
  type Notification,
  type NotificationFilter,
  type NotificationType,
} from "@/data/notifications";
import { useAsyncData } from "@/hooks/useAsyncData";
import { usePageActions } from "@/hooks/usePageActions";
import { employeeApi, managerApi, notificationsApi } from "@/lib/api";
import { formatRelativeTime, listFrom, str } from "@/lib/api/mappers";
import styles from "@/components/notifications/NotificationsPage.module.css";

const filters: NotificationFilter[] = ["All", "Unread", "Workflow", "System"];

function WorkflowIcon({ item }: { item: Notification }) {
  const haystack = `${item.referenceId ?? ""} ${item.message}`.toLowerCase();
  if (haystack.startsWith("ex") || haystack.includes("expense")) {
    return <Receipt size={18} strokeWidth={2} />;
  }
  return <FileText size={18} strokeWidth={2} />;
}

function mapType(value: unknown, referenceId?: string): NotificationType {
  const type = str(value).toLowerCase();
  if (type.includes("system") || type.includes("alert") || type.includes("announce")) {
    return "System";
  }
  if (
    type.includes("work") ||
    type.includes("leave") ||
    type.includes("expense") ||
    type.includes("purchase") ||
    type.includes("approval") ||
    referenceId
  ) {
    return "Workflow";
  }
  return referenceId ? "Workflow" : "System";
}

function isUnread(record: Record<string, unknown>) {
  if (typeof record.unread === "boolean") return record.unread;
  if (typeof record.isUnread === "boolean") return record.isUnread;
  if (typeof record.isRead === "boolean") return !record.isRead;
  if (typeof record.read === "boolean") return !record.read;
  return !record.readAt;
}

function extractReference(record: Record<string, unknown>, message: string) {
  const explicit = str(
    record.referenceId ??
      record.reference_id ??
      record.reference ??
      record.code ??
      record.ref,
  );
  if (explicit) return explicit;
  return message.match(/\b([A-Z]{1,4}-\d{2,})\b/)?.[1];
}

function mapNotification(
  record: Record<string, unknown>,
  index: number,
): Notification {
  const message = str(record.message ?? record.body ?? record.title);
  const referenceId = extractReference(record, message);
  const timeRaw =
    record.timeAgo ??
    record.relativeTime ??
    record.createdAt ??
    record.created_at ??
    record.publishedAt ??
    record.date ??
    record.time;
  return {
    id: str(record.id ?? record._id, String(index)),
    type: mapType(record.type ?? record.category ?? record.kind, referenceId),
    referenceId,
    message,
    timeAgo: timeRaw ? formatRelativeTime(timeRaw) : undefined,
    unread: isUnread(record),
  };
}

async function loadManagerNotifications() {
  const settled = await Promise.allSettled([
    managerApi.listNotifications(),
    notificationsApi.list(),
    employeeApi.notifications.list(),
  ]);
  for (const result of settled) {
    if (result.status === "fulfilled" && result.value) return result.value;
  }
  return [];
}

export function ManagerNotificationsPage() {
  const { runAction } = usePageActions();
  const [filter, setFilter] = useState<NotificationFilter>("All");
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const { data, loading, error, refetch } = useAsyncData(
    () => loadManagerNotifications(),
    [],
  );

  const items = useMemo(() => {
    return listFrom(data ?? undefined)
      .map((record, index) => mapNotification(record, index))
      .map((item) => (readIds.has(item.id) ? { ...item, unread: false } : item));
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

  function markLocal(ids: string[]) {
    setReadIds((current) => {
      const next = new Set(current);
      for (const id of ids) next.add(id);
      return next;
    });
  }

  async function markOneRead(item: Notification) {
    if (!item.unread) return;
    await runAction("Mark notification read", async () => {
      await managerApi.markNotificationRead(item.id).catch(() =>
        notificationsApi.markRead(item.id),
      );
      markLocal([item.id]);
      refetch();
    });
  }

  async function markAllRead() {
    if (unread.length === 0) return;
    await runAction("Mark all as read", async () => {
      await notificationsApi.markAllRead().catch(async () => {
        await Promise.all(
          unread.map((item) =>
            managerApi.markNotificationRead(item.id).catch(() => undefined),
          ),
        );
      });
      markLocal(unread.map((item) => item.id));
      refetch();
    });
  }

  return (
    <div className={styles.page}>
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
            <p className={styles.summaryTotal}>
              {visible.length} total in this view
            </p>
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

      {visible.length > 0 ? (
        <div className={styles.listWrap}>
          {visible.map((item) => (
            <article
              key={item.id}
              className={`${styles.item} ${item.unread ? styles.itemUnread : ""}`}
              onClick={() => void markOneRead(item)}
            >
              <div
                className={`${styles.itemIcon} ${
                  item.type === "Workflow"
                    ? styles.itemIconWorkflow
                    : styles.itemIconSystem
                }`}
              >
                {item.type === "Workflow" ? (
                  <WorkflowIcon item={item} />
                ) : (
                  <Bell size={18} strokeWidth={2} />
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
        </div>
      ) : (
        <div className={styles.listWrap}>
          <div className={styles.empty}>
            {loading
              ? "Loading notifications…"
              : error
                ? error
                : "No notifications in this view."}
          </div>
        </div>
      )}
    </div>
  );
}
