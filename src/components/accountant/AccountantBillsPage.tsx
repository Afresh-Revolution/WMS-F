"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Bell,
  Clock,
  FileText,
  Plus,
  RefreshCw,
  Search,
} from "lucide-react";
import {
  CreateBillModal,
  type CreateBillValues,
} from "@/components/accountant/CreateBillModal";
import { AccountantStatusLine } from "@/components/accountant/AccountantStatusLine";
import { useAsyncData } from "@/hooks/useAsyncData";
import { usePageActions } from "@/hooks/usePageActions";
import { accountantApi, accountantSettled } from "@/lib/api";
import {
  mapAccountantBillItem,
  unwrapAccountantList,
  withFallback,
} from "@/lib/api/accountantMappers";
import {
  accountantBillFilters,
  accountantBillItems as fallbackBills,
  formatBillNaira,
  matchesAccountantBillFilter,
  type AccountantBillFilter,
  type AccountantBillItem,
  type AccountantBillStatus,
} from "@/data/accountantBills";
import styles from "./AccountantBillsPage.module.css";

const statusClass: Record<AccountantBillStatus, string> = {
  Scheduled: styles.statusScheduled,
  Unpaid: styles.statusUnpaid,
  Overdue: styles.statusOverdue,
  Paid: styles.statusPaid,
};

export function AccountantBillsPage() {
  const [filter, setFilter] = useState<AccountantBillFilter>("All");
  const [createOpen, setCreateOpen] = useState(false);
  const { runAction, showToast } = usePageActions();
  const { data, loading, error, refetch } = useAsyncData(async () => {
    const [bills, invoices] = await Promise.all([
      accountantApi.bills.list(),
      accountantSettled(accountantApi.invoices.list()),
    ]);
    return { bills, invoices };
  }, []);

  const bills = useMemo(
    () =>
      withFallback(
        [
          ...unwrapAccountantList(data?.bills),
          ...unwrapAccountantList(data?.invoices),
        ].map(mapAccountantBillItem),
        fallbackBills,
      ),
    [data],
  );

  const filtered = useMemo(
    () => bills.filter((bill) => matchesAccountantBillFilter(bill, filter)),
    [bills, filter],
  );

  const unpaidBills = useMemo(
    () => bills.filter((bill) => bill.status !== "Paid"),
    [bills],
  );

  const outstanding = useMemo(
    () => unpaidBills.reduce((sum, bill) => sum + bill.amountValue, 0),
    [unpaidBills],
  );

  async function handleCreate(values: CreateBillValues) {
    const amount = Number(values.amount);
    if (!values.vendor || !Number.isFinite(amount) || amount <= 0) {
      throw new Error("Enter a valid vendor and amount");
    }

    await runAction(
      "Create bill",
      async () => {
        await accountantApi.bills.create({
          vendor: values.vendor,
          category: values.category,
          amount,
          dueDate: values.dueDate,
          invoice: values.invoice || undefined,
        });
        refetch();
      },
      `Bill created for ${values.vendor}`,
    );
  }

  async function handleAttachInvoice(bill: AccountantBillItem) {
    await runAction(
      "Attach invoice",
      async () => {
        await accountantApi.bills.patch(bill.id, {
          invoice: bill.invoice ?? `INV-${bill.ref}`,
          missingInvoice: false,
        });
        refetch();
      },
      `Invoice attached to ${bill.ref}`,
    );
  }

  return (
    <div className={styles.page}>
      <AccountantStatusLine loading={loading} error={error} resource="bills" />
      <div className={styles.topBar}>
        <p className={styles.dateLabel}>Tuesday, August 11</p>
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
          <p className={styles.eyebrow}>Accountant · Bills & Invoices</p>
          <div className={styles.titleRow}>
            <span className={styles.titleIcon} aria-hidden>
              <RefreshCw size={18} />
              <FileText size={16} />
            </span>
            <h1 className={styles.title}>Bills & invoices</h1>
          </div>
          <p className={styles.subtitle}>
            Create and manage vendor bills, attach invoices, and record payments.
          </p>
        </div>
        <button
          type="button"
          className={styles.createButton}
          onClick={() => setCreateOpen(true)}
        >
          <Plus size={16} />
          Create bill
        </button>
      </div>

      <section className={styles.summaryCard}>
        <p className={styles.summaryLabel}>
          {unpaidBills.length} unpaid bill{unpaidBills.length === 1 ? "" : "s"}
        </p>
        <p className={styles.summaryValue}>
          {formatBillNaira(outstanding)} outstanding
        </p>
      </section>

      <div className={styles.tabs} role="tablist" aria-label="Bill status">
        {accountantBillFilters.map((item) => (
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
          <p className={styles.empty}>No bills in this filter.</p>
        ) : (
          filtered.map((bill) => (
            <article key={bill.id} className={styles.row}>
              <div className={styles.rowMain}>
                <div className={styles.rowTop}>
                  <h2 className={styles.vendor}>{bill.vendor}</h2>
                  <span className={`${styles.status} ${statusClass[bill.status]}`}>
                    {bill.status}
                  </span>
                  {bill.missingInvoice ? (
                    <span className={styles.missingBadge}>No invoice</span>
                  ) : null}
                  <span className={styles.ref}>{bill.ref}</span>
                </div>
                <p className={styles.meta}>
                  {bill.category} · {bill.dueDate}
                  {bill.invoice ? ` · ${bill.invoice}` : ""}
                </p>
              </div>

              <div className={styles.rowAside}>
                <p className={styles.amount}>{bill.amount}</p>
                {bill.status === "Paid" ? (
                  <span className={styles.paidTiming}>{bill.paidDate}</span>
                ) : bill.missingInvoice ? (
                  <button
                    type="button"
                    className={styles.invoiceButton}
                    onClick={() => void handleAttachInvoice(bill)}
                  >
                    <FileText size={14} />
                    Invoice
                  </button>
                ) : bill.overdue ? (
                  <span className={styles.overdueTiming}>
                    <AlertTriangle size={13} />
                    {bill.timing}
                  </span>
                ) : (
                  <button
                    type="button"
                    className={styles.timing}
                    onClick={() =>
                      showToast(`${bill.vendor}: ${bill.timing}`, "info")
                    }
                  >
                    <Clock size={13} />
                    {bill.timing}
                  </button>
                )}
              </div>
            </article>
          ))
        )}
      </div>

      <CreateBillModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreate}
      />
    </div>
  );
}
