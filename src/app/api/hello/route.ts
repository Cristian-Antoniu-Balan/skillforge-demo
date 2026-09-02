// Route Handler — singurul loc din aplicație unde variabilele de mediu server-side sunt accesibile.
// Strămoșul lui /api/chat: aici va fi chemat modelul LLM, iar cheia API va veni din env.
//
// Regula Next.js: variabile FĂRĂ prefix NEXT_PUBLIC_ rămân pe server.
// (Spre deosebire de Vite, unde VITE_* ajunge în bundle-ul client — de aceea cheia LLM stă aici.)
import { NextResponse } from "next/server";

export async function GET() {
  const greeting = process.env.SKILLFORGE_GREETING ?? "lipsă SKILLFORGE_GREETING";

  return NextResponse.json({
    message: `Salut de la ${greeting}!`,
    hint: "Variabila a fost citită pe server — nu ajunge în browser."
  });
}
