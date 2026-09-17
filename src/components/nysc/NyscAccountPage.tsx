"use client";

import { PageDateLabel } from "@/components/layout/PageDateLabel";
import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { Bell, Search } from "lucide-react";
import { AccountantStatusLine } from "@/components/accountant/AccountantStatusLine";
import { useInternAccount } from "@/hooks/useInternAccount";
import { usePageActions } from "@/hooks/usePageActions";
import { internApi } from "@/lib/api";
import styles from "./NyscUtilityPages.module.css";

export function NyscAccountPage() {
  const { account, loading, error, refetch, live } = useInternAccount("chidi");
  const { runAction } = usePageActions();
  const { profile } = account;
  const [fullName, setFullName] = useState(account.name);
  const [phone, setPhone] = useState(profile.phone);
  const [address, setAddress] = useState(profile.address);
  const [emergencyName, setEmergencyName] = useState(profile.emergencyName);
  const [emergencyPhone, setEmergencyPhone] = useState(profile.emergencyPhone);

  useEffect(() => {
    setFullName(account.name);
    setPhone(profile.phone);
    setAddress(profile.address);
    setEmergencyName(profile.emergencyName);
    setEmergencyPhone(profile.emergencyPhone);
  }, [
    account.name,
    profile.address,
    profile.emergencyName,
    profile.emergencyPhone,
    profile.phone,
  ]);

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await runAction(
      "Save account",
      async () => {
        await internApi.placementRecord.patch({
          fullName,
          phone,
          address,
          emergencyContactName: emergencyName,
          emergencyContactPhone: emergencyPhone,
        });
        refetch();
      },
      "Contact details saved",
    );
  }

  return (
    <div className={styles.page}>
      <AccountantStatusLine
        loading={loading}
        error={error}
        resource="account settings"
      />
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

      <p className={styles.eyebrow}>Account settings</p>
      <h1 className={styles.title}>Your contact details</h1>
      <p className={styles.subtitle}>
        Update the personal fields you can change from self-service. Role,
        department, placement dates, and supervisor are managed by HR.
      </p>

      <form className={styles.form} onSubmit={(event) => void handleSave(event)}>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Full name</span>
          <input
            className={styles.fieldInput}
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
          />
        </label>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Phone</span>
          <input
            className={styles.fieldInput}
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
          />
        </label>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Address</span>
          <input
            className={styles.fieldInput}
            value={address}
            onChange={(event) => setAddress(event.target.value)}
          />
        </label>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Emergency contact name</span>
          <input
            className={styles.fieldInput}
            value={emergencyName}
            onChange={(event) => setEmergencyName(event.target.value)}
          />
        </label>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Emergency contact phone</span>
          <input
            className={styles.fieldInput}
            value={emergencyPhone}
            onChange={(event) => setEmergencyPhone(event.target.value)}
          />
        </label>
        <p className={styles.hint}>
          {live
            ? "Saved to your placement record. Preferences are on Settings."
            : "Using example data until the intern API is reachable."}
        </p>
        <button type="submit" className={styles.saveButton}>
          Save details
        </button>
      </form>
    </div>
  );
}
