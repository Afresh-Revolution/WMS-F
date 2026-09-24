"use client";

import { useManagerPortal } from "@/hooks/useManagerPortal";

export function HideOnManager({
  children,
}: {
  children: React.ReactNode;
}) {
  if (useManagerPortal()) return null;
  return children;
}
