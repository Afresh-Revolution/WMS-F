"use client";

import { useState } from "react";
import { Bell, Search, X } from "lucide-react";
import { NotificationsLink, ProfileLink } from "@/components/layout/PageLinks";
import { PageDateLabel } from "@/components/layout/PageDateLabel";
import { useCurrentUser } from "@/components/layout/CurrentUserProvider";
import styles from "./ManagerTopBar.module.css";

export function ManagerTopBar() {
  const { user } = useCurrentUser();
  const [search, setSearch] = useState("");

  return (
    <div className={styles.topBar}>
      <PageDateLabel className={styles.dateLabel} />
      <div className={styles.actions}>
        <label className={styles.search}>
          <Search size={15} className={styles.searchIcon} />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search"
            className={styles.searchInput}
            aria-label="Search"
          />
          {search ? (
            <button
              type="button"
              className={styles.clearButton}
              aria-label="Clear search"
              onClick={() => setSearch("")}
            >
              <X size={14} />
            </button>
          ) : (
            <X size={14} className={styles.clearHint} aria-hidden />
          )}
        </label>
        <NotificationsLink className={styles.iconButton}>
          <Bell size={16} />
        </NotificationsLink>
        <ProfileLink className={styles.avatar}>
          {user?.initials || "M"}
        </ProfileLink>
      </div>
    </div>
  );
}
