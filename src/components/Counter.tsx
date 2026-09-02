"use client";

// Directiva "use client" marchează acest modul ca Client Component — rulează în browser.
// Fără ea, useState ar eșua: hook-urile React funcționează doar pe client, iar Next.js
// tratează implicit componentele ca Server Components (randate pe server, fără stare interactivă).
import { useState } from "react";

import { Button } from "@/components/ui/button";

export function Counter() {
  const [count, setCount] = useState(0);

  return (
    <p className="text-sm">
      <span className="text-muted-foreground">Client (Counter): </span>
      {count}
      <Button className="ml-3" onClick={() => setCount(count + 1)} size="sm" variant="secondary">
        +1
      </Button>
    </p>
  );
}
