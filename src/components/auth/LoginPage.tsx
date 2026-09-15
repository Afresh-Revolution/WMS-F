"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, Shield } from "lucide-react";
import { authApi, ApiError, getSessionToken } from "@/lib/api";
import { homePathForRole } from "@/lib/auth/portals";
import {
  cacheCurrentUser,
  parseAuthUser,
  readCachedOrJwtUser,
} from "@/lib/currentUser";
import styles from "./LoginPage.module.css";

function LoginBrandMark() {
  return (
    <img
      className={styles.brandLogo}
      src="/afresh-logo.png"
      alt="AfrESH"
      width={1024}
      height={279}
    />
  );
}

export function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaCode, setMfaCode] = useState("");
  const [challengeToken, setChallengeToken] = useState("");
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

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
    router.replace(homePathForRole(user?.role ?? ""));
  }

  useEffect(() => {
    if (!getSessionToken()) return;
    void goToWorkspace();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (mfaRequired) {
        await authApi.verifyMfa({ code: mfaCode, challengeToken });
      } else {
        const response = await authApi.login({ email, password });
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
    <div className={styles.page}>
      <div className={styles.shell}>
        <aside className={styles.brandPanel} aria-hidden={false}>
          <div className={styles.rings} aria-hidden>
            <span className={styles.ring} />
            <span className={styles.ring} />
          </div>

          <LoginBrandMark />

          <div className={styles.brandCopy}>
            <p className={styles.brandEyebrow}>Work, made whole</p>
            <h1 className={styles.brandTitle}>The staff side of progress.</h1>
            <p className={styles.brandDescription}>
              One considered workspace for every person, process, and important
              moment at work.
            </p>
          </div>

          <p className={styles.brandSecure}>
            <Shield size={15} strokeWidth={1.75} />
            Secure workforce management
          </p>
        </aside>

        <main className={styles.formPanel}>
          <div className={styles.formInner}>
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
                <label className={styles.checkbox}>
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(event) => setRemember(event.target.checked)}
                  />
                  <span>Keep me signed in</span>
                </label>
                <button
                  type="button"
                  className={styles.textLink}
                  onClick={() => {
                    setForgotOpen(true);
                    setForgotSent(false);
                    setError(null);
                  }}
                >
                  Forgot password?
                </button>
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

            {forgotOpen ? (
              <form
                className={styles.form}
                onSubmit={(event) => {
                  event.preventDefault();
                  void (async () => {
                    setLoading(true);
                    setError(null);
                    try {
                      await authApi.forgotPassword({ email });
                      setForgotSent(true);
                    } catch (err) {
                      setError(
                        err instanceof Error
                          ? err.message
                          : "Could not send reset email",
                      );
                    } finally {
                      setLoading(false);
                    }
                  })();
                }}
              >
                <label className={styles.field}>
                  <span className={styles.label}>Reset email</span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="maya.chen@afresh.co"
                    className={styles.input}
                  />
                </label>
                {forgotSent ? (
                  <p className={styles.formSubtitle}>
                    If that account exists, a reset link is on its way.
                  </p>
                ) : null}
                <button type="submit" className={styles.primaryButton} disabled={loading}>
                  {loading ? "Sending…" : "Send reset link"}
                </button>
              </form>
            ) : null}

            <p className={styles.support}>
              Need help?{" "}
              <Link href="/help" className={styles.textLink}>
                Contact support
              </Link>
            </p>
          </div>

          <footer className={styles.legal}>
            <span>© 2026 Afresh</span>
            <span aria-hidden>·</span>
            <Link href="/help">Privacy</Link>
            <span aria-hidden>·</span>
            <Link href="/help">Terms</Link>
          </footer>
        </main>
      </div>
    </div>
  );
}
