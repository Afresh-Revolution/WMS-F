"use client";

import { PageDateLabel } from "@/components/layout/PageDateLabel";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Check, FileText, Search } from "lucide-react";
import { NotificationsLink, ProfileLink } from "@/components/layout/PageLinks";
import { useCurrentUser } from "@/components/layout/CurrentUserProvider";
import { useAsyncData } from "@/hooks/useAsyncData";
import { usePageActions } from "@/hooks/usePageActions";
import { secretaryApi } from "@/lib/api";
import { formatRelativeTime, listFrom, str } from "@/lib/api/mappers";
import {
  type Notification,
  type NotificationFilter,
  type NotificationType,
} from "@/data/notifications";
import styles from "./SecretaryNotificationsPage.module.css";

const filters: NotificationFilter[] = ["All", "Unread", "Workflow", "System"];

type SecretaryNotification = Notification & { href?: string };

function mapType(value: unknown, referenceId?: string): NotificationType {
  const type = str(value).toLowerCase();
  if (
    type.includes("system") ||
    type.includes("alert") ||
    type.includes("announce") ||
    type.includes("email") ||
    type.includes("reminder") ||
    type.includes("meeting") ||
    type.includes("calendar")
  ) {
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

function inferHref(record: Record<string, unknown>, message: string) {
  const explicit = str(
    record.href ?? record.url ?? record.link ?? record.path ?? record.actionUrl,
  );
  if (explicit.startsWith("/")) return explicit;
  const haystack = `${str(record.type ?? record.category ?? record.kind)} ${message}`.toLowerCase();
  if (haystack.includes("email")) return "/secretary/email-requests";
  if (haystack.includes("reminder")) return "/secretary/reminders";
  if (haystack.includes("meeting") || haystack.includes("agenda")) {
    return "/secretary/meetings";
  }
  if (haystack.includes("task")) return "/secretary/tasks";
  if (haystack.includes("calendar")) return "/secretary/calendar";
  return undefined;
}

function mapNotification(
  record: Record<string, unknown>,
  index: number,
): SecretaryNotification {
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
    href: inferHref(record, message),
  };
}

export function SecretaryNotificationsPage() {
  const router = useRouter();
  const { user } = useCurrentUser();
  const { runAction } = usePageActions();
  const searchRef = useRef<HTMLInputElement>(null);
  const [filter, setFilter] = useState<NotificationFilter>("All");
  const [query, setQuery] = useState("");
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const { data, loading, error, refetch } = useAsyncData(
    () => secretaryApi.listNotifications(),
    [],
  );

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const items = useMemo(() => {
    return listFrom(data ?? undefined)
      .map((record, index) => mapNotification(record, index))
      .map((item) => (readIds.has(item.id) ? { ...item, unread: false } : item));
  }, [data, readIds]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return items.filter((item) => {
      if (filter === "Unread" && !item.unread) return false;
      if (filter === "Workflow" && item.type !== "Workflow") return false;
      if (filter === "System" && item.type !== "System") return false;
      if (!needle) return true;
      return `${item.referenceId ?? ""} ${item.message} ${item.type}`
        .toLowerCase()
        .includes(needle);
    });
  }, [filter, items, query]);

  const unread = items.filter((item) => item.unread);

  function markLocal(ids: string[]) {
    setReadIds((current) => {
      const next = new Set(current);
      for (const id of ids) next.add(id);
      return next;
    });
  }

  async function markOneRead(item: SecretaryNotification) {
    if (item.unread) {
      try {
        await secretaryApi.markNotificationRead(item.id);
        markLocal([item.id]);
        refetch();
      } catch {
        markLocal([item.id]);
      }
    }
    if (item.href) router.push(item.href);
  }

  async function markAllRead() {
    if (unread.length === 0) return;
    await runAction("Mark all as read", async () => {
      await secretaryApi.markAllNotificationsRead().catch(async () => {
        await Promise.all(
          unread.map((item) =>
            secretaryApi.markNotificationRead(item.id).catch(() => undefined),
          ),
        );
      });
      markLocal(unread.map((item) => item.id));
      refetch();
    });
  }

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <PageDateLabel className={styles.dateLabel} />
        <div className={styles.topActions}>
          <label className={styles.search}>
            <Search size={15} className={styles.searchIcon} />
            <input
              ref={searchRef}
              type="search"
              placeholder="Search"
              className={styles.searchInput}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              aria-label="Search"
            />
            <kbd className={styles.searchShortcut}>⌘K</kbd>
          </label>
          <NotificationsLink className={styles.iconButton}>
            <Bell size={16} />
          </NotificationsLink>
          <ProfileLink className={styles.avatarChip}>
            {user?.initials || "—"}
          </ProfileLink>
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
        <div className={styles.filters} role="tablist" aria-label="Notification filters">
          {filters.map((item) => (
            <button
              key={item}
              type="button"
              role="tab"
              aria-selected={filter === item}
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
        {visible.length > 0 ? (
          visible.map((item) => (
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
          ))
        ) : (
          <div className={styles.empty}>
            {loading
              ? "Loading notifications…"
              : error
                ? error
                : "No notifications in this view."}
          </div>
        )}
      </div>
    </div>
  );
}
