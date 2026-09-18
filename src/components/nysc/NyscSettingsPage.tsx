"use client";

import { PageDateLabel } from "@/components/layout/PageDateLabel";
import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { Bell, Search } from "lucide-react";
import { AccountantStatusLine } from "@/components/accountant/AccountantStatusLine";
import { useAsyncData } from "@/hooks/useAsyncData";
import { useInternAccount } from "@/hooks/useInternAccount";
import { usePageActions } from "@/hooks/usePageActions";
import { internApi } from "@/lib/api";
import { mapInternSettings } from "@/lib/api/internMappers";
import styles from "./NyscUtilityPages.module.css";

const fallbackSettings = {
  emailNotifications: true,
  theme: "light",
  profileName: "",
};

export function NyscSettingsPage() {
  const { account } = useInternAccount("chidi");
  const { runAction } = usePageActions();
  const { data, loading, error, refetch } = useAsyncData(
    () => internApi.settings.get(),
    [],
  );
  const mapped = mapInternSettings(data, {
    ...fallbackSettings,
    profileName: account.name,
  });
  const [emailNotifications, setEmailNotifications] = useState(
    mapped.emailNotifications,
  );
  const [theme, setTheme] = useState(mapped.theme);

  useEffect(() => {
    setEmailNotifications(mapped.emailNotifications);
    setTheme(mapped.theme);
  }, [mapped.emailNotifications, mapped.theme]);

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await runAction(
      "Save settings",
      async () => {
        await internApi.settings.patch({
          preferences: {
            theme,
            emailNotifications,
          },
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
            href="/nysc/notifications"
            className={styles.iconButton}
            aria-label="Notifications"
          >
            <span className={styles.notifDot} aria-hidden />
            <Bell size={16} />
          </Link>
          <Link
            href="/nysc/profile"
            className={styles.avatarChip}
            aria-label="Profile"
          >
            {account.initials}
          </Link>
        </div>
      </div>

      <p className={styles.eyebrow}>Settings</p>
      <h1 className={styles.title}>Workspace preferences</h1>
      <p className={styles.subtitle}>
        These preferences belong to your intern or NYSC profile. Organization
        settings stay with HR and Super Admin.
      </p>

      <form className={styles.form} onSubmit={(event) => void handleSave(event)}>
        <label className={styles.checkRow}>
          <input
            type="checkbox"
            checked={emailNotifications}
            onChange={(event) => setEmailNotifications(event.target.checked)}
          />
          Email notifications
        </label>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Theme</span>
          <select
            className={styles.fieldSelect}
            value={theme}
            onChange={(event) => setTheme(event.target.value)}
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </label>
        <button type="submit" className={styles.saveButton}>
          Save preferences
        </button>
      </form>
    </div>
  );
}
