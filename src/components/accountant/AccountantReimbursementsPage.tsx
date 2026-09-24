"use client";

import { PageDateLabel } from "@/components/layout/PageDateLabel";
import { useMemo } from "react";
import Link from "next/link";
import { Bell, Search, Wallet } from "lucide-react";
import { AccountantProfileChip } from "@/components/accountant/AccountantProfileChip";
import { AccountantStatusLine } from "@/components/accountant/AccountantStatusLine";
import { useAsyncData } from "@/hooks/useAsyncData";
import { usePageActions } from "@/hooks/usePageActions";
import { accountantApi } from "@/lib/api";
import {
  mapAccountantExpense,
  unwrapAccountantList,
} from "@/lib/api/accountantMappers";
import { type AccountantExpense } from "@/data/accountantExpenses";
import styles from "./AccountantUtilityPages.module.css";

export function AccountantReimbursementsPage() {
  const { runAction } = usePageActions();
  const { data, loading, error, refetch } = useAsyncData(
    () => accountantApi.expenses.list(),
    [],
  );

  const expenses = useMemo(
    () => unwrapAccountantList(data).map(mapAccountantExpense),
    [data],
  );

  const queue = expenses.filter(
    (item) => item.status === "Verified" || item.status === "Pending Review",
  );

  async function handleReimburse(expense: AccountantExpense) {
    await runAction(
      "Reimburse expense",
      async () => {
        await accountantApi.expenses.reimburse(expense.id);
        refetch();
      },
      `${expense.ref} reimbursed`,
    );
  }

  return (
    <div className={styles.page}>
      <AccountantStatusLine
        loading={loading}
        error={error}
        resource="reimbursements"
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
          <AccountantProfileChip className={styles.avatarChip} />
        </div>
      </div>

      <p className={styles.eyebrow}>Accountant · Reimbursements</p>
      <h1 className={styles.title}>Reimbursements</h1>
      <p className={styles.subtitle}>
        Process verified expense claims and follow up on items waiting for
        reimbursement.
      </p>

      <div className={styles.list}>
        {queue.length === 0 ? (
          <p className={styles.empty}>No reimbursements waiting.</p>
        ) : (
          queue.map((expense) => (
            <article key={expense.id} className={`${styles.card} ${styles.cardRow}`}>
              <div>
                <h2 className={styles.cardTitle}>
                  {expense.name} · {expense.ref}
                </h2>
                <p className={styles.cardBody}>
                  {expense.category} · {expense.note}
                </p>
                <p className={styles.cardMeta}>
                  {expense.date} · {expense.status}
                </p>
              </div>
              <div className={styles.rowAside}>
                <p className={styles.amount}>{expense.amountLabel}</p>
                <button
                  type="button"
                  className={styles.actionButton}
                  onClick={() => void handleReimburse(expense)}
                >
                  <Wallet size={14} />
                  Reimburse
                </button>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
