// Registrul de providere — SINGURA listă. Un provider nou = o intrare aici.
// Fișierul ajunge în browser (composer, preferințe, store). De aceea:
// - fără process.env, fără chei, fără SDK-uri de provider;
// - doar metadate de afișat (nume, id-uri de modele, numele variabilei de env).
// Instantierea modelului stă în providers.server.ts (doar pe server).

export type ProviderId = "anthropic" | "openai";

export interface ProviderDefinition {
  id: ProviderId;
  name: string;
  /** Id-uri oficiale din documentația providerului — nu inventate din memorie. */
  models: readonly string[];
  /** Modelul folosit când clientul trimite un id necunoscut / vechi din localStorage. */
  defaultModelId: string;
  /** Doar numele variabilei — niciodată valoarea. Browserul o arată în mesajul „neconfigurat". */
  envKey: string;
}

/**
 * Ordinea = ordinea din UI. Anthropic rămâne primul: pe creditele lui rulează cursul.
 * OpenAI e al doilea — testul abstracției: adăugat fără if-uri în composer.
 */
export const PROVIDERS: readonly ProviderDefinition[] = [
  {
    id: "anthropic",
    name: "Anthropic",
    // Documentație Anthropic / AI SDK — aceleași id-uri ca în Faza 1.3
    models: ["claude-haiku-4-5", "claude-sonnet-4-20250514"],
    defaultModelId: "claude-haiku-4-5",
    envKey: "ANTHROPIC_API_KEY"
  },
  {
    id: "openai",
    name: "OpenAI",
    // Id-uri din platform.openai.com/docs/models (verificat 2026-09-14):
    // Luna = cost-sensitiv (analog Haiku); Terra = echilibru inteligență/cost.
    models: ["gpt-4o-mini", "gpt-5.6-luna", "gpt-5.6-terra"],
    defaultModelId: "gpt-4o-mini",
    envKey: "OPENAI_API_KEY"
  }
] as const;

export const DEFAULT_PROVIDER_ID: ProviderId = PROVIDERS[0].id;
export const DEFAULT_CHAT_MODEL = PROVIDERS[0].defaultModelId;

export function getProvider(providerId: string): ProviderDefinition | undefined {
  return PROVIDERS.find(provider => provider.id === providerId);
}

/** True doar dacă id-ul e în registru pentru acel provider — altfel e stare veche / cerere fabricată. */
export function isKnownModel(providerId: string, modelId: string): boolean {
  const provider = getProvider(providerId);
  if (!provider) return false;
  return (provider.models as readonly string[]).includes(modelId);
}

/**
 * Normalizează selecția înainte de apelul LLM.
 * Provider necunoscut → Anthropic; model necunoscut → default-ul providerului rezolvat.
 * Nu propagăm id-uri inventate către SDK (arată ca bug de cod, deși e date greșite).
 */
export function resolveSelection(
  providerId: string | undefined,
  modelId: string | undefined
): { providerId: ProviderId; modelId: string } {
  const provider = getProvider(providerId ?? "") ?? getProvider(DEFAULT_PROVIDER_ID)!;
  const resolvedModel =
    modelId && (provider.models as readonly string[]).includes(modelId) ? modelId : provider.defaultModelId;
  return { providerId: provider.id, modelId: resolvedModel };
}

/** Payload de afișat în UI — serverul decide `configured`; clientul nu citește env. */
export interface ProviderAvailability {
  id: ProviderId;
  configured: boolean;
  /** Motiv lizibil când e dezactivat — niciodată valoarea cheii. */
  reason?: string;
}
