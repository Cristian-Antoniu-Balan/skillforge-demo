// Endpoint-ul chat — providerul e ales din body; cheile rămân pe server.
// Citim env doar prin providers.server (nu la import) ca build-ul să treacă fără .env.local.
import { convertToModelMessages, streamText, type UIMessage } from "ai";

import {
  getModel,
  getUnconfiguredMessage,
  isProviderConfigured,
  ProviderNotConfiguredError
} from "@/lib/providers.server";
import { DEFAULT_PROVIDER_ID, resolveSelection } from "@/lib/providers";
import { buildSystemPrompt } from "@/lib/system-prompt";
import type { Profile } from "@/lib/types";

export const runtime = "nodejs";

function providerErrorMessage(error: unknown) {
  if (error == null) return "Eroare necunoscută de la provider.";
  if (typeof error === "string") return error;
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    if (message.includes("rate") || message.includes("429")) {
      return "Limită de cereri atinsă la provider. Încearcă din nou peste puțin timp.";
    }
    if (message.includes("authentication") || message.includes("api key") || message.includes("401")) {
      return "Cheia API este invalidă sau a fost revocată. Verifică variabila din Vercel / .env.local și fă Redeploy dacă ai schimbat-o pe Vercel.";
    }
    return error.message;
  }
  return "Eroare la generarea răspunsului.";
}

export async function POST(req: Request) {
  const body = (await req.json()) as {
    messages: UIMessage[];
    profile?: Profile;
    providerId?: string;
    model?: string;
  };

  // Valori curente de la client, normalizate contra registru (localStorage vechi / cerere manuală).
  const selection = resolveSelection(body.providerId ?? DEFAULT_PROVIDER_ID, body.model);

  // Fără cheie ≠ excepție neașteptată: e stare normală → 400 lizibil, ca în Faza 1.3.
  if (!isProviderConfigured(selection.providerId)) {
    return Response.json({ error: getUnconfiguredMessage(selection.providerId) }, { status: 400 });
  }

  let model;
  try {
    model = getModel(selection.providerId, selection.modelId);
  } catch (error) {
    if (error instanceof ProviderNotConfiguredError) {
      return Response.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }

  const result = streamText({
    model,
    system: buildSystemPrompt(body.profile),
    messages: await convertToModelMessages(body.messages)
  });

  return result.toUIMessageStreamResponse({
    onError: providerErrorMessage
  });
}
