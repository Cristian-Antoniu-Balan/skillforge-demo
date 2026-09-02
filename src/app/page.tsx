// Pagina principală (ruta /) — punct de intrare în aplicație.
// Combină o componentă server (ServerTime) cu una client (Counter) ca diferența
// dintre cele două medii de execuție să fie vizibilă pe ecran.
import Link from "next/link";

import { Counter } from "@/components/Counter";
import { ServerTime } from "@/components/ServerTime";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 p-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">SkillForge</h1>
        <p className="text-muted-foreground">Scheletul proiectului — pregătit pentru agentul AI în pasul următor.</p>
      </header>

      <section className="space-y-4 rounded-lg border p-6">
        <h2 className="text-lg font-medium">Server vs Client</h2>
        <div className="flex flex-col gap-3 text-sm">
          <ServerTime />
          <Counter />
        </div>
      </section>

      <nav>
        {/* Link (nu <a>) — navigarea rămâne client-side, fără reîncărcare completă */}
        <Button nativeButton={false} render={<Link href="/demo" />} variant="outline">
          Mergi la /demo
        </Button>
      </nav>
    </main>
  );
}
