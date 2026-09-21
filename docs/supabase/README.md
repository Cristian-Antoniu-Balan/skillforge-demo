# Supabase — documentație integrare

## Ce face

Supabase e baza de date Postgres a SkillForge: profiluri, identități OAuth, conversații și
mesaje legate de un **proprietar** (`profiles.id`). Aplicația citește/scrie **doar de pe
server**, cu cheia de serviciu; browserul nu are client Supabase.

Fără variabilele Supabase (sau fără auth), aplicația revine la `localStorage` — ca până acum.
Istoricul din browser **nu se migrează** pe cont (nu are proprietar).

## Cont & chei

| Pas                        | Unde                                                                                          |
| -------------------------- | --------------------------------------------------------------------------------------------- |
| Creare cont / proiect      | [supabase.com](https://supabase.com) → New project                                            |
| URL proiect                | Project Settings → API → Project URL                                                          |
| Cheia publică (`anon`)     | Project Settings → API → `anon` `public` (sau Publishable key)                                |
| Cheia de serviciu          | Project Settings → API → `service_role` `secret` (sau Secret key) — **nu o expune niciodată** |
| Editor SQL (rulare schemă) | SQL Editor → New query → lipește `src/lib/supabase/schema.sql` → Run                          |

**Nu scrie cheile reale aici** — doar unde se obțin.

## Variabile de mediu

Fiecare variabilă e **secret** sau **config**. Pe Vercel, bifează „Sensitive” doar pe secrete.

| Variabilă                   | Tip        | Ajunge în browser? | Fișier       | Ce înseamnă                                                                                                                                 |
| --------------------------- | ---------- | ------------------ | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `SUPABASE_URL`              | **config** | Nu (la noi)        | `.env.local` | URL-ul proiectului. Identifică unde e baza; nu autorizează singur.                                                                          |
| `SUPABASE_ANON_KEY`         | **config** | **Poate** (design) | `.env.local` | Cheia publică: respectă RLS. În SkillForge **nu** există client de browser — o păstrăm în env ca setup-ul să fie complet, dar nu o folosim. |
| `SUPABASE_SERVICE_ROLE_KEY` | **secret** | **Nu — niciodată** | `.env.local` | Ocolește RLS complet. Doar pe server. Un `NEXT_PUBLIC_` pe ea publică toată baza. Reparare: rotești cheia în Dashboard.                     |

Persistența e activă doar dacă **și** auth-ul e configurat (`AUTH_*`) **și** `SUPABASE_URL` +
`SUPABASE_SERVICE_ROLE_KEY` sunt setate. Fără proprietar din sesiune, baza nu se folosește.

Rânduri în `.env.example`:

```
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

## Pași manuali

1. Creează un proiect Supabase (regiune apropiată; notează parola DB — o poți folosi la CLI, nu în app).
2. Copiază **Project URL** → `SUPABASE_URL`.
3. Copiază cheia **anon / publishable** → `SUPABASE_ANON_KEY` (documentată; app-ul server nu o folosește acum).
4. Copiază cheia **service_role / secret** → `SUPABASE_SERVICE_ROLE_KEY` (doar `.env.local` + Vercel Sensitive).
5. În **SQL Editor**, lipește conținutul din `src/lib/supabase/schema.sql` și rulează-l o dată.
   - Schema activează RLS **fără politici** — deliberat: accesul e doar cu service role de pe server.
6. Confirmă că autentificarea Auth.js e deja configurată (`docs/nextauth/README.md`). Fără ea, baza rămâne nefolosită.
7. Pe **alt calculator**: copiază aceleași trei variabile (+ auth); schema e deja pe proiectul cloud — nu o re-rulezi decât dacă e proiect nou.
8. **Vercel:** Settings → Environment Variables → aceleași nume pentru **Production** și **Preview**
   (Sensitive pe `SUPABASE_SERVICE_ROLE_KEY`) → **Redeploy**.
9. Schimbări de schemă ulterioare: fișier nou de migrare (ex. `migrations/00x_….sql`), **nu** edita
   `schema.sql` deja rulat pe proiecte existente.

## Cost & limite

| Aspect       | Detaliu                                                                                         |
| ------------ | ----------------------------------------------------------------------------------------------- |
| Plan gratuit | Da — [Supabase Pricing](https://supabase.com/pricing): DB, Auth (nefolosit de noi), storage mic |
| Limite free  | Pauză la inactivitate pe proiectele free; spațiu DB și bandwidth plafonate                      |
| Cost app     | Interogările noastre sunt ieftine față de apelurile LLM; rezumatul memoriei costă tokeni LLM    |
| Pricing      | [supabase.com/pricing](https://supabase.com/pricing)                                            |

## Verificare

- **Fără variabile Supabase:** `npm run build` / `npm run dev` — app pe localStorage; `/api/account`
  răspunde `persistenceEnabled: false`.
- **Cu variabile + auth:** login → toast o dată că istoricul din browser nu se preia → o conversație
  pe browser A apare pe browser B, **același cont**.
- **Doi utilizatori diferiți** (doi studenți sau două conturi GitHub): fiecare vede doar chat-urile lui
  în UI; în Table Editor, `owner_id` diferă.
- Table Editor → `messages`: ordine pe coloana `position`; `identities`: câte o linie per furnizor,
  același `profile_id` dacă emailul confirmat a unit conturile.
- Login fără email public (GitHub ascuns): mesaj în UI că poate apărea un al doilea profil.

## Referințe

- [Supabase API keys](https://supabase.com/docs/guides/api/api-keys)
- Schema: [`src/lib/supabase/schema.sql`](../../src/lib/supabase/schema.sql)
- Stratul de date: `src/lib/supabase/` (niciun query din componente)
