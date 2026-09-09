// Persona + guardrails — un singur loc, doar pe server (injectat în streamText).
// Clientul trimite profilul; nu poate ocoli aceste instrucțiuni.
import type { Profile } from "@/lib/types";

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

function formatProfile(profile: Profile): string {
  const skills =
    profile.skills.length > 0
      ? profile.skills.map(skill => `- ${skill.name}: ${skill.level}`).join("\n")
      : "- (nespecificate)";

  return [
    "Profil utilizator (context persistent — nu cere din nou aceste date):",
    `Nume: ${profile.name || "(nespecificat)"}`,
    `Stack actual: ${profile.stack || "(nespecificat)"}`,
    "Skills:",
    skills,
    `Obiectiv de carieră: ${profile.objective || "(nespecificat)"}`
  ].join("\n");
}

/** Construiește system prompt-ul injectat la fiecare apel LLM. */
export function buildSystemPrompt(profile: Profile | undefined): string {
  if (!profile) {
    return [
      PERSONA,
      "",
      "Profilul lipsește din request. Cere utilizatorului să completeze Preferințe → Profil,",
      "apoi răspunde pe baza a ce declară în mesaj — fără a inventa un profil."
    ].join("\n");
  }

  return [PERSONA, "", formatProfile(profile)].join("\n");
}
