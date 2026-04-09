type CacheEntry<T> = {
  data: T;
  timestamp: number;
  ttl: number; // ms
};

// In-memory cache — lives for the lifetime of the server process
// On Vercel, this resets per cold start but is shared within a warm instance
const store = new Map<string, CacheEntry<unknown>>();

export function getCached<T>(key: string): T | null {
  const entry = store.get(key) as CacheEntry<T> | undefined;
  if (!entry) return null;
  if (Date.now() - entry.timestamp > entry.ttl) {
    store.delete(key);
    return null;
  }
  return entry.data;
}

export function setCached<T>(key: string, data: T, ttlMs: number): void {
  store.set(key, { data, timestamp: Date.now(), ttl: ttlMs });
}

export function bustCache(key: string): void {
  store.delete(key);
}

export function bustAll(): void {
  store.clear();
}

// TTL constants in milliseconds
export const TTL = {
  WEATHER: 60 * 60 * 1000,        // 60 min
  MARKETS: 5 * 60 * 1000,         // 5 min
  NEWS: 30 * 60 * 1000,            // 30 min
  GMAIL: 10 * 60 * 1000,           // 10 min
  CALENDAR: 15 * 60 * 1000,        // 15 min
  TRENDING: 6 * 60 * 60 * 1000,    // 6 hours
} as const;
