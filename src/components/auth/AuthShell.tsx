import { Shield } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
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

export function AuthShell({ children }: { children: ReactNode }) {
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
          <div className={styles.formInner}>{children}</div>

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
