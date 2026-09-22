"use client";

import { PageDateLabel } from "@/components/layout/PageDateLabel";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Bell, Gift, Plus, Search, Trash2 } from "lucide-react";
import { AccountantProfileChip } from "@/components/accountant/AccountantProfileChip";
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
  formatNaira,
  type AccountantBonus,
  type AccountantBonusType,
} from "@/data/accountantBonuses";
import styles from "./AccountantBonusesPage.module.css";

function formatBonusDate(date = new Date()) {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function AccountantBonusesPage() {
  const [recordOpen, setRecordOpen] = useState(false);
  const [localBonuses, setLocalBonuses] = useState<AccountantBonus[]>([]);
  const { runAction } = usePageActions();
  const { data, loading, error, refetch } = useAsyncData(async () => {
    const [payments, dashboard] = await Promise.all([
      accountantApi.payroll.payments(),
      accountantSettled(accountantApi.payroll.dashboard()),
    ]);
    return { payments, dashboard };
  }, []);

  const bonuses = useMemo(() => {
    const mapped = unwrapAccountantList(data?.payments)
      .filter((record) => {
        const haystack = `${record.type ?? ""} ${record.category ?? ""} ${record.bonusType ?? ""}`.toLowerCase();
        return haystack.includes("bonus") || Number(record.bonus ?? record.bonusAmount ?? 0) > 0;
      })
      .map(mapAccountantBonus);
    const merged = [...localBonuses, ...mapped];
    const seen = new Set<string>();
    return merged.filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  }, [data, localBonuses]);

  const total = useMemo(
    () => bonuses.reduce((sum, bonus) => sum + bonus.amount, 0),
    [bonuses],
  );

  async function handleRecordBonus(values: RecordBonusValues) {
    const employee = {
      id: values.employeeId,
      name: values.employeeName,
      department: values.department,
      initials: values.initials,
      avatarColor: values.avatarColor,
    };
    const amount = Number(values.amount);
    if (!employee.id || !employee.name || !Number.isFinite(amount) || amount <= 0) {
      throw new Error("Enter a valid employee and amount");
    }

    await runAction(
      "Record bonus",
      async () => {
        const next: AccountantBonus = {
          id: `bonus-${Date.now()}`,
          employeeId: employee.id,
          name: employee.name,
          initials: employee.initials,
          avatarColor: employee.avatarColor,
          type: values.type as AccountantBonusType,
          department: employee.department,
          note: values.note || "Bonus recorded",
          date: formatBonusDate(),
          amount,
          amountLabel: formatNaira(amount),
        };
        setLocalBonuses((current) => [next, ...current]);
        refetch();
      },
      `Bonus recorded for ${employee.name}`,
    );
  }

  async function handleDelete(bonus: AccountantBonus) {
    await runAction(
      "Delete bonus",
      async () => {
        setLocalBonuses((current) => current.filter((item) => item.id !== bonus.id));
      },
      `Removed bonus for ${bonus.name}`,
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
          <AccountantProfileChip className={styles.avatarChip} />
        </div>
      </div>

      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Accountant · Bonuses</p>
          <h1 className={styles.title}>Bonuses</h1>
          <p className={styles.subtitle}>
            Record bonuses for the current payroll run. Bonuses feed directly
            into the payroll schedule.
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
            Total bonuses
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
                <button
                  type="button"
                  className={styles.deleteButton}
                  aria-label={`Delete bonus for ${bonus.name}`}
                  onClick={() => void handleDelete(bonus)}
                >
                  <Trash2 size={16} />
                </button>
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
