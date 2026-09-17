"use client";

import { FormEvent, useState } from "react";
import { NotificationsLink, ProfileLink } from "@/components/layout/PageLinks";
import { employeeProfile } from "@/data/employeeHome";
import { useAsyncData } from "@/hooks/useAsyncData";
import { usePageActions } from "@/hooks/usePageActions";
import { notificationsApi } from "@/lib/api";
import styles from "./EmployeeUtilityPages.module.css";

export function EmployeeSettingsPage() {
  const { runAction } = usePageActions();
  const { loading, error, refetch } = useAsyncData(
    () => notificationsApi.preferences.get(),
    [],
  );
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [taskReminders, setTaskReminders] = useState(true);

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await runAction(
      "Save settings",
      async () => {
        await notificationsApi.preferences.update({
          email: emailAlerts,
          tasks: taskReminders,
        });
        refetch();
      },
      "Preferences saved",
    );
  }

  return (
    <div className={styles.page}>
      {loading ? <p className={styles.hint}>Loading settings…</p> : null}
      {error ? (
        <p className={styles.hint} role="alert">
          {error}
        </p>
      ) : null}
      <div className={styles.topBar}>
        <p className={styles.dateLabel}>Wednesday, August 12</p>
        <div className={styles.topActions}>
          <NotificationsLink className={styles.iconButton} />
          <ProfileLink className={styles.avatarChip}>
            {employeeProfile.initials}
          </ProfileLink>
        </div>
      </div>

      <p className={styles.eyebrow}>Account settings</p>
      <h1 className={styles.title}>Workspace preferences</h1>
      <p className={styles.subtitle}>
        These alerts belong to your staff account. Organization settings stay
        with HR and Super Admin.
      </p>

      <form className={styles.form} onSubmit={(event) => void handleSave(event)}>
        <label className={styles.checkRow}>
          <input
            type="checkbox"
            checked={emailAlerts}
            onChange={(event) => setEmailAlerts(event.target.checked)}
          />
          Email me about leave and expense updates
        </label>
        <label className={styles.checkRow}>
          <input
            type="checkbox"
            checked={taskReminders}
            onChange={(event) => setTaskReminders(event.target.checked)}
          />
          Remind me about assigned tasks
        </label>
        <button type="submit" className={styles.saveButton}>
          Save preferences
        </button>
      </form>
    </div>
  );
}
