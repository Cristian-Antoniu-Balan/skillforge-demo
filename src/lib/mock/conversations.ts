// Conversații inventate — înlocuite dintr-o singură atingere când vine backend-ul / LLM-ul.
import type { UIMessage } from "ai";

import type { Conversation } from "@/lib/types";

function textMessage(id: string, role: UIMessage["role"], text: string): UIMessage {
  return { id, role, parts: [{ type: "text", text }] };
}

export const mockConversations: Conversation[] = [
  {
    id: "conv-1",
    title: "Gap analysis Java → AI",
    createdAt: "2026-02-28T10:00:00.000Z",
    updatedAt: "2026-02-28T10:15:00.000Z",
    messages: [
      textMessage("msg-1", "user", "Ce-mi lipsește ca să trec de la Java backend la AI engineer?"),
      textMessage(
        "msg-2",
        "assistant",
        "Pe baza profilului tău (Java avansat, Spring intermediar, TS/React începător), iată gap-urile principale:\n\n1. **Fundamentals ML/AI** — concepte de embeddings, tokenizare, prompt engineering\n2. **Python pentru AI** — ecosistemul standard (LangChain, notebooks)\n3. **Vector DB** — Pinecone, pgvector sau Chroma\n4. **LLM APIs** — apeluri server-side, streaming, tool calling\n5. **Frontend AI** — Vercel AI SDK, chat UI cu streaming\n\nRecomandare: 3 luni, începând cu Python + un proiect RAG mic peste documentația ta Spring."
      ),
      textMessage("msg-3", "user", "Poți detalia prima lună?"),
      textMessage(
        "msg-4",
        "assistant",
        "**Luna 1 — Fundamente**\n\n- Săpt. 1–2: Python crash course + Jupyter; reprodu un script simplu de embeddings cu OpenAI/Anthropic API\n- Săpt. 3: Documentează ce ai învățat; construiește un CLI care întreabă un PDF\n- Săpt. 4: Intro RAG — chunking, vector store local (Chroma)\n\nDeliverable: repo `java-dev-first-rag` cu README în română."
      )
    ]
  },
  {
    id: "conv-2",
    title: "Plan Next.js + AI SDK",
    createdAt: "2026-03-01T14:00:00.000Z",
    updatedAt: "2026-03-01T14:30:00.000Z",
    messages: [
      textMessage("msg-5", "user", "Fă-mi un plan de 3 luni pentru Next.js + AI SDK"),
      textMessage(
        "msg-6",
        "assistant",
        "**Plan 3 luni — Next.js + Vercel AI SDK**\n\n**Luna 1:** App Router, Route Handlers, streaming text cu `streamText`\n**Luna 2:** Profil persistent, system prompt din persona, memorie conversații\n**Luna 3:** Tool calling, al doilea provider, deploy Vercel\n\nFiecare lună = un proiect publicabil pe GitHub."
      )
    ]
  },
  {
    id: "conv-3",
    title: "Pregătire interviu Spring",
    createdAt: "2026-03-10T09:00:00.000Z",
    updatedAt: "2026-03-10T09:20:00.000Z",
    messages: [
      textMessage("msg-7", "user", "Ajută-mă cu întrebări de interviu Spring Boot"),
      textMessage(
        "msg-8",
        "assistant",
        "Iată 5 întrebări clasice pentru nivelul tău:\n\n1. Diferența `@Component` vs `@Service` vs `@Repository`\n2. Ciclul de viață al unui `@Bean`\n3. `@Transactional` — propagare și rollback\n4. Spring Security filter chain — ordinea\n5. Cum testezi un `@RestController` cu `@WebMvcTest`\n\nVrei să le parcurgem pe rând cu răspunsuri model?"
      )
    ]
  }
];

export const mockAssistantReplies = [
  "Am analizat contextul profilului tău. Următorul pas concret ar fi să definești un proiect mic pe care îl poți publica în 2 săptămâni — asta ancorează învățarea.",
  "Pe stack-ul tău actual, recomand să prioritizezi integrarea LLM server-side înainte de RAG complex. Route Handler + streaming e fundația.",
  "Plan scurt: 1) clarifică obiectivul SMART, 2) identifică 3 skill-uri gap, 3) alocă 5h/săptămână cu deliverable clar.",
  "Interesantă direcția! Pot detalia oricare subiect — spune-mi dacă vrei plan lunar, resurse sau exerciții practice."
];
