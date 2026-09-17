"use client";

import { PageDateLabel } from "@/components/layout/PageDateLabel";
import { useState } from "react";
import Link from "next/link";
import {
  Bell,
  CalendarDays,
  Clock,
  MapPin,
  Search,
  UserRound,
} from "lucide-react";
import { AccountantStatusLine } from "@/components/accountant/AccountantStatusLine";
import {
  nyscAccountList,
  type NyscAccountId,
} from "@/data/nyscOverview";
import { useInternAccount } from "@/hooks/useInternAccount";
import { internApi, internSettled } from "@/lib/api";
import {
  mapInternMeeting,
  mappedOrFallback,
  unwrapInternList,
} from "@/lib/api/internMappers";
import { useAsyncData } from "@/hooks/useAsyncData";
import styles from "./NyscMeetingsPage.module.css";

export function NyscMeetingsPage() {
  const [accountId, setAccountId] = useState<NyscAccountId>("chidi");
  const { account, loading, error } = useInternAccount(accountId);
  const { data: schedulePayload } = useAsyncData(
    () => internSettled(internApi.schedule()),
    [],
  );
  const meetings = mappedOrFallback(
    schedulePayload,
    unwrapInternList(schedulePayload).map(mapInternMeeting),
    account.meetings,
  );

  return (
    <div className={styles.page}>
      <AccountantStatusLine loading={loading} error={error} resource="schedule" />
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
        <p className={styles.eyebrow}>My meetings</p>
        <h1 className={styles.title}>Your schedule</h1>
        <p className={styles.subtitle}>
          Meetings and check-ins you’ve been invited to.
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

      <div className={styles.grid}>
        {meetings.map((meeting) => (
          <article key={meeting.id} className={styles.card}>
            <div className={styles.cardHead}>
              <h2 className={styles.cardTitle}>{meeting.title}</h2>
              <span className={styles.relative}>{meeting.relative}</span>
            </div>
            <ul className={styles.metaList}>
              <li>
                <CalendarDays size={15} />
                {meeting.when}
              </li>
              <li>
                <Clock size={15} />
                {meeting.duration}
              </li>
              <li>
                <MapPin size={15} />
                {meeting.location}
              </li>
              <li>
                <UserRound size={15} />
                Organised by {meeting.organiser}
              </li>
            </ul>
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
