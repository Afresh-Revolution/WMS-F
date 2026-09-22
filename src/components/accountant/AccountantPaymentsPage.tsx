"use client";

import { PageDateLabel } from "@/components/layout/PageDateLabel";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Bell, Download, FileText, Paperclip, Plus, Search, Wallet } from "lucide-react";
import { AccountantStatusLine } from "@/components/accountant/AccountantStatusLine";
import { SimpleModal } from "@/components/ui/SimpleModal";
import { useAsyncData } from "@/hooks/useAsyncData";
import { usePageActions } from "@/hooks/usePageActions";
import { accountantApi } from "@/lib/api";
import {
  mapAccountantPaymentRecord,
  unwrapAccountantList,
} from "@/lib/api/accountantMappers";
import {
  accountantPaymentFilters,
  formatPaymentNaira,
  matchesPaymentFilter,
  type AccountantPaymentCategory,
  type AccountantPaymentFilter,
  type AccountantPaymentRecord,
  type AccountantPaymentStatus,
} from "@/data/accountantPayments";
import styles from "./AccountantPaymentsPage.module.css";

const categoryClass: Record<AccountantPaymentCategory, string> = {
  Payroll: styles.categoryPayroll,
  Bill: styles.categoryBill,
  Purchase: styles.categoryPurchase,
  Reimbursement: styles.categoryReimbursement,
  Expense: styles.categoryExpense,
};

const statusClass: Record<AccountantPaymentStatus, string> = {
  Paid: styles.statusPaid,
  Scheduled: styles.statusScheduled,
};

export function AccountantPaymentsPage() {
  const [filter, setFilter] = useState<AccountantPaymentFilter>("All");
  const [recordOpen, setRecordOpen] = useState(false);
  const { runAction, showToast } = usePageActions();
  const { data, loading, error, refetch } = useAsyncData(
    () => accountantApi.payments.list(),
    [],
  );

  const payments = useMemo(
    () => unwrapAccountantList(data).map(mapAccountantPaymentRecord),
    [data],
  );

  const filtered = useMemo(
    () => payments.filter((item) => matchesPaymentFilter(item, filter)),
    [filter, payments],
  );

  const totalPaid = useMemo(
    () => payments.reduce((sum, item) => sum + item.amountValue, 0),
    [payments],
  );

  async function handleCreate(values: Record<string, string>) {
    const amount = Number(values.amount);
    if (!values.payee || !Number.isFinite(amount) || amount <= 0) {
      throw new Error("Enter a valid payee and amount");
    }
    await runAction(
      "Record payment",
      async () => {
        await accountantApi.payments.create({
          payee: values.payee,
          amount,
          category: values.category,
          date: values.date || undefined,
          note: values.note || undefined,
        });
        refetch();
        setRecordOpen(false);
      },
      `Payment recorded for ${values.payee}`,
    );
  }

  async function handleExport() {
    await runAction("Export payments", async () => {
      await accountantApi.payments.export();
    });
  }

  async function handleUpload(payment: AccountantPaymentRecord) {
    await runAction(
      "Upload evidence",
      async () => {
        await accountantApi.payments.reconcile(payment.id, {
          evidence: `transfer-${payment.ref.toLowerCase()}.pdf`,
        });
        refetch();
      },
      `Evidence attached to ${payment.ref}`,
    );
  }

  return (
    <div className={styles.page}>
      <AccountantStatusLine loading={loading} error={error} resource="payments" />
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
          <p className={styles.eyebrow}>Accountant · Payments</p>
          <h1 className={styles.title}>Payments register</h1>
          <p className={styles.subtitle}>
            Every outgoing payment recorded across payroll, bills, purchases,
            expenses and reimbursements. Attach payment evidence for the audit
            trail.
          </p>
        </div>
        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={() => void handleExport()}
          >
            <Download size={16} />
            Export CSV
          </button>
          <button
            type="button"
            className={styles.primaryButton}
            onClick={() => setRecordOpen(true)}
          >
            <Plus size={16} />
            Record payment
          </button>
        </div>
      </div>

      <section className={styles.summaryCard}>
        <div className={styles.summaryLead}>
          <span className={styles.summaryIcon} aria-hidden>
            <Wallet size={18} />
          </span>
          <p className={styles.summaryLabel}>
            {payments.length} payments on record
          </p>
        </div>
        <p className={styles.summaryValue}>
          {formatPaymentNaira(totalPaid)} paid to date
        </p>
      </section>

      <div className={styles.tabs} role="tablist" aria-label="Payment category">
        {accountantPaymentFilters.map((item) => (
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

      <div className={styles.tableCard}>
        {filtered.length === 0 ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon} aria-hidden>
              <Wallet size={36} strokeWidth={1.5} />
            </span>
            <h2 className={styles.emptyTitle}>No payments</h2>
            <p className={styles.emptySubtitle}>
              Nothing matches this filter right now.
            </p>
          </div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Ref</th>
                  <th>Payee</th>
                  <th>Category</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Evidence</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((payment) => (
                  <tr key={payment.id}>
                    <td className={styles.ref}>{payment.ref}</td>
                    <td className={styles.payee}>{payment.payee}</td>
                    <td>
                      <span
                        className={`${styles.category} ${categoryClass[payment.category]}`}
                      >
                        {payment.category}
                      </span>
                    </td>
                    <td>{payment.date}</td>
                    <td className={styles.amount}>{payment.amount}</td>
                    <td>
                      <span
                        className={`${styles.status} ${statusClass[payment.status]}`}
                      >
                        {payment.status}
                      </span>
                    </td>
                    <td>
                      {payment.evidence ? (
                        <button
                          type="button"
                          className={styles.evidenceLink}
                          onClick={() =>
                            showToast(`Opening ${payment.evidence}`, "info")
                          }
                        >
                          <FileText size={14} />
                          {payment.evidence}
                        </button>
                      ) : (
                        <button
                          type="button"
                          className={styles.uploadButton}
                          onClick={() => void handleUpload(payment)}
                        >
                          <Paperclip size={14} />
                          Upload
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <SimpleModal
        open={recordOpen}
        title="Record payment"
        description="Add a manual or general payment to the finance register."
        submitLabel="Record payment"
        showClose
        fields={[
          { name: "payee", label: "Payee", required: true },
          {
            name: "amount",
            label: "Amount (₦)",
            type: "number",
            required: true,
            min: 1,
          },
          {
            name: "category",
            label: "Category",
            type: "select",
            defaultValue: "Bill",
            options: [
              { label: "Payroll", value: "Payroll" },
              { label: "Bill", value: "Bill" },
              { label: "Purchase", value: "Purchase" },
              { label: "Reimbursement", value: "Reimbursement" },
              { label: "Expense", value: "Expense" },
              { label: "Bonus", value: "Bonus" },
            ],
          },
          { name: "date", label: "Date", type: "date" },
          {
            name: "note",
            label: "Note",
            type: "textarea",
            placeholder: "Optional reference",
          },
        ]}
        onClose={() => setRecordOpen(false)}
        onSubmit={handleCreate}
      />
    </div>
  );
}
