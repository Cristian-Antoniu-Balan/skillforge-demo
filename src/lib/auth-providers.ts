/**
 * Registru UI al furnizorilor de autentificare — nu un lanț de if-uri.
 * `id` trebuie să coincidă cu id-ul din next-auth/providers (github, google).
 * Google e deja complet (siglă + id); activarea = enabled: true + env AUTH_GOOGLE_*.
 */

export type AuthProviderId = "github" | "google";

export type AuthUiProvider = {
  id: AuthProviderId;
  name: string;
  /** false = vizibil dar neclickabil („urmează”). */
  enabled: boolean;
  /** Etichetă afișată când enabled e false. */
  comingSoonLabel?: string;
};

export const AUTH_UI_PROVIDERS: AuthUiProvider[] = [
  {
    id: "github",
    name: "GitHub",
    enabled: true
  },
  {
    id: "google",
    name: "Google",
    // Inactiv pe moment — sigla și id-ul sunt gata; flip + env când îl activăm.
    enabled: false,
    comingSoonLabel: "Urmează"
  }
];
