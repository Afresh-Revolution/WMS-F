"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, Search, UserRound } from "lucide-react";
import { AccountantStatusLine } from "@/components/accountant/AccountantStatusLine";
import {
  nyscAccountList,
  type NyscAccountId,
} from "@/data/nyscOverview";
import { useInternAccount } from "@/hooks/useInternAccount";
import { internApi, internSettled } from "@/lib/api";
import {
  mapInternAnnouncement,
  mappedOrFallback,
  unwrapInternList,
} from "@/lib/api/internMappers";
import { useAsyncData } from "@/hooks/useAsyncData";
import styles from "./NyscAnnouncementsPage.module.css";

export function NyscAnnouncementsPage() {
  const [accountId, setAccountId] = useState<NyscAccountId>("chidi");
  const { account, loading, error } = useInternAccount(accountId);
  const { data: newsPayload } = useAsyncData(
    () => internSettled(internApi.news.all()),
    [],
  );
  const announcements = mappedOrFallback(
    newsPayload,
    unwrapInternList(newsPayload).map(mapInternAnnouncement),
    account.announcements,
  );

  return (
    <div className={styles.page}>
      <AccountantStatusLine loading={loading} error={error} resource="news" />
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
            <span className={styles.notifDot} aria-hidden />
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

      <header className={styles.header}>
        <p className={styles.eyebrow}>Announcements</p>
        <h1 className={styles.title}>
          Company <span className={styles.amp}>&</span> department news
        </h1>
        <p className={styles.subtitle}>
          Updates relevant to you and your placement department.
        </p>
      </header>

      <div className={styles.accounts} role="tablist" aria-label="Example accounts">
        <p className={styles.accountsLabel}>Example account</p>
        {nyscAccountList.map((item) => {
          const active = item.id === accountId;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={active}
              className={`${styles.accountChip} ${
                active ? styles.accountChipActive : ""
              }`}
              onClick={() => setAccountId(item.id)}
            >
              <UserRound size={15} />
              <span className={styles.accountName}>{item.name}</span>
              <span
                className={`${styles.accountType} ${
                  active
                    ? styles.accountTypeOnActive
                    : item.type === "NYSC"
                      ? styles.accountTypeNysc
                      : styles.accountTypeIntern
                }`}
              >
                {item.type}
              </span>
            </button>
          );
        })}
      </div>

      <div className={styles.list}>
        {announcements.map((item) => (
          <article key={item.id} className={styles.card}>
            <div className={styles.cardHead}>
              <div className={styles.cardTitleRow}>
                <h2 className={styles.cardTitle}>{item.title}</h2>
                <span className={styles.source}>{item.source}</span>
              </div>
              <p className={styles.cardDate}>{item.date}</p>
            </div>
            <p className={styles.body}>{item.body}</p>
            <p className={styles.author}>— {item.author}</p>
          </article>
        ))}
      </div>

      <div className={styles.prototypeWrap}>
        <span className={styles.prototypeChip}>
          <UserRound size={13} />
          Prototype: NYSC / Intern
        </span>
      </div>
    </div>
  );
}
