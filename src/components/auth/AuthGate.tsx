"use client";

import { useLayoutEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { authApi, getSessionToken } from "@/lib/api";
import { homePathForRole, pathAllowedForRole } from "@/lib/auth/portals";
import {
  cacheCurrentUser,
  parseAuthUser,
  readCachedOrJwtUser,
} from "@/lib/currentUser";

const publicShellPaths = ["/sign-out"];

export function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isPublic = publicShellPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
  const [ready, setReady] = useState(false);

  useLayoutEffect(() => {
    let cancelled = false;

    async function gate() {
      if (isPublic) {
        setReady(true);
        return;
      }

      if (!getSessionToken()) {
        router.replace("/");
        return;
      }

      let user = readCachedOrJwtUser();
      if (!user?.role) {
        try {
          const me = await authApi.me();
          const parsed = parseAuthUser(me);
          if (parsed) {
            cacheCurrentUser(parsed);
            user = parsed;
          }
        } catch {
          /* Stay on this route if identity cannot be loaded. */
        }
      }

      if (cancelled) return;

      if (user?.role && !pathAllowedForRole(pathname, user.role)) {
        router.replace(homePathForRole(user.role));
        return;
      }

      setReady(true);
    }

    void gate();
    return () => {
      cancelled = true;
    };
  }, [isPublic, pathname, router]);

  if (!ready) {
    return null;
  }

  return children;
}
