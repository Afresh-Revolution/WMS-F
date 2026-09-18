"use client";

import { PageDateLabel } from "@/components/layout/PageDateLabel";
import { useMemo, useState } from "react";
import { Bell, Pencil, Search } from "lucide-react";
import { NotificationsLink, ProfileLink } from "@/components/layout/PageLinks";
import { SimpleModal, type ModalField } from "@/components/ui/SimpleModal";
import { useAsyncData } from "@/hooks/useAsyncData";
import { usePageActions } from "@/hooks/usePageActions";
import { superAdminApi, unwrapRecord } from "@/lib/api";
import { formatEnabled, str } from "@/lib/api/mappers";
import styles from "./NotificationConfigurationPage.module.css";

type ChannelRow = {
  id: string;
  label: string;
  value: string;
  fieldKey: string;
};

type PreferenceRow = {
  id: string;
  label: string;
  description: string;
  value: string;
  fieldKey: string;
  type?: "text" | "select";
};

export function NotificationConfigurationPage() {
  const { runAction } = usePageActions();
  const [editChannel, setEditChannel] = useState<ChannelRow | null>(null);
  const [editPreference, setEditPreference] = useState<PreferenceRow | null>(null);

  const { data, loading, error, refetch } = useAsyncData(
    () => superAdminApi.notificationConfig.get(),
    [],
  );

  const config = useMemo(() => unwrapRecord(data), [data]);

  const serviceStatus = useMemo(() => {
    return {
      label: str(config.label, "Notification service"),
      description: str(
        config.description,
        "Delivery channels for in-app, email and SMS alerts.",
      ),
      status: str(config.status, "Unknown") as "Operational",
    };
  }, [config]);

  const channels = useMemo((): ChannelRow[] => {
    const channelData = unwrapRecord(config.channels ?? config);
    return [
      {
        id: "in-app",
        label: "In-app notifications",
        value: formatEnabled(channelData.inApp ?? channelData.in_app),
        fieldKey: "inApp",
      },
      {
        id: "email",
        label: "Email notifications",
        value: formatEnabled(channelData.email),
        fieldKey: "email",
      },
      {
        id: "sms",
        label: "SMS notifications",
        value: formatEnabled(channelData.sms),
        fieldKey: "sms",
      },
    ];
  }, [config]);

  const preferences = useMemo((): PreferenceRow[] => {
    const prefs = unwrapRecord(
      config.deliveryPreferences ?? config.preferences,
    );
    return [
      {
        id: "daily-digest",
        label: "Daily digest",
        description:
          "Send a single summary each morning instead of per-event emails.",
        value: formatEnabled(prefs.dailyDigest ?? prefs.daily_digest),
        fieldKey: "dailyDigest",
        type: "select",
      },
      {
        id: "quiet-hours",
        label: "Quiet hours",
        description: "Non-urgent notifications are held during this window.",
        value: str(prefs.quietHours ?? prefs.quiet_hours, "—"),
        fieldKey: "quietHours",
      },
    ];
  }, [config]);

  const channelFields: ModalField[] = editChannel
    ? [
        {
          name: "value",
          label: editChannel.label,
          type: "select",
          defaultValue: editChannel.value.startsWith("Yes") ? "true" : "false",
          options: [
            { label: "Enabled", value: "true" },
            { label: "Disabled", value: "false" },
          ],
        },
      ]
    : [];

  const preferenceFields: ModalField[] = editPreference
    ? [
        editPreference.type === "select"
          ? {
              name: "value",
              label: editPreference.label,
              type: "select",
              defaultValue: editPreference.value.startsWith("Yes") ? "true" : "false",
              options: [
                { label: "Enabled", value: "true" },
                { label: "Disabled", value: "false" },
              ],
            }
          : {
              name: "value",
              label: editPreference.label,
              defaultValue: editPreference.value,
              required: true,
            },
      ]
    : [];

  async function saveChannel(values: Record<string, string>) {
    if (!editChannel) return;
    await runAction(`Update ${editChannel.label}`, async () => {
      await superAdminApi.notificationConfig.patchChannels({
        [editChannel.fieldKey]: values.value === "true",
      });
      refetch();
    });
  }

  async function savePreference(values: Record<string, string>) {
    if (!editPreference) return;
    const payloadValue =
      editPreference.type === "select" ? values.value === "true" : values.value;

    await runAction(`Update ${editPreference.label}`, async () => {
      await superAdminApi.notificationConfig.patchDeliveryPreferences({
        [editPreference.fieldKey]: payloadValue,
      });
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
        <p className={styles.eyebrow}>System · Notifications</p>
        <h1 className={styles.title}>Notification configuration</h1>
        <p className={styles.subtitle}>
          Choose which channels the platform uses to reach staff, and when.
        </p>
        {loading ? <p className={styles.subtitle}>Loading notification config…</p> : null}
        {error ? (
          <p className={styles.subtitle} role="alert">
            {error}
          </p>
        ) : null}
      </div>

      <article className={styles.statusCard}>
        <div className={styles.statusMain}>
          <span className={styles.statusIcon} aria-hidden>
            <Bell size={18} strokeWidth={2} />
          </span>
          <div className={styles.statusCopy}>
            <p className={styles.statusLabel}>{serviceStatus.label}</p>
            <p className={styles.statusMeta}>{serviceStatus.description}</p>
          </div>
        </div>
        <span className={styles.statusBadge}>
          <span className={styles.statusDot} aria-hidden />
          {serviceStatus.status}
        </span>
      </article>

      <div className={styles.sections}>
        <section className={styles.card}>
          <div className={styles.cardHead}>
            <h2 className={styles.cardTitle}>Channels</h2>
            <p className={styles.cardDescription}>
              Enable or disable delivery channels for the whole organisation.
            </p>
          </div>

          <div className={styles.settingList}>
            {channels.map((channel) => (
              <div key={channel.id} className={styles.settingRow}>
                <h3 className={styles.settingLabel}>{channel.label}</h3>
                <div className={styles.settingMeta}>
                  <span className={styles.settingValue}>{channel.value}</span>
                  <button
                    type="button"
                    className={styles.editButton}
                    onClick={() => setEditChannel(channel)}
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
            <h2 className={styles.cardTitle}>Delivery preferences</h2>
            <p className={styles.cardDescription}>
              Control cadence and quiet periods.
            </p>
          </div>

          <div className={styles.settingList}>
            {preferences.map((preference) => (
              <div key={preference.id} className={styles.settingRow}>
                <div className={styles.settingCopy}>
                  <h3 className={styles.settingLabel}>{preference.label}</h3>
                  <p className={styles.settingDescription}>
                    {preference.description}
                  </p>
                </div>
                <div className={styles.settingMeta}>
                  <span className={styles.settingValue}>{preference.value}</span>
                  <button
                    type="button"
                    className={styles.editButton}
                    onClick={() => setEditPreference(preference)}
                  >
                    <Pencil size={13} strokeWidth={2.25} />
                    Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <SimpleModal
        open={Boolean(editChannel)}
        title={editChannel ? `Edit ${editChannel.label}` : "Edit channel"}
        fields={channelFields}
        submitLabel="Save"
        onClose={() => setEditChannel(null)}
        onSubmit={saveChannel}
      />

      <SimpleModal
        open={Boolean(editPreference)}
        title={editPreference ? `Edit ${editPreference.label}` : "Edit preference"}
        fields={preferenceFields}
        submitLabel="Save"
        onClose={() => setEditPreference(null)}
        onSubmit={savePreference}
      />
    </div>
  );
}
