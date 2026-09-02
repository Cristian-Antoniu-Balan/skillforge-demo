# SkillForge — Cerințe

> **Sursă de adevăr.** Orice schimbare de scope se face aici, nu doar în chat.
> Instrucțiunile pentru agenți AI sunt în [`agent-instructions.md`](agent-instructions.md).

---

## 1. Rezumat executiv

**SkillForge** este un copilot personal de skills și carieră. Cunoaște profilul real al utilizatorului (stack, skills, obiectiv), răspunde **în contextul lui**, propune pași concreți de învățare și își amintește progresul între sesiuni.

Nu este un tab de chat generic. Este o aplicație web online, construită modular pe parcursul unui curs, în care se învață cum se leagă un LLM la o interfață web reală — cu agent AI, streaming, memorie și (mai târziu) unelte.

**Decizii curente:**

- Stack: Next.js 16 (App Router) + TypeScript + Tailwind CSS v4 + shadcn/ui + Vercel AI SDK (la integrarea agentului)
- Nume proiect npm: `skill-forge`; alias import: `@/*`; folder sursă: `src/`
- MVP: single-user (un singur profil); autentificare și multi-user în faze ulterioare

---

## 2. Problema și soluția

### Problema

Instrumente generice (ex. ChatGPT) oferă sfaturi de carieră fără context persistent: uită cine ești de la o sesiune la alta, nu știu stack-ul tău real, nu urmăresc progresul și nu îți propun pași concret legați de obiectivul tău.

### Soluția

O aplicație personală care:

1. **Salvează profilul** — stack, skills cu nivel, obiectiv de carieră
2. **Construiește context** — system prompt din profil la fiecare conversație
3. **Păstrează memorie** — conversații și progres între sesiuni
4. **Acționează ca agent** — nu doar răspunde, ci (în faze avansate) folosește unelte pentru a actualiza planul, căuta notițe etc.

---

## 3. Public țintă

SkillForge este pentru oricine vrea să crească profesional și are nevoie de un plan personalizat:

| Profil tipic | Exemplu de obiectiv                   |
| ------------ | ------------------------------------- |
| Backend Java | Trecere spre AI engineer              |
| Frontend     | Învățare Python sau Java              |
| QA manual    | Trecere spre automatizare             |
| Junior       | Clarificare direcție și pași concreți |

**Punctul comun** nu este tehnologia, ci faptul că fiecare pornește dintr-un loc diferit și are un obiectiv diferit. De aceea **profilul contează atât de mult**.

---

## 4. Principii de design

| Principiu                           | Descriere                                                                                                                                                                                             |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Agent, nu formular**              | În centru stă un agent AI: chat cu streaming, system prompt din profil, memorie între sesiuni, unelte invocate automat (Faza 3). Nu un formular care trimite text la un model și afișează rezultatul. |
| **Profil persistent**               | Stack-ul curent, skill-urile cu nivel, obiectivul de carieră — salvate, editabile, care cresc în timp.                                                                                                |
| **LLM pe server**                   | Modelul se apelează de pe server, printr-un provider configurabil. Cheia API **nu ajunge niciodată în browser**.                                                                                      |
| **Provider schimbabil**             | Abstracție care permite schimbarea providerului (OpenAI, Anthropic etc.) pentru a compara răspunsuri și costuri.                                                                                      |
| **Modular (curs)**                  | Fiecare modul adaugă o bucată clară. La fiecare pas se înțelege _ce_ s-a adăugat și _de ce_ era nevoie.                                                                                               |
| **Documentație ca sursă de adevăr** | Cerințele stau în acest fișier. Schimbările de scope se actualizează aici, nu doar în conversație.                                                                                                    |

---

## 5. Cerințe funcționale pe faze

### Faza 0 — Documentație _(acest pas)_

**In scope:**

- [`requirements.md`](requirements.md) — acest fișier
- [`agent-instructions.md`](agent-instructions.md) — instrucțiuni pentru agenți AI (engleză)
- Script de sincronizare → `AGENTS.md`, `CLAUDE.md`, `.github/copilot-instructions.md`
- [`README.md`](../README.md) scurt cu linkuri către documentație
- `.gitignore`, `.env.example` (placeholder)

**Out of scope:**

- Cod de aplicație
- Integrări externe (LLM, DB, auth)

---

### Faza 1 — Aplicația SkillForge (modular)

Faza 1 este împărțită în sub-pași; fiecare livrează o bucată clară peste același proiect.

#### Faza 1.1 — Schelet Next.js _(livrat)_

**In scope:**

- Proiect `skill-forge`: Next.js (App Router) + TypeScript + Tailwind CSS v4 + shadcn/ui (`button`, `cn()`)
- Structură: `src/app/layout.tsx`, `page.tsx`, `globals.css`; rută `/demo`
- Componentă client (`Counter`) și server (`ServerTime`) — diferența vizibilă pe ecran
- Route Handler `src/app/api/hello/route.ts` — citește env server-side; strămoșul lui `/api/chat`
- Prettier + `prettier-plugin-tailwindcss` (cu `tailwindStylesheet` pentru Tailwind v4)
- `.vscode/settings.json` comis (format on save)
- Documentație integrări: [`docs/README.md`](README.md) (index), [`docs/_template/README.md`](_template/README.md) (șablon)
- Comentarii în română în fișierele sursă — explică **de ce**, nu ce face

**Out of scope:**

- Agent AI, chat, streaming LLM
- Profil utilizator
- Integrări externe active (doar formatul documentației)

#### Faza 1.2 — Interfață completă (date mock) _(livrat)_

**In scope:**

- UI complet SkillForge: sidebar (New, Chats and tasks, utilizator), header, chat, preferințe (`Dialog`)
- Date inventate în `src/lib/mock/` — profil + conversații; înlocuire ușoară la integrarea LLM
- Stare globală: Zustand + `persist` (cheie `skillforge-app`)
- Stări UI: empty state, skeleton, indicator „scrie…", alert erori
- Mesaje mock navigabile; trimitere simulează răspuns assistant (fără LLM)
- Responsive: sidebar în `Sheet` pe mobil
- Temă system/light/dark — doar din Preferințe → Appearance
- **Fără** apel LLM, `/api/chat`, chei API

**Out of scope:**

- Agent AI real, streaming LLM
- Persistență server / DB

#### Faza 1.3 — Agent + chat contextual minimal _(următorul pas)_

**In scope:**

- Răspuns **streaming** (Vercel AI SDK) — înlocuiește simularea mock din store
- Provider LLM (ex. Anthropic) apelat de pe server via `/api/chat`
- System prompt din profil (deja editabil în UI)
- Documentație: `docs/<provider>/README.md` + rând în index

**Out of scope:**

- Plan de învățare structurat separat
- Unelte agent (tool calling)
- Al doilea provider LLM activ
- Autentificare, multi-user

---

### Faza 2 — Memorie și progres

**In scope:**

- Persistență conversații între sesiuni
- Actualizare profil/progres din conversație (ex. „am terminat modulul de streaming")
- Plan de învățare structurat (pași, termene) stocat și injectat în system prompt
- Istoric conversații vizibil în UI
- Răspunsuri contextuale la progres (ex. „ce urmează?")

**Out of scope:**

- Tool calling / unelte agent
- Comparare provideri
- Autentificare, deploy producție

---

### Faza 3 — Agent cu unelte + operațiuni

**In scope:**

- Tool calling: agentul invocă singur funcții (caută în notițe, actualizează plan, marchează progres)
- Al doilea provider LLM pentru comparație cost/calitate
- Autentificare (dacă e nevoie pentru deploy multi-device)
- Deploy în producție
- Monitorizare (logs, erori, cost tracking)
- Fiecare integrare externă nouă → `docs/<integrare>/README.md`

**Out of scope:**

- Funcționalități sociale (profil public, sharing)
- Marketplace de planuri

---

## 6. Criterii de acceptare

### Exemple concrete

| Întrebare utilizator                                           | Faza minimă | Comportament așteptat                                        |
| -------------------------------------------------------------- | ----------- | ------------------------------------------------------------ |
| „Ce-mi lipsește ca să trec de la Java backend la AI engineer?" | Faza 1–2    | Analiză gap bazată pe profil + obiectiv; nu sfaturi generice |
| „Fă-mi un plan de 3 luni pentru Next.js + AI SDK"              | Faza 2      | Plan structurat, salvat, reutilizabil în sesiuni viitoare    |
| „Ține minte că am terminat modulul de streaming — ce urmează?" | Faza 2+     | Știe progresul; propune pasul următor din plan               |

### Format pentru criterii noi

La adăugarea unei funcționalități noi, documentează:

1. **Întrebare/acțiune utilizator** — ce declanșează
2. **Faza minimă** — când devine posibil
3. **Comportament așteptat** — ce trebuie să se întâmple, verificabil

---

## 7. Cerințe non-funcționale

### Secrete și variabile de mediu

- Cheile API se stochează **doar** în variabile de mediu server-side (ex. `.env.local`)
- `.env.example` conține **numele** variabilelor, fără valori reale
- `.gitignore` exclude `.env`, `.env.local` și variantele
- Cheile reale **nu** se scriu în documentație, cod sursă sau commit-uri

### Date personale (profil)

| Aspect             | Faza 1–2 (MVP)                                                              | Faza 3+                                         |
| ------------------ | --------------------------------------------------------------------------- | ----------------------------------------------- |
| Stocare            | Locală (fișier/SQLite pe mașina de dev)                                     | Poate migra la cloud DB                         |
| Acces              | Doar utilizatorul local                                                     | Autentificare necesară                          |
| Trimitere la terți | Doar conținutul conversației la providerul LLM (necesar pentru funcționare) | Aceeași regulă + politică explicită documentată |
| Ștergere           | Utilizatorul poate șterge datele local                                      | Endpoint/mechanism documentat                   |

### Costuri provider LLM

- Fiecare provider documentat în `docs/<provider>/README.md`
- Include: link oficial pricing, estimare orientativă la momentul documentării, variabile env relevante
- Prețurile se schimbă — documentația indică sursa oficială, nu garantează exactitatea

### Formatare cod

- **Prettier** obligatoriu din Faza 1.1: `npm run format` / `npm run format:check`
- Configurație fixă în `.prettierrc` (inclusiv `prettier-plugin-tailwindcss` + `tailwindStylesheet`)
- `.prettierignore` în rădăcina proiectului (complet, autonom — fără `--ignore-path` extern)
- `.vscode/settings.json` comis: format on save cu Prettier

### Limbi documentație

| Fișier                       | Limbă                                   |
| ---------------------------- | --------------------------------------- |
| `docs/requirements.md`       | Română                                  |
| `docs/agent-instructions.md` | Engleză                                 |
| `docs/<integrare>/README.md` | Română (pași manuali pentru utilizator) |
| Cod — comentarii explicative | Română (de ce e scris așa)              |
| Cod — identificatori         | Engleză                                 |

### Performanță (orientativ, Faza 1+)

- Streaming: primul token vizibil în UI în < 3 secunde (depinde de provider)
- Profil: încărcare instant (< 100ms local)

---

## 8. Stack tehnic

| Componentă              | Tehnologie                             | De la faza |
| ----------------------- | -------------------------------------- | ---------- |
| Framework web           | Next.js 16 (App Router)                | 1.1        |
| Limbaj                  | TypeScript                             | 1.1        |
| Styling                 | Tailwind CSS v4 + shadcn/ui            | 1.1        |
| Formatare               | Prettier + prettier-plugin-tailwindcss | 1.1        |
| Stare client            | Zustand + persist (localStorage)       | 1.2        |
| LLM integration         | Vercel AI SDK                          | 1.3        |
| Persistență profil      | Zustand (UI); server la 1.3+           | 1.2        |
| Persistență conversații | SQLite sau JSON                        | 2          |
| Deploy                  | TBD (Vercel recomandat)                | 3          |

---

## 9. Glosar

| Termen                | Definiție                                                                                 |
| --------------------- | ----------------------------------------------------------------------------------------- |
| **Agent**             | Orchestrator AI care combină system prompt, memorie și (Faza 3) unelte invocate automat   |
| **Provider**          | Serviciu extern de LLM (OpenAI, Anthropic, Google etc.) apelat exclusiv de pe server      |
| **Streaming**         | Livrarea răspunsului token cu token în UI, în timp real, fără a aștepta răspunsul complet |
| **Profil / Persona**  | Datele utilizatorului: stack curent, skill-uri cu nivel, obiectiv de carieră              |
| **Memorie**           | Context persistat între sesiuni: conversații anterioare, progres, plan de învățare        |
| **System prompt**     | Instrucțiuni injectate la fiecare apel LLM, construite din profil și context              |
| **Unelte (tools)**    | Funcții pe care agentul le invocă singur (ex. caută notițe, actualizează plan) — Faza 3   |
| **Modul**             | Unitate de lucru în curs: o funcționalitate clară adăugată incremental                    |
| **Integrare externă** | Orice serviciu terț: provider LLM, bază de date, auth, deploy, monitorizare               |

---

## 10. Reguli de mentenanță

1. **Schimbare de scope** → actualizează secțiunea de fază relevantă din acest fișier **înainte** sau **odată cu** implementarea
2. **Integrare externă nouă** → creează `docs/<integrare>/README.md` (după șablonul din `docs/_template/`), adaugă rând în tabelul din `docs/README.md`, actualizează `.env.example` — **în același commit** cu codul
3. **Decizie arhitecturală** → notează în secțiunea Stack tehnic sau adaugă subsecțiune scurtă
4. **Criteriu de acceptare nou** → adaugă în secțiunea 6
5. **Nu duplica** cerințele în README sau în instrucțiunile pentru agenți — trimite la acest fișier

---

_Ultima actualizare: Faza 1.2 — interfață completă (mock)_
