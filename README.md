# SkillForge

Copilot personal de skills și carieră — cunoaște profilul tău, răspunde în contextul tău
și propune pași concreți de învățare. Construit modular pe parcursul unui curs despre
integrarea LLM-urilor într-o aplicație web reală.

## Aplicație publicată

> URL Production: _copiază din Vercel → Project → **Domains** după ce Deployment Protection e
> dezactivat pe Production (altfel linkul cere login Vercel)._ Pași: [`docs/vercel/README.md`](docs/vercel/README.md).

Proiect: [Vercel Dashboard](https://vercel.com) → `skillforge-demo` (conectat la GitHub).
Preview: fiecare branch/push → URL de test separat în Deployments.

## Rulare locală

```bash
npm install
cp .env.example .env.local   # completează ANTHROPIC_API_KEY pentru chat real
npm run dev
```

Deschide [http://localhost:3000](http://localhost:3000).

Fără cheie, UI-ul pornește; la primul mesaj chat apare **Provider neconfigurat**.

```bash
npm run build         # build producție (trebuie să treacă și fără .env.local)
npm run format        # formatare Prettier
npm run format:check  # verificare format (pre-deploy)
```

Înainte de publicare: rulează checklist-ul din skill-ul `pre-deploy`
(`.claude/skills/pre-deploy/SKILL.md`).

## Documentație

| Fișier                                                     | Conținut                                    |
| ---------------------------------------------------------- | ------------------------------------------- |
| [`docs/requirements.md`](docs/requirements.md)             | Cerințe complete — **sursa de adevăr** (RO) |
| [`docs/README.md`](docs/README.md)                         | Index documentație + integrări externe      |
| [`docs/vercel/README.md`](docs/vercel/README.md)           | Deploy Vercel — pași manuali                |
| [`docs/anthropic/README.md`](docs/anthropic/README.md)     | Cheie Anthropic                             |
| [`docs/agent-instructions.md`](docs/agent-instructions.md) | Instrucțiuni pentru agenți AI (EN)          |

## Instrucțiuni agenți (sync)

```bash
./scripts/sync-agent-instructions.sh   # AGENTS.md, CLAUDE.md, .github/copilot-instructions.md
./scripts/sync-skills.sh               # .claude/skills/ → .github/skills/
./scripts/sync-skills.sh --check       # verifică că oglinda e la zi
```

## Stare curentă

**Faza 1.8** — finisaje UX (markdown formatat în streaming, highlighting selectiv, indicator „scrie…”,
editare + retrimitere). Faza 1.7 (temă pe Context) e livrată.

## Dependențe notabile (nu sunt integrări externe)

| Pachet                          | De ce e aici                                                                         |
| ------------------------------- | ------------------------------------------------------------------------------------ |
| `react-markdown` + `remark-gfm` | Randare markdown sigură (fără HTML brut) + tabele/liste GFM                          |
| `lowlight` + `highlight.js`     | Syntax highlighting; înregistrăm **doar** limbajele folosite în chat (fără `common`) |
| `@tailwindcss/typography`       | Clase `prose` — tipografie markdown fără CSS scris de mână                           |

Acestea nu au cont / cheie API → **nu** primesc folder în `docs/` (vezi regula integrărilor).
