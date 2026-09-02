// Rută separată (/demo) — stabilește structura de rutare înainte de UI-ul aplicației.
// Demonstrează că App Router mapează foldere din src/app/ la URL-uri.
import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function DemoPage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-8">
      <h1 className="text-2xl font-semibold">Pagina /demo</h1>
      <p className="text-muted-foreground">
        Rută adițională față de pagina principală — aici vor veni ecranele aplicației SkillForge.
      </p>
      <Button nativeButton={false} render={<Link href="/" />} variant="outline">
        Înapoi acasă
      </Button>
    </main>
  );
}
