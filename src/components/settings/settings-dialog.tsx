"use client";

// Dialog separat pentru preferințe — nu înlocuiește conversația, ca la claude.ai.
// Registru SECTIONS: o intrare = un tab; fără if-uri pe id la randare.
import { Info, Settings, Sparkles, UserRound } from "lucide-react";

import { AboutForm } from "@/components/settings/about-form";
import { AppearanceForm } from "@/components/settings/appearance-form";
import { ProfileForm } from "@/components/settings/profile-form";
import { ProvidersForm } from "@/components/settings/providers-form";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { SettingsTab } from "@/lib/types";
import { useAppStore } from "@/store/useAppStore";

const SECTIONS: {
  id: SettingsTab;
  label: string;
  icon: typeof Settings;
  Component: React.ComponentType;
}[] = [
  { id: "general", label: "General", icon: Settings, Component: AppearanceForm },
  { id: "profile", label: "Profilul tău", icon: UserRound, Component: ProfileForm },
  { id: "providers", label: "Providere", icon: Sparkles, Component: ProvidersForm },
  { id: "about", label: "Despre aplicație", icon: Info, Component: AboutForm }
];

export function SettingsDialog() {
  const settingsOpen = useAppStore(state => state.settingsOpen);
  const settingsTab = useAppStore(state => state.settingsTab);
  const setSettingsOpen = useAppStore(state => state.setSettingsOpen);
  const setSettingsTab = useAppStore(state => state.setSettingsTab);

  const activeSection = SECTIONS.find(section => section.id === settingsTab) ?? SECTIONS[0];
  const ActivePanel = activeSection.Component;

  return (
    <Dialog onOpenChange={setSettingsOpen} open={settingsOpen}>
      <DialogContent className="flex h-[min(640px,90vh)] max-w-3xl flex-col gap-0 overflow-hidden p-0 sm:max-w-4xl">
        <DialogTitle className="sr-only">Preferințe SkillForge</DialogTitle>
        <div className="flex min-h-0 flex-1">
          <nav className="w-48 shrink-0 border-r bg-muted/40 p-3">
            <p className="mb-2 px-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">Settings</p>
            <ul className="space-y-1">
              {SECTIONS.map(item => (
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
          {/* h-full (nu min-h-full): înălțime definită ca flex-1 din About să aibă de ce să se agațe. */}
          <div className="flex h-full min-h-0 flex-1 flex-col overflow-y-auto p-6">
            <ActivePanel />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
