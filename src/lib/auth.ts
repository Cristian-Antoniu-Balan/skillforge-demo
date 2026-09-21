import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import type { JWT } from "next-auth/jwt";

import { hasSupabaseEnv } from "@/lib/supabase/client";
import { isEmailConfirmedByProvider, resolveIdentity } from "@/lib/supabase/identities";

/**
 * Autentificarea e opțională la configurare: fără env, aplicația rulează ca înainte.
 * Verificăm explicit — e singura cale ca toată grupa să pornească proiectul.
 */
export function isAuthConfigured(): boolean {
  return Boolean(process.env.AUTH_SECRET && process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET);
}

/**
 * Producție fără variabile de auth: ruta care costă bani trebuie închisă, nu deschisă.
 * (Contrazice „auth opțional în dev” — deci decizia e scrisă lângă verificare, nu presupusă.)
 */
export function mustRequireAuthInProduction(): boolean {
  return process.env.NODE_ENV === "production" && !isAuthConfigured();
}

declare module "next-auth" {
  interface Session {
    user: {
      /** profiles.id când baza e configurată; altfel sub-ul OAuth (fără proprietar DB). */
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      /**
       * Fără email de la furnizor nu există cheie de unire — un al doilea login
       * (alt furnizor / alt browser) poate crea un al doilea profil. Consecința e în UI.
       */
      createdWithoutEmail?: boolean;
    };
  }
}

type AppJWT = JWT & {
  profileId?: string;
  createdWithoutEmail?: boolean;
};

/**
 * Auth.js v5: o singură inițializare → handlers + auth + signIn/signOut.
 * Google e deja în listă (id-ul din librărie); fără AUTH_GOOGLE_* semnează doar GitHub din UI.
 * trustHost: pe Vercel host-ul vine din request, altfel callback-urile eșuează.
 *
 * Proprietarul (profiles.id) se rezolvă aici, la autentificare — un singur loc, trei ramuri
 * (identitate existentă / unire pe email confirmat / profil nou). Nu pe rutele de date.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [
    GitHub,
    // Pregătit pentru activare: același id ca în AUTH_UI_PROVIDERS („google”).
    Google
  ],
  pages: {
    // Nimeni nu aterizează pe ecranul generic englezesc al librăriei.
    signIn: "/",
    error: "/"
  },
  callbacks: {
    async jwt({ token, account, profile, user }) {
      const appToken = token as AppJWT;
      // Doar la semnare: account e setat. Ulterior refolosim profileId din token.
      if (account?.provider && account.providerAccountId) {
        if (hasSupabaseEnv()) {
          const providerProfile = profile as Record<string, unknown> | undefined;
          const emailFromProfile =
            typeof providerProfile?.email === "string"
              ? providerProfile.email
              : typeof user?.email === "string"
                ? user.email
                : null;
          const emailConfirmed = isEmailConfirmedByProvider(account.provider, {
            ...(providerProfile ?? {}),
            email: emailFromProfile
          });

          const resolved = await resolveIdentity({
            provider: account.provider,
            providerAccountId: String(account.providerAccountId),
            email: emailFromProfile,
            emailConfirmed,
            displayName: user?.name ?? (typeof providerProfile?.name === "string" ? providerProfile.name : null)
          });

          if (resolved) {
            // Proprietarul nostru — nu sub-ul GitHub/Google (altfel al doilea furnizor = alt om).
            appToken.profileId = resolved.profileId;
            appToken.createdWithoutEmail = resolved.createdWithoutEmail;
          }
        } else {
          // Fără bază: păstrăm comportamentul 1.12 (id = sub OAuth).
          appToken.profileId = appToken.sub;
        }
      }

      return appToken;
    },
    session({ session, token }) {
      const appToken = token as AppJWT;
      if (session.user) {
        session.user.id = appToken.profileId ?? (appToken.sub as string);
        if (appToken.createdWithoutEmail) {
          session.user.createdWithoutEmail = true;
        }
      }
      return session;
    }
  }
});
