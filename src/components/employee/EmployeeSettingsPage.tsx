"use client";

import { PageDateLabel } from "@/components/layout/PageDateLabel";
import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { NotificationsLink, ProfileLink } from "@/components/layout/PageLinks";
import { useCurrentUser } from "@/components/layout/CurrentUserProvider";
import { useAsyncData } from "@/hooks/useAsyncData";
import { usePageActions } from "@/hooks/usePageActions";
import { profileApi } from "@/lib/api";
import { unwrapRecord, str } from "@/lib/api/mappers";
import styles from "./EmployeeSettingsPage.module.css";

function isPasswordChangeRequired(error: unknown) {
  return (
    error instanceof Error && /password change required/i.test(error.message)
  );
}

function readProfileField(payload: unknown, keys: string[]) {
  const root = unwrapRecord(payload);
  const profile = unwrapRecord(root.profile ?? root.employee ?? root);
  const personal = unwrapRecord(profile.personal ?? profile.contact);
  const merged = { ...root, ...profile, ...personal };
  for (const key of keys) {
    const value = str(merged[key]).trim();
    if (value) return value;
  }
  return "";
}

export function EmployeeSettingsPage() {
  const pathname = usePathname();
  const { user } = useCurrentUser();
  const { runAction } = usePageActions();
  const passwordFormRef = useRef<HTMLFormElement>(null);
  const [passwordRequired, setPasswordRequired] = useState(false);
  const [personalEmail, setPersonalEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [address, setAddress] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const { data: profile } = useAsyncData(async () => {
    try {
      return await profileApi.get();
    } catch {
      return null;
    }
  }, []);
  const companyEmail =
    readProfileField(profile, ["companyEmail", "workEmail", "email"]) ||
    user?.email ||
    "";

  useEffect(() => {
    if (!profile) return;
    setPersonalEmail(
      readProfileField(profile, [
        "personalEmail",
        "personal_email",
        "alternateEmail",
      ]),
    );
    setPhone(readProfileField(profile, ["phone", "mobile", "phoneNumber"]));
    setEmergencyContact(
      readProfileField(profile, [
        "emergencyContact",
        "emergency_contact",
        "nextOfKin",
      ]),
    );
    setAddress(readProfileField(profile, ["address", "homeAddress"]));
  }, [profile]);

  function requirePasswordChange() {
    setPasswordRequired(true);
    passwordFormRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  async function handleSaveDetails(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      await runAction(
        "Save account",
        async () => {
          await profileApi.patch({
            personalEmail: personalEmail.trim(),
            phone: phone.trim(),
            emergencyContact: emergencyContact.trim(),
            address: address.trim(),
          });
        },
        "Contact details saved",
      );
    } catch (error) {
      if (isPasswordChangeRequired(error)) requirePasswordChange();
    }
  }

  async function handleChangePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      await runAction(
        "Change password",
        async () => {
          await profileApi.changePassword({
            currentPassword,
            newPassword,
          });
          setCurrentPassword("");
          setNewPassword("");
          setPasswordRequired(false);
        },
        "Password updated",
      );
    } catch {
      /* runAction already showed the API error */
    }
  }

  const passwordForm = (
    <form
      ref={passwordFormRef}
      className={styles.form}
      onSubmit={(event) => void handleChangePassword(event)}
    >
      <h2>Password</h2>
      {passwordRequired ? (
        <p className={styles.notice}>
          Change your temporary password before saving other account details.
        </p>
      ) : null}
      <label className={styles.field}>
        <span>Current password</span>
        <input
          type="password"
          value={currentPassword}
          onChange={(event) => setCurrentPassword(event.target.value)}
          autoComplete="current-password"
          required
        />
      </label>
      <label className={styles.field}>
        <span>New password</span>
        <input
          type="password"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          autoComplete="new-password"
          minLength={8}
          required
        />
      </label>
      <button type="submit" className={styles.saveButton}>
        Update password
      </button>
    </form>
  );

  const detailsForm = (
    <form
      className={styles.form}
      onSubmit={(event) => void handleSaveDetails(event)}
    >
      <label className={styles.field}>
        <span>Company email</span>
        <input value={companyEmail} readOnly disabled />
      </label>
      <label className={styles.field}>
        <span>Personal email</span>
        <input
          type="email"
          value={personalEmail}
          onChange={(event) => setPersonalEmail(event.target.value)}
          required
        />
      </label>
      <label className={styles.field}>
        <span>Phone</span>
        <input
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          required
        />
      </label>
      <label className={styles.field}>
        <span>Emergency contact</span>
        <input
          value={emergencyContact}
          onChange={(event) => setEmergencyContact(event.target.value)}
          required
        />
      </label>
      <label className={styles.field}>
        <span>Address</span>
        <input
          value={address}
          onChange={(event) => setAddress(event.target.value)}
          required
        />
      </label>
      <p className={styles.hint}>
        These details appear on your profile. Employment fields are not
        editable here.
      </p>
      <button type="submit" className={styles.saveButton}>
        Save details
      </button>
    </form>
  );

  return (
    <div className={styles.page}>
      <header className={styles.topBar}>
        <PageDateLabel />
        <div className={styles.topActions}>
          <label className={styles.search}>
            <Search size={14} />
            <input aria-label="Search" placeholder="Search" readOnly />
            <kbd>⌘ K</kbd>
          </label>
          <NotificationsLink className={styles.iconButton} />
          <ProfileLink className={styles.profileButton}>
            {user?.initials || "—"}
          </ProfileLink>
        </div>
      </header>

      <div className={styles.heading}>
        <p>Account settings</p>
        <h1>Your contact details</h1>
        <span>
          Update the personal fields you can change from self-service. Role,
          department, and company email stay with HR.{" "}
          <Link
            href={
              pathname.startsWith("/manager")
                ? "/manager/profile"
                : "/employee/profile"
            }
            className={styles.inlineLink}
          >
            View profile
          </Link>
        </span>
      </div>

      <div className={styles.stack}>
        {passwordRequired ? (
          <>
            {passwordForm}
            {detailsForm}
          </>
        ) : (
          <>
            {detailsForm}
            {passwordForm}
          </>
        )}
      </div>
    </div>
  );
}
