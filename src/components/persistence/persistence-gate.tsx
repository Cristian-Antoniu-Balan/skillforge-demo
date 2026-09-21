"use client";

import { useAuthConfigured } from "@/components/auth/auth-providers";
import { PersistenceBootstrap, PersistenceBootstrapLocal } from "@/components/persistence/persistence-bootstrap";

/**
 * Ramuri separate: useSession doar sub SessionProvider (auth configurat).
 */
export function PersistenceGate({ children }: { children: React.ReactNode }) {
  const authConfigured = useAuthConfigured();
  if (authConfigured) {
    return <PersistenceBootstrap>{children}</PersistenceBootstrap>;
  }
  return <PersistenceBootstrapLocal>{children}</PersistenceBootstrapLocal>;
}
