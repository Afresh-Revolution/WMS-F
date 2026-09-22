"use client";

import { PageDateLabel } from "@/components/layout/PageDateLabel";
import Link from "next/link";
import { useMemo } from "react";
import {
  ArrowRight,
  Bell,
  Check,
  Search,
  TrendingUp,
} from "lucide-react";
import { AccountantStatusLine } from "@/components/accountant/AccountantStatusLine";
import { useAsyncData } from "@/hooks/useAsyncData";
import { usePageActions } from "@/hooks/usePageActions";
import { accountantApi } from "@/lib/api";
import {
  mapAccountantSalaryIncrement,
  unwrapAccountantList,
} from "@/lib/api/accountantMappers";
import { type AccountantSalaryIncrement } from "@/data/accountantSalaryIncrements";
import styles from "./AccountantSalaryIncrementsPage.module.css";

export function AccountantSalaryIncrementsPage() {
  const { runAction } = usePageActions();
  const { data, loading, error, refetch } = useAsyncData(
    () => accountantApi.salaryImplementations.list(),
    [],
  );

  const increments = useMemo(
    () => unwrapAccountantList(data).map(mapAccountantSalaryIncrement),
    [data],
  );

  const awaiting = useMemo(
    () => increments.filter((item) => item.status === "awaiting"),
    [increments],
  );
  const implemented = useMemo(
    () => increments.filter((item) => item.status === "implemented"),
    [increments],
  );

  async function handleApply(increment: AccountantSalaryIncrement) {
    await runAction(
      "Apply to payroll",
      async () => {
        await accountantApi.salaryImplementations.implement(increment.id);
        refetch();
      },
      `${increment.name}'s increment applied to payroll`,
    );
  }

  return (
    <div className={styles.page}>
      <AccountantStatusLine
        loading={loading}
        error={error}
        resource="salary implementations"
      />
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
          <Link
            href="/accountant/profile"
            className={styles.avatarChip}
            aria-label="Profile"
          >
            RK
          </Link>
        </div>
      </div>

      <div className={styles.header}>
        <p className={styles.eyebrow}>Accountant · Salary Increments</p>
        <h1 className={styles.title}>Salary increment implementation</h1>
        <p className={styles.subtitle}>
          Apply increments approved by Admin to the current payroll run. You
          implement approved decisions — you do not approve increments.
        </p>
      </div>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitleWrap}>
            <TrendingUp size={18} />
            <h2 className={styles.sectionTitle}>Awaiting implementation</h2>
            <span className={styles.countBadge}>{awaiting.length}</span>
          </div>
        </div>

        {awaiting.length === 0 ? (
          <p className={styles.empty}>No increments awaiting implementation.</p>
        ) : (
          <div className={styles.list}>
            {awaiting.map((item) => (
              <article key={item.id} className={styles.card}>
                <div className={styles.cardMain}>
                  <span
                    className={styles.avatar}
                    style={{ background: item.avatarColor }}
                  >
                    {item.initials}
                  </span>
                  <div className={styles.cardBody}>
                    <div className={styles.cardTop}>
                      <h3 className={styles.name}>{item.name}</h3>
                      <span className={styles.percentBadge}>{item.percent}</span>
                      <span className={styles.ref}>{item.ref}</span>
                    </div>
                    <p className={styles.meta}>
                      {item.role} · Approved by {item.approvedBy} ·{" "}
                      {item.approvedDate}
                    </p>
                    <p className={styles.salaryChange}>
                      {item.fromSalary}
                      <ArrowRight size={14} className={styles.arrow} />
                      {item.toSalary}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className={styles.applyButton}
                  onClick={() => void handleApply(item)}
                >
                  <Check size={15} />
                  Apply to payroll
                </button>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Implemented</h2>
        </div>

        {implemented.length === 0 ? (
          <p className={styles.empty}>No increments implemented yet.</p>
        ) : (
          <div className={styles.list}>
            {implemented.map((item) => (
              <article key={item.id} className={styles.card}>
                <div className={styles.cardMain}>
                  <span
                    className={styles.avatar}
                    style={{ background: item.avatarColor }}
                  >
                    {item.initials}
                  </span>
                  <div className={styles.cardBody}>
                    <div className={styles.cardTop}>
                      <h3 className={styles.name}>{item.name}</h3>
                      <span className={styles.implementedBadge}>Implemented</span>
                      <span className={styles.ref}>{item.ref}</span>
                    </div>
                    <p className={styles.meta}>
                      {item.role} · {item.fromSalary} → {item.toSalary} · Applied{" "}
                      {item.appliedDate}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
