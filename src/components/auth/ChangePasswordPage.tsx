"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { authApi, profileApi, ApiError } from "@/lib/api";
import { homePathForRole } from "@/lib/auth/portals";
import {
  cacheCurrentUser,
  parseAuthUser,
  readCachedOrJwtUser,
} from "@/lib/currentUser";
import { AuthGate } from "./AuthGate";
import styles from "./LoginPage.module.css";

function ChangePasswordForm() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const user = readCachedOrJwtUser();

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (newPassword !== confirmPassword) {
      setError("The new passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      try {
        await authApi.changePassword({ currentPassword, newPassword });
      } catch (error) {
        if (error instanceof ApiError && (error.status === 404 || error.status === 405)) {
          await profileApi.changePassword({ currentPassword, newPassword });
        } else {
          throw error;
        }
      }
      const next = user ? { ...user, mustChangePassword: false } : null;
      if (next) cacheCurrentUser(next);
      try {
        const me = await authApi.me();
        const parsed = parseAuthUser(me);
        if (parsed) cacheCurrentUser({ ...parsed, mustChangePassword: false });
      } catch {
        /* Cached identity is enough to leave this screen. */
      }
      router.replace(homePathForRole(next?.role ?? user?.role ?? ""));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not change password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <main className={styles.formPanel}>
          <div className={styles.formInner}>
            <header className={styles.formHeader}>
              <p className={styles.formEyebrow}>First sign-in</p>
              <h2 className={styles.formTitle}>Change your password</h2>
              <p className={styles.formSubtitle}>
                Your temporary password is your first name. Choose a new
                password before you continue.
              </p>
            </header>
            <form className={styles.form} onSubmit={(event) => void handleSubmit(event)}>
              <label className={styles.field}>
                <span className={styles.label}>Current password</span>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  className={styles.input}
                  autoComplete="current-password"
                  placeholder="Your first name"
                />
              </label>
              <label className={styles.field}>
                <span className={styles.label}>New password</span>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  className={styles.input}
                  autoComplete="new-password"
                />
              </label>
              <label className={styles.field}>
                <span className={styles.label}>Confirm new password</span>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className={styles.input}
                  autoComplete="new-password"
                />
              </label>
              {error ? (
                <p className={styles.error} role="alert">
                  {error}
                </p>
              ) : null}
              <button type="submit" className={styles.primaryButton} disabled={loading}>
                {loading ? "Saving…" : "Save new password"}
              </button>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}

export function ChangePasswordPage() {
  return (
    <AuthGate>
      <ChangePasswordForm />
    </AuthGate>
  );
}
