"use client";

// Context peste aceeași listă useChat — sidebar/header acționează pe mesaje, fără listă paralelă în hook.
//
// Comparație Context vs store (Zustand), verificată pe acest proiect:
// - ChatSessionContext: valori rare relativ (mesajele sesiunii curente + acțiuni), puțini consumatori
//   (sidebar, header, chat). Potrivit pentru Context — providerul apare în arbore, ușor de urmărit.
// - useAppStore: profil, temă, lista de conversații — citite din multe locuri și (lista) se schimbă
//   după fiecare răspuns. Store cu selectors: un consumator se re-randează doar pe câmpul ales.
// Concluzie: valori rare cu puțini consumatori → context; stare care se schimbă des și e citită
// din multe locuri → store. (Context fără selectors re-randează pe orice schimbare a value.)
import { createContext, useContext } from "react";
import type { UIMessage } from "ai";

export type ExportFormat = "json" | "md";

export interface ChatSessionValue {
  messages: UIMessage[];
  isBusy: boolean;
  /** Confirmă, apoi creează conversație nouă (arhiva celei vechi rămâne în store). */
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
