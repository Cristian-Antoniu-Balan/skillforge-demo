import "server-only";

import { createHash } from "crypto";

import type { UIMessage } from "ai";

import { getMessageText } from "@/lib/message-utils";

/**
 * Cheie = provider + model + system prompt + hash pe mesaje.
 * System prompt-ul include profilul → doi utilizatori diferiți nu împart niciodată un răspuns.
 * Asta e intenționat: cache-ul previne retrimiteri identice, nu e mecanism de reducere a costului.
 */
export function buildChatCacheKey(options: {
  providerId: string;
  modelId: string;
  systemPrompt: string;
  messages: UIMessage[];
}): string {
  const messageFingerprint = options.messages.map(message => `${message.role}:${getMessageText(message)}`).join("\n");

  const hash = createHash("sha256").update(options.systemPrompt).update("\0").update(messageFingerprint).digest("hex");

  return `${options.providerId}:${options.modelId}:${hash}`;
}
