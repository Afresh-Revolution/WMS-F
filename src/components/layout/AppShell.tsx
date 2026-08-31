<<<<<<< HEAD
import { Sidebar, type SidebarUser, type SidebarVariant } from "./Sidebar";
import styles from "./AppShell.module.css";

export type AppShellVariant = SidebarVariant;
export type AppShellUser = SidebarUser;

export function AppShell({
  children,
  variant = "manager",
  user,
}: {
  children: React.ReactNode;
  variant?: AppShellVariant;
  user?: AppShellUser;
}) {
  return (
    <div className={styles.shell}>
      <Sidebar variant={variant} user={user} />
=======
"use client";

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
>>>>>>> 37eb1224d5b2fc1ab1c618b51d1c98ba658180c9
      <main className={styles.main}>{children}</main>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <AppUiProvider>
      <ShellInner>{children}</ShellInner>
    </AppUiProvider>
  );
}
