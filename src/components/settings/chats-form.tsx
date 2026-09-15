"use client";

// Preferințe → Chats: CRUD pe tag-urile de tehnologie folosite la gruparea istoricului.
import { useState } from "react";

import { TechnologySelect } from "@/components/shared/technology-select";
import { TechnologyTagDeleteDialog, TechnologyTagFormDialog } from "@/components/shared/technology-tag-dialogs";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store/useAppStore";

export function ChatsForm() {
  const technologies = useAppStore(state => state.technologies);
  const addTechnology = useAppStore(state => state.addTechnology);
  const updateTechnology = useAppStore(state => state.updateTechnology);
  const deleteTechnology = useAppStore(state => state.deleteTechnology);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formMode, setFormMode] = useState<"new" | "edit" | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const selected = technologies.find(tech => tech.id === selectedId) ?? null;
  const hasValidSelection = selected !== null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Chats</h2>
        <p className="text-sm text-muted-foreground">
          Tehnologiile folosite pentru gruparea conversațiilor din istoric.
        </p>
      </div>

      <div className="space-y-3 border-b pb-6">
        <TechnologySelect
          id="settings-technology-list"
          label="Lista tehnologii"
          onValueChange={setSelectedId}
          technologies={technologies}
          value={selectedId}
        />
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setFormMode("new")} type="button" variant="outline">
            New
          </Button>
          <Button disabled={!hasValidSelection} onClick={() => setFormMode("edit")} type="button" variant="outline">
            Edit
          </Button>
          <Button
            disabled={!hasValidSelection}
            onClick={() => {
              setDeleteError(null);
              setDeleteOpen(true);
            }}
            type="button"
            variant="destructive"
          >
            Delete
          </Button>
        </div>
      </div>

      <TechnologyTagFormDialog
        initialTag={formMode === "edit" ? (selected?.tag ?? "") : ""}
        mode={formMode === "edit" ? "edit" : "new"}
        onOpenChange={open => {
          if (!open) setFormMode(null);
        }}
        onSave={tag => {
          // TODO: error handling pentru new, edit
          if (formMode === "edit" && selected) {
            updateTechnology(selected.id, tag);
            return;
          }
          const id = addTechnology(tag);
          setSelectedId(id);
        }}
        open={formMode !== null}
      />

      <TechnologyTagDeleteDialog
        error={deleteError}
        onConfirm={() => {
          if (!selected) return;
          // TODO: error handling pentru delete
          const result = deleteTechnology(selected.id);
          if (!result.ok) {
            setDeleteError("Nu poți șterge tehnologia: există chat-uri grupate pe acest tag.");
            return;
          }
          setSelectedId(null);
          setDeleteOpen(false);
          setDeleteError(null);
        }}
        onOpenChange={open => {
          setDeleteOpen(open);
          if (!open) setDeleteError(null);
        }}
        open={deleteOpen}
        tagLabel={selected?.tag ?? ""}
      />
    </div>
  );
}
