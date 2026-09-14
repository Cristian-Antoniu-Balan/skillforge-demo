"use client";

// Temă pe Context propriu — nu pe store: valoarea se schimbă rar și are puțini consumatori.
// Compară cu Zustand (mesaje/listă): acolo selectors evită re-randări; aici orice setTheme
// re-randează consumatorii de Context, ceea ce e acceptabil pentru o preferință de afișare.
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

import { resolveTheme } from "@/lib/resolve-theme";
import type { ThemeMode } from "@/lib/types";

/** Cheie dedicată — separată de `skillforge-app`, ca tema să nu depindă de forma store-ului. */
export const THEME_STORAGE_KEY = "skillforge-theme";

type ThemeContextValue = {
  /** Preferința salvată: system | light | dark */
  preference: ThemeMode;
  /** Tema efectivă pe ecran (după rezolvarea „sistem”). */
  resolvedTheme: "light" | "dark";
  setTheme: (theme: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function isThemeMode(value: unknown): value is ThemeMode {
  return value === "system" || value === "light" || value === "dark";
}

function readStoredPreference(): ThemeMode {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (isThemeMode(stored)) return stored;

    // Temporar: migrare o dată din cheia store-ului vechi (înainte tema stătea în skillforge-app).
    const legacyRaw = localStorage.getItem("skillforge-app");
    if (legacyRaw) {
      const parsed = JSON.parse(legacyRaw) as { state?: { theme?: unknown } };
      const legacyTheme = parsed?.state?.theme;
      if (isThemeMode(legacyTheme)) {
        localStorage.setItem(THEME_STORAGE_KEY, legacyTheme);
        return legacyTheme;
      }
    }
  } catch {
    // Stocare blocată / JSON invalid — pornim pe sistem, nu oprim aplicația.
  }
  return "system";
}

function applyDomTheme(resolved: "light" | "dark") {
  const root = document.documentElement;
  root.classList.toggle("dark", resolved === "dark");
  // color-scheme: scrollbar, input-uri native etc. urmează tema, nu doar clasele Tailwind.
  root.style.colorScheme = resolved;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Lazy initializer: citește localStorage o dată la mount, nu la fiecare render.
  const [preference, setPreference] = useState<ThemeMode>(() => {
    if (typeof window === "undefined") return "system";
    return readStoredPreference();
  });

  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">(() => {
    if (typeof window === "undefined") return "light";
    return resolveTheme(readStoredPreference());
  });

  useEffect(() => {
    const apply = () => {
      const resolved = resolveTheme(preference);
      setResolvedTheme(resolved);
      applyDomTheme(resolved);
    };

    apply();

    // Abonament doar pe „sistem”: light/dark bat OS-ul, deci un change de acolo nu trebuie să schimbe nimic.
    if (preference !== "system") return;

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [preference]);

  function setTheme(theme: ThemeMode) {
    setPreference(theme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // UI se actualizează oricum; persist e best-effort.
    }
  }

  return <ThemeContext.Provider value={{ preference, resolvedTheme, setTheme }}>{children}</ThemeContext.Provider>;
}

/**
 * Consumatorii cer tema aici — niciodată prin props de la părinte.
 * Fără provider, undefined ar produce o eroare greu de urmărit la 3 fișiere distanță.
 */
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme trebuie folosit în interiorul ThemeProvider");
  }
  return context;
}
