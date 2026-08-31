"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api";
import styles from "./LoginPage.module.css";

export function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkingBootstrap, setCheckingBootstrap] = useState(true);
  const [needsBootstrap, setNeedsBootstrap] = useState(false);
  const [name, setName] = useState("");

  useEffect(() => {
    authApi
      .bootstrapStatus()
      .then((status) => setNeedsBootstrap(!status.complete))
      .catch(() => setNeedsBootstrap(false))
      .finally(() => setCheckingBootstrap(false));
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (needsBootstrap) {
        await authApi.bootstrap({ email, password, name: name || undefined });
      } else {
        await authApi.login({ email, password });
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
        <p>Checking setup status…</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <form className={styles.card} onSubmit={(e) => void handleSubmit(e)}>
        <p className={styles.eyebrow}>Afresh WMS</p>
        <h1 className={styles.title}>
          {needsBootstrap ? "Create Super Admin" : "Sign in"}
        </h1>
        <p className={styles.subtitle}>
          {needsBootstrap
            ? "Set up the first Super Admin account for this workspace."
            : "Use your Super Admin credentials to access the dashboard."}
        </p>

        {needsBootstrap ? (
          <label className={styles.field}>
            <span>Name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
            />
          </label>
        ) : null}

        <label className={styles.field}>
          <span>Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
          />
        </label>

        <label className={styles.field}>
          <span>Password</span>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </label>

        {error ? (
          <p className={styles.error} role="alert">
            {error}
          </p>
        ) : null}

        <button type="submit" className={styles.button} disabled={loading}>
          {loading
            ? "Please wait…"
            : needsBootstrap
              ? "Create account"
              : "Sign in"}
        </button>
      </form>
    </div>
  );
}
