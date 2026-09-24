"use client";

import { Bell, Search } from "lucide-react";
import { NotificationsLink, ProfileLink } from "./PageLinks";
import { PageDateLabel } from "./PageDateLabel";
import { useManagerPortal } from "@/hooks/useManagerPortal";
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
  const controlled = onSearchChange !== undefined;
  const manager = useManagerPortal();

  if (manager) {
    return status ? <div className={styles.lead}>{status}</div> : null;
  }

  return (
    <div className={`${styles.topBar} app-top-bar`}>
      <div className={styles.lead}>
        {dateLabel ? (
          <p className={styles.dateLabel}>{dateLabel}</p>
        ) : (
          <PageDateLabel className={styles.dateLabel} />
        )}
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
              <kbd className={styles.searchKbd}>⌘ K</kbd>
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
              <kbd className={styles.searchKbd}>⌘ K</kbd>
            </label>
          )
        ) : null}
        <NotificationsLink className={styles.iconButton}>
          <span className={styles.notifDot} aria-hidden />
          <Bell size={16} />
        </NotificationsLink>
        <ProfileLink className={styles.avatarChip}>{profileInitials}</ProfileLink>
      </div>
    </div>
  );
}
