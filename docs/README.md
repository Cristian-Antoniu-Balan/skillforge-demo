# Documentație SkillForge

Index pentru cerințe, integrări externe și instrucțiuni agenți.

## Cerințe și instrucțiuni

| Document                                         | Conținut                                                                         |
| ------------------------------------------------ | -------------------------------------------------------------------------------- |
| [`requirements.md`](requirements.md)             | Cerințe complete — **sursa de adevăr** (RO)                                      |
| [`agent-instructions.md`](agent-instructions.md) | Instrucțiuni pentru agenți AI (EN) — sursă canonică, sincronizată în `AGENTS.md` |

## Integrări externe

Fiecare serviciu terț (provider LLM, DB, auth, deploy, monitorizare) are propriul folder
`docs/<integrare>/README.md` cu pașii manuali: cont, chei, env vars, dashboard, cost.

**Reguli:**

- Cheile reale stau **doar** în `.env.local` (gitignorat)
- În `docs/` se scriu **numele** variabilelor, nu valorile
- La adăugarea unei integrări: creează fișierul + adaugă rândul în tabelul de mai jos

| Integrare                                              | Pas / fază | Link |
| ------------------------------------------------------ | ---------- | ---- |
| _(gol — se completează pe măsură ce apar integrările)_ |            |      |

## Șablon

Pentru o integrare nouă, copiază structura din [`_template/README.md`](_template/README.md).
