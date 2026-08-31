import { useCallback, useState } from "preact/hooks";

const PREFIX = "helium-start:";

export function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

export function save<T>(key: string, value: T): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // Private browsing or a full quota: the page still works, it just forgets.
  }
}

/**
 * `useState` that reads its initial value from local storage and writes every
 * update back. Every preference on the startpage lives through this hook.
 */
export function usePersistent<T>(
  key: string,
  fallback: T,
  normalize?: (value: T) => T,
): [T, (next: T | ((current: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => {
    const loaded = load(key, fallback);
    return normalize ? normalize(loaded) : loaded;
  });

  const update = useCallback(
    (next: T | ((current: T) => T)) => {
      setValue((current) => {
        const candidate = typeof next === "function" ? (next as (c: T) => T)(current) : next;
        const resolved = normalize ? normalize(candidate) : candidate;
        save(key, resolved);
        return resolved;
      });
    },
    [key, normalize],
  );

  return [value, update];
}
