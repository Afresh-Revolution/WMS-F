"use client";

import { PageDateLabel } from "@/components/layout/PageDateLabel";
import { useMemo, useState } from "react";
import { Check, Plus, RefreshCw, Search, TrendingDown, Upload, X } from "lucide-react";
import { FinanceModuleTabs } from "@/components/finance-payroll/FinanceModuleTabs";
import { NotificationsLink, ProfileLink } from "@/components/layout/PageLinks";
import { SimpleModal } from "@/components/ui/SimpleModal";
import {
  billFilters,
  matchesBillFilter,
  type Bill,
  type BillFilter,
  type BillStatus,
} from "@/data/financeBills";
import { useAsyncData } from "@/hooks/useAsyncData";
import { usePageActions } from "@/hooks/usePageActions";
import { superAdminApi } from "@/lib/api";
import { listFrom, mapBill } from "@/lib/api/mappers";
import payrollStyles from "./FinancePayrollPage.module.css";
import styles from "./FinanceBillsPage.module.css";

const statusClass: Record<BillStatus, string> = {
  "Awaiting Admin Approval": styles.statusPending,
  "Scheduled for Payment": styles.statusScheduled,
  Overdue: styles.statusOverdue,
  "Pending review": styles.statusReview,
  Paid: styles.statusPaid,
};

const billCategoryOptions = [
  { label: "Utilities", value: "Utilities" },
  { label: "IT Infrastructure", value: "IT Infrastructure" },
  { label: "Health Insurance", value: "Health Insurance" },
  { label: "Pension Remittance", value: "Pension Remittance" },
  { label: "Statutory Tax", value: "Statutory Tax" },
  { label: "Office Supplies", value: "Office Supplies" },
];

const createFields = [
  {
    name: "vendor",
    label: "Vendor",
    required: true,
    fullWidth: true,
    placeholder: "Vendor name",
  },
  {
    name: "invoiceNumber",
    label: "Invoice number",
    fullWidth: true,
    placeholder: "e.g. INV-2026-080",
  },
  {
    name: "amount",
    label: "Amount (₦)",
    type: "number" as const,
    required: true,
    pair: "amount",
    defaultValue: "0",
    min: 0,
  },
  {
    name: "dueDate",
    label: "Due date",
    type: "date" as const,
    required: true,
    pair: "amount",
    placeholder: "mm/dd/yyyy",
  },
  {
    name: "category",
    label: "Category",
    type: "select" as const,
    required: true,
    fullWidth: true,
    defaultValue: "Utilities",
    options: billCategoryOptions,
  },
];

function isAwaitingApproval(status: BillStatus): boolean {
  return status === "Awaiting Admin Approval";
}

export function FinanceBillsPage() {
  const [activeFilter, setActiveFilter] = useState<BillFilter>("All");
  const [createOpen, setCreateOpen] = useState(false);
  const [query, setQuery] = useState("");
  const { runAction, exportRows } = usePageActions();

  const { data, loading, error, refetch } = useAsyncData(
    () => superAdminApi.bills.list(),
    [],
  );

  const bills = useMemo(() => {
    return listFrom(data ?? undefined).map((record) => mapBill(record));
  }, [data]);

  const billStats = useMemo(() => {
    const overdue = bills.filter((bill) => bill.status === "Overdue").length;
    const dueSoon = bills.filter((bill) => bill.status === "Scheduled for Payment").length;
    const paid = bills.filter((bill) => bill.status === "Paid").length;
    const outstanding = bills.filter(
      (bill) => bill.status !== "Paid",
    ).length;
    return [
      {
        id: "overdue",
        label: "Overdue bills",
        value: String(overdue),
        badge: "Urgent",
        badgeTone: "urgent" as const,
      },
      {
        id: "due-soon",
        label: "Due within 7 days",
        value: String(dueSoon),
        badge: "This week",
        badgeTone: "neutral" as const,
      },
      {
        id: "outstanding",
        label: "Total outstanding",
        value: String(outstanding),
        badge: "Payable",
        badgeTone: "success" as const,
      },
      {
        id: "paid",
        label: "Paid this month",
        value: String(paid),
        badge: "Current",
        badgeTone: "neutral" as const,
      },
    ];
  }, [bills]);

  const filteredBills = useMemo(() => {
    const term = query.trim().toLowerCase();
    return bills.filter((bill) => {
      const matchesFilter = matchesBillFilter(bill.status, activeFilter);
      const haystack =
        `${bill.ref} ${bill.vendor} ${bill.category}`.toLowerCase();
      return matchesFilter && (!term || haystack.includes(term));
    });
  }, [activeFilter, bills, query]);

  async function handleCreate(values: Record<string, string>) {
    const vendor = values.vendor.trim();
    const invoiceNumber = values.invoiceNumber.trim();
    const category = values.category.trim();
    const dueDate = values.dueDate;
    const amount = Number(values.amount);
    if (!vendor) {
      throw new Error("Enter a vendor name.");
    }
    if (!Number.isFinite(amount) || amount < 0) {
      throw new Error("Enter a valid amount.");
    }
    await runAction("Add bill", async () => {
      await superAdminApi.bills.create({
        vendor,
        vendorName: vendor,
        invoice: invoiceNumber,
        invoiceNumber,
        ref: invoiceNumber,
        amount,
        dueDate,
        category,
      });
      refetch();
    });
  }

  async function approveBill(bill: Bill) {
    await runAction(`Approve ${bill.ref}`, async () => {
      await superAdminApi.bills.action(bill.id, "approve");
      refetch();
    });
  }

  async function rejectBill(bill: Bill) {
    await runAction(`Reject ${bill.ref}`, async () => {
      await superAdminApi.bills.action(bill.id, "reject");
      refetch();
    });
  }

  async function uploadBill(bill: Bill) {
    await runAction(`Upload ${bill.ref}`, async () => {
      await superAdminApi.bills.action(bill.id, "upload");
      refetch();
    });
  }

  async function payBill(bill: Bill) {
    await runAction(`Pay ${bill.ref}`, async () => {
      await superAdminApi.bills.action(bill.id, "pay");
      refetch();
    });
  }

  function handleRefresh() {
    void runAction("Refresh", async () => {
      refetch();
    });
  }

  function handleExport() {
    exportRows(
      filteredBills.map((bill) => ({
        ref: bill.ref,
        vendor: bill.vendor,
        category: bill.category,
        amount: bill.amount,
        dueDate: bill.dueDate,
        status: bill.status,
      })),
      "bills.csv",
    );
  }

  return (
    <>
      <div className={payrollStyles.page}>
        <FinanceModuleTabs />
        {loading ? <p>Loading bills…</p> : null}
        {error ? <p role="alert">{error}</p> : null}

        <div className={payrollStyles.topBar}>
          <PageDateLabel className={payrollStyles.dateLabel} />
          <div className={payrollStyles.topActions}>
            <NotificationsLink className={payrollStyles.iconButton} />
            <button
              type="button"
              aria-label="Refresh"
              className={payrollStyles.iconButton}
              onClick={handleRefresh}
            >
              <RefreshCw size={16} />
            </button>
            <button
              type="button"
              aria-label="Export"
              className={payrollStyles.iconButton}
              onClick={handleExport}
            >
              <Upload size={16} />
            </button>
            <ProfileLink className={styles.avatarChip}>MC</ProfileLink>
          </div>
        </div>

        <div className={payrollStyles.header}>
          <div>
            <p className={payrollStyles.eyebrow}>Bills &amp; invoices</p>
            <h1 className={payrollStyles.title}>No invoice left behind</h1>
            <p className={payrollStyles.subtitle}>
              Record, approve, and track all company bills and invoice payments in
              one place.
            </p>
          </div>
          <button type="button" className={styles.addButton} onClick={() => setCreateOpen(true)}>
            <Plus size={16} strokeWidth={2.5} />
            Add bill
          </button>
        </div>

        <div className={styles.stats}>
          {billStats.map((stat) => (
            <article key={stat.id} className={styles.statCard}>
              <div className={styles.statTop}>
                <p className={styles.statLabel}>{stat.label}</p>
                <span
                  className={`${styles.statBadge} ${
                    stat.badgeTone === "urgent"
                      ? styles.statBadgeUrgent
                      : stat.badgeTone === "success"
                        ? styles.statBadgeSuccess
                        : ""
                  }`}
                >
                  {stat.badge}
                </span>
              </div>
              <div className={styles.statBottom}>
                <p className={styles.statValue}>{stat.value}</p>
                {stat.id === "paid" && (
                  <TrendingDown size={18} className={styles.trendIcon} aria-hidden />
                )}
              </div>
            </article>
          ))}
        </div>

        <div className={styles.filters}>
          {billFilters.map((filter) => {
            const active = activeFilter === filter;
            return (
              <button
                key={filter}
                type="button"
                onClick={() => setActiveFilter(filter)}
                className={`${styles.filterChip} ${active ? styles.filterChipActive : ""}`}
              >
                {filter}
              </button>
            );
          })}
        </div>

        <label className={styles.searchField}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="search"
            data-bills-search
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search bills..."
            className={styles.searchInput}
          />
        </label>

        <section className={styles.tableSection}>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Ref</th>
                  <th>Vendor</th>
                  <th>Category</th>
                  <th>Amount</th>
                  <th>Due date</th>
                  <th>Status</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {filteredBills.map((bill) => (
                  <tr
                    key={bill.id}
                    className={bill.status === "Overdue" ? styles.rowOverdue : undefined}
                  >
                    <td className={styles.refCell}>{bill.ref}</td>
                    <td className={styles.vendorCell}>{bill.vendor}</td>
                    <td>{bill.category}</td>
                    <td className={styles.amountCell}>{bill.amount}</td>
                    <td>{bill.dueDate}</td>
                    <td>
                      <span className={statusClass[bill.status]}>{bill.status}</span>
                    </td>
                    <td className={styles.actionCell}>
                      {isAwaitingApproval(bill.status) && (
                        <span className={styles.actionGroup}>
                          <button
                            type="button"
                            aria-label={`Reject ${bill.ref}`}
                            className={styles.rejectButton}
                            onClick={() => void rejectBill(bill)}
                          >
                            <X size={14} />
                          </button>
                          <button
                            type="button"
                            className={styles.approveButton}
                            onClick={() => void approveBill(bill)}
                          >
                            <Check size={14} strokeWidth={2.5} />
                            Approve
                          </button>
                        </span>
                      )}
                      {bill.status === "Scheduled for Payment" && (
                        <button
                          type="button"
                          className={styles.uploadButton}
                          onClick={() => void uploadBill(bill)}
                        >
                          <Upload size={14} />
                          Upload
                        </button>
                      )}
                      {bill.status === "Overdue" && (
                        <button
                          type="button"
                          className={styles.payNowButton}
                          onClick={() => void payBill(bill)}
                        >
                          Pay now
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredBills.length === 0 && (
            <div className={styles.empty}>No bills match this filter.</div>
          )}
        </section>
      </div>

      <SimpleModal
        open={createOpen}
        title="Add bill"
        fields={createFields}
        submitLabel="Add bill"
        showClose
        appearance="soft"
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreate}
      />
    </>
  );
}
