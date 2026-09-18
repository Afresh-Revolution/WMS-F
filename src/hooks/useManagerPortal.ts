"use client";

import { usePathname } from "next/navigation";
import { isManagerPath } from "@/lib/portalPaths";

export function useManagerPortal() {
  return isManagerPath(usePathname());
}
