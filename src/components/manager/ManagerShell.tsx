"use client";

import { usePathname } from "next/navigation";
import { AuthGate } from "@/components/auth/AuthGate";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { AppUiProvider, useAppUi } from "@/components/layout/AppUiProvider";
import { ManagerSidebar } from "./ManagerSidebar";
import { ManagerTopBar } from "./ManagerTopBar";
import styles from "./ManagerShell.module.css";

function hideManagerNavbar(pathname: string) {
  return pathname === "/manager/finance-payroll" ||
    pathname.startsWith("/manager/finance-payroll/");
}

function ShellInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { sidebarOpen, setSidebarOpen, toggleSidebar } = useAppUi();
  const showNavbar = !hideManagerNavbar(pathname);

  return (
    <div className={styles.shell}>
      <MobileHeader open={sidebarOpen} onToggle={toggleSidebar} />
      <div
        className={`${styles.backdrop} ${sidebarOpen ? styles.backdropVisible : ""}`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden={!sidebarOpen}
      />
      <ManagerSidebar
        open={sidebarOpen}
        onNavigate={() => setSidebarOpen(false)}
      />
      <main className={styles.main}>
        {showNavbar ? <ManagerTopBar /> : null}
        {children}
      </main>
    </div>
  );
}

export function ManagerShell({ children }: { children: React.ReactNode }) {
  return (
    <AppUiProvider>
      <AuthGate>
        <ShellInner>{children}</ShellInner>
      </AuthGate>
    </AppUiProvider>
  );
}
