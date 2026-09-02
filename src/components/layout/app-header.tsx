"use client";

// Header minimal — titlul conversației active + trigger pentru sidebar pe mobil.
// Fără bară de acțiuni suplimentară: centrul rămâne aerisit, ca la claude.ai.
import { ChevronDown } from "lucide-react";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { useAppStore } from "@/store/useAppStore";

export function AppHeader() {
  const activeConversationId = useAppStore(state => state.activeConversationId);
  const conversations = useAppStore(state => state.conversations);

  const activeConversation = conversations.find(c => c.id === activeConversationId);
  const title = activeConversation?.title ?? "SkillForge";

  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1 md:hidden" />
      <div className="flex items-center gap-1">
        <h1 className="max-w-[min(100vw-6rem,32rem)] truncate text-sm font-medium">{title}</h1>
        {activeConversation && <ChevronDown className="size-4 shrink-0 text-muted-foreground" />}
      </div>
    </header>
  );
}
