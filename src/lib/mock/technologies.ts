// Tag-uri predefinite — seed la prima încărcare în Zustand.
// TODO: preluare lista de tehnologii din DB (nu hardcodat).
import type { TechnologyTag } from "@/lib/types";

export const DEFAULT_TECHNOLOGIES: TechnologyTag[] = [
  { id: "tech-javascript", tag: "JavaScript" },
  { id: "tech-typescript", tag: "TypeScript" },
  { id: "tech-react", tag: "React" },
  { id: "tech-nextjs", tag: "Next.js" },
  { id: "tech-nodejs", tag: "Node.js" },
  { id: "tech-java", tag: "Java" },
  { id: "tech-spring", tag: "Spring" },
  { id: "tech-python", tag: "Python" },
  { id: "tech-sql", tag: "SQL" },
  { id: "tech-docker", tag: "Docker" },
  { id: "tech-aws", tag: "AWS" },
  { id: "tech-git", tag: "Git" }
];
