import { NextResponse } from "next/server";

import { auth, isAuthConfigured } from "@/lib/auth";
import { listConversationsForOwner } from "@/lib/supabase/conversations";
import { isPersistenceConfigured } from "@/lib/supabase/persistence";
import { getProfileForOwner } from "@/lib/supabase/profiles";

export const runtime = "nodejs";

/**
 * Bootstrap client: știe dacă baza e activă + încarcă profilul și conversațiile contului.
 * Fără migrare din localStorage — baza pornește goală pe cont (istoricul din browser
 * nu se preia: nu are proprietar; un import ar da datele oricui se autentifică primul).
 */
export async function GET() {
  const persistenceEnabled = isPersistenceConfigured();

  if (!persistenceEnabled) {
    return NextResponse.json({
      persistenceEnabled: false,
      signedIn: false,
      profile: null,
      conversations: [],
      createdWithoutEmail: false
    });
  }

  if (!isAuthConfigured()) {
    return NextResponse.json({
      persistenceEnabled: true,
      signedIn: false,
      profile: null,
      conversations: [],
      createdWithoutEmail: false
    });
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({
      persistenceEnabled: true,
      signedIn: false,
      profile: null,
      conversations: [],
      createdWithoutEmail: false
    });
  }

  const ownerId = session.user.id;
  const [profile, conversations] = await Promise.all([getProfileForOwner(ownerId), listConversationsForOwner(ownerId)]);

  return NextResponse.json({
    persistenceEnabled: true,
    signedIn: true,
    profile,
    conversations: conversations.map(conversation => ({
      id: conversation.id,
      title: conversation.title,
      messages: conversation.messages,
      technologyId: conversation.technologyId,
      summary: conversation.summary,
      summaryUntilPosition: conversation.summaryUntilPosition,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt
    })),
    createdWithoutEmail: session.user.createdWithoutEmail === true || !session.user.email
  });
}
