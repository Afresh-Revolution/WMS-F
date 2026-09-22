"use client";

import { PageDateLabel } from "@/components/layout/PageDateLabel";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowUpRight,
  Bell,
  CalendarPlus,
  Search,
  Wallet,
} from "lucide-react";
import { AccountantStatusLine } from "@/components/accountant/AccountantStatusLine";
import { CreatePayrollPeriodModal } from "@/components/accountant/CreatePayrollPeriodModal";
import { useAsyncData } from "@/hooks/useAsyncData";
import { usePageActions } from "@/hooks/usePageActions";
import { accountantApi, accountantSettled } from "@/lib/api";
import {
  mapAccountantPayrollPeriod,
  unwrapAccountantList,
} from "@/lib/api/accountantMappers";
import {
  type AccountantPayrollStatus,
} from "@/data/accountantPayroll";
import styles from "./AccountantPayrollPage.module.css";

const statusClass: Record<AccountantPayrollStatus, string> = {
  "In Preparation": styles.statusPreparation,
  Submitted: styles.statusSubmitted,
  Paid: styles.statusPaid,
};

export function AccountantPayrollPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const { runAction } = usePageActions();
  const { data, loading, error, refetch } = useAsyncData(async () => {
    const [runs, periods, payroll] = await Promise.all([
      accountantApi.payroll.runs.list(),
      accountantSettled(accountantApi.payroll.periods()),
      accountantSettled(accountantApi.payroll.list()),
    ]);
    void accountantSettled(accountantApi.payroll.dashboard());
    return { periods, runs, payroll };
  }, []);

  const periods = useMemo(() => {
    const mapped = [
      ...unwrapAccountantList(data?.runs),
      ...unwrapAccountantList(data?.payroll),
      ...unwrapAccountantList(data?.periods),
    ].map(mapAccountantPayrollPeriod);
    const seen = new Set<string>();
    return mapped.filter((period) => {
      if (seen.has(period.id)) return false;
      seen.add(period.id);
      return true;
    });
  }, [data]);

  async function handleCreatePeriod(values: { month: string; year: string }) {
    await runAction(
      "Create payroll period",
      async () => {
        await accountantApi.payroll.createPeriod({
          month: values.month,
          year: values.year,
          period: `${values.month} ${values.year}`,
        });
        refetch();
      },
      `${values.month} ${values.year} payroll period created`,
    );
  }

  return (
    <div className={styles.page}>
      <AccountantStatusLine loading={loading} error={error} resource="payroll" />
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
          <p className={styles.eyebrow}>Accountant · Payroll</p>
          <h1 className={styles.title}>Payroll periods</h1>
          <p className={styles.subtitle}>
            Prepare salary schedules and submit each run to Admin for approval.
            You prepare payroll — you cannot approve your own run.
          </p>
        </div>
        <button
          type="button"
          className={styles.createButton}
          onClick={() => setCreateOpen(true)}
        >
          <CalendarPlus size={16} />
          Create payroll period
        </button>
      </div>

      <div className={styles.list}>
        {periods.length === 0 ? (
          <p className={styles.empty}>No payroll periods or runs yet.</p>
        ) : (
          periods.map((period) => (
          <Link
            key={period.id}
            href={`/accountant/payroll/${period.id}`}
            className={styles.periodCard}
          >
            <span className={styles.periodIcon} aria-hidden>
              <Wallet size={18} />
            </span>
            <span className={styles.periodBody}>
              <span className={styles.periodTop}>
                <span className={styles.periodTitle}>{period.title}</span>
                <span className={`${styles.status} ${statusClass[period.status]}`}>
                  {period.status}
                </span>
              </span>
              <span className={styles.periodMeta}>
                {period.staff} staff · Net {period.net} · {period.readiness}
              </span>
            </span>
            <span className={styles.periodArrow} aria-hidden>
              <ArrowUpRight size={18} />
            </span>
          </Link>
          ))
        )}
      </div>

      <CreatePayrollPeriodModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreatePeriod}
      />
    </div>
  );
}
