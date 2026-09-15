"use client";

// Modal „Grupează” — cuplează / decuplează o conversație de un tag de tehnologie.
import { useEffect, useState } from "react";

import { ActionDialog } from "@/components/shared/action-dialog";
import { TechnologySelect } from "@/components/shared/technology-select";
import { TechnologyTagFormDialog } from "@/components/shared/technology-tag-dialogs";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store/useAppStore";

type GroupConversationDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversationId: string | null;
};

export function GroupConversationDialog({ open, onOpenChange, conversationId }: GroupConversationDialogProps) {
  const technologies = useAppStore(state => state.technologies);
  const conversations = useAppStore(state => state.conversations);
  const addTechnology = useAppStore(state => state.addTechnology);
  const setConversationTechnology = useAppStore(state => state.setConversationTechnology);

  const conversation = conversations.find(c => c.id === conversationId) ?? null;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newTagOpen, setNewTagOpen] = useState(false);

  useEffect(() => {
    if (open) {
      setSelectedId(conversation?.technologyId ?? null);
      setNewTagOpen(false);
    }
  }, [open, conversation?.technologyId]);

  const hasValidSelection = selectedId !== null && technologies.some(t => t.id === selectedId);

  const close = () => onOpenChange(false);

  return (
    <>
      <ActionDialog
        actions={[
          { label: "Cancel", onClick: close, variant: "outline" },
          {
            label: "Remove",
            disabled: !hasValidSelection,
            variant: "secondary",
            onClick: () => {
              if (!conversationId) return;
              // TODO: error handling la remove
              setConversationTechnology(conversationId, null);
              close();
            }
          },
          {
            label: "OK",
            disabled: !hasValidSelection,
            onClick: () => {
              if (!conversationId || !selectedId) return;
              // TODO: error handling la ok
              setConversationTechnology(conversationId, selectedId);
              close();
            }
          }
        ]}
        onOpenChange={onOpenChange}
        open={open}
        title="Grupează conversația"
      >
        <TechnologySelect
          id="group-conversation-technology"
          label="Selectează tehnologia"
          onValueChange={setSelectedId}
          searchable
          technologies={technologies}
          value={selectedId}
        />
        <Button onClick={() => setNewTagOpen(true)} type="button" variant="outline">
          Add new
        </Button>
      </ActionDialog>

      <TechnologyTagFormDialog
        mode="new"
        onOpenChange={setNewTagOpen}
        onSave={tag => {
          // TODO: error handling pentru new
          const id = addTechnology(tag);
          setSelectedId(id);
        }}
        open={newTagOpen}
      />
    </>
  );
}
