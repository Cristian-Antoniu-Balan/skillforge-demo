---
name: add-provider
description: >-
  Recipe to add another LLM provider to SkillForge via the registry.
  Use when adding a new provider, wiring a second/third model vendor,
  or extending src/lib/providers.ts.
---

# Add provider checklist

Goal: a new vendor = **one registry entry** (+ one `getModel` branch + docs/env).
If you had to edit the composer or the preferences list, the abstraction leaked — fix that, don't bypass it.

## Do (in order)

1. **SDK package**
   - Install the AI SDK provider package (e.g. `npm install @ai-sdk/google`).
   - Match major version with existing `@ai-sdk/*` packages in `package.json`.

2. **Registry entry** — `src/lib/providers.ts`
   - Append one object: `id`, `name`, `models`, `defaultModelId`, `envKey`.
   - **Model IDs from current vendor docs** — never invent IDs from memory.
   - Keep Anthropic first (course default). New providers go after existing ones.
   - This file is browser-safe: **no** `process.env`, **no** API keys, **no** SDK imports.

3. **Server factory** — `src/lib/providers.server.ts`
   - Add one `case` in `getModel` for the new `ProviderId`.
   - Extend the `ProviderId` union in `providers.ts` so the switch stays exhaustive.
   - Do **not** add provider `if`s in `/api/chat`, composer, or preferences.

4. **Env**
   - Add the variable **name** to `.env.example` (empty value).
   - Tell the user to set it in `.env.local` and in Vercel (Production **and** Preview) → Redeploy.
   - Never commit real keys.

5. **Docs**
   - Create `docs/<provider>/README.md` from `docs/_template/README.md` (all six sections).
   - Add a row to the integrations table in `docs/README.md`.
   - Same commit as the code.

6. **UI check (no code)**
   - Composer selector and Preferințe → Providere should list the new provider **automatically**.
   - Without the key: option visible, disabled, reason in tooltip / badge.
   - With the key: send the same message on the new provider and on Anthropic.

7. **Verify**
   - `npm run build` without `.env.local`.
   - `npm run format`.

## Do not

- Hard-code provider names in `chat-input`, `providers-form`, or `/api/chat`.
- Read `process.env` (even `Boolean(...)`) in client components.
- Put secrets or `process.env` in `src/lib/providers.ts`.
- Skip docs / `.env.example` / Vercel env for “just a quick test”.

## Smell test

| Symptom                                              | Meaning                                       |
| ---------------------------------------------------- | --------------------------------------------- |
| Edited composer or preferences list for the new name | Abstraction broken — map over `PROVIDERS`     |
| Invented model id → opaque SDK/API error             | Re-read vendor model docs                     |
| UI hides unconfigured providers                      | Must stay visible with reason                 |
| Client checks `process.env.OPENAI_API_KEY`           | Use `GET /api/providers` display data instead |

After publish: run the `pre-deploy` skill (includes Vercel env + Redeploy).
