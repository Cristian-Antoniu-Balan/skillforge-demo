# Vercel — documentație integrare

## Ce face

Vercel găzduiește SkillForge: fiecare push pe un branch primește un **Preview URL**;
ce ajunge pe `main` e **Production** (linkul public). Cheile API stau doar în
Environment Variables pe platformă — nu în repo.

## Cont & chei

| Pas                         | Unde                                                             |
| --------------------------- | ---------------------------------------------------------------- |
| Creare cont                 | [vercel.com/signup](https://vercel.com/signup) (login cu GitHub) |
| Import proiect              | [vercel.com/new](https://vercel.com/new) → Import Git Repository |
| Variabile de mediu          | Project → **Settings** → **Environment Variables**               |
| Scope / permisiuni necesare | Acces la repo-ul GitHub `skillforge-demo`                        |

**Nu scrie chei reale aici** — doar unde se configurează.

## Variabile de mediu

Pe Vercel setezi **aceleași nume** ca în `.env.example`, pe **Production** și pe **Preview**:

| Variabilă             | Unde (Vercel)                          | Descriere                                |
| --------------------- | -------------------------------------- | ---------------------------------------- |
| `ANTHROPIC_API_KEY`   | Environment Variables (Prod + Preview) | Cheia Anthropic — vezi `docs/anthropic/` |
| `SKILLFORGE_GREETING` | Environment Variables (opțional)       | Mesaj pentru `GET /api/hello` (demo env) |

Rânduri din `.env.example` (singurul fișier de variabile din repo):

```
SKILLFORGE_GREETING=SkillForge
ANTHROPIC_API_KEY=
```

⚠️ **Redeploy obligatoriu** după ce adaugi sau schimbi o variabilă: valorile se citesc
**la request**, nu la build. Deploy-ul existent nu vede cheia nouă până la Redeploy
(Deployments → ⋮ pe deploy → Redeploy).

## Pași manuali

Ce **nu** poate face agentul — trebuie făcut de tine (și refăcut pe alt calculator):

1. Cont Vercel cu login GitHub.
2. **Add New… → Project** → importă `Cristian-Antoniu-Balan/skillforge-demo`.
3. Framework: Next.js (detectat automat). **Nu** completa Build Command / Output de mână;
   **nu** adăuga `vercel.json` cât timp default-urile merg.
4. Deploy inițial (poate fi fără chei — UI-ul trebuie să se deschidă; chat-ul arată
   „Provider neconfigurat” până configurezi `ANTHROPIC_API_KEY`).
5. **Settings → Environment Variables**: adaugă fiecare variabilă din `.env.example`
   pe **Production** și pe **Preview** (valori reale doar aici, niciodată în git).
6. **Deployments → Redeploy** pe ultimul deployment Production (și Preview dacă e cazul),
   ca noile env să fie vizibile.
7. Copiază URL-ul Production din Project → **Domains** în `README.md` (secțiunea aplicație publicată).
8. **Deployment Protection / Vercel Authentication:** dacă linkul redirecționează la login Vercel
   (SSO), nu e partajabil. Project → **Settings** → **Deployment Protection** → pentru
   Production setează **Only Preview Deployments** (sau Disabled), ca URL-ul public să se
   deschidă fără cont Vercel. Apoi verifică dintr-un browser / telefon neautentificat.

### Refacere pe alt calculator

1. Clone repo: `git clone git@github.com:Cristian-Antoniu-Balan/skillforge-demo.git`
2. `cp .env.example .env.local` + completează cheile locale (opțional pentru chat).
3. `npm install` → `npm run dev` (local) sau doar Vercel Dashboard pentru producție.
4. Variabilele de pe Vercel **nu** se mută cu git — le vezi în Project → Settings →
   Environment Variables (sau le reintroduci din Anthropic Console).

## Cost & limite

| Aspect          | Detaliu                                                                |
| --------------- | ---------------------------------------------------------------------- |
| Plan gratuit    | Da — Hobby: Preview + Production, limite de bandwidth / serverless     |
| Route Handlers  | Rulează la **fiecare** cerere; nu sunt „gratis” la scară               |
| Tokeni LLM      | Se plătesc la Anthropic, separat de Vercel                             |
| Cost orientativ | [Vercel Pricing](https://vercel.com/pricing) — verifică sursa oficială |

## Preview vs Production (curs)

| Mediu          | Când                          | URL                     | Folosire                                           |
| -------------- | ----------------------------- | ----------------------- | -------------------------------------------------- |
| **Preview**    | Push pe orice branch ≠ `main` | URL unic per deployment | Review / test — **nu** „rulează la tine” permanent |
| **Production** | Push / merge pe `main`        | Domeniul proiectului    | Linkul pe care îl dai altcuiva                     |

Loguri când merge local și cade pe Vercel: Project → **Deployments** → deployment →
**Functions** / **Logs** (sau Runtime Logs). Cauți erori din `/api/chat`.

## Verificare

- Dashboard proiect: [vercel.com](https://vercel.com) → proiectul `skillforge-demo` (import din GitHub).
- Deschide URL-ul Production pe **telefon**, nu doar pe laptop — UI responsive; **fără** redirect la login Vercel.
- Push pe un branch de test → Deployment Preview cu URL **diferit** de Production.
- Fără `ANTHROPIC_API_KEY` pe Vercel: chat → alertă **Provider neconfigurat** (nu crash).
- Cu cheie + Redeploy: mesaj în chat → răspuns streaming.
- Local, înainte de push: mută temporar `.env.local` → `npm run build` trebuie să treacă.

### Stare la primul pas (curs)

- Repo GitHub conectat; push pe `main` declanșează Production (verificat: deployment `success`).
- Rămâne de făcut pe dashboard: env pe Production + Preview, Redeploy, Deployment Protection
  dezactivat pe Production, URL public lipit în `README.md`.

## Referințe

- [Vercel — Import Git Repository](https://vercel.com/docs/getting-started-with-vercel/import)
- [Environment Variables](https://vercel.com/docs/projects/environment-variables)
- [SkillForge requirements — Faza 1.4](../requirements.md)
