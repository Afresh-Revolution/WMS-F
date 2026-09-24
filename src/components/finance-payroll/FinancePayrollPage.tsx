"use client";

import { PageDateLabel } from "@/components/layout/PageDateLabel";
import { useMemo, useState } from "react";
import {
  Bell,
  ClipboardList,
  DollarSign,
  Download,
  Search,
} from "lucide-react";
import { FinanceModuleTabs } from "@/components/finance-payroll/FinanceModuleTabs";
import { NotificationsLink, ProfileLink } from "@/components/layout/PageLinks";
import { useCurrentUser } from "@/components/layout/CurrentUserProvider";
import { SimpleModal } from "@/components/ui/SimpleModal";
import { payrollMonthOptions } from "@/data/accountantPayroll";
import {
  payrollSectionTabs,
  type PayRun,
  type PayRunStatus,
  type PayrollSectionTab,
} from "@/data/financePayroll";
import { useAsyncData } from "@/hooks/useAsyncData";
import { usePageActions } from "@/hooks/usePageActions";
import { managerApi, superAdminApi, unwrapRecord } from "@/lib/api";
import { listFrom, mapPayRun, str } from "@/lib/api/mappers";
import { useManagerPortal } from "@/hooks/useManagerPortal";
import styles from "./FinancePayrollPage.module.css";

const statusClass: Record<PayRunStatus, string> = {
  Processing: styles.statusProcessing,
  Completed: styles.statusCompleted,
};

const now = new Date();
const defaultPayMonth = now.toLocaleString("en-US", { month: "long" });
const defaultPayYear = String(now.getFullYear());

const runPayrollFields = [
  {
    name: "month",
    label: "Pay month",
    type: "select" as const,
    required: true,
    defaultValue: defaultPayMonth,
    options: payrollMonthOptions.map((month) => ({ label: month, value: month })),
    group: "Pay period",
  },
  {
    name: "year",
    label: "Year",
    type: "number" as const,
    required: true,
    defaultValue: defaultPayYear,
    min: 2000,
    max: 2100,
    group: "Pay period",
  },
  { name: "notes", label: "Notes", type: "textarea" as const },
];

export function FinancePayrollPage() {
  const manager = useManagerPortal();
  const [activeSection, setActiveSection] = useState<PayrollSectionTab>("Pay runs");
  const [runOpen, setRunOpen] = useState(false);
  const { runAction, exportRows } = usePageActions();
  const { user } = useCurrentUser();

  const { data, loading, error, refetch } = useAsyncData(
    () => (manager ? managerApi.listPayrollRuns() : superAdminApi.payroll.list()),
    [manager],
  );

  const payRuns = useMemo(() => {
    return listFrom(data ?? undefined).map((record) => mapPayRun(record));
  }, [data]);

  const payrollStats = useMemo(() => {
    const summary = unwrapRecord(data);
    const totalStaff = payRuns.reduce((sum, run) => sum + run.staff, 0);
    const period =
      str(summary.period ?? payRuns[0]?.period) ||
      new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" });
    const thisWeek = payRuns.filter((run) => {
      const parsed = new Date(run.runDate);
      if (!Number.isFinite(parsed.getTime())) return false;
      return Date.now() - parsed.getTime() < 7 * 86_400_000;
    }).length;
    return [
      {
        id: "attainment",
        value: str(summary.attainment, "—"),
        meta: period,
      },
      {
        id: "cycle-total",
        value: str(
          summary.cycleTotal ?? summary.total,
          String(payRuns.length),
        ),
        meta: "This cycle",
      },
      {
        id: "active-staff",
        value: str(
          summary.activeStaff ?? summary.staff,
          String(totalStaff),
        ),
        meta: "Active",
      },
      {
        id: "this-week",
        value: str(summary.thisWeek ?? summary.dueThisWeek, String(thisWeek)),
        meta: "This week",
      },
    ];
  }, [data, payRuns]);

  function handleExport() {
    exportRows(
      payRuns.map((run) => ({
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
      const period = `${values.month} ${values.year}`.trim();
      if (manager) {
        await managerApi.runPayroll({
          period,
          month: values.month,
          year: values.year,
          notes: values.notes,
        });
      } else {
        await superAdminApi.payroll.collectionAction("run", {
          ...values,
          period,
        });
      }
      refetch();
    });
  }

  async function downloadRun(run: PayRun) {
    await runAction(`Download ${run.ref}`, async () => {
      if (manager) {
        await managerApi.getPayrollRun(run.id);
      } else {
        await superAdminApi.payroll.getAction(run.id, "download");
      }
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
          <div className={styles.headerAside}>
            <div className={styles.headerActions}>
              <button type="button" className={styles.exportButton} onClick={handleExport}>
                <Download size={15} />
                Export
              </button>
              <button
                type="button"
                className={styles.runButton}
                onClick={() => setRunOpen(true)}
              >
                <DollarSign size={14} />
                Run payroll
              </button>
            </div>
            <div className={styles.topActions}>
              <label className={styles.search}>
                <Search size={14} />
                <input
                  type="search"
                  placeholder="Search"
                  className={styles.searchInput}
                  aria-label="Search"
                  readOnly
                />
                <kbd>⌘ K</kbd>
              </label>
              <NotificationsLink className={styles.iconButton}>
                <Bell size={16} />
              </NotificationsLink>
              <ProfileLink className={styles.avatarChip}>
                {user?.initials || "SU"}
              </ProfileLink>
            </div>
          </div>
        </div>

        <PageDateLabel className={styles.statsDate} />
        <div className={styles.stats}>
          {payrollStats.map((stat) => (
            <article key={stat.id} className={styles.statCard}>
              <p className={styles.statValue}>{stat.value}</p>
              <span className={styles.statMeta}>{stat.meta}</span>
            </article>
          ))}
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
