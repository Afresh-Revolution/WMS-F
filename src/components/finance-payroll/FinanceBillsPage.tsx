"use client";

import { useMemo, useState } from "react";
import { Bell, Check, Plus, Search, TrendingDown, Upload, X } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { FinanceModuleTabs } from "@/components/finance-payroll/FinanceModuleTabs";
import {
  billFilters,
  billStats,
  bills,
  matchesBillFilter,
  type BillFilter,
  type BillStatus,
} from "@/data/financeBills";
import payrollStyles from "./FinancePayrollPage.module.css";
import styles from "./FinanceBillsPage.module.css";

const statusClass: Record<BillStatus, string> = {
  "Awaiting Admin Approval": styles.statusPending,
  "Scheduled for Payment": styles.statusScheduled,
  Overdue: styles.statusOverdue,
  "Pending review": styles.statusReview,
  Paid: styles.statusPaid,
};

function isAwaitingApproval(status: BillStatus): boolean {
  return status === "Awaiting Admin Approval";
}

export function FinanceBillsPage() {
  const [activeFilter, setActiveFilter] = useState<BillFilter>("All");

  const filteredBills = useMemo(() => {
    return bills.filter((bill) => matchesBillFilter(bill.status, activeFilter));
  }, [activeFilter]);

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
            <p className={payrollStyles.eyebrow}>Bills &amp; invoices</p>
            <h1 className={payrollStyles.title}>No invoice left behind</h1>
            <p className={payrollStyles.subtitle}>
              Record, approve, and track all company bills and invoice payments in
              one place.
            </p>
          </div>
          <button type="button" className={styles.addButton}>
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
                          >
                            <X size={14} />
                          </button>
                          <button type="button" className={styles.approveButton}>
                            <Check size={14} strokeWidth={2.5} />
                            Approve
                          </button>
                        </span>
                      )}
                      {bill.status === "Scheduled for Payment" && (
                        <button type="button" className={styles.uploadButton}>
                          <Upload size={14} />
                          Upload
                        </button>
                      )}
                      {bill.status === "Overdue" && (
                        <button type="button" className={styles.payNowButton}>
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
    </AppShell>
  );
}
