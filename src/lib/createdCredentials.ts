export type CreatedCredentials = {
  name: string;
  email: string;
  password: string;
};

const STORAGE_KEY = "wms_created_employee_password";

type Listener = () => void;

let credentials: CreatedCredentials | null = readFromStorage();
const listeners = new Set<Listener>();

function readFromStorage(): CreatedCredentials | null {
  if (typeof window === "undefined") return null;
  for (const storage of [window.sessionStorage, window.localStorage]) {
    try {
      const raw = storage.getItem(STORAGE_KEY);
      if (!raw) continue;
      const parsed = JSON.parse(raw) as CreatedCredentials;
      if (parsed?.password) return parsed;
    } catch {
      /* ignore */
    }
  }
  return null;
}

function writeToStorage(next: CreatedCredentials | null) {
  if (typeof window === "undefined") return;
  for (const storage of [window.sessionStorage, window.localStorage]) {
    try {
      if (next) storage.setItem(STORAGE_KEY, JSON.stringify(next));
      else storage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }
}

function notify() {
  for (const listener of listeners) listener();
}

export function getCreatedCredentials() {
  return credentials;
}

export function showCreatedCredentials(next: CreatedCredentials) {
  credentials = next;
  writeToStorage(next);
  notify();
}

export function clearCreatedCredentials() {
  credentials = null;
  writeToStorage(null);
  notify();
}

export function subscribeCreatedCredentials(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
