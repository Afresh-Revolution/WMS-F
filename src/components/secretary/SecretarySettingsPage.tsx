"use client";

import { PageDateLabel } from "@/components/layout/PageDateLabel";
import { FormEvent, useState } from "react";
import { NotificationsLink, ProfileLink } from "@/components/layout/PageLinks";
import { usePageActions } from "@/hooks/usePageActions";
import { notificationsApi } from "@/lib/api";
import styles from "@/components/employee/EmployeeUtilityPages.module.css";

export function SecretarySettingsPage() {
  const { runAction } = usePageActions();
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [meetingReminders, setMeetingReminders] = useState(true);

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await runAction(
      "Save settings",
      async () => {
        await notificationsApi.preferences.update({
          email: emailAlerts,
          meetings: meetingReminders,
        });
      },
      "Preferences saved",
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <PageDateLabel className={styles.dateLabel} />
        <div className={styles.topActions}>
          <NotificationsLink className={styles.iconButton} />
          <ProfileLink className={styles.avatarChip}>GB</ProfileLink>
        </div>
      </div>

      <p className={styles.eyebrow}>Settings</p>
      <h1 className={styles.title}>Workspace preferences</h1>
      <p className={styles.subtitle}>
        Notification preferences for the secretary workspace. Organization
        settings stay with Super Admin.
      </p>

      <form className={styles.form} onSubmit={(event) => void handleSave(event)}>
        <label className={styles.checkRow}>
          <input
            type="checkbox"
            checked={emailAlerts}
            onChange={(event) => setEmailAlerts(event.target.checked)}
          />
          Email me about mailbox and request updates
        </label>
        <label className={styles.checkRow}>
          <input
            type="checkbox"
            checked={meetingReminders}
            onChange={(event) => setMeetingReminders(event.target.checked)}
          />
          Remind me about meetings and calendar items
        </label>
        <button type="submit" className={styles.saveButton}>
          Save preferences
        </button>
      </form>
    </div>
  );
}
