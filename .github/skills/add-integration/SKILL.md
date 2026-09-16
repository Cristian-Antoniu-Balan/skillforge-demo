---
name: add-integration
description: >-
  Checklist when adding an external integration to SkillForge (docs, env,
  index). Use when wiring a new third-party service: auth, database, deploy,
  monitoring, or any API that needs docs/<integration>/README.md.
---

# Add integration checklist

Goal: every external service leaves a **reproducible setup trail** — docs + env names +
index row — in the **same change** as the code. The agent writes code; the user follows
manual steps. Without docs, setup is lost on reinstall, new machine, or deploy.

## Do (in order)

1. **Docs from template**
   - Create `docs/<integration>/README.md` from [`docs/_template/README.md`](../../../docs/_template/README.md).
   - Fill **all six sections**: Ce face, Cont & chei, Variabile de mediu, Pași manuali, Cost & limite, Verificare (+ Referințe if useful).
   - Language: **Romanian** for user-facing manual steps.
   - Manual steps must include: where to create an account, where to generate keys, dashboard config, what to redo when the domain changes.

2. **Variables table quality**
   - List **names only** — never real secrets.
   - Mark each variable **secret** or **config** and say what that implies:
     - **secret** — if leaked, someone can act as the app / forge sessions; fix = rotate.
     - **config** — identifies or locates (public client id, app URL); not an authorization proof.
   - On Vercel: Sensitive/encrypted **on** for secrets, **off** for config so values stay readable when debugging.

3. **Index**
   - Add a row to the integrations table in [`docs/README.md`](../../../docs/README.md).

4. **`.env.example`**
   - Append the new variable **names** with empty values (placeholders only).
   - Never paste values from `.env.local`.

5. **Hosting**
   - Remind: set the same names in Vercel → Production **and** Preview → **Redeploy** after changes.
   - If the flow depends on domain (OAuth callbacks, webhooks), document localhost + production URLs and the Preview policy.

6. **Secret hygiene check (before finish)**
   - Grep / skim `docs/` and `.env.example`: no live API keys, tokens, passwords, or `AUTH_SECRET` values.
   - Real values stay in `.env.local` (gitignored) and the host’s env UI.

7. **Verify**
   - `npm run build` without `.env.local` still succeeds (unless the phase explicitly requires otherwise).
   - Follow the Verificare section in the new README.

## Do not

- Skip docs because “it’s just one key”.
- Put secrets in markdown, commits, or `.env.example`.
- Document only in chat — chat is not the source of truth.
- Add a second incomplete README “for later”.

## Smell test

| Symptom                                     | Meaning                                     |
| ------------------------------------------- | ------------------------------------------- |
| Integration works only on your machine      | Docs or `.env.example` incomplete           |
| All env vars treated as “secrets” on Vercel | Config values become unverifiable           |
| Callback URL only lists localhost           | Production login will fail                  |
| Real key appears in `docs/`                 | Rotate immediately; scrub history if needed |

Reuse this skill at the persistence step (database) and any later third-party service.
