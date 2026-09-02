// Combină clsx cu tailwind-merge ca să rezolve conflicte între clase Tailwind.
// shadcn/ui folosește cn() peste tot — de aici încolo nu compunem clase manual.
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
