"use client";

import { PageDateLabel } from "@/components/layout/PageDateLabel";
import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { Bell, Search } from "lucide-react";
import { AccountantProfileChip } from "@/components/accountant/AccountantProfileChip";
import { AccountantStatusLine } from "@/components/accountant/AccountantStatusLine";
import { useAsyncData } from "@/hooks/useAsyncData";
import { usePageActions } from "@/hooks/usePageActions";
import { accountantApi } from "@/lib/api";
import { mapAccountantSettings } from "@/lib/api/accountantMappers";
import styles from "./AccountantUtilityPages.module.css";

const fallbackSettings = {
  emailAlerts: true,
  payrollReminders: true,
  digest: "weekly",
};

export function AccountantSettingsPage() {
  const { runAction } = usePageActions();
  const { data, loading, error, refetch } = useAsyncData(
    () => accountantApi.settings.get(),
    [],
  );
  const mapped = mapAccountantSettings(data, fallbackSettings);
  const [emailAlerts, setEmailAlerts] = useState(mapped.emailAlerts);
  const [payrollReminders, setPayrollReminders] = useState(mapped.payrollReminders);
  const [digest, setDigest] = useState(mapped.digest);

  useEffect(() => {
    setEmailAlerts(mapped.emailAlerts);
    setPayrollReminders(mapped.payrollReminders);
    setDigest(mapped.digest);
  }, [mapped.digest, mapped.emailAlerts, mapped.payrollReminders]);

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await runAction(
      "Save settings",
      async () => {
        await accountantApi.settings.patch({
          emailAlerts,
          payrollReminders,
          digest,
        });
        refetch();
      },
      "Preferences saved",
    );
  }

  return (
    <div className={styles.page}>
      <AccountantStatusLine loading={loading} error={error} resource="settings" />
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

      <p className={styles.eyebrow}>Accountant</p>
      <h1 className={styles.title}>Settings</h1>
      <p className={styles.subtitle}>
        Personal accountant workspace preferences only. Organization and role
        settings are managed elsewhere. First login uses your first name —{" "}
        <Link href="/change-password">change that password here</Link>.
      </p>

      <form className={styles.form} onSubmit={(event) => void handleSave(event)}>
        <label className={styles.checkRow}>
          <input
            type="checkbox"
            checked={emailAlerts}
            onChange={(event) => setEmailAlerts(event.target.checked)}
          />
          Email alerts for finance queues
        </label>
        <label className={styles.checkRow}>
          <input
            type="checkbox"
            checked={payrollReminders}
            onChange={(event) => setPayrollReminders(event.target.checked)}
          />
          Payroll period reminders
        </label>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Digest frequency</span>
          <select
            className={styles.fieldSelect}
            value={digest}
            onChange={(event) => setDigest(event.target.value)}
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="off">Off</option>
          </select>
        </label>
        <button type="submit" className={styles.saveButton}>
          Save preferences
        </button>
      </form>
    </div>
  );
}
