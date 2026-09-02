// Conversații inventate — înlocuite dintr-o singură atingere când vine backend-ul / LLM-ul.
import type { Conversation, ProviderConfig } from "@/lib/types";

export const mockProviders: ProviderConfig[] = [
  {
    id: "anthropic",
    name: "Anthropic",
    models: ["claude-sonnet-4-20250514", "claude-haiku-3-5-20241022"]
  },
  {
    id: "openai",
    name: "OpenAI",
    models: ["gpt-4o", "gpt-4o-mini"]
  }
];

export const mockConversations: Conversation[] = [
  {
    id: "conv-1",
    title: "Gap analysis Java → AI",
    createdAt: "2026-02-28T10:00:00.000Z",
    updatedAt: "2026-02-28T10:15:00.000Z",
    messages: [
      {
        id: "msg-1",
        role: "user",
        content: "Ce-mi lipsește ca să trec de la Java backend la AI engineer?",
        createdAt: "2026-02-28T10:00:00.000Z"
      },
      {
        id: "msg-2",
        role: "assistant",
        content:
          "Pe baza profilului tău (Java avansat, Spring intermediar, TS/React începător), iată gap-urile principale:\n\n1. **Fundamentals ML/AI** — concepte de embeddings, tokenizare, prompt engineering\n2. **Python pentru AI** — ecosistemul standard (LangChain, notebooks)\n3. **Vector DB** — Pinecone, pgvector sau Chroma\n4. **LLM APIs** — apeluri server-side, streaming, tool calling\n5. **Frontend AI** — Vercel AI SDK, chat UI cu streaming\n\nRecomandare: 3 luni, începând cu Python + un proiect RAG mic peste documentația ta Spring.",
        createdAt: "2026-02-28T10:01:30.000Z"
      },
      {
        id: "msg-3",
        role: "user",
        content: "Poți detalia prima lună?",
        createdAt: "2026-02-28T10:05:00.000Z"
      },
      {
        id: "msg-4",
        role: "assistant",
        content:
          "**Luna 1 — Fundamente**\n\n- Săpt. 1–2: Python crash course + Jupyter; reprodu un script simplu de embeddings cu OpenAI/Anthropic API\n- Săpt. 3: Documentează ce ai învățat; construiește un CLI care întreabă un PDF\n- Săpt. 4: Intro RAG — chunking, vector store local (Chroma)\n\nDeliverable: repo `java-dev-first-rag` cu README în română.",
        createdAt: "2026-02-28T10:06:00.000Z"
      }
    ]
  },
  {
    id: "conv-2",
    title: "Plan Next.js + AI SDK",
    createdAt: "2026-03-01T14:00:00.000Z",
    updatedAt: "2026-03-01T14:30:00.000Z",
    messages: [
      {
        id: "msg-5",
        role: "user",
        content: "Fă-mi un plan de 3 luni pentru Next.js + AI SDK",
        createdAt: "2026-03-01T14:00:00.000Z"
      },
      {
        id: "msg-6",
        role: "assistant",
        content:
          "**Plan 3 luni — Next.js + Vercel AI SDK**\n\n**Luna 1:** App Router, Route Handlers, streaming text cu `streamText`\n**Luna 2:** Profil persistent, system prompt din persona, memorie conversații\n**Luna 3:** Tool calling, al doilea provider, deploy Vercel\n\nFiecare lună = un proiect publicabil pe GitHub.",
        createdAt: "2026-03-01T14:01:00.000Z"
      }
    ]
  },
  {
    id: "conv-3",
    title: "Pregătire interviu Spring",
    createdAt: "2026-03-10T09:00:00.000Z",
    updatedAt: "2026-03-10T09:20:00.000Z",
    messages: [
      {
        id: "msg-7",
        role: "user",
        content: "Ajută-mă cu întrebări de interviu Spring Boot",
        createdAt: "2026-03-10T09:00:00.000Z"
      },
      {
        id: "msg-8",
        role: "assistant",
        content:
          "Iată 5 întrebări clasice pentru nivelul tău:\n\n1. Diferența `@Component` vs `@Service` vs `@Repository`\n2. Ciclul de viață al unui `@Bean`\n3. `@Transactional` — propagare și rollback\n4. Spring Security filter chain — ordinea\n5. Cum testezi un `@RestController` cu `@WebMvcTest`\n\nVrei să le parcurgem pe rând cu răspunsuri model?",
        createdAt: "2026-03-10T09:02:00.000Z"
      }
    ]
  }
];

export const mockAssistantReplies = [
  "Am analizat contextul profilului tău. Următorul pas concret ar fi să definești un proiect mic pe care îl poți publica în 2 săptămâni — asta ancorează învățarea.",
  "Pe stack-ul tău actual, recomand să prioritizezi integrarea LLM server-side înainte de RAG complex. Route Handler + streaming e fundația.",
  "Plan scurt: 1) clarifică obiectivul SMART, 2) identifică 3 skill-uri gap, 3) alocă 5h/săptămână cu deliverable clar.",
  "Interesantă direcția! Pot detalia oricare subiect — spune-mi dacă vrei plan lunar, resurse sau exerciții practice."
];
