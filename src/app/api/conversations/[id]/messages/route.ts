import { NextResponse } from "next/server";

import type { ChatUIMessage } from "@/lib/cost";
import { replaceMessagesForOwner } from "@/lib/supabase/conversations";
import { maybeRefreshConversationSummary } from "@/lib/supabase/memory";
import { requireOwnerId, PersistenceAuthError } from "@/lib/supabase/owner";
import { isPersistenceConfigured } from "@/lib/supabase/persistence";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * Salvează arhiva completă (UI) și, după scriere, reîmprospătează rezumatul dacă e cazul.
 * Rezumatul e după răspuns — utilizatorul nu așteaptă un al doilea apel înainte de primul token.
 */
export async function PUT(req: Request, context: RouteContext) {
  if (!isPersistenceConfigured()) {
    return NextResponse.json({ error: "Persistența nu e configurată." }, { status: 503 });
  }

  try {
    const ownerId = await requireOwnerId();
    if (!ownerId) {
      return NextResponse.json({ error: "Neautentificat." }, { status: 401 });
    }

    const { id: conversationId } = await context.params;
    const body = (await req.json()) as { messages?: ChatUIMessage[] };
    const messages = Array.isArray(body.messages) ? body.messages : [];

    const ok = await replaceMessagesForOwner(ownerId, conversationId, messages);
    if (!ok) {
      return NextResponse.json({ error: "Nu am putut salva mesajele." }, { status: 404 });
    }

    // Fire-and-forget din perspectiva UX: așteptăm aici ca serverless să nu moară prematur,
    // dar clientul a primit deja stream-ul terminat înainte de acest PUT.
    await maybeRefreshConversationSummary(ownerId, conversationId);

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof PersistenceAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
