<!-- AUTO-GENERATED — do not edit directly.
     Edit docs/agent-instructions.md and run: ./scripts/sync-agent-instructions.sh -->

# SkillForge — Agent Instructions

> **Canonical source.** Edit this file, then run `./scripts/sync-agent-instructions.sh`
> to update `AGENTS.md`, `CLAUDE.md`, and `.github/copilot-instructions.md`.

---

## Project overview

SkillForge is a personal skills and career copilot built incrementally as a course project.
The goal is to learn how to connect an LLM to a real web interface — not a single-page demo.

**Before any work:** read [`docs/requirements.md`](requirements.md) for the current phase scope,
acceptance criteria, and glossary.

---

## Core rules

### 1. Requirements are the source of truth

- [`docs/requirements.md`](requirements.md) (Romanian) defines **what** we build and **when**.
- If scope changes during a module, **update `docs/requirements.md` first** (or in the same commit),
  not just the chat conversation.
- Do not duplicate requirements in README or agent instructions — link to the file.

### 2. External integration documentation

Every time you add an external integration:

1. Create `docs/<integration>/README.md` using the template at [`docs/_template/README.md`](_template/README.md)
2. Add a row to the integrations table in [`docs/README.md`](README.md)
3. Update `.env.example` with the new variable names
4. Do all of the above **in the same commit** as the integration code

Manual steps the user must perform (document in the integration README):

| Include                                        | Do NOT include           |
| ---------------------------------------------- | ------------------------ |
| Where to create an account                     | Real API keys or secrets |
| Where to generate the API key                  | Actual env values        |
| Env variable **names** (e.g. `OPENAI_API_KEY`) | Passwords or tokens      |
| Dashboard configuration steps                  |                          |
| Cost estimate + link to official pricing       |                          |

Integrations that require this: LLM providers, databases, authentication, deploy platforms,
monitoring services.

The agent writes the code; the user follows the manual steps. Without documentation, setup
is lost on reinstall, new machine, or deploy.

### 3. Modular, incremental approach

- One module = one clear addition. Explain **what** was added and **why** it was needed.
- Do not generate code beyond the current phase scope.
- Do not over-engineer for future phases — implement what requirements specify for **this** phase.
- Minimize scope: the simplest correct solution is preferred.

### 4. Language conventions

| Artifact                       | Language                             |
| ------------------------------ | ------------------------------------ |
| `docs/requirements.md`         | Romanian                             |
| `docs/<integration>/README.md` | Romanian (manual steps for the user) |
| Agent instructions (this file) | English                              |
| Code — explanatory comments    | Romanian (why, not what)             |
| Code — identifiers             | English                              |

---

## Technical stack

| Component       | Technology                             | From phase |
| --------------- | -------------------------------------- | ---------- |
| Web framework   | Next.js 16 (App Router)                | 1.1        |
| Language        | TypeScript                             | 1.1        |
| Styling         | Tailwind CSS v4 + shadcn/ui            | 1.1        |
| Formatting      | Prettier + prettier-plugin-tailwindcss | 1.1        |
| Client state    | Zustand + persist (localStorage)       | 1.2        |
| LLM integration | Vercel AI SDK                          | 1.3        |
| LLM calls       | Server-side only                       | 1.3        |
| MVP users       | Single-user (no auth)                  | 1–2        |

### Security

- API keys live in server-side env vars only (`.env.local`). **Never** expose them to the browser.
- Provider must be swappable via abstraction — no hard-coded provider logic scattered in UI.
- `.env.example` lists variable names only; `.gitignore` excludes all `.env*` files with secrets.

---

## Current phase: 1.2 (full UI with mock data)

**In scope:** complete chat UI, sidebar, settings dialog, Zustand store, mock data in `src/lib/mock/`.

**Out of scope:** real LLM calls, `/api/chat`, API keys, LLM SDKs.

When phase 1.3 begins (AI agent), re-read `docs/requirements.md` section 5 (Faza 1.3).

---

## Coding conventions

- Match existing project patterns before introducing new ones.
- Keep code readable for human maintainers — explicit over clever.
- Comments only for non-obvious business logic.
- Do not add tests unless requested or they cover real behavior meaningfully.
- Do not create commits unless the user asks.

---

## Workflow per module

1. Read `docs/requirements.md` — confirm current phase and in/out of scope.
2. Implement only what the phase requires.
3. If scope changes, update `docs/requirements.md`.
4. If adding an external integration, create `docs/<integration>/README.md`.
5. Explain changes to the user: what was added, why, and how to verify.

---

## Glossary (aligned with requirements)

| Term                  | Meaning                                                         |
| --------------------- | --------------------------------------------------------------- |
| **Agent**             | AI orchestrator with system prompt, memory, and (phase 3) tools |
| **Provider**          | External LLM service called server-side                         |
| **Streaming**         | Token-by-token response delivery in the UI                      |
| **Profile / Persona** | User data: stack, skills + level, career goal                   |
| **Memory**            | Persisted context across sessions                               |
| **System prompt**     | Instructions injected from profile at each LLM call             |
| **Tools**             | Functions the agent invokes autonomously (phase 3)              |

Full glossary: [`docs/requirements.md` §9](requirements.md#9-glosar).
