"use client";

import { useCallback, useState } from "react";

export type ToastMessage = {
  id: number;
  text: string;
  tone?: "success" | "error" | "info";
};

let toastId = 0;

export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const show = useCallback(
    (text: string, tone: ToastMessage["tone"] = "info") => {
      const id = ++toastId;
      setToasts((current) => [...current, { id, text, tone }]);
      window.setTimeout(() => dismiss(id), 3200);
    },
    [dismiss],
  );

  return { toasts, show, dismiss };
}
