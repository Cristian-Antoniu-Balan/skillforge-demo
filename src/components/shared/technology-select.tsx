"use client";

// Select tehnologie — listă sortată alfabetic; opțional filtrare după text (modal Grupează).
import { useState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { TechnologyTag } from "@/lib/types";
import { sortTechnologies } from "@/store/useAppStore";

type TechnologySelectProps = {
  id?: string;
  label: string;
  technologies: TechnologyTag[];
  value: string | null;
  onValueChange: (id: string | null) => void;
  searchable?: boolean;
  placeholder?: string;
};

export function TechnologySelect({
  id,
  label,
  technologies,
  value,
  onValueChange,
  searchable = false,
  placeholder = "Selectează tehnologia"
}: TechnologySelectProps) {
  const [query, setQuery] = useState("");

  const sorted = sortTechnologies(technologies);
  const needle = query.trim().toLowerCase();
  const options = searchable && needle ? sorted.filter(tech => tech.tag.toLowerCase().includes(needle)) : sorted;

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {searchable ? (
        <Input onChange={event => setQuery(event.target.value)} placeholder="Caută tehnologie…" value={query} />
      ) : null}
      <Select
        onValueChange={next => onValueChange(typeof next === "string" && next.length > 0 ? next : null)}
        value={value ?? null}
      >
        <SelectTrigger className="w-full" id={id}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.length === 0 ? (
            <div className="px-2 py-1.5 text-sm text-muted-foreground">Nicio tehnologie</div>
          ) : (
            options.map(tech => (
              <SelectItem key={tech.id} value={tech.id}>
                {tech.tag}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  );
}
