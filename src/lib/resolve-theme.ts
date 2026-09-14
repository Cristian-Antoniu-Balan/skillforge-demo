// Singura regulă de decizie a temei: preferință + (dacă e cazul) OS.
// Pură și fără React — ca să poată fi folosită și din scriptul de pre-paint, și din Context.
import type { ThemeMode } from "@/lib/types";

export function resolveTheme(mode: ThemeMode): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  if (mode === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return mode;
}
