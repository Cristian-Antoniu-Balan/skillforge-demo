// Tipuri partajate — un singur loc ca mock-ul, store-ul și UI-ul să vorbească aceeași limbă.
// La integrarea LLM, înlocuim doar sursa datelor, nu structura.
import type { UIMessage } from "ai";

export type SkillLevel = "începător" | "intermediar" | "avansat";

export const SKILL_LEVELS: SkillLevel[] = ["începător", "intermediar", "avansat"];

export interface Skill {
  name: string;
  level: SkillLevel;
}

export interface Profile {
  name: string;
  stack: string;
  skills: Skill[];
  objective: string;
}

/** Format vechi (Faza 1.2) — păstrat pentru migrate din localStorage. */
export type MessageRole = "user" | "assistant";

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: string;
}

export interface TechnologyTag {
  id: string;
  tag: string;
}

export interface Conversation {
  id: string;
  title: string;
  /** Arhivă: același format ca useChat, ca re-inițializarea să nu convertească la fiecare deschidere. */
  messages: UIMessage[];
  /** Id tehnologie sub care e grupat chat-ul; null/undefined = negrupat. */
  technologyId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type ThemeMode = "system" | "light" | "dark";

export type SettingsTab = "general" | "profile" | "providers" | "chats" | "about";

/** Rezultat delete tag — UI decide mesajul; store-ul nu șterge dacă există chat-uri legate. */
export type DeleteTechnologyResult = { ok: true } | { ok: false; reason: "in_use" };

export interface AppStore {
  profile: Profile;
  selectedProviderId: string;
  selectedModel: string;
  /** Lista de tehnologii pentru gruparea chat-urilor. */
  technologies: TechnologyTag[];
  conversations: Conversation[];
  activeConversationId: string | null;
  isLoading: boolean;
  isTyping: boolean;
  error: string | null;
  settingsOpen: boolean;
  settingsTab: SettingsTab;
  /** Query settled (debounce) pentru Search for — nu e persistat. */
  conversationSearchQuery: string;

  setProfile: (profile: Profile) => void;
  setSettingsOpen: (open: boolean) => void;
  setSettingsTab: (tab: SettingsTab) => void;
  setConversationSearchQuery: (query: string) => void;
  setSelectedProvider: (providerId: string, model: string) => void;
  setActiveConversation: (id: string | null) => void;
  createConversation: () => string;
  renameConversation: (id: string, title: string) => void;
  deleteConversation: (id: string) => void;
  /** Scrie în arhivă mesajele complete — apelat la final de stream, nu per token. */
  setConversationMessages: (id: string, messages: UIMessage[]) => void;
  setConversationTechnology: (conversationId: string, technologyId: string | null) => void;
  addTechnology: (tag: string) => string;
  updateTechnology: (id: string, tag: string) => void;
  deleteTechnology: (id: string) => DeleteTechnologyResult;
  sendMessage: (content: string) => void;
  stopGeneration: () => void;
  clearError: () => void;
  simulateLoading: () => void;
}
