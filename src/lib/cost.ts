// Un singur loc pentru formula de cost — mesajul și totalul pe conversație citesc de aici.
// Două formule se despart la prima modificare de preț (ex. rotunjiri diferite).
import type { UIMessage } from "ai";

import { getModelPricing, type ProviderId } from "@/lib/providers";

/** Tokeni + costuri atașate pe mesajul assistant după generare. */
export interface ChatMessageMetadata {
  providerId?: ProviderId | string;
  modelId?: string;
  /** undefined = providerul nu a raportat; nu e 0 (0 ar părea „gratis"). */
  inputTokens?: number;
  outputTokens?: number;
  /** Cost calculat la generare, cu prețul de atunci — totalul istoric nu se rescrie la schimbarea tarifelor. */
  inputCostUsd?: number;
  outputCostUsd?: number;
  /** Răspuns redat din cache — fără apel LLM, fără cost nou. */
  fromCache?: boolean;
}

export type ChatUIMessage = UIMessage<ChatMessageMetadata>;

/**
 * Cost USD pentru un număr de tokeni la un preț per milion.
 * Returnează undefined dacă tokenii lipsesc — „necunoscut", nu NaN și nu 0 mincinos.
 */
export function costFromTokens(tokens: number | undefined, pricePerMillionUsd: number): number | undefined {
  if (tokens === undefined) return undefined;
  return (tokens * pricePerMillionUsd) / 1_000_000;
}

/** Calculează costul de intrare/ieșire pentru un model din registru. */
export function calculateMessageCost(options: {
  providerId: string;
  modelId: string;
  inputTokens: number | undefined;
  outputTokens: number | undefined;
}): {
  inputCostUsd: number | undefined;
  outputCostUsd: number | undefined;
} {
  const pricing = getModelPricing(options.providerId, options.modelId);
  if (!pricing) {
    return { inputCostUsd: undefined, outputCostUsd: undefined };
  }

  return {
    inputCostUsd: costFromTokens(options.inputTokens, pricing.inputPerMillionUsd),
    outputCostUsd: costFromTokens(options.outputTokens, pricing.outputPerMillionUsd)
  };
}

/** Suma costurilor pe mesajele assistant; lipsa = necunoscut pe acel mesaj (nu se tratează ca 0). */
export function sumConversationCostUsd(messages: ChatUIMessage[]): number | undefined {
  let total = 0;
  let sawAny = false;

  for (const message of messages) {
    if (message.role !== "assistant") continue;
    const meta = message.metadata;
    if (!meta) continue;

    // Cache hit: cost explicit 0 — îl adunăm ca să nu ascundem totalul.
    if (meta.fromCache) {
      sawAny = true;
      continue;
    }

    const input = meta.inputCostUsd;
    const output = meta.outputCostUsd;
    if (input === undefined && output === undefined) continue;

    sawAny = true;
    if (input !== undefined) total += input;
    if (output !== undefined) total += output;
  }

  return sawAny ? total : undefined;
}

/** Afișare discretă: necunoscut → „—"; zero real → „$0"; altfel câte zecimale cât să fie citibil. */
export function formatUsd(amount: number | undefined): string {
  if (amount === undefined) return "—";
  if (amount === 0) return "$0";
  if (amount < 0.0001) return `$${amount.toFixed(6)}`;
  if (amount < 0.01) return `$${amount.toFixed(4)}`;
  return `$${amount.toFixed(2)}`;
}
