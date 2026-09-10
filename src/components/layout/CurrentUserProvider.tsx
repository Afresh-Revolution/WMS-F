"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { authApi } from "@/lib/api";
import {
  cacheCurrentUser,
  parseAuthUser,
  readCachedOrJwtUser,
  type CurrentUser,
} from "@/lib/currentUser";

type CurrentUserContextValue = {
  user: CurrentUser | null;
  ready: boolean;
};

const CurrentUserContext = createContext<CurrentUserContextValue>({
  user: null,
  ready: false,
});

export function CurrentUserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const cached = readCachedOrJwtUser();
    if (cached) {
      setUser(cached);
      setReady(true);
    }

    let cancelled = false;

    async function load() {
      try {
        const me = await authApi.me();
        const parsed = parseAuthUser(me);
        if (parsed && !cancelled) {
          cacheCurrentUser(parsed);
          setUser(parsed);
        }
      } catch {
        /* Keep cached or JWT identity if /me is unavailable. */
      } finally {
        if (!cancelled) setReady(true);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <CurrentUserContext.Provider value={{ user, ready }}>
      {children}
    </CurrentUserContext.Provider>
  );
}

export function useCurrentUser() {
  return useContext(CurrentUserContext);
}
