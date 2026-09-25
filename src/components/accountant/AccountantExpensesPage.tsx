"use client";

import { PageDateLabel } from "@/components/layout/PageDateLabel";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Bell, Plus, Search, Wallet } from "lucide-react";
import { AccountantProfileChip } from "@/components/accountant/AccountantProfileChip";
import { AccountantStatusLine } from "@/components/accountant/AccountantStatusLine";
import {
  RecordExpenseModal,
  type RecordExpenseValues,
} from "@/components/accountant/RecordExpenseModal";
import { useAsyncData } from "@/hooks/useAsyncData";
import { usePageActions } from "@/hooks/usePageActions";
import { accountantApi, asRecord } from "@/lib/api";
import {
  mapAccountantExpense,
  unwrapAccountantList,
} from "@/lib/api/accountantMappers";
import {
  accountantExpenseFilters,
  formatExpenseNaira,
  matchesExpenseFilter,
  type AccountantExpense,
  type AccountantExpenseFilter,
  type AccountantExpenseStatus,
} from "@/data/accountantExpenses";
import styles from "./AccountantExpensesPage.module.css";

const statusClass: Record<AccountantExpenseStatus, string> = {
  "Pending Review": styles.statusPending,
  Verified: styles.statusVerified,
  Reimbursed: styles.statusReimbursed,
  Returned: styles.statusReturned,
};

export function AccountantExpensesPage() {
  const [filter, setFilter] =
    useState<AccountantExpenseFilter>("Pending Review");
  const [recordOpen, setRecordOpen] = useState(false);
  const [recorded, setRecorded] = useState<AccountantExpense[]>([]);
  const { runAction } = usePageActions();
  const { data, loading, error, refetch } = useAsyncData(
    () => accountantApi.expenses.list(),
    [],
  );

  const expenses = useMemo(() => {
    const mapped = unwrapAccountantList(data).map(mapAccountantExpense);
    const seen = new Set<string>();
    return [...recorded, ...mapped].filter((item) => {
      if (!item.id || seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  }, [data, recorded]);

  const filtered = useMemo(
    () => expenses.filter((item) => matchesExpenseFilter(item, filter)),
    [expenses, filter],
  );

  const monthlyTotal = useMemo(
    () => expenses.reduce((sum, item) => sum + item.amount, 0),
    [expenses],
  );
  const pendingCount = useMemo(
    () => expenses.filter((item) => item.status === "Pending Review").length,
    [expenses],
  );
  const missingReceipts = useMemo(
    () => expenses.filter((item) => !item.hasReceipt).length,
    [expenses],
  );

  async function handleRecord(values: RecordExpenseValues) {
    const employee = {
      id: values.employeeId,
      name: values.employeeName,
      department: values.department,
      initials: values.initials,
      avatarColor: values.avatarColor,
    };
    const amount = Number(values.amount);
    if (!employee || !Number.isFinite(amount) || amount <= 0) {
      throw new Error("Enter a valid employee and amount");
    }

    await runAction(
      "Record expense",
      async () => {
        const created = await accountantApi.expenses.create({
          category: values.category,
          employeeId: employee.id,
          employeeName: employee.name,
          name: employee.name,
          payee: employee.name,
          department: employee.department,
          initials: employee.initials,
          avatarColor: employee.avatarColor,
          amount,
          note: values.note || values.category,
          title: values.note || values.category,
          hasReceipt: values.hasReceipt,
          status: "PENDING",
        });
        setRecorded((current) => [
          mapAccountantExpense(asRecord(created), 0),
          ...current,
        ]);
        refetch();
      },
      `Expense recorded for ${employee.name}`,
    );
  }

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
      <AccountantStatusLine loading={loading} error={error} resource="expenses" />
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

      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Accountant · Expenses</p>
          <h1 className={styles.title}>Expense queue</h1>
          <p className={styles.subtitle}>
            Review submitted expenses, verify supporting receipts, and process
            reimbursement.
          </p>
        </div>
        <button
          type="button"
          className={styles.recordButton}
          onClick={() => setRecordOpen(true)}
        >
          <Plus size={16} />
          Record expense
        </button>
      </div>

      <div className={styles.stats}>
        <article className={styles.statCard}>
          <p className={styles.statLabel}>Monthly expense total</p>
          <p className={styles.statValue}>{formatExpenseNaira(monthlyTotal)}</p>
        </article>
        <article className={styles.statCard}>
          <p className={styles.statLabel}>Pending review</p>
          <p className={styles.statValue}>{pendingCount}</p>
        </article>
        <article className={styles.statCard}>
          <p className={styles.statLabel}>Missing receipts</p>
          <p className={styles.statValue}>{missingReceipts}</p>
        </article>
      </div>

      <div className={styles.tabs} role="tablist" aria-label="Expense status">
        {accountantExpenseFilters.map((item) => (
          <button
            key={item}
            type="button"
            role="tab"
            aria-selected={filter === item}
            className={`${styles.tab} ${filter === item ? styles.tabActive : ""}`}
            onClick={() => setFilter(item)}
          >
            {item}
          </button>
        ))}
      </div>

      <div className={styles.list}>
        {filtered.length === 0 ? (
          <p className={styles.empty}>No expenses in this queue.</p>
        ) : (
          filtered.map((expense) => (
            <article key={expense.id} className={styles.card}>
              <div className={styles.cardTop}>
                <div className={styles.cardLead}>
                  <div className={styles.titleRow}>
                    <span
                      className={styles.avatar}
                      style={{ background: expense.avatarColor }}
                    >
                      {expense.initials}
                    </span>
                    <div>
                      <div className={styles.nameRow}>
                        <h2 className={styles.name}>{expense.name}</h2>
                        <span
                          className={`${styles.status} ${statusClass[expense.status]}`}
                        >
                          {expense.status}
                        </span>
                        {!expense.hasReceipt ? (
                          <span className={styles.noReceipt}>No receipt</span>
                        ) : null}
                        <span className={styles.ref}>{expense.ref}</span>
                      </div>
                      <p className={styles.meta}>
                        {expense.category} · {expense.department} ·{" "}
                        {expense.date}
                        {expense.note ? ` · ${expense.note}` : ""}
                      </p>
                    </div>
                  </div>
                </div>
                <p className={styles.amount}>{expense.amountLabel}</p>
              </div>

              {expense.status === "Pending Review" || expense.status === "Verified" ? (
                <div className={styles.actions}>
                  <button
                    type="button"
                    className={styles.primaryAction}
                    onClick={() => void handleReimburse(expense)}
                  >
                    <Wallet size={15} />
                    Reimburse
                  </button>
                </div>
              ) : null}
            </article>
          ))
        )}
      </div>

      <RecordExpenseModal
        open={recordOpen}
        onClose={() => setRecordOpen(false)}
        onSubmit={handleRecord}
      />
    </div>
  );
}
