import "server-only";

import { auth, isAuthConfigured } from "@/lib/auth";
import { isPersistenceConfigured } from "@/lib/supabase/persistence";

export class PersistenceAuthError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

/**
 * Proprietarul pentru rutele de date: profiles.id din sesiune.
 * Persistența fără sesiune = 401; fără config = null (caller revine la local).
 */
export async function requireOwnerId(): Promise<string | null> {
  if (!isPersistenceConfigured()) {
    return null;
  }

  if (!isAuthConfigured()) {
    return null;
  }

  const session = await auth();
  if (!session?.user?.id) {
    throw new PersistenceAuthError("Trebuie să te autentifici pentru datele din cont.", 401);
  }

  return session.user.id;
}
