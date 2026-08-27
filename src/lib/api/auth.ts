const TOKEN_STORAGE_KEY = "wms_access_token";

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;

  return (
    window.localStorage.getItem(TOKEN_STORAGE_KEY) ??
    window.sessionStorage.getItem(TOKEN_STORAGE_KEY)
  );
}

export function setAccessToken(token: string, persist = true): void {
  if (typeof window === "undefined") return;

  const store = persist ? window.localStorage : window.sessionStorage;
  store.setItem(TOKEN_STORAGE_KEY, token);
}

export function clearAccessToken(): void {
  if (typeof window === "undefined") return;

  window.localStorage.removeItem(TOKEN_STORAGE_KEY);
  window.sessionStorage.removeItem(TOKEN_STORAGE_KEY);
}
