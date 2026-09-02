"use client";

// Stare goală — conversație nouă fără mesaje; salut personalizat + sugestii care pre-completează inputul.
import { Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store/useAppStore";

const SUGGESTIONS = ["Plan de învățare", "Gap analysis", "Pregătire interviu", "Alege tu"];

const SUGGESTION_PROMPTS: Record<string, string> = {
  "Plan de învățare": "Fă-mi un plan de 3 luni spre obiectivul meu de carieră.",
  "Gap analysis": "Ce-mi lipsește ca să ajung la obiectivul meu, pe baza profilului meu?",
  "Pregătire interviu": "Pregătește-mă pentru un interviu tehnic pe stack-ul meu.",
  "Alege tu": "Propune tu următorul pas concret, ținând cont de profilul meu."
};

interface EmptyStateProps {
  onSuggestion: (text: string) => void;
}

export function EmptyState({ onSuggestion }: EmptyStateProps) {
  const profile = useAppStore(state => state.profile);

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 pb-8">
      <div className="flex w-full max-w-2xl flex-col items-center gap-6 text-center">
        <p className="text-sm font-medium tracking-wide text-muted-foreground uppercase">SkillForge</p>
        <div className="space-y-2">
          <h2 className="text-3xl font-semibold tracking-tight">Bun venit, {profile.name}</h2>
          <p className="max-w-md text-base text-muted-foreground">
            Copilotul tău de skills și carieră — știe stack-ul, obiectivul și progresul tău.
          </p>
          <p className="text-sm text-muted-foreground">De unde vrei să începi?</p>
        </div>
        <Sparkles className="size-8 text-primary opacity-80" />
        <div className="flex flex-wrap justify-center gap-2">
          {SUGGESTIONS.map(label => (
            <Button key={label} onClick={() => onSuggestion(SUGGESTION_PROMPTS[label])} size="sm" variant="outline">
              {label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
