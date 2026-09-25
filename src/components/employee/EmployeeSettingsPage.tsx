"use client";

import { PageDateLabel } from "@/components/layout/PageDateLabel";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import {
  Bell,
  Eye,
  Lock,
  Palette,
  Save,
  Search,
  UserRound,
} from "lucide-react";
import { NotificationsLink, ProfileLink } from "@/components/layout/PageLinks";
import { useCurrentUser } from "@/components/layout/CurrentUserProvider";
import { useAsyncData } from "@/hooks/useAsyncData";
import { usePageActions } from "@/hooks/usePageActions";
import { asRecord, employeeApi, notificationsApi, profileApi } from "@/lib/api";
import { initials, nestedStr, str, unwrapRecord } from "@/lib/api/mappers";
import { formatRoleLabel } from "@/lib/currentUser";
import styles from "./EmployeeSettingsPage.module.css";

type SettingsSection =
  | "profile"
  | "notifications"
  | "security"
  | "appearance"
  | "privacy";

const sections: Array<{
  id: SettingsSection;
  label: string;
  icon: typeof UserRound;
}> = [
  { id: "profile", label: "Profile", icon: UserRound },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Security", icon: Lock },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "privacy", label: "Privacy", icon: Eye },
];

function firstText(...values: unknown[]) {
  for (const value of values) {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      const nested = nestedStr(value, [
        "fullName",
        "name",
        "title",
        "label",
        "email",
      ]);
      if (nested && nested !== "[object Object]") return nested;
      continue;
    }
    const text = str(value).trim();
    if (text && text !== "[object Object]") return text;
  }
  return "";
}

function passwordPolicyError(password: string) {
  if (password.length < 10) {
    return "New password must be at least 10 characters.";
  }
  if (!/[A-Z]/.test(password)) {
    return "New password must include an uppercase letter.";
  }
  if (!/[a-z]/.test(password)) {
    return "New password must include a lowercase letter.";
  }
  if (!/[0-9]/.test(password)) {
    return "New password must include a number.";
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    return "New password must include a symbol.";
  }
  return null;
}

export function EmployeeSettingsPage() {
  const { user } = useCurrentUser();
  const { runAction } = usePageActions();
  const photoInput = useRef<HTMLInputElement>(null);
  const [section, setSection] = useState<SettingsSection>("profile");
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [inAppAlerts, setInAppAlerts] = useState(true);
  const [theme, setTheme] = useState("light");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [updatingPassword, setUpdatingPassword] = useState(false);

  const { data, loading, error, refetch } = useAsyncData(async () => {
    const [settings, profile, employment, preferences] = await Promise.all([
      employeeApi.settings.get().catch(() => null),
      employeeApi.profile.get().catch(() => profileApi.get().catch(() => null)),
      employeeApi.employmentRecord.get().catch(() => null),
      notificationsApi.preferences.get().catch(() => null),
    ]);
    return { settings, profile, employment, preferences };
  }, []);

  const record = useMemo(() => {
    const settings = unwrapRecord(data?.settings);
    const profile = unwrapRecord(data?.profile);
    const employmentRoot = unwrapRecord(data?.employment);
    const preferences = unwrapRecord(data?.preferences);
    const userRecord = unwrapRecord(profile.user ?? profile);
    const employee = unwrapRecord(
      profile.employee ?? employmentRoot.employee ?? userRecord.employee,
    );
    const overview = unwrapRecord(employmentRoot.overview ?? employmentRoot);
    const personal = unwrapRecord(
      settings.personal ??
        employmentRoot.personalInformation ??
        employmentRoot.personal ??
        overview.personal ??
        employee,
    );
    const employment = unwrapRecord(
      employmentRoot.employment ?? overview.employment ?? employee,
    );
    const fullName = firstText(
      overview.fullName,
      personal.fullName,
      userRecord.fullName,
      userRecord.name,
      employee.fullName,
      employee.name,
      user?.name,
    );
    const workEmail = firstText(
      overview.email,
      userRecord.email,
      employee.email,
      personal.companyEmail,
      user?.email,
    );
    return {
      initials:
        firstText(userRecord.initials, overview.initials, employee.initials) ||
        (fullName ? initials(fullName) : "") ||
        user?.initials ||
        "—",
      displayName: firstText(
        settings.displayName,
        personal.displayName,
        personal.preferredName,
        userRecord.displayName,
        fullName,
      ),
      phone: firstText(
        settings.phone,
        personal.phone,
        personal.mobile,
        employee.phone,
      ),
      bio: firstText(settings.bio, personal.bio, personal.about, employee.bio),
      fullName,
      workEmail,
      jobTitle: firstText(
        employment.jobTitle,
        employment.job_title,
        overview.position,
        employee.jobTitle,
      ),
      department: firstText(
        overview.department,
        employment.departmentName,
        employment.department,
        employee.department,
      ),
      role: formatRoleLabel(
        firstText(userRecord.role, employment.role, user?.role),
        "Employee",
      ),
      photoUrl: firstText(
        personal.avatarUrl,
        personal.photoUrl,
        userRecord.avatarUrl,
        employee.avatarUrl,
      ),
      emailAlerts:
        preferences.email ??
        preferences.emailNotifications ??
        asRecord(preferences.channels).email ??
        true,
      inAppAlerts:
        preferences.inApp ??
        preferences.push ??
        asRecord(preferences.channels).inApp ??
        true,
      theme: firstText(settings.theme, asRecord(settings.preferences).theme, "light"),
    };
  }, [data, user]);

  useEffect(() => {
    setDisplayName(record.displayName);
    setPhone(record.phone);
    setBio(record.bio);
    setEmailAlerts(Boolean(record.emailAlerts));
    setInAppAlerts(Boolean(record.inAppAlerts));
    setTheme(record.theme === "dark" ? "dark" : "light");
  }, [record]);

  async function handleSaveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await runAction(
      "Save changes",
      async () => {
        const body = {
          displayName: displayName.trim(),
          preferredName: displayName.trim(),
          phone: phone.trim(),
          bio: bio.trim(),
        };
        try {
          await employeeApi.settings.patch(body);
        } catch {
          await employeeApi.profile.patch(body);
        }
        await refetch();
      },
      "Profile changes saved",
    );
  }

  async function handleUploadPhoto(file: File | undefined) {
    if (!file) return;
    await runAction(
      "Upload photo",
      async () => {
        await profileApi.uploadAvatar(file);
        await refetch();
      },
      "Photo updated",
    );
  }

  async function handleSaveNotifications(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await runAction(
      "Save notifications",
      async () => {
        await notificationsApi.preferences.update({
          email: emailAlerts,
          inApp: inAppAlerts,
        });
        await refetch();
      },
      "Notification preferences saved",
    );
  }

  async function handleSaveAppearance(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await runAction(
      "Save appearance",
      async () => {
        await employeeApi.settings.patch({ theme, preferences: { theme } });
        await refetch();
      },
      "Appearance saved",
    );
  }

  async function handleChangePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (updatingPassword) return;
    const policyError = passwordPolicyError(newPassword);
    if (policyError) {
      await runAction("Change password", async () => {
        throw new Error(policyError);
      }).catch(() => undefined);
      return;
    }
    setUpdatingPassword(true);
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
        },
        "Password updated",
      );
    } catch {
      return;
    } finally {
      setUpdatingPassword(false);
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.topBar}>
        <PageDateLabel />
        {loading ? <p className={styles.empty}>Loading settings…</p> : null}
        {error ? (
          <p className={styles.empty} role="alert">
            {error}
          </p>
        ) : null}
        <div className={styles.topActions}>
          <label className={styles.search}>
            <Search size={14} />
            <input aria-label="Search" placeholder="Search" readOnly />
            <kbd>⌘ K</kbd>
          </label>
          <NotificationsLink className={styles.iconButton} />
          <ProfileLink className={styles.profileButton}>
            {user?.initials || record.initials || "—"}
          </ProfileLink>
        </div>
      </header>

      <div className={styles.heading}>
        <p>Settings</p>
        <h1>Your settings</h1>
        <span>
          Manage your profile, notifications, security and preferences
          {record.workEmail ? ` — ${record.workEmail}` : ""}.
        </span>
      </div>

      <div className={styles.layout}>
        <nav className={styles.sectionNav} aria-label="Settings sections">
          {sections.map((item) => {
            const Icon = item.icon;
            const active = section === item.id;
            return (
              <button
                key={item.id}
                type="button"
                className={active ? styles.sectionActive : ""}
                onClick={() => setSection(item.id)}
              >
                <Icon size={16} strokeWidth={active ? 2.25 : 1.75} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className={styles.content}>
          {section === "profile" ? (
            <>
              <section className={styles.card}>
                <p className={styles.cardEyebrow}>Avatar</p>
                <div className={styles.avatarRow}>
                  {record.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={record.photoUrl}
                      alt=""
                      className={styles.avatar}
                    />
                  ) : (
                    <span className={styles.avatar}>{record.initials}</span>
                  )}
                  <div>
                    <strong>{record.displayName || record.fullName || "—"}</strong>
                    <p>{record.workEmail || "—"}</p>
                    <button
                      type="button"
                      className={styles.uploadButton}
                      onClick={() => photoInput.current?.click()}
                    >
                      Upload photo
                    </button>
                    <input
                      ref={photoInput}
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={(event) => {
                        void handleUploadPhoto(event.target.files?.[0]);
                        event.target.value = "";
                      }}
                    />
                  </div>
                </div>
              </section>

              <form className={styles.card} onSubmit={handleSaveProfile}>
                <p className={styles.cardEyebrow}>Editable details</p>
                <label className={styles.field}>
                  <span>Display name</span>
                  <input
                    value={displayName}
                    onChange={(event) => setDisplayName(event.target.value)}
                  />
                </label>
                <label className={styles.field}>
                  <span>Phone number</span>
                  <input
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    placeholder="+234 800 000 0000"
                  />
                </label>
                <label className={styles.field}>
                  <span>Bio (optional)</span>
                  <textarea
                    value={bio}
                    onChange={(event) => setBio(event.target.value)}
                    placeholder="A short note about yourself."
                    rows={3}
                  />
                </label>
                <div className={styles.cardActions}>
                  <button type="submit" className={styles.saveButton}>
                    <Save size={14} />
                    Save changes
                  </button>
                </div>
              </form>

              <section className={styles.card}>
                <p className={styles.cardEyebrow}>HR-managed details</p>
                <p className={styles.cardHint}>
                  These are controlled by HR and cannot be self-edited.
                </p>
                <dl className={styles.readonlyList}>
                  <div>
                    <dt>Full name</dt>
                    <dd>{record.fullName || "—"}</dd>
                  </div>
                  <div>
                    <dt>Work email</dt>
                    <dd>{record.workEmail || "—"}</dd>
                  </div>
                  <div>
                    <dt>Job title</dt>
                    <dd>{record.jobTitle || "—"}</dd>
                  </div>
                  <div>
                    <dt>Department</dt>
                    <dd>{record.department || "—"}</dd>
                  </div>
                  <div>
                    <dt>Role</dt>
                    <dd>{record.role || "Employee"}</dd>
                  </div>
                </dl>
                <p className={styles.footerNote}>
                  Need a change? Contact HR — you cannot approve your own record
                  updates.
                </p>
              </section>
            </>
          ) : null}

          {section === "notifications" ? (
            <form className={styles.card} onSubmit={handleSaveNotifications}>
              <p className={styles.cardEyebrow}>Notifications</p>
              <p className={styles.cardHint}>
                Choose how Afresh tells you about approvals and workspace alerts.
              </p>
              <label className={styles.checkRow}>
                <input
                  type="checkbox"
                  checked={emailAlerts}
                  onChange={(event) => setEmailAlerts(event.target.checked)}
                />
                Email notifications
              </label>
              <label className={styles.checkRow}>
                <input
                  type="checkbox"
                  checked={inAppAlerts}
                  onChange={(event) => setInAppAlerts(event.target.checked)}
                />
                In-app notifications
              </label>
              <div className={styles.cardActions}>
                <button type="submit" className={styles.saveButton}>
                  <Save size={14} />
                  Save changes
                </button>
              </div>
            </form>
          ) : null}

          {section === "security" ? (
            <form className={styles.card} onSubmit={handleChangePassword}>
              <p className={styles.cardEyebrow}>Security</p>
              <p className={styles.cardHint}>
                Change the password you use to sign in. Use at least 10
                characters, with uppercase, lowercase, a number, and a symbol.
              </p>
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
                  minLength={10}
                  required
                />
              </label>
              <div className={styles.cardActions}>
                <button
                  type="submit"
                  className={styles.saveButton}
                  disabled={updatingPassword}
                >
                  <Save size={14} />
                  {updatingPassword ? "Updating…" : "Update password"}
                </button>
              </div>
            </form>
          ) : null}

          {section === "appearance" ? (
            <form className={styles.card} onSubmit={handleSaveAppearance}>
              <p className={styles.cardEyebrow}>Appearance</p>
              <p className={styles.cardHint}>
                Choose how the employee workspace looks on this device.
              </p>
              <label className={styles.field}>
                <span>Theme</span>
                <select
                  value={theme}
                  onChange={(event) => setTheme(event.target.value)}
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </label>
              <div className={styles.cardActions}>
                <button type="submit" className={styles.saveButton}>
                  <Save size={14} />
                  Save changes
                </button>
              </div>
            </form>
          ) : null}

          {section === "privacy" ? (
            <section className={styles.card}>
              <p className={styles.cardEyebrow}>Privacy</p>
              <p className={styles.cardHint}>
                Official employment data is visible to HR and your HOD. You can
                edit only the personal fields on the Profile tab.
              </p>
              <dl className={styles.readonlyList}>
                <div>
                  <dt>Profile visibility</dt>
                  <dd>Your team and HR</dd>
                </div>
                <div>
                  <dt>HR record</dt>
                  <dd>Managed by HR</dd>
                </div>
              </dl>
              <p className={styles.footerNote}>
                Need a change? Contact HR — you cannot approve your own record
                updates.
              </p>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}
