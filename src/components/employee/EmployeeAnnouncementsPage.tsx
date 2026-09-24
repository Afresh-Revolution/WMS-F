"use client";

import { PageDateLabel } from "@/components/layout/PageDateLabel";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { NotificationsLink, ProfileLink } from "@/components/layout/PageLinks";
import { useCurrentUser } from "@/components/layout/CurrentUserProvider";
import { useAsyncData } from "@/hooks/useAsyncData";
import {
  getStaffAnnouncement,
  getStaffUnreadCount,
  listStaffAnnouncements,
  markStaffAnnouncementRead,
  staffUnreadCountFrom,
} from "@/lib/api";
import { listFrom, mapAnnouncement } from "@/lib/api/mappers";
import styles from "./EmployeeAnnouncementsPage.module.css";

type EmployeeAnnouncement = {
  id: string;
  title: string;
  source: string;
  date: string;
  body: string;
  unread: boolean;
  pinned: boolean;
};

export function EmployeeAnnouncementsPage() {
  const { user } = useCurrentUser();
  const [openedId, setOpenedId] = useState<string | null>(null);
  const [localRead, setLocalRead] = useState<Set<string>>(new Set());

  const { data, loading, error } = useAsyncData(
    () => listStaffAnnouncements(),
    [],
  );
  const { data: unreadPayload } = useAsyncData(
    () => getStaffUnreadCount().catch(() => null),
    [],
  );

  const announcements = useMemo((): EmployeeAnnouncement[] => {
    return listFrom(data ?? undefined).map((record) => {
      const item = mapAnnouncement(record);
      return {
        id: item.id,
        title: item.title,
        source: item.source,
        date: item.date,
        body: item.body,
        unread: localRead.has(item.id) ? false : item.unread,
        pinned: item.pinned,
      };
    });
  }, [data, localRead]);

  const unreadCount = useMemo(() => {
    const mapped = announcements.filter((item) => item.unread).length;
    if (localRead.size > 0 || !unreadPayload) return mapped;
    return staffUnreadCountFrom(unreadPayload) || mapped;
  }, [announcements, localRead.size, unreadPayload]);

  async function openAnnouncement(item: EmployeeAnnouncement) {
    const next = openedId === item.id ? null : item.id;
    setOpenedId(next);
    if (!next || !item.unread) return;
    try {
      await getStaffAnnouncement(item.id).catch(() => undefined);
      await markStaffAnnouncementRead(item.id);
      setLocalRead((current) => new Set(current).add(item.id));
    } catch {
      /* keep the item open even if mark-read fails */
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
        <p>Announcements</p>
        <h1>Company and department news</h1>
        <span>Published updates targeted to you. Expired and draft items stay off this feed.</span>
        {loading ? <p className={styles.metaLine}>Loading announcements…</p> : null}
        {error ? (
          <p className={styles.error} role="alert">
            {error}
          </p>
        ) : null}
        {!loading && !error ? (
          <p className={styles.metaLine}>
            {unreadCount} unread
          </p>
        ) : null}
      </div>

      <section className={styles.list} aria-label="Announcements">
        {announcements.length === 0 && !loading ? (
          <p className={styles.empty}>No announcements yet.</p>
        ) : (
          announcements.map((item) => {
            const open = openedId === item.id;
            return (
              <article
                key={item.id}
                className={`${styles.card} ${item.unread ? styles.cardUnread : ""}`}
              >
                <button
                  type="button"
                  className={styles.cardButton}
                  onClick={() => void openAnnouncement(item)}
                >
                  <div className={styles.cardTop}>
                    <h2 className={item.unread ? styles.titleUnread : undefined}>
                      {item.title}
                    </h2>
                    <span>{item.pinned ? "Pinned" : item.source}</span>
                  </div>
                  {item.date ? <p className={styles.date}>{item.date}</p> : null}
                </button>
                {open && item.body ? (
                  <p className={styles.body}>{item.body}</p>
                ) : null}
              </article>
            );
          })
        )}
      </section>
    </div>
  );
}
