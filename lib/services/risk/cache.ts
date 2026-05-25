const TEN_MINUTES_MS = 10 * 60 * 1000;

type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

const store = new Map<string, CacheEntry<unknown>>();

export function get<T>(key: string): T | null {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return entry.value as T;
}

export function set<T>(key: string, value: T, ttlMs: number = TEN_MINUTES_MS) {
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
}

export function clear() {
  store.clear();
}

