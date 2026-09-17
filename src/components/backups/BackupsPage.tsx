"use client";

import { PageDateLabel } from "@/components/layout/PageDateLabel";
import { useCallback, useMemo, useState } from "react";
import {
  Database,
  HardDrive,
  Pencil,
  RotateCcw,
  Search,
} from "lucide-react";
import { NotificationsLink, ProfileLink } from "@/components/layout/PageLinks";
import { SimpleModal, type ModalField } from "@/components/ui/SimpleModal";
import { useAsyncData } from "@/hooks/useAsyncData";
import { usePageActions } from "@/hooks/usePageActions";
import { superAdminApi, unwrapRecord } from "@/lib/api";
import { listFrom, mapBackupSnapshot, str } from "@/lib/api/mappers";
import styles from "./BackupsPage.module.css";

type PolicyRow = {
  id: string;
  label: string;
  description: string;
  value: string;
};

export function BackupsPage() {
  const { runAction } = usePageActions();
  const [editSetting, setEditSetting] = useState<PolicyRow | null>(null);

  const { data: backupsData, loading, error, refetch } = useAsyncData(
    () => superAdminApi.backups.list(),
    [],
  );

  const { data: settingsData, refetch: refetchSettings } = useAsyncData(
    () => superAdminApi.backups.settings.get(),
    [],
  );

  const { data: healthData } = useAsyncData(
    () => superAdminApi.backups.health(),
    [],
  );

  const snapshots = useMemo(
    () =>
      listFrom(backupsData ?? undefined).map((record) =>
        mapBackupSnapshot(record),
      ),
    [backupsData],
  );

  const stats = useMemo(() => {
    const health = unwrapRecord(healthData);
    return [
      {
        id: "last",
        label: "Last backup",
        value: str(health.lastBackupAt ?? health.lastBackup, "—"),
        badge: str(health.lastBackupStatus ?? "Recent"),
      },
      {
        id: "total",
        label: "Total snapshots",
        value: str(health.total ?? snapshots.length, String(snapshots.length)),
        badge: str(health.totalBadge, "Live"),
      },
      {
        id: "storage",
        label: "Storage used",
        value: str(health.storageUsed ?? health.storage, "—"),
        badge: str(health.storageBadge, "Live"),
      },
    ];
  }, [healthData, snapshots.length]);

  const policySettings = useMemo((): PolicyRow[] => {
    const settings = unwrapRecord(settingsData);
    return [
      {
        id: "frequency",
        label: "Backup frequency",
        description: "How often automatic snapshots run.",
        value: str(settings.frequency ?? settings.schedule, "—"),
      },
      {
        id: "retention",
        label: "Retention period",
        description: "How long snapshots are kept before deletion.",
        value: str(settings.retention ?? settings.retentionDays, "—"),
      },
      {
        id: "storage-location",
        label: "Storage location",
        description: "",
        value: str(settings.location ?? settings.storageLocation, "—"),
      },
    ];
  }, [settingsData]);

  const runBackup = useCallback(async () => {
    await runAction("Run backup", async () => {
      await superAdminApi.backups.create();
      refetch();
    });
  }, [refetch, runAction]);

  const restoreBackup = useCallback(
    async (id: string, title: string) => {
      await runAction(`Restore ${title}`, async () => {
        await superAdminApi.backups.restore(id);
        refetch();
      });
    },
    [refetch, runAction],
  );

  const editFields: ModalField[] = editSetting
    ? [
        {
          name: "value",
          label: editSetting.label,
          defaultValue: editSetting.value,
          required: true,
        },
      ]
    : [];

  async function savePolicySetting(values: Record<string, string>) {
    if (!editSetting) return;
    const key =
      editSetting.id === "frequency"
        ? "frequency"
        : editSetting.id === "retention"
          ? "retention"
          : "location";
    await runAction(`Update ${editSetting.label}`, async () => {
      await superAdminApi.backups.settings.update({ [key]: values.value });
      await refetchSettings();
      refetch();
    });
  }

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <PageDateLabel className={styles.dateLabel} />
        <div className={styles.topActions}>
          <label className={styles.topSearch}>
            <Search size={15} className={styles.topSearchIcon} />
            <input
              placeholder="Search"
              className={styles.topSearchInput}
              readOnly
              aria-label="Search"
            />
            <kbd className={styles.searchShortcut}>⌘K</kbd>
          </label>
          <NotificationsLink className={styles.iconButton} />
          <ProfileLink className={styles.avatarChip}>MC</ProfileLink>
        </div>
      </div>

      <div className={styles.header}>
        <div className={styles.headerCopy}>
          <p className={styles.eyebrow}>System · Backups</p>
          <h1 className={styles.title}>Backups & restore</h1>
          <p className={styles.subtitle}>
            Manage automatic snapshots, run manual backups and restore data when
            needed.
          </p>
          {loading ? <p className={styles.subtitle}>Loading backups…</p> : null}
          {error ? (
            <p className={styles.subtitle} role="alert">
            {error}
            </p>
          ) : null}
        </div>
        <button type="button" className={styles.runButton} onClick={() => void runBackup()}>
          <HardDrive size={16} strokeWidth={2.25} />
          Run backup now
        </button>
      </div>

      <div className={styles.statsRow}>
        {stats.map((stat) => (
          <article key={stat.id} className={styles.statCard}>
            <p className={styles.statLabel}>{stat.label}</p>
            <p className={styles.statValue}>{stat.value}</p>
            <span className={styles.statBadge}>{stat.badge}</span>
          </article>
        ))}
      </div>

      <div className={styles.sections}>
        <section className={styles.card}>
          <div className={styles.cardHead}>
            <h2 className={styles.cardTitle}>Backup policy</h2>
            <p className={styles.cardDescription}>
              How often snapshots are taken and how long they are kept.
            </p>
          </div>

          <div className={styles.settingList}>
            {policySettings.map((setting) => (
              <div key={setting.id} className={styles.settingRow}>
                <div className={styles.settingCopy}>
                  <h3 className={styles.settingLabel}>{setting.label}</h3>
                  {setting.description ? (
                    <p className={styles.settingDescription}>
                      {setting.description}
                    </p>
                  ) : null}
                </div>
                <div className={styles.settingMeta}>
                  <span className={styles.settingValue}>{setting.value}</span>
                  <button
                    type="button"
                    className={styles.editButton}
                    onClick={() => setEditSetting(setting)}
                  >
                    <Pencil size={13} strokeWidth={2.25} />
                    Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.card}>
          <div className={styles.cardHead}>
            <div className={styles.cardTitleRow}>
              <span className={styles.cardTitleIcon} aria-hidden>
                <Database size={18} strokeWidth={2} />
              </span>
              <h2 className={styles.cardTitle}>Available snapshots</h2>
            </div>
          </div>

          <div className={styles.snapshotList}>
            {snapshots.map((snapshot) => (
              <div key={snapshot.id} className={styles.snapshotRow}>
                <div className={styles.snapshotMain}>
                  <span className={styles.snapshotIcon} aria-hidden>
                    <HardDrive size={18} strokeWidth={2} />
                  </span>
                  <div className={styles.snapshotCopy}>
                    <div className={styles.snapshotTitleRow}>
                      <h3 className={styles.snapshotTitle}>{snapshot.title}</h3>
                      <span className={styles.statusBadge}>
                        <span className={styles.statusDot} aria-hidden />
                        {snapshot.status}
                      </span>
                    </div>
                    <p className={styles.snapshotMeta}>
                      {snapshot.kind} · {snapshot.size} · {snapshot.takenAt}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className={styles.restoreButton}
                  onClick={() => void restoreBackup(snapshot.id, snapshot.title)}
                >
                  <RotateCcw size={14} strokeWidth={2.25} />
                  Restore
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>

      <SimpleModal
        open={Boolean(editSetting)}
        title={editSetting ? `Edit ${editSetting.label}` : "Edit setting"}
        fields={editFields}
        submitLabel="Save"
        onClose={() => setEditSetting(null)}
        onSubmit={savePolicySetting}
      />
    </div>
  );
}
