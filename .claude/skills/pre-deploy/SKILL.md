---
name: pre-deploy
description: >-
  Checklist before publishing SkillForge to Vercel. Use when the user asks to
  deploy, publish, ship, go live, push to production, or run pre-deploy checks.
---

# Pre-deploy checklist

Run this **before every** publish (Production or intentional Preview that needs env).

## Do

1. **Build without secrets**
   - Move/rename `.env.local` out of the way (do not delete permanently).
   - Run `npm run build` — must succeed with no API keys.
   - Restore `.env.local` after.

2. **Format**
   - Run `npm run format:check`.

3. **Requirements**
   - Confirm `docs/requirements.md` matches what you are shipping (phase, in/out of scope, header date).

4. **Vercel env vs `.env.example`**
   - Every variable name in `.env.example` exists in Vercel → Project → Settings → Environment Variables.
   - Each is set for **Production** and **Preview**.
   - If you **added or changed** a variable: trigger **Redeploy** (existing deployments do not see new env until Redeploy).

5. **Docs hygiene**
   - No real secrets in `docs/`, README, or commits.
   - Public Production URL is in `README.md` once known.

## Do not

- Never commit or upload `.env.local`.
- Never write real API keys, tokens, or passwords into `docs/` or `.env.example`.
- Do not add `vercel.json` or hand-written build commands unless defaults fail.

## After checks

- Push / merge to the intended branch (`main` → Production; other branches → Preview).
- Smoke-test: open the URL on a phone; send a chat message (expect streaming if keys are set, or clean **Provider neconfigurat** if not).

Manual Vercel steps: [`docs/vercel/README.md`](../../../docs/vercel/README.md).
