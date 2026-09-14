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

| Component       | Technology                                         | From phase |
| --------------- | -------------------------------------------------- | ---------- |
| Web framework   | Next.js 16 (App Router)                            | 1.1        |
| Language        | TypeScript                                         | 1.1        |
| Styling         | Tailwind CSS v4 + shadcn/ui                        | 1.1        |
| Formatting      | Prettier + prettier-plugin-tailwindcss             | 1.1        |
| Client state    | Zustand + persist (localStorage); theme on Context | 1.2 / 1.7  |
| LLM integration | Vercel AI SDK                                      | 1.3        |
| LLM calls       | Server-side only                                   | 1.3        |
| Deploy          | Vercel (Preview + Production)                      | 1.4        |
| MVP users       | Single-user (no auth)                              | 1–2        |

### Security

- API keys live in server-side env vars only (`.env.local`). **Never** expose them to the browser.
- Provider must be swappable via abstraction — no hard-coded provider logic scattered in UI.
- `.env.example` lists variable names only; `.gitignore` excludes all `.env*` files with secrets.

### Message transforms and chat UI

- Message transforms (text extraction, export serialization) live in `src/lib/message-utils.ts` as **pure**
  functions — inputs in, string out; no store, no `document`, no `fetch`.
- **One** place extracts text from a `UIMessage` (`getMessageText`). Do not re-implement parts → text elsewhere.
- JSON and Markdown export must share the same intermediate payload; do not maintain two independent shapes.
- **Product rule:** no action bar above the conversation. New chat stays in the sidebar; export in the header
  menu; copy / regenerate appear on the message (hover). The chat center stays clean.

### Message ownership and store reads

- **While streaming:** `useChat` owns messages (token-by-token). Do **not** write them to the persisted store
  on every token — `persist` sync-writes `localStorage` and will freeze the UI on long replies.
- **After the stream (`onFinish`):** the Zustand store is the archive (`conversations[].messages`). Sync once.
- **Opening a conversation:** remount the chat owner with `key={conversationId}` and pass archived
  `messages` into `useChat`. Changing `activeConversationId` alone does not reset the hook’s internal list.
- **Store reads:** always use selectors — `useAppStore(s => s.providerId)`, never `useAppStore()` then
  destructure (that subscribes to every store change).
- **Selectors must not return fresh objects/arrays** on each call (`s => ({ a: s.a })` or `?? []` without a
  stable empty constant) — that forces infinite re-renders. Use separate selectors or `useShallow`.
- **Persisted shape changes** require bumping persist `version` and a `migrate` function. Skipping this
  surfaces as a cryptic UI crash far from the store.
- **Hydration:** never act on pre-hydration defaults (e.g. empty `conversations`) — that creates a blank
  conversation on every page load. Gate UI on `useStoreHydration`.
- **Context vs store:** rare values with few consumers → React context; frequently changing state read
  from many places → Zustand with selectors. This app uses both (theme context + session context + app store).
- **Theme is not in the store:** preference lives in `ThemeProvider` / `useTheme()`, persisted under
  `skillforge-theme` (not inside `skillforge-app` / `partialize`). Do not re-add `theme` / `setTheme` to
  the Zustand store.
- **shadcn UI files:** do not hand-edit generated files under `src/components/ui/` unless documenting an
  exception. **Exception:** `src/components/ui/sonner.tsx` uses our `useTheme()` so toasts follow the
  chosen theme (the generated file depended on `next-themes` without a provider).

---

## Current phase: 1.7 (Theme on Context)

**In scope:** move theme preference from the Zustand store to `createContext` + `useTheme()`; dedicated
`skillforge-theme` key; blocking pre-paint script; `resolveTheme` kept pure; Sonner wired to our hook;
document the reimplementation in `docs/requirements.md`.

**Out of scope:** theme libraries, new env vars / integrations, header theme toggle, removing
`next-themes` from `package.json` by guesswork.

Re-read `docs/requirements.md` section 5 (Faza 1.7) before changing scope.

---

## Agent skills

| Path                             | Role                                       |
| -------------------------------- | ------------------------------------------ |
| `.claude/skills/<name>/SKILL.md` | **Source of truth** for project skills     |
| `.github/skills/<name>/SKILL.md` | **Mirror** (identical content) for Copilot |

- Folder name must match frontmatter `name`.
- After editing a skill under `.claude/skills/`, run `./scripts/sync-skills.sh`.
- `./scripts/sync-skills.sh --check` fails if mirrors drift.
- Claude Code and Copilot read the same SKILL.md format — keep both trees identical.

---

## Definition of done

A module/phase is done when:

1. Scope in `docs/requirements.md` matches what shipped.
2. External integrations have `docs/<integration>/README.md` + index row + `.env.example` names.
3. `npm run build` succeeds **without** `.env.local`.
4. **Before publish:** run the `pre-deploy` skill checklist (`.claude/skills/pre-deploy/SKILL.md`).

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
