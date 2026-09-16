import "server-only";

// Interfața e migrabilă la un cache extern (Redis etc.) fără a atinge apelanții:
// doar get/set — fără TTL/eviction în semnătură (ale implementării).
//
// De ce include system prompt-ul în cheie (vezi buildCacheKey): profilul utilizatorului
// intră în system prompt. Fără el, doi utilizatori ar putea împărți același răspuns —
// scurgere de date, nu optimizare. Rata de nimeriri e mică pe bună dreptate:
// cache-ul protejează de retrimiteri identice, nu reduce costul mediu.

export interface CacheStore<T> {
  get(key: string): T | undefined;
  set(key: string, value: T): void;
}

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

/**
 * Cache în memorie cu plafon de intrări și TTL.
 * Nu e o măsură de securitate și nu e partajat între instanțe Vercel —
 * la cold start se golește; pe mai multe instanțe fiecare are propria hartă.
 */
export function createMemoryCache<T>(options: { maxEntries: number; ttlMs: number }): CacheStore<T> {
  const store = new Map<string, CacheEntry<T>>();

  function evictExpired(now: number) {
    for (const [key, entry] of store) {
      if (entry.expiresAt <= now) {
        store.delete(key);
      }
    }
  }

  function evictOldestIfNeeded() {
    while (store.size > options.maxEntries) {
      const oldestKey = store.keys().next().value;
      if (oldestKey === undefined) break;
      store.delete(oldestKey);
    }
  }

  return {
    get(key: string) {
      const now = Date.now();
      const entry = store.get(key);
      if (!entry) return undefined;
      if (entry.expiresAt <= now) {
        store.delete(key);
        return undefined;
      }
      // Re-inserare: Map păstrează ordinea de inserare → LRU simplu la eviction.
      store.delete(key);
      store.set(key, entry);
      return entry.value;
    },
    set(key: string, value: T) {
      const now = Date.now();
      evictExpired(now);
      store.delete(key);
      store.set(key, { value, expiresAt: now + options.ttlMs });
      evictOldestIfNeeded();
    }
  };
}

/** Textul final al răspunsului — un stream nu se poate salva; la hit se redă ca stream. */
export interface CachedChatResponse {
  text: string;
}

/** Instanta folosită de /api/chat — schimbabilă ulterior fără a modifica ruta. */
export const chatResponseCache = createMemoryCache<CachedChatResponse>({
  maxEntries: 100,
  // 10 minute: suficient pentru retrimiteri accidentale, scurt ca să nu țină răspunsuri învechite.
  ttlMs: 10 * 60 * 1000
});
