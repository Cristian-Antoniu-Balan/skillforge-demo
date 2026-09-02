"use client";

// Formular Appearance — singurul loc unde utilizatorul schimbă tema (fără buton în header).
import { Monitor, Moon, Sun } from "lucide-react";

import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { ThemeMode } from "@/lib/types";
import { useAppStore } from "@/store/useAppStore";

export function AppearanceForm() {
  const theme = useAppStore(state => state.theme);
  const setTheme = useAppStore(state => state.setTheme);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">General</h2>
        <p className="text-sm text-muted-foreground">Preferințe de afișare pentru SkillForge.</p>
      </div>

      <div className="flex items-center justify-between gap-4 border-b pb-6">
        <div className="space-y-1">
          <Label htmlFor="appearance">Appearance</Label>
          <p className="text-sm text-muted-foreground">Alege cum arată interfața.</p>
        </div>
        <ToggleGroup
          className="border"
          id="appearance"
          onValueChange={values => {
            const next = values.find(value => value !== theme);
            if (next) setTheme(next as ThemeMode);
          }}
          value={[theme]}
          variant="outline"
        >
          <ToggleGroupItem aria-label="Sistem" value="system">
            <Monitor className="size-4" />
          </ToggleGroupItem>
          <ToggleGroupItem aria-label="Light" value="light">
            <Sun className="size-4" />
          </ToggleGroupItem>
          <ToggleGroupItem aria-label="Dark" value="dark">
            <Moon className="size-4" />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
    </div>
  );
}
