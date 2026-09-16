"use client";

import { useMemo, useState } from "react";
import { useAsyncData } from "@/hooks/useAsyncData";
import { usePageActions } from "@/hooks/usePageActions";
import { superAdminApi, unwrapRecord } from "@/lib/api";
import { bool, str } from "@/lib/api/mappers";
import { SimpleModal } from "@/components/ui/SimpleModal";
import styles from "./SettingsPage.module.css";

export function SettingsPage() {
  const { runAction } = usePageActions();
  const [editKey, setEditKey] = useState<string | null>(null);

  const { data: settingsData, loading, error, refetch } = useAsyncData(
    () => superAdminApi.settings.get(),
    [],
  );

  const { data: systemSettings, refetch: refetchSystem } = useAsyncData(
    () => superAdminApi.systemManagement.settings.list(),
    [],
  );

  const { data: statusData, refetch: refetchStatus } = useAsyncData(
    () => superAdminApi.status(),
    [],
  );

  const settings = useMemo(() => {
    const system = unwrapRecord(settingsData);
    const moduleSettings = unwrapRecord(systemSettings);
    const nested = unwrapRecord(system.data ?? moduleSettings.data);
    return { ...moduleSettings, ...system, ...nested };
  }, [settingsData, systemSettings]);

  const entries = Object.entries(settings).filter(
    ([key, value]) =>
      !["data", "meta", "success", "message"].includes(key) &&
      (typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "boolean"),
  );

  const maintenanceOn = bool(
    unwrapRecord(statusData).maintenance ??
      unwrapRecord(statusData).enabled ??
      settings.maintenance,
  );

  async function saveSetting(values: Record<string, string>) {
    if (!editKey) return;
    await runAction(`Update ${editKey}`, async () => {
      const payload = { [editKey]: values.value };
      await superAdminApi.settings.update(payload);
      await superAdminApi.systemManagement.settings.update(payload).catch(() => undefined);
      refetch();
      refetchSystem();
    });
  }

  async function toggleMaintenance() {
    await runAction(
      maintenanceOn ? "Disable maintenance" : "Enable maintenance",
      async () => {
        if (maintenanceOn) {
          await superAdminApi.systemManagement.maintenance.disable();
        } else {
          await superAdminApi.systemManagement.maintenance.enable();
        }
        refetchStatus();
        refetch();
      },
    );
  }

  return (
    <div className={styles.page}>
      <p className={styles.eyebrow}>Account</p>
      <h1 className={styles.title}>Settings</h1>
      <p className={styles.subtitle}>
        Configure workspace defaults and platform maintenance.
      </p>
      {loading ? <p>Loading settings…</p> : null}
      {error ? <p role="alert">{error}</p> : null}

      <div className={styles.list}>
        <div className={styles.row}>
          <span className={styles.label}>Maintenance mode</span>
          <button type="button" className={styles.value} onClick={() => void toggleMaintenance()}>
            {maintenanceOn ? "On — click to disable" : "Off — click to enable"}
          </button>
        </div>
        {entries.length === 0 ? (
          <p className={styles.empty}>No settings returned from the API yet.</p>
        ) : (
          entries.map(([key, value]) => (
            <button
              key={key}
              type="button"
              className={styles.row}
              onClick={() => setEditKey(key)}
            >
              <span className={styles.label}>{key}</span>
              <span className={styles.value}>{str(value)}</span>
            </button>
          ))
        )}
      </div>

      <SimpleModal
        open={Boolean(editKey)}
        title={editKey ? `Edit ${editKey}` : "Edit setting"}
        fields={[
          {
            name: "value",
            label: editKey ?? "Value",
            defaultValue: editKey ? str(settings[editKey]) : "",
            required: true,
          },
        ]}
        submitLabel="Save"
        onClose={() => setEditKey(null)}
        onSubmit={saveSetting}
      />
    </div>
  );
}
