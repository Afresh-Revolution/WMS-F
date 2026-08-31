"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, Shield } from "lucide-react";
import { authApi, getAccessToken } from "@/lib/api";
import styles from "./LoginPage.module.css";

function LoginBrandMark() {
  return (
    <div className={styles.brandLogo} aria-label="Afresh">
      <span className={styles.brandMark} aria-hidden>
        A
      </span>
      <span className={styles.brandWordmark}>afresh</span>
    </div>
  );
}

function SsoMark() {
  return <span className={styles.ssoMark} aria-hidden>A</span>;
}

export function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkingBootstrap, setCheckingBootstrap] = useState(true);
  const [needsBootstrap, setNeedsBootstrap] = useState(false);
  const [apiUnavailable, setApiUnavailable] = useState(false);
  const [name, setName] = useState("");

  const apiRoot =
    process.env.NEXT_PUBLIC_API_ROOT_URL ?? "http://localhost:3001";

  useEffect(() => {
    if (getAccessToken()) {
      router.replace("/dashboard");
      return;
    }

    authApi
      .bootstrapStatus()
      .then((status) => {
        setApiUnavailable(false);
        setNeedsBootstrap(!status.complete);
      })
      .catch(() => {
        setApiUnavailable(true);
        setNeedsBootstrap(true);
      })
      .finally(() => setCheckingBootstrap(false));
  }, [router]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (needsBootstrap) {
        await authApi.bootstrap({
          email,
          password,
          name: name || undefined,
        });
      } else {
        await authApi.login({ email, password });
      }

      if (remember) {
        localStorage.setItem("wms_remember_me", "1");
      } else {
        localStorage.removeItem("wms_remember_me");
      }

      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  }

  if (checkingBootstrap) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingShell}>
          <p className={styles.loadingText}>Loading workspace…</p>
        </div>
      </div>
    );
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
              <h2 className={styles.formTitle}>
                {needsBootstrap ? "Set up your workspace" : "Welcome back"}
              </h2>
              <p className={styles.formSubtitle}>
                {needsBootstrap
                  ? "Create the first Super Admin account to get started."
                  : "Sign in to continue to your workspace."}
              </p>
            </header>

            {apiUnavailable ? (
              <div className={styles.apiNotice} role="status">
                <p className={styles.apiNoticeTitle}>Backend not reachable</p>
                <p className={styles.apiNoticeText}>
                  Start the API server at{" "}
                  <code className={styles.apiNoticeCode}>{apiRoot}</code>, then
                  refresh this page. Login requests are proxied through Next.js
                  to that URL (see <code className={styles.apiNoticeCode}>.env</code>
                  ).
                </p>
              </div>
            ) : null}

            <form className={styles.form} onSubmit={(event) => void handleSubmit(event)}>
              {needsBootstrap ? (
                <label className={styles.field}>
                  <span className={styles.label}>Full name</span>
                  <input
                    type="text"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Christy Ishaku"
                    className={styles.input}
                    autoComplete="name"
                  />
                </label>
              ) : null}

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
                  autoComplete={
                    needsBootstrap ? "new-password" : "current-password"
                  }
                />
              </label>

              {!needsBootstrap ? (
                <div className={styles.formRow}>
                  <label className={styles.checkbox}>
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={(event) => setRemember(event.target.checked)}
                    />
                    <span>Keep me signed in</span>
                  </label>
                  <Link href="/help" className={styles.textLink}>
                    Forgot password?
                  </Link>
                </div>
              ) : null}

              {error ? (
                <p className={styles.error} role="alert">
                  {error}
                </p>
              ) : null}

              <button type="submit" className={styles.primaryButton} disabled={loading}>
                {loading
                  ? "Please wait…"
                  : needsBootstrap
                    ? "Create workspace"
                    : "Sign in to Afresh"}
                {!loading && !needsBootstrap ? (
                  <ChevronRight size={18} strokeWidth={2.25} aria-hidden />
                ) : null}
              </button>
            </form>

            {!needsBootstrap ? (
              <>
                <div className={styles.divider}>
                  <span>or</span>
                </div>

                <button
                  type="button"
                  className={styles.ssoButton}
                  onClick={() => {
                    setError("SSO is not configured for this environment yet.");
                  }}
                >
                  <SsoMark />
                  Continue with SSO
                </button>

                <p className={styles.support}>
                  Need help?{" "}
                  <Link href="/help" className={styles.textLink}>
                    Contact support
                  </Link>
                </p>
              </>
            ) : null}
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
