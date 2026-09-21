import "server-only";

/**
 * Unirea / crearea profilului la autentificare — un singur loc, trei ramuri explicite.
 * Nu împrăștiem această logică prin UI sau rute de chat.
 *
 * Unirea după email e decizie de securitate, nu comoditate: cine își pune emailul tău
 * la un furnizor pe care încă nu l-ai folosit intră în datele tale. De aceea unim
 * DOAR pe email confirmat de furnizor (vezi isEmailConfirmedByProvider).
 *
 * Emailul se salvează pe profil (readonly în UI), dar NU intră în tipul Profile /
 * system prompt — persistat ≠ trimis la model.
 */
import { getSupabase } from "@/lib/supabase/client";

export interface ResolveIdentityInput {
  provider: string;
  /** Id-ul de la furnizor — text, nu uuid (GitHub = număr). */
  providerAccountId: string;
  email: string | null | undefined;
  /** true doar dacă furnizorul garantează confirmarea adresei. */
  emailConfirmed: boolean;
  /** Nume afișat la creare profil nou — nu e „email în system prompt”. */
  displayName?: string | null;
}

export interface ResolveIdentityResult {
  profileId: string;
  /** Fără email nu există cheie de unire — profil nou; UI trebuie să spună consecința. */
  createdWithoutEmail: boolean;
  /** Identitate nouă legată de un profil existent găsit după email. */
  linkedByEmail: boolean;
}

/**
 * Ce garantează furnizorul (nu presupuneri):
 * - Google: câmpul email_verified din profilul OIDC — unim doar dacă e true.
 * - GitHub: Auth.js citește /user/emails și alege adresa primary+verified; dacă emailul
 *   ajunge pe user, e confirmat. Emailul public neconfirmat / ascuns → lipsește → ramura fără email.
 */
export function isEmailConfirmedByProvider(
  provider: string,
  profile: Record<string, unknown> | undefined | null
): boolean {
  if (!profile) return false;

  if (provider === "google") {
    return profile.email_verified === true;
  }

  if (provider === "github") {
    // Email prezent după pipeline-ul Auth.js = primary verified din /user/emails.
    return typeof profile.email === "string" && profile.email.length > 0;
  }

  // Furnizor necunoscut: nu unim pe email — profil nou pe identitate.
  return false;
}

export async function resolveIdentity(input: ResolveIdentityInput): Promise<ResolveIdentityResult | null> {
  const supabase = getSupabase();
  // Fără bază: autentificarea merge mai departe pe JWT-ul Auth.js (fără proprietar DB).
  if (!supabase) return null;

  const { provider, providerAccountId, email, emailConfirmed, displayName } = input;
  const normalizedEmail = email?.trim() ? email.trim().toLowerCase() : null;

  // --- Ramura 1: identitatea există → folosim profilul ei ---
  const { data: existingIdentity, error: identityError } = await supabase
    .from("identities")
    .select("profile_id")
    .eq("provider", provider)
    .eq("provider_account_id", providerAccountId)
    .maybeSingle();

  if (identityError) {
    console.error("[supabase] resolveIdentity lookup", identityError.message);
    throw new Error("Nu am putut rezolva identitatea.");
  }

  if (existingIdentity?.profile_id) {
    return {
      profileId: existingIdentity.profile_id as string,
      createdWithoutEmail: false,
      linkedByEmail: false
    };
  }

  // --- Ramura 2: email confirmat + profil existent cu același email → legăm identitatea ---
  if (normalizedEmail && emailConfirmed) {
    const { data: existingProfile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (profileError) {
      console.error("[supabase] resolveIdentity email lookup", profileError.message);
      throw new Error("Nu am putut căuta profilul după email.");
    }

    if (existingProfile?.id) {
      const profileId = existingProfile.id as string;
      const { error: linkError } = await supabase.from("identities").insert({
        profile_id: profileId,
        provider,
        provider_account_id: providerAccountId
      });

      if (linkError) {
        console.error("[supabase] resolveIdentity link", linkError.message);
        throw new Error("Nu am putut lega identitatea de profil.");
      }

      return { profileId, createdWithoutEmail: false, linkedByEmail: true };
    }
  }

  // --- Ramura 3: profil nou (+ identitate). Fără email = ramură normală, nu eroare. ---
  const createdWithoutEmail = !normalizedEmail;
  const { data: createdProfile, error: createError } = await supabase
    .from("profiles")
    .insert({
      // Salvăm adresa dacă există (UI readonly); unirea s-a făcut doar pe confirmat, mai sus.
      email: normalizedEmail,
      name: displayName?.trim() || "",
      stack: "",
      skills: [],
      objective: "",
      response_style: "echilibrat"
    })
    .select("id")
    .single();

  if (createError || !createdProfile) {
    console.error("[supabase] resolveIdentity create profile", createError?.message);
    throw new Error("Nu am putut crea profilul.");
  }

  const profileId = createdProfile.id as string;

  const { error: insertIdentityError } = await supabase.from("identities").insert({
    profile_id: profileId,
    provider,
    provider_account_id: providerAccountId
  });

  if (insertIdentityError) {
    console.error("[supabase] resolveIdentity create identity", insertIdentityError.message);
    throw new Error("Nu am putut crea identitatea.");
  }

  return { profileId, createdWithoutEmail, linkedByEmail: false };
}
