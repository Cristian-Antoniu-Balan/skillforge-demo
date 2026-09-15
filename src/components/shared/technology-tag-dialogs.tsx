"use client";

// Dialog new/edit pentru numele unui tag de tehnologie — folosit din Settings și din „Grupează”.
import { useEffect, useState } from "react";

import { ActionDialog } from "@/components/shared/action-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TECHNOLOGY_TAG_MAX_LENGTH } from "@/store/useAppStore";

export function validateTechnologyTagName(raw: string): { ok: true; tag: string } | { ok: false; error: string } {
  const tag = raw.trim();
  if (!tag) {
    return { ok: false, error: "Numele este obligatoriu." };
  }
  if (tag.length > TECHNOLOGY_TAG_MAX_LENGTH) {
    return { ok: false, error: `Maxim ${TECHNOLOGY_TAG_MAX_LENGTH} caractere.` };
  }
  // TODO: alte condiții de validare (unicitate, caractere interzise etc.)
  return { ok: true, tag };
}

type TechnologyTagFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "new" | "edit";
  initialTag?: string;
  /** Returnează false ca să țină dialogul deschis (ex. eroare de business). */
  onSave: (tag: string) => boolean | void;
};

export function TechnologyTagFormDialog({
  open,
  onOpenChange,
  mode,
  initialTag = "",
  onSave
}: TechnologyTagFormDialogProps) {
  const [value, setValue] = useState(initialTag);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setValue(initialTag);
      setError(null);
    }
  }, [open, initialTag]);

  const handleOk = () => {
    const result = validateTechnologyTagName(value);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    // TODO: error handling pentru new, edit
    const saved = onSave(result.tag);
    if (saved === false) {
      return;
    }
    onOpenChange(false);
  };

  return (
    <ActionDialog
      actions={[
        { label: "Cancel", onClick: () => onOpenChange(false), variant: "outline" },
        { label: "OK", onClick: handleOk }
      ]}
      error={error}
      onOpenChange={onOpenChange}
      open={open}
      title={mode === "new" ? "Tag nou" : "Editează tag"}
    >
      <div className="space-y-2">
        <Label htmlFor="technology-tag-name">Nume tehnologie</Label>
        <Input
          id="technology-tag-name"
          maxLength={TECHNOLOGY_TAG_MAX_LENGTH}
          onChange={event => {
            setValue(event.target.value);
            setError(null);
          }}
          onKeyDown={event => {
            if (event.key === "Enter") {
              event.preventDefault();
              handleOk();
            }
          }}
          placeholder="ex. TypeScript"
          value={value}
        />
        <p className="text-xs text-muted-foreground">Maxim {TECHNOLOGY_TAG_MAX_LENGTH} caractere.</p>
      </div>
    </ActionDialog>
  );
}

type TechnologyTagDeleteDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tagLabel: string;
  error?: string | null;
  onConfirm: () => void;
};

export function TechnologyTagDeleteDialog({
  open,
  onOpenChange,
  tagLabel,
  error,
  onConfirm
}: TechnologyTagDeleteDialogProps) {
  return (
    <ActionDialog
      actions={[
        { label: "Cancel", onClick: () => onOpenChange(false), variant: "outline" },
        {
          label: "Delete",
          onClick: () => {
            // TODO: error handling pentru delete
            onConfirm();
          },
          variant: "destructive"
        }
      ]}
      description={`Ștergi tehnologia „${tagLabel}"? Această acțiune nu poate fi anulată.`}
      error={error}
      onOpenChange={onOpenChange}
      open={open}
      title="Șterge tag"
    />
  );
}
