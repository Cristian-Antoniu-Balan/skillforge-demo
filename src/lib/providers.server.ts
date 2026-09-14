// Strat server-only: chei + instanțiere SDK.
// getModel e SINGURUL loc din aplicație care alege pachetul providerului —
// UI-ul și ruta de chat nu știu de @ai-sdk/anthropic vs @ai-sdk/openai.
import "server-only";

import { anthropic } from "@ai-sdk/anthropic";
import { openai } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";

import { getProvider, resolveSelection, type ProviderAvailability, PROVIDERS } from "@/lib/providers";

function envValue(envKey: string): string | undefined {
  // Citire la apel, nu la import — build-ul trece și fără .env.local.
  const value = process.env[envKey];
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export function isProviderConfigured(providerId: string): boolean {
  const provider = getProvider(providerId);
  if (!provider) return false;
  return envValue(provider.envKey) !== undefined;
}

/** Mesaj pentru UI / 400 — spune ce lipsește, fără a expune valoarea. */
export function getUnconfiguredMessage(providerId: string): string {
  const provider = getProvider(providerId);
  const envKey = provider?.envKey ?? "API_KEY";
  const name = provider?.name ?? providerId;
  return `Provider neconfigurat. Lipsește ${envKey} pentru ${name} — seteaz-o în Vercel (Production + Preview) sau în .env.local; vezi docs/${providerId}/README.md.`;
}

/**
 * Disponibilitate ca date de afișat.
 * Clientul nu face Boolean(process.env…) — primește doar configured + reason.
 */
export function listProviderAvailability(): ProviderAvailability[] {
  return PROVIDERS.map(provider => {
    const configured = envValue(provider.envKey) !== undefined;
    if (configured) {
      return { id: provider.id, configured: true };
    }
    return {
      id: provider.id,
      configured: false,
      reason: `Lipsește ${provider.envKey} — seteaz-o în .env.local sau Vercel (Production + Preview).`
    };
  });
}

/**
 * Instantiază modelul din registru.
 * Model necunoscut → default (resolveSelection); provider fără cheie → aruncă (ruta traduce în 400).
 */
export function getModel(providerId: string, modelId: string): LanguageModel {
  const resolved = resolveSelection(providerId, modelId);

  if (!isProviderConfigured(resolved.providerId)) {
    throw new ProviderNotConfiguredError(resolved.providerId);
  }

  // Singurul switch pe provider din toată aplicația — aici merită: fiecare SDK e un pachet diferit.
  const id = resolved.providerId;
  switch (id) {
    case "anthropic":
      return anthropic(resolved.modelId);
    case "openai":
      return openai(resolved.modelId);
    default: {
      const _exhaustive: never = id;
      return _exhaustive;
    }
  }
}

export class ProviderNotConfiguredError extends Error {
  readonly providerId: string;

  constructor(providerId: string) {
    super(getUnconfiguredMessage(providerId));
    this.name = "ProviderNotConfiguredError";
    this.providerId = providerId;
  }
}
