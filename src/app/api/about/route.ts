// Descrierea aplicației stă DOAR aici — UI-ul o consumă ca stream, fără text hardcodat în client.
// Același tip de canal (SSE peste HTTP) va transporta tokenii LLM la pasul următor; schimbăm sursa, nu protocolul.
export const runtime = "nodejs";

// Bucăți scurte ca pauza de ~120ms să fie vizibilă — un blob mare ar arăta ca un răspuns static.
const ABOUT_CHUNKS = [
  "SkillForge este un copilot personal de skills și carieră. ",
  "Nu e un chat generic: cunoaște profilul tău (stack, skills, obiectiv) ",
  "și răspunde în contextul tău real.\n\n",
  "Aplicația e construită modular, pe parcursul unui curs: ",
  "întâi interfața cu date mock, apoi streaming de pe server, ",
  "apoi un agent LLM cu memorie și (mai târziu) unelte.\n\n",
  "Ce vezi acum este un stream Server-Sent Events — același tip de canal ",
  "pe care îl va folosi modelul de limbaj. Diferența la pasul următor: ",
  "în locul acestui text fix, bucățile vor veni de la un LLM."
];

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function GET() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for (const chunk of ABOUT_CHUNKS) {
          // JSON.stringify: \n\n e separatorul SSE; un text cu linii noi ar rupe protocolul.
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
          // Pauză intenționată — fără ea, browserul ar primi totul aproape instant și efectul dispare.
          await sleep(1200);
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch {
        controller.error(new Error("Stream about întrerupt"));
      }
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      // Fără no-transform, un proxy poate tampona tot stream-ul și îl livrează dintr-o bucată.
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive"
    }
  });
}
