"use client";

import { PageDateLabel } from "@/components/layout/PageDateLabel";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Bell, Check, Plus, Search, Undo2, Wallet } from "lucide-react";
import { AccountantStatusLine } from "@/components/accountant/AccountantStatusLine";
import {
  RecordExpenseModal,
  type RecordExpenseValues,
} from "@/components/accountant/RecordExpenseModal";
import { useAsyncData } from "@/hooks/useAsyncData";
import { usePageActions } from "@/hooks/usePageActions";
import { accountantApi } from "@/lib/api";
import {
  mapAccountantExpense,
  unwrapAccountantList,
  withFallback,
} from "@/lib/api/accountantMappers";
import {
  accountantExpenseEmployees,
  accountantExpenseFilters,
  accountantExpenses as fallbackExpenses,
  formatExpenseNaira,
  matchesExpenseFilter,
  type AccountantExpense,
  type AccountantExpenseCategory,
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

function formatExpenseDate(date = new Date()) {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function AccountantExpensesPage() {
  const [filter, setFilter] =
    useState<AccountantExpenseFilter>("Pending Review");
  const [localExpenses, setLocalExpenses] = useState<AccountantExpense[]>([]);
  const [recordOpen, setRecordOpen] = useState(false);
  const { runAction } = usePageActions();
  const { data, loading, error, refetch } = useAsyncData(
    () => accountantApi.expenses.list(),
    [],
  );

  const expenses = useMemo(() => {
    const mapped = withFallback(
      unwrapAccountantList(data).map(mapAccountantExpense),
      fallbackExpenses,
    );
    const merged = [...localExpenses, ...mapped];
    const seen = new Set<string>();
    return merged.filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  }, [data, localExpenses]);

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
    const employee = accountantExpenseEmployees.find(
      (item) => item.id === values.employeeId,
    );
    const amount = Number(values.amount);
    if (!employee || !Number.isFinite(amount) || amount <= 0) {
      throw new Error("Enter a valid employee and amount");
    }

    await runAction(
      "Record expense",
      async () => {
        const next: AccountantExpense = {
          id: `expense-${Date.now()}`,
          ref: `EX-${4600 + expenses.length}`,
          employeeId: employee.id,
          name: employee.name,
          initials: employee.initials,
          avatarColor: employee.avatarColor,
          department: employee.department,
          category: values.category as AccountantExpenseCategory,
          note: values.note || "Expense recorded",
          date: formatExpenseDate(),
          amount,
          amountLabel: formatExpenseNaira(amount),
          status: "Pending Review",
          hasReceipt: values.hasReceipt,
        };
        setLocalExpenses((current) => [next, ...current]);
        refetch();
      },
      `Expense recorded for ${employee.name}`,
    );
  }

  async function handleVerify(expense: AccountantExpense) {
    await runAction(
      "Verify expense",
      async () => {
        setLocalExpenses((current) =>
          current.map((item) =>
            item.id === expense.id
              ? { ...item, status: "Verified" }
              : item,
          ),
        );
      },
      `${expense.ref} verified`,
    );
  }

  async function handleReturn(expense: AccountantExpense) {
    await runAction(
      "Return expense",
      async () => {
        setLocalExpenses((current) =>
          current.map((item) =>
            item.id === expense.id
              ? { ...item, status: "Returned" }
              : item,
          ),
        );
      },
      `${expense.ref} returned`,
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

              {expense.status === "Pending Review" ? (
                <div className={styles.actions}>
                  <button
                    type="button"
                    className={styles.primaryAction}
                    onClick={() => void handleVerify(expense)}
                  >
                    <Check size={15} />
                    Verify
                  </button>
                  <button
                    type="button"
                    className={styles.secondaryAction}
                    onClick={() => void handleReturn(expense)}
                  >
                    <Undo2 size={15} />
                    Return
                  </button>
                </div>
              ) : null}

              {expense.status === "Verified" ? (
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
