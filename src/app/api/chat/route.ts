// Endpoint-ul chat — providerul e ales din body; cheile rămân pe server.
// Citim env doar prin providers.server (nu la import) ca build-ul să treacă fără .env.local.
import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  generateId,
  streamText,
  type UIMessage
} from "ai";

import { auth, isAuthConfigured, mustRequireAuthInProduction } from "@/lib/auth";
import { chatResponseCache } from "@/lib/cache";
import { buildChatCacheKey } from "@/lib/chat-cache-key";
import { calculateMessageCost, type ChatMessageMetadata } from "@/lib/cost";
import { DEFAULT_PROVIDER_ID, resolveSelection } from "@/lib/providers";
import {
  getModel,
  getUnconfiguredMessage,
  isProviderConfigured,
  ProviderNotConfiguredError
} from "@/lib/providers.server";
import { checkRateLimit, rateLimitKeyFromRequest } from "@/lib/rate-limit";
import { getConversationForOwner } from "@/lib/supabase/conversations";
import { buildMemoryForModel } from "@/lib/supabase/memory";
import { isPersistenceConfigured } from "@/lib/supabase/persistence";
import { getProfileForOwner } from "@/lib/supabase/profiles";
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

function formatRetryTime(retryAtMs: number): string {
  return new Date(retryAtMs).toLocaleTimeString("ro-RO", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
}

/** Redă textul salvat ca stream UI — un stream live nu se poate pune în cache. */
function cachedTextToResponse(text: string, metadata: ChatMessageMetadata) {
  const textId = generateId();
  const stream = createUIMessageStream({
    execute({ writer }) {
      writer.write({ type: "start", messageMetadata: metadata });
      writer.write({ type: "text-start", id: textId });

      // Bucăți mici ca UI-ul să arate streaming, nu un dump instantaneu.
      const chunkSize = 24;
      for (let index = 0; index < text.length; index += chunkSize) {
        writer.write({
          type: "text-delta",
          id: textId,
          delta: text.slice(index, index + chunkSize)
        });
      }

      writer.write({ type: "text-end", id: textId });
      writer.write({ type: "finish", messageMetadata: metadata });
    }
  });

  return createUIMessageStreamResponse({ stream });
}

export async function POST(req: Request) {
  // Verificarea care contează: pe server, înainte de orice apel la model.
  // Un buton ascuns în UI nu protejează — ruta rămâne publică altfel.
  let ownerId: string | null = null;
  if (isAuthConfigured()) {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Trebuie să te autentifici ca să trimiți mesaje către model." }, { status: 401 });
    }
    ownerId = session.user.id;
    // Minim în jurnal: doar id — nici email, nici nume, nici token (jurnalul e text păstrat de altcineva).
    console.info(`[api/chat] userId=${ownerId}`);
  } else if (mustRequireAuthInProduction()) {
    // Producție fără AUTH_*: închidem ruta — altfel cheia de model e cheltuibilă de oricine are link-ul.
    return Response.json(
      {
        error:
          "Autentificarea nu e configurată pe acest mediu de producție. Chat-ul e dezactivat până la setarea variabilelor."
      },
      { status: 503 }
    );
  }
  // Dev fără auth: lăsăm deschis — toată grupa poate rula proiectul fără OAuth.

  // Limită locală înainte de orice lucru scump — mesaj clar, nu eroare tehnică.
  const rate = checkRateLimit(rateLimitKeyFromRequest(req));
  if (!rate.allowed && rate.retryAtMs !== undefined) {
    const retryAt = formatRetryTime(rate.retryAtMs);
    return Response.json(
      {
        error: `Ai atins limita de ${rate.limit} cereri pe minut. Poți reîncerca după ${retryAt}.`
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.max(1, Math.ceil((rate.retryAtMs - Date.now()) / 1000)))
        }
      }
    );
  }

  const body = (await req.json()) as {
    messages: UIMessage[];
    profile?: Profile;
    providerId?: string;
    model?: string;
    conversationId?: string;
    /** trimis de DefaultChatTransport — „regenerate-message" ocolește cache-ul. */
    trigger?: "submit-message" | "regenerate-message";
    /** Override explicit (dacă UI-ul vrea să forțeze ocolirea). */
    skipCache?: boolean;
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

  // Cu baza: profilul din cont (nu din body) — preferințele sunt pe owner, nu pe laptop.
  let profile = body.profile;
  let memorySummary: string | null = null;
  let messagesForModel = body.messages;

  if (isPersistenceConfigured() && ownerId) {
    const storedProfile = await getProfileForOwner(ownerId);
    if (storedProfile) {
      profile = storedProfile;
    }

    // Memorie: UI trimite tot firul; modelul primește fereastra + rezumatul salvat.
    if (body.conversationId) {
      const conversation = await getConversationForOwner(ownerId, body.conversationId);
      const memory = buildMemoryForModel(
        body.messages,
        conversation?.summary ?? null,
        conversation?.summaryUntilPosition ?? null
      );
      messagesForModel = memory.recentMessages;
      memorySummary = memory.summaryForPrompt;
    } else {
      const memory = buildMemoryForModel(body.messages, null, null);
      messagesForModel = memory.recentMessages;
      memorySummary = memory.summaryForPrompt;
    }
  }

  const systemPrompt = buildSystemPrompt(profile, memorySummary);
  // „Mai încearcă" trebuie să cheme modelul — altfel butonul nu ar face nimic.
  const skipCache = body.skipCache === true || body.trigger === "regenerate-message";
  const cacheKey = buildChatCacheKey({
    providerId: selection.providerId,
    modelId: selection.modelId,
    systemPrompt,
    messages: messagesForModel
  });

  if (!skipCache) {
    const cached = chatResponseCache.get(cacheKey);
    if (cached) {
      // Cost 0 real (nu „necunoscut"): nu am plătit din nou; UI marchează din cache.
      return cachedTextToResponse(cached.text, {
        providerId: selection.providerId,
        modelId: selection.modelId,
        fromCache: true,
        inputTokens: 0,
        outputTokens: 0,
        inputCostUsd: 0,
        outputCostUsd: 0
      });
    }
  }

  const result = streamText({
    model,
    system: systemPrompt,
    messages: await convertToModelMessages(messagesForModel),
    // Acumulăm textul final aici — stream-ul în sine nu e serializabil în cache.
    // Scriem și după regenerate: citirea e ocolită, dar următoarea întrebare identică ia răspunsul nou.
    onFinish: ({ text }) => {
      if (text.trim().length > 0) {
        chatResponseCache.set(cacheKey, { text });
      }
    }
  });

  return result.toUIMessageStreamResponse({
    onError: providerErrorMessage,
    messageMetadata: ({ part }): ChatMessageMetadata | undefined => {
      if (part.type === "start") {
        return {
          providerId: selection.providerId,
          modelId: selection.modelId
        };
      }

      if (part.type !== "finish") return undefined;

      // usage vine de la provider — nu estimăm; undefined rămâne „necunoscut".
      const inputTokens = part.totalUsage.inputTokens;
      const outputTokens = part.totalUsage.outputTokens;
      const { inputCostUsd, outputCostUsd } = calculateMessageCost({
        providerId: selection.providerId,
        modelId: selection.modelId,
        inputTokens,
        outputTokens
      });

      return {
        providerId: selection.providerId,
        modelId: selection.modelId,
        inputTokens,
        outputTokens,
        inputCostUsd,
        outputCostUsd,
        fromCache: false
      };
    }
  });
}
