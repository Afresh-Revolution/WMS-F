"use client";

import { useLayoutEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getSessionToken } from "@/lib/api";

const publicShellPaths = ["/sign-out"];

export function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isPublic = publicShellPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
  const [ready, setReady] = useState(false);

  useLayoutEffect(() => {
    if (isPublic || getSessionToken()) {
      setReady(true);
      return;
    }

    router.replace("/");
  }, [isPublic, pathname, router]);

  if (!ready) {
    return null;
  }

  return children;
}
