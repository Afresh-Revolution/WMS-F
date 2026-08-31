"use client";

import { useCallback } from "react";
import { downloadCsv } from "@/lib/export/downloadCsv";
import { useAppUi } from "@/components/layout/AppUiProvider";

export function usePageActions() {
  const { showToast } = useAppUi();

  const runAction = useCallback(
    async (
      label: string,
      action: () => Promise<void>,
      successMessage?: string,
    ) => {
      try {
        await action();
        showToast(successMessage ?? `${label} completed`, "success");
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Something went wrong";
        showToast(`${label} failed — ${message}`, "error");
        throw error;
      }
    },
    [showToast],
  );

  const exportRows = useCallback(
    (rows: Record<string, unknown>[], filename: string) => {
      if (rows.length === 0) {
        showToast("Nothing to export", "info");
        return;
      }
      downloadCsv(rows, filename);
      showToast("Export downloaded", "success");
    },
    [showToast],
  );

  return { showToast, runAction, exportRows };
}
