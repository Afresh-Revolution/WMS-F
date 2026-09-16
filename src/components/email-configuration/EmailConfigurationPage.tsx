"use client";

import { useMemo, useState } from "react";
import { Mail, Pencil, Search } from "lucide-react";
import { NotificationsLink, ProfileLink } from "@/components/layout/PageLinks";
import { SimpleModal, type ModalField } from "@/components/ui/SimpleModal";
import { useAsyncData } from "@/hooks/useAsyncData";
import { usePageActions } from "@/hooks/usePageActions";
import { superAdminApi, unwrapRecord } from "@/lib/api";
import { formatEnabled, str } from "@/lib/api/mappers";
import styles from "./EmailConfigurationPage.module.css";

type SettingRow = {
  id: string;
  label: string;
  value: string;
  fieldKey: string;
  type?: "text" | "select";
};

export function EmailConfigurationPage() {
  const { runAction } = usePageActions();
  const [editSetting, setEditSetting] = useState<SettingRow | null>(null);

  const { data, loading, error, refetch } = useAsyncData(
    () => superAdminApi.emailConfig.get(),
    [],
  );

  const config = useMemo(() => unwrapRecord(data), [data]);

  const serviceStatus = useMemo(() => {
    return {
      provider: str(config.provider ?? config.emailProvider, "—"),
      fromAddress: str(
        config.fromAddress ?? config.from_email ?? config.from,
        "—",
      ),
      status: str(config.status ?? config.health, "Unknown") as
        | "Operational"
        | "Degraded",
    };
  }, [config]);

  const deliverySettings = useMemo((): SettingRow[] => {
    return [
      {
        id: "provider",
        label: "Email provider",
        value: str(config.provider, "—"),
        fieldKey: "provider",
      },
      {
        id: "from-name",
        label: "From name",
        value: str(config.fromName ?? config.from_name, "—"),
        fieldKey: "fromName",
      },
      {
        id: "from-address",
        label: "From address",
        value: str(config.fromAddress ?? config.from_email, "—"),
        fieldKey: "fromAddress",
      },
      {
        id: "smtp-host",
        label: "SMTP host",
        value: str(config.smtpHost ?? config.host, "—"),
        fieldKey: "smtpHost",
      },
      {
        id: "smtp-port",
        label: "SMTP port",
        value: str(config.smtpPort ?? config.port, "—"),
        fieldKey: "smtpPort",
      },
      {
        id: "tls",
        label: "TLS enabled",
        value: formatEnabled(config.tls ?? config.useTls),
        fieldKey: "tls",
        type: "select",
      },
    ];
  }, [config]);

  const editFields: ModalField[] = editSetting
    ? [
        editSetting.type === "select"
          ? {
              name: "value",
              label: editSetting.label,
              type: "select",
              defaultValue: editSetting.value.startsWith("Yes") ? "true" : "false",
              options: [
                { label: "Yes", value: "true" },
                { label: "No", value: "false" },
              ],
            }
          : {
              name: "value",
              label: editSetting.label,
              defaultValue: editSetting.value,
              required: true,
            },
      ]
    : [];

  async function saveSetting(values: Record<string, string>) {
    if (!editSetting) return;
    const payloadValue =
      editSetting.type === "select" ? values.value === "true" : values.value;

    await runAction(`Update ${editSetting.label}`, async () => {
      await superAdminApi.emailConfig.patch({ [editSetting.fieldKey]: payloadValue });
      refetch();
    });
  }

  async function testEmail() {
    await runAction("Send test email", async () => {
      await superAdminApi.emailConfig.test();
    });
  }

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <p className={styles.dateLabel}>Monday, August 3</p>
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
        <p className={styles.eyebrow}>System · Email</p>
        <h1 className={styles.title}>Email configuration</h1>
        <p className={styles.subtitle}>
          Manage the outbound email service used for system notifications,
          approvals and staff communications.
        </p>
        {loading ? <p className={styles.subtitle}>Loading email config…</p> : null}
        {error ? (
          <p className={styles.subtitle} role="alert">
            {error}
          </p>
        ) : null}
      </div>

      <article className={styles.statusCard}>
        <div className={styles.statusMain}>
          <span className={styles.statusIcon} aria-hidden>
            <Mail size={18} strokeWidth={2} />
          </span>
          <div className={styles.statusCopy}>
            <p className={styles.statusLabel}>Email service</p>
            <p className={styles.statusMeta}>
              {serviceStatus.provider} · {serviceStatus.fromAddress}
            </p>
          </div>
        </div>
        <div className={styles.settingMeta}>
          <span className={styles.statusBadge}>
            <span className={styles.statusDot} aria-hidden />
            {serviceStatus.status}
          </span>
          <button type="button" className={styles.editButton} onClick={() => void testEmail()}>
            Send test
          </button>
        </div>
      </article>

      <section className={styles.card}>
        <div className={styles.cardHead}>
          <h2 className={styles.cardTitle}>Delivery settings</h2>
          <p className={styles.cardDescription}>
            Provider and sender identity for all outbound email.
          </p>
        </div>

        <div className={styles.settingList}>
          {deliverySettings.map((setting) => (
            <div key={setting.id} className={styles.settingRow}>
              <h3 className={styles.settingLabel}>{setting.label}</h3>
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

      <SimpleModal
        open={Boolean(editSetting)}
        title={editSetting ? `Edit ${editSetting.label}` : "Edit setting"}
        fields={editFields}
        submitLabel="Save"
        onClose={() => setEditSetting(null)}
        onSubmit={saveSetting}
      />
    </div>
  );
}
