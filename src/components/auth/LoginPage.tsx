"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import {
  authApi,
  ApiError,
  getSessionToken,
  DEFAULT_LOGIN_OPTIONS,
  type LoginOptions,
} from "@/lib/api";
import { CHANGE_PASSWORD_PATH, homePathForRole } from "@/lib/auth/portals";
import {
  cacheCurrentUser,
  parseAuthUser,
  readCachedOrJwtUser,
} from "@/lib/currentUser";
import { AuthShell } from "@/components/auth/AuthShell";
import styles from "./LoginPage.module.css";

export function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<LoginOptions>(DEFAULT_LOGIN_OPTIONS);
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaCode, setMfaCode] = useState("");
  const [challengeToken, setChallengeToken] = useState("");

  async function goToWorkspace() {
    let user = readCachedOrJwtUser();
    try {
      const me = await authApi.me();
      const parsed = parseAuthUser(me);
      if (parsed) {
        cacheCurrentUser(parsed);
        user = parsed;
      }
    } catch {
      /* Use the cached/JWT identity if /auth/me is unavailable. */
    }
    router.replace(
      user?.mustChangePassword
        ? CHANGE_PASSWORD_PATH
        : homePathForRole(user?.role ?? ""),
    );
  }

  useEffect(() => {
    if (!getSessionToken()) return;
    void goToWorkspace();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  useEffect(() => {
    let active = true;
    void authApi.loginOptions().then((next) => {
      if (active) setOptions(next);
    });
    return () => {
      active = false;
    };
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (mfaRequired) {
        await authApi.verifyMfa({ code: mfaCode, challengeToken });
      } else {
        const response = await authApi.login({
          email,
          password,
          keepMeSignedIn: remember,
        });
        if (response.mfaRequired) {
          setMfaRequired(true);
          setChallengeToken(response.challengeToken ?? "");
          setLoading(false);
          return;
        }
      }

      if (remember) {
        localStorage.setItem("wms_remember_me", "1");
      } else {
        localStorage.removeItem("wms_remember_me");
      }

      await goToWorkspace();
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 0) {
          setError(err.message);
        } else {
          setError(err.message || `Sign in failed (${err.status}).`);
        }
      } else {
        setError(err instanceof Error ? err.message : "Authentication failed");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell>
      <header className={styles.formHeader}>
        <p className={styles.formEyebrow}>Afresh workspace</p>
        <h2 className={styles.formTitle}>Welcome back</h2>
        <p className={styles.formSubtitle}>
          Sign in to continue to your workspace.
        </p>
      </header>

      <form className={styles.form} onSubmit={(event) => void handleSubmit(event)}>
        {mfaRequired ? (
          <label className={styles.field}>
            <span className={styles.label}>Authentication code</span>
            <input
              type="text"
              inputMode="numeric"
              required
              value={mfaCode}
              onChange={(event) => setMfaCode(event.target.value)}
              placeholder="123456"
              className={styles.input}
              autoComplete="one-time-code"
            />
          </label>
        ) : (
          <>
            <label className={styles.field}>
              <span className={styles.label}>Work email</span>
              <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="maya.chen@afresh.co"
                className={styles.input}
                autoComplete="email"
              />
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Password</span>
              <input
                type="password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••••••"
                className={styles.input}
                autoComplete="current-password"
              />
            </label>
          </>
        )}

        <div className={styles.formRow}>
          {options.keepMeSignedInEnabled ? (
            <label className={styles.checkbox}>
              <input
                type="checkbox"
                checked={remember}
                onChange={(event) => setRemember(event.target.checked)}
              />
              <span>Keep me signed in</span>
            </label>
          ) : (
            <span />
          )}
          <Link href="/forgot-password" className={styles.textLink}>
            Forgot password?
          </Link>
        </div>

        {error ? (
          <p className={styles.error} role="alert">
            {error}
          </p>
        ) : null}

        <button type="submit" className={styles.primaryButton} disabled={loading}>
          {loading
            ? "Please wait…"
            : mfaRequired
              ? "Verify code"
              : "Sign in to Afresh"}
          {!loading ? (
            <ChevronRight size={18} strokeWidth={2.25} aria-hidden />
          ) : null}
        </button>
      </form>
    </AuthShell>
  );
}
