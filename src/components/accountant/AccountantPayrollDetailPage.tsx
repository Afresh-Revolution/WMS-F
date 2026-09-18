"use client";

import { PageDateLabel } from "@/components/layout/PageDateLabel";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Bell,
  FileText,
  Pencil,
  Search,
  Send,
} from "lucide-react";
import { AccountantStatusLine } from "@/components/accountant/AccountantStatusLine";
import { useAsyncData } from "@/hooks/useAsyncData";
import { usePageActions } from "@/hooks/usePageActions";
import { accountantApi, accountantSettled } from "@/lib/api";
import { mapAccountantPayrollDetail } from "@/lib/api/accountantMappers";
import {
  getAccountantPayrollDetail,
  type AccountantPayrollStatus,
} from "@/data/accountantPayroll";
import styles from "./AccountantPayrollDetailPage.module.css";

const statusClass: Record<AccountantPayrollStatus, string> = {
  "In Preparation": styles.statusPreparation,
  Submitted: styles.statusSubmitted,
  Paid: styles.statusPaid,
};

type AccountantPayrollDetailPageProps = {
  periodId: string;
};

export function AccountantPayrollDetailPage({
  periodId,
}: AccountantPayrollDetailPageProps) {
  const fallback = getAccountantPayrollDetail(periodId);
  const [status, setStatus] = useState<AccountantPayrollStatus | null>(null);
  const { runAction, showToast } = usePageActions();
  const { data, loading, error } = useAsyncData(async () => {
    const [run, items] = await Promise.all([
      accountantApi.payroll.runs.get(periodId),
      accountantSettled(accountantApi.payroll.runs.items(periodId)),
    ]);
    void accountantSettled(accountantApi.payroll.payslips({ runId: periodId }));
    return { run, items };
  }, [periodId]);

  const mapped = useMemo(
    () => mapAccountantPayrollDetail(data?.run, data?.items, fallback),
    [data, fallback],
  );
  const detail = mapped
    ? { ...mapped, status: status ?? mapped.status }
    : null;

  async function handleSubmit() {
    if (!detail) return;
    await runAction(
      "Submit to Admin",
      async () => {
        setStatus("Submitted");
      },
      `${detail.label} payroll submitted to Admin`,
    );
  }

  if (!detail) {
    return (
      <div className={styles.page}>
        <AccountantStatusLine loading={loading} error={error} resource="payroll run" />
        <Link href="/accountant/payroll" className={styles.backLink}>
          <ArrowLeft size={16} />
          Back to payroll periods
        </Link>
        <h1 className={styles.title}>Payroll not found</h1>
        <p className={styles.subtitle}>
          This payroll period does not exist or is no longer available.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <AccountantStatusLine loading={loading} error={error} resource="payroll run" />
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

      <Link href="/accountant/payroll" className={styles.backLink}>
        <ArrowLeft size={16} />
        Back to payroll periods
      </Link>

      <div className={styles.header}>
        <div>
          <div className={styles.titleRow}>
            <h1 className={styles.title}>{detail.label}</h1>
            <span className={`${styles.status} ${statusClass[detail.status]}`}>
              {detail.status}
            </span>
          </div>
          <p className={styles.subtitle}>
            Salary schedule · {detail.staff} staff · {detail.recorded} salaries
            recorded
          </p>
        </div>
        {detail.status === "In Preparation" ? (
          <button
            type="button"
            className={styles.submitButton}
            onClick={() => void handleSubmit()}
          >
            <Send size={15} />
            Submit to Admin
          </button>
        ) : null}
      </div>

      <div className={styles.summaryGrid}>
        <article className={styles.summaryCard}>
          <p className={styles.summaryLabel}>Gross payable</p>
          <p className={styles.summaryValue}>{detail.summary.gross}</p>
        </article>
        <article className={styles.summaryCard}>
          <p className={styles.summaryLabel}>Total bonuses</p>
          <p className={`${styles.summaryValue} ${styles.valueBonus}`}>
            {detail.summary.bonuses}
          </p>
        </article>
        <article className={styles.summaryCard}>
          <p className={styles.summaryLabel}>Total deductions</p>
          <p className={`${styles.summaryValue} ${styles.valueDeduction}`}>
            {detail.summary.deductions}
          </p>
        </article>
        <article className={styles.summaryCard}>
          <p className={styles.summaryLabel}>Net payable</p>
          <p className={styles.summaryValue}>{detail.summary.net}</p>
        </article>
      </div>

      <section className={styles.scheduleCard}>
        <div className={styles.scheduleHeader}>
          <div className={styles.scheduleTitleWrap}>
            <span className={styles.scheduleIcon} aria-hidden>
              <FileText size={16} />
            </span>
            <h2 className={styles.scheduleTitle}>Salary schedule</h2>
          </div>
          <span className={styles.readyBadge}>{detail.readiness}</span>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Base salary</th>
                <th>Bonuses</th>
                <th>Deductions</th>
                <th>Net pay</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {detail.schedule.map((row) => (
                <tr key={row.id}>
                  <td>
                    <div className={styles.employeeCell}>
                      <span
                        className={styles.avatar}
                        style={{ background: row.avatarColor }}
                      >
                        {row.initials}
                      </span>
                      <span>
                        <span className={styles.employeeName}>{row.name}</span>
                        <span className={styles.employeeRole}>{row.role}</span>
                      </span>
                    </div>
                  </td>
                  <td>{row.baseSalary}</td>
                  <td>
                    {row.bonus ? (
                      <span className={styles.bonus}>+{row.bonus}</span>
                    ) : (
                      <span className={styles.empty}>—</span>
                    )}
                  </td>
                  <td>
                    {row.deduction ? (
                      <span className={styles.deduction}>-{row.deduction}</span>
                    ) : (
                      <span className={styles.empty}>—</span>
                    )}
                  </td>
                  <td className={styles.netPay}>{row.netPay}</td>
                  <td>
                    <button
                      type="button"
                      className={styles.recordButton}
                      onClick={() =>
                        showToast(`Record salary for ${row.name}`, "info")
                      }
                    >
                      <Pencil size={13} />
                      Record
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td>Totals</td>
                <td>{detail.totals.base}</td>
                <td className={styles.bonus}>+{detail.totals.bonuses}</td>
                <td className={styles.deduction}>-{detail.totals.deductions}</td>
                <td className={styles.netPay}>{detail.totals.net}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </section>
    </div>
  );
}
