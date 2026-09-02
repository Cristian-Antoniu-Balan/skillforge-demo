# [Numele integrării] — Șablon documentație

> Copiază acest fișier în `docs/<integrare>/README.md` când adaugi o integrare externă.
> Înlocuiește secțiunile de mai jos — nu lăsa placeholder-e la commit.

---

## Ce face

La ce ne folosește această integrare în SkillForge.

_Exemplu: Anthropic furnizează modelul Claude, apelat din `/api/chat` pentru răspunsuri în streaming._

---

## Cont & chei

| Pas                         | Unde                           |
| --------------------------- | ------------------------------ |
| Creare cont                 | URL platformă                  |
| Generare cheie API          | Meniu / secțiune din dashboard |
| Scope / permisiuni necesare | Ce trebuie activat             |

**Nu scrie cheia reală aici** — doar unde se obține.

---

## Variabile de mediu

| Variabilă         | Fișier       | Descriere                       |
| ----------------- | ------------ | ------------------------------- |
| `EXEMPLU_API_KEY` | `.env.local` | Cheia API generată în dashboard |

Rând de adăugat în `.env.example`:

```
EXEMPLU_API_KEY=
```

---

## Pași manuali

Ce **nu** poate face agentul — trebuie făcut de tine:

1. ...
2. ...

---

## Cost & limite

| Aspect          | Detaliu                                                   |
| --------------- | --------------------------------------------------------- |
| Plan gratuit    | Da / Nu — ce include                                      |
| Rate limits     | Cereri / minut etc.                                       |
| Cost orientativ | Link către [pricing oficial](https://example.com/pricing) |

Prețurile se schimbă — verifică sursa oficială.

---

## Verificare

Cum confirmi că integrarea funcționează:

- Comandă: `curl ...` sau
- Ecran: deschide ... și verifică ...

---

## Referințe

- [Documentație oficială](https://example.com/docs)
