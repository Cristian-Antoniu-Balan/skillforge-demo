// Registrul de providere — SINGURA listă. Un provider nou = o intrare aici.
// Fișierul ajunge în browser (composer, preferințe, store). De aceea:
// - fără process.env, fără chei, fără SDK-uri de provider;
// - doar metadate de afișat (nume, id-uri de modele, numele variabilei de env).
// Instantierea modelului stă în providers.server.ts (doar pe server).

export type ProviderId = "anthropic" | "openai";

/** Prețuri per milion de tokeni — fără dată de verificare, prețul e greșit peste șase luni fără să știe nimeni de când. */
export interface ModelPricing {
  inputPerMillionUsd: number;
  outputPerMillionUsd: number;
  /** ISO date (YYYY-MM-DD) când cifrele au fost citite din documentația oficială. */
  verifiedAt: string;
}

export interface ProviderDefinition {
  id: ProviderId;
  name: string;
  /** Id-uri oficiale din documentația providerului — nu inventate din memorie. */
  models: readonly string[];
  /** Modelul folosit când clientul trimite un id necunoscut / vechi din localStorage. */
  defaultModelId: string;
  /** Doar numele variabilei — niciodată valoarea. Browserul o arată în mesajul „neconfigurat". */
  envKey: string;
  /** Aceleași cifre ca în docs/<provider>/README.md — un singur set, ca să nu se contrazică. */
  pricingByModel: Readonly<Record<string, ModelPricing>>;
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
    envKey: "ANTHROPIC_API_KEY",
    // Surse: platform.claude.com/docs/en/about-claude/pricing (verificat 2026-09-16)
    pricingByModel: {
      "claude-haiku-4-5": {
        inputPerMillionUsd: 1,
        outputPerMillionUsd: 5,
        verifiedAt: "2026-09-16"
      },
      "claude-sonnet-4-20250514": {
        inputPerMillionUsd: 3,
        outputPerMillionUsd: 15,
        verifiedAt: "2026-09-16"
      }
    }
  },
  {
    id: "openai",
    name: "OpenAI",
    // Id-uri din platform.openai.com/docs/models (verificat 2026-09-14):
    // Luna = cost-sensitiv (analog Haiku); Terra = echilibru inteligență/cost.
    models: ["gpt-4o-mini", "gpt-5.6-luna", "gpt-5.6-terra"],
    defaultModelId: "gpt-4o-mini",
    envKey: "OPENAI_API_KEY",
    // Surse: developers.openai.com/api/docs/pricing (verificat 2026-09-16)
    pricingByModel: {
      "gpt-4o-mini": {
        inputPerMillionUsd: 0.15,
        outputPerMillionUsd: 0.6,
        verifiedAt: "2026-09-16"
      },
      "gpt-5.6-luna": {
        inputPerMillionUsd: 0.2,
        outputPerMillionUsd: 1.2,
        verifiedAt: "2026-09-16"
      },
      "gpt-5.6-terra": {
        inputPerMillionUsd: 2,
        outputPerMillionUsd: 12,
        verifiedAt: "2026-09-16"
      }
    }
  }
] as const;

export const DEFAULT_PROVIDER_ID: ProviderId = PROVIDERS[0].id;
export const DEFAULT_CHAT_MODEL = PROVIDERS[0].defaultModelId;

export function getProvider(providerId: string): ProviderDefinition | undefined {
  return PROVIDERS.find(provider => provider.id === providerId);
}

/** Prețul modelului din registru — lipsa înseamnă cost necunoscut, nu $0. */
export function getModelPricing(providerId: string, modelId: string): ModelPricing | undefined {
  const provider = getProvider(providerId);
  if (!provider) return undefined;
  return provider.pricingByModel[modelId];
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
