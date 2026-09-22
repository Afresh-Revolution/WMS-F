"use client";

import { PageDateLabel } from "@/components/layout/PageDateLabel";
import Link from "next/link";
import { Bell, Search } from "lucide-react";
import { AccountantProfileChip } from "@/components/accountant/AccountantProfileChip";
import { AccountantStatusLine } from "@/components/accountant/AccountantStatusLine";
import { useAsyncData } from "@/hooks/useAsyncData";
import { accountantApi } from "@/lib/api";
import { mapAccountantHelpItems } from "@/lib/api/accountantMappers";
import styles from "./AccountantUtilityPages.module.css";

export function AccountantHelpPage() {
  const { data, loading, error } = useAsyncData(
    () => accountantApi.helpCenter(),
    [],
  );
  const items = mapAccountantHelpItems(data);

  return (
    <div className={styles.page}>
      <AccountantStatusLine loading={loading} error={error} resource="help" />
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
            href="/accountant/notifications"
            className={styles.iconButton}
            aria-label="Notifications"
          >
            <span className={styles.notifDot} aria-hidden />
            <Bell size={16} />
          </Link>
          <AccountantProfileChip className={styles.avatarChip} />
        </div>
      </div>

      <p className={styles.eyebrow}>Accountant</p>
      <h1 className={styles.title}>Help center</h1>
      <p className={styles.subtitle}>
        Guides mapped to accountant payroll, bills, and finance workflows.
      </p>

      <div className={styles.list}>
        {items.length === 0 && !loading ? (
          <p className={styles.empty}>No help articles returned for this workspace.</p>
        ) : (
          items.map((item) => (
            <article key={item.id} className={styles.card}>
              <h2 className={styles.cardTitle}>{item.title}</h2>
              {item.description ? (
                <p className={styles.cardBody}>{item.description}</p>
              ) : null}
              {item.href ? <p className={styles.cardMeta}>{item.href}</p> : null}
            </article>
          ))
        )}
      </div>
    </div>
  );
}
