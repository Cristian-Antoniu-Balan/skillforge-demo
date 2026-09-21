import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Doar variabilele Supabase — autentificarea se verifică separat (isPersistenceConfigured).
 * Fără import din auth.ts: auth apelează resolveIdentity → client; ciclu la încărcare.
 */
export function hasSupabaseEnv(): boolean {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

let cached: SupabaseClient | null | undefined;

/**
 * Client service-role sau null dacă lipsesc cheile.
 * Gated ca la providere: fără env, null — app-ul rămâne pe localStorage,
 * build-ul și pornirea nu crapă. Nu aruncăm la import.
 *
 * Un singur helper, doar server-side. Cheia de serviciu ocolește RLS complet —
 * de aceea nu există client de browser și niciun NEXT_PUBLIC_ pe secret.
 */
export function getSupabase(): SupabaseClient | null {
  if (cached !== undefined) return cached;

  if (!hasSupabaseEnv()) {
    cached = null;
    return cached;
  }

  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    cached = null;
    return cached;
  }

  // service_role: bypass RLS — fiecare interogare TREBUIE să filtreze pe owner_id.
  cached = createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });

  return cached;
}
