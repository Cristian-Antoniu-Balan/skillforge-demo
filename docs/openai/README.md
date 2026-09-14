# OpenAI — documentație integrare

## Ce face

OpenAI furnizează modelele GPT, apelate din `POST /api/chat` când utilizatorul alege
providerul OpenAI din selectorul de lângă caseta de chat. Cheia API rămâne pe server
(`.env.local` / Vercel); browserul vede doar stream-ul UI și statusul „configurat / neconfigurat”.

## Cont & chei

| Pas                | Unde                                                                 |
| ------------------ | -------------------------------------------------------------------- |
| Creare cont        | [platform.openai.com](https://platform.openai.com/)                  |
| Generare cheie API | Platform → **API keys** → Create new secret key                      |
| Scope              | Acces API la modelele din registru (`gpt-5.6-luna`, `gpt-5.6-terra`) |

**Nu scrie cheia reală aici** — doar unde se obține.

## Variabile de mediu

| Variabilă        | Fișier       | Descriere                       |
| ---------------- | ------------ | ------------------------------- |
| `OPENAI_API_KEY` | `.env.local` | Cheia API generată în dashboard |

Rând în `.env.example`:

```
OPENAI_API_KEY=
```

⚠️ Fără `NEXT_PUBLIC_` — altfel cheia ar ajunge în bundle-ul de browser.

Pe Vercel: Project → Settings → Environment Variables → `OPENAI_API_KEY` pentru
**Production** și **Preview**, apoi **Redeploy** (deploy-urile vechi nu văd env nou).

## Pași manuali

1. Creează cont la [platform.openai.com](https://platform.openai.com/).
2. Adaugă metodă de plată / credite dacă platforma o cere pentru API.
3. Generează o API key din **API keys** → Create new secret key.
4. Copiază `.env.example` → `.env.local` (dacă nu există deja).
5. Setează `OPENAI_API_KEY=` cu cheia ta (fără `NEXT_PUBLIC_`).
6. Repornește `npm run dev` ca Next.js să încarce env-ul.
7. Pe Vercel: adaugă aceeași variabilă (Production + Preview) → Redeploy.
8. În chat, deschide selectorul lângă Trimite → alege **OpenAI** + un model → trimite un mesaj.

## Cost & limite

| Aspect          | Detaliu                                                                                                               |
| --------------- | --------------------------------------------------------------------------------------------------------------------- |
| Plan            | Pay-as-you-go / credite în OpenAI Platform                                                                            |
| Rate limits     | Depind de tier — vezi dashboard                                                                                       |
| Cost orientativ | [Pricing oficial OpenAI](https://openai.com/api/pricing/) — verifică sursa, prețurile se schimbă                      |
| Modele în app   | `gpt-5.6-luna` (implicit, cost-sensitiv), `gpt-5.6-terra` (echilibru) — id-uri din docs OpenAI, verificate 2026-09-14 |

Prețurile și id-urile de modele se schimbă — la actualizare, citește din nou
[platform.openai.com/docs/models](https://platform.openai.com/docs/models), nu din memorie.

## Verificare

- Fără cheie: în selector, OpenAI apare **dezactivat** cu tooltip „Lipsește OPENAI_API_KEY…”; Anthropic rămâne utilizabil.
- Cu cheie: același mesaj pe Anthropic și pe OpenAI → două răspunsuri (pot diferi ca stil).
- Network: request la `/api/chat` cu `providerId: "openai"` — fără cheie în payload-ul din browser.
- `GET /api/providers` returnează `configured: true/false` fără valoarea cheii.

## Referințe

- [OpenAI API docs](https://platform.openai.com/docs)
- [OpenAI models](https://platform.openai.com/docs/models)
- [AI SDK — OpenAI provider](https://ai-sdk.dev/providers/ai-sdk-providers/openai)
