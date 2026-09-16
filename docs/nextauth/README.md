# Auth.js (NextAuth) — documentație integrare

## Ce face

Auth.js autentifică utilizatorul prin OAuth (GitHub acum; Google pregătit în UI).
Aplicația **știe cine e** (sesiune JWT, fără bază de date) și **închide** `POST /api/chat`
fără sesiune — ca oricine cu link-ul public să nu poată cheltui cheia de model.

**Limitare cunoscută (pasul acesta):** conversațiile rămân în `localStorage` al browserului,
nu ale contului. Doi utilizatori pe același calculator văd aceleași chat-uri. Proprietarul
datelor vine la pasul de persistență.

## Cont & chei

| Pas                           | Unde                                                                                          |
| ----------------------------- | --------------------------------------------------------------------------------------------- |
| Creare aplicație GitHub OAuth | [GitHub → Settings → Developer settings → OAuth Apps](https://github.com/settings/developers) |
| Client ID / Client secret     | Pagina aplicației OAuth → Generate a new client secret                                        |
| Scope                         | Implicit: citire profil public (+ email dacă utilizatorul îl face vizibil)                    |

**Nu scrie secretul real aici** — doar unde se obține.

## Variabile de mediu

Fiecare variabilă e **secret** sau **config** — pe Vercel, bifează „Sensitive” doar pe secrete
(valoarea devine de necitit după salvare). Pe config lasă nebifat, ca să poți verifica dintr-o privire.

| Variabilă            | Tip        | Fișier       | Ce înseamnă / ce decurge                                                                                                                                                                                                          |
| -------------------- | ---------- | ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_SECRET`        | **secret** | `.env.local` | Semnează cookie-ul de sesiune. Cine îl are poate **fabrica** o sesiune validă fără OAuth. Reparare: generezi altul.                                                                                                               |
| `AUTH_GITHUB_ID`     | **config** | `.env.local` | Identificatorul public al aplicației OAuth. **E public prin proiectare** — pleacă în URL-ul de redirect; se citește din bara de adrese. Nu e scăpare: în OAuth, id-ul spune „care aplicație”, secretul dovedește „chiar eu sunt”. |
| `AUTH_GITHUB_SECRET` | **secret** | `.env.local` | Secretul aplicației OAuth la GitHub. Cine îl are poate acționa în numele aplicației. Reparare: regenerezi la GitHub + actualizezi env.                                                                                            |
| `AUTH_URL`           | **config** | `.env.local` | URL-ul canonic al aplicației (ex. `https://skillforge.vercel.app`). Local: de obicei inferat; în producție setează-l explicit.                                                                                                    |
| `AUTH_GOOGLE_ID`     | **config** | `.env.local` | Pregătit pentru Google (UI inactiv până flip). Același tip ca `AUTH_GITHUB_ID`.                                                                                                                                                   |
| `AUTH_GOOGLE_SECRET` | **secret** | `.env.local` | Pregătit pentru Google.                                                                                                                                                                                                           |

Rânduri în `.env.example`:

```
AUTH_SECRET=
AUTH_GITHUB_ID=
AUTH_GITHUB_SECRET=
AUTH_URL=
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=
```

## Pași manuali

1. Creează o **OAuth App** pe GitHub (Developer settings → OAuth Apps → New).
2. **Homepage URL**
   - Local: `http://localhost:3000`
   - Producție: URL-ul Production din Vercel
3. **Authorization callback URL** — **obligatoriu pe fiecare mediu**:
   - Local: `http://localhost:3000/api/auth/callback/github`
   - Producție: `https://<domeniu-productie>/api/auth/callback/github`
4. Copiază **Client ID** → `AUTH_GITHUB_ID` și generează **Client secret** → `AUTH_GITHUB_SECRET`.
5. Generează `AUTH_SECRET`: `npx auth secret` (sau `openssl rand -base64 32`).
6. Setează `AUTH_URL` pe producție la URL-ul canonic (fără slash final).
7. Adaugă aceleași variabile în Vercel → Settings → Environment Variables pentru **Production** și **Preview**, cu tipul corect (Sensitive pe secrete). Apoi **Redeploy**.
8. **Preview deployments:** URL-ul se schimbă la fiecare deploy. Decizie: autentificarea pe Preview **nu e garantată** fără un domeniu stabil / wildcard pe GitHub; verificarea de curs se face pe **Production** (+ local).
9. La **schimbarea domeniului** de producție: actualizează Homepage + Callback pe GitHub, `AUTH_URL` pe Vercel, Redeploy.

## Cost & limite

| Aspect      | Detaliu                                                                     |
| ----------- | --------------------------------------------------------------------------- |
| Plan GitHub | OAuth Apps — gratuit pentru acest uz                                        |
| Rate limits | Limitele GitHub API pentru OAuth; login-ul e rar față de chat               |
| Cost model  | Autentificarea în sine e gratuită; protejează costul apelurilor LLM         |
| Pricing     | Nu aplică — [GitHub OAuth Apps](https://docs.github.com/en/apps/oauth-apps) |

## Verificare

- Fără variabile: `npm run dev` pornește; fără buton de login Auth; chat ca înainte (dev).
- Cu variabile: sidebar → **Conectează-te** → fereastră (GitHub activ, Google „Urmează”) → cont real + ieșire.
- Profil: email readonly (sau mesaj dacă GitHub nu l-a trimis).
- Fără sesiune: `curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:3000/api/chat -H "Content-Type: application/json" -d "{\"messages\":[]}"` → **401**.
- Cu sesiune: în terminalul serverului apare `[api/chat] userId=…` și **nimic altceva** despre utilizator.
- Anulare: deschide `http://localhost:3000/api/auth/callback/github?error=access_denied` → redirect pe `/` cu mesaj în română, **o singură linie** în terminal `[auth] oauth_provider_error=access_denied`.
- Repetă 401 + login pe **domeniul de producție**.

## Referințe

- [Auth.js — Next.js](https://authjs.dev/getting-started/installation?framework=Next.js)
- [GitHub — Creating an OAuth App](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app)
- Cod: `src/lib/auth.ts`, `src/app/api/auth/[...nextauth]/route.ts`
