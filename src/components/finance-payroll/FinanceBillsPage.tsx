"use client";

import { PageDateLabel } from "@/components/layout/PageDateLabel";
import { useMemo, useState } from "react";
import { Check, Plus, RefreshCw, Search, TrendingDown, Upload, X } from "lucide-react";
import { FinanceModuleTabs } from "@/components/finance-payroll/FinanceModuleTabs";
import { HideOnManager } from "@/components/layout/HideOnManager";
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
import { useManagerPortal } from "@/hooks/useManagerPortal";
import { managerApi, superAdminApi } from "@/lib/api";
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

const createFields = [
  { name: "vendor", label: "Vendor", required: true },
  { name: "category", label: "Category", required: true },
  { name: "amount", label: "Amount", required: true, placeholder: "₦ 0" },
  { name: "dueDate", label: "Due date", type: "date" as const, required: true },
];

function isAwaitingApproval(status: BillStatus): boolean {
  return status === "Awaiting Admin Approval";
}

function billWriteBody(values: Record<string, string>) {
  const vendor = values.vendor.trim();
  const category = values.category.trim();
  const amount = Number(String(values.amount ?? "").replace(/[^\d.-]/g, ""));
  const dueDate = values.dueDate.trim();
  const unitPrice = Number.isFinite(amount) && amount > 0 ? amount : 0;
  const invoiceNumber = `INV-${Date.now()}`;
  return {
    vendor,
    vendorName: vendor,
    category,
    categoryName: category,
    amount: unitPrice,
    totalAmount: unitPrice,
    dueDate,
    due_date: dueDate,
    invoiceNumber,
    invoice_number: invoiceNumber,
    description: `${category} bill from ${vendor}`,
    status: "Awaiting Admin Approval",
    items: [
      {
        description: category || vendor,
        quantity: 1,
        unitPrice: unitPrice,
        estimatedUnitPrice: unitPrice,
      },
    ],
  };
}

export function FinanceBillsPage() {
  const manager = useManagerPortal();
  const [activeFilter, setActiveFilter] = useState<BillFilter>("All");
  const [createOpen, setCreateOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [createdRecords, setCreatedRecords] = useState<
    Record<string, unknown>[]
  >([]);
  const { runAction, exportRows } = usePageActions();

  const { data, loading, error, refetch } = useAsyncData(
    () => (manager ? managerApi.listBills() : superAdminApi.bills.list()),
    [manager],
  );

  const bills = useMemo(() => {
    const remote = listFrom(data ?? undefined);
    const seen = new Set<string>();
    return [...createdRecords, ...remote]
      .filter((record) => {
        const key = String(record.id ?? record.ref ?? record.reference ?? "");
        if (key && seen.has(key)) return false;
        if (key) seen.add(key);
        return true;
      })
      .map((record) => mapBill(record));
  }, [createdRecords, data]);

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
    await runAction("Add bill", async () => {
      const body = billWriteBody(values);
      if (!body.vendor) {
        throw new Error("Enter a vendor name.");
      }
      if (!Number.isFinite(body.amount) || body.amount <= 0) {
        throw new Error("Enter a valid amount.");
      }
      if (!body.dueDate) {
        throw new Error("Enter a due date.");
      }
      const created = await (manager
        ? managerApi.createBill(body)
        : superAdminApi.bills.create(body));
      if (created && typeof created === "object") {
        setCreatedRecords((current) => [
          created as Record<string, unknown>,
          ...current,
        ]);
      }
      refetch();
    });
  }

  async function approveBill(bill: Bill) {
    await runAction(`Approve ${bill.ref}`, async () => {
      await (manager
        ? managerApi.approveBill(bill.id)
        : superAdminApi.bills.action(bill.id, "approve"));
      refetch();
    });
  }

  async function rejectBill(bill: Bill) {
    await runAction(`Reject ${bill.ref}`, async () => {
      await (manager
        ? managerApi.rejectBill(bill.id)
        : superAdminApi.bills.action(bill.id, "reject"));
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
      await (manager
        ? managerApi.payBill(bill.id)
        : superAdminApi.bills.action(bill.id, "pay"));
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

        <HideOnManager>
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
        </HideOnManager>

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
        description="Record a vendor bill or invoice for approval."
        fields={createFields}
        submitLabel="Add bill"
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreate}
      />
    </>
  );
}
