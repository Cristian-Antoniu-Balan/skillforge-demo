# SkillForge

Copilot personal de skills și carieră — cunoaște profilul tău, răspunde în contextul tău
și propune pași concreți de învățare. Construit modular pe parcursul unui curs despre
integrarea LLM-urilor într-o aplicație web reală.

## Rulare locală

```bash
npm install
cp .env.example .env.local   # opțional — pentru /api/hello
npm run dev
```

Deschide [http://localhost:3000](http://localhost:3000).

```bash
npm run build    # build producție
npm run format   # formatare Prettier
```

## Documentație

| Fișier                                                     | Conținut                                    |
| ---------------------------------------------------------- | ------------------------------------------- |
| [`docs/requirements.md`](docs/requirements.md)             | Cerințe complete — **sursa de adevăr** (RO) |
| [`docs/README.md`](docs/README.md)                         | Index documentație + integrări externe      |
| [`docs/agent-instructions.md`](docs/agent-instructions.md) | Instrucțiuni pentru agenți AI (EN)          |

## Instrucțiuni agenți (sync)

Fișierele `AGENTS.md`, `CLAUDE.md` și `.github/copilot-instructions.md` sunt generate
automat din sursa canonică:

```bash
./scripts/sync-agent-instructions.sh
```

## Vite + React vs Next.js

| Aspect                 | Vite + React                     | Next.js (acest proiect)                                                     |
| ---------------------- | -------------------------------- | --------------------------------------------------------------------------- |
| **Routing**            | React Router (config manual)     | App Router — foldere în `src/app/` → URL-uri                                |
| **Unde rulează codul** | Tot în browser (SPA)             | Server Components pe server + Client Components (`"use client"`) în browser |
| **API / secrete**      | Backend separat necesar          | Route Handlers (`src/app/api/`) — env fără `NEXT_PUBLIC_` rămân pe server   |
| **Variabile env**      | `VITE_*` ajunge în bundle client | Doar `NEXT_PUBLIC_*` ajunge în browser; restul e server-only                |
| **Deploy**             | Fișiere statice (CDN)            | Node.js server sau platformă compatibilă (ex. Vercel)                       |

## Stare curentă

**Faza 1.2** — interfață completă cu date mock. Următorul pas: agent AI + streaming LLM (Faza 1.3).

Deploy: proiectul e pregătit pentru Vercel (`npm run build` trece fără variabile de mediu obligatorii).
