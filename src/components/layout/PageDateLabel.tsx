"use client";

import { useEffect, useState } from "react";
import { formatPageDate, getClientTimeZone } from "@/lib/pageDate";

type PageDateLabelProps = {
  className?: string;
};

export function PageDateLabel({ className }: PageDateLabelProps) {
  const [label, setLabel] = useState("");

  useEffect(() => {
    function update() {
      setLabel(formatPageDate(new Date(), getClientTimeZone()));
    }
    update();
    const interval = window.setInterval(update, 60_000);
    window.addEventListener("focus", update);
    document.addEventListener("visibilitychange", update);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", update);
      document.removeEventListener("visibilitychange", update);
    };
  }, []);

  return (
    <p className={className} suppressHydrationWarning>
      {label || "\u00a0"}
    </p>
  );
}
