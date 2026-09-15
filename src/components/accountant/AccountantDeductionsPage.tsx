"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Bell, MinusCircle, Plus, Search, Trash2 } from "lucide-react";
import { AccountantStatusLine } from "@/components/accountant/AccountantStatusLine";
import {
  RecordDeductionModal,
  type RecordDeductionValues,
} from "@/components/accountant/RecordDeductionModal";
import { useAsyncData } from "@/hooks/useAsyncData";
import { usePageActions } from "@/hooks/usePageActions";
import { accountantApi } from "@/lib/api";
import {
  mapAccountantDeduction,
  unwrapAccountantList,
  withFallback,
} from "@/lib/api/accountantMappers";
import {
  accountantDeductionEmployees,
  accountantDeductions as fallbackDeductions,
  accountantDeductionsPeriod,
  formatNaira,
  type AccountantDeduction,
} from "@/data/accountantDeductions";
import styles from "./AccountantDeductionsPage.module.css";

export function AccountantDeductionsPage() {
  const [recordOpen, setRecordOpen] = useState(false);
  const { runAction } = usePageActions();
  const { data, loading, error, refetch } = useAsyncData(
    () => accountantApi.payroll.deductions.list(),
    [],
  );

  const deductions = useMemo(
    () =>
      withFallback(
        unwrapAccountantList(data).map(mapAccountantDeduction),
        fallbackDeductions,
      ),
    [data],
  );

  const total = useMemo(
    () => deductions.reduce((sum, item) => sum + item.amount, 0),
    [deductions],
  );

  async function handleRecordDeduction(values: RecordDeductionValues) {
    const employee = accountantDeductionEmployees.find(
      (item) => item.id === values.employeeId,
    );
    const amount = Number(values.amount);
    if (!employee || !Number.isFinite(amount) || amount <= 0) {
      throw new Error("Enter a valid employee and amount");
    }

    await runAction(
      "Record deduction",
      async () => {
        await accountantApi.payroll.deductions.create({
          employeeId: employee.id,
          employeeName: employee.name,
          type: values.type,
          amount,
          note: values.note || "Deduction recorded",
        });
        refetch();
      },
      `Deduction recorded for ${employee.name}`,
    );
  }

  async function handleDelete(deduction: AccountantDeduction) {
    await runAction(
      "Delete deduction",
      async () => {
        await accountantApi.payroll.deductions.patch(deduction.id, {
          status: "removed",
          amount: 0,
        });
        refetch();
      },
      `Removed deduction for ${deduction.name}`,
    );
  }

  return (
    <div className={styles.page}>
      <AccountantStatusLine loading={loading} error={error} resource="deductions" />
      <div className={styles.topBar}>
        <p className={styles.dateLabel}>Tuesday, August 11</p>
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
          <p className={styles.eyebrow}>Accountant · Deductions</p>
          <h1 className={styles.title}>Deductions</h1>
          <p className={styles.subtitle}>
            Record statutory and other deductions for the{" "}
            {accountantDeductionsPeriod} payroll run.
          </p>
        </div>
        <button
          type="button"
          className={styles.recordButton}
          onClick={() => setRecordOpen(true)}
        >
          <Plus size={16} />
          Record deduction
        </button>
      </div>

      <section className={styles.totalCard}>
        <div className={styles.totalLead}>
          <span
            className={`${styles.totalIcon} ${styles.totalIconDanger}`}
            aria-hidden
          >
            <MinusCircle size={18} />
          </span>
          <p className={styles.totalLabel}>
            Total deductions · {accountantDeductionsPeriod}
          </p>
        </div>
        <p className={styles.totalValue}>{formatNaira(total)}</p>
      </section>

      <div className={styles.list}>
        {deductions.length === 0 ? (
          <p className={styles.empty}>
            No deductions recorded for this payroll run.
          </p>
        ) : (
          deductions.map((deduction) => (
            <article key={deduction.id} className={styles.bonusCard}>
              <div className={styles.bonusMain}>
                <span
                  className={styles.employeeAvatar}
                  style={{ background: deduction.avatarColor }}
                >
                  {deduction.initials}
                </span>
                <div className={styles.bonusBody}>
                  <div className={styles.bonusTop}>
                    <h2 className={styles.bonusName}>{deduction.name}</h2>
                    <span className={styles.typeBadge}>{deduction.type}</span>
                  </div>
                  <p className={styles.bonusMeta}>
                    {deduction.department}
                    {deduction.note ? ` · ${deduction.note}` : ""} ·{" "}
                    {deduction.date}
                  </p>
                </div>
              </div>
              <div className={styles.bonusAside}>
                <p className={styles.deductionAmount}>
                  -{deduction.amountLabel}
                </p>
                <button
                  type="button"
                  className={styles.deleteButton}
                  aria-label={`Delete deduction for ${deduction.name}`}
                  onClick={() => void handleDelete(deduction)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </article>
          ))
        )}
      </div>

      <RecordDeductionModal
        open={recordOpen}
        onClose={() => setRecordOpen(false)}
        onSubmit={handleRecordDeduction}
      />
    </div>
  );
}
