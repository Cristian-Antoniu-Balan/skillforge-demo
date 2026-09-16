"use client";

/**
 * Context: „e autentificarea configurată?” — răspuns citit o dată pe server, coborât în arbore.
 * Nu e state care se schimbă; e configurație. Profilul e în registru de secțiuni, deci props
 * ar strica semnătura — contextul e al doilea rost al lui useContext (după temă).
 */
import { createContext, useContext, type ReactNode } from "react";
import { SessionProvider } from "next-auth/react";

const AuthConfiguredContext = createContext(false);

export function useAuthConfigured(): boolean {
  return useContext(AuthConfiguredContext);
}

type AuthProvidersProps = {
  /** Vine din server (isAuthConfigured) — browserul nu citește process.env pentru secrete. */
  configured: boolean;
  children: ReactNode;
};

/**
 * SessionProvider doar când auth e configurat.
 * Hook-ul useSession nu se poate apela condiționat — deci componentele care îl folosesc
 * se montează doar pe ramura cu provider (vezi sidebar / email profil).
 */
export function AuthProviders({ configured, children }: AuthProvidersProps) {
  return (
    <AuthConfiguredContext.Provider value={configured}>
      {configured ? <SessionProvider>{children}</SessionProvider> : children}
    </AuthConfiguredContext.Provider>
  );
}
