"use client";

import { createContext, useContext, useMemo, useState } from "react";
import { useToast } from "@/hooks/useToast";
import { ToastStack } from "@/components/ui/ToastStack";

type AppUiContextValue = {
  showToast: (text: string, tone?: "success" | "error" | "info") => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
};

const AppUiContext = createContext<AppUiContextValue | null>(null);

export function AppUiProvider({ children }: { children: React.ReactNode }) {
  const { toasts, show, dismiss } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const value = useMemo(
    () => ({
      showToast: show,
      sidebarOpen,
      setSidebarOpen,
      toggleSidebar: () => setSidebarOpen((open) => !open),
    }),
    [show, sidebarOpen],
  );

  return (
    <AppUiContext.Provider value={value}>
      {children}
      <ToastStack toasts={toasts} onDismiss={dismiss} />
    </AppUiContext.Provider>
  );
}

export function useAppUi() {
  const context = useContext(AppUiContext);
  if (!context) {
    throw new Error("useAppUi must be used within AppUiProvider");
  }
  return context;
}
