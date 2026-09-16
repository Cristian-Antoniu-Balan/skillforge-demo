import type { NextRequest } from "next/server";

import { handlers, isAuthConfigured } from "@/lib/auth";

/**
 * Catch-all Auth.js — preia tot fluxul de redirectări OAuth.
 * Anularea la furnizor (?error= pe callback) se tratează ÎNAINTE de handlers:
 * altfel librăria aruncă, pierde motivul și te duce pe pagina ei de eroare.
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const path = url.pathname;
  const providerError = url.searchParams.get("error");

  // Callback OAuth cu eroare de la furnizor (ex. Cancel → access_denied).
  if (path.includes("/callback/") && providerError) {
    // O singură linie lizibilă — fără stack; motivul rămâne întreg în URL-ul nostru.
    console.info(`[auth] oauth_provider_error=${providerError}`);

    const home = new URL("/", url.origin);
    home.searchParams.set("authError", providerError);
    const description = url.searchParams.get("error_description");
    if (description) {
      home.searchParams.set("authErrorDescription", description);
    }
    return Response.redirect(home);
  }

  if (!isAuthConfigured()) {
    return Response.json({ error: "Autentificarea nu e configurată pe acest mediu." }, { status: 503 });
  }

  return handlers.GET(req);
}

export async function POST(req: NextRequest) {
  if (!isAuthConfigured()) {
    return Response.json({ error: "Autentificarea nu e configurată pe acest mediu." }, { status: 503 });
  }

  return handlers.POST(req);
}
