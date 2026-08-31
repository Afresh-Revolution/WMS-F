"use client";

import { useMemo } from "react";
import { useAsyncData } from "@/hooks/useAsyncData";
import { settingsApi, systemManagementApi } from "@/lib/api";
import { str } from "@/lib/api/mappers";
import styles from "./SettingsPage.module.css";

export function SettingsPage() {
  const { data: settingsData, loading, error } = useAsyncData(
    () => systemManagementApi.settings.list(),
    [],
  );

  const { data: moduleSettings } = useAsyncData(() => settingsApi.list(), []);

  const settings = useMemo(() => {
    const system = (settingsData ?? {}) as Record<string, unknown>;
    const module = (moduleSettings ?? {}) as Record<string, unknown>;
    return { ...system, ...module };
  }, [settingsData, moduleSettings]);

  const entries = Object.entries(settings).filter(
    ([key]) => !["data", "meta"].includes(key),
  );

  return (
    <div className={styles.page}>
      <p className={styles.eyebrow}>Account</p>
      <h1 className={styles.title}>Settings</h1>
      <p className={styles.subtitle}>
        Configure workspace defaults and personal preferences.
      </p>
      {loading ? <p>Loading settings…</p> : null}
      {error ? <p role="alert">Using cached settings — {error}</p> : null}

      <div className={styles.list}>
        {entries.length === 0 ? (
          <p className={styles.empty}>No settings returned from the API yet.</p>
        ) : (
          entries.map(([key, value]) => (
            <div key={key} className={styles.row}>
              <span className={styles.label}>{key}</span>
              <span className={styles.value}>{str(value)}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
