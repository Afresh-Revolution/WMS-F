"use client";

import { useState } from "react";
import {
  Bell,
  ClipboardList,
  Download,
  Play,
  Search,
  SlidersHorizontal,
  Upload,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { FinanceModuleTabs } from "@/components/finance-payroll/FinanceModuleTabs";
import {
  payRuns,
  payrollSectionTabs,
  payrollStats,
  type PayRunStatus,
  type PayrollSectionTab,
} from "@/data/financePayroll";
import styles from "./FinancePayrollPage.module.css";

const statusClass: Record<PayRunStatus, string> = {
  Processing: styles.statusProcessing,
  Completed: styles.statusCompleted,
};

export function FinancePayrollPage() {
  const [activeSection, setActiveSection] = useState<PayrollSectionTab>("Pay runs");

  return (
    <AppShell>
      <div className={styles.page}>
        <FinanceModuleTabs />

        <div className={styles.header}>
              <div>
                <p className={styles.eyebrow}>Payroll &amp; finance</p>
                <h1 className={styles.title}>Every pay cycle, handled</h1>
                <p className={styles.subtitle}>
                  Process pay runs, distribute payslips, manage deductions, and remit
                  to vendors — all from one place.
                </p>
              </div>
              <div className={styles.headerActions}>
                <button type="button" className={styles.exportButton}>
                  <Upload size={15} />
                  Export
                </button>
                <button type="button" className={styles.runButton}>
                  <Play size={14} fill="currentColor" />
                  Run payroll
                </button>
              </div>
            </div>

            <div className={styles.statsBar}>
              <p className={styles.statsDate}>Tuesday, July 28</p>
              <div className={styles.statsGroup}>
                {payrollStats.map((stat) => (
                  <div key={stat.id} className={styles.statItem}>
                    <p className={styles.statValue}>{stat.value}</p>
                    <p className={styles.statLabel}>{stat.label}</p>
                  </div>
                ))}
              </div>
              <div className={styles.topActions}>
                <button type="button" aria-label="Search" className={styles.iconButton}>
                  <Search size={16} />
                </button>
                <button type="button" aria-label="Notifications" className={styles.iconButton}>
                  <Bell size={16} />
                </button>
                <button type="button" aria-label="Filters" className={styles.iconButton}>
                  <SlidersHorizontal size={16} />
                </button>
              </div>
            </div>

            <div className={styles.sectionTabs}>
              {payrollSectionTabs.map((tab) => {
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

            {activeSection === "Pay runs" ? (
              <section className={styles.tableSection}>
                <div className={styles.tableHeader}>
                  <div>
                    <h2 className={styles.tableTitle}>Pay run history</h2>
                    <p className={styles.tableSubtitle}>
                      See the history of disbursements across the organization.
                    </p>
                  </div>
                  <button type="button" className={styles.auditButton}>
                    <ClipboardList size={15} />
                    Audit log
                  </button>
                </div>

                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Ref</th>
                        <th>Period</th>
                        <th>Run date</th>
                        <th>Staff</th>
                        <th>Total amount</th>
                        <th>Status</th>
                        <th aria-label="Actions" />
                      </tr>
                    </thead>
                    <tbody>
                      {payRuns.map((run) => (
                        <tr key={run.id}>
                          <td className={styles.refCell}>{run.ref}</td>
                          <td>{run.period}</td>
                          <td>{run.runDate}</td>
                          <td>{run.staff.toLocaleString()}</td>
                          <td className={styles.amountCell}>{run.totalAmount}</td>
                          <td>
                            <span className={statusClass[run.status]}>{run.status}</span>
                          </td>
                          <td className={styles.actionCell}>
                            <button
                              type="button"
                              aria-label={`Download ${run.ref}`}
                              className={styles.downloadButton}
                            >
                              <Download size={15} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            ) : (
              <section className={styles.placeholder}>
                <h2 className={styles.tableTitle}>{activeSection}</h2>
                <p className={styles.tableSubtitle}>
                  {activeSection === "Payslips"
                    ? "View and distribute employee payslips for each pay cycle."
                    : activeSection === "Deductions"
                      ? "Manage statutory and voluntary payroll deductions."
                      : "Track vendor payments and remittance schedules."}
                </p>
              </section>
            )}
      </div>
    </AppShell>
  );
}
