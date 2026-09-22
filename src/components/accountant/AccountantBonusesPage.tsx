"use client";

import { PageDateLabel } from "@/components/layout/PageDateLabel";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Bell, Gift, Plus, Search } from "lucide-react";
import { AccountantStatusLine } from "@/components/accountant/AccountantStatusLine";
import {
  RecordBonusModal,
  type RecordBonusValues,
} from "@/components/accountant/RecordBonusModal";
import { useAsyncData } from "@/hooks/useAsyncData";
import { usePageActions } from "@/hooks/usePageActions";
import { accountantApi, accountantSettled } from "@/lib/api";
import {
  mapAccountantBonus,
  unwrapAccountantList,
} from "@/lib/api/accountantMappers";
import {
  accountantBonusEmployees,
  accountantBonusesPeriod,
  formatNaira,
} from "@/data/accountantBonuses";
import styles from "./AccountantBonusesPage.module.css";

export function AccountantBonusesPage() {
  const [recordOpen, setRecordOpen] = useState(false);
  const { runAction } = usePageActions();
  const { data, loading, error, refetch } = useAsyncData(async () => {
    const [payments, register, dashboard] = await Promise.all([
      accountantApi.payroll.payments(),
      accountantSettled(accountantApi.payments.list({ category: "bonus" })),
      accountantSettled(accountantApi.payroll.dashboard()),
    ]);
    return { payments, register, dashboard };
  }, []);

  const bonuses = useMemo(() => {
    const mapped = [
      ...unwrapAccountantList(data?.payments),
      ...unwrapAccountantList(data?.register),
    ]
      .filter((record) => {
        const haystack = `${record.type ?? ""} ${record.category ?? ""} ${record.bonusType ?? ""} ${record.note ?? ""}`.toLowerCase();
        return (
          haystack.includes("bonus") ||
          Number(record.bonus ?? record.bonusAmount ?? 0) > 0
        );
      })
      .map(mapAccountantBonus);
    const seen = new Set<string>();
    return mapped.filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  }, [data]);

  const total = useMemo(
    () => bonuses.reduce((sum, bonus) => sum + bonus.amount, 0),
    [bonuses],
  );

  async function handleRecordBonus(values: RecordBonusValues) {
    const employee = accountantBonusEmployees.find(
      (item) => item.id === values.employeeId,
    );
    const amount = Number(values.amount);
    if (!employee || !Number.isFinite(amount) || amount <= 0) {
      throw new Error("Enter a valid employee and amount");
    }

    await runAction(
      "Record bonus",
      async () => {
        await accountantApi.payments.create({
          category: "Bonus",
          type: values.type,
          employeeId: employee.id,
          employeeName: employee.name,
          payee: employee.name,
          amount,
          note: values.note || "Bonus recorded",
        });
        refetch();
      },
      `Bonus recorded for ${employee.name}`,
    );
  }

  return (
    <div className={styles.page}>
      <AccountantStatusLine loading={loading} error={error} resource="bonuses" />
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
          <p className={styles.eyebrow}>Accountant · Bonuses</p>
          <h1 className={styles.title}>Bonuses</h1>
          <p className={styles.subtitle}>
            Record bonuses for the {accountantBonusesPeriod} payroll run. Bonuses
            feed directly into the payroll schedule.
          </p>
        </div>
        <button
          type="button"
          className={styles.recordButton}
          onClick={() => setRecordOpen(true)}
        >
          <Plus size={16} />
          Record bonus
        </button>
      </div>

      <section className={styles.totalCard}>
        <div className={styles.totalLead}>
          <span className={styles.totalIcon} aria-hidden>
            <Gift size={18} />
          </span>
          <p className={styles.totalLabel}>
            Total bonuses · {accountantBonusesPeriod}
          </p>
        </div>
        <p className={styles.totalValue}>{formatNaira(total)}</p>
      </section>

      <div className={styles.list}>
        {bonuses.length === 0 ? (
          <p className={styles.empty}>No bonuses recorded for this payroll run.</p>
        ) : (
          bonuses.map((bonus) => (
            <article key={bonus.id} className={styles.bonusCard}>
              <div className={styles.bonusMain}>
                <span
                  className={styles.employeeAvatar}
                  style={{ background: bonus.avatarColor }}
                >
                  {bonus.initials}
                </span>
                <div className={styles.bonusBody}>
                  <div className={styles.bonusTop}>
                    <h2 className={styles.bonusName}>{bonus.name}</h2>
                    <span className={styles.typeBadge}>{bonus.type}</span>
                  </div>
                  <p className={styles.bonusMeta}>
                    {bonus.department} · {bonus.note} · {bonus.date}
                  </p>
                </div>
              </div>
              <div className={styles.bonusAside}>
                <p className={styles.bonusAmount}>+{bonus.amountLabel}</p>
              </div>
            </article>
          ))
        )}
      </div>

      <RecordBonusModal
        open={recordOpen}
        onClose={() => setRecordOpen(false)}
        onSubmit={handleRecordBonus}
      />
    </div>
  );
}
