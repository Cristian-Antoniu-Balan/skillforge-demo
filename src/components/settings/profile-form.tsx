"use client";

// Formular profil — datele care vor alimenta system prompt-ul agentului la pasul următor.
// Skills ca textarea „nume: nivel” ca editarea să fie rapidă fără UI complex.
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Profile } from "@/lib/types";
import { skillsToText, textToSkills, useAppStore } from "@/store/useAppStore";

export function ProfileForm() {
  const profile = useAppStore(state => state.profile);
  const setProfile = useAppStore(state => state.setProfile);

  const [draft, setDraft] = useState<Profile>(profile);
  const [skillsText, setSkillsText] = useState(skillsToText(profile.skills));

  useEffect(() => {
    setDraft(profile);
    setSkillsText(skillsToText(profile.skills));
  }, [profile]);

  const handleSave = () => {
    setProfile({
      ...draft,
      skills: textToSkills(skillsText)
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Profilul tău</h2>
        <p className="text-sm text-muted-foreground">
          Contextul pe care agentul îl va folosi pentru răspunsuri personalizate.
        </p>
      </div>

      <div className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="name">Nume</Label>
          <Input id="name" onChange={event => setDraft({ ...draft, name: event.target.value })} value={draft.name} />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="stack">Stack actual</Label>
          <Input
            id="stack"
            onChange={event => setDraft({ ...draft, stack: event.target.value })}
            placeholder="ex. Java, Spring, PostgreSQL"
            value={draft.stack}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="skills">Skills</Label>
          <Textarea
            className="min-h-32 font-mono text-sm"
            id="skills"
            onChange={event => setSkillsText(event.target.value)}
            placeholder={"Java: avansat\nSpring Boot: intermediar\nTypeScript: începător"}
            value={skillsText}
          />
          <p className="text-xs text-muted-foreground">
            O pereche pe linie: <code>nume: nivel</code> — niveluri: începător, intermediar, avansat
          </p>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="objective">Obiectiv</Label>
          <Input
            id="objective"
            onChange={event => setDraft({ ...draft, objective: event.target.value })}
            placeholder="ex. AI Engineer"
            value={draft.objective}
          />
        </div>

        <Button onClick={handleSave}>Salvează profilul</Button>
      </div>
    </div>
  );
}
