"use client";

// Context peste aceeași listă useChat — sidebar/header acționează pe mesaje, fără listă paralelă în store.
import { createContext, useContext } from "react";
import type { UIMessage } from "ai";

export type ExportFormat = "json" | "md";

export interface ChatSessionValue {
  messages: UIMessage[];
  isBusy: boolean;
  /** Confirmă, golește lista (setMessages), apoi creează conversație nouă. */
  startNewChat: () => void;
  regenerateMessage: (messageId: string) => void;
  exportConversation: (format: ExportFormat) => void;
}

const ChatSessionContext = createContext<ChatSessionValue | null>(null);

export function ChatSessionProvider({ value, children }: { value: ChatSessionValue; children: React.ReactNode }) {
  return <ChatSessionContext.Provider value={value}>{children}</ChatSessionContext.Provider>;
}

export function useChatSession(): ChatSessionValue {
  const value = useContext(ChatSessionContext);
  if (!value) {
    throw new Error("useChatSession trebuie folosit în ChatSessionProvider");
  }
  return value;
}
