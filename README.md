# SkillForge

Copilot personal de skills și carieră — cunoaște profilul tău, răspunde în contextul tău
și propune pași concreți de învățare. Construit modular pe parcursul unui curs despre
integrarea LLM-urilor într-o aplicație web reală.

## Documentație

| Fișier | Conținut |
|--------|----------|
| [`docs/requirements.md`](docs/requirements.md) | Cerințe complete — **sursa de adevăr** (RO) |
| [`docs/agent-instructions.md`](docs/agent-instructions.md) | Instrucțiuni pentru agenți AI (EN) |

## Instrucțiuni agenți (sync)

Fișierele `AGENTS.md`, `CLAUDE.md` și `.github/copilot-instructions.md` sunt generate
automat din sursa canonică. După editarea instrucțiunilor:

```bash
./scripts/sync-agent-instructions.sh
```

## Stare curentă

**Faza 0** — fundația documentației. Codul aplicației începe la **Faza 1**.

### Rulare aplicație (Faza 1+)

> Va fi completat la modulul următor (Next.js + TypeScript + Vercel AI SDK).
