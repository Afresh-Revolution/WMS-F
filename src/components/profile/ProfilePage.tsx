"use client";

import { useMemo, useState } from "react";
import {
  Mail,
  MapPin,
  Pencil,
  Phone,
  Search,
} from "lucide-react";
import {
  profileLeaveBalances as fallbackLeaveBalances,
  profileRecord as fallbackProfile,
} from "@/data/profile";
import { NotificationsLink, ProfileLink } from "@/components/layout/PageLinks";
import { SimpleModal } from "@/components/ui/SimpleModal";
import { useAsyncData } from "@/hooks/useAsyncData";
import { usePageActions } from "@/hooks/usePageActions";
import { profileApi } from "@/lib/api";
import { initials, num, str } from "@/lib/api/mappers";
import styles from "./ProfilePage.module.css";

const editProfileFields = [
  { name: "phone", label: "Phone", type: "text" as const },
  { name: "personalEmail", label: "Personal email", type: "email" as const },
  { name: "location", label: "Location", type: "text" as const },
];

export function ProfilePage() {
  const { runAction } = usePageActions();
  const [editOpen, setEditOpen] = useState(false);

  const { data, loading, error, refetch } = useAsyncData(() => profileApi.get(), []);

  const profile = useMemo(() => {
    if (!data) return fallbackProfile;
    const record = data as Record<string, unknown>;
    const personal = (record.personal ?? record) as Record<string, unknown>;
    const employment = (record.employment ?? record) as Record<string, unknown>;
    const name = str(record.name ?? record.fullName, fallbackProfile.name);
    return {
      initials: str(record.initials, initials(name)),
      name,
      jobTitle: str(record.jobTitle ?? employment.role, fallbackProfile.jobTitle),
      department: str(record.department ?? employment.department, fallbackProfile.department),
      status: str(record.status, fallbackProfile.status) as "Active",
      employeeId: str(record.employeeId ?? record.id, fallbackProfile.employeeId),
      annualLeaveDays: num(
        record.annualLeaveDays ?? record.leaveBalance,
        fallbackProfile.annualLeaveDays,
      ),
      personal: {
        companyEmail: str(
          personal.companyEmail ?? record.email,
          fallbackProfile.personal.companyEmail,
        ),
        personalEmail: str(
          personal.personalEmail ?? personal.email,
          fallbackProfile.personal.personalEmail,
        ),
        phone: str(personal.phone ?? record.phone, fallbackProfile.personal.phone),
        location: str(
          personal.location ?? record.location,
          fallbackProfile.personal.location,
        ),
      },
      employment: {
        role: str(employment.role ?? record.jobTitle, fallbackProfile.employment.role),
        department: str(
          employment.department ?? record.department,
          fallbackProfile.employment.department,
        ),
        startDate: str(
          employment.startDate ?? record.startDate,
          fallbackProfile.employment.startDate,
        ),
        type: str(employment.type ?? record.employmentType, fallbackProfile.employment.type),
        reportsTo: str(employment.reportsTo ?? record.reportsTo, ""),
      },
    };
  }, [data]);

  const leaveBalances = useMemo(() => {
    const record = (data ?? {}) as Record<string, unknown>;
    const balances = record.leaveBalances ?? record.leave;
    if (!Array.isArray(balances)) return fallbackLeaveBalances;
    return balances.map((item, index) => {
      const balance = item as Record<string, unknown>;
      return {
        id: str(balance.id, String(index)),
        label: str(balance.label ?? balance.type),
        remaining: num(balance.remaining ?? balance.balance),
        total: num(balance.total ?? balance.allocated, 1),
      };
    });
  }, [data]);

  const { personal, employment } = profile;

  async function handleProfileUpdate(values: Record<string, string>) {
    await runAction("Update profile", async () => {
      await profileApi.update({
        phone: values.phone,
        personalEmail: values.personalEmail,
        location: values.location,
        personal: {
          phone: values.phone,
          personalEmail: values.personalEmail,
          location: values.location,
        },
      });
      refetch();
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
          <ProfileLink className={styles.avatarChip}>{profile.initials}</ProfileLink>
        </div>
      </div>

      <div className={styles.header}>
        <div className={styles.headerCopy}>
          <p className={styles.eyebrow}>My profile</p>
          <h1 className={styles.title}>Your employment record</h1>
          <p className={styles.subtitle}>
            View your personal and employment details, leave balance, and request
            history.
          </p>
          {loading ? <p className={styles.subtitle}>Loading profile…</p> : null}
          {error ? (
            <p className={styles.subtitle} role="alert">
              Showing cached profile — {error}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          className={styles.editButton}
          onClick={() => setEditOpen(true)}
        >
          <Pencil size={14} strokeWidth={2.25} />
          Edit details
        </button>
      </div>

      <article className={styles.heroCard}>
        <div className={styles.heroMain}>
          <span className={styles.heroAvatar}>{profile.initials}</span>
          <div className={styles.heroCopy}>
            <h2 className={styles.heroName}>{profile.name}</h2>
            <p className={styles.heroRole}>
              {profile.jobTitle} · {profile.department}
            </p>
            <div className={styles.heroMeta}>
              <span className={styles.statusBadge}>
                <span className={styles.statusDot} aria-hidden />
                {profile.status}
              </span>
              <span className={styles.employeeId}>{profile.employeeId}</span>
            </div>
          </div>
        </div>
        <div className={styles.leaveSummary}>
          <p className={styles.leaveSummaryLabel}>Annual leave</p>
          <p className={styles.leaveSummaryValue}>
            {profile.annualLeaveDays} days
          </p>
        </div>
      </article>

      <div className={styles.grid}>
        <section className={styles.card}>
          <h2 className={styles.cardTitle}>Personal details</h2>
          <div className={styles.detailList}>
            <div className={styles.detailRow}>
              <span className={styles.detailIcon} aria-hidden>
                <Mail size={15} strokeWidth={2} />
              </span>
              <div className={styles.detailCopy}>
                <p className={styles.detailLabel}>Company email</p>
                <div className={styles.detailValueRow}>
                  <p className={styles.detailValue}>{personal.companyEmail}</p>
                  <span className={styles.companyBadge}>Company</span>
                </div>
              </div>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailIcon} aria-hidden>
                <Mail size={15} strokeWidth={2} />
              </span>
              <div className={styles.detailCopy}>
                <p className={styles.detailLabel}>Personal email</p>
                <p className={styles.detailValue}>{personal.personalEmail}</p>
              </div>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailIcon} aria-hidden>
                <Phone size={15} strokeWidth={2} />
              </span>
              <div className={styles.detailCopy}>
                <p className={styles.detailLabel}>Phone</p>
                <p className={styles.detailValue}>{personal.phone}</p>
              </div>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailIcon} aria-hidden>
                <MapPin size={15} strokeWidth={2} />
              </span>
              <div className={styles.detailCopy}>
                <p className={styles.detailLabel}>Location</p>
                <p className={styles.detailValue}>{personal.location}</p>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.card}>
          <h2 className={styles.cardTitle}>Employment details</h2>
          <div className={styles.detailList}>
            <div className={styles.employmentRow}>
              <h3 className={styles.employmentLabel}>Role</h3>
              <p className={styles.employmentValue}>{employment.role}</p>
            </div>
            <div className={styles.employmentRow}>
              <h3 className={styles.employmentLabel}>Department</h3>
              <p className={styles.employmentValue}>{employment.department}</p>
            </div>
            <div className={styles.employmentRow}>
              <h3 className={styles.employmentLabel}>Start date</h3>
              <p className={styles.employmentValue}>{employment.startDate}</p>
            </div>
            <div className={styles.employmentRow}>
              <h3 className={styles.employmentLabel}>Employment type</h3>
              <p className={styles.employmentValue}>{employment.type}</p>
            </div>
            <div className={styles.employmentRow}>
              <h3 className={styles.employmentLabel}>Reports to</h3>
              <p
                className={`${styles.employmentValue} ${
                  employment.reportsTo ? "" : styles.employmentEmpty
                }`}
              >
                {employment.reportsTo || "—"}
              </p>
            </div>
          </div>
        </section>

        <section className={`${styles.card} ${styles.wideCard}`}>
          <h2 className={styles.cardTitle}>Leave balance</h2>
          <div className={styles.balanceList}>
            {leaveBalances.map((balance) => {
              const remainingPercent = (balance.remaining / balance.total) * 100;
              return (
                <div key={balance.id} className={styles.balanceRow}>
                  <div className={styles.balanceHeader}>
                    <h3 className={styles.balanceLabel}>{balance.label}</h3>
                    <span className={styles.balanceMeta}>
                      {balance.remaining} of {balance.total} left
                    </span>
                  </div>
                  <div
                    className={styles.meterTrack}
                    role="meter"
                    aria-label={balance.label}
                    aria-valuemin={0}
                    aria-valuemax={balance.total}
                    aria-valuenow={balance.remaining}
                  >
                    <div
                      className={styles.meterFill}
                      style={{ width: `${remainingPercent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <SimpleModal
        open={editOpen}
        title="Edit personal details"
        description="Update contact information on your profile."
        fields={editProfileFields.map((field) => ({
          ...field,
          defaultValue:
            field.name === "phone"
              ? personal.phone
              : field.name === "personalEmail"
                ? personal.personalEmail
                : personal.location,
        }))}
        submitLabel="Save changes"
        onClose={() => setEditOpen(false)}
        onSubmit={handleProfileUpdate}
      />
    </div>
  );
}
