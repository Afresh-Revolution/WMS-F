"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AuthGate } from "@/components/auth/AuthGate";
import { Sidebar } from "./Sidebar";
import { MobileHeader } from "./MobileHeader";
import { AppUiProvider, useAppUi } from "./AppUiProvider";
import styles from "./AppShell.module.css";

function helpHref(pathname: string) {
  if (pathname.startsWith("/employee")) return "/employee/help";
  if (pathname.startsWith("/secretary")) return "/secretary/help";
  if (pathname.startsWith("/manager")) return "/manager/help";
  if (pathname.startsWith("/accountant")) return "/accountant/help";
  if (pathname.startsWith("/nysc")) return "/nysc/help";
  return "/help";
}

function ShellInner({ children }: { children: React.ReactNode }) {
  const { sidebarOpen, setSidebarOpen, toggleSidebar } = useAppUi();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "?") return;
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable='true']")) {
        return;
      }
      event.preventDefault();
      const href = helpHref(pathname);
      if (pathname === href) {
        document.getElementById("help-search")?.focus();
        return;
      }
      router.push(href);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [pathname, router]);

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
