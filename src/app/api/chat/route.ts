// Endpoint-ul chat — cheia Anthropic rămâne pe server; clientul primește doar stream-ul UI.
// Citim env în handler (nu la import) ca build-ul să treacă și fără .env.local.
import { anthropic } from "@ai-sdk/anthropic";
import { convertToModelMessages, streamText, type UIMessage } from "ai";

import { DEFAULT_CHAT_MODEL, isAnthropicChatModel } from "@/lib/llm/models";
import type { Profile } from "@/lib/types";

export const runtime = "nodejs";

function buildSystemPrompt(profile: Profile | undefined) {
  if (!profile) {
    return "Ești SkillForge, un copilot personal de skills și carieră. Răspunde clar și concret.";
  }

  const skills = profile.skills.map(skill => `${skill.name} (${skill.level})`).join(", ");

  return [
    "Ești SkillForge, un copilot personal de skills și carieră.",
    "Răspunde în contextul profilului utilizatorului — fără sfaturi generice.",
    `Nume: ${profile.name}`,
    `Stack: ${profile.stack}`,
    `Skills: ${skills || "nespecificate"}`,
    `Obiectiv: ${profile.objective}`
  ].join("\n");
}

function providerErrorMessage(error: unknown) {
  if (error == null) return "Eroare necunoscută de la provider.";
  if (typeof error === "string") return error;
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    if (message.includes("rate") || message.includes("429")) {
      return "Limită de cereri atinsă la Anthropic. Încearcă din nou peste puțin timp.";
    }
    if (message.includes("authentication") || message.includes("api key") || message.includes("401")) {
      return "Cheia Anthropic este invalidă sau a fost revocată. Verifică ANTHROPIC_API_KEY în .env.local.";
    }
    return error.message;
  }
  return "Eroare la generarea răspunsului.";
}

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json(
      {
        error:
          "Lipsește ANTHROPIC_API_KEY. Adaugă cheia în .env.local (vezi docs/anthropic/README.md) și repornește serverul."
      },
      { status: 400 }
    );
  }

  const body = (await req.json()) as {
    messages: UIMessage[];
    profile?: Profile;
    model?: string;
  };

  // Același model pe care îl arată UI-ul — fără allowlist, clientul ar putea forța orice ID.
  const requestedModel = body.model ?? DEFAULT_CHAT_MODEL;
  if (!isAnthropicChatModel(requestedModel)) {
    return Response.json(
      {
        error: `Model necunoscut sau neactiv: "${requestedModel}". Alege un model Anthropic din Preferințe.`
      },
      { status: 400 }
    );
  }

  const result = streamText({
    model: anthropic(requestedModel),
    system: buildSystemPrompt(body.profile),
    messages: await convertToModelMessages(body.messages)
  });

  return result.toUIMessageStreamResponse({
    onError: providerErrorMessage
  });
}
