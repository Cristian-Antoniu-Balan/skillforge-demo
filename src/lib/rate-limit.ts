import "server-only";

// Protecție de bun-simț, NU măsură de securitate:
// - contorul e în memorie pe proces → pe mai multe instanțe Vercel fiecare numără separat;
// - la repornire / cold start contorul se resetează.
// Scopul: cine ține apăsat pe „mai încearcă" să nu golească creditul într-un minut.

export interface RateLimitResult {
  allowed: boolean;
  /** Momentul (epoch ms) de la care se poate reîncerca — doar când allowed=false. */
  retryAtMs?: number;
  remaining: number;
  limit: number;
}

interface Bucket {
  count: number;
  windowStartMs: number;
}

const buckets = new Map<string, Bucket>();

/** Cereri pe fereastră de 60s — aliniat cu docs provider (limită locală, sub tipicul de tier). */
export const CHAT_RATE_LIMIT_PER_MINUTE = 20;
const WINDOW_MS = 60_000;

export function checkRateLimit(key: string, limit = CHAT_RATE_LIMIT_PER_MINUTE): RateLimitResult {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || now - existing.windowStartMs >= WINDOW_MS) {
    buckets.set(key, { count: 1, windowStartMs: now });
    return { allowed: true, remaining: limit - 1, limit };
  }

  if (existing.count >= limit) {
    return {
      allowed: false,
      retryAtMs: existing.windowStartMs + WINDOW_MS,
      remaining: 0,
      limit
    };
  }

  existing.count += 1;
  return { allowed: true, remaining: limit - existing.count, limit };
}

/** Cheie stabilă din request — fără auth, IP-ul e cel mai bun proxy pe care îl avem. */
export function rateLimitKeyFromRequest(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return `ip:${first}`;
  }
  return "ip:unknown";
}
