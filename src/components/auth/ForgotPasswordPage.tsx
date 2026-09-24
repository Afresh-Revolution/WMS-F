"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { authApi } from "@/lib/api";
import { AuthShell } from "@/components/auth/AuthShell";
import styles from "./LoginPage.module.css";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await authApi.forgotPassword({ email });
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send reset email");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell>
      <header className={styles.formHeader}>
        <p className={styles.formEyebrow}>Afresh workspace</p>
        <h2 className={styles.formTitle}>Reset your password</h2>
        <p className={styles.formSubtitle}>
          {sent
            ? "If that account exists, a reset link is on its way."
            : "We'll send a secure reset link to your work email."}
        </p>
      </header>

      <form className={styles.form} onSubmit={(event) => void handleSubmit(event)}>
        <label className={styles.field}>
          <span className={styles.label}>Work email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="maya.chen@afresh.co"
            className={`${styles.input} ${styles.inputPill}`}
            autoComplete="email"
          />
        </label>

        {error ? (
          <p className={styles.error} role="alert">
            {error}
          </p>
        ) : null}

        <button type="submit" className={styles.primaryButton} disabled={loading}>
          {loading ? "Sending…" : "Send reset link"}
          {!loading ? <ChevronRight size={18} strokeWidth={2.25} aria-hidden /> : null}
        </button>
      </form>

      <p className={styles.remembered}>
        Remembered it?{" "}
        <Link href="/" className={styles.textLink}>
          Back to sign in
        </Link>
      </p>
    </AuthShell>
  );
}
