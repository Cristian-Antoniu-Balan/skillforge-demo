// Server Component (implicit — fără "use client"): rulează pe server la fiecare request.
// Ora e calculată în momentul randării pe server; nu se re-calculează la click-uri client.
// Dacă am pune useState aici, Next.js ar arunca eroare de hooks pe Server Component.
export function ServerTime() {
  const serverTime = new Date().toLocaleString("ro-RO", {
    timeZone: "Europe/Bucharest",
    dateStyle: "medium",
    timeStyle: "medium"
  });

  return (
    <p className="text-sm">
      <span className="text-muted-foreground">Server (ServerTime): </span>
      {serverTime}
    </p>
  );
}
