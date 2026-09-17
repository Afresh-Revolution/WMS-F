"use client";

import { useMemo, useState } from "react";
import {
  ClipboardList,
  Download,
  Play,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Upload,
} from "lucide-react";
import { FinanceModuleTabs } from "@/components/finance-payroll/FinanceModuleTabs";
import { NotificationsLink } from "@/components/layout/PageLinks";
import { SimpleModal } from "@/components/ui/SimpleModal";
import {
  payrollSectionTabs,
  type PayRun,
  type PayRunStatus,
  type PayrollSectionTab,
} from "@/data/financePayroll";
import { useAsyncData } from "@/hooks/useAsyncData";
import { usePageActions } from "@/hooks/usePageActions";
import { superAdminApi, unwrapRecord } from "@/lib/api";
import { listFrom, mapPayRun, str } from "@/lib/api/mappers";
import styles from "./FinancePayrollPage.module.css";

const statusClass: Record<PayRunStatus, string> = {
  Processing: styles.statusProcessing,
  Completed: styles.statusCompleted,
};

const runPayrollFields = [
  { name: "period", label: "Pay period", required: true, placeholder: "July 2026" },
  { name: "notes", label: "Notes", type: "textarea" as const },
];

export function FinancePayrollPage() {
  const [activeSection, setActiveSection] = useState<PayrollSectionTab>("Pay runs");
  const [runOpen, setRunOpen] = useState(false);
  const [query, setQuery] = useState("");
  const { runAction, exportRows, showToast } = usePageActions();

  const { data, loading, error, refetch } = useAsyncData(
    () => superAdminApi.payroll.list(),
    [],
  );

  const payRuns = useMemo(() => {
    return listFrom(data ?? undefined).map((record) => mapPayRun(record));
  }, [data]);

  const filteredPayRuns = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return payRuns;
    return payRuns.filter((run) =>
      `${run.ref} ${run.period} ${run.status}`.toLowerCase().includes(term),
    );
  }, [payRuns, query]);

  const payrollStats = useMemo(() => {
    const summary = unwrapRecord(data);
    const totalStaff = payRuns.reduce((sum, run) => sum + run.staff, 0);
    return [
      {
        id: "attainment",
        value: str(summary.attainment, "—"),
        label: "Cycle attainment",
      },
      {
        id: "cycle-total",
        value: str(summary.cycleTotal ?? summary.total, String(payRuns.length || "0")),
        label: "Pay runs",
      },
      {
        id: "active-staff",
        value: str(summary.activeStaff ?? summary.staff, String(totalStaff || "0")),
        label: "Staff in latest runs",
      },
    ];
  }, [data, payRuns]);

  function handleExport() {
    exportRows(
      filteredPayRuns.map((run) => ({
        ref: run.ref,
        period: run.period,
        runDate: run.runDate,
        staff: run.staff,
        totalAmount: run.totalAmount,
        status: run.status,
      })),
      "payroll-runs.csv",
    );
  }

  async function handleRunPayroll(values: Record<string, string>) {
    await runAction("Run payroll", async () => {
      await superAdminApi.payroll.collectionAction("run", values);
      refetch();
    });
  }

  async function downloadRun(run: PayRun) {
    await runAction(`Download ${run.ref}`, async () => {
      await superAdminApi.payroll.getAction(run.id, "download");
    });
  }

  function handleRefresh() {
    void runAction("Refresh", async () => {
      refetch();
    });
  }

  async function openAuditLog() {
    await runAction("Audit log", async () => {
      await superAdminApi.operationalAudit.list({ module: "payroll" });
    });
  }

  return (
    <>
      <div className={styles.page}>
        <FinanceModuleTabs />
        {loading ? <p>Loading payroll…</p> : null}
        {error ? <p role="alert">{error}</p> : null}

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
            <button type="button" className={styles.exportButton} onClick={handleExport}>
              <Upload size={15} />
              Export
            </button>
            <button
              type="button"
              className={styles.runButton}
              onClick={() => setRunOpen(true)}
            >
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
            <NotificationsLink className={styles.iconButton} />
            <button
              type="button"
              aria-label="Refresh"
              className={styles.iconButton}
              onClick={handleRefresh}
            >
              <RefreshCw size={16} />
            </button>
            <button
              type="button"
              aria-label="Filters"
              className={styles.iconButton}
              onClick={() => showToast("Use the section tabs to filter pay runs", "info")}
            >
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
              <button type="button" className={styles.auditButton} onClick={() => void openAuditLog()}>
                <ClipboardList size={15} />
                Audit log
              </button>
            </div>

            <label className={styles.searchField}>
              <Search size={15} aria-hidden />
              <input
                type="search"
                data-payroll-search
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search pay runs..."
                className={styles.searchInput}
              />
            </label>

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
                  {filteredPayRuns.map((run) => (
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
                          onClick={() => void downloadRun(run)}
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

      <SimpleModal
        open={runOpen}
        title="Run payroll"
        description="Start a new pay run for the selected period."
        fields={runPayrollFields}
        submitLabel="Run payroll"
        onClose={() => setRunOpen(false)}
        onSubmit={handleRunPayroll}
      />
    </>
  );
}
