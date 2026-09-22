"use client";

import { PageDateLabel } from "@/components/layout/PageDateLabel";
import { useMemo, useState } from "react";
import { Download, Plus, RefreshCw, Search, Trash2 } from "lucide-react";
import { FinanceModuleTabs } from "@/components/finance-payroll/FinanceModuleTabs";
import { NotificationsLink, ProfileLink } from "@/components/layout/PageLinks";
import { SimpleModal } from "@/components/ui/SimpleModal";
import {
  categoryIcons,
  expenseSectionTabs,
  type ExpenseClaim,
  type ExpenseSectionTab,
  type ExpenseStatus,
} from "@/data/financeExpenses";
import { useAsyncData } from "@/hooks/useAsyncData";
import { usePageActions } from "@/hooks/usePageActions";
import { useManagerPortal } from "@/hooks/useManagerPortal";
import { managerApi, superAdminApi } from "@/lib/api";
import { listFrom, mapExpense } from "@/lib/api/mappers";
import payrollStyles from "./FinancePayrollPage.module.css";
import styles from "./FinanceExpensesPage.module.css";

const statusClass: Record<ExpenseStatus, string> = {
  Pending: styles.statusPending,
  Approved: styles.statusApproved,
  Rejected: styles.statusRejected,
};

const createFields = [
  { name: "description", label: "Description", required: true },
  {
    name: "category",
    label: "Category",
    type: "select" as const,
    defaultValue: "Meals",
    options: [
      { label: "Meals", value: "Meals" },
      { label: "Transport", value: "Transport" },
      { label: "Accommodation", value: "Accommodation" },
      { label: "Fuel", value: "Fuel" },
      { label: "Office Supplies", value: "Office Supplies" },
      { label: "Communication", value: "Communication" },
      { label: "Travel", value: "Travel" },
      { label: "Client Entertainment", value: "Client Entertainment" },
      { label: "Training", value: "Training" },
      { label: "Software", value: "Software" },
      { label: "Equipment", value: "Equipment" },
      { label: "Medical", value: "Medical" },
      { label: "Internet", value: "Internet" },
      { label: "Other", value: "Other" },
    ],
  },
  { name: "date", label: "Date", type: "date" as const, required: true },
  { name: "amount", label: "Amount", required: true, placeholder: "₦ 0" },
];

function expenseWriteBody(values: Record<string, string>) {
  const amount = Number(String(values.amount ?? "").replace(/[^\d.]/g, ""));
  return {
    description: values.description.trim(),
    category: values.category.trim() || "Other",
    date: values.date,
    amount,
  };
}

export function FinanceExpensesPage() {
  const manager = useManagerPortal();
  const [activeSection, setActiveSection] = useState<ExpenseSectionTab>("My expense");
  const [createOpen, setCreateOpen] = useState(false);
  const [query, setQuery] = useState("");
  const { runAction, exportRows } = usePageActions();

  const { data, loading, error, refetch } = useAsyncData(
    () => (manager ? managerApi.listExpenses() : superAdminApi.expenses.list()),
    [manager],
  );

  const expenseClaims = useMemo(() => {
    return listFrom(data ?? undefined).map((record) => mapExpense(record));
  }, [data]);

  const expenseStats = useMemo(() => {
    const pending = expenseClaims.filter((claim) => claim.status === "Pending").length;
    const approved = expenseClaims.filter((claim) => claim.status === "Approved").length;
    const rejected = expenseClaims.filter((claim) => claim.status === "Rejected").length;
    return [
      {
        id: "submitted",
        label: "Submitted this month",
        value: String(expenseClaims.length),
        badge: "Jul 2026",
      },
      {
        id: "pending",
        label: "Pending approval",
        value: String(pending),
        badge: "Awaiting",
        tone: pending > 0 ? ("alert" as const) : undefined,
      },
      {
        id: "approved",
        label: "Approved",
        value: String(approved),
        badge: "Cleared",
      },
      {
        id: "rejected",
        label: "Rejected",
        value: String(rejected),
        badge: "Declined",
      },
    ];
  }, [expenseClaims]);

  const filteredClaims = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return expenseClaims;
    return expenseClaims.filter((claim) =>
      `${claim.ref} ${claim.description} ${claim.category}`.toLowerCase().includes(term),
    );
  }, [expenseClaims, query]);

  async function handleCreate(values: Record<string, string>) {
    await runAction("Submit claim", async () => {
      const body = expenseWriteBody(values);
      if (!body.description) {
        throw new Error("Enter a description for this claim.");
      }
      if (!Number.isFinite(body.amount) || body.amount <= 0) {
        throw new Error("Enter a valid amount.");
      }
      await (manager
        ? managerApi.createExpense(body)
        : superAdminApi.expenses.create(body));
      refetch();
    });
  }

  async function deleteClaim(claim: ExpenseClaim) {
    if (manager) return;
    await runAction(`Delete ${claim.ref}`, async () => {
      await superAdminApi.expenses.delete(claim.id);
      refetch();
    });
  }

  function handleExport() {
    exportRows(
      filteredClaims.map((claim) => ({
        ref: claim.ref,
        description: claim.description,
        category: claim.category,
        date: claim.date,
        amount: claim.amount,
        status: claim.status,
      })),
      "expenses.csv",
    );
  }

  function handleRefresh() {
    void runAction("Refresh", async () => {
      refetch();
    });
  }

  return (
    <>
      <div className={payrollStyles.page}>
        <FinanceModuleTabs />
        {loading ? <p>Loading expenses…</p> : null}
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
            <ProfileLink className={styles.avatarChip}>MC</ProfileLink>
          </div>
        </div>

        <div className={payrollStyles.header}>
          <div>
            <p className={payrollStyles.eyebrow}>Expenses</p>
            <h1 className={payrollStyles.title}>Spend tracked, team covered</h1>
            <p className={payrollStyles.subtitle}>
              Submit claims, review receipts, and keep every expense within policy
              — quickly and clearly.
            </p>
          </div>
          <div className={payrollStyles.headerActions}>
            <button type="button" className={payrollStyles.exportButton} onClick={handleExport}>
              <Download size={15} />
              Export
            </button>
            <button
              type="button"
              className={styles.submitButton}
              onClick={() => setCreateOpen(true)}
            >
              <Plus size={16} strokeWidth={2.5} />
              Submit claim
            </button>
          </div>
        </div>

        <div className={styles.stats}>
          {expenseStats.map((stat) => (
            <article key={stat.id} className={styles.statCard}>
              <div className={styles.statTop}>
                <p className={styles.statLabel}>{stat.label}</p>
                <span className={styles.statBadge}>{stat.badge}</span>
              </div>
              <p
                className={`${styles.statValue} ${
                  stat.tone === "alert" ? styles.statValueAlert : ""
                }`}
              >
                {stat.value}
              </p>
            </article>
          ))}
        </div>

        <div className={styles.sectionTabs}>
          {expenseSectionTabs.map((tab) => {
            const active = activeSection === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveSection(tab)}
                className={`${styles.sectionTab} ${active ? styles.sectionTabActive : ""}`}
              >
                {tab}
              </button>
            );
          })}
        </div>

        {activeSection === "My expense" ? (
          <section className={styles.tableSection}>
            <div className={styles.tableHeader}>
              <div>
                <h2 className={styles.tableTitle}>My claims — July 2026</h2>
                <p className={styles.tableSubtitle}>
                  All expense submission for the current month.
                </p>
              </div>
            </div>

            <label className={styles.searchField}>
              <Search size={16} className={styles.searchIcon} />
              <input
                type="search"
                data-expenses-search
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search claims..."
                className={styles.searchInput}
              />
            </label>

            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Ref</th>
                    <th>Description</th>
                    <th>Category</th>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th aria-label="Actions" />
                  </tr>
                </thead>
                <tbody>
                  {filteredClaims.map((claim) => {
                    const CategoryIcon = categoryIcons[claim.category] ?? categoryIcons.Other;
                    return (
                      <tr key={claim.id}>
                        <td className={styles.refCell}>{claim.ref}</td>
                        <td className={styles.descriptionCell}>{claim.description}</td>
                        <td>
                          <span className={styles.category}>
                            <CategoryIcon size={14} strokeWidth={1.75} />
                            {claim.category}
                          </span>
                        </td>
                        <td>{claim.date}</td>
                        <td className={styles.amountCell}>{claim.amount}</td>
                        <td>
                          <span className={statusClass[claim.status]}>{claim.status}</span>
                        </td>
                        <td className={styles.actionCell}>
                          {manager ? null : (
                            <button
                              type="button"
                              aria-label={`Delete ${claim.ref}`}
                              className={styles.deleteButton}
                              onClick={() => void deleteClaim(claim)}
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        ) : (
          <section className={styles.placeholder}>
            <h2 className={styles.tableTitle}>{activeSection}</h2>
            <p className={styles.tableSubtitle}>
              {activeSection === "Team expenses"
                ? "Review and approve expense claims submitted by your team."
                : "View company expense policies and reimbursement limits."}
            </p>
          </section>
        )}
      </div>

      <SimpleModal
        open={createOpen}
        title="Submit expense claim"
        description="Add a reimbursable expense. A receipt is optional."
        fields={createFields}
        submitLabel="Submit claim"
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreate}
      />
    </>
  );
}
