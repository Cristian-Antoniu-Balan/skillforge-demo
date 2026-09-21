import "server-only";

import type { ChatUIMessage } from "@/lib/cost";
import { getSupabase } from "@/lib/supabase/client";
import {
  conversationFromRows,
  type ConversationRow,
  type MessageRow,
  type StoredConversation
} from "@/lib/supabase/types";

/** Listează conversațiile proprietarului, cu mesajele în ordinea `position`. */
export async function listConversationsForOwner(ownerId: string): Promise<StoredConversation[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  const { data: conversations, error } = await supabase
    .from("conversations")
    .select("*")
    .eq("owner_id", ownerId)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("[supabase] listConversationsForOwner", error.message);
    return [];
  }

  const rows = (conversations ?? []) as ConversationRow[];
  if (rows.length === 0) return [];

  const ids = rows.map(row => row.id);
  const { data: messages, error: messagesError } = await supabase
    .from("messages")
    .select("*")
    .eq("owner_id", ownerId)
    .in("conversation_id", ids)
    .order("position", { ascending: true });

  if (messagesError) {
    console.error("[supabase] listConversationsForOwner messages", messagesError.message);
    return rows.map(row => conversationFromRows(row, []));
  }

  const byConversation = new Map<string, MessageRow[]>();
  for (const message of (messages ?? []) as MessageRow[]) {
    const list = byConversation.get(message.conversation_id) ?? [];
    list.push(message);
    byConversation.set(message.conversation_id, list);
  }

  return rows.map(row => conversationFromRows(row, byConversation.get(row.id) ?? []));
}

export async function getConversationForOwner(
  ownerId: string,
  conversationId: string
): Promise<StoredConversation | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data: conversation, error } = await supabase
    .from("conversations")
    .select("*")
    .eq("owner_id", ownerId)
    .eq("id", conversationId)
    .maybeSingle();

  if (error) {
    console.error("[supabase] getConversationForOwner", error.message);
    return null;
  }
  if (!conversation) return null;

  const { data: messages, error: messagesError } = await supabase
    .from("messages")
    .select("*")
    .eq("owner_id", ownerId)
    .eq("conversation_id", conversationId)
    .order("position", { ascending: true });

  if (messagesError) {
    console.error("[supabase] getConversationForOwner messages", messagesError.message);
    return conversationFromRows(conversation as ConversationRow, []);
  }

  return conversationFromRows(conversation as ConversationRow, (messages ?? []) as MessageRow[]);
}

export async function upsertConversationForOwner(
  ownerId: string,
  conversation: {
    id: string;
    title: string;
    technologyId?: string | null;
    createdAt?: string;
    updatedAt?: string;
  }
): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;

  const now = new Date().toISOString();

  // Nu folosim upsert pe id: la conflict, un update care atinge owner_id ar fura conversația.
  const { data: existing, error: lookupError } = await supabase
    .from("conversations")
    .select("id, owner_id")
    .eq("id", conversation.id)
    .maybeSingle();

  if (lookupError) {
    console.error("[supabase] upsertConversationForOwner lookup", lookupError.message);
    return false;
  }

  if (existing) {
    if (existing.owner_id !== ownerId) {
      console.error("[supabase] upsertConversationForOwner denied — alt proprietar");
      return false;
    }
    const { error } = await supabase
      .from("conversations")
      .update({
        title: conversation.title,
        technology_id: conversation.technologyId ?? null,
        updated_at: conversation.updatedAt ?? now
      })
      .eq("id", conversation.id)
      .eq("owner_id", ownerId);

    if (error) {
      console.error("[supabase] upsertConversationForOwner update", error.message);
      return false;
    }
    return true;
  }

  const { error } = await supabase.from("conversations").insert({
    id: conversation.id,
    owner_id: ownerId,
    title: conversation.title,
    technology_id: conversation.technologyId ?? null,
    created_at: conversation.createdAt ?? now,
    updated_at: conversation.updatedAt ?? now
  });

  if (error) {
    console.error("[supabase] upsertConversationForOwner insert", error.message);
    return false;
  }
  return true;
}

export async function updateConversationMetaForOwner(
  ownerId: string,
  conversationId: string,
  patch: {
    title?: string;
    technologyId?: string | null;
    summary?: string | null;
    summaryUntilPosition?: number | null;
  }
): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;

  const update: Record<string, unknown> = {
    updated_at: new Date().toISOString()
  };
  if (patch.title !== undefined) update.title = patch.title;
  if (patch.technologyId !== undefined) update.technology_id = patch.technologyId;
  if (patch.summary !== undefined) update.summary = patch.summary;
  if (patch.summaryUntilPosition !== undefined) {
    update.summary_until_position = patch.summaryUntilPosition;
  }

  const { data, error } = await supabase
    .from("conversations")
    .update(update)
    .eq("owner_id", ownerId)
    .eq("id", conversationId)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("[supabase] updateConversationMetaForOwner", error.message);
    return false;
  }
  // Fără rând întors = id inexistent sau alt owner — nu e succes silențios.
  return data !== null;
}

export async function deleteConversationForOwner(ownerId: string, conversationId: string): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;

  const { error } = await supabase.from("conversations").delete().eq("owner_id", ownerId).eq("id", conversationId);

  if (error) {
    console.error("[supabase] deleteConversationForOwner", error.message);
    return false;
  }
  return true;
}

/**
 * Înlocuiește lista de mesaje a conversației (edit/regenerate taie firul).
 * Filtrăm pe owner la delete + insert — service role fără filtru = scurgere.
 * Dacă POST-ul de create încă n-a ajuns (race la primul mesaj), creăm rândul aici
 * tot pe ownerId din sesiune — nu pe un id „orfan”.
 */
export async function replaceMessagesForOwner(
  ownerId: string,
  conversationId: string,
  messages: ChatUIMessage[]
): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;

  const { data: owned, error: ownedError } = await supabase
    .from("conversations")
    .select("id")
    .eq("owner_id", ownerId)
    .eq("id", conversationId)
    .maybeSingle();

  if (ownedError) {
    console.error("[supabase] replaceMessagesForOwner ownership", ownedError.message);
    return false;
  }

  if (!owned) {
    const created = await upsertConversationForOwner(ownerId, {
      id: conversationId,
      title: "Conversație nouă"
    });
    if (!created) return false;
  }

  const { error: deleteError } = await supabase
    .from("messages")
    .delete()
    .eq("owner_id", ownerId)
    .eq("conversation_id", conversationId);

  if (deleteError) {
    console.error("[supabase] replaceMessagesForOwner delete", deleteError.message);
    return false;
  }

  if (messages.length === 0) {
    await supabase
      .from("conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("owner_id", ownerId)
      .eq("id", conversationId);
    return true;
  }

  const rows = messages.map((message, index) => ({
    id: message.id,
    conversation_id: conversationId,
    owner_id: ownerId,
    role: message.role,
    parts: message.parts,
    metadata: message.metadata ?? null,
    position: index,
    created_at: new Date().toISOString()
  }));

  const { error: insertError } = await supabase.from("messages").insert(rows);
  if (insertError) {
    console.error("[supabase] replaceMessagesForOwner insert", insertError.message);
    return false;
  }

  await supabase
    .from("conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("owner_id", ownerId)
    .eq("id", conversationId);

  return true;
}
