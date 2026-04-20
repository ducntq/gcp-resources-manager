import { useSyncExternalStore } from "react";

const KEY = "grm.activeProject";
const listeners = new Set<() => void>();

function read() {
  return localStorage.getItem(KEY);
}

function write(id: string | null) {
  if (id) localStorage.setItem(KEY, id);
  else localStorage.removeItem(KEY);
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function useActiveProject(): [string | null, (id: string | null) => void] {
  const value = useSyncExternalStore(subscribe, read, () => null);
  return [value, write];
}
