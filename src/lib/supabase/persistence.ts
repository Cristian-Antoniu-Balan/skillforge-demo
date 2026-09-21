import "server-only";

import { isAuthConfigured } from "@/lib/auth";
import { getSupabase, hasSupabaseEnv } from "@/lib/supabase/client";

/**
 * Persistența cere autentificarea configurată: fără proprietar din sesiune,
 * baza nu are cui să-i atribuie rândurile. Lipsa e stare tratată, nu excepție —
 * aplicația revine la stocarea locală.
 */
export function isPersistenceConfigured(): boolean {
  return isAuthConfigured() && hasSupabaseEnv() && getSupabase() !== null;
}
