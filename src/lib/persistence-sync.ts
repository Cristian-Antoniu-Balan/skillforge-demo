/**
 * Sincronizare store → API când baza e activă.
 * Eșecurile se loghează; UI-ul rămâne optimistic (ca la 1.6 pe local).
 */
import type { ChatUIMessage } from "@/lib/cost";
import { isClientPersistenceEnabled } from "@/lib/persistence-mode";
import type { Profile } from "@/lib/types";

async function postJson(url: string, init?: RequestInit) {
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    }
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    console.error(`[persistence] ${init?.method ?? "GET"} ${url}`, response.status, text);
    return false;
  }
  return true;
}

export async function syncCreateConversation(conversation: {
  id: string;
  title: string;
  technologyId?: string | null;
  createdAt: string;
  updatedAt: string;
}) {
  if (!isClientPersistenceEnabled()) return;
  await postJson("/api/conversations", {
    method: "POST",
    body: JSON.stringify(conversation)
  });
}

export async function syncPatchConversation(patch: { id: string; title?: string; technologyId?: string | null }) {
  if (!isClientPersistenceEnabled()) return;
  await postJson("/api/conversations", {
    method: "PATCH",
    body: JSON.stringify(patch)
  });
}

export async function syncDeleteConversation(id: string) {
  if (!isClientPersistenceEnabled()) return;
  await postJson(`/api/conversations?id=${encodeURIComponent(id)}`, { method: "DELETE" });
}

export async function syncConversationMessages(conversationId: string, messages: ChatUIMessage[]) {
  if (!isClientPersistenceEnabled()) return;
  await postJson(`/api/conversations/${encodeURIComponent(conversationId)}/messages`, {
    method: "PUT",
    body: JSON.stringify({ messages })
  });
}

export async function syncProfile(profile: Profile) {
  if (!isClientPersistenceEnabled()) return;
  await postJson("/api/profile", {
    method: "PUT",
    body: JSON.stringify(profile)
  });
}
