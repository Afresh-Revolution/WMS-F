"use client";

import { PageDateLabel } from "@/components/layout/PageDateLabel";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { NotificationsLink, ProfileLink } from "@/components/layout/PageLinks";
import { useCurrentUser } from "@/components/layout/CurrentUserProvider";
import { useAsyncData } from "@/hooks/useAsyncData";
import {
  asRecord,
  getStaffAnnouncement,
  listStaffAnnouncements,
  markStaffAnnouncementRead,
} from "@/lib/api";
import { listFrom, mapAnnouncement, nestedStr, str } from "@/lib/api/mappers";
import styles from "./EmployeeAnnouncementsPage.module.css";

type EmployeeAnnouncement = {
  id: string;
  title: string;
  audience: string;
  date: string;
  body: string;
  author: string;
  unread: boolean;
};

function formatCardDate(value: unknown) {
  const raw = str(value);
  if (!raw) return "";
  const date = raw.includes("T") || /^\d{4}-\d{2}-\d{2}/.test(raw)
    ? new Date(raw)
    : new Date(raw);
  if (Number.isNaN(date.getTime())) return raw;
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function announcementAudience(record: Record<string, unknown>) {
  const nested = asRecord(record.data);
  const root = Object.keys(nested).length ? nested : record;
  const department = nestedStr(root.department, ["name", "title", "label"]);
  const named = str(
    root.departmentName ??
      root.audienceName ??
      root.targetName ??
      root.audienceLabel,
  );
  const audience = str(
    root.audience ?? root.targetAudience ?? root.scope ?? root.visibility,
  );
  if (department && !/company|all staff|everyone|organisation|organization/i.test(department)) {
    return department;
  }
  if (named && !/company|all staff|everyone/i.test(named)) return named;
  if (/dept|department|team|engineering|finance|hr|sales/i.test(audience)) {
    return audience;
  }
  if (audience && !/company|all|org|everyone|staff/i.test(audience)) {
    return audience;
  }
  return "Company";
}

function announcementAuthor(record: Record<string, unknown>) {
  const nested = asRecord(record.data);
  const root = Object.keys(nested).length ? nested : record;
  const person = asRecord(root.publishedBy ?? root.createdBy ?? root.author);
  const name =
    nestedStr(root.publishedBy, ["name", "fullName", "title"]) ||
    nestedStr(root.createdBy, ["name", "fullName", "title"]) ||
    nestedStr(root.author, ["name", "fullName", "title"]) ||
    str(root.authorName ?? root.publisherName);
  if (!name) return "";
  const role = str(
    person.role ??
      person.title ??
      person.jobTitle ??
      root.authorRole ??
      root.publishedByRole ??
      root.publisherRole,
  );
  return role ? `— ${name} · ${role}` : `— ${name}`;
}

export function EmployeeAnnouncementsPage() {
  const { user } = useCurrentUser();
  const [localRead, setLocalRead] = useState<Set<string>>(new Set());

  const { data, loading, error } = useAsyncData(
    () => listStaffAnnouncements(),
    [],
  );

  const announcements = useMemo((): EmployeeAnnouncement[] => {
    return listFrom(data ?? undefined).map((record) => {
      const item = mapAnnouncement(record);
      return {
        id: item.id,
        title: item.title,
        audience: announcementAudience(record),
        date: formatCardDate(
          record.publishedAt ??
            record.published_at ??
            record.createdAt ??
            record.created_at ??
            item.publishedAt ??
            item.date,
        ),
        body: item.body,
        author: announcementAuthor(record),
        unread: localRead.has(item.id) ? false : item.unread,
      };
    });
  }, [data, localRead]);

  async function openAnnouncement(item: EmployeeAnnouncement) {
    if (!item.unread) return;
    try {
      await getStaffAnnouncement(item.id).catch(() => undefined);
      await markStaffAnnouncementRead(item.id);
      setLocalRead((current) => new Set(current).add(item.id));
    } catch {
      /* keep the card visible even if mark-read fails */
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.topBar}>
        <PageDateLabel />
        {loading ? <p className={styles.empty}>Loading announcements…</p> : null}
        {error ? (
          <p className={styles.empty} role="alert">
            {error}
          </p>
        ) : null}
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
        <h1>Company & department news</h1>
        <span>Updates relevant to you and your department.</span>
      </div>

      <section className={styles.list} aria-label="Announcements">
        {announcements.length === 0 && !loading ? (
          <p className={styles.empty}>No announcements yet.</p>
        ) : (
          announcements.map((item) => (
            <article
              key={item.id}
              className={styles.card}
            >
              <button
                type="button"
                className={styles.cardButton}
                onClick={() => void openAnnouncement(item)}
              >
                <div className={styles.cardHead}>
                  <div className={styles.titleRow}>
                    <h2>{item.title}</h2>
                    {item.audience ? (
                      <span className={styles.pill}>{item.audience}</span>
                    ) : null}
                  </div>
                  {item.date ? <time className={styles.date}>{item.date}</time> : null}
                </div>
                {item.body ? <p className={styles.body}>{item.body}</p> : null}
                {item.author ? <p className={styles.author}>{item.author}</p> : null}
              </button>
            </article>
          ))
        )}
      </section>
    </div>
  );
}
