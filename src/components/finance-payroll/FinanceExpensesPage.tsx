"use client";

import { useState } from "react";
import { Bell, Download, Plus, Search, Trash2 } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { FinanceModuleTabs } from "@/components/finance-payroll/FinanceModuleTabs";
import {
  categoryIcons,
  expenseClaims,
  expenseSectionTabs,
  expenseStats,
  type ExpenseSectionTab,
  type ExpenseStatus,
} from "@/data/financeExpenses";
import payrollStyles from "./FinancePayrollPage.module.css";
import styles from "./FinanceExpensesPage.module.css";

const statusClass: Record<ExpenseStatus, string> = {
  Pending: styles.statusPending,
  Approved: styles.statusApproved,
  Rejected: styles.statusRejected,
};

export function FinanceExpensesPage() {
  const [activeSection, setActiveSection] = useState<ExpenseSectionTab>("My expense");

  return (
    <AppShell>
      <div className={payrollStyles.page}>
        <FinanceModuleTabs />

        <div className={payrollStyles.topBar}>
          <p className={payrollStyles.dateLabel}>Tuesday, July 28</p>
          <div className={payrollStyles.topActions}>
            <button type="button" aria-label="Search" className={payrollStyles.iconButton}>
              <Search size={16} />
            </button>
            <button type="button" aria-label="Notifications" className={payrollStyles.iconButton}>
              <Bell size={16} />
            </button>
            <button type="button" aria-label="Profile" className={styles.avatarChip}>
              MC
            </button>
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
            <button type="button" className={payrollStyles.exportButton}>
              <Download size={15} />
              Export
            </button>
            <button type="button" className={styles.submitButton}>
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
              {"sublabel" in stat && stat.sublabel && (
                <p className={styles.statSublabel}>{stat.sublabel}</p>
              )}
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
                  {expenseClaims.map((claim) => {
                    const CategoryIcon = categoryIcons[claim.category];
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
                          <button
                            type="button"
                            aria-label={`Delete ${claim.ref}`}
                            className={styles.deleteButton}
                          >
                            <Trash2 size={15} />
                          </button>
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
    </AppShell>
  );
}
