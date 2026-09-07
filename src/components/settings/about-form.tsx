"use client";

// Citire SSE de mână — același tip de protocol pe care îl va ascunde useChat la pasul LLM.
// Fără SDK: pe orice laptop rulează imediat, fără chei API.
import { useEffect, useState } from "react";
import { RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";

type StreamStatus = "streaming" | "done" | "error";

export function AboutForm() {
  // Pornim pe "streaming": tab-ul montează efectul imediat — nu există un idle real.
  const [text, setText] = useState("");
  const [status, setStatus] = useState<StreamStatus>("streaming");
  // runId reintră în dependențele efectului ca „Reia" să repornească stream-ul fără setState sync în corp.
  const [runId, setRunId] = useState(0);

  useEffect(() => {
    const abortController = new AbortController();

    async function readAboutStream() {
      try {
        const response = await fetch("/api/about", { signal: abortController.signal });
        if (!response.ok || !response.body) {
          setStatus("error");
          return;
        }

        const reader = response.body.getReader();
        // stream: true — altfel un UTF-8 tăiat între bucăți de rețea (ă, ș, ț) apare stricat.
        const decoder = new TextDecoder();
        // O bucată de rețea ≠ un eveniment SSE: păstrăm restul incomplet până vine următoarea.
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const events = buffer.split("\n\n");
          buffer = events.pop() ?? "";

          for (const event of events) {
            // După abort (Reia / demontare) nu mai scriem state — altfel am lipi text pe run-ul nou.
            if (abortController.signal.aborted) return;

            const line = event
              .split("\n")
              .find(part => part.startsWith("data: "));
            if (!line) continue;

            const payload = line.slice("data: ".length);
            if (payload === "[DONE]") {
              setStatus("done");
              continue;
            }

            // Perechea JSON.stringify (server) / JSON.parse (client) — vezi route.ts.
            const chunk = JSON.parse(payload) as string;
            setText(current => current + chunk);
          }
        }

        if (abortController.signal.aborted) return;
        setStatus(current => (current === "streaming" ? "done" : current));
      } catch {
        // Abandonul la demontare NU e eroare — altfel am marca fail pe închiderea dialogului.
        if (abortController.signal.aborted) return;
        setStatus("error");
      }
    }

    void readAboutStream();

    return () => {
      abortController.abort();
    };
  }, [runId]);

  const handleReplay = () => {
    setText("");
    setStatus("streaming");
    setRunId(id => id + 1);
  };

  return (
    // min-h-0 + flex-1: itemul flex coboară sub înălțimea conținutului; fără el, textul lung împinge bara sub fereastră.
    <section className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 space-y-1 pb-4">
        <h2 className="text-lg font-semibold">Despre aplicație</h2>
        <p className="text-sm text-muted-foreground">
          Textul vine de pe server, bucată cu bucată — preview pentru streaming-ul LLM.
        </p>
      </div>

      {/* overflow pe div, nu ScrollArea: Radix pune display:table și procentele de înălțime se rezolvă circular. */}
      <div className="min-h-0 flex-1 overflow-y-auto rounded-lg border bg-muted/30 p-4">
        {status === "error" ? (
          <p className="text-sm text-destructive">Nu am putut încărca descrierea. Încearcă din nou cu Reia.</p>
        ) : (
          <p className="whitespace-pre-wrap text-sm leading-relaxed">
            {text}
            {status === "streaming" && (
              // Cursor vizual cât curge stream-ul — confirmă că încă primim date.
              <span
                aria-hidden
                className="ml-0.5 inline-block h-4 w-0.5 translate-y-0.5 animate-pulse bg-foreground"
              />
            )}
          </p>
        )}
      </div>

      {/* mt-auto: bara rămâne la baza panoului, indiferent cât de scurt e textul. */}
      <div className="mt-auto flex shrink-0 items-center justify-between gap-3 border-t pt-4">
        <p className="text-xs text-muted-foreground">Sursă: GET /api/about (SSE)</p>
        <Button disabled={status === "streaming"} onClick={handleReplay} size="sm" type="button" variant="outline">
          <RotateCcw data-icon="inline-start" />
          Reia
        </Button>
      </div>
    </section>
  );
}
