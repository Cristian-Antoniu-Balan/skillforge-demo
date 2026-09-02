// Profil inventat — singura sursă până la integrarea datelor reale.
// Store-ul îl copiază la inițializare; editările utilizatorului persistă în localStorage.
import type { Profile } from "@/lib/types";

export const mockProfile: Profile = {
  name: "Alex",
  stack: "Java Spring Boot, PostgreSQL, Docker",
  skills: [
    { name: "Java", level: "avansat" },
    { name: "Spring Boot", level: "intermediar" },
    { name: "SQL", level: "intermediar" },
    { name: "TypeScript", level: "începător" },
    { name: "React", level: "începător" }
  ],
  objective: "AI Engineer — LLM integration, RAG, vector databases"
};
