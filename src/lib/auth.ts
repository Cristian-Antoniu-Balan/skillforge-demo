import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";

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
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

/**
 * Auth.js v5: o singură inițializare → handlers + auth + signIn/signOut.
 * Google e deja în listă (id-ul din librărie); fără AUTH_GOOGLE_* semnează doar GitHub din UI.
 * trustHost: pe Vercel host-ul vine din request, altfel callback-urile eșuează.
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
    session({ session, token }) {
      // Fără adapter/DB, id-ul util e sub-ul din JWT — îl expunem pe sesiune pentru log + UI.
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    }
  }
});
