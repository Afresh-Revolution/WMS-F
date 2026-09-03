"use client";

import { AuthGate } from "@/components/auth/AuthGate";
import { Sidebar } from "./Sidebar";
import { MobileHeader } from "./MobileHeader";
import { AppUiProvider, useAppUi } from "./AppUiProvider";
import styles from "./AppShell.module.css";

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
      <Sidebar open={sidebarOpen} onNavigate={() => setSidebarOpen(false)} />
      <main className={styles.main}>{children}</main>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <AppUiProvider>
      <AuthGate>
        <ShellInner>{children}</ShellInner>
      </AuthGate>
    </AppUiProvider>
  );
}
