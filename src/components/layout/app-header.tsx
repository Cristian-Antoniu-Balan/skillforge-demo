"use client";

// Header minimal — titlu + cost total pe conversație + meniu export.
// Fără bară de acțiuni peste conversație.
import { ChevronDown, Download } from "lucide-react";

import { useChatSession } from "@/components/chat/chat-session-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { SidebarTrigger } from "@/components/ui/sidebar";
import type { ChatUIMessage } from "@/lib/cost";
import { formatUsd, sumConversationCostUsd } from "@/lib/cost";
import { useAppStore } from "@/store/useAppStore";

export function AppHeader() {
  const activeConversationId = useAppStore(state => state.activeConversationId);
  const conversations = useAppStore(state => state.conversations);
  const { messages, exportConversation } = useChatSession();

  const activeConversation = conversations.find(c => c.id === activeConversationId);
  const title = activeConversation?.title ?? "SkillForge";
  const canExport = messages.length > 0;
  // Total din metadatele salvate pe mesaje — aceeași formulă ca pe fiecare răspuns.
  const conversationCost = sumConversationCostUsd(messages as ChatUIMessage[]);

  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1 md:hidden" />
      <DropdownMenu>
        <DropdownMenuTrigger className="flex max-w-[min(100vw-6rem,32rem)] items-center gap-1 rounded-md px-1 py-0.5 text-left hover:bg-muted">
          <h1 className="truncate text-sm font-medium">{title}</h1>
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem disabled={!canExport} onClick={() => exportConversation("md")}>
            <Download className="size-4" />
            Export Markdown
          </DropdownMenuItem>
          <DropdownMenuItem disabled={!canExport} onClick={() => exportConversation("json")}>
            <Download className="size-4" />
            Export JSON
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {conversationCost !== undefined && (
        <span
          className="ml-auto text-[11px] text-muted-foreground/80"
          title="Suma costurilor pe răspunsurile din această conversație"
        >
          total {formatUsd(conversationCost)}
        </span>
      )}
    </header>
  );
}
