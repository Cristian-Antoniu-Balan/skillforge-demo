import "server-only";

/**
 * Memorie pentru model: ultimele N mesaje + rezumatul celor mai vechi.
 * UI-ul arată conversația întreagă — aici tăiem doar ce pleacă la LLM (cost + context).
 *
 * Rezumatul se generează O DATĂ și se salvează pe conversație; se actualizează doar
 * când istoricul a mai crescut cu N mesaje. Recalcularea la fiecare mesaj = două
 * apeluri la model per întrebare — exact costul pe care rezumatul trebuia să-l reducă.
 *
 * Ce se pierde: detaliile din mesajele vechi (nume exacte, citate). Utilizatorul le
 * vede în UI; modelul nu.
 */
import { generateText, type UIMessage } from "ai";

import { getMessageText } from "@/lib/message-utils";
import { DEFAULT_CHAT_MODEL, DEFAULT_PROVIDER_ID } from "@/lib/providers";
import { getModel, isProviderConfigured } from "@/lib/providers.server";
import { getConversationForOwner, updateConversationMetaForOwner } from "@/lib/supabase/conversations";

/** Câte mesaje recente rămân complete către model. */
export const MEMORY_WINDOW_SIZE = 20;

export interface MemoryForModel {
  /** Mesajele din fereastra recentă (complete). */
  recentMessages: UIMessage[];
  /** Text de injectat în system prompt; null dacă totul încape în fereastră. */
  summaryForPrompt: string | null;
}

export function buildMemoryForModel(
  messages: UIMessage[],
  summary: string | null,
  summaryUntilPosition: number | null
): MemoryForModel {
  if (messages.length <= MEMORY_WINDOW_SIZE) {
    return { recentMessages: messages, summaryForPrompt: null };
  }

  const recentMessages = messages.slice(-MEMORY_WINDOW_SIZE);
  // Folosim rezumatul doar dacă acoperă (măcar) ce e în afara ferestrei.
  const olderCount = messages.length - MEMORY_WINDOW_SIZE;
  const hasUsableSummary =
    typeof summary === "string" &&
    summary.trim().length > 0 &&
    summaryUntilPosition !== null &&
    summaryUntilPosition >= olderCount - 1;

  return {
    recentMessages,
    summaryForPrompt: hasUsableSummary ? summary.trim() : summary?.trim() || null
  };
}

/** True când e cazul să (re)generăm rezumatul după ce răspunsul s-a terminat. */
export function shouldRefreshSummary(messageCount: number, summaryUntilPosition: number | null): boolean {
  if (messageCount <= MEMORY_WINDOW_SIZE) return false;

  const olderCount = messageCount - MEMORY_WINDOW_SIZE;
  // Nimic rezumat încă, dar avem mesaje în afara ferestrei.
  if (summaryUntilPosition === null) return olderCount > 0;

  // Actualizăm când au mai apărut cel puțin N mesaje noi față de ultimul rezumat.
  const newlyOlder = olderCount - (summaryUntilPosition + 1);
  return newlyOlder >= MEMORY_WINDOW_SIZE;
}

function formatMessagesForSummary(messages: UIMessage[]): string {
  return messages
    .map((message, index) => {
      const role = message.role === "user" ? "Utilizator" : "Asistent";
      const text = getMessageText(message).trim() || "(gol)";
      return `[${index}] ${role}: ${text}`;
    })
    .join("\n\n");
}

async function generateConversationSummary(olderMessages: UIMessage[]): Promise<string | null> {
  if (olderMessages.length === 0) return null;

  const providerId = DEFAULT_PROVIDER_ID;
  if (!isProviderConfigured(providerId)) {
    console.info("[memory] skip summary — provider neconfigurat");
    return null;
  }

  try {
    const model = getModel(providerId, DEFAULT_CHAT_MODEL);
    const { text } = await generateText({
      model,
      system: `Rezumă conversația de mai jos pentru un mentor de carieră tech.
Păstrează: obiective menționate, skill-uri, decizii, progres, constrângeri.
Omite formulările de politețe. Maxim 400 de cuvinte. Limba: română.`,
      prompt: formatMessagesForSummary(olderMessages)
    });
    return text.trim() || null;
  } catch (error) {
    console.error("[memory] generateConversationSummary", error);
    return null;
  }
}

/**
 * Rulează DUPĂ stream (utilizatorul vede deja primul răspuns).
 * Nu blochează trimiterea tokenilor.
 */
export async function maybeRefreshConversationSummary(ownerId: string, conversationId: string): Promise<void> {
  const conversation = await getConversationForOwner(ownerId, conversationId);
  if (!conversation) return;

  if (!shouldRefreshSummary(conversation.messages.length, conversation.summaryUntilPosition)) {
    return;
  }

  const older = conversation.messages.slice(0, -MEMORY_WINDOW_SIZE);
  const summary = await generateConversationSummary(older);
  if (!summary) return;

  const summaryUntilPosition = older.length - 1;
  await updateConversationMetaForOwner(ownerId, conversationId, {
    summary,
    summaryUntilPosition
  });
}

/** Fragment de system prompt: ce știe modelul din conversațiile vechi — mutată în buildSystemPrompt. */
export function formatSummaryForSystemPrompt(summary: string): string {
  return [
    "Rezumat al mesajelor mai vechi din această conversație",
    "(detaliile complete rămân în UI; tu primești doar acest rezumat + mesajele recente):",
    summary
  ].join("\n");
}
