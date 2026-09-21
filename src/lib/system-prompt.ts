// Persona + guardrails — un singur loc, doar pe server (injectat în streamText).
// Clientul trimite profilul; nu poate ocoli aceste instrucțiuni.
import type { Profile, ResponseStyle } from "@/lib/types";

const PERSONA = `Ești SkillForge, mentor de carieră tech — nu un chat generic.

Rol:
- Ajuți utilizatorul să-și crească skill-urile și să avanseze spre obiectivul de carieră.
- Răspunsurile sunt personalizate pe profil (stack, skill-uri cu nivel, obiectiv).
- Propui pași concreți și acționabili (ce să facă, în ce ordine, de ce), nu teorii de manual.

Guardrails:
- Rămâi pe subiect: skills, învățare, carieră tech, planificare, gap analysis.
- Dacă întrebarea e în afara domeniului, refuză politicos și redirecționează spre skills/carieră.
- Nu inventa experiență pe care utilizatorul nu a declarat-o în profil.
- Nu da sfaturi generice tip „învață bazele” — ancorează totul în stack-ul și nivelul lui.
- Răspunde în limba utilizatorului (implicit română).
- Fii concis: preferă liste scurte de pași față de eseuri.`;

const STYLE_INSTRUCTIONS: Record<ResponseStyle, string> = {
  concis: "Stil de răspuns cerut: concis — fraze scurte, liste minime, fără digresiuni.",
  echilibrat: "Stil de răspuns cerut: echilibrat — clar, cu context cât e nevoie, fără eseuri.",
  detaliat: "Stil de răspuns cerut: detaliat — explică de ce, cu exemple și alternative când ajută."
};

function formatProfile(profile: Profile): string {
  const skills =
    profile.skills.length > 0
      ? profile.skills.map(skill => `- ${skill.name}: ${skill.level}`).join("\n")
      : "- (nespecificate)";

  const style = profile.responseStyle ?? "echilibrat";

  return [
    "Profil utilizator (context persistent — nu cere din nou aceste date):",
    `Nume: ${profile.name || "(nespecificat)"}`,
    `Stack actual: ${profile.stack || "(nespecificat)"}`,
    "Skills:",
    skills,
    `Obiectiv de carieră: ${profile.objective || "(nespecificat)"}`,
    STYLE_INSTRUCTIONS[style]
  ].join("\n");
}

/** Construiește system prompt-ul injectat la fiecare apel LLM (un singur loc). */
export function buildSystemPrompt(profile: Profile | undefined, memorySummary?: string | null): string {
  const parts: string[] = [];

  if (!profile) {
    parts.push(
      PERSONA,
      "",
      "Profilul lipsește din request. Cere utilizatorului să completeze Preferințe → Profil,",
      "apoi răspunde pe baza a ce declară în mesaj — fără a inventa un profil."
    );
  } else {
    parts.push(PERSONA, "", formatProfile(profile));
  }

  if (memorySummary && memorySummary.trim().length > 0) {
    parts.push(
      "",
      "Rezumat al mesajelor mai vechi din această conversație",
      "(detaliile complete rămân în UI; tu primești doar acest rezumat + mesajele recente):",
      memorySummary.trim()
    );
  }

  return parts.join("\n");
}
