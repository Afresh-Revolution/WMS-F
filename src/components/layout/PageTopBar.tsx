"use client";

import Link from "next/link";
import { Bell, Search } from "lucide-react";
import { useCurrentUser } from "./CurrentUserProvider";
import styles from "./PageTopBar.module.css";

type PageTopBarProps = {
  dateLabel?: string;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  showSearch?: boolean;
  profileInitials?: string;
  status?: React.ReactNode;
};

export function PageTopBar({
  dateLabel,
  searchPlaceholder = "Search",
  searchValue,
  onSearchChange,
  showSearch = true,
  profileInitials,
  status,
}: PageTopBarProps) {
  const { user, ready } = useCurrentUser();
  const initials = user?.initials || (ready ? profileInitials : "") || "";
  const controlled = onSearchChange !== undefined;

  return (
    <div className={`${styles.topBar} app-top-bar`}>
      <div className={styles.lead}>
        {dateLabel ? <p className={styles.dateLabel}>{dateLabel}</p> : null}
        {status}
      </div>
      <div className={styles.actions}>
        {showSearch ? (
          controlled ? (
            <label className={styles.search}>
              <Search size={15} className={styles.searchIcon} />
              <input
                type="search"
                value={searchValue}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder={searchPlaceholder}
                className={styles.searchInput}
                aria-label={searchPlaceholder}
              />
            </label>
          ) : (
            <label className={styles.search}>
              <Search size={15} className={styles.searchIcon} />
              <input
                type="search"
                placeholder={searchPlaceholder}
                className={styles.searchInput}
                aria-label={searchPlaceholder}
                onChange={() => {
                  /* page-level filter can wire via onSearchChange */
                }}
              />
            </label>
          )
        ) : null}
        <Link href="/announcements" className={styles.iconButton} aria-label="Notifications">
          <span className={styles.notifDot} aria-hidden />
          <Bell size={16} />
        </Link>
        <Link href="/profile" className={styles.avatarChip} aria-label="Profile">
          {initials}
        </Link>
      </div>
    </div>
  );
}
