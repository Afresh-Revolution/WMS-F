"use client";

import { PageDateLabel } from "@/components/layout/PageDateLabel";
import { useMemo, useState } from "react";
import { Pencil, Search } from "lucide-react";
import { Clock3, KeyRound, Lock, Wrench } from "lucide-react";
import { type SecuritySection, type SecuritySummary } from "@/data/security";
import { NotificationsLink, ProfileLink } from "@/components/layout/PageLinks";
import { SimpleModal, type ModalField } from "@/components/ui/SimpleModal";
import { useAsyncData } from "@/hooks/useAsyncData";
import { usePageActions } from "@/hooks/usePageActions";
import { superAdminApi, unwrapRecord } from "@/lib/api";
import {
  bool,
  formatAttempts,
  formatChars,
  formatEnabled,
  formatMinutes,
  num,
  str,
} from "@/lib/api/mappers";
import styles from "./SecurityPage.module.css";

function buildSections(data: Record<string, unknown>): SecuritySection[] {
  const password = (data.passwordPolicy ?? data.password ?? {}) as Record<
    string,
    unknown
  >;
  const lockout = (data.loginPolicy ?? data.lockout ?? {}) as Record<
    string,
    unknown
  >;
  const sessions = (data.sessionPolicy ?? data.sessions ?? {}) as Record<
    string,
    unknown
  >;
  const maintenance = (data.maintenance ?? {}) as Record<string, unknown>;

  return [
    {
      id: "password",
      title: "Password rules",
      description: "Requirements enforced on every account.",
      settings: [
        {
          id: "min-length",
          label: "Minimum password length",
          description: "Least number of characters allowed.",
          value: formatChars(password.minLength ?? password.minimumLength),
        },
        {
          id: "require-symbol",
          label: "Require a symbol",
          description: "Passwords must contain a special character.",
          value: formatEnabled(password.requireSymbol ?? password.requireSymbols),
        },
        {
          id: "require-number",
          label: "Require a number",
          description: "Passwords must contain at least one digit.",
          value: formatEnabled(password.requireNumber ?? password.requireNumbers),
        },
        {
          id: "require-mfa",
          label: "Require multi-factor authentication",
          description: "All users must set up MFA at next sign-in.",
          value: formatEnabled(
            data.mfaRequired ??
              (data.mfa as Record<string, unknown> | undefined)?.required,
          ),
        },
      ],
    },
    {
      id: "lockout",
      title: "Account lockout",
      description: "Protects accounts from brute-force attempts.",
      settings: [
        {
          id: "failed-attempts",
          label: "Failed attempts before lockout",
          description: "Consecutive failures that trigger a lock.",
          value: formatAttempts(
            lockout.maxAttempts ?? lockout.failedAttemptsBeforeLockout,
          ),
        },
        {
          id: "lockout-duration",
          label: "Lockout duration",
          description: "How long an account stays locked.",
          value: formatMinutes(
            lockout.lockoutDurationMinutes ?? lockout.lockoutDuration,
          ),
        },
      ],
    },
    {
      id: "sessions",
      title: "Login sessions",
      description: "Controls how long a session stays active.",
      settings: [
        {
          id: "session-timeout",
          label: "Session timeout",
          description: "Idle time before users are signed out.",
          value: formatMinutes(
            sessions.timeoutMinutes ?? sessions.sessionTimeout,
          ),
        },
      ],
    },
    {
      id: "maintenance",
      title: "Maintenance",
      description:
        "Temporarily take the platform offline for all non-Super Admin users.",
      settings: [
        {
          id: "maintenance-mode",
          label: "Maintenance mode",
          description: "When enabled, only Super Admins can sign in.",
          value: formatEnabled(maintenance.enabled ?? maintenance.mode),
        },
      ],
    },
  ];
}

function buildSummaries(data: Record<string, unknown>): SecuritySummary[] {
  const password = (data.passwordPolicy ?? data.password ?? {}) as Record<
    string,
    unknown
  >;
  const lockout = (data.loginPolicy ?? data.lockout ?? {}) as Record<
    string,
    unknown
  >;
  const sessions = (data.sessionPolicy ?? data.sessions ?? {}) as Record<
    string,
    unknown
  >;
  const maintenance = (data.maintenance ?? {}) as Record<string, unknown>;

  return [
    {
      id: "password-policy",
      label: "Password policy",
      value: `${num(password.minLength ?? password.minimumLength, 10)}+ chars`,
      icon: KeyRound,
    },
    {
      id: "lockout-after",
      label: "Lockout after",
      value: `${num(lockout.maxAttempts ?? lockout.failedAttemptsBeforeLockout, 5)} tries`,
      icon: Lock,
    },
    {
      id: "session-timeout",
      label: "Session timeout",
      value: `${num(sessions.timeoutMinutes ?? sessions.sessionTimeout, 60)} min`,
      icon: Clock3,
    },
    {
      id: "maintenance",
      label: "Maintenance",
      value: bool(maintenance.enabled ?? maintenance.mode) ? "On" : "Off",
      icon: Wrench,
    },
  ];
}

type EditTarget = {
  sectionId: string;
  settingId: string;
  label: string;
  value: string;
};

function isBooleanSetting(settingId: string) {
  return (
    settingId === "require-symbol" ||
    settingId === "require-number" ||
    settingId === "require-mfa" ||
    settingId === "maintenance-mode"
  );
}

function editFieldsFor(target: EditTarget | null): ModalField[] {
  if (!target) return [];
  if (isBooleanSetting(target.settingId)) {
    return [
      {
        name: "value",
        label: target.label,
        type: "select",
        defaultValue: target.value.startsWith("Yes") ? "true" : "false",
        options: [
          { label: "Yes", value: "true" },
          { label: "No", value: "false" },
        ],
      },
    ];
  }
  return [
    {
      name: "value",
      label: target.label,
      type: "number",
      defaultValue: target.value.replace(/\D/g, "") || "0",
      required: true,
    },
  ];
}

export function SecurityPage() {
  const { runAction } = usePageActions();
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);

  const { data, loading, error, refetch } = useAsyncData(
    () => superAdminApi.security.dashboard(),
    [],
  );

  const payload = useMemo(() => unwrapRecord(data), [data]);
  const sections = useMemo(() => buildSections(payload), [payload]);
  const summaries = useMemo(() => buildSummaries(payload), [payload]);

  async function saveSetting(values: Record<string, string>) {
    if (!editTarget) return;
    const enabled = values.value === "true";
    const numeric = Number(values.value);

    await runAction(`Update ${editTarget.label}`, async () => {
      if (editTarget.sectionId === "password") {
        if (editTarget.settingId === "min-length") {
          await superAdminApi.security.passwordPolicy({ minLength: numeric });
        } else if (editTarget.settingId === "require-symbol") {
          await superAdminApi.security.passwordPolicy({ requireSymbol: enabled });
        } else if (editTarget.settingId === "require-number") {
          await superAdminApi.security.passwordPolicy({ requireNumber: enabled });
        } else if (editTarget.settingId === "require-mfa") {
          await superAdminApi.security.mfa({ required: enabled });
        }
      } else if (editTarget.sectionId === "lockout") {
        if (editTarget.settingId === "failed-attempts") {
          await superAdminApi.security.loginPolicy({ maxAttempts: numeric });
        } else if (editTarget.settingId === "lockout-duration") {
          await superAdminApi.security.loginPolicy({ lockoutDurationMinutes: numeric });
        }
      } else if (editTarget.sectionId === "sessions") {
        await superAdminApi.security.sessionPolicy({ timeoutMinutes: numeric });
      } else if (editTarget.sectionId === "maintenance") {
        await superAdminApi.security.maintenance({ enabled });
      }
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
        <p className={styles.eyebrow}>System · Security</p>
        <h1 className={styles.title}>Security & access rules</h1>
        <p className={styles.subtitle}>
          Configure password policy, account lockout, login sessions and platform
          maintenance. Every change is confirmed and written to the technical
          audit log.
        </p>
        {loading ? <p className={styles.subtitle}>Loading security settings…</p> : null}
        {error ? (
          <p className={styles.subtitle} role="alert">
            {error}
          </p>
        ) : null}
      </div>

      <div className={styles.sections}>
        {sections.map((section) => (
          <section key={section.id} className={styles.card}>
            <div className={styles.cardHead}>
              <h2 className={styles.cardTitle}>{section.title}</h2>
              <p className={styles.cardDescription}>{section.description}</p>
            </div>

            <div className={styles.settingList}>
              {section.settings.map((setting) => (
                <div key={setting.id} className={styles.settingRow}>
                  <div className={styles.settingCopy}>
                    <h3 className={styles.settingLabel}>{setting.label}</h3>
                    <p className={styles.settingDescription}>
                      {setting.description}
                    </p>
                  </div>
                  <div className={styles.settingMeta}>
                    <span className={styles.settingValue}>{setting.value}</span>
                    <button
                      type="button"
                      className={styles.editButton}
                      onClick={() =>
                        setEditTarget({
                          sectionId: section.id,
                          settingId: setting.id,
                          label: setting.label,
                          value: setting.value,
                        })
                      }
                    >
                      <Pencil size={13} strokeWidth={2.25} />
                      Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className={styles.summaryRow}>
        {summaries.map((item) => {
          const Icon = item.icon;
          return (
            <article key={item.id} className={styles.summaryCard}>
              <span className={styles.summaryIcon}>
                <Icon size={16} strokeWidth={2} />
              </span>
              <div className={styles.summaryCopy}>
                <p className={styles.summaryLabel}>{item.label}</p>
                <p className={styles.summaryValue}>{item.value}</p>
              </div>
            </article>
          );
        })}
      </div>

      <SimpleModal
        open={Boolean(editTarget)}
        title={editTarget ? `Edit ${editTarget.label}` : "Edit setting"}
        fields={editFieldsFor(editTarget)}
        submitLabel="Save"
        onClose={() => setEditTarget(null)}
        onSubmit={saveSetting}
      />
    </div>
  );
}
