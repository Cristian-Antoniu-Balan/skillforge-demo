"use client";

// Formular profil — datele care alimentează system prompt-ul (un singur loc pe server).
// Skills ca textarea „nume: nivel” ca editarea să fie rapidă fără UI complex.
// Emailul contului e readonly separat — nu e câmp Profile, nu merge la model.
import { useEffect, useState } from "react";

import { AccountEmailField } from "@/components/auth/account-email-field";
import { useAuthConfigured } from "@/components/auth/auth-providers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RESPONSE_STYLES, type Profile, type ResponseStyle } from "@/lib/types";
import { skillsToText, textToSkills, useAppStore } from "@/store/useAppStore";

const STYLE_LABELS: Record<ResponseStyle, string> = {
  concis: "Concis",
  echilibrat: "Echilibrat",
  detaliat: "Detaliat"
};

export function ProfileForm() {
  const authConfigured = useAuthConfigured();
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
      skills: textToSkills(skillsText),
      responseStyle: draft.responseStyle ?? "echilibrat"
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Profilul tău</h2>
        <p className="text-sm text-muted-foreground">
          Contextul pe care agentul îl va folosi pentru răspunsuri personalizate.
          {authConfigured ? " Cu baza configurată, preferințele stau pe cont — nu pe acest calculator." : null}
        </p>
      </div>

      <div className="space-y-4">
        {/* Emailul contului: doar dacă auth e configurat; componentă separată pentru useSession. */}
        {authConfigured ? <AccountEmailField /> : null}

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

        <div className="grid gap-2">
          <Label htmlFor="response-style">Stil răspunsuri</Label>
          <select
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            id="response-style"
            onChange={event => setDraft({ ...draft, responseStyle: event.target.value as ResponseStyle })}
            value={draft.responseStyle ?? "echilibrat"}
          >
            {RESPONSE_STYLES.map(style => (
              <option key={style} value={style}>
                {STYLE_LABELS[style]}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">
            Cât de detaliate să fie răspunsurile — intră în system prompt, nu e emailul contului.
          </p>
        </div>

        <Button onClick={handleSave}>Salvează profilul</Button>
      </div>
    </div>
  );
}
