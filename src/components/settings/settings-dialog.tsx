"use client";

// Dialog separat pentru preferințe — nu înlocuiește conversația, ca la claude.ai.
// Două panouri: navigație stânga (registru, nu if-uri), conținut dreapta.
import { Settings, Sparkles, UserRound } from "lucide-react";

import { AppearanceForm } from "@/components/settings/appearance-form";
import { ProfileForm } from "@/components/settings/profile-form";
import { ProvidersForm } from "@/components/settings/providers-form";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { SettingsTab } from "@/lib/types";
import { useAppStore } from "@/store/useAppStore";

const NAV_ITEMS: { id: SettingsTab; label: string; icon: typeof Settings }[] = [
  { id: "general", label: "General", icon: Settings },
  { id: "profile", label: "Profilul tău", icon: UserRound },
  { id: "providers", label: "Providere", icon: Sparkles }
];

const TAB_CONTENT: Record<SettingsTab, React.ComponentType> = {
  general: AppearanceForm,
  profile: ProfileForm,
  providers: ProvidersForm
};

export function SettingsDialog() {
  const settingsOpen = useAppStore(state => state.settingsOpen);
  const settingsTab = useAppStore(state => state.settingsTab);
  const setSettingsOpen = useAppStore(state => state.setSettingsOpen);
  const setSettingsTab = useAppStore(state => state.setSettingsTab);

  const ActivePanel = TAB_CONTENT[settingsTab];

  return (
    <Dialog onOpenChange={setSettingsOpen} open={settingsOpen}>
      <DialogContent className="flex h-[min(640px,90vh)] max-w-3xl flex-col gap-0 overflow-hidden p-0 sm:max-w-4xl">
        <DialogTitle className="sr-only">Preferințe SkillForge</DialogTitle>
        <div className="flex min-h-0 flex-1">
          <nav className="w-48 shrink-0 border-r bg-muted/40 p-3">
            <p className="mb-2 px-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">Settings</p>
            <ul className="space-y-1">
              {NAV_ITEMS.map(item => (
                <li key={item.id}>
                  <button
                    className={cn(
                      "flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm transition-colors",
                      settingsTab === item.id
                        ? "bg-background font-medium shadow-sm"
                        : "text-muted-foreground hover:bg-background/60"
                    )}
                    onClick={() => setSettingsTab(item.id)}
                    type="button"
                  >
                    <item.icon className="size-4 shrink-0" />
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
          <div className="min-h-0 flex-1 overflow-y-auto p-6">
            <ActivePanel />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
