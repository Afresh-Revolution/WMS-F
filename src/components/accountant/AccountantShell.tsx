"use client";

import { AuthGate } from "@/components/auth/AuthGate";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { AppUiProvider, useAppUi } from "@/components/layout/AppUiProvider";
import { AccountantSidebar } from "./AccountantSidebar";
import styles from "./AccountantShell.module.css";

function ShellInner({ children }: { children: React.ReactNode }) {
  const { sidebarOpen, setSidebarOpen, toggleSidebar } = useAppUi();

  return (
    <div className={styles.shell}>
      <MobileHeader open={sidebarOpen} onToggle={toggleSidebar} />
      <div
        className={`${styles.backdrop} ${sidebarOpen ? styles.backdropVisible : ""}`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden={!sidebarOpen}
      />
      <AccountantSidebar
        open={sidebarOpen}
        onNavigate={() => setSidebarOpen(false)}
      />
      <main className={styles.main}>{children}</main>
    </div>
  );
}

export function AccountantShell({ children }: { children: React.ReactNode }) {
  return (
    <AppUiProvider>
      <AuthGate>
        <ShellInner>{children}</ShellInner>
      </AuthGate>
    </AppUiProvider>
  );
}
