import "server-only";

import { getSupabase } from "@/lib/supabase/client";
import { profileFromRow, type ProfileRow, type ResponseStyle, type StoredProfile } from "@/lib/supabase/types";
import type { Profile } from "@/lib/types";

/**
 * Citește profilul proprietarului din sesiune.
 * Fără filtru pe id = scurgere: service role vede tot.
 */
export async function getProfileForOwner(ownerId: string): Promise<StoredProfile | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase.from("profiles").select("*").eq("id", ownerId).maybeSingle();

  if (error) {
    console.error("[supabase] getProfileForOwner", error.message);
    return null;
  }
  if (!data) return null;

  return profileFromRow(data as ProfileRow);
}

/** Actualizează câmpurile de persona — emailul nu se scrie din UI (e al furnizorului). */
export async function updateProfileForOwner(
  ownerId: string,
  profile: Profile & { responseStyle?: ResponseStyle }
): Promise<StoredProfile | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("profiles")
    .update({
      name: profile.name,
      stack: profile.stack,
      skills: profile.skills,
      objective: profile.objective,
      ...(profile.responseStyle ? { response_style: profile.responseStyle } : {})
    })
    .eq("id", ownerId)
    .select("*")
    .maybeSingle();

  if (error) {
    console.error("[supabase] updateProfileForOwner", error.message);
    return null;
  }
  if (!data) return null;

  return profileFromRow(data as ProfileRow);
}
