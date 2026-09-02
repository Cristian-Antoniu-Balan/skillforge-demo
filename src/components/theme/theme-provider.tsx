"use client";

// Aplică tema din store pe <html> — singurul loc unde se schimbă light/dark.
// „Sistem” ascultă matchMedia ca schimbarea din OS să se vadă fără refresh.
import { useEffect } from "react";

import { resolveTheme, useAppStore } from "@/store/useAppStore";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useAppStore(state => state.theme);

  useEffect(() => {
    const apply = () => {
      const resolved = resolveTheme(theme);
      document.documentElement.classList.toggle("dark", resolved === "dark");
    };

    apply();

    if (theme !== "system") return;

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [theme]);

  return <>{children}</>;
}
