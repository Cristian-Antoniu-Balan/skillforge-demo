# Anthropic — documentație integrare

## Ce face

Anthropic furnizează modelul Claude, apelat din `POST /api/chat` pentru răspunsuri în streaming
în chat-ul SkillForge. Cheia API rămâne pe server (`.env.local`); browserul vede doar stream-ul UI.

## Cont & chei

| Pas                | Unde                                                       |
| ------------------ | ---------------------------------------------------------- |
| Creare cont        | [console.anthropic.com](https://console.anthropic.com/)    |
| Generare cheie API | Console → **API keys** → Create key                        |
| Scope              | Acces API la modelele Claude (inclusiv `claude-haiku-4-5`) |

**Nu scrie cheia reală aici** — doar unde se obține.

## Variabile de mediu

| Variabilă           | Fișier       | Descriere                       |
| ------------------- | ------------ | ------------------------------- |
| `ANTHROPIC_API_KEY` | `.env.local` | Cheia API generată în dashboard |

Rând în `.env.example`:

```
ANTHROPIC_API_KEY=
```

## Pași manuali

1. Creează cont la [console.anthropic.com](https://console.anthropic.com/).
2. Generează o API key din secțiunea **API keys**.
3. Copiază `.env.example` → `.env.local` (dacă nu există deja).
4. Setează `ANTHROPIC_API_KEY=` cu cheia ta (fără `NEXT_PUBLIC_`).
5. Repornește `npm run dev` ca Next.js să încarce env-ul.
6. Deschide chat-ul, trimite un mesaj — răspunsul trebuie să apară bucată cu bucată.

## Cost & limite

| Aspect                  | Detaliu                                                                                                                     |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Plan                    | Credite / billing în Anthropic Console                                                                                      |
| Rate limits (provider)  | Depind de tier — vezi [Anthropic rate limits](https://docs.anthropic.com/en/api/rate-limits); pot returna 429 pe contul tău |
| Rate limit (SkillForge) | **20 cereri / minut** pe `/api/chat` (protecție locală, per instanță)                                                       |
| Pricing oficial         | [platform.claude.com — Pricing](https://platform.claude.com/docs/en/about-claude/pricing)                                   |

**Prețuri în registru** (aceleași ca `pricingByModel` în `src/lib/providers.ts`, verificate **2026-09-16**):

| Model                      | Input / 1M tokeni | Output / 1M tokeni |
| -------------------------- | ----------------- | ------------------ |
| `claude-haiku-4-5`         | $1.00             | $5.00              |
| `claude-sonnet-4-20250514` | $3.00             | $15.00             |

Prețurile se schimbă — la actualizare, citește din nou documentația Anthropic și actualizează **și** registrul, **și** acest tabel.

## Verificare

- Fără cheie: trimite un mesaj → alertă **Provider neconfigurat** (status 400, nu 500; UI rămâne utilizabilă).
- Cu cheie: Preferințe → Profile (complet) → chat → Enter → text care crește; Stop oprește generarea.
- Network: request la `/api/chat` — fără cheie în payload-ul din browser.

## Referințe

- [Anthropic API docs](https://docs.anthropic.com/)
- [AI SDK — Anthropic provider](https://ai-sdk.dev/providers/ai-sdk-providers/anthropic)
- [AI SDK — useChat](https://ai-sdk.dev/docs/ai-sdk-ui/chatbot)
